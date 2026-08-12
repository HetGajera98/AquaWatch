// src/routes/devices.js
// GET  /api/devices/live   — fetches live pin values directly from Blynk Cloud
// POST /api/devices/pump   — sends relay command via Blynk V3
//
// Confirmed NodeMCU pin mapping:
//   V0 = Water Level (%)          — tank fill percentage
//   V2 = Flow Rate (L/min)        — YF-S201 flow sensor
//   V3 = Pump Control (0/1)       — relay output (backend writes, NodeMCU reads)
//   V4 = Total Water (L)          — cumulative litre counter on NodeMCU

const express = require('express');
const axios   = require('axios');
const prisma  = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router     = express.Router();
const BLYNK_BASE = 'https://blynk.cloud/external/api';
const TOKEN      = process.env.BLYNK_AUTH_TOKEN;
const RELAY_PIN  = process.env.BLYNK_RELAY_PIN || 'V3';

/** Read a virtual pin value; returns NaN on any error */
async function readPin(pin) {
  try {
    const resp = await axios.get(
      `${BLYNK_BASE}/get?token=${TOKEN}&${pin}`,
      { timeout: 5000 }
    );
    const raw = Array.isArray(resp.data) ? resp.data[0] : resp.data;
    return parseFloat(raw);
  } catch {
    return NaN;
  }
}

/** Check whether the NodeMCU is currently connected to Blynk */
async function isOnline() {
  try {
    const resp = await axios.get(
      `${BLYNK_BASE}/isHardwareConnected?token=${TOKEN}`,
      { timeout: 5000 }
    );
    return resp.data === true;
  } catch {
    return false;
  }
}

// ── GET /api/devices/live ─────────────────────────────────────────────
// Response shape:
// {
//   online: boolean,
//   waterLevelPct: number,   // V0 — tank fill %
//   flowRateLpm: number,     // V2 — YF-S201 L/min
//   pumpStatus: 'on'|'off',  // latest DB pump action state
//   totalWaterL: number,     // V4 — cumulative litres from NodeMCU
//   ts: string,
// }
router.get('/live', requireAuth, async (req, res) => {
  if (!TOKEN) {
    return res.json({
      online: false, waterLevelPct: 0, distanceCm: 0,
      flowRateLpm: 0, pumpStatus: 'off', totalWaterL: 0,
      ts: new Date().toISOString(),
      error: 'BLYNK_AUTH_TOKEN not configured',
    });
  }

  // Fire all Blynk reads in parallel for speed
  const [online, v0Raw, v2Raw, v4Raw] = await Promise.all([
    isOnline(),
    readPin('V0'),  // Water Level %
    readPin('V2'),  // Flow Rate L/min
    readPin('V4'),  // Total Water L
  ]);

  const waterLevelPct = isNaN(v0Raw)
    ? 0
    : parseFloat(Math.min(100, Math.max(0, v0Raw)).toFixed(2));

  const flowRateLpm = isNaN(v2Raw)
    ? 0
    : parseFloat(Math.max(0, v2Raw).toFixed(3));

  const totalWaterL = isNaN(v4Raw)
    ? 0
    : parseFloat(Math.max(0, v4Raw).toFixed(1));

  // Latest pump state from DB (most reliable source of truth)
  let pumpStatus = 'off';
  try {
    const latest = await prisma.pumpAction.findFirst({
      orderBy: { triggeredAt: 'desc' },
    });
    if (latest) pumpStatus = latest.state === 'ON' ? 'on' : 'off';
  } catch { /* DB may not be running — ignore */ }

  return res.json({
    online,
    waterLevelPct,
    flowRateLpm,
    totalWaterL,
    pumpStatus,
    ts: new Date().toISOString(),
  });
});

// ── POST /api/devices/pump ─────────────────────────────────────────────
// Body: { action: "on" | "off" }
// Writes V3 relay command to Blynk and records action in DB.
router.post('/pump', requireAuth, async (req, res) => {
  const { action } = req.body;
  if (!action || !['on', 'off'].includes(action))
    return res.status(400).json({ error: 'action must be "on" or "off"' });

  if (!TOKEN)
    return res.status(503).json({ error: 'BLYNK_AUTH_TOKEN not configured' });

  const blynkValue = action === 'on' ? 1 : 0;

  // Send relay command to Blynk V3
  try {
    await axios.get(
      `${BLYNK_BASE}/update?token=${TOKEN}&${RELAY_PIN}=${blynkValue}`,
      { timeout: 5000 }
    );
    console.log(`[Devices] Pump relay ${RELAY_PIN} → ${blynkValue} (${action.toUpperCase()}) — sent to NodeMCU`);
  } catch (e) {
    console.error('[Devices] Blynk relay write failed:', e.message);
    // Still record intent in DB even if Blynk call fails
  }

  // Persist to DB (first available tank — Devices page is hardware-centric)
  try {
    const tank = await prisma.tank.findFirst();
    if (tank) {
      await prisma.pumpAction.create({
        data: {
          tankId: tank.id,
          state:  action.toUpperCase(),
          reason: 'manual_override',
          source: 'MANUAL',
        },
      });
    }
  } catch (e) {
    console.warn('[Devices] Could not persist pump action to DB:', e.message);
  }

  return res.json({
    action,
    relay:    RELAY_PIN,
    value:    blynkValue,
    ts:       new Date().toISOString(),
  });
});

module.exports = router;
