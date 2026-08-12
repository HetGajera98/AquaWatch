'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Zap, Wifi, WifiOff, Users } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StressChip } from '@/components/ui/StressChip';
import { Sparkline } from '@/components/charts/Sparkline';
import { useAuth } from '@/hooks/useAuth';
import { mockOperators } from '@/lib/mockData';

/** Same colour logic as zone detail AI panel */
function leakColor(prob) {
  if (prob > 0.6)  return 'var(--high)';
  if (prob > 0.25) return 'var(--medium)';
  return 'var(--low)';
}

function getTankBarClass(level) {
  if (level >= 60) return 'high';
  if (level >= 30) return 'medium';
  return 'low';
}

export function ZoneCard({ zone, deviceOnline }) {
  const router  = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const glow    = zone.stressScore === 'high' ? 'red' : zone.stressScore === 'low' ? 'blue' : null;
  
  // Only Ahmedabad North has real hardware. Mock zones pretend to be online.
  const isHardwareZone = zone.id === 'zone-ahm-north';
  const online = isHardwareZone ? deviceOnline : true;
  // Use the real backend-calculated leakProbability (same algorithm as AI service)
  const leakPct = ((zone.leakProbability ?? 0.05) * 100).toFixed(0);
  const lColor  = leakColor(zone.leakProbability ?? 0.05);

  const assignedOperator = isAdmin ? mockOperators.find(op => op.zoneId === zone.id) : null;

  return (
    <GlassCard
      className="zone-card"
      interactive
      glow={glow}
      onClick={() => router.push(`/zones/${zone.id}`)}
    >
      {/* Header */}
      <div className="zone-card-header">
        <div>
          <div className="zone-card-title">{zone.name}</div>
          <div className="zone-card-city" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px',
              borderRadius: 99, border: '1px solid',
              background: online ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.08)',
              color: online ? 'var(--low)' : 'var(--high)',
              borderColor: online ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.22)',
            }}>
              {online ? <Wifi size={9} /> : <WifiOff size={9} />}
              NodeMCU {online ? 'Online' : 'Offline'}
            </span>
          </div>
          {isAdmin && assignedOperator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Users size={12} color="var(--primary)" /> 
              <span>Operator: <strong style={{ color: 'var(--text-primary)' }}>{assignedOperator.name}</strong></span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <StressChip severity={zone.stressScore} />
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Tank level mini chart */}
      <div style={{ margin: '0 -4px 12px' }}>
        <Sparkline data={zone.tankLevelHistory} height={90} color="#0EA5E9" />
      </div>

      {/* Tank bar */}
      <div className="tank-bar-wrap">
        <div className="tank-bar-label">
          <span>Tank Level</span>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{zone.tankLevel.toFixed(0)}%</span>
        </div>
        <div className="tank-bar-bg">
          <div
            className={`tank-bar-fill ${getTankBarClass(zone.tankLevel)}`}
            style={{ width: `${zone.tankLevel}%` }}
          />
        </div>
      </div>

      {/* Metrics grid — 2 cells: Flow Rate + Leak Risk (same source as detail page) */}
      <div className="zone-metrics">
        <div className="zone-metric">
          <div className="zone-metric-label">Flow Rate</div>
          <div className="zone-metric-value">
            {zone.flowRate.toFixed(1)}
            <span className="zone-metric-unit">L/min</span>
          </div>
        </div>

        <div className="zone-metric">
          <div className="zone-metric-label">Leak Risk</div>
          <div className="zone-metric-value" style={{ fontSize: '0.95rem', color: lColor, fontWeight: 800 }}>
            {leakPct}%
            <span style={{ fontSize: '0.62rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 3 }}>
              {zone.leakProbability > 0.6 ? '⚠ High' : zone.leakProbability > 0.25 ? 'Watch' : '✓ Safe'}
            </span>
          </div>
        </div>
      </div>

      {/* Pump row */}
      <div className="pump-toggle-row">
        <div className="pump-toggle-label">
          <Zap size={15} style={{ color: zone.pumpStatus === 'on' ? 'var(--low)' : 'var(--text-muted)' }} />
          <span>Motor / Pump</span>
          {zone.pumpStatus === 'on'
            ? <><span className="pump-on-dot" /> <span style={{ color: 'var(--low)', fontWeight: 700 }}>Running</span></>
            : <><span className="pump-off-dot" /> <span style={{ color: 'var(--text-muted)' }}>Idle</span></>
          }
        </div>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700,
          padding: '4px 10px', borderRadius: 100,
          background: zone.pumpStatus === 'on' ? 'var(--low-bg)' : 'rgba(148,163,184,0.12)',
          color: zone.pumpStatus === 'on' ? '#047857' : 'var(--text-muted)',
          border: '1px solid',
          borderColor: zone.pumpStatus === 'on' ? 'var(--low-border)' : 'var(--border)',
        }}>
          {zone.pumpStatus.toUpperCase()}
        </span>
      </div>
    </GlassCard>
  );
}
