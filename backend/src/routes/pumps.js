// src/routes/pumps.js — POST /api/tanks/:tankId/pump
const express = require('express');
const prisma  = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/tanks/:tankId/pump
// Body: { action: "on" | "off", reason?: string }
router.post('/:tankId/pump', requireAuth, async (req, res) => {
  const { action, reason } = req.body;

  if (!action || !['on', 'off'].includes(action))
    return res.status(400).json({ error: 'action must be "on" or "off"' });

  try {
    const tank = await prisma.tank.findUnique({ where: { id: req.params.tankId } });
    if (!tank) return res.status(404).json({ error: 'Tank not found' });

    const pumpAction = await prisma.pumpAction.create({
      data: {
        tankId: tank.id,
        state:  action.toUpperCase(),
        reason: reason || 'manual_override',
        source: 'MANUAL',
      },
    });

    return res.status(201).json({
      id:          pumpAction.id,
      tankId:      pumpAction.tankId,
      action:      pumpAction.state.toLowerCase(),
      triggeredBy: 'manual',
      reason:      pumpAction.reason,
      createdAt:   pumpAction.triggeredAt,
    });
  } catch (err) {
    console.error('POST /tanks/:tankId/pump error:', err);
    return res.status(500).json({ error: 'Failed to record pump action' });
  }
});

module.exports = router;
