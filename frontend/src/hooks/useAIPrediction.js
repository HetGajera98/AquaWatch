'use client';

import { useState, useEffect, useRef } from 'react';
import { predictShortage, predictLeak, predictPump } from '@/lib/aiApi';

/**
 * Compute the average rate of change per data point from an array of { value } objects.
 * Returns the slope (positive = rising, negative = falling) or 0 if insufficient data.
 */
function computeTrend(history, valueKey = 'value') {
  if (!history || history.length < 2) return 0;
  const vals = history.map(h => h[valueKey] ?? 0);
  // Simple linear regression slope (rise per step)
  const n   = vals.length;
  const sum = vals.reduce((a, b) => a + b, 0);
  const sumX = (n * (n - 1)) / 2;
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  let sumXY = 0;
  for (let i = 0; i < n; i++) sumXY += i * vals[i];
  const slope = (n * sumXY - sumX * sum) / (n * sumX2 - sumX * sumX);
  return isFinite(slope) ? parseFloat(slope.toFixed(3)) : 0;
}

/**
 * Compute percentage of time flow > 0 from consumption history.
 * Falls back to 0.72 if data is unavailable.
 */
function computePctTimeFlowing(consumptionHistory) {
  if (!consumptionHistory || consumptionHistory.length === 0) return 0.72;
  const nonZero = consumptionHistory.filter(d => (d.consumption ?? 0) > 0).length;
  return parseFloat((nonZero / consumptionHistory.length).toFixed(2));
}

/**
 * useAIPrediction
 *
 * Calls all 3 AI endpoints in parallel based on zone detail data.
 * Falls back to the static mockData aiPrediction if the AI service is offline.
 * Computes trend values dynamically from real historical data instead of hardcoding.
 *
 * @param {object} zoneDetail  - Full zone detail object from useZoneDetail
 * @returns {{ prediction, loading, error, aiOnline }}
 */
export function useAIPrediction(zoneDetail) {
  const [prediction, setPrediction] = useState(zoneDetail?.aiPrediction ?? null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [aiOnline, setAiOnline]     = useState(true);
  const runId = useRef(0);

  useEffect(() => {
    if (!zoneDetail) { setLoading(false); return; }

    const id = ++runId.current;
    setLoading(true);
    setError(null);

    const { tank, sensors, pump, consumptionHistory } = zoneDetail;
    const flowSensor = sensors?.find(s => s.type === 'flow_rate' || s.type === 'flow');
    const hour = new Date().getHours();

    // ── Dynamically compute trend values from real historical data ──
    // tank_level_trend_7d: slope of tank level history (% per reading)
    const tankTrend = computeTrend(tank?.levelHistory ?? []);

    // avg_daily_consumption_l: computed from last 7 days of real data
    const last7Consumption = consumptionHistory?.slice(-7) ?? [];
    const avgConsumption = last7Consumption.length > 0
      ? last7Consumption.reduce((s, d) => s + (d.consumption ?? 0), 0) / last7Consumption.length
      : 1800;

    // consumption_trend_7d: compare first half vs second half of available history
    const consumptionTrend = computeTrend(
      (consumptionHistory ?? []).map(d => ({ value: d.consumption ?? 0 }))
    );

    // pct_time_flowing: proportion of consumption-data days where flow was non-zero
    const pctTimeFlowing = computePctTimeFlowing(consumptionHistory);

    // ── Build request payloads ──────────────────────────────
    const shortagePayload = {
      zone_id:                  zoneDetail.id,
      tank_level_pct:           tank?.levelPercent ?? 50,
      tank_level_trend_7d:      tankTrend,
      avg_daily_consumption_l:  avgConsumption,
      consumption_trend_7d:     consumptionTrend,
      rainfall_forecast_mm_7d:  (zoneDetail.weather?.rainfallMm ?? 0) * 7,
    };

    const leakPayload = {
      sensor_id:         flowSensor?.id ?? `${zoneDetail.id}-flow`,
      mean_flow_lpm:     flowSensor?.liveValue ?? 8,
      std_flow_lpm:      parseFloat((( flowSensor?.liveValue ?? 8) * 0.05 + 0.2).toFixed(2)) || 0.6,
      max_flow_lpm:      parseFloat(((flowSensor?.liveValue ?? 8) * 1.15).toFixed(2)),
      pct_time_flowing:  pctTimeFlowing,
      expected_flow_lpm: hour >= 22 || hour < 5 ? 0.5 : 6.0,
      hour_of_day:       hour,
      tank_level_pct:    tank?.levelPercent ?? 50,  // ← critical: lets AI reduce score for low-tank-normal-flow
    };

    const pumpPayload = {
      pump_id:            pump?.id ?? `${zoneDetail.id}-pump`,
      tank_level_pct:     tank?.levelPercent ?? 50,
      // floatSwitch removed from hardware — derive from tank level
      float_switch_full:  (tank?.levelPercent ?? 0) >= 90,
      shortage_severity:  'low',
      leak_detected:      false,
    };

    // ── Fire shortage + leak in parallel ──────────────────────
    Promise.allSettled([
      predictShortage(shortagePayload),
      predictLeak(leakPayload),
    ]).then(([shortageRes, leakRes]) => {
      if (id !== runId.current) return; // stale

      const shortage = shortageRes.status === 'fulfilled' ? shortageRes.value : null;
      const leak     = leakRes.status     === 'fulfilled' ? leakRes.value     : null;

      if (!shortage && !leak) {
        // Both failed → AI is offline, keep static fallback
        setAiOnline(false);
        setLoading(false);
        return;
      }

      // Update pump payload with real shortage/leak results
      pumpPayload.shortage_severity = shortage?.severity ?? 'low';
      pumpPayload.leak_detected     = leak?.is_leak ?? false;

      predictPump(pumpPayload)
        .then(pumpRes => {
          if (id !== runId.current) return;
          setAiOnline(true);
          setPrediction({
            shortage: shortage
              ? {
                  severity:    shortage.severity,
                  confidence:  shortage.stress_score / 100,
                  stressScore: shortage.stress_score,
                  topFactors:  shortage.top_factors ?? [],
                }
              : zoneDetail.aiPrediction?.shortage,
            leak: leak
              ? {
                  // Use the AI service's calculated probability directly
                  leakProbability: leak.leak_probability,
                  isLeak:          leak.is_leak,
                  sensorId:        leak.sensor_id,
                  reason:          leak.reason,
                }
              : zoneDetail.aiPrediction?.leak,
            pump: pumpRes
              ? { action: pumpRes.action, reason: pumpRes.reason }
              : zoneDetail.aiPrediction?.pump,
          });
        })
        .catch(() => {
          // Pump call failed — use shortage+leak results with static pump fallback
          if (id !== runId.current) return;
          setAiOnline(true);
          setPrediction({
            shortage: shortage
              ? { severity: shortage.severity, confidence: shortage.stress_score / 100, stressScore: shortage.stress_score, topFactors: shortage.top_factors ?? [] }
              : zoneDetail.aiPrediction?.shortage,
            leak: leak
              ? { 
                  leakProbability: leak.leak_probability, 
                  isLeak: leak.is_leak, 
                  sensorId: leak.sensor_id, 
                  reason: leak.reason 
                }
              : zoneDetail.aiPrediction?.leak,
            pump: zoneDetail.aiPrediction?.pump,
          });
        })
        .finally(() => { if (id === runId.current) setLoading(false); });
    });
  }, [zoneDetail?.id]); // re-run only if zone changes

  return { prediction, loading, error, aiOnline };
}
