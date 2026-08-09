// src/index.js — AquaWatch Backend API
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes   = require('./routes/auth');
const zoneRoutes   = require('./routes/zones');
const alertRoutes  = require('./routes/alerts');
const sensorRoutes = require('./routes/sensors');
const pumpRoutes   = require('./routes/pumps');
const predictRoutes = require('./routes/predict');

// Background jobs
const { startBlynkPoller }    = require('./jobs/blynkPoller');
const { startWeatherFetcher } = require('./jobs/weatherFetcher');
const { startAiScheduler }    = require('./jobs/aiScheduler');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/zones',    zoneRoutes);
app.use('/api/alerts',   alertRoutes);
app.use('/api/sensors',  sensorRoutes);
app.use('/api/tanks',    pumpRoutes);
app.use('/api/predict',  predictRoutes);   // /api/predict/shortage  /leak  /pump-control

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:  'ok',
    service: 'aquawatch-backend',
    ts:      new Date().toISOString(),
    ai:      process.env.AI_SERVICE_URL || 'http://localhost:8000',
    blynk:   process.env.BLYNK_AUTH_TOKEN ? 'configured' : 'not configured',
  });
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server + background jobs ───────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AquaWatch Backend running on http://localhost:${PORT}`);
  console.log(`   Health:   http://localhost:${PORT}/api/health`);
  console.log(`   AI proxy: ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}`);
  console.log('');

  // Launch background jobs after server is listening
  startBlynkPoller();
  startWeatherFetcher();
  startAiScheduler();
});
