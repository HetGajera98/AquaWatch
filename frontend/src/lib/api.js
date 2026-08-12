// src/lib/api.js — Axios instance pointing at the Express backend
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 8000,
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('aquawatch_user');
    if (raw) {
      try {
        const { token } = JSON.parse(raw);
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch { /* ignore */ }
    }
  }
  return config;
});

// Just pass errors through — hooks handle fallback to mock data gracefully.
// Do NOT auto-redirect on 401 here: when backend is offline the mock-token
// causes 401s on every request, which previously wiped localStorage and
// triggered an infinite login-redirect loop.
api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
);
