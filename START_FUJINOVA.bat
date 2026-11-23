@echo off
title START FUJINOVA
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================================
echo               FUJINOVA ONE-CLICK LAUNCHER
echo ========================================================
echo.

:: 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.11+ and ensure 'Add Python to PATH' is checked.
    pause
    exit /b 1
)

:: 2. Setup Virtual Environment if missing
if not exist ".venv\Scripts\python.exe" (
    echo [SETUP] Creating Python virtual environment (.venv)...
    python -m venv .venv
    if not exist ".venv\Scripts\python.exe" (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [SETUP] Installing backend dependencies...
    .\.venv\Scripts\python.exe -m pip install --upgrade pip
    .\.venv\Scripts\pip.exe install -r backend\requirements.txt
)

:: 3. Setup Frontend dependencies if missing
if not exist "frontend\node_modules" (
    echo [SETUP] Installing frontend packages (npm install)...
    cd frontend
    call npm install
    cd ..
)

:: 4. Seed Database
echo [1/3] Initializing database and 35 verified destinations...
.\.venv\Scripts\python.exe -m backend.data.seed_places

:: 5. Launch Backend
echo [2/3] Starting Backend Server (FastAPI on http://127.0.0.1:8000)...
start "FujiNova Backend" cmd /k "cd /d %~dp0 && .\.venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

:: 6. Launch Frontend
echo [3/3] Starting Frontend UI (Vite on http://localhost:5173)...
start "FujiNova Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

timeout /t 3 /nobreak >nul

:: 7. Open Browser
echo Opening FujiNova in your default web browser...
start http://localhost:5173

echo.
echo ========================================================
echo           FUJINOVA IS RUNNING SUCCESSFULLY!
echo ========================================================
echo  * Web App:      http://localhost:5173
echo  * API Server:   http://127.0.0.1:8000
echo  * Swagger Docs: http://127.0.0.1:8000/docs
echo.
echo Leave the two open terminal windows running.
echo To stop FujiNova, simply close those two terminal windows.
echo ========================================================
pause
