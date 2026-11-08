# FujiNova (富士ノヴァ) — AI Tourism Assistant for Mount Fuji & Yamanashi

FujiNova is an AI-powered, location-aware, crowd-sensitive tourism companion for Mount Fuji, the Fuji Five Lakes (Fujigoko), and Yamanashi Prefecture, Japan. Its conversational travel companion is **Hana (華 / 伴)**.

---

## Stage Status: Pre-Implementation Gate (Stage 0 Complete)

* **Current Stage:** Stage 0 Complete (Research, Pre-Implementation Audit & Environment Gate)
* **Application Code Status:** 0 lines of application code (Strict pre-implementation protocol observed)
* **Next Authorized Milestone:** **Stage 1 (Core Conversational Vertical Slice)**

---

## Host Development Prerequisites (Verified)

* **Operating System:** Windows 11 64-bit (Build 10.0.26300+)
* **Processor:** AMD Ryzen 7 5800H (8 Cores / 16 Threads)
* **System RAM:** 16.0 GB DDR4
* **GPU:** NVIDIA GeForce RTX 3050 Laptop GPU (4 GB GDDR6 VRAM)
* **Python Runtime:** Python 3.14.2 64-bit (with `pip` 26.3 and `uv` 0.9.17)
* **Node.js Runtime:** Node.js v24.18.0 with `npm` 11.16.0
* **Source Control:** Git 2.55.0.windows.2

---

## Stage 1 Quick Start Guide (Windows PowerShell)

Once Stage 1 is formally approved, the backend and frontend run using the following sequences:

### 1. Environment Configuration

```powershell
# Navigate to project root
cd d:\FujiNova

# Copy environment template
Copy-Item .env.example .env

# Edit .env and insert your authentic Google AI Studio API key:
# GEMINI_API_KEY=your_key_here
```

### 2. Backend Setup & Startup

```powershell
# Create local virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend\requirements.txt

# Seed the 35 verified Yamanashi places into SQLite
python backend\data\seed_places.py

# Launch FastAPI backend server (port 8000)
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup & Startup (In a second PowerShell terminal)

```powershell
# Navigate to frontend directory
cd d:\FujiNova\frontend

# Install frontend dependencies
npm install

# Start Vite development server (port 5173)
npm run dev
```

### 4. Running Automated Tests

```powershell
# Backend test suite (Pytest)
.\.venv\Scripts\pytest backend\tests -v

# Frontend test suite (Vitest)
cd d:\FujiNova\frontend
npm run test
```

---

## Architectural Principles & Strict Safeguards

1. **Zero Hallucination Standard:** Hana never invents place opening hours, entrance fees, coordinates, or transit routes. If a value is unknown, Hana explicitly discloses that it is unverified.
2. **Decoupled Model Adapters:** Model selection is driven by environment configuration (`FUJINOVA_PRIMARY_MODEL`). Real API keys remain exclusively on the backend.
3. **Privacy First:** Multi-vendor failover requires explicit permission (`ALLOW_MULTI_VENDOR_FAILOVER=true`). User GPS is never queried without deliberate user opt-in.
4. **Lean Footprint:** Built on FastAPI, React, and SQLite with zero requirement for Docker, PostgreSQL, or heavyweight background services on a 16 GB laptop.

---

## Project Structure Overview

```
d:\FujiNova\
├── .env.example              # Canonical environment template (keys kept out of git)
├── .gitignore                # Git ignore configuration
├── README.md                 # Project documentation and startup instructions
├── backend\
│   ├── requirements.txt      # Python dependencies for Stage 1
│   ├── app\                  # FastAPI application, LangGraph agent, and services
│   ├── data\                 # SQLite seed scripts and canonical JSON places
│   └── tests\                # Pytest automated test suites
├── frontend\
│   ├── package.json          # Node dependencies and scripts
│   └── src\                  # React 18, TypeScript, Tailwind components
└── research\                 # Preserved research, audits, and governance reports
```
