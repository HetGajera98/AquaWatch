// src/jobs/aiScheduler.js
// Runs a periodic AI prediction cycle for every zone:
//   1. Fetches latest sensor readings for the zone
//   2. Calls the Python AI service (shortage + leak + pump-control)
//   3. Logs any HIGH-severity results as Alerts in the DB
//   4. Fires automatic pump relay commands via Blynk if pump action changes

const axios  = require('axios');
const prisma = require('../lib/prisma');
const { getZonePredictions } = require('../lib/aiProxy');

const CYCLE_INTERVAL_MS = parseInt(process.env.AI_CYCLE_INTERVAL_MS) || 60_000; // 1 min
const BLYNK_TOKEN       = process.env.BLYNK_AUTH_TOKEN;
const BLYNK_BASE        = 'https://blynk.cloud/external/api';
const BLYNK_RELAY_PIN   = process.env.BLYNK_RELAY_PIN || 'V3'; // V3 = pump relay

/** Send relay command to Blynk Cloud */
async function setRelay(value) {
  if (!BLYNK_TOKEN) return;
  const url = `${BLYNK_BASE}/update?token=${BLYNK_TOKEN}&${BLYNK_RELAY_PIN}=${value}`;
  await axios.get(url, { timeout: 5000 });
}

/** Latest sensor reading for a sensor type within a tank */
async function latestValue(sensorId) {
  if (!sensorId) return 0;
  const r = await prisma.sensorReading.findFirst({
    where:   { sensorId },
    orderBy: { recordedAt: 'desc' },
  });
  return r?.value ?? 0;
}

/** One prediction cycle for all zones */
async function runPredictionCycle() {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        tanks: { include: { sensors: true, pumpActions: { orderBy: { triggeredAt: 'desc' }, take: 1 } } },
        weather: { orderBy: { forecastFor: 'desc' }, take: 1 },
      },
    });

    for (const zone of zones) {
      const tank       = zone.tanks[0];
      if (!tank) continue;

      const tankSensor  = tank.sensors.find(s => s.type === 'TANK_LEVEL');
      const flowSensor  = tank.sensors.find(s => s.type === 'FLOW_RATE');
      const floatSensor = tank.sensors.find(s => s.type === 'FLOAT_SWITCH');

      const tankLevel  = await latestValue(tankSensor?.id);
      const flowValue  = await latestValue(flowSensor?.id);

      // Fetch last 10 min of flow readings for real std/max computation
      const recentFlowReadings = flowSensor ? (await prisma.sensorReading.findMany({
        where:   { sensorId: flowSensor.id, recordedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
        orderBy: { recordedAt: 'asc' },
        select:  { value: true },
      })).map(r => r.value) : [];
      // Fetch last 7 days of tank level readings for trend computation
      const tankLevelReadings = tankSensor ? await prisma.sensorReading.findMany({
        where:   { sensorId: tankSensor.id, recordedAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        orderBy: { recordedAt: 'asc' },
        select:  { value: true },
      }) : [];
      const tankLevelHistory = tankLevelReadings.map(r => r.value);

      // Fetch 7-day consumption averages from flow sensor
      const consumptionHistory = [];
      if (flowSensor) {
        for (let d = 6; d >= 0; d--) {
          const start = new Date(Date.now() - d * 86400000);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start); end.setHours(23, 59, 59, 999);
          const agg = await prisma.sensorReading.aggregate({
            where: { sensorId: flowSensor.id, recordedAt: { gte: start, lte: end } },
            _avg: { value: true }, _count: { value: true },
          });
          if (agg._count.value > 0)
            consumptionHistory.push(Math.round((agg._avg.value ?? 0) * 60 * 24));
        }
      }

      const consumptionAvg = consumptionHistory.length > 0
        ? consumptionHistory.reduce((a, b) => a + b, 0) / consumptionHistory.length
        : 1800;

      const rainfallForecastMm = zone.weather[0]?.rainfallMm ?? 0;

      let predictions;
      try {
        predictions = await getZonePredictions({
          zone,
          tank:               { levelPct: tankLevel },
          flowSensor:         flowSensor ? { id: flowSensor.id, value: flowValue } : null,
          consumptionAvg,
          tankLevelHistory,
          consumptionHistory,
          rainfallForecastMm,
          recentFlowReadings,
        });
      } catch (aiErr) {
        console.warn(`[AI Scheduler] Zone ${zone.name}: AI unavailable — ${aiErr.message}`);
        continue;
      }

      const { shortage, leak, pump } = predictions;

      // ── Log HIGH-severity shortage alert ──────────────────────────
      if (shortage?.severity === 'high') {
        await prisma.alert.create({
          data: {
            zoneId:   zone.id,
            type:     'SHORTAGE',
            severity: 'HIGH',
            message:  `AI predicted high water stress. Tank at ${tankLevel.toFixed(1)}%. Score: ${shortage.stress_score ?? '?'}.`,
          },
        });
        console.log(`[AI Scheduler] ⚠️  HIGH shortage alert created for zone ${zone.name}`);
      }

      // ── Log HIGH-severity leak alert ──────────────────────────────
      if (leak?.is_leak && leak?.leak_probability >= 0.7) {
        await prisma.alert.create({
          data: {
            zoneId:   zone.id,
            sensorId: flowSensor?.id ?? null,
            type:     'LEAK',
            severity: leak.leak_probability >= 0.85 ? 'HIGH' : 'MEDIUM',
            message:  `Leak detected on flow sensor. Probability: ${(leak.leak_probability * 100).toFixed(1)}%. ${leak.reason ?? ''}`,
          },
        });
        console.log(`[AI Scheduler] ⚠️  Leak alert created for zone ${zone.name}`);
      }

      // ── Auto pump-control ─────────────────────────────────────────
      if (pump?.action) {
        const lastPumpAction = tank.pumpActions[0];
        const lastState = lastPumpAction?.state ?? 'OFF';
        const newState  = pump.action.toUpperCase();

        if (newState !== lastState) {
          // State changed — actuate relay and log
          try {
            await setRelay(newState === 'ON' ? 1 : 0);
            console.log(`[AI Scheduler] Pump relay → ${newState} for zone ${zone.name}`);
          } catch (relayErr) {
            console.error(`[AI Scheduler] Relay command failed:`, relayErr.message);
          }

          await prisma.pumpAction.create({
            data: {
              tankId: tank.id,
              state:  newState,
              reason: pump.reason || 'ai_decision',
              source: 'AUTO',
            },
          });
        }
      }
    }
  } catch (err) {
    console.error('[AI Scheduler] Cycle error:', err.message);
  }
}

/** Start the AI prediction scheduler. Returns the intervalId. */
function startAiScheduler() {
  console.log(`[AI Scheduler] Starting — interval ${CYCLE_INTERVAL_MS / 1000}s`);
  // Delay first run by 5 s to let DB connections settle
  setTimeout(() => {
    runPredictionCycle();
    setInterval(runPredictionCycle, CYCLE_INTERVAL_MS);
  }, 5000);
}

module.exports = { startAiScheduler };
