@echo off
echo ╔══════════════════════════════════════════════╗
echo ║          CrowdFlow AI — Startup              ║
echo ╚══════════════════════════════════════════════╝
echo.

:: Kill anything already on ports 8000 and 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a 2>nul

echo [1/2] Starting AI Backend (port 8000)...
start "CrowdFlow Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe main.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (port 5173)...
start "CrowdFlow Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ✓ Both servers started!
echo   Backend  → http://localhost:8000
echo   Frontend → http://localhost:5173
echo.
start http://localhost:5173
