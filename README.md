# 🚦 CrowdFlow AI

<div align="center">
  <p><strong>A Real-Time Public Safety & Crowd Density Analytics Platform</strong></p>
</div>

CrowdFlow AI is a high-performance, real-time computer vision platform designed to monitor crowd density, detect anomalies, and prevent stampedes. By decoupling from physical floor plans and using a purely mathematical 5-quadrant geometric grid, it can be instantly deployed on any CCTV or Drone footage in the world without hardcoded calibration.

## 🚀 Key Features

* **Real-Time AI Physics Engine**: Powered by **YOLOv8** (High-Resolution Object Tracking) and **OpenCV MOG2 Background Subtraction** to capture both massive crowd flows and individual micro-movements.
* **Optical Flow Pressure Mapping**: Calculates pixel-flow velocity using Farneback Optical Flow to detect active pushing, shoving, and crowd crush dynamics before they escalate.
* **Fruin Level of Service (LoS)**: Automatically maps physical headcount density into the international standard Fruin LoS scale (e.g. *A/B - Free Flow* vs *F - Stampede Imminent*).
* **Topological Sector Graph**: A live node-based UI that dynamically shifts colors (Green → Yellow → Orange → Red) and pulses when structural capacity is breached.
* **Low-Latency Telemetry**: Python backend broadcasts a high-speed WebSocket stream (10hz) to a blazing-fast React Dashboard with zero perceivable latency.

## 🧠 Architecture Stack

### Backend
* **Python 3 / FastAPI**
* **Ultralytics YOLOv8** (`1088` inference size)
* **OpenCV** (MOG2 & Farneback Optical Flow)
* **WebSockets**

### Frontend
* **React + Vite**
* **TailwindCSS** (Custom dynamic glassmorphic UI)
* **Lucide Icons**

## 💻 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ameyghugarkar/CrowdFlow-AI.git
   cd CrowdFlow-AI
   ```

2. **Start the AI Backend:**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt  # (Install YOLO, OpenCV, FastAPI, Uvicorn, etc.)
   python main.py
   ```

3. **Start the React Dashboard:**
   Open a new terminal window.
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Platform:**
   Navigate to `http://localhost:5173` in your web browser.

## 🛡️ License

This project is open-source and created for public safety innovation.
