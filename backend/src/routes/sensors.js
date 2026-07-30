// src/routes/sensors.js — POST /api/sensors/:id/readings (Blynk webhook ingest)
const express = require('express');
const prisma  = require('../lib/prisma');

const router = express.Router();

// POST /api/sensors/:id/readings
// Body: { value: number, unit?: string }
// No auth required — called by Blynk webhook / ESP32
router.post('/:id/readings', async (req, res) => {
  const { value, unit } = req.body;

  if (value === undefined || isNaN(Number(value)))
    return res.status(400).json({ error: 'value (number) is required' });

  try {
    const sensor = await prisma.sensor.findUnique({ where: { id: req.params.id } });
    if (!sensor) return res.status(404).json({ error: 'Sensor not found' });

    const reading = await prisma.sensorReading.create({
      data: {
        sensorId: sensor.id,
        value:    Number(value),
        unit:     unit ?? (sensor.type === 'TANK_LEVEL' ? '%' : sensor.type === 'FLOW_RATE' ? 'L/min' : 'boolean'),
      },
    });

    return res.status(201).json(reading);
  } catch (err) {
    console.error('POST /sensors/:id/readings error:', err);
    return res.status(500).json({ error: 'Failed to store reading' });
  }
});

// GET /api/sensors/:id/readings?limit=100
const { requireAuth } = require('../middleware/auth');
router.get('/:id/readings', requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
  try {
    const readings = await prisma.sensorReading.findMany({
      where:   { sensorId: req.params.id },
      orderBy: { recordedAt: 'desc' },
      take:    limit,
    });
    return res.json(readings.reverse());
  } catch (err) {
    console.error('GET /sensors/:id/readings error:', err);
    return res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

module.exports = router;
