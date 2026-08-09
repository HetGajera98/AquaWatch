# AquaWatch - Backend Developer (Member 2) Task Tracker

> Use the **Prompt** blocks under each task — copy them into your AI assistant to generate the code.

---

## Day 1: Project Scaffold & Auth

- [ ] **Task 1** — Initialize Node.js project and install dependencies (`express`, `@prisma/client`, `bcrypt`, `jsonwebtoken`, `dotenv`, `cors`, etc.).
  - [ ] Create initial Express scaffold with basic error handling and middleware (CORS, JSON parsing).
  - 🤖 **Prompt 1 — Express & Prisma Scaffold:**
    > "I am building the Node.js/Express backend for an IoT water monitoring platform called AquaWatch. Generate the initial project structure, `package.json` with dependencies (express, @prisma/client, bcrypt, jsonwebtoken, cors, dotenv), and the main `server.js` file with basic setup and error handling middleware."

- [ ] **Task 2** — Author `schema.prisma` matching the database schema (Users, Zones, Sensors, Readings, Tanks, Tank Levels, Pumps, Pump Actions, Weather Data, Alerts).
  - [ ] Share Prisma schema with DevOps (Member 4) so they can provision and migrate the database.
  - [ ] Receive `DATABASE_URL`, `AI_SERVICE_URL`, and Blynk credentials from DevOps.
  - 🤖 **Prompt 2 — Prisma Schema Definition:**
    > "Based on the AquaWatch database schema requirements (Users, Zones, Sensors, Sensor Readings, Tanks, Tank Levels, Pumps, Pump Actions, Weather Data, Alerts), write the complete `schema.prisma` file for a PostgreSQL database. Ensure relationships (foreign keys) are correctly mapped."

- [ ] **Task 3** — Implement Authentication routes (`/api/auth/signup` and `/api/auth/login`).
  - [ ] Implement password hashing (bcrypt) and JWT generation on login.
  - [ ] Create JWT verification middleware to protect dashboard and data routes.
  - [ ] Handshake: Obtain exact request/response JSON contracts from AI/ML (Member 3) for all 3 predict endpoints by end of Day 1.
  - 🤖 **Prompt 3 — Auth Routes & Middleware:**
    > "Create an Express router for authentication with two endpoints: POST `/api/auth/signup` and POST `/api/auth/login`. Use bcrypt to hash passwords and jsonwebtoken to generate a token on successful login. Then, create a JWT verification middleware that checks the 'Authorization' header and attaches the user ID to the request."

---

## Day 2: Core API Endpoints & Stubs

- [ ] **Task 4** — Implement read endpoints for Zones, Sensors, Tanks, Weather, Alerts, and Pumps.
  - [ ] GET `/api/zones` — list all zones with latest stress score.
  - [ ] GET `/api/zones/:id` — zone detail with sensors, tanks, pump status, recent readings.
  - [ ] GET `/api/sensors/:id/readings` — time-series readings for a sensor.
  - [ ] GET `/api/alerts` — list alerts, filterable by zone/type/severity.
  - [ ] GET `/api/pumps/:id/actions` — pump action history for a tank.
  - 🤖 **Prompt 4 — Core Data Endpoints:**
    > "Write Express routes using the Prisma client to fetch data for the AquaWatch dashboard. I need:
    > 1. GET `/api/zones` (list all zones)
    > 2. GET `/api/zones/:id` (zone details including sensors, tanks, and recent readings)
    > 3. GET `/api/sensors/:id/readings` (time-series readings for a specific sensor)
    > Ensure the routes are protected with the JWT middleware."

- [ ] **Task 5** — Implement stub routes for AI proxies returning hardcoded mock responses.
  - [ ] POST `/api/internal/predict-shortage` (stub)
  - [ ] POST `/api/internal/predict-leak` (stub)
  - [ ] POST `/api/internal/predict-pump-control` (stub)
  - [ ] Handshake: Share the full list of API routes, methods, and payload shapes with Frontend (Member 1) by start of Day 2.
  - 🤖 **Prompt 5 — AI Route Stubs:**
    > "Create Express route stubs for our AI microservice proxies: POST `/api/internal/predict-shortage`, POST `/api/internal/predict-leak`, and POST `/api/internal/predict-pump-control`. For now, just return realistic hardcoded JSON responses so the frontend can start building without waiting for the actual Python AI service."

---

## Day 3: Background Jobs & External APIs

- [ ] **Task 6** — Implement Blynk REST API polling job.
  - [ ] Fetch latest virtual pin values for each device every ~10 seconds.
  - [ ] Convert distance readings to tank level percentages.
  - [ ] Write new rows to `sensor_readings` and `tank_levels` in the database.
  - 🤖 **Prompt 6 — Blynk Polling Job:**
    > "Write a Node.js background job (using `node-cron` or `setInterval`) to poll the Blynk REST API every 10 seconds. It should fetch virtual pin values for flow and distance, calculate the tank level percentage based on distance, and save the data to the `sensor_readings` and `tank_levels` tables via Prisma. Include basic error handling for network timeouts."

- [ ] **Task 7** — Implement scheduled Weather fetching job.
  - [ ] Fetch rainfall and temperature forecast from OpenWeatherMap / Open-Meteo per zone every ~30 minutes.
  - [ ] Save results into `weather_data` table.
  - 🤖 **Prompt 7 — Weather API Job:**
    > "Write a Node.js scheduled job that runs every 30 minutes to fetch current weather data (temperature and rainfall) for a set of coordinates using a free weather API (like Open-Meteo). Save the fetched data to the `weather_data` table via Prisma."

---

## Day 4: AI Proxy Integration & Relay Control

- [ ] **Task 8** — Replace AI stub routes with real HTTP proxy calls to the Python AI service.
  - [ ] Implement safety-first fallback: if AI service is down or times out (>3s), return a safe default response so the dashboard never shows a blank error.
  - 🤖 **Prompt 8 — Real AI Proxies with Fallback:**
    > "Update the AI proxy routes we stubbed out earlier to make real HTTP POST requests to a Python FastAPI service (URL from `process.env.AI_SERVICE_URL`). Implement a safety-first fallback: if the Python service times out (after 3 seconds) or returns an error, catch it, log it, and return a safe default response indicating prediction is unavailable but still allowing the frontend to show raw data."

- [ ] **Task 9** — Implement manual relay control endpoint and pump action logging.
  - [ ] POST `/api/pumps/:id/control` — send relay command to Blynk Cloud (on/off).
  - [ ] Log every pump state change into the `pump_actions` table.
  - 🤖 **Prompt 9 — Pump Control & Actions Logging:**
    > "Write the POST `/api/pumps/:id/control` endpoint to manually toggle a water pump. The endpoint should send an HTTP request to the Blynk REST API to update the relay's virtual pin. After a successful Blynk request, insert a log entry into the `pump_actions` table via Prisma."

- [ ] **Task 10** — Implement automatic alert logging for high-severity AI predictions.
  - [ ] On any 'High' severity result from `/predict-shortage` or `/predict-leak`, auto-insert a row into the `alerts` table.
  - 🤖 **Prompt 10 — Alert Logging:**
    > "Create logic in our AI Proxy routes that listens for any 'High' severity water stress or leak predictions from the Python API. When one is detected, automatically insert an entry into the `alerts` table via Prisma."

- [ ] Verify fallback activates cleanly when Python AI service is stopped.

---

## Day 5: Integration & Polish

- [ ] **Task 11** — Add input validation across all routes.
  - [ ] Protect signup, login, and pump control endpoints with schema validation (Zod or Joi).
  - 🤖 **Prompt 11 — Input Validation:**
    > "Add input validation to our Express routes using Zod or Joi. Specifically, protect the signup, login, and pump control endpoints to ensure the request body matches the expected schema before querying the database or calling external APIs."

- [ ] Conduct end-to-end integration testing with Frontend, AI, and DevOps layers.
- [ ] Harden error handling across all routes.
- [ ] Participate in the full browser + live-hardware flow test.
- [ ] Help DevOps debug any live data flow issues during the final demo rehearsal.

---

*💧 AquaWatch | Member 2 — Backend Developer | 5 Days*
