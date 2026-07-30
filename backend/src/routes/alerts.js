// src/routes/alerts.js — GET /api/alerts, PATCH /api/alerts/:id/acknowledge
const express = require('express');
const prisma  = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/alerts?severity=high&type=LEAK&resolved=false
router.get('/', requireAuth, async (req, res) => {
  try {
    const { severity, type, resolved } = req.query;

    const where = {};
    if (severity) where.severity = severity.toUpperCase();
    if (type)     where.type     = type.toUpperCase();
    if (resolved !== undefined) where.resolved = resolved === 'true';

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        zone:   { select: { name: true } },
        sensor: { select: { blynkVirtualPin: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = alerts.map(a => ({
      id:           a.id,
      zoneId:       a.zoneId,
      zoneName:     a.zone.name,
      sensorId:     a.sensorId,
      type:         a.type.toLowerCase(),
      severity:     a.severity.toLowerCase(),
      message:      a.message,
      acknowledged: a.resolved,
      confidence:   0.85,
      createdAt:    a.createdAt,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('GET /alerts error:', err);
    return res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', requireAuth, async (req, res) => {
  try {
    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data:  { resolved: true },
    });
    return res.json({ id: alert.id, resolved: alert.resolved });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Alert not found' });
    console.error('PATCH /alerts/:id/acknowledge error:', err);
    return res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

module.exports = router;
