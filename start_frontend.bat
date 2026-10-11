@echo off
title AgriSense React Frontend Server
echo ===================================================
echo Starting AgriSense React Vite Dashboard on :5173
echo ===================================================
cd /d "%~dp0frontend"
npm run dev
pause
