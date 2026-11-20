@echo off
title FujiNova 6.0 - Launcher
color 0B
echo ========================================================
echo         FUJINOVA 6.0 - Connected Travel Experience     
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Check Python virtual environment
set PYTHON_EXE=
if exist "%~dp0..\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0..\.venv\Scripts\python.exe"
    set "UVICORN_EXE=%~dp0..\.venv\Scripts\uvicorn.exe"
) else if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
    set "UVICORN_EXE=%~dp0.venv\Scripts\uvicorn.exe"
) else (
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        set "PYTHON_EXE=python"
        set "UVICORN_EXE=uvicorn"
    ) else (
        echo [ERROR] Python was not found! Please check .venv.
        pause
        exit /b 1
    )
)

:: 2. Check local .env
if not exist "%~dp0.env" (
    if exist "%~dp0.env.example" (
        echo [*] Initializing local .env from .env.example...
        copy "%~dp0.env.example" "%~dp0.env" >nul
    )
)

echo [*] Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "FujiNova 6.0 - Backend API" cmd /k "cd /d "%~dp0" && "%UVICORN_EXE%" backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [*] Starting Frontend (React + Vite + Three.js on http://localhost:5173)...
start "FujiNova 6.0 - Frontend UI" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo [*] Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo [*] Launching FujiNova in default browser...
start http://localhost:5173

echo.
echo ========================================================
echo   FujiNova 6.0 is running!
echo   - Web UI:      http://localhost:5173
echo   - Backend API: http://127.0.0.1:8000
echo   - Swagger Docs: http://127.0.0.1:8000/docs
echo ========================================================
pause
