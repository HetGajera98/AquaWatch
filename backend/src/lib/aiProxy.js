// src/lib/aiProxy.js — Calls the FastAPI AI microservice
const axios = require('axios');

const AI_BASE = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const ai = axios.create({ baseURL: AI_BASE, timeout: 5000 });

/**
 * Get all 3 predictions for a zone in parallel.
 * Falls back to null values if AI is offline — callers handle the fallback.
 */
async function getZonePredictions({ zone, tank, flowSensor, consumptionAvg }) {
  const hour = new Date().getHours();

  const shortagePayload = {
    zone_id:                 zone.id,
    tank_level_pct:          tank?.levelPct ?? 50,
    tank_level_trend_7d:     -2.0,
    avg_daily_consumption_l: consumptionAvg ?? 1800,
    consumption_trend_7d:    5.0,
    rainfall_forecast_mm_7d: 3.0,
  };

  const leakPayload = {
    sensor_id:         flowSensor?.id ?? `${zone.id}-flow`,
    mean_flow_lpm:     flowSensor?.value ?? 8,
    std_flow_lpm:      parseFloat(((flowSensor?.value ?? 8) * 0.05 + 0.2).toFixed(2)),
    max_flow_lpm:      parseFloat(((flowSensor?.value ?? 8) * 1.15).toFixed(2)),
    pct_time_flowing:  0.72,
    expected_flow_lpm: hour >= 22 || hour < 5 ? 0.5 : 6.0,
    hour_of_day:       hour,
  };

  const [shortageRes, leakRes] = await Promise.allSettled([
    ai.post('/predict-shortage', shortagePayload),
    ai.post('/predict-leak',     leakPayload),
  ]);

  const shortage = shortageRes.status === 'fulfilled' ? shortageRes.value.data : null;
  const leak     = leakRes.status     === 'fulfilled' ? leakRes.value.data     : null;

  const pumpPayload = {
    pump_id:           `${zone.id}-pump`,
    tank_level_pct:    tank?.levelPct ?? 50,
    float_switch_full: (tank?.levelPct ?? 50) >= 90,
    shortage_severity: shortage?.severity ?? 'low',
    leak_detected:     leak?.is_leak ?? false,
  };

  const pumpRes = await ai.post('/predict-pump-control', pumpPayload).catch(() => null);
  const pump = pumpRes?.data ?? null;

  return { shortage, leak, pump };
}

module.exports = { getZonePredictions };
