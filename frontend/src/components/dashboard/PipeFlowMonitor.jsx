'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Droplets, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

// Seeded pseudo-random so each pipe gets a stable split ratio on mount
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getPipeStatus(flowLpm) {
  if (flowLpm === 0)    return { label: 'Closed',   color: 'var(--text-muted)',  bg: 'rgba(148,163,184,0.10)' };
  if (flowLpm < 2)     return { label: 'Low Flow',  color: 'var(--medium)',      bg: 'rgba(245,158,11,0.10)'  };
  if (flowLpm > 14)    return { label: 'High Flow', color: 'var(--high)',        bg: 'rgba(239,68,68,0.10)'   };
  return               { label: 'Normal',    color: 'var(--low)',        bg: 'rgba(34,197,94,0.10)'   };
}

function FlowBar({ value, max }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const color = value === 0 ? 'var(--text-muted)' : value > 14 ? 'var(--high)' : value < 2 ? 'var(--medium)' : 'var(--low)';
  return (
    <div style={{ height: 6, background: 'rgba(148,163,184,0.15)', borderRadius: 99, overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color,
        borderRadius: 99,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

let pipeCounter = 1;

export function PipeFlowMonitor({ totalFlowLpm = 0 }) {
  const [pipes, setPipes] = useState(() => [
    { id: 1, name: 'Inlet Pipe — Main',    ratio: 0.45 },
    { id: 2, name: 'Outlet Pipe — Zone A', ratio: 0.35 },
    { id: 3, name: 'Outlet Pipe — Zone B', ratio: 0.20 },
  ]);
  const [newName, setNewName]   = useState('');
  const [adding, setAdding]     = useState(false);

  // Re-normalise ratios whenever pipes change so they always sum to 1
  const normalise = (list) => {
    const total = list.reduce((s, p) => s + p.ratio, 0) || 1;
    return list.map(p => ({ ...p, ratio: p.ratio / total }));
  };

  const addPipe = () => {
    const name = newName.trim() || `Pipe ${pipes.length + 1}`;
    const newRatio = 0.15;
    pipeCounter++;
    const updated = normalise([...pipes.map(p => ({ ...p, ratio: p.ratio * 0.85 })), {
      id: Date.now(), name, ratio: newRatio,
    }]);
    setPipes(updated);
    setNewName('');
    setAdding(false);
  };

  const removePipe = (id) => {
    if (pipes.length <= 1) return;
    setPipes(prev => normalise(prev.filter(p => p.id !== id)));
  };

  const maxFlow = Math.max(...pipes.map(p => p.ratio * totalFlowLpm), 0.1);

  return (
    <GlassCard style={{ marginBottom: 20, padding: '16px' }}>
      {/* Toolbar (just Add button now) */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end',
        marginBottom: 14,
      }}>
        <button
          onClick={() => setAdding(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.72rem', fontWeight: 700,
            padding: '6px 12px', borderRadius: 99,
            background: adding ? 'rgba(239,68,68,0.10)' : 'rgba(14,165,233,0.12)',
            color: adding ? 'var(--high)' : 'var(--primary)',
            border: `1px solid ${adding ? 'rgba(239,68,68,0.25)' : 'rgba(14,165,233,0.25)'}`,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <Plus size={12} style={{ transform: adding ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
          {adding ? 'Cancel' : 'Add Pipe'}
        </button>
      </div>

      {/* Add pipe input */}
      {adding && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 14,
          padding: '10px 12px', borderRadius: 10,
          background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)',
        }}>
          <input
            autoFocus
            placeholder="Pipe name (e.g. Outlet Pipe — Zone C)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPipe()}
            style={{
              flex: 1, fontSize: '0.80rem', padding: '6px 10px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <button
            onClick={addPipe}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: '0.78rem',
              fontWeight: 700, background: 'var(--primary)', color: '#fff',
              border: 'none', cursor: 'pointer',
            }}
          >
            Add
          </button>
        </div>
      )}

      {/* Pipe rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pipes.map((pipe, idx) => {
          const flow   = parseFloat((pipe.ratio * totalFlowLpm).toFixed(2));
          const status = getPipeStatus(flow);
          return (
            <div key={pipe.id} style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              padding: '12px 14px', borderRadius: 12,
              background: status.bg,
              border: '1px solid var(--border)',
              transition: 'background 0.4s',
            }}>
              {/* Row 1: name + flow + status badge + delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Pipe number pill */}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)',
                }}>
                  {idx + 1}
                </div>

                {/* Name */}
                <span style={{ flex: 1, fontSize: '0.80rem', fontWeight: 600, color: 'var(--text-primary)', minWidth: 0 }}>
                  {pipe.name}
                </span>

                {/* Flow value */}
                <span style={{ fontSize: '0.90rem', fontWeight: 800, color: status.color, whiteSpace: 'nowrap' }}>
                  {flow.toFixed(2)}
                  <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 2 }}>L/min</span>
                </span>

                {/* Status badge */}
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  padding: '2px 8px', borderRadius: 99,
                  background: status.bg, color: status.color,
                  border: `1px solid ${status.color}44`,
                  whiteSpace: 'nowrap',
                }}>
                  {status.label}
                </span>

                {/* Alert icon if anomaly */}
                {(flow > 14 || (totalFlowLpm > 0 && flow < 0.5)) && (
                  <AlertTriangle size={14} style={{ color: 'var(--high)', flexShrink: 0 }} />
                )}

                {/* Delete button */}
                <button
                  onClick={() => removePipe(pipe.id)}
                  disabled={pipes.length <= 1}
                  title="Remove pipe"
                  style={{
                    background: 'none', border: 'none', cursor: pipes.length <= 1 ? 'not-allowed' : 'pointer',
                    color: pipes.length <= 1 ? 'var(--text-muted)' : 'var(--high)',
                    opacity: pipes.length <= 1 ? 0.3 : 0.7,
                    padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center',
                    transition: 'opacity 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Row 2: flow bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: 40, flexShrink: 0 }}>
                  {(pipe.ratio * 100).toFixed(0)}%
                </span>
                <FlowBar value={flow} max={maxFlow} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: 46, flexShrink: 0, textAlign: 'right' }}>
                  of total
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)',
        fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <AlertTriangle size={11} />
        Flow is distributed proportionally across pipes based on your configuration. Anomaly flag triggers above 14 L/min or below 0.5 L/min.
      </div>
    </GlassCard>
  );
}
