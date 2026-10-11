@echo off
title AgriSense Backend API Server
echo ===================================================
echo Starting AgriSense FastAPI Backend Server on :8000
echo ===================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
