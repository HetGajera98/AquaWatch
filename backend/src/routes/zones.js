// src/routes/zones.js — GET /api/zones, GET /api/zones/:id
const express  = require('express');
const prisma   = require('../lib/prisma');
const { getZonePredictions } = require('../lib/aiProxy');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── Helper: get latest reading per sensor ──────────────────────
async function latestReadings(sensorIds) {
  if (!sensorIds.length) return {};
  const readings = await prisma.sensorReading.findMany({
    where: { sensorId: { in: sensorIds } },
    orderBy: { recordedAt: 'desc' },
    distinct: ['sensorId'],
  });
  return Object.fromEntries(readings.map(r => [r.sensorId, r]));
}

// ── GET /api/zones — summary list ────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        tanks: {
          include: { sensors: true },
        },
        alerts: {
          where:   { resolved: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build summary for each zone
    const summaries = await Promise.all(zones.map(async (zone) => {
      const allSensorIds = zone.tanks.flatMap(t => t.sensors.map(s => s.id));
      const latest = await latestReadings(allSensorIds);

      const tankSensor   = zone.tanks[0]?.sensors.find(s => s.type === 'TANK_LEVEL');
      const flowSensor   = zone.tanks[0]?.sensors.find(s => s.type === 'FLOW_RATE');
      const floatSensor  = zone.tanks[0]?.sensors.find(s => s.type === 'FLOAT_SWITCH');

      const tankLevel  = tankSensor  ? (latest[tankSensor.id]?.value  ?? 0) : 0;
      const flowRate   = flowSensor  ? (latest[flowSensor.id]?.value  ?? 0) : 0;
      const floatVal   = floatSensor ? (latest[floatSensor.id]?.value ?? 0) : 0;

      const floatSwitch = floatVal >= 1 ? 'full' : tankLevel < 20 ? 'empty' : 'normal';
      const stressScore = tankLevel < 25 ? 'high' : tankLevel < 55 ? 'medium' : 'low';

      // Get tank level history (last 48 readings)
      const levelHistory = tankSensor
        ? (await prisma.sensorReading.findMany({
            where:   { sensorId: tankSensor.id },
            orderBy: { recordedAt: 'asc' },
            take:    48,
          })).map(r => ({ time: r.recordedAt, value: r.value }))
        : [];

      return {
        id:               zone.id,
        name:             zone.name,
        city:             zone.name.split(' ')[0],
        population:       100000,
        tankLevel,
        tankLevelHistory: levelHistory,
        flowRate,
        floatSwitch,
        leakProbability:  0.1,          // updated from AI on detail page
        stressScore,
        pumpStatus:       'off',         // updated from pump actions below
      };
    }));

    return res.json(summaries);
  } catch (err) {
    console.error('GET /zones error:', err);
    return res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

// ── GET /api/zones/:id — full detail with AI predictions ─────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id: req.params.id },
      include: {
        tanks: {
          include: {
            sensors:     true,
            pumpActions: { orderBy: { triggeredAt: 'desc' }, take: 10 },
          },
        },
        weather: { orderBy: { forecastFor: 'desc' }, take: 1 },
        alerts:  { orderBy: { createdAt:   'desc' }, take: 20 },
      },
    });

    if (!zone) return res.status(404).json({ error: 'Zone not found' });

    const tank = zone.tanks[0];
    const allSensorIds = tank?.sensors.map(s => s.id) ?? [];
    const latest = await latestReadings(allSensorIds);

    // Build sensor rows with live values
    const sensors = (tank?.sensors ?? []).map(s => ({
      id:        s.id,
      type:      s.type.toLowerCase(),
      label:     s.type === 'TANK_LEVEL' ? 'Tank Level Sensor'
               : s.type === 'FLOW_RATE'  ? 'Flow Rate Meter'
               : 'Float Switch',
      liveValue: latest[s.id]?.value ?? 0,
      unit:      s.type === 'TANK_LEVEL' ? '%'
               : s.type === 'FLOW_RATE'  ? 'L/min'
               : 'boolean',
      status:    'ok',
      blynkPin:  s.blynkVirtualPin,
    }));

    const tankSensor  = tank?.sensors.find(s => s.type === 'TANK_LEVEL');
    const flowSensor  = tank?.sensors.find(s => s.type === 'FLOW_RATE');
    const tankLevel   = tankSensor ? (latest[tankSensor.id]?.value ?? 0) : 0;
    const flowValue   = flowSensor ? (latest[flowSensor.id]?.value ?? 0) : 0;

    // Tank level history (last 48 readings)
    const levelHistory = tankSensor
      ? (await prisma.sensorReading.findMany({
          where:   { sensorId: tankSensor.id },
          orderBy: { recordedAt: 'asc' },
          take:    48,
        })).map(r => ({ time: r.recordedAt, value: r.value }))
      : [];

    // Consumption history (14 days from flow readings aggregated)
    const consumptionHistory = await buildConsumptionHistory(flowSensor?.id);
    const rainfallHistory    = await buildRainfallHistory(zone.id);

    // Pump info
    const latestPumpAction = tank?.pumpActions[0] ?? null;
    const pumpObj = tank ? {
      id:     `pump-${tank.id}`,
      status: latestPumpAction?.state === 'ON' ? 'on' : 'off',
      lastAction: latestPumpAction ? {
        id:          latestPumpAction.id,
        pumpId:      `pump-${tank.id}`,
        action:      latestPumpAction.state.toLowerCase(),
        triggeredBy: latestPumpAction.source.toLowerCase(),
        reason:      latestPumpAction.reason,
        createdAt:   latestPumpAction.triggeredAt,
      } : {
        id: 'none', pumpId: `pump-${tank.id}`,
        action: 'off', triggeredBy: 'auto',
        reason: 'tank_full', createdAt: new Date().toISOString(),
      },
    } : null;

    const pumpHistory = (tank?.pumpActions ?? []).map(a => ({
      id:          a.id,
      action:      a.state.toLowerCase(),
      triggeredBy: a.source.toLowerCase(),
      reason:      a.reason,
      createdAt:   a.triggeredAt,
    }));

    // Weather
    const w = zone.weather[0];

    // AI predictions
    let aiPrediction = null;
    try {
      const pred = await getZonePredictions({
        zone,
        tank:    { levelPct: tankLevel },
        flowSensor: flowSensor ? { id: flowSensor.id, value: flowValue } : null,
        consumptionAvg: 1800,
      });
      aiPrediction = {
        shortage: pred.shortage ? {
          severity:    pred.shortage.severity,
          confidence:  pred.shortage.stress_score / 100,
          stressScore: pred.shortage.stress_score,
          topFactors:  pred.shortage.top_factors ?? [],
        } : null,
        leak: pred.leak ? {
          leakProbability: pred.leak.leak_probability,
          isLeak:          pred.leak.is_leak,
          sensorId:        pred.leak.sensor_id,
          reason:          pred.leak.reason,
        } : null,
        pump: pred.pump ? {
          action: pred.pump.action,
          reason: pred.pump.reason,
        } : null,
      };
    } catch (e) {
      console.warn('AI service unavailable:', e.message);
    }

    const floatSensor = tank?.sensors.find(s => s.type === 'FLOAT_SWITCH');
    const floatVal    = floatSensor ? (latest[floatSensor.id]?.value ?? 0) : 0;
    const stressScore = tankLevel < 25 ? 'high' : tankLevel < 55 ? 'medium' : 'low';

    return res.json({
      id:               zone.id,
      name:             zone.name,
      city:             zone.name.split(' ')[0],
      population:       100000,
      stressScore,
      weather: w ? { temperatureC: w.temperatureC, rainfallMm: w.rainfallMm } : null,
      tank: tank ? {
        id:            tank.id,
        name:          tank.name,
        capacityLiters: tank.capacityL,
        levelPercent:  tankLevel,
        levelHistory,
      } : null,
      pump:             pumpObj,
      sensors,
      pumpHistory,
      consumptionHistory,
      rainfallHistory,
      aiPrediction,
      floatSwitch: floatVal >= 1 ? 'full' : tankLevel < 20 ? 'empty' : 'normal',
    });
  } catch (err) {
    console.error(`GET /zones/${req.params.id} error:`, err);
    return res.status(500).json({ error: 'Failed to fetch zone detail' });
  }
});

// ── Helpers ───────────────────────────────────────────────────────
async function buildConsumptionHistory(flowSensorId) {
  if (!flowSensorId) return [];
  const rows = [];
  for (let d = 13; d >= 0; d--) {
    const start = new Date(Date.now() - d * 86400000);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const agg = await prisma.sensorReading.aggregate({
      where: { sensorId: flowSensorId, recordedAt: { gte: start, lte: end } },
      _avg:  { value: true },
      _count: { value: true },
    });
    if (agg._count.value > 0) {
      rows.push({
        date:        start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        consumption: Math.round((agg._avg.value ?? 0) * 60 * 24),
      });
    }
  }
  return rows;
}

async function buildRainfallHistory(zoneId) {
  const weather = await prisma.weatherReading.findMany({
    where:   { zoneId },
    orderBy: { forecastFor: 'asc' },
    take:    14,
  });
  return weather.map(w => ({
    date:     new Date(w.forecastFor).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    rainfall: w.rainfallMm,
  }));
}

module.exports = router;
