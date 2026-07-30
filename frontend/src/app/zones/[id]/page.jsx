'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Droplets, Activity, Thermometer,
  CloudRain, Brain, Zap, CheckCircle2, Loader2,
} from 'lucide-react';
import { useZoneDetail } from '@/hooks/useZoneDetail';
import { useAIPrediction } from '@/hooks/useAIPrediction';
import { GlassCard } from '@/components/ui/GlassCard';
import { StressChip } from '@/components/ui/StressChip';
import { SensorRow } from '@/components/dashboard/SensorRow';
import { PumpStatusCard } from '@/components/dashboard/PumpStatusCard';
import { TankLevelChart } from '@/components/charts/TankLevelChart';
import { FlowRateChart } from '@/components/charts/FlowRateChart';
import { ConsumptionChart } from '@/components/charts/ConsumptionChart';

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const reasonLabel = {
  tank_full:       'Tank full',
  tank_low:        'Tank low',
  tank_critical:   'Tank critical',
  leak_detected:   'Leak detected',
  manual_override: 'Manual override',
};

// ── AI Panel skeleton shown while loading ──────────────────────
function AISkeleton() {
  return (
    <div className="grid-3" style={{ marginBottom: 20 }}>
      {[0, 1, 2].map(i => (
        <GlassCard key={i} style={{ padding: '18px', minHeight: 110 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--text-muted)', fontSize: '0.82rem',
          }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Fetching AI prediction…
          </div>
        </GlassCard>
      ))}
    </div>
  );
}


export default function ZoneDetailPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  // ── Fetch zone detail from backend (with mock fallback) ────
  const { zoneDetail, isLoading: zoneLoading, usingMock } = useZoneDetail(id);

  // ── AI predictions (from backend response, or live hook if backend is down) ──
  const backendHasAI = zoneDetail?.aiPrediction?.shortage != null;
  const { prediction: liveAI, loading: aiLoading, aiOnline } =
    useAIPrediction(backendHasAI ? null : zoneDetail);
  const aiPrediction = backendHasAI ? zoneDetail.aiPrediction : liveAI;

  const flowRateData = useMemo(() => {
    if (!zoneDetail?.sensors) return [];
    const flowSensor = zoneDetail.sensors.find(s => s.type === 'flow');
    if (!flowSensor) return [];
    const baseVal = flowSensor.liveValue ?? 10;
    return Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      value: Number((baseVal * (0.85 + Math.sin(i / 3) * 0.15)).toFixed(1)),
    }));
  }, [zoneDetail]);

  if (zoneLoading) {
    return (
      <div className="empty-state">
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <div className="empty-state-title">Loading zone data…</div>
      </div>
    );
  }

  if (!id || !zoneDetail) {
    return (
      <div className="empty-state">
        <Droplets size={40} />
        <div className="empty-state-title">Zone not found</div>
        <button className="btn btn-primary btn-sm" onClick={() => router.push('/zones')}>
          ← Back to Zones
        </button>
      </div>
    );
  }

  const { tank, pump, pumpHistory, sensors,
          consumptionHistory, rainfallHistory, weather } = zoneDetail;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button className="breadcrumb-link" style={{ background: 'none', border: 'none' }}
          onClick={() => router.push('/dashboard')}>
          <ChevronLeft size={13} style={{ verticalAlign: 'middle' }} /> Dashboard
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-link" onClick={() => router.push('/zones')}>Zones</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{zoneDetail.name}</span>
      </div>

      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{zoneDetail.name}</h1>
          <p className="page-subtitle">{zoneDetail.city} · {zoneDetail.population.toLocaleString()} residents</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StressChip severity={zoneDetail.stressScore} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Thermometer size={12} /> {weather?.temperatureC ?? '--'}°C
            <CloudRain size={12} style={{ marginLeft: 6 }} /> {weather?.rainfallMm ?? '--'} mm
          </div>
        </div>
      </div>

      {/* Top row: Tank level chart + pump card */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <GlassCard>
          <div className="chart-container">
            <div className="chart-title">
              <Droplets size={13} /> Tank Level — {tank?.name ?? 'Unknown'}
              <span style={{ marginLeft: 'auto', fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                {tank ? (tank.capacityLiters / 1000).toFixed(0) : 0}k L capacity
              </span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                padding: '16px 24px',
                background: 'rgba(14,165,233,0.05)', borderRadius: 14,
                border: '1px solid rgba(14,165,233,0.12)',
              }}>
                <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {tank?.levelPercent?.toFixed(0) ?? 0}%
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>current level</span>
              </div>
            </div>
            <TankLevelChart data={tank?.levelHistory ?? []} height={160} />
          </div>
        </GlassCard>

        {pump && <PumpStatusCard pump={pump} tankName={tank?.name ?? 'Unknown'} />}
      </div>

      {/* AI Prediction section */}
      <div className="section-header">
        <div>
          <div className="section-title">
            <Brain size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            AI Predictions
            {aiOnline && !aiLoading && (
              <span style={{
                marginLeft: 8, fontSize: '0.65rem', fontWeight: 700,
                padding: '2px 7px', borderRadius: 20,
                background: 'rgba(34,197,94,0.12)', color: 'var(--low)',
                border: '1px solid rgba(34,197,94,0.25)',
                verticalAlign: 'middle',
              }}>● LIVE</span>
            )}
          </div>
          <div className="section-sub">
            Live ML predictions from FastAPI service
          </div>
        </div>
      </div>

      {aiLoading ? (
        <AISkeleton />
      ) : aiPrediction ? (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {/* Shortage */}
          <GlassCard className="ai-panel" style={{ flexDirection: 'column', gap: 0, padding: '18px' }}>
            <div className="ai-label" style={{ marginBottom: 8 }}>Water Shortage Risk</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <StressChip severity={aiPrediction.shortage.severity} />
              {aiPrediction.shortage.stressScore !== undefined && (
                <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Score: {Math.round(aiPrediction.shortage.stressScore)}
                </span>
              )}
            </div>
            <div className="ai-sub">Confidence</div>
            <div className="confidence-bar">
              <div className="confidence-bar-bg">
                <div className="confidence-bar-fill" style={{ width: `${(aiPrediction.shortage.confidence ?? 0) * 100}%` }} />
              </div>
              <span className="confidence-label">{((aiPrediction.shortage.confidence ?? 0) * 100).toFixed(0)}%</span>
            </div>
            {aiPrediction.shortage.topFactors?.length > 0 && (
              <div className="ai-sub" style={{ marginTop: 8 }}>
                {aiPrediction.shortage.topFactors.slice(0, 2).join(' · ')}
              </div>
            )}
            <div className="ai-sub" style={{ marginTop: 4 }}>
              Inputs: tank level trend · consumption · rainfall forecast
            </div>
          </GlassCard>

          {/* Leak */}
          <GlassCard style={{ padding: '18px', flexDirection: 'column', gap: 0 }}>
            <div className="ai-label" style={{ marginBottom: 8 }}>Leak Detection</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em',
                color: aiPrediction.leak.leakProbability > 0.6 ? 'var(--high)'
                     : aiPrediction.leak.leakProbability > 0.25 ? 'var(--medium)'
                     : 'var(--low)',
              }}>
                {(aiPrediction.leak.leakProbability * 100).toFixed(0)}%
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>probability</span>
            </div>
            {aiPrediction.leak.isLeak ? (
              <span className="badge leak-high">⚠ Leak Flagged</span>
            ) : (
              <span className="badge leak-low">✓ No leak detected</span>
            )}
            <div className="ai-sub" style={{ marginTop: 8 }}>
              {aiPrediction.leak.reason ?? 'Monitors: continuous/abnormal flow with no demand schedule'}
            </div>
            {aiPrediction.leak.sensorId && (
              <div style={{ marginTop: 6, fontSize: '0.70rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                Sensor: {aiPrediction.leak.sensorId}
              </div>
            )}
          </GlassCard>

          {/* Pump recommendation */}
          <GlassCard style={{ padding: '18px', flexDirection: 'column', gap: 0 }}>
            <div className="ai-label" style={{ marginBottom: 8 }}>Pump Recommendation</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Zap size={18}
                color={aiPrediction.pump.action === 'on' ? 'var(--low)' : 'var(--text-muted)'}
                fill={aiPrediction.pump.action === 'on' ? 'var(--low)' : 'none'} />
              <span style={{
                fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em',
                color: aiPrediction.pump.action === 'on' ? 'var(--low)' : 'var(--text-primary)',
              }}>
                Turn {aiPrediction.pump.action.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <CheckCircle2 size={12} color="var(--primary)" />
              <span className="ai-sub">
                {reasonLabel[aiPrediction.pump.reason] ?? aiPrediction.pump.reason}
              </span>
            </div>
            <div className="ai-sub">
              Logic: tank level + float switch + shortage risk + leak flag
            </div>
          </GlassCard>
        </div>
      ) : null}

      {/* Sensor list */}
      {sensors && sensors.length > 0 && (
        <>
          <div className="section-header">
            <div>
              <div className="section-title">
                <Activity size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />Live Sensors
              </div>
              <div className="section-sub">{sensors.length} sensors · polling every 10 s via Blynk</div>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span className="live-dot" /> Live
            </span>
          </div>

          <GlassCard style={{ marginBottom: 20, padding: '12px' }}>
            <div className="sensor-list">
              {sensors.map(s => <SensorRow key={s.id} sensor={s} />)}
            </div>
          </GlassCard>
        </>
      )}

      {/* Historical charts */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <GlassCard>
          <div className="chart-container">
            <div className="chart-title"><Activity size={13} /> Flow Rate (24 h)</div>
            <FlowRateChart data={flowRateData} height={180} />
          </div>
        </GlassCard>
        <GlassCard>
          <div className="chart-container">
            <div className="chart-title"><CloudRain size={13} /> Consumption vs Rainfall (14 d)</div>
            <ConsumptionChart
              consumptionData={consumptionHistory ?? []}
              rainfallData={rainfallHistory ?? []}
              height={180}
            />
          </div>
        </GlassCard>
      </div>

      {/* Pump action history */}
      {pumpHistory && pumpHistory.length > 0 && (
        <>
          <div className="section-header">
            <div>
              <div className="section-title">Pump Action History</div>
            </div>
          </div>

          <GlassCard style={{ marginBottom: 24, padding: '8px 0' }}>
            <table className="action-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Triggered By</th>
                  <th>Reason</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {pumpHistory.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: a.action === 'on' ? 'var(--low)' : 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontSize: '0.78rem',
                      }}>
                        {a.action === 'on' ? '⚡ ON' : '○ OFF'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.triggeredBy === 'auto' ? 'info' : 'neutral'}`}>
                        {a.triggeredBy === 'auto' ? '⚡ Auto' : '✋ Manual'}
                      </span>
                    </td>
                    <td>{reasonLabel[a.reason] ?? a.reason}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {formatTime(a.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </>
      )}
    </div>
  );
}
