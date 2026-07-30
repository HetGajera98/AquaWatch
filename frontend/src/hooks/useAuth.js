'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const STORAGE_KEY = 'aquawatch_user';

// ── Module-level shared state ──────────────────────────────────────
// All useAuth() instances share this, so login in one component
// immediately updates user in all others (including AppShell).
let _user = null;
const _listeners = new Set();

function _getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Reject stale mock-tokens — force a real login to get a proper JWT
    if (parsed.token === 'mock-token') {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.user ?? parsed;
  } catch { return null; }
}

function _notify(user) {
  _user = user;
  _listeners.forEach(fn => fn(user));
}

// ── Hook ───────────────────────────────────────────────────────────
export function useAuth() {
  const [user, setUserState] = useState(() => {
    if (_user) return _user;
    _user = _getStoredUser();
    return _user;
  });

  useEffect(() => {
    _listeners.add(setUserState);
    return () => _listeners.delete(setUserState);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      const { token, user: u } = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: u }));
      _notify(u);
      return null;
    } catch {
      // Offline / backend down — use demo user so video demo works
      const fallback = { id: 'demo-user', email: email || 'operator@aquawatch.io' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 'mock-token', user: fallback }));
      _notify(fallback);
      return null;
    }
  }, []);

  const signup = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/register', { email, password });
      const { token, user: u } = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: u }));
      _notify(u);
      return null;
    } catch {
      const fallback = { id: 'demo-user', email: email || 'operator@aquawatch.io' };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: 'mock-token', user: fallback }));
      _notify(fallback);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    _notify(null);
  }, []);

  return { user, login, signup, logout };
}
