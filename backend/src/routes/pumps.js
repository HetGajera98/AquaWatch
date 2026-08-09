// src/routes/pumps.js — POST /api/tanks/:tankId/pump
const express = require('express');
const axios   = require('axios');
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

    // Actuate the physical relay via Blynk Cloud
    const blynkToken = process.env.BLYNK_AUTH_TOKEN;
    if (blynkToken) {
      const vPin = process.env.BLYNK_RELAY_PIN || 'v0';
      const blynkValue = action === 'on' ? 1 : 0;
      try {
        await axios.get(`https://blynk.cloud/external/api/update?token=${blynkToken}&${vPin}=${blynkValue}`);
        console.log(`Blynk relay ${vPin} set to ${blynkValue}`);
      } catch (blynkErr) {
        console.error('Blynk API error:', blynkErr.message);
      }
    } else {
      console.warn('BLYNK_AUTH_TOKEN not set, skipping physical relay actuation for pump:', action);
    }

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
