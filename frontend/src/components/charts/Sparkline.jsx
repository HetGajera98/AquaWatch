'use client';

import { memo } from 'react';

/**
 * Lightweight SVG sparkline — replaces Recharts AreaChart on the dashboard cards.
 * Zero external dependencies, no ResizeObserver, renders in <1ms.
 */
const Sparkline = memo(function Sparkline({ data = [], height = 90, color = '#0EA5E9' }) {
  if (!data || data.length < 2) {
    return <div style={{ height, opacity: 0.3, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>No data</div>;
  }

  const values = data.map(d => d.value ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 300, H = height;
  const pad = 4;

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = pad + ((max - v) / range) * (H - pad * 2);
    return [x, y];
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0.00} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export { Sparkline };
