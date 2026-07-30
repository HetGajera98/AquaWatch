// src/index.js — AquaWatch Backend API
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes   = require('./routes/auth');
const zoneRoutes   = require('./routes/zones');
const alertRoutes  = require('./routes/alerts');
const sensorRoutes = require('./routes/sensors');
const pumpRoutes   = require('./routes/pumps');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/zones',   zoneRoutes);
app.use('/api/alerts',  alertRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/tanks',   pumpRoutes);

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'aquawatch-backend', ts: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 AquaWatch Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   AI proxy → ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}`);
});
