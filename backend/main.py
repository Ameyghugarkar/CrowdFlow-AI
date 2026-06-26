import asyncio
import base64
import time
import threading
from collections import deque
from typing import List

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
from ultralytics import YOLO

app = FastAPI(title="CrowdFlow AI — Real-Time Dual-Model Engine")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

model_yolo = YOLO('yolov8n.pt')

# ── Generic Zones ────────────────────────────────────────────────────────────────
ZONES = ["Top Sector", "Bottom Sector", "Left Sector", "Right Sector", "Center Sector"]

# ── Zone areas calibrated to VISIBLE camera frame ─────────────────────────────
ZONE_AREA_M2 = {
    "Top Sector":        3.5,
    "Bottom Sector":     3.5,
    "Left Sector":       5.0,
    "Right Sector":      5.0,
    "Center Sector":     7.0,
}
STAMPEDE_DENSITY = 4.0

# ── 3-Level Alert Thresholds with Persistence ─────────────────────────────────
THRESH_WARNING   = 38.0
THRESH_HIGH_RISK = 62.0
PERSIST_WARNING  = 2
PERSIST_HIGH     = 3
CLEAR_FRAMES     = 12

# ── Gaussian Density Map ──────────────────────────────────────────────────────
GAUSS_SIGMA = 18

def build_density_map(centroids, h, w):
    dmap = np.zeros((h, w), dtype=np.float32)
    if not centroids: return dmap
    ks = GAUSS_SIGMA * 6 + 1
    k1 = cv2.getGaussianKernel(ks, GAUSS_SIGMA)
    k2d = k1 @ k1.T
    for cx, cy in centroids:
        x, y = int(cx), int(cy)
        x0, x1 = x - ks//2, x + ks//2 + 1
        y0, y1 = y - ks//2, y + ks//2 + 1
        kx0, kx1 = max(0, -x0), ks - max(0, x1-w)
        ky0, ky1 = max(0, -y0), ks - max(0, y1-h)
        fx0, fx1 = max(0, x0), min(w, x1)
        fy0, fy1 = max(0, y0), min(h, y1)
        if fx1 > fx0 and fy1 > fy0:
            dmap[fy0:fy1, fx0:fx1] += k2d[ky0:ky1, kx0:kx1]
    return dmap

# ── Optical Flow Pressure ─────────────────────────────────────────────────────
def compute_pressure(prev_gray, curr_gray, rois, h, w):
    if prev_gray is None: return {z: 0.0 for z in ZONES}
    scale = 320 / w
    small_prev = cv2.resize(prev_gray, (320, int(h*scale)))
    small_curr = cv2.resize(curr_gray, (320, int(h*scale)))
    flow = cv2.calcOpticalFlowFarneback(
        small_prev, small_curr, None,
        pyr_scale=0.5, levels=3, winsize=15,
        iterations=3, poly_n=5, poly_sigma=1.2, flags=0)
    mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
    result = {}
    sh, sw = mag.shape[:2]
    for name, (x1n, y1n, x2n, y2n) in rois.items():
        r = mag[int(y1n*sh):int(y2n*sh), int(x1n*sw):int(x2n*sw)]
        result[name] = float(r.mean()) if r.size else 0.0
    return result

# ── Temporal Smoother + Persistence Counter ───────────────────────────────────
class ZoneState:
    def __init__(self):
        self.smoothed = 0.0
        self.level    = "NORMAL"
        self._wf = 0; self._hf = 0; self._cf = 0

    def update(self, raw: float, alpha=0.12) -> str:
        self.smoothed = alpha * raw + (1 - alpha) * self.smoothed
        s = self.smoothed
        if s >= THRESH_HIGH_RISK:
            self._hf += 1; self._wf += 1; self._cf = 0
        elif s >= THRESH_WARNING:
            self._hf = max(0, self._hf - 1); self._wf += 1; self._cf = 0
        else:
            self._cf += 1
            if self._cf >= CLEAR_FRAMES: self._hf = 0; self._wf = 0
            
        if   self._hf >= PERSIST_HIGH:    self.level = "HIGH RISK"
        elif self._wf >= PERSIST_WARNING and self.level != "HIGH RISK": self.level = "WARNING"
        elif self._cf >= CLEAR_FRAMES:
            if s < THRESH_WARNING:
                self.level = "NORMAL"
        return self.level

# ── Video Engine (Decoupled Threading) ─────────────────────────────────────────
class VideoEngine:
    VIDEO = "overhead_crowd.mp4"

    def _update_rois(self):
        # Full-screen grid overlay as requested
        self.rois = {
            "Top Sector":       (0.25, 0.00, 0.75, 0.25),
            "Bottom Sector":    (0.25, 0.75, 0.75, 1.00),
            "Left Sector":      (0.00, 0.00, 0.25, 1.00),
            "Right Sector":     (0.75, 0.00, 1.00, 1.00),
            "Center Sector":    (0.25, 0.25, 0.75, 0.75),
        }

    def __init__(self):
        self.cap = cv2.VideoCapture(self.VIDEO)
        self._update_rois()
        
        self.lock = threading.Lock()
        self.latest_frame = None
        self.running = True
        
        # AI state
        self.history      = {z: deque(maxlen=90) for z in ZONES}
        self.zone_state   = {z: ZoneState() for z in ZONES}
        self.ema_pressure = {z: 0.0 for z in ZONES}
        self.prev_gray    = None
        
        self.ai_data = {
            "zones": {}, "alerts": [], "total_count": 0, "yolo_count": 0, "density_map_count": 0,
            "boxes": [], "evacuation_routes": []
        }
        self.time_step = 0
        self.camera_scale = 10.0 if "overhead" in self.VIDEO.lower() else 1.0
        self.yolo_conf = 0.04 if "pexels" in self.VIDEO.lower() else 0.25
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=16, detectShadows=False)
        
        threading.Thread(target=self._capture_loop, daemon=True).start()
        threading.Thread(target=self._ai_loop, daemon=True).start()

    def switch_video(self, filename: str):
        with self.lock:
            self.VIDEO = filename
            if self.cap: self.cap.release()
            self.cap = cv2.VideoCapture(self.VIDEO)
            self._update_rois()
            # Full wipe of AI physics tracking memory
            self.zone_state = {z: ZoneState() for z in ZONES}
            for z in ZONES: self.history[z].clear()
            self.ema_pressure = {z: 0.0 for z in ZONES}
            self.prev_gray = None
            self.cached_results = None
            self.cached_boxes = []
            self.cached_yolo_counts = {z: 0 for z in ZONES}
            self.cached_centroids = []
            self.time_step = 0
            self.camera_scale = 10.0 if "overhead" in self.VIDEO.lower() else 1.0
            self.yolo_conf = 0.04 if "pexels" in self.VIDEO.lower() else 0.25
            self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=16, detectShadows=False)

    def replay(self):
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        with self.lock:
            self.zone_state = {z: ZoneState() for z in ZONES}
            for z in ZONES: self.history[z].clear()
            self.ema_pressure = {z: 0.0 for z in ZONES}
            self.prev_gray = None

    def _capture_loop(self):
        """Reads frames at video speed (30fps) so playback is perfectly smooth"""
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        delay = 1.0 / fps if fps > 0 else 0.033
        while self.running:
            if not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.VIDEO)
            ret, frame = self.cap.read()
            if not ret:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
                
            with self.lock:
                self.latest_frame = frame
                
            time.sleep(delay)

    def _get_zone(self, xn, yn):
        for name, (x1, y1, x2, y2) in self.rois.items():
            if x1 <= xn <= x2 and y1 <= yn <= y2: return name
        return "Unknown"

    def _fruin(self, density):
        if density >= 4.0:   return "F — STAMPEDE IMMINENT"
        elif density >= 3.0: return "E — Very High Density"
        elif density >= 2.0: return "D — Restricted Flow"
        elif density >= 1.0: return "C — Moderate"
        else:                return "A/B — Free Flow"

    def _ai_loop(self):
        """Runs heavy AI in the background. It takes as long as it needs and updates state."""
        while self.running:
            with self.lock:
                frame = self.latest_frame
                
            if frame is None:
                time.sleep(0.1)
                continue
                
            fh, fw = frame.shape[:2]
            
            # YOLO processing directly on the raw frame for maximum accuracy
            # YOLO processing directly on the raw frame for maximum accuracy
            # We use a massive 1088 inference size universally to capture people in the back of the crowd
            results = model_yolo.track(frame, persist=True, classes=[0], verbose=False, conf=self.yolo_conf, iou=0.3, imgsz=1088)
            sfh, sfw = fh, fw
            boxes_data  = []
            yolo_counts = {z: 0 for z in ZONES}
            centroids   = []

            if results and results[0].boxes:
                boxes_list = results[0].boxes.xyxy.cpu().numpy()
                ids_list   = results[0].boxes.id.cpu().numpy() if results[0].boxes.id is not None else [0]*len(boxes_list)
                
                for box, tid in zip(boxes_list, ids_list):
                    x1, y1, x2, y2 = box
                    cx, cy = (x1+x2)/2, (y1+y2)/2
                    centroids.append((cx, cy))
                    zone = self._get_zone(cx/sfw, cy/sfh)
                    if zone == "Unknown": continue
                    yolo_counts[zone] += 1
                    boxes_data.append({
                        "id": int(tid),
                        "x": float(x1/sfw*100), "y": float(y1/sfh*100),
                        "w": float((x2-x1)/sfw*100), "h": float((y2-y1)/sfh*100),
                        "zone": zone,
                    })

            # Aerial Drone Supplement (MOG2) for tiny pixels
            if "pexels" in self.VIDEO.lower():
                mog_scale = 480 / max(fh, fw)
                mog_frame = cv2.resize(frame, (int(fw * mog_scale), int(fh * mog_scale)))
                
                # Mask out the sky and massive building on the left so MOG2 doesn't detect camera shake as "movement"
                # The pixels are painted solid black, rendering them invisible to the background subtractor.
                cv2.rectangle(mog_frame, (0, 0), (int(mog_frame.shape[1]), int(mog_frame.shape[0] * 0.35)), (0, 0, 0), -1) # Top sky
                cv2.rectangle(mog_frame, (0, 0), (int(mog_frame.shape[1] * 0.32), int(mog_frame.shape[0])), (0, 0, 0), -1) # Left building

                fg_mask = self.bg_subtractor.apply(mog_frame)
                
                # Apply morphological operations to fuse fragmented body parts (arms, legs) into single solid blobs
                # This prevents MOG2 from counting one person as 3-4 separate people.
                _, fg_mask = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
                fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
                fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)

                contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for cnt in contours:
                    if cv2.contourArea(cnt) > 12: # Increased threshold to ignore dust/leaves
                        x, y, w, h = cv2.boundingRect(cnt)
                        x1, y1 = x / mog_scale, y / mog_scale
                        x2, y2 = (x + w) / mog_scale, (y + h) / mog_scale
                        cx, cy = (x1+x2)/2, (y1+y2)/2
                        
                        # Ignore if already found by YOLO
                        is_new = True
                        for ycx, ycy in centroids:
                            if abs(ycx - cx) < 20 and abs(ycy - cy) < 20:
                                is_new = False
                                break
                        
                        if is_new:
                            centroids.append((cx, cy))
                            zone = self._get_zone(cx/fw, cy/fh)
                            if zone == "Unknown": continue
                            yolo_counts[zone] += 1
                            boxes_data.append({
                                "id": int(cx+cy*10),
                                "x": float(x1/fw*100), "y": float(y1/fh*100),
                                "w": float((x2-x1)/fw*100), "h": float((y2-y1)/fh*100),
                                "zone": zone,
                            })

            # Density Map
            dmap  = build_density_map(centroids, sfh, sfw)
            dmap_zone = {}
            for name, (x1n,y1n,x2n,y2n) in self.rois.items():
                px1,py1 = int(x1n*sfw), int(y1n*sfh)
                px2,py2 = int(x2n*sfw), int(y2n*sfh)
                dmap_zone[name] = float(dmap[py1:py2, px1:px2].sum())

            zone_counts = {z: max(yolo_counts[z], int(round(dmap_zone.get(z,0)))) for z in ZONES}

            # Optical Flow
            flow_scale = 480 / max(fh, fw)
            flow_frame = cv2.resize(frame, (int(fw * flow_scale), int(fh * flow_scale)))
            curr_gray = cv2.cvtColor(flow_frame, cv2.COLOR_BGR2GRAY)
            pressure  = compute_pressure(self.prev_gray, curr_gray, self.rois, flow_frame.shape[0], flow_frame.shape[1])
            self.prev_gray = curr_gray
            
            for z in ZONES:
                self.ema_pressure[z] = 0.35*pressure[z] + 0.65*self.ema_pressure[z]

            # Risk calculation
            flow_data, alerts = {}, []
            with self.lock:
                for z in ZONES:
                    self.history[z].append(zone_counts[z])
                    area    = ZONE_AREA_M2[z] * self.camera_scale
                    density = zone_counts[z] / area
                    d_score = min(100.0, density/STAMPEDE_DENSITY*100)
                    
                    hist = list(self.history[z])
                    div  = density - hist[-30]/area if len(hist) >= 30 else 0.0

                    p_score  = min(20.0, self.ema_pressure[z]*20)
                    raw_risk = min(100.0, d_score + max(0,div*12) + p_score)

                    level    = self.zone_state[z].update(raw_risk)
                    smoothed = self.zone_state[z].smoothed

                    flow_data[z] = {
                        "count": zone_counts[z], "density": round(density, 2), "density_score": round(d_score,1),
                        "divergence": round(div, 3), "pressure": round(self.ema_pressure[z], 3),
                        "pressure_score": round(p_score,1), "risk_score": round(smoothed,1),
                        "raw_risk": round(raw_risk,1), "los": self._fruin(density), "status": level,
                    }

                    if level == "HIGH RISK":
                        alerts.append({"zone":z,"type":"STAMPEDE RISK" if density>=4 else "HIGH DENSITY — HIGH RISK",
                                        "risk":round(smoothed,1),"density":round(density,2),
                                        "los":self._fruin(density),"pressure":round(self.ema_pressure[z],3),"level":"HIGH RISK"})
                    elif level == "WARNING":
                        alerts.append({"zone":z,"type":"HIGH DENSITY WARNING",
                                        "risk":round(smoothed,1),"density":round(density,2),
                                        "los":self._fruin(density),"pressure":round(self.ema_pressure[z],3),"level":"WARNING"})

                self.ai_data = {
                    "zones": flow_data, "alerts": alerts, "total_count": sum(zone_counts.values()),
                    "yolo_count": sum(yolo_counts.values()), "density_map_count": int(round(dmap.sum())),
                    "boxes": boxes_data, "rois": self.rois
                }
            
            # Yield CPU for thread switching
            time.sleep(0.01)

    def _encode(self, frame, flow_data):
        # Resize visual frame to fixed horizontal layout
        out = cv2.resize(frame, (854, 480))
        oh, ow = out.shape[:2]
        
        for zone, (x1n, y1n, x2n, y2n) in self.rois.items():
            if zone not in flow_data: continue
            risk = flow_data[zone]["risk_score"]
            if risk < 4: continue
            px1, py1 = int(x1n*ow), int(y1n*oh)
            px2, py2 = int(x2n*ow), int(y2n*oh)
            lvl = flow_data[zone]["status"]
            color = (0,0,255) if lvl=="HIGH RISK" else (0,140,255) if lvl=="WARNING" else (0,200,80)
            ov = out.copy()
            cv2.rectangle(ov, (px1,py1), (px2,py2), color, -1)
            cv2.addWeighted(ov, 0.10 + min(risk/100,0.9)*0.32, out, 1-(0.10+min(risk/100,0.9)*0.32), 0, out)
            if lvl == "HIGH RISK": cv2.rectangle(out,(px1,py1),(px2,py2),(0,0,255),3)
            elif lvl == "WARNING": cv2.rectangle(out,(px1,py1),(px2,py2),(0,140,255),2)
        
        ok, buf = cv2.imencode('.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return "data:image/jpeg;base64," + base64.b64encode(buf).decode() if ok else None

    def get_state(self):
        with self.lock:
            frame = self.latest_frame
            ai_data = dict(self.ai_data) # shallow copy
            
        if frame is None:
            placeholder = np.zeros((720, 405, 3), dtype=np.uint8)
            cv2.putText(placeholder, "WAITING FOR VIDEO", (30, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
            cv2.putText(placeholder, "Download pexels_market.mp4", (20, 340), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 1)
            ok, buf = cv2.imencode('.jpg', placeholder)
            return {
                "timestamp": time.time(), **ai_data,
                "frame": "data:image/jpeg;base64," + base64.b64encode(buf).decode() if ok else None
            }
            
        frame_str = self._encode(frame, ai_data.get("zones", {}))
        return { "timestamp": time.time(), **ai_data, "frame": frame_str }

engine = VideoEngine()

from pydantic import BaseModel
class VideoSwitchRequest(BaseModel):
    filename: str

@app.get("/")
def root(): return {"status": "CrowdFlow AI — Async AI Video Pipeline"}

@app.post("/api/replay")
def api_replay(): engine.replay(); return {"status":"ok"}

@app.post("/api/switch_camera")
def api_switch_camera(req: VideoSwitchRequest):
    engine.switch_video(req.filename)
    return {"status": "ok"}

class ConnManager:
    def __init__(self): self.active: List[WebSocket] = []
    async def connect(self, ws): await ws.accept(); self.active.append(ws)
    def disconnect(self, ws):
        if ws in self.active: self.active.remove(ws)

mgr = ConnManager()

@app.websocket("/ws/stream")
async def ws_stream(ws: WebSocket):
    await mgr.connect(ws)
    try:
        while True:
            data = engine.get_state()
            await ws.send_json(data)
            await asyncio.sleep(0.04) # Stream to UI at ~25 FPS
    except WebSocketDisconnect:
        mgr.disconnect(ws)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
