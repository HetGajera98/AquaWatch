'use client';

import { Zap, RotateCcw, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { usePumpControl } from '@/hooks/usePumpControl';

const reasonLabel = {
  tank_full:       'Tank full',
  tank_low:        'Tank low',
  tank_critical:   'Tank critical',
  leak_detected:   'Leak detected',
  manual_override: 'Manual override',
};

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function PumpStatusCard({ pump, tankName }) {
  const tankId = pump?.id?.replace('pump-', '') ?? '';

  const {
    status,
    lastAction: liveLastAction,
    loading,
    error,
    togglePump,
  } = usePumpControl(tankId, pump.status);

  // Use live response from backend if available, otherwise initial prop
  const lastAction = liveLastAction ?? pump.lastAction;

  return (
    <GlassCard className="stat-card">
      <div className="stat-card-label">
        <Zap size={12} />
        Pump Control — {tankName}
      </div>

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: status === 'on' ? 'var(--low-bg)' : 'rgba(148,163,184,0.10)',
          border: `2px solid ${status === 'on' ? 'var(--low-border)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
          position: 'relative',
        }}>
          {status === 'on' && (
            <span style={{
              position: 'absolute', inset: -6,
              borderRadius: '50%',
              border: '2px solid var(--low)',
              animation: 'ripple 1.8s ease-out infinite',
              opacity: 0.5,
            }} />
          )}
          <Zap
            size={22}
            color={status === 'on' ? 'var(--low)' : 'var(--text-muted)'}
            fill={status === 'on' ? 'var(--low)' : 'none'}
          />
        </div>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {loading ? 'Updating…' : status === 'on' ? 'Running' : 'Idle'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {lastAction
              ? `${lastAction.triggeredBy === 'auto' ? '⚡ Auto' : '✋ Manual'} · ${reasonLabel[lastAction.reason] ?? lastAction.reason}`
              : 'No recent action'}
          </div>
        </div>
      </div>

      <div className="stat-card-sub" style={{ marginBottom: lastAction ? 6 : 14 }}>
        {lastAction ? `Last action: ${formatTime(lastAction.createdAt)}` : 'No action recorded'}
      </div>

      {/* Backend error feedback */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
          fontSize: '0.72rem', color: 'var(--high)',
          background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '6px 10px',
          border: '1px solid rgba(239,68,68,0.20)',
        }}>
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <Button
        variant={status === 'on' ? 'danger' : 'primary'}
        onClick={() => togglePump(status)}
        loading={loading}
        style={{ width: '100%' }}
      >
        <RotateCcw size={13} />
        {status === 'on' ? 'Turn Off Pump' : 'Turn On Pump'}
      </Button>
    </GlassCard>
  );
}
