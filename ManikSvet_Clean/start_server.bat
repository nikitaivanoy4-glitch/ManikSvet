@echo off
title ManikSvet - Server Launcher
echo ===================================================
echo     Launching ManikSvet Backend & Telegram Bot...
echo ===================================================
echo.
cd /d "%~dp0"
set PYTHONPATH=backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
