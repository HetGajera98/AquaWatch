'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Users, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StressChip } from '@/components/ui/StressChip';
import { TankLevelChart } from '@/components/charts/TankLevelChart';

function floatLabel(f) {
  return { full: 'Full', normal: 'Normal', empty: 'Empty' }[f];
}

function getTankBarClass(level) {
  if (level >= 60) return 'high';
  if (level >= 30) return 'medium';
  return 'low';
}

export function ZoneCard({ zone }) {
  const router = useRouter();

  return (
    <GlassCard
      className={`zone-card ${zone.stressScore}-stress`}
      onClick={() => router.push(`/zones/${zone.id}`)}
    >
      {/* Header */}
      <div className="zone-card-header">
        <div>
          <div className="zone-card-title">{zone.name}</div>
          <div className="zone-card-city">{zone.city}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <StressChip severity={zone.stressScore} />
          <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Tank level mini chart */}
      <div style={{ margin: '0 -4px 10px' }}>
        <TankLevelChart data={zone.tankLevelHistory} height={90} />
      </div>

      {/* Tank bar */}
      <div className="tank-bar-wrap">
        <div className="tank-bar-label">
          <span>Tank Level</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{zone.tankLevel.toFixed(0)}%</span>
        </div>
        <div className="tank-bar-bg">
          <div
            className={`tank-bar-fill ${getTankBarClass(zone.tankLevel)}`}
            style={{ width: `${zone.tankLevel}%` }}
          />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="zone-metrics">
        <div className="zone-metric">
          <div className="zone-metric-label">Flow Rate</div>
          <div className="zone-metric-value">
            {zone.flowRate.toFixed(1)}
            <span className="zone-metric-unit">L/min</span>
          </div>
        </div>
        <div className="zone-metric">
          <div className="zone-metric-label">Float Switch</div>
          <div className="zone-metric-value" style={{ fontSize: '0.85rem', color: zone.floatSwitch === 'empty' ? 'var(--high)' : zone.floatSwitch === 'full' ? 'var(--low)' : 'var(--text-primary)' }}>
            {floatLabel(zone.floatSwitch)}
          </div>
        </div>
        <div className="zone-metric">
          <div className="zone-metric-label">Leak Risk</div>
          <div className="zone-metric-value" style={{ fontSize: '0.85rem', color: zone.leakProbability > 0.6 ? 'var(--high)' : zone.leakProbability > 0.25 ? 'var(--medium)' : 'var(--low)' }}>
            {(zone.leakProbability * 100).toFixed(0)}%
          </div>
        </div>
        <div className="zone-metric">
          <div className="zone-metric-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={10} /> Population
          </div>
          <div className="zone-metric-value" style={{ fontSize: '0.85rem' }}>
            {(zone.population / 1000).toFixed(0)}k
          </div>
        </div>
      </div>

      {/* Pump row */}
      <div className="pump-toggle-row">
        <div className="pump-toggle-label">
          <Zap size={13} />
          Pump
          {zone.pumpStatus === 'on'
            ? <><span className="pump-on-dot" /> <span style={{ color: 'var(--low)' }}>Running</span></>
            : <><span className="pump-off-dot" /> <span style={{ color: 'var(--text-muted)' }}>Idle</span></>
          }
        </div>
        <span style={{
          fontSize: '0.70rem',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: 6,
          background: zone.pumpStatus === 'on' ? 'var(--low-bg)' : 'rgba(148,163,184,0.10)',
          color: zone.pumpStatus === 'on' ? 'var(--low)' : 'var(--text-muted)',
          border: '1px solid',
          borderColor: zone.pumpStatus === 'on' ? 'var(--low-border)' : 'var(--border)',
        }}>
          {zone.pumpStatus.toUpperCase()}
        </span>
      </div>
    </GlassCard>
  );
}
