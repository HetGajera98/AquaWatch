# 💧 AquaWatch — Water Intelligence Platform
## Hackathon Roadmap | **4-Member Team (Frontend · Backend · AI/ML · DevOps/IoT)**

> **Project**: AquaWatch — Tank level, flow and weather data flow in continuously → AI predicts water shortage risk, detects leaks, and drives smart pump control → operators see live dashboards and get early-warning alerts
> **Stack**: React 18 + TypeScript (frontend) · Node.js/Express (backend) · Python FastAPI (AI service) · PostgreSQL + Prisma · ESP32-S3 hardware nodes over Wi-Fi → Blynk Cloud (IoT layer)
> **Goal**: A single operator-facing website with live dashboards, backed by real IoT sensor hardware feeding a time-series pipeline.
> **Duration**: 5 Days
> **Team Size**: 4 Members
> **Product Roles**: **1 — Operator only.** No citizen portal, no multi-tenant admin hierarchy in the MVP. Every operator has a lightweight account (email + password) so they can log in — no other roles. The 4 team members build one shared product for one logged-in operator.

---

## TABLE OF CONTENTS

1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [Operator Journey (Login Required, One Role)](#4-operator-journey-login-required-one-role)
5. [Complete Sensor-to-Prediction Workflow](#5-complete-sensor-to-prediction-workflow)
6. [IoT Hardware — Recommended Components](#6-iot-hardware--recommended-components)
7. [Member 1 — Frontend Developer Roadmap](#7-member-1--frontend-developer-roadmap)
8. [Member 2 — Backend Developer Roadmap](#8-member-2--backend-developer-roadmap)
9. [Member 3 — AI/ML Engineer Roadmap](#9-member-3--aiml-engineer-roadmap)
10. [Member 4 — DevOps / IoT Roadmap](#10-member-4--devops--iot-roadmap)
11. [API Reference](#11-api-reference)
12. [Day-by-Day Team Build Order](#12-day-by-day-team-build-order)
13. [Role Boundary Rules — No Overlap](#13-role-boundary-rules--no-overlap)
14. [Hackathon Survival Rules](#14-hackathon-survival-rules)
15. [Demo Script](#15-demo-script)

---

## 1. Project Overview & Problem Statement

### The Problem
Water utilities and households usually find out about a shortage or a leak only after the damage is visible — a dry tap, an overflowing tank, a pump left running into an empty line. The underlying signals (falling tank levels, abnormal flow patterns, rainfall deficits, rising consumption) already exist, but nobody is fusing them into a single early-warning picture with the ability to act on it. There's no simple tool that says: "here's what's stressed right now, and here's what to do about it — automatically if needed."

### What AquaWatch Builds
One website, one login, live data flowing in from real sensors:
- **Login / Sign Up** — operator creates an account (email + password) or logs into an existing one before viewing the platform
- **Live Sensor Feed** — tank level, flow rate, and float-switch status arriving from deployed ESP32-S3 hardware via Wi-Fi → Blynk Cloud
- **Weather Ingestion** — rainfall/temperature forecast pulled from a weather API (OpenWeatherMap/WeatherAPI) and combined with tank + consumption trends
- **AI Prediction** — the system forecasts short-term water-shortage risk, flags leak probability from abnormal flow patterns, and drives smart pump control logic
- **Water Stress Score** — Low / Medium / High, per zone
- **Dashboards** — real-time charts (tank level, flow rate, consumption trend, pump status, alerts) plus a historical view
- **Action** — Low/Medium: monitoring guidance. High: "Investigate now" + which zone/sensor triggered it, with the underlying readings shown. Pump control: automatic on/off via relay based on tank level + prediction logic

### Only One Product Role: Operator
There is only one role in the product — no citizen-facing app, no admin hierarchy. Every operator has a basic account so they can log in, but there's no role hierarchy beyond that. The **4 team members build the same single-role product together**, each owning a different technical layer:

| Member | Layer They Own |
|---|---|
| **Frontend** | Everything the operator sees and clicks — login/signup pages, dashboard grid, charts, alerts panel, zone map |
| **Backend** | The API that ties it together — auth (signup/login/session), sensor/tank/weather data endpoints, Blynk polling + relay commands, request validation, proxying to AI, alert logging |
| **AI/ML** | Water-shortage forecasting model, flow-anomaly leak detection, smart pump-control decision logic |
| **DevOps/IoT** | Database provisioning, schema migrations, Blynk project/device setup, ESP32-S3 node deployment (flow sensor, ultrasonic level, float switch, relay), `.env` secrets, integration testing, deployment |

> ⚠️ **Important framing for the demo and the UI itself**: this tool gives *early-warning signals*, not certainties. Every "High" stress or leak-risk result should push the operator to verify in the field rather than acting as an automated shutoff.

---

## 2. System Architecture

```
+-----------------------------------------------------------------------------------------+
|                        AQUAWATCH — WATER INTELLIGENCE PLATFORM                           |
|                                                                                           |
|  +------------------+   +-----------------------+   +-------------------------+          |
|  |   FRONTEND        |   |  NODE.JS BACKEND       |   |  PYTHON AI MICROSERVICE |          |
|  |  React 18 + TS    |<->|  Express REST API      |<->|  FastAPI + Uvicorn      |          |
|  |  Tailwind CSS      |   |  Prisma ORM            |   |  Water-shortage forecast|          |
|  |  Login/Signup      |   |  Auth (JWT) routes     |   |  Leak detection model   |          |
|  |  Dashboard/charts  |   |  Sensor/tank data       |   |  Pump-control logic     |          |
|  |  Alerts + pump card |   |  AI proxy + fallback   |   |                         |          |
|  |                    |   |  Blynk poller + relay  |   |                         |          |
|  |                    |   |  command + alert logging|   |                         |          |
|  +------------------+   +-----------------------+   +-------------------------+          |
|           |                       |    ^    |                                            |
|           v                       v    |    v                                            |
|  +------------------+   +-----------------------+   +-------------------------+          |
|  |  BROWSER STATE     |   |  POSTGRESQL           |   |  BLYNK CLOUD            |          |
|  |  React Query cache  |   |  Users · Sensors      |<->|  Device telemetry +     |          |
|  |  Stored JWT token   |   |  Readings · Tanks     |   |  virtual pins + relay   |          |
|  |                    |   |  Weather · Alerts      |   |  command channel        |          |
|  |                    |   |  Pump actions          |   +-------------------------+          |
|  +------------------+   +-----------------------+                 ^                       |
|                                                                    | Wi-Fi                  |
|                                                        +-------------------------+          |
|                                                        |  ESP32-S3 NODE          |          |
|                                                        |  YF-S201 flow sensor    |          |
|                                                        |  JSN-SR04T level sensor |          |
|                                                        |  Float switch           |          |
|                                                        |  1-ch relay -> pump     |          |
|                                                        +-------------------------+          |
+-----------------------------------------------------------------------------------------+
```

> ⚡ **Key Architecture Decision**: Node.js is the **single gateway** for all frontend requests. The Python AI service is an internal microservice — the frontend never calls it directly. All AI results flow through Node.js proxy routes, and Node always has a safe fallback if Python is briefly unavailable — the dashboard should never go blank because a model call failed.

> 📡 **IoT ingestion runs through Blynk Cloud, not a custom broker**: the ESP32-S3 node publishes flow, level, and float-switch readings to Blynk over Wi-Fi using virtual pins. A small polling job (owned by DevOps/IoT, can live inside Node or as its own script) reads the latest values from the Blynk REST API on a schedule and writes them into `sensor_readings`. Blynk also doubles as a quick mobile-app view and a manual override for the pump relay — the custom web dashboard stays the primary operator-facing surface, Blynk is the transport + backup view underneath it.

> 🔐 **Auth is deliberately lightweight**: email + password, hashed with bcrypt, a JWT issued on login and stored client-side, and one middleware that protects the dashboard/data routes. No email verification, no password reset flow, no OAuth — those are stretch goals at best. The goal is "a real login gate," not a production-grade identity system.

> 🌦️ **Weather data is NOT an AI feature.** It's pulled from a public weather API (e.g., Open-Meteo or OpenWeatherMap) by the Backend member on a schedule and stored alongside sensor data. Keeping this out of the AI service keeps the ML scope focused on prediction, not data fetching.

### End-to-End Data Flow

```
ESP32-S3 node (YF-S201 flow, JSN-SR04T level, float switch)
        |
        v
Publishes readings over Wi-Fi --> Blynk Cloud (virtual pins)
        |
        v
[Node/DevOps polling job] reads latest values via Blynk REST API, writes to `sensor_readings`
        |
        v
Operator logs in or signs up
  (a) SIGN UP — email + password -> [Node] hashes password (bcrypt) -> creates user -> returns JWT
  (b) LOG IN  — email + password -> [Node] verifies hash -> returns JWT
        |
        v
Frontend stores JWT, attaches it to every request from here on
        |
        v
Dashboard loads:
        |
        +---> [Node] verifies JWT, then serves latest sensor/tank/weather data
        |
        +---> [Node] -> [Python AI] POST /predict-shortage (tank level + consumption + weather) -> stress score
        |
        +---> [Node] -> [Python AI] POST /predict-leak (recent flow pattern) -> leak probability
        |
        +---> [Node] -> [Python AI] POST /predict-pump-control (tank level + float switch + shortage risk) -> pump on/off decision
        |
        +---> Result shown to operator:
                 - Low/Medium stress   -> normal dashboard view, trend charts
                 - High stress/leak    -> alert banner + which zone/sensor + underlying readings
        |
        +---> Pump decision -> [Node] sends relay command to Blynk Cloud -> ESP32-S3 actuates the relay
        |
        +---> Alert / pump action logged against the triggering sensor/zone and timestamp
```

---

## 3. Database Schema

```sql
-- USERS (operator accounts — owned by Backend/DevOps)
users (
  id            UUID PRIMARY KEY,
  email         VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,   -- bcrypt hash, never store plaintext
  created_at    TIMESTAMP
)

-- ZONES (a service area / neighborhood / district)
zones (
  id            UUID PRIMARY KEY,
  name          VARCHAR NOT NULL,
  city          VARCHAR NOT NULL,
  population    INT
)

-- SENSORS (physical device registry)
sensors (
  id            UUID PRIMARY KEY,
  zone_id       UUID REFERENCES zones(id),
  type          VARCHAR NOT NULL,   -- 'flow' | 'tank_level' | 'float_switch'
  blynk_device_id VARCHAR UNIQUE NOT NULL,  -- Blynk device/template ID for this ESP32-S3 node
  location_lat  FLOAT,
  location_lng  FLOAT,
  installed_at  TIMESTAMP
)

-- SENSOR READINGS (time-series)
sensor_readings (
  id            BIGSERIAL PRIMARY KEY,
  sensor_id     UUID REFERENCES sensors(id),
  value         FLOAT NOT NULL,
  unit          VARCHAR NOT NULL,   -- 'L/min', '%', 'bool' (float switch)
  recorded_at   TIMESTAMP NOT NULL
)

-- TANKS (the tank being monitored)
tanks (
  id            UUID PRIMARY KEY,
  zone_id       UUID REFERENCES zones(id),
  name          VARCHAR NOT NULL,
  capacity_liters FLOAT NOT NULL
)

-- TANK LEVELS (time-series, derived from JSN-SR04T readings)
tank_levels (
  id            BIGSERIAL PRIMARY KEY,
  tank_id       UUID REFERENCES tanks(id),
  level_percent FLOAT NOT NULL,
  recorded_at   TIMESTAMP NOT NULL
)

-- PUMPS (relay-controlled pump per tank)
pumps (
  id            UUID PRIMARY KEY,
  tank_id       UUID REFERENCES tanks(id),
  relay_sensor_id UUID REFERENCES sensors(id)  -- the ESP32-S3 node hosting the relay
)

-- PUMP ACTIONS (log of on/off decisions)
pump_actions (
  id            UUID PRIMARY KEY,
  pump_id       UUID REFERENCES pumps(id),
  action        VARCHAR NOT NULL,   -- 'on' | 'off'
  triggered_by  VARCHAR NOT NULL,   -- 'auto' | 'manual'
  reason        VARCHAR,            -- e.g. 'tank_low', 'tank_full', 'leak_detected'
  created_at    TIMESTAMP
)

-- WEATHER DATA (per zone, pulled from external API)
weather_data (
  id            BIGSERIAL PRIMARY KEY,
  zone_id       UUID REFERENCES zones(id),
  rainfall_mm   FLOAT,
  temperature_c FLOAT,
  recorded_at   TIMESTAMP NOT NULL
)

-- CONSUMPTION RECORDS (billing/meter-derived usage per zone)
consumption_records (
  id            BIGSERIAL PRIMARY KEY,
  zone_id       UUID REFERENCES zones(id),
  volume_liters FLOAT NOT NULL,
  recorded_at   TIMESTAMP NOT NULL
)

-- PREDICTIONS / ALERTS
alerts (
  id            UUID PRIMARY KEY,
  zone_id       UUID REFERENCES zones(id),
  sensor_id     UUID REFERENCES sensors(id),  -- nullable, set for leak alerts
  type          VARCHAR NOT NULL,   -- 'leak' | 'water_stress'
  severity      VARCHAR NOT NULL,   -- 'low' | 'medium' | 'high'
  confidence    FLOAT,
  triggered_by_user UUID REFERENCES users(id),  -- who was logged in when it fired, nullable
  created_at    TIMESTAMP
)
```

---

## 4. Operator Journey (Login Required, One Role)

```
1. Land on site -> Login / Signup screen
2. Log in -> redirected to Dashboard (default: all zones overview)
3. Dashboard shows, per zone:
     - Water stress score (Low/Med/High) as a colored chip
     - Tank level trend (7-day line chart)
     - Live flow readings + float-switch status from that zone's sensors
     - Pump status (on/off) with last action reason
4. Operator clicks a zone -> Zone Detail view
     - Full sensor list with live values
     - Leak-risk indicator per sensor
     - Historical charts (consumption vs. tank level, rainfall overlay)
     - Pump action history (auto vs. manual, with trigger reason)
5. If any zone is High severity -> red banner persists across the app until acknowledged
     - Clicking it jumps to the offending zone/sensor with the readings that triggered it
6. Alerts tab -> chronological list of past alerts, filterable by zone/type
```

---

## 5. Complete Sensor-to-Prediction Workflow

```
Every N seconds:  ESP32-S3 reads flow (YF-S201), level (JSN-SR04T), float switch
                   -> writes to Blynk virtual pins over Wi-Fi
        |
        v
Every M seconds (polling job, owned by DevOps/IoT, runs inside Node):
        |
        +---> [Node] GET Blynk REST API (per device) for latest virtual pin values
        +---> validates payload, converts distance -> tank level %
        +---> writes rows to `sensor_readings` and `tank_levels`

Every M minutes (scheduled job, owned by Backend):
        |
        +---> [Node] pulls latest weather forecast for each zone from external weather API -> `weather_data`
        +---> [Node] -> [Python AI] POST /predict-shortage
                 input: tank level trend + consumption + rainfall forecast for a zone
                 output: { zone_id, stress_score, severity }
        +---> [Node] -> [Python AI] POST /predict-leak
                 input: recent flow-rate window per sensor
                 output: { sensor_id, leak_probability, is_leak }
        +---> [Node] -> [Python AI] POST /predict-pump-control
                 input: tank level %, float-switch status, shortage risk, leak flag
                 output: { pump_id, action: 'on'|'off', reason }
        +---> Any 'high' severity result -> insert into `alerts`, push to connected dashboards
        +---> Pump decision that changes state -> [Node] sends relay command to Blynk -> insert into `pump_actions`
```

---

## 6. IoT Hardware — Recommended Components

Since real hardware is being deployed for a hackathon MVP, this hardware stack is optimized for low cost, easy sourcing, fast implementation, and reliable demonstrations of water shortage prediction, leak detection, and smart pump control.

### Microcontroller (the node "brain")
| Component | Why |
|---|---|
| **ESP32-S3** | Built-in Wi-Fi and Bluetooth, powerful dual-core processor, native USB support, sufficient GPIOs for multiple sensors, fully compatible with Blynk and Arduino IDE. Ideal as the main controller for all demo nodes. |

### Sensors — MVP Selection
| Sensor | Measures | Where it goes |
|---|---|---|
| **YF-S201 Water Flow Sensor** | Flow rate (L/min) and total water consumption | Installed inline on the tank inlet/outlet pipe. Used for leak detection and water usage monitoring. |
| **JSN-SR04T Waterproof Ultrasonic Sensor** | Water level (%) and tank volume | Mounted on top of the tank to measure distance to the water surface. Primary tank monitoring sensor. |
| **Float Switch** | Full/empty level detection | Mounted near the maximum water level as a backup safety mechanism to prevent overflow if the ultrasonic sensor fails. |

### Connectivity
| Option | Best for | Notes |
|---|---|---|
| **Wi-Fi (built into ESP32-S3)** | Hackathon and urban deployments | Simplest setup. ESP32 sends data directly to Blynk Cloud over Wi-Fi. |

For a 5-day hackathon, Wi-Fi is the recommended choice because it requires no additional hardware gateways or communication modules.

### Power
| Component | Why |
|---|---|
| **USB 5V Power Adapter** | Easiest power solution for demonstrations and indoor installations. |
| **18650 Battery + TP4056 Module (Optional)** | Portable operation for future field deployments. |

### Dashboard & Cloud
| Item | Why |
|---|---|
| **Blynk IoT Platform** | Real-time monitoring, historical charts, mobile notifications, and remote pump control without building a custom mobile app. The custom AquaWatch web dashboard remains the primary operator surface; Blynk is the device-to-cloud transport underneath it and a handy backup/mobile view. |
| **Weather API (OpenWeatherMap/WeatherAPI)** | Provides rainfall and weather forecasts used for the water shortage prediction model. |

### Control Hardware
| Component | Why |
|---|---|
| **1-Channel Relay Module** | Controls the water pump automatically based on tank level and prediction logic. |

### AI Prediction Inputs
| Prediction | Data Sources |
|---|---|
| **Water Shortage Prediction** | Tank level (JSN-SR04T) + water consumption (YF-S201) + weather forecast API |
| **Leak Detection** | Flow sensor readings showing abnormal or continuous flow patterns |
| **Smart Pump Control** | Tank level + float switch status + consumption trends |

### Suggested demo hardware set (minimum to show the full story)
1. One ESP32-S3 + YF-S201 flow sensor on a short pipe rig → live leak-detection demo
2. One ESP32-S3 + JSN-SR04T ultrasonic sensor + float switch on a small water container → live tank-level + pump-control demo
3. Relay wired to a small pump on the tank rig → automatic on/off triggered live on stage

Two physical nodes (or one combined rig) is enough to demonstrate all three AI predictions live without overbuilding the hardware side in 5 days.

---

## 7. Member 1 — Frontend Developer Roadmap

**Day 1** — Project scaffold (Vite + React + TS + Tailwind), routing, Login/Signup pages against mock auth.
**Day 2** — Dashboard layout: zone overview cards, stress-score chips, pump status card, placeholder charts using hardcoded mock JSON (don't wait on backend).
**Day 3** — Wire live API calls (React Query + axios) for zones, sensors, tanks; real-time chart components (recharts).
**Day 4** — Zone Detail view, Alerts tab, pump action history, alert banner logic, WebSocket/SSE hookup for live pushes if backend supports it.
**Day 5** — Polish: loading/error states, mobile responsiveness, empty states, demo rehearsal.

## 8. Member 2 — Backend Developer Roadmap

**Day 1** — Express scaffold, Prisma schema authoring (hand off to DevOps for provisioning), auth routes (signup/login/JWT), share DB credentials handshake.
**Day 2** — Zones/sensors/tanks/weather CRUD + read endpoints; stub `/api/predict-*` routes returning hardcoded mock responses.
**Day 3** — Blynk REST API polling job (fetch latest virtual pin values, write to `sensor_readings`/`tank_levels`); scheduled weather-fetch job.
**Day 4** — Replace stubs with real AI proxy calls + safety-first fallback logic; relay-command endpoint (Node → Blynk), alert + pump-action logging.
**Day 5** — Integration testing with all three other layers, hardening error handling.

## 9. Member 3 — AI/ML Engineer Roadmap

**Day 1** — FastAPI scaffold, Pydantic schemas for `/predict-shortage`, `/predict-leak`, `/predict-pump-control`; share exact request/response JSON with Backend by end of day.
**Day 2** — Leak detection: rule-based + statistical model first (flow-rate anomaly — continuous or abnormally high flow with no matching schedule), replace with trained model if time allows.
**Day 3** — Water-shortage scoring model (rule-based weighted score of tank level trend, consumption trend, rainfall forecast deficit is a safe, explainable baseline).
**Day 4** — Smart pump-control decision logic (rule-based: pump on if tank level below threshold and float switch not "full"; pump off if float switch "full" or a leak is flagged) — frame it as transparent rules, not a black box.
**Day 5** — Model validation against seeded data, tune thresholds so the demo scenario triggers cleanly.

## 10. Member 4 — DevOps / IoT Roadmap

**Day 1** — Provision Postgres, share `DATABASE_URL` and `AI_SERVICE_URL`/`VITE_API_URL` with the team; set up Blynk project + device templates.
**Day 2** — Flash ESP32-S3 nodes with firmware (flow/level/float-switch read + Blynk publish loop + relay control); bench-test each sensor individually.
**Day 3** — Deploy the demo hardware rigs (leak pipe, tank level + float switch + relay/pump); confirm end-to-end: sensor → Blynk → DB row.
**Day 4** — Run Prisma migrations, seed data (zones, historical readings for charts to look populated), verify AI-service-down fallback and relay-command path.
**Day 5** — Fresh seed before demo, full hardware dry-run, deployment (if going live), final integration sync with all members.

---

## 11. API Reference

| Method | Route | Owner | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | Backend | Create operator account |
| POST | `/api/auth/login` | Backend | Log in, returns JWT |
| GET | `/api/zones` | Backend | List zones with latest stress score |
| GET | `/api/zones/:id` | Backend | Zone detail: sensors, tank, pump status, recent readings |
| GET | `/api/sensors/:id/readings` | Backend | Time-series readings for a sensor |
| GET | `/api/alerts` | Backend | List alerts, filterable by zone/type/severity |
| GET | `/api/pumps/:id/actions` | Backend | Pump action history for a tank |
| POST | `/api/pumps/:id/control` | Backend → Blynk | Manual override — sends relay command to Blynk |
| POST | `/api/internal/predict-shortage` | Backend → AI | Proxies to Python `/predict-shortage` |
| POST | `/api/internal/predict-leak` | Backend → AI | Proxies to Python `/predict-leak` |
| POST | `/api/internal/predict-pump-control` | Backend → AI | Proxies to Python `/predict-pump-control` |
| POST | `/predict-shortage` | AI/ML | FastAPI: tank level+consumption+weather → stress score |
| POST | `/predict-leak` | AI/ML | FastAPI: flow window → leak probability |
| POST | `/predict-pump-control` | AI/ML | FastAPI: tank level+float switch+risk flags → pump on/off decision |

---

## 12. Day-by-Day Team Build Order

| Day | Frontend | Backend | AI/ML | DevOps/IoT |
|---|---|---|---|---|
| 1 | Scaffold + Login UI (mock) | Scaffold + auth routes | FastAPI scaffold + schemas | DB provisioned + Blynk project/device setup |
| 2 | Dashboard w/ mock data | CRUD endpoints + stub predict routes | Leak model v1 | Flash + bench-test ESP32-S3 nodes |
| 3 | Wire live API calls | Blynk polling job | Water-shortage model | Deploy hardware rigs (leak, tank+float+relay) |
| 4 | Zone detail + alerts + pump UI | Real AI proxy + fallback + relay command | Pump-control logic | Migrations, seed data, fallback test |
| 5 | Polish + rehearsal | Integration testing | Threshold tuning | Fresh seed + hardware dry-run |

---

## 13. Role Boundary Rules — No Overlap

| Forbidden | Why |
|---|---|
| M1 writing Express route files | Creates conflicting API logic, breaks M2's validation chain |
| M2 editing React component files | Component state is M1's domain |
| M3 modifying Node.js proxy handler code | M3 defines the AI API shape; M2 writes the proxy that calls it |
| M2 writing Python prediction logic | Model logic belongs to M3; M2 only calls it via HTTP and handles fallback |
| M4 adding business logic to Express routes | Route logic is M2's domain; M4 tests the output and owns infra/hardware |
| M1 running Prisma migrations | Schema is M2's source of truth; provisioning/migrating is M4's job |
| M2/M3 flashing or wiring hardware | Physical node deployment is M4's domain, to avoid conflicting firmware changes |

### Required Handshakes

| Handshake | Who | When | What to Share |
|---|---|---|---|
| DB credentials | M4 → M2 | Day 1 start | `DATABASE_URL` |
| AI service URL | M4 → M2 | Day 1 start | `AI_SERVICE_URL` |
| Frontend API URL | M4 → M1 | Day 1 start | `VITE_API_URL` |
| AI contracts | M3 → M2 | Day 1 end | Exact request/response JSON for all 3 predict endpoints |
| API endpoint list | M2 → M1 | Day 2 start | All routes, methods, shapes |
| Blynk auth token + template IDs | M4 → M2 | Day 1 end | Blynk API token, device/virtual-pin mapping |
| First sensor reading confirmed | M4 → M2 | Day 3 start | "Blynk → DB polling pipeline is live" |
| Seed data confirmed | M4 → All | Day 4 end | "Seed ran, dashboard shows populated history" |
| Fallback verification | M4 → M1, M2, M3 | Day 4 end | Confirms fallback activates cleanly when Python is stopped |
| Integration sync | All 4 | Day 5 start | Full browser + live-hardware flow test together |

---

## 14. Hackathon Survival Rules

| Rule | Detail |
|---|---|
| **M4 owns the DB and hardware — nobody else touches it** | Only M4 provisions the database and flashes sensor firmware. M2 writes `schema.prisma`; M4 runs it. |
| **M3 shares AI contracts at Day 1 end** | M2 cannot build the real proxy without exact request/response JSON. |
| **M1 uses mock data through Day 2** | Hardcode realistic JSON for the first 2 days, wire live APIs from Day 3. |
| **M2 stubs predict routes immediately** | Real AI proxy replaces stubs on Day 4. Demo never breaks if Python is down. |
| **Safety-first fallback is mandatory** | If the AI service is down during the demo, the dashboard shows "prediction unavailable, showing raw readings" — never a broken page. |
| **Hardware has a software backup plan** | Keep a small script that can push recorded sensor values into Blynk's virtual pins (or bypass Blynk and write straight to `sensor_readings`) if a physical node fails on stage. |
| **No shared file edits at the same time** | `package.json`, `.env`, `schema.prisma` — announce in team chat before editing. |
| **Quick syncs at the end of every day** | 10-minute check-in: what's done, what's blocked, what's needed from another member. |
| **Fresh seed before demo** | M4 re-runs the seed script a couple of hours before demo. |
| **Test the sensor-outage story on a real device** | Unplug a node mid-demo rehearsal at least once — that's the safety-critical path judges will probe. |
| **Be upfront about model simplicity** | Say plainly that the shortage/leak/pump-control models are explainable rule-based or statistical baselines, not deep learning — that's a strength in a 5-day build, not a weakness to hide. |

### Priority Cut List

```
MUST SHIP:
  ✅ Login / Signup (email + password)
  ✅ At least 1 live ESP32-S3 node feeding real data via Blynk
  ✅ Dashboard with zone overview + stress score
  ✅ Leak detection on the live flow rig
  ✅ Tank level trend chart

SHIP IF TIME:
  ⚡ Smart pump control (relay auto on/off) + action history
  ⚡ Alerts tab with history
  ⚡ Real-time push (WebSocket) instead of polling

STRETCH / DROP IF NEEDED:
  🔵 Battery-powered node (production-scale story, can be slides-only)
  🔵 Multi-zone comparison view
  🔵 Live deployment
```

---

## 15. Demo Script

```
TIME    SPEAKER   ACTION
────────────────────────────────────────────────────────────────────────
0:00    M4        "Water utilities usually find out about a shortage or
                   a leak after the damage is done. AquaWatch fuses live
                   sensor data, weather, and tank levels into one
                   dashboard that flags problems early — and can act on
                   them automatically."

0:20    M1        Open the site -> log in -> land on Dashboard ->
                  zone overview shows live stress scores

0:35    M4        Walks to the physical rig, opens the valve on the
                  leak-detection pipe live on stage

0:45    M3        "That flow reading is streaming through Blynk right
                   now. Our model watches for the exact signature of a
                   leak — continuous or abnormally high flow with no
                   matching demand — and flags it, with a confidence
                   score, not a black box."

1:05    M1        Dashboard updates: 🔴 High severity leak alert
                  appears on the zone card within seconds

1:25    M4        Pours water out of the tank rig, dropping the level
                  below the float switch's low mark

1:35    M3        "The ultrasonic sensor and float switch both confirm
                   the tank is running low. Our pump-control logic
                   picks that up along with the shortage forecast and
                   decides whether it's safe to turn the pump on."

1:55    M1        Dashboard shows the tank level drop and the pump
                  status flip from Off to On, with the trigger reason
                  shown ("tank_low")

2:15    M4        Relay clicks live on stage, pump switches on —
                  "That's a real relay, driven by a real prediction,
                   not a script for the demo."

2:35    M2        "Every prediction goes through our backend, which
                   has a safety-first fallback — if the AI service or
                   a sensor goes offline, the dashboard still shows
                   the raw readings, never a blank error."

2:50    M4        "Real hardware, a real Blynk pipeline, real models —
                   this is how we'd scale it to a whole district's tanks
                   and pumps. Four of us built this in five days.
                   Thank you."
────────────────────────────────────────────────────────────────────────
```

---

*💧 AquaWatch — Water Intelligence Platform*
*4-Member Team | 5 Days | Roles: Frontend · Backend · AI/ML · DevOps/IoT*
*"See the stress before the tap runs dry."*
