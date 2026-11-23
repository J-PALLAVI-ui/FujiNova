# FUJINOVA 12.0 — INITIAL AUDIT & BASELINE ASSESSMENT

**Date:** 2026-11-23  
**Project Directory:** `C:\Users\amuje\Downloads\japneese\fujinova-11.0-master`  
**Git Branch:** `fujinova-12.0` (commit `5ac7952`)  
**Target Goal:** Transform into **FujiNova 12.0 — The Real AI Travel Companion** matching user-supplied high-fidelity mockups, operational data truth rules, and zero-cost safety limits.

---

## 1. Executive Summary & Codebase State

An audit of the FujiNova repository was conducted prior to code modifications:
- **Backend Test Status:** 121 tests collected, 121 passed (100% green).
- **Frontend Test Status:** 9 test files, 40 tests collected, 40 passed (100% green).
- **Build Status:** Vite + TypeScript compiles cleanly with zero type errors.
- **Visual Identity:** Sakura Garden visual palette (#F7EFE5 Warm Ivory, #E9A5B5 Sakura Pink, #29252B Ink Charcoal, #789477 Matcha Green, #C66B4E Sunset Vermilion, #B99BCB Wisteria Purple) with Japanese travel journal typography and 3 multi-age experience modes (Standard Explorer, Trendsetter, Family & Junior).

---

## 2. Inventory of Existing Modules

### Backend Modules (`backend/app/`)
| Module | File | Current Capabilities | FujiNova 12.0 Enhancement |
| :--- | :--- | :--- | :--- |
| **Smart Journey V3** | `services/smart_journey/crowd_service_v3.py` | 1st-party crowd report ingestion, $N \ge 3$ threshold rule, typical patterns | Add Google Maps Platform Place Details / busyness proxy, multi-destination comparison, live traffic |
| **RAPTOR Transit** | `services/transport/raptor.py` | GTFS-JP public transport routing, timetable lookups | Add step-by-step boarding instructions, unverified platform fallback notices, missed-bus rerouting |
| **Sync Adapters** | `services/sync/` | Geoapify, Teraren, ODPT, Nager.Date, Frankfurter | Add Google Maps Platform adapter with $0 quota lock and Places/Routes capabilities |
| **Places & Categories**| `services/places_service.py` | Database lookup for Yamanashi POIs | Expand to all 17 distinct functional discovery categories with genuine coords and details |
| **Conversational Tools**| `services/llm/` | Gemini model router, Hana agent tools, translation | Connect Hana 4-choice decision engine (Visit anyway, quieter alternative, famous lower-crowd, later) |
| **Companion Engine** | New | N/A | Add live Journey Companion state machine (`/api/v1/journey/companion/*`) and Treasure Map discovery |

### Frontend Components (`frontend/src/components/`)
| Component | Existing Features | FujiNova 12.0 Redesign Target |
| :--- | :--- | :--- |
| **Master Navigation** | Tab switcher | Add primary tabs: *Plan My Trip*, *Treasure Map*, *Buses & Trains*, *Crowd & Traffic*, *Weather*, *My Itinerary*, *Ask Hana* |
| **Step 1 Location & Categories** | Quick start buttons | Conversational Hana greeting, GPS coordinate + accuracy display, distance to Fujikyu stops, 17 category chips |
| **Route Map & Widgets** | Interactive map view | 3-pane desktop layout with selected destination chips, route polylines, crowd/traffic/weather metric cards |
| **Your Day Plan Timeline** | Chronological timeline | Editable full-day schedule (08:30 - 17:30) with walking times, transfer durations, cost totals, and edit controls |
| **Live Crowd & Traffic View** | Crowd badge display | Side-by-side Destination Comparison table/list, traffic layer toggle, Hana 4-choice alternative prompt card |
| **Treasure Map Explorer** | Basic exploration | Mobile & desktop Treasure Hunt view with pins, hidden viewpoints, discovery badges (3/7 progress), and live Companion card |

---

## 3. Data Integrity & Operational Truth Checklist

1. **Crowd Data Rule:** Never display a simulated value as live. If venue has no live data, explicitly show: `"Live crowd information unavailable for this destination"`.
2. **Platform & Departure Rule:** Verified GTFS-JP platforms show green verified badge; unverified platforms display: `"Platform/boarding information unavailable - please confirm on the operator departure board/signage"`.
3. **Financial Safety Rule:** All external API providers operate within free tier quotas ($0 spend). Google Maps Platform calls use monthly free tier allowances guarded by strict daily rate limiters and circuit breakers.
4. **Location Truth:** Geolocation requires user permission, displays accuracy in meters, and calculates real distances to Fujikyu Railway stations and bus stops without silent fallbacks.

---

## 4. Next Implementation Milestones

- **Stage 2:** Database & seed data upgrade for 17 discovery categories + starting point distance engine.
- **Stage 3:** Google Maps Platform adapter + multi-destination crowd & traffic comparison service.
- **Stage 4:** Itinerary scheduler + RAPTOR step-by-step guidance + companion actions + treasure map API.
- **Stage 5:** Frontend UI transformation matching desktop and mobile mockups.
- **Stage 6:** Verification tests, build, and completion of the 8 required technical reports.
