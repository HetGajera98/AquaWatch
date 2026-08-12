// src/lib/aiProxy.js — Calls the FastAPI AI microservice
const axios = require('axios');

const AI_BASE = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const ai = axios.create({ baseURL: AI_BASE, timeout: 5000 });

/**
 * Compute a simple linear-regression slope over an array of numeric values.
 * Returns the slope per step (positive = rising, negative = falling).
 */
function linearSlope(values) {
  if (!values || values.length < 2) return 0;
  const n    = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  let sumXY = 0;
  for (let i = 0; i < n; i++) sumXY += i * values[i];
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return isFinite(slope) ? parseFloat(slope.toFixed(3)) : 0;
}

/**
 * Compute sample standard deviation of an array of numbers.
 * Returns 0 if fewer than 2 values.
 */
function stdDev(values) {
  if (!values || values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return parseFloat(Math.sqrt(variance).toFixed(3));
}

/**
 * Get all 3 predictions for a zone in parallel.
 * Falls back to null values if AI is offline — callers handle the fallback.
 *
 * @param {object} opts
 * @param {object}   opts.zone               - Prisma Zone object
 * @param {object}   opts.tank               - { levelPct: number }
 * @param {object}   opts.flowSensor         - { id, value } | null
 * @param {number}   opts.consumptionAvg     - Average daily consumption (L)
 * @param {number[]} opts.tankLevelHistory   - Array of recent tank level % readings (asc)
 * @param {number[]} opts.consumptionHistory - Array of daily consumption values (L/day, asc)
 * @param {number}   opts.rainfallForecastMm - Forecasted 7-day rainfall (mm)
 * @param {number[]} opts.recentFlowReadings - Short window of recent flow L/min readings (last ~10 min)
 */
async function getZonePredictions({
  zone,
  tank,
  flowSensor,
  consumptionAvg,
  tankLevelHistory   = [],
  consumptionHistory = [],
  rainfallForecastMm = 0,
  recentFlowReadings = [],
}) {
  const hour = new Date().getHours();

  // Compute real trend values from historical data
  const tankTrend        = linearSlope(tankLevelHistory);
  const consumptionTrend = linearSlope(consumptionHistory);

  // pct_time_flowing: fraction of days over past week that had any flow.
  // Default to a low value (0.2) when no history — don't assume continuous flow.
  const pctTimeFlowing = consumptionHistory.length > 0
    ? parseFloat((consumptionHistory.filter(v => v > 0).length / consumptionHistory.length).toFixed(2))
    : 0.2;

  // Compute real std and max from recent flow readings window if available.
  // Fall back to a reasonable spread (30% of mean) rather than artificially flat 5%
  // which makes every flow look like a steady leak.
  const currentFlow = flowSensor?.value ?? 0;
  const flowWindow  = recentFlowReadings.length >= 2 ? recentFlowReadings : null;
  const stdFlowLpm  = flowWindow
    ? stdDev(flowWindow)
    : parseFloat((Math.max(currentFlow * 0.30, 1.0)).toFixed(2));
  const maxFlowLpm  = flowWindow
    ? parseFloat(Math.max(...flowWindow).toFixed(2))
    : parseFloat((currentFlow * 1.20).toFixed(2));

  // expected_flow_lpm: use the zone's real 7-day average flow baseline (L/min)
  // derived from consumptionAvg (L/day) converted to L/min average.
  // This prevents false positives when the zone has a high normal flow rate
  // being compared against a hardcoded near-zero nighttime expected value.
  // A small nighttime discount (70%) is applied since demand is naturally lower,
  // but the baseline stays realistic relative to the zone's actual throughput.
  const avgFlowLpm       = consumptionAvg > 0 ? consumptionAvg / (24 * 60) : (currentFlow || 6.0);
  const isNightHour      = hour >= 22 || hour < 5;
  const expectedFlowLpm  = parseFloat((avgFlowLpm * (isNightHour ? 0.7 : 1.0)).toFixed(2));

  const shortagePayload = {
    zone_id:                 zone.id,
    tank_level_pct:          tank?.levelPct ?? 50,
    tank_level_trend_7d:     tankTrend,
    avg_daily_consumption_l: consumptionAvg ?? 1800,
    consumption_trend_7d:    consumptionTrend,
    rainfall_forecast_mm_7d: rainfallForecastMm,
  };

  const leakPayload = {
    sensor_id:         flowSensor?.id ?? `${zone.id}-flow`,
    mean_flow_lpm:     currentFlow,
    std_flow_lpm:      stdFlowLpm,
    max_flow_lpm:      maxFlowLpm,
    pct_time_flowing:  pctTimeFlowing,
    expected_flow_lpm: expectedFlowLpm,
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
