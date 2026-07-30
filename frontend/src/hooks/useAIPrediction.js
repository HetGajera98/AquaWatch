'use client';

import { useState, useEffect, useRef } from 'react';
import { predictShortage, predictLeak, predictPump } from '@/lib/aiApi';

/**
 * useAIPrediction
 *
 * Calls all 3 AI endpoints in parallel based on zone detail data.
 * Falls back to the static mockData aiPrediction if the AI service is offline.
 *
 * @param {object} zoneDetail  - Full zone detail object from mockData
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

    const { tank, sensors, pump } = zoneDetail;
    const flowSensor = sensors?.find(s => s.type === 'flow');
    const hour = new Date().getHours();

    // ── Build request payloads ──────────────────────────────
    const shortagePayload = {
      zone_id:                  zoneDetail.id,
      tank_level_pct:           tank?.levelPercent ?? 50,
      tank_level_trend_7d:      -2.1,           // approximate; real backend would compute from DB
      avg_daily_consumption_l:  zoneDetail.consumptionHistory
        ? zoneDetail.consumptionHistory.slice(-7).reduce((s, d) => s + d.consumption, 0) / 7
        : 1800,
      consumption_trend_7d:     8.0,
      rainfall_forecast_mm_7d:  (zoneDetail.weather?.rainfallMm ?? 0) * 7,
    };

    const leakPayload = {
      sensor_id:         flowSensor?.id ?? `${zoneDetail.id}-flow`,
      mean_flow_lpm:     flowSensor?.liveValue ?? 8,
      std_flow_lpm:      parseFloat((flowSensor?.liveValue * 0.05 + 0.2).toFixed(2)) || 0.6,
      max_flow_lpm:      parseFloat(((flowSensor?.liveValue ?? 8) * 1.15).toFixed(2)),
      pct_time_flowing:  0.72,
      expected_flow_lpm: hour >= 22 || hour < 5 ? 0.5 : 6.0,
      hour_of_day:       hour,
    };

    const pumpPayload = {
      pump_id:            pump?.id ?? `${zoneDetail.id}-pump`,
      tank_level_pct:     tank?.levelPercent ?? 50,
      float_switch_full:  zoneDetail.floatSwitch === 'full',
      shortage_severity:  'low',   // updated after shortage result arrives
      leak_detected:      false,   // updated after leak result arrives
    };

    // ── Fire all three in parallel ──────────────────────────
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
              ? { severity: shortage.severity, confidence: shortage.stress_score / 100, stressScore: shortage.stress_score }
              : zoneDetail.aiPrediction?.shortage,
            leak: leak
              ? { leakProbability: leak.leak_probability, isLeak: leak.is_leak, sensorId: leak.sensor_id, reason: leak.reason }
              : zoneDetail.aiPrediction?.leak,
            pump: zoneDetail.aiPrediction?.pump,
          });
        })
        .finally(() => { if (id === runId.current) setLoading(false); });
    });
  }, [zoneDetail?.id]); // re-run only if zone changes

  return { prediction, loading, error, aiOnline };
}
