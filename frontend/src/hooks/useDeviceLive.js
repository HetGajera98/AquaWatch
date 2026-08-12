'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

const POLL_MS = 10_000; // mirror the Blynk poller interval

/**
 * Live hardware snapshot from Blynk Cloud via backend.
 * Pin mapping: V0=waterLevelPct, V1=distanceCm, V2=flowRateLpm,
 *              V3=pumpRelay (write), V4=totalWaterL
 */
export function useDeviceLive() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [pumping, setPumping] = useState(false);
  const timerRef              = useRef(null);

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/devices/live');
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.error ?? 'Backend offline — showing last known values');
    } finally {
      setLoading(false);
    }
  }, []);

  // initial fetch + polling
  useEffect(() => {
    fetch(false);
    timerRef.current = setInterval(() => fetch(true), POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetch]);

  const togglePump = useCallback(async (currentStatus) => {
    const action = currentStatus === 'on' ? 'off' : 'on';
    setPumping(true);
    // Optimistic update
    setData(prev => prev ? { ...prev, pumpStatus: action } : prev);
    try {
      await api.post('/api/devices/pump', { action });
      // Re-fetch to confirm
      await fetch(true);
    } catch (e) {
      // Rollback
      setData(prev => prev ? { ...prev, pumpStatus: currentStatus } : prev);
      setError('Pump command failed — check device connection');
    } finally {
      setPumping(false);
    }
  }, [fetch]);

  return { data, loading, error, pumping, refresh: () => fetch(false), togglePump };
}
