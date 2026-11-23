# FUJINOVA 12.0 — COMPLETE SETUP & DEPLOYMENT GUIDE

**Project:** FujiNova 12.0: The Real AI Mount Fuji Regional Travel Companion  
**Document Code:** FN12-SETUP-2026-V1  
**Timestamp:** November 23, 2026  
**Audience:** Full-Stack Engineers, DevOps, System Administrators  

---

## 1. Prerequisites & System Requirements

### 1.1 Software Requirements
- **Python:** Version 3.11, 3.12, or 3.14 (64-bit).
- **Node.js:** Version 18.x, 20.x, or 22.x LTS.
- **npm:** Version 9.x or higher.
- **Git:** Version 2.40 or higher.
- **Operating Systems:** Windows 10/11, macOS 13+, Ubuntu 22.04+ LTS.

### 1.2 API Credentials (Zero-Cost Free Tier)
1. **Google Gemini API Key:** (Required for Hana AI)
   - Obtain free key at [Google AI Studio](https://aistudio.google.com/).
2. **Google Maps Platform API Key:** (Optional for live Places & Traffic busyness)
   - Obtain at [Google Cloud Console](https://console.cloud.google.com/).
   - Includes $200 USD complimentary recurring monthly credits.
   - Guarded automatically by FujiNova's hard daily cap of 50 requests.

---

## 2. Quick-Start Guide (Local Development)

### Step 1: Clone or Extract Repository
```powershell
# Target working directory
cd C:\Users\amuje\Downloads\japneese\fujinova-11.0-master
```

### Step 2: Backend Virtual Environment Setup
```powershell
# Create Python virtual environment if not present
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` in the project root:
```ini
# Core Configuration
ENVIRONMENT=development
FREE_ONLY_MODE=true
ENABLE_OPENAI_FALLBACK=false

# Google Gemini Free Tier
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps Platform (Optional - Falls back to verified offline data if omitted)
GOOGLE_MAPS_API_KEY=your_gmaps_api_key_here
MAX_DAILY_GMAPS_CALLS=50
```

### Step 4: Initialize & Seed SQLite Database
Seed the GTFS-JP timetable routes and 35 Mount Fuji destinations (including Café Mignon, Chureito, Lake Kawaguchi, and Oishi Park):
```powershell
python -m backend.reseed
```

### Step 5: Start FastAPI Backend
```powershell
# Run backend server on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend Swagger API Documentation:* `http://127.0.0.1:8000/docs`  
*Health Check:* `http://127.0.0.1:8000/health`

### Step 6: Frontend Installation & Launch
Open a second terminal window:
```powershell
cd C:\Users\amuje\Downloads\japneese\fujinova-11.0-master\frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend Application:* `http://localhost:5173`

---

## 3. Running Test Suites

### 3.1 Backend Test Suite (Pytest)
```powershell
# Run all 128 tests
pytest backend/tests -v
```

### 3.2 Frontend Test Suite (Vitest)
```powershell
cd frontend
npm test
```

### 3.3 Production Build Verification
```powershell
cd frontend
npm run build
```

---

## 4. Production Deployment on Render / Cloud Platforms

FujiNova is pre-configured for dual-service deployment on Render:
1. **Web Service (FastAPI Backend):**
   - Environment: `Python 3`
   - Build Command: `pip install -r backend/requirements.txt && python -m backend.reseed`
   - Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
2. **Static Site (React Frontend):**
   - Environment: `Node.js`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment Variables:
     - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com`
