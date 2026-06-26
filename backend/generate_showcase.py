import cv2
import numpy as np

print("Opening mumbai_crowd.mp4...")
cap = cv2.VideoCapture('mumbai_crowd.mp4')
fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print(f"Video is {w}x{h} @ {fps} FPS, {total_frames} frames.")

# 1. Extract a 'ghost' empty background using median filtering
print("Extracting empty background via median filter...")
frames = []
step = max(1, total_frames // 100)
for i in range(0, total_frames, step):
    cap.set(cv2.CAP_PROP_POS_FRAMES, i)
    ret, frame = cap.read()
    if ret:
        frames.append(frame)

median_bg = np.median(frames, axis=0).astype(dtype=np.uint8)

print("Writing demo_showcase.mp4...")
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter('demo_showcase.mp4', fourcc, fps, (w, h))

def write_faded(img1, img2, duration_sec):
    frames_count = int(duration_sec * fps)
    for i in range(frames_count):
        alpha = i / float(frames_count)
        blended = cv2.addWeighted(img1, 1 - alpha, img2, alpha, 0)
        out.write(blended)

# Phase 1: 5 seconds of empty station
print("Phase 1: Empty station (5s)")
for _ in range(int(fps * 5)):
    out.write(median_bg)

# Crossfade from empty to real video
print("Crossfade to real footage (2s)")
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
ret, first_real_frame = cap.read()
write_faded(median_bg, first_real_frame, 2.0)

# Phase 2: 25 seconds of real heavy crowd
print("Phase 2: Heavy crowd surge (25s)")
for _ in range(int(fps * 25)):
    ret, frame = cap.read()
    if not ret:
        break
    out.write(frame)

# Crossfade back to empty
print("Crossfade back to empty station (2s)")
write_faded(frame, median_bg, 2.0)

# Phase 3: 5 seconds of empty station (cleared)
print("Phase 3: Cleared station (5s)")
for _ in range(int(fps * 5)):
    out.write(median_bg)

out.release()
cap.release()
print("demo_showcase.mp4 successfully generated!")
