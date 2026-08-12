// src/routes/predict.js
// Exposes /api/predict/* — proxies to the Python FastAPI AI service with
// safety-first fallback so the dashboard never breaks if AI is offline.
//
// These routes are called by the frontend directly for on-demand predictions.
// The background aiScheduler also calls getZonePredictions() from lib/aiProxy.js
// for automated, periodic predictions.

const express = require('express');
const axios   = require('axios');
const { requireAuth } = require('../middleware/auth');

const router  = express.Router();
const AI_BASE = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const ai = axios.create({ baseURL: AI_BASE, timeout: 5000 });

// ── Fallback responses (shown when AI service is offline) ─────────
const FALLBACK_SHORTAGE = {
  available:   false,
  severity:    'unknown',
  stress_score: 0,
  message:     'AI prediction unavailable — showing raw sensor readings',
};

const FALLBACK_LEAK = {
  available:        false,
  is_leak:          false,
  leak_probability: 0,
  reason:           'AI prediction unavailable — monitoring raw flow readings',
};

const FALLBACK_PUMP = {
  available: false,
  action:    'off',
  reason:    'AI prediction unavailable — manual control only',
};

/** Safely call the AI service, return data or the given fallback */
async function safeAiCall(endpoint, payload, fallback) {
  try {
    const resp = await ai.post(endpoint, payload);
    return { ...resp.data, available: true };
  } catch (err) {
    const isOffline = !err.response; // no response = timeout / connection refused
    if (isOffline) {
      console.warn(`[AI Proxy] ${endpoint} — AI service offline, using fallback`);
    } else {
      console.error(`[AI Proxy] ${endpoint} — HTTP ${err.response?.status}:`, err.response?.data);
    }
    return fallback;
  }
}

// ── POST /api/predict/shortage ────────────────────────────────────
// Body: { zone_id, tank_level_pct, tank_level_trend_7d,
//         avg_daily_consumption_l, consumption_trend_7d, rainfall_forecast_mm_7d }
router.post('/shortage', requireAuth, async (req, res) => {
  const result = await safeAiCall('/predict-shortage', req.body, FALLBACK_SHORTAGE);
  return res.json(result);
});

// ── POST /api/predict/leak ────────────────────────────────────────
// Body: { sensor_id, mean_flow_lpm, std_flow_lpm, max_flow_lpm,
//         pct_time_flowing, expected_flow_lpm, hour_of_day }
router.post('/leak', requireAuth, async (req, res) => {
  const result = await safeAiCall('/predict-leak', req.body, FALLBACK_LEAK);
  return res.json(result);
});

// ── POST /api/predict/pump-control ───────────────────────────────
// Body: { pump_id, tank_level_pct, float_switch_full, shortage_severity, leak_detected }
router.post('/pump-control', requireAuth, async (req, res) => {
  const result = await safeAiCall('/predict-pump-control', req.body, FALLBACK_PUMP);
  return res.json(result);
});

module.exports = router;
