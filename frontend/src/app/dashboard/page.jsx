'use client';

import { useZones } from '@/hooks/useZones';
import { useAlerts } from '@/hooks/useAlerts';
import { ZoneCard } from '@/components/dashboard/ZoneCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { Droplets, AlertTriangle, Zap, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { zones, isLoading: zonesLoading } = useZones();
  const { alerts } = useAlerts();

  const highCount    = zones.filter(z => z.stressScore === 'high').length;
  const mediumCount  = zones.filter(z => z.stressScore === 'medium').length;
  const pumpsOn      = zones.filter(z => z.pumpStatus === 'on').length;
  const activeAlerts = alerts.filter(a => !a.acknowledged).length;
  const avgTank      = zones.length > 0
    ? (zones.reduce((s, z) => s + z.tankLevel, 0) / zones.length).toFixed(0)
    : 0;

  return (
    <div className="animate-fade-in">

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">
          Live status across all monitored zones — {zones.length} zones active
        </p>
      </div>

      {/* Stats Strip */}
      <div className="stats-strip">
        <GlassCard className="stat-card">
          <div className="stat-card-label"><AlertTriangle size={12} /> High Stress Zones</div>
          <div className="stat-card-value" style={{ color: highCount > 0 ? 'var(--high)' : 'var(--text-primary)' }}>
            {zonesLoading ? '–' : highCount}
          </div>
          <div className="stat-card-sub">of {zones.length} zones</div>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="stat-card-label"><Droplets size={12} /> Avg Tank Level</div>
          <div className="stat-card-value">{zonesLoading ? '–' : `${avgTank}%`}</div>
          <div className="stat-card-sub">across all zones</div>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="stat-card-label"><Zap size={12} /> Pumps Running</div>
          <div className="stat-card-value" style={{ color: pumpsOn > 0 ? 'var(--low)' : 'var(--text-primary)' }}>
            {zonesLoading ? '–' : pumpsOn}
          </div>
          <div className="stat-card-sub">of {zones.length} pumps</div>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="stat-card-label"><TrendingUp size={12} /> Active Alerts</div>
          <div className="stat-card-value" style={{ color: activeAlerts > 0 ? 'var(--medium)' : 'var(--text-primary)' }}>
            {activeAlerts}
          </div>
          <div className="stat-card-sub">unacknowledged</div>
        </GlassCard>
      </div>

      {/* Section header */}
      <div className="section-header">
        <div>
          <div className="section-title">Zone Overview</div>
          <div className="section-sub">Click a zone to see sensor detail, AI predictions and pump history</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Low',    count: zones.filter(z => z.stressScore === 'low').length,    cls: 'low'    },
            { label: 'Medium', count: mediumCount,                                           cls: 'medium' },
            { label: 'High',   count: highCount,                                             cls: 'high'   },
          ].map(({ label, count, cls }) => (
            <span key={label} className={`stress-chip ${cls}`}>
              <span className="stress-dot" />
              {label} · {count}
            </span>
          ))}
        </div>
      </div>

      {/* Zone grid */}
      <div className="zone-grid">
        {zonesLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading zones…
          </div>
        ) : zones.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No zones available. Run the seed script to populate data.
          </div>
        ) : (
          zones.map(zone => <ZoneCard key={zone.id} zone={zone} />)
        )}
      </div>
    </div>
  );
}
