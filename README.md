# 💧 AquaWatch — Water Intelligence Platform

> See the stress before the tap runs dry.

AquaWatch fuses live IoT sensor telemetry (tank level, flow, float-switch state) with weather forecasts to predict water shortages, detect leaks, and automatically drive pump control — giving operators one live dashboard instead of a dry tap they discover too late.

Built in **5 days** by a **4-member team** (Frontend · Backend · AI/ML · DevOps/IoT).

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Features](#features)
- [IoT Hardware](#iot-hardware)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Team](#team)
- [Project Scope (MVP)](#project-scope-mvp)

---

## Problem

Water utilities and households usually find out about a shortage or a leak only **after** the damage is visible — a dry tap, an overflowing tank, a pump left running into an empty line.

The signals that could warn us early already exist — falling tank levels, abnormal flow patterns, rainfall deficits, rising consumption — but **nobody fuses them into a single early-warning picture**, and even when a problem is spotted, there's rarely a system that can safely act on it.

## Solution

AquaWatch is a single operator-facing web platform that:

- Collects **real-time telemetry** from custom **ESP8266** IoT nodes (tank level, flow rate, float-switch status)
- **Fuses** that telemetry with weather forecasts and consumption trends
- Runs an **AI engine** that predicts shortage risk, flags leaks from abnormal flow signatures, and decides pump actions
- Surfaces a **live water-stress score** (Low / Medium / High) per zone with explainable, sensor-backed alerts
- Closes the loop with **automated pump control** via a physical relay — while a safety-first fallback ensures the dashboard never goes blank if the AI service is briefly unavailable

## Tech Stack

| Layer               | Technology                                                            |
| ------------------- | ----------------------------------------------------------------------|
| **Frontend**        | React 18 + TypeScript, Tailwind CSS, React Query                      |
| **Backend**         | Node.js + Express, Prisma ORM, JWT Auth                               |
| **AI / ML Service** | Python FastAPI + Uvicorn, explainable rule-based / statistical models |
| **Database**        | PostgreSQL                                                            |
| **IoT Layer**       | ESP8266 nodes over Wi-Fi → Blynk Cloud                                |
| **Weather**         | Public weather API (OpenWeatherMap / Open-Meteo)                      |

**Key design decision:** Node.js is the single gateway for every frontend request. The Python AI service is an internal microservice the frontend never calls directly — Node.js proxies every prediction call and always has a safe fallback, so if the AI service is briefly down, the dashboard shows raw sensor readings instead of breaking.

## System Architecture

```
Frontend (React 18 + TS)  <->  Node.js Backend (Express, Prisma, JWT)  <->  Python AI Microservice (FastAPI)
        |                              |         ^  
        v                              v         |  
  Browser State                  PostgreSQL   Blynk Cloud  <-- Wi-Fi --  ESP8266 Node
 (React Query cache,          (Users, Sensors,  (virtual pins,          (YF-S201 flow,
   stored JWT)                 Readings, Alerts)  relay commands)        JSN-SR04T level,
                                                                          float switch, relay)
```

**End-to-end flow:** sensor reading → Blynk Cloud → backend polling job writes to Postgres → weather data merged in on a schedule → AI predicts shortage / leak / pump action → high-severity results raise an alert with the triggering reading shown → pump decisions are sent back through Blynk to actuate the relay → every alert and pump action is logged.

## Features

- 🔐 **Login / Signup** — lightweight operator account (email + password, JWT session)
- 📡 **Live Sensor Feed** — tank level, flow rate, float-switch status from deployed hardware
- 🌦️ **Weather Ingestion** — rainfall/temperature forecast merged with sensor + consumption data
- 🤖 **AI Prediction** — shortage forecasting, leak detection, pump-control decisioning
- 🚦 **Water Stress Score** — Low / Medium / High, per zone, with the exact triggering reading shown
- 📈 **Dashboards** — real-time and historical charts (tank level, flow, consumption, pump status)
- 🔧 **Smart Pump Control** — automatic relay actuation, with manual override available

## IoT Hardware

| Component           | Role                                                |
| -------------------- | --------------------------------------------------- |
| **ESP8266**          | Wi-Fi microcontroller node — the brain of each rig  |
| **YF-S201**           | Flow sensor — detects leak signatures                |
| **JSN-SR04T**         | Waterproof ultrasonic sensor — measures tank level    |
| **Float Switch**      | Backup low/full-level confirmation                    |
| **1-Channel Relay**   | Drives the pump on/off                                |

Sensor data is published over Wi-Fi to **Blynk Cloud** via virtual pins; a scheduled polling job reads the latest values into PostgreSQL. Blynk also doubles as a backup mobile view and manual relay override — the custom web dashboard remains the primary operator surface.

## Database Schema

Core tables: `users`, `zones`, `sensors`, `sensor_readings`, `tanks`, `tank_levels`, `pumps`, `pump_actions`, `weather_data`, `consumption_records`, `alerts`.

Sensor and tank data are stored as time-series (`sensor_readings`, `tank_levels`), with `alerts` and `pump_actions` logging every AI-triggered event against the sensor, zone, and timestamp that caused it — full traceability from raw reading to automated action.

## API Reference

| Method | Route                                 | Purpose                                                                          |
| ------ | -------------------------------------- | --------------------------------------------------------------------------------- |
| POST   | `/api/auth/signup`                     | Create operator account                                                          |
| POST   | `/api/auth/login`                      | Log in, returns JWT                                                              |
| GET    | `/api/zones`                           | List zones with latest stress score                                              |
| GET    | `/api/zones/:id`                       | Zone detail — sensors, tank, pump status, recent readings                        |
| GET    | `/api/sensors/:id/readings`            | Time-series readings for a sensor                                                |
| GET    | `/api/alerts`                          | List alerts, filterable by zone/type/severity                                    |
| GET    | `/api/pumps/:id/actions`               | Pump action history for a tank                                                   |
| POST   | `/api/pumps/:id/control`               | Manual override — sends relay command via Blynk                                  |
| POST   | `/api/internal/predict-shortage`       | Proxies to AI service — tank level + consumption + weather → stress score        |
| POST   | `/api/internal/predict-leak`           | Proxies to AI service — flow window → leak probability                          |
| POST   | `/api/internal/predict-pump-control`   | Proxies to AI service — tank level + float switch + risk flags → pump decision   |

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd aquawatch

# 2. Backend
cd backend
npm install
cp .env.example .env        # set DATABASE_URL, JWT_SECRET, AI_SERVICE_URL, BLYNK_TOKEN
npx prisma migrate dev
npm run dev

# 3. AI Microservice
cd ../ai
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 4. Frontend
cd ../frontend
npm install
cp .env.example .env         # set VITE_API_URL
npm run dev
```

> Requires PostgreSQL running locally, a Blynk project/device template configured for your ESP8266 node(s), and a weather API key (OpenWeatherMap or Open-Meteo).

## Team

| Role                      | Owns                                                       |
| -------------------------- | ----------------------------------------------------------- |
| **Frontend Developer**     | Login/signup, dashboard, charts, alerts UI                  |
| **Backend Developer**      | Auth, APIs, Blynk polling, AI proxy, alert logging          |
| **AI / ML Engineer**       | Shortage forecasting, leak detection, pump-control logic    |
| **DevOps / IoT Engineer**  | Database, ESP8266 firmware, Blynk setup, deployment         |

## Project Scope (MVP)

**Must Ship**

- Login / Signup
- 1+ live ESP8266 node via Blynk
- Dashboard: zone overview + stress score
- Leak detection on the live rig
- Tank level trend chart

**Ship If Time**

- Smart pump control + action history
- Alerts tab with history
- Real-time push (WebSocket)

**Stretch / Drop**

- Battery-powered node
- Multi-zone comparison view
- Live deployment

---

*AquaWatch — Water Intelligence Platform*
*"See the stress before the tap runs dry."*
