'use client';

import { useState } from 'react';
import { Zap, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

const reasonLabel = {
  tank_full: 'Tank full',
  tank_low: 'Tank low',
  tank_critical: 'Tank critical',
  leak_detected: 'Leak detected',
  manual_override: 'Manual override',
};

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function PumpStatusCard({ pump, tankName }) {
  const [status, setStatus] = useState(pump.status);
  const [lastAction, setLastAction] = useState(pump.lastAction);

  const toggle = () => {
    const newAction = status === 'on' ? 'off' : 'on';
    setStatus(newAction);
    setLastAction({
      id: `manual-${Date.now()}`,
      pumpId: pump.id,
      action: newAction,
      triggeredBy: 'manual',
      reason: 'manual_override',
      createdAt: new Date().toISOString(),
    });
  };

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
            {status === 'on' ? 'Running' : 'Idle'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {lastAction.triggeredBy === 'auto' ? '⚡ Auto' : '✋ Manual'} · {reasonLabel[lastAction.reason] ?? lastAction.reason}
          </div>
        </div>
      </div>

      <div className="stat-card-sub" style={{ marginBottom: 14 }}>
        Last action: {formatTime(lastAction.createdAt)}
      </div>

      <Button
        variant={status === 'on' ? 'danger' : 'primary'}
        onClick={toggle}
        style={{ width: '100%' }}
      >
        <RotateCcw size={13} />
        {status === 'on' ? 'Turn Off Pump' : 'Turn On Pump'}
      </Button>
    </GlassCard>
  );
}
