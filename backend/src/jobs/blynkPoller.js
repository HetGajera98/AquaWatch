// Polls Blynk Cloud REST API for the latest sensor readings from the NodeMCU node
// and persists them into sensor_readings.
//
// Token: set in BLYNK_AUTH_TOKEN
// Template: TMPL3j0FxQEvH — "smart water management"
//
// Confirmed NodeMCU virtual pin mapping:
//   V0 = Water Level (%)          — tank fill percentage
//   V1 = Water Distance (cm)      — JSN-SR04T ultrasonic raw reading
//   V2 = Flow Rate (L/min)        — YF-S201 flow sensor
//   V3 = Pump Control (0/1)       — relay output (backend writes, NodeMCU reads)
//   V4 = Total Water (L)          — cumulative litre counter on NodeMCU
//
// If device is offline Blynk returns 400 — the poller logs a warning and
// skips that cycle. It resumes automatically when the NodeMCU comes back online.

const axios  = require('axios');
const prisma = require('../lib/prisma');

const POLL_INTERVAL_MS = parseInt(process.env.BLYNK_POLL_INTERVAL_MS) || 10_000;
const BLYNK_TOKEN      = process.env.BLYNK_AUTH_TOKEN;
const BLYNK_BASE       = 'https://blynk.cloud/external/api';
const TANK_HEIGHT_CM   = parseFloat(process.env.TANK_HEIGHT_CM) || 100;

let _deviceWasOffline = false; // track to log "came back online" once

/** Convert ultrasonic distance (cm) → tank fill % */
function distanceToLevelPct(distanceCm) {
  const waterDepth = Math.max(0, TANK_HEIGHT_CM - distanceCm);
  return parseFloat(Math.min(100, (waterDepth / TANK_HEIGHT_CM) * 100).toFixed(2));
}

/** Check if the NodeMCU is connected to Blynk */
async function isDeviceOnline() {
  try {
    const resp = await axios.get(
      `${BLYNK_BASE}/isHardwareConnected?token=${BLYNK_TOKEN}`,
      { timeout: 5000 }
    );
    return resp.data === true;
  } catch {
    return false;
  }
}

/** Read a single virtual pin value from Blynk Cloud */
async function readPin(virtualPin) {
  const url = `${BLYNK_BASE}/get?token=${BLYNK_TOKEN}&${virtualPin}`;
  const resp = await axios.get(url, { timeout: 5000 });
  const raw = Array.isArray(resp.data) ? resp.data[0] : resp.data;
  return parseFloat(raw);
}

/** Write relay command to Blynk Cloud */
async function writePin(virtualPin, value) {
  const url = `${BLYNK_BASE}/update?token=${BLYNK_TOKEN}&${virtualPin}=${value}`;
  await axios.get(url, { timeout: 5000 });
}

/** One poll cycle — iterate all sensors, write readings to DB */
async function pollOnce() {
  if (!BLYNK_TOKEN) return;

  // Skip if ESP32 is offline — don't write stale/error values
  const online = await isDeviceOnline();
  if (!online) {
    if (!_deviceWasOffline) {
      console.warn('[Blynk] ⚠️  NodeMCU device is offline — polling paused until reconnected');
      _deviceWasOffline = true;
    }
    return;
  }

  if (_deviceWasOffline) {
    console.log('[Blynk] ✅ NodeMCU device came back online — resuming polling');
    _deviceWasOffline = false;
  }

  try {
    const sensors = await prisma.sensor.findMany({
      select: { id: true, type: true, blynkVirtualPin: true },
    });

    for (const sensor of sensors) {
      try {
        const raw = await readPin(sensor.blynkVirtualPin);
        if (isNaN(raw)) continue;

        let value, unit;

        switch (sensor.type) {
          case 'TANK_LEVEL':
            // If ESP32 sends distance in cm → uncomment next line:
            // value = distanceToLevelPct(raw);
            // If ESP32 sends level directly in % (most common):
            value = parseFloat(Math.min(100, Math.max(0, raw)).toFixed(2));
            unit  = '%';
            break;
          case 'FLOW_RATE':
            value = parseFloat(Math.max(0, raw).toFixed(3));
            unit  = 'L/min';
            break;
          case 'FLOAT_SWITCH':
            value = raw >= 1 ? 1 : 0;
            unit  = 'boolean';
            break;
          default:
            continue;
        }

        await prisma.sensorReading.create({
          data: { sensorId: sensor.id, value, unit },
        });

        console.log(`[Blynk] 📡 ${sensor.type} (${sensor.blynkVirtualPin}) = ${value} ${unit}`);
      } catch (sensorErr) {
        // 400 = pin exists but no data yet; 404 = pin not configured
        const status = sensorErr.response?.status;
        if (status === 400) {
          console.warn(`[Blynk] ${sensor.blynkVirtualPin} returned 400 — pin has no data yet`);
        } else {
          console.error(`[Blynk] Failed pin ${sensor.blynkVirtualPin}:`, sensorErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[Blynk] Poll cycle error:', err.message);
  }
}

/** Start the polling loop */
function startBlynkPoller() {
  if (!BLYNK_TOKEN) {
    console.warn('[Blynk] BLYNK_AUTH_TOKEN not set — Blynk polling disabled');
    return null;
  }

  console.log(`[Blynk] ✅ Token loaded (TMPL3j0FxQEvH — smart water management)`);
  console.log(`[Blynk] Polling every ${POLL_INTERVAL_MS / 1000}s — waiting for NodeMCU to come online...`);
  pollOnce();
  return setInterval(pollOnce, POLL_INTERVAL_MS);
}

module.exports = { startBlynkPoller, writePin };
