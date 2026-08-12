'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

/**
 * usePumpControl
 *
 * Sends pump on/off commands to the backend (Express → Blynk relay).
 * Maintains local optimistic status so the UI updates instantly.
 *
 * @param {string} tankId  - Tank ID from zoneDetail.tank.id
 * @param {string} initialStatus - 'on' | 'off'
 */
export function usePumpControl(tankId, initialStatus) {
  const [status, setStatus]       = useState(initialStatus ?? 'off');
  const [lastAction, setLastAction] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  async function togglePump(currentStatus) {
    const newAction = currentStatus === 'on' ? 'off' : 'on';
    setLoading(true);
    setError(null);

    // Optimistic update so the UI feels instant
    setStatus(newAction);

    try {
      const { data } = await api.post(`/api/tanks/${tankId}/pump`, {
        action: newAction,
        reason: 'manual_override',
      });
      // Sync with backend response
      setStatus(data.action);
      setLastAction(data);
    } catch (err) {
      // ── MOCK FALLBACK ──
      // If the tank isn't found in the live backend (because we're viewing a mock zone),
      // simulate a successful response instead of rolling back.
      if (err.response?.status === 404) {
        setStatus(newAction);
        setLastAction({
          triggeredBy: 'manual',
          reason: 'manual_override',
          createdAt: new Date().toISOString(),
        });
        return; // Success! Exit early.
      }

      // Rollback on genuine failure
      setStatus(currentStatus);
      const msg = err.response?.data?.error ?? 'Failed to control pump. Check backend connection.';
      setError(msg);
      console.warn('Pump toggle backend failed, rolled back:', err.message);
    } finally {
      setLoading(false);
    }
  }

  return { status, lastAction, loading, error, togglePump };
}
