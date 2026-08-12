// src/routes/auth.js — POST /api/auth/register, POST /api/auth/login
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const prisma  = require('../lib/prisma');

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRY = '7d';

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
