'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Droplets, Activity,
  CheckCircle2, Clock,
} from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { GlassCard } from '@/components/ui/GlassCard';
import { StressChip } from '@/components/ui/StressChip';

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return 'Just now';
}

export default function AlertsPage() {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType]         = useState('all');
  const router = useRouter();

  const { alerts, isLoading, acknowledge } = useAlerts();

  const filtered = alerts.filter(a => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    return true;
  });

  const unacknowledged = alerts.filter(a => !a.acknowledged).length;

  const typeIcon = (type) =>
    type === 'leak' ? <Activity size={16} /> : <Droplets size={16} />;

  const typeLabel = (type) =>
    type === 'leak' ? 'Leak Alert' : 'Water Stress';

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">
            {unacknowledged > 0
              ? `${unacknowledged} unacknowledged alert${unacknowledged > 1 ? 's' : ''}`
              : 'All alerts acknowledged'}
          </p>
        </div>
        {unacknowledged > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => alerts.filter(a => !a.acknowledged).forEach(a => acknowledge(a.id))}
          >
            <CheckCircle2 size={13} /> Acknowledge All
          </button>
        )}
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {['high', 'medium', 'low'].map(s => {
          const count = alerts.filter(a => a.severity === s).length;
          return (
            <GlassCard key={s} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={14} color={s === 'high' ? 'var(--high)' : s === 'medium' ? 'var(--medium)' : 'var(--low)'} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{count}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s} severity</div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filter-row">
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>Severity:</span>
        {['all', 'high', 'medium', 'low'].map(s => (
          <button
            key={s}
            className={`filter-btn ${filterSeverity === s ? 'active' : ''}`}
            onClick={() => setFilterSeverity(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ margin: '0 8px', color: 'var(--border)' }}>|</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>Type:</span>
        {['all', 'leak', 'water_stress', 'shortage'].map(t => (
          <button
            key={t}
            className={`filter-btn ${filterType === t ? 'active' : ''}`}
            onClick={() => setFilterType(t)}
          >
            {t === 'all' ? 'All' : t === 'leak' ? 'Leak' : 'Water Stress'}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading alerts…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={40} />
          <div className="empty-state-title">No alerts match your filters</div>
          <div className="empty-state-sub">Adjust the filters above to see more alerts</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(alert => (
            <div
              key={alert.id}
              className={`alert-item ${alert.severity}`}
              style={{ opacity: alert.acknowledged ? 0.6 : 1 }}
            >
              <div className={`alert-icon-wrap ${alert.severity}`}>
                {typeIcon(alert.type)}
              </div>
              <div className="alert-content">
                <div className="alert-header">
                  <span className="alert-zone">{alert.zoneName}</span>
                  <StressChip severity={alert.severity} size="sm" />
                  <span style={{
                    fontSize: '0.70rem', fontWeight: 600,
                    padding: '2px 7px', borderRadius: 5,
                    background: alert.type === 'leak' ? 'rgba(139,92,246,0.10)' : 'rgba(14,165,233,0.10)',
                    color: alert.type === 'leak' ? '#7C3AED' : 'var(--primary)',
                    border: '1px solid',
                    borderColor: alert.type === 'leak' ? 'rgba(139,92,246,0.20)' : 'rgba(14,165,233,0.20)',
                  }}>
                    {typeLabel(alert.type)}
                  </span>
                  {alert.acknowledged && (
                    <span className="badge neutral"><CheckCircle2 size={10} /> Acknowledged</span>
                  )}
                </div>
                <p className="alert-message">{alert.message}</p>
                <div className="alert-footer">
                  <Clock size={10} />
                  {formatTime(alert.createdAt)} · {timeAgo(alert.createdAt)}
                  {alert.sensorId && (
                    <>
                      <span style={{ margin: '0 4px' }}>·</span>
                      <span style={{ fontFamily: 'monospace' }}>Sensor: {alert.sensorId}</span>
                    </>
                  )}
                  {alert.confidence && (
                    <span>· Confidence: {(alert.confidence * 100).toFixed(0)}%</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => router.push(`/zones/${alert.zoneId}`)}
                  style={{ fontSize: '0.72rem' }}
                >
                  View Zone →
                </button>
                {!alert.acknowledged && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => acknowledge(alert.id)}
                    style={{ fontSize: '0.72rem' }}
                  >
                    <CheckCircle2 size={11} /> Ack
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
