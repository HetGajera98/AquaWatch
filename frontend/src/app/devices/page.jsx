'use client';

import { useDeviceLive } from '@/hooks/useDeviceLive';
import { GlassCard }     from '@/components/ui/GlassCard';
import { Button }        from '@/components/ui/Button';
import {
  Droplets, Activity, Zap,
  RefreshCw, Wifi, WifiOff, AlertCircle,
  Power, FlaskConical,
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────── */
function LiveDot({ online }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: online ? 'var(--low)' : 'var(--high)',
      boxShadow: online ? '0 0 6px var(--low)' : 'none', flexShrink: 0,
    }} />
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      marginBottom: 8, marginTop: 2,
    }}>
      {children}
    </div>
  );
}

/* ── Water Level bar ────────────────────────────────────────────── */
function WaterLevelBar({ pct }) {
  const color = pct >= 60 ? 'var(--low)' : pct >= 30 ? 'var(--medium)' : 'var(--high)';
  return (
    <GlassCard style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: 'rgba(14,165,233,0.12)',
          border: '1px solid rgba(14,165,233,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Droplets size={20} color="var(--primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            Water Level — V0
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            Tank fill percentage from NodeMCU
          </div>
        </div>
        <div style={{
          fontSize: '2.2rem', fontWeight: 800, color,
          letterSpacing: '-0.04em', lineHeight: 1,
        }}>
          {pct.toFixed(1)}<span style={{ fontSize: '1rem', marginLeft: 2 }}>%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%', height: 12, borderRadius: 99,
        background: 'rgba(148,163,184,0.15)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: color,
          transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: `0 0 10px ${color}55`,
        }} />
      </div>

      {/* Status label */}
      <div style={{
        marginTop: 10, display: 'flex', justifyContent: 'space-between',
        fontSize: '0.72rem', color: 'var(--text-muted)',
      }}>
        <span>0% Empty</span>
        <span style={{ fontWeight: 700, color }}>
          {pct >= 80 ? '🟢 Full' : pct >= 50 ? '🟡 Normal' : pct >= 20 ? '🟠 Low' : '🔴 Critical'}
        </span>
        <span>100% Full</span>
      </div>
    </GlassCard>
  );
}

/* ── Generic reading card ────────────────────────────────────────── */
function ReadingCard({ icon: Icon, pinLabel, title, sub, value, unit, color = 'var(--primary)' }) {
  return (
    <GlassCard style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1,
          }}>
            {title} — {pinLabel}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            {sub}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{
              fontSize: '2rem', fontWeight: 800, color,
              letterSpacing: '-0.04em', lineHeight: 1,
            }}>
              {value}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {unit}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ── Pump control card ───────────────────────────────────────────── */
function PumpCard({ status, pumping, onToggle }) {
  const isOn = status === 'on';
  return (
    <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionLabel>Pump / Relay Control — V3</SectionLabel>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Status orb */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          position: 'relative',
          background: isOn ? 'var(--low-bg)' : 'rgba(148,163,184,0.10)',
          border: `2px solid ${isOn ? 'var(--low-border)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}>
          {isOn && (
            <span style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              border: '2px solid var(--low)',
              animation: 'ripple 1.8s ease-out infinite', opacity: 0.5,
            }} />
          )}
          <Power size={26}
            color={isOn ? 'var(--low)' : 'var(--text-muted)'}
            fill={isOn ? 'var(--low)' : 'none'}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '1.5rem', fontWeight: 800, lineHeight: 1,
            color: isOn ? 'var(--low)' : 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}>
            {pumping ? 'Sending…' : isOn ? 'Running' : 'Idle'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 5 }}>
            {isOn
              ? 'V3 = 1 — Relay is ON, pump powered'
              : 'V3 = 0 — Relay is OFF, pump idle'}
          </div>
        </div>

        {/* Inline quick-toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.72rem', color: 'var(--text-muted)',
        }}>
          <Zap size={13} color={isOn ? 'var(--low)' : 'var(--text-muted)'} />
          {isOn ? 'ON' : 'OFF'}
        </div>
      </div>

      <Button
        variant={isOn ? 'danger' : 'primary'}
        onClick={() => onToggle(status)}
        loading={pumping}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        <Power size={15} />
        {isOn ? 'Turn Pump OFF (V3 → 0)' : 'Turn Pump ON  (V3 → 1)'}
      </Button>

      <div style={{
        fontSize: '0.70rem', color: 'var(--text-muted)',
        background: 'rgba(148,163,184,0.08)',
        borderRadius: 8, padding: '8px 12px',
        border: '1px solid var(--border)',
        lineHeight: 1.5,
      }}>
        ⚡ Command sent via <strong>Blynk Cloud REST API</strong>
        &nbsp;→ NodeMCU reads <strong>V3</strong> and toggles the relay
      </div>
    </GlassCard>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Devices Page
══════════════════════════════════════════════════════════════════ */
export default function DevicesPage() {
  const { data, loading, error, pumping, refresh, togglePump } = useDeviceLive();

  return (
    <div className="animate-fade-in">

      {/* ── Page header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Live Devices</h1>
          <p className="page-subtitle">
            Real-time readings from&nbsp;
            <strong style={{ color: 'var(--primary)' }}>Blynk Cloud</strong>
            &nbsp;↔&nbsp;NodeMCU
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          {data && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 99,
              background: data.online ? 'var(--low-bg)' : 'var(--high-bg)',
              border: `1px solid ${data.online ? 'var(--low-border)' : 'var(--high-border)'}`,
              fontSize: '0.75rem', fontWeight: 700,
              color: data.online ? 'var(--low)' : 'var(--high)',
            }}>
              <LiveDot online={data.online} />
              {data.online
                ? <><Wifi size={13} /> NodeMCU Online</>
                : <><WifiOff size={13} /> NodeMCU Offline</>}
            </div>
          )}
          <button
            onClick={refresh}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 10,
              background: 'var(--glass-bg)', border: '1px solid var(--border)',
              fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
          fontSize: '0.80rem', color: 'var(--high)',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ── Skeleton ── */}
      {loading && !data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[0,1,2,3,4].map(i => (
            <GlassCard key={i} style={{ height: 90, padding: 20 }}>
              <div style={{ width: '55%', height: 12, borderRadius: 6, background: 'rgba(148,163,184,0.15)' }} />
              <div style={{ width: '35%', height: 28, borderRadius: 6, background: 'rgba(148,163,184,0.10)', marginTop: 14 }} />
            </GlassCard>
          ))}
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <SectionLabel>Sensor Readings — live from NodeMCU via Blynk</SectionLabel>

          {/* V0 — Water Level % */}
          <WaterLevelBar pct={data.waterLevelPct} />

          {/* V2 — Flow Rate */}
          <ReadingCard
            icon={Activity}
            pinLabel="V2"
            title="Flow Rate"
            sub={
              data.flowRateLpm > 0
                ? `~${(data.flowRateLpm * 60).toFixed(0)} L/hr · pipe is actively flowing`
                : 'YF-S201 — no flow detected'
            }
            value={data.flowRateLpm.toFixed(2)}
            unit="L/min"
            color="#8B5CF6"
          />

          {/* V4 — Total Water */}
          <ReadingCard
            icon={FlaskConical}
            pinLabel="V4"
            title="Total Water"
            sub="Cumulative litre counter from NodeMCU firmware"
            value={
              data.totalWaterL >= 1000
                ? (data.totalWaterL / 1000).toFixed(2)
                : data.totalWaterL.toFixed(1)
            }
            unit={data.totalWaterL >= 1000 ? 'kL' : 'L'}
            color="var(--low)"
          />

          {/* V3 — Pump Control */}
          <PumpCard
            status={data.pumpStatus}
            pumping={pumping}
            onToggle={togglePump}
          />

          {/* ── Pin legend ── */}
          <GlassCard style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.06em' }}>
              VIRTUAL PIN MAP
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(14,165,233,0.1)', padding: '2px 8px', borderRadius: 6 }}>V0</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WATER LEVEL %</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', padding: '2px 8px', borderRadius: 6 }}>V2</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FLOW RATE L/MIN</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: 'var(--high)', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 6 }}>V3</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--high)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PUMP RELAY CONTROL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: 'var(--low)', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 6 }}>V4</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL WATER (LITRES)</span>
              </div>
            </div>
          </GlassCard>

          {/* ── Timestamp ── */}
          <div style={{
            textAlign: 'center', fontSize: '0.70rem', color: 'var(--text-muted)', paddingBottom: 8,
          }}>
            Last snapshot: {new Date(data.ts).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            })} · auto-refreshes every 10 s
          </div>

        </div>
      ) : null}
    </div>
  );
}
