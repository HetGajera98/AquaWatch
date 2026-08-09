# AquaWatch - AI Prompts for Backend Developer (Member 2)

Use these prompts with your AI coding assistant (like GitHub Copilot, Gemini, or ChatGPT) to quickly build out your assigned components. These prompts map exactly to the Hackathon Roadmap for Member 2.

## Day 1: Project Scaffold & Auth

**1. Express & Prisma Scaffold**
> "I am building the Node.js/Express backend for an IoT water monitoring platform called AquaWatch. Generate the initial project structure, `package.json` with dependencies (express, @prisma/client, bcrypt, jsonwebtoken, cors, dotenv), and the main `server.js` file with basic setup and error handling middleware. Also, provide the `tsconfig.json` if we're using TypeScript, or standard JS file structures."

**2. Prisma Schema Definition**
> "Based on the AquaWatch database schema requirements (Users, Zones, Sensors, Sensor Readings, Tanks, Tank Levels, Pumps, Pump Actions, Weather Data, Alerts), write the complete `schema.prisma` file for a PostgreSQL database. Ensure relationships (foreign keys) are correctly mapped."

**3. Authentication Routes & Middleware**
> "Create an Express router for authentication with two endpoints: POST `/api/auth/signup` and POST `/api/auth/login`. Use bcrypt to hash passwords and jsonwebtoken to generate a token on successful login. Then, create a JWT verification middleware that checks the 'Authorization' header and attaches the user ID to the request."

## Day 2: Core Endpoints & AI Stubs

**4. Core Data Endpoints**
> "Write Express routes using the Prisma client to fetch data for the AquaWatch dashboard. I need:
> 1. GET `/api/zones` (list all zones)
> 2. GET `/api/zones/:id` (zone details including sensors, tanks, and recent readings)
> 3. GET `/api/sensors/:id/readings` (time-series readings for a specific sensor)
> Ensure the routes are protected with the JWT middleware we created earlier."

**5. AI Route Stubs**
> "Create Express route stubs for our AI microservice proxies: POST `/api/internal/predict-shortage`, POST `/api/internal/predict-leak`, and POST `/api/internal/predict-pump-control`. For now, just return realistic hardcoded JSON responses so the frontend can start building without waiting for the actual Python AI service."

## Day 3: Background Jobs

**6. Blynk Polling Job**
> "Write a Node.js background job (using `node-cron` or `setInterval`) to poll the Blynk REST API every 10 seconds. It should fetch virtual pin values for flow and distance, calculate the tank level percentage based on distance, and save the data to the `sensor_readings` and `tank_levels` tables via Prisma. Include basic error handling for network timeouts."

**7. Weather API Job**
> "Write a Node.js scheduled job that runs every 30 minutes to fetch current weather data (temperature and rainfall) for a set of coordinates using a free weather API (like Open-Meteo). Save the fetched data to the `weather_data` table via Prisma."

## Day 4: AI Integration & Relay Control

**8. Real AI Proxies with Fallback Logic**
> "Update the AI proxy routes we stubbed out earlier to make real HTTP POST requests to a Python FastAPI service (the URL will be stored in `process.env.AI_SERVICE_URL`). Implement a safety-first fallback mechanism: if the Python service times out (e.g., after 3 seconds) or returns an error, catch the error, log it, and return a safe default response indicating the prediction is unavailable but still allowing the frontend to show raw data."

**9. Pump Control & Actions Logging**
> "Write the POST `/api/pumps/:id/control` endpoint to manually toggle a water pump. The endpoint should send an HTTP request to the Blynk REST API to update the relay's virtual pin (turning the pump ON or OFF). After a successful Blynk request, insert a log entry into the `pump_actions` table via Prisma."

**10. Alert Logging**
> "Create logic in our AI Proxy routes that listens for any 'High' severity water stress or leak predictions from the Python API. When one is detected, automatically insert an entry into the `alerts` table via Prisma."

## Day 5: Hardening & Integration

**11. Input Validation**
> "Add input validation to our Express routes (using a library like Zod or Joi). Specifically, protect the signup, login, and pump control endpoints to ensure the request body matches the expected schema before we attempt to query the database or call external APIs."
