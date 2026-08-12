'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useZones } from '@/hooks/useZones';
import { useAlerts } from '@/hooks/useAlerts';
import { useDeviceLive } from '@/hooks/useDeviceLive';
import { ZoneCard } from '@/components/dashboard/ZoneCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { SkeletonStatCard, SkeletonZoneCard } from '@/components/ui/SkeletonCard';
import { Droplets, AlertTriangle, Zap, TrendingUp } from 'lucide-react';

// Number of zone skeleton cards to show while loading
const SKELETON_ZONE_COUNT = 4;

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { zones, isLoading: zonesLoading } = useZones();
  const { alerts } = useAlerts();
  const { data: deviceData } = useDeviceLive();
  const [filter, setFilter] = useState('all');

  const deviceOnline = deviceData?.online ?? false;

  const highCount   = zones.filter(z => z.stressScore === 'high').length;
  const mediumCount = zones.filter(z => z.stressScore === 'medium').length;
  const lowCount    = zones.filter(z => z.stressScore === 'low').length;
  const pumpsOn     = zones.filter(z => z.pumpStatus === 'on').length;
  const activeAlerts = alerts.filter(a => !a.acknowledged).length;
  const avgTank = zones.length > 0
    ? (zones.reduce((s, z) => s + z.tankLevel, 0) / zones.length).toFixed(0)
    : '–';

  const filteredZones = zones.filter(z => {
    if (filter === 'all') return true;
    return z.stressScore === filter;
  });

  return (
    <div className="animate-fade-in">

      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">Water Intelligence</h1>
        <p className="page-subtitle">
          Live telemetry &amp; AI shortage forecasts
          {!zonesLoading && ` — ${zones.length} active ${isAdmin ? 'zone' : 'motor station'}${zones.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ── Stats Strip ── */}
      {/* Skeletons preserve the exact same grid height so nothing shifts */}
      <div className="stats-strip stagger-in">
        {zonesLoading ? (
          // 4 skeleton cards — same grid layout as real stat cards
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <GlassCard className="stat-card" glow={highCount > 0 ? 'red' : null}>
              <div className="stat-card-label">
                <AlertTriangle size={14} style={{ color: highCount > 0 ? 'var(--high)' : 'var(--text-muted)' }} />
                {isAdmin ? 'High Stress' : 'Water Stress'}
              </div>
              <div className="stat-card-value" style={{ color: highCount > 0 ? 'var(--high)' : 'var(--text-primary)' }}>
                {highCount}
              </div>
              <div className="stat-card-sub">of {zones.length} {isAdmin ? 'zones' : 'stations'} critical</div>
            </GlassCard>

            <GlassCard className="stat-card" glow="blue">
              <div className="stat-card-label">
                <Droplets size={14} style={{ color: 'var(--primary)' }} />
                Avg Tank Level
              </div>
              <div className="stat-card-value">{avgTank}%</div>
              <div className="stat-card-sub">network mean storage</div>
            </GlassCard>

            <GlassCard className="stat-card">
              <div className="stat-card-label">
                <Zap size={14} style={{ color: pumpsOn > 0 ? 'var(--low)' : 'var(--text-muted)' }} />
                Active Pumps
              </div>
              <div className="stat-card-value" style={{ color: pumpsOn > 0 ? '#047857' : 'var(--text-primary)' }}>
                {pumpsOn}
              </div>
              <div className="stat-card-sub">of {zones.length} motors running</div>
            </GlassCard>

            <GlassCard className="stat-card">
              <div className="stat-card-label">
                <TrendingUp size={14} style={{ color: 'var(--medium)' }} />
                Active Alerts
              </div>
              <div className="stat-card-value" style={{ color: activeAlerts > 0 ? '#B45309' : 'var(--text-primary)' }}>
                {activeAlerts}
              </div>
              <div className="stat-card-sub">unacknowledged events</div>
            </GlassCard>
          </>
        )}
      </div>

      {/* ── Section Header + Filters ── */}
      <div className="section-header">
        <div>
          <div className="section-title">{isAdmin ? 'Monitored Zones' : 'Motor Stations'}</div>
          <div className="section-sub">Select a {isAdmin ? 'zone' : 'station'} to inspect live telemetry &amp; AI forecasts</div>
        </div>
      </div>

      {/* Filter pills — horizontally scrollable on mobile */}
      <div className="filter-row">
        {[
          { id: 'all',    label: `All (${zones.length})` },
          { id: 'high',   label: `🔴 High (${highCount})` },
          { id: 'medium', label: `🟡 Medium (${mediumCount})` },
          { id: 'low',    label: `🟢 Low (${lowCount})` },
        ].map(item => (
          <button
            key={item.id}
            className={`filter-btn${filter === item.id ? ' active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ── Zone Grid ── */}
      {/* Skeleton cards maintain the exact grid height → no layout shift */}
      <div className="zone-grid stagger-in">
        {zonesLoading ? (
          Array.from({ length: SKELETON_ZONE_COUNT }).map((_, i) => (
            <SkeletonZoneCard key={i} />
          ))
        ) : filteredZones.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <span className="empty-state-title">No zones match this filter</span>
            <span className="empty-state-sub">Try selecting a different stress level</span>
          </div>
        ) : (
          filteredZones.map(zone => <ZoneCard key={zone.id} zone={zone} deviceOnline={deviceOnline} />)
        )}
      </div>
    </div>
  );
}
