# FujiNova One-Click Launcher for PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "               Starting FujiNova Application             " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "1. Starting Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$Root`" && .\.venv\Scripts\python -m backend.data.seed_places && .\.venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "2. Starting Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d `"$Root\frontend`" && npm run dev"

Start-Sleep -Seconds 3

Write-Host "3. Launching browser at http://localhost:5173..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "FujiNova is running!" -ForegroundColor Cyan
Write-Host " - Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host " - Backend:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host " - Docs:     http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
