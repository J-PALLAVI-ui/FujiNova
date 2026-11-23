# FUJINOVA 12.0 — KNOWN LIMITATIONS & OPERATIONAL BOUNDARIES

**Project:** FujiNova 12.0: The Real AI Mount Fuji Regional Travel Companion  
**Document Code:** FN12-LIMIT-2026-V1  
**Timestamp:** November 23, 2026  
**Status:** ARCHITECTURAL DISCLOSURE  

---

## 1. Public Transportation Telemetry (Static GTFS vs. GTFS-RT)

### 1.1 Limitation Description
FujiNova 12.0 uses the official **Fujikyu Group GTFS-JP static timetable feed**. It precisely calculates scheduled departures, line connections, transfers, and official fares. However, it does not ingest live GPS vehicle position feeds (GTFS-RT / Real-Time).

### 1.2 Impact on Tourist Journey
- If a bus is delayed due to unexpected severe highway traffic on Chuo Expressway or Route 139, the timetable reflects scheduled rather than live GPS vehicle locations.
- **Mitigation in FujiNova 12.0:**  
  The traveler companion features interactive micro-actions (`"Missed my bus"`). If an unexpected delay or missed connection occurs, the system recalculates the next available bus departure in real time.

---

## 2. Platform & Track Information Availability

### 2.1 Limitation Description
In the Fujikyu GTFS-JP feed, major terminal hubs like **Kawaguchiko Station** (Track 1/2, Bus Bays 1–6) and **Fujisan Station** provide explicit platform numbering. However, intermediate and rural roadside bus stops (e.g. *Kawakubo*, *Nagasaki Park*, *Asahigaoka lakeside*) do not feature numbered bays.

### 2.2 Operational Truth Policy
- FujiNova **strictly refuses to invent or simulate platform numbers**.
- Whenever platform data is absent from the official feed, the UI displays:  
  `"Platform/boarding information unavailable - please confirm on the operator departure board/signage"`
- This guarantees tourists are never misdirected to non-existent platforms.

---

## 3. Crowd Sensing Boundaries & Nature Viewpoints

### 3.1 Limitation Description
Unlike enclosed museums, theme parks (Fuji-Q Highland), or major commercial shrines, natural open-access parks (such as *Oishi Park* or *Lake Saiko shoreline*) do not possess turnstiles, ticket barriers, or live gate counters.

### 3.2 System Handling
- FujiNova connects to Google Places API (New) Place Details busyness fields. Where Google provides busyness signals (e.g. Chureito Pagoda), verified live status is displayed.
- Where data is unavailable (e.g. Oishi Park), FujiNova displays:  
  `"Live crowd information unavailable for this destination."`
- The application pairs this honest notice with live arterial road traffic (Route 21: Light) and Open-Meteo visibility conditions so the tourist can still make an informed decision.

---

## 4. Cloud Infrastructure & Free-Tier Cold Starts

### 4.1 Limitation Description
When deployed on free cloud tiers (such as Render's Free Instance):
- Inactivity for 15+ minutes triggers container spin-down.
- The initial wake-up request may take 30 to 50 seconds to initialize Python and load SQLite into memory.

### 4.2 Mitigation in FujiNova 12.0
- The frontend features automatic heartbeat health checks (`/health`) with graceful loading states and retry logic.
- Offline deterministic travel caches are bundled directly in the frontend, allowing immediate UI exploration even while the backend is warming up.

---

## 5. Browser Geolocation Triangulation Variances

### 5.1 Limitation Description
The HTML5 Geolocation API behaves differently depending on client hardware:
- **Mobile Smartphones (iOS / Android):** True GPS satellite lock provides high precision (typically ±5m to ±20m).
- **Desktop Computers / Laptops:** Relies on Wi-Fi BSSID or ISP IP address routing, which may report an accuracy of ±200m to ±1500m.

### 5.2 System Handling
- FujiNova explicitly displays the measured accuracy radius: `(GPS ±15m)`.
- If GPS accuracy is coarse or unavailable, the user can instantly click the one-click hub shortcuts (*Kawaguchiko Station*, *Fujisan Station*, *Your Hotel*) or type any location manually into the search bar.
