'use client';

import { useMemo } from 'react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(255,255,255,0.95)',
        borderRadius: 10,
        padding: '8px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        fontSize: '0.78rem',
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 5 }}>{formatDate(label)}</div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ color: p.color, fontWeight: 600, marginBottom: 2 }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
            {p.dataKey === 'consumption' ? ' L' : ' mm'}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ConsumptionChart({ consumptionData, rainfallData, height = 200 }) {
  const merged = useMemo(() => {
    return consumptionData.map((c, i) => ({
      time: c.time,
      consumption: c.value,
      rainfall: rainfallData[i]?.value ?? 0,
    }));
  }, [consumptionData, rainfallData]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={merged} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.00} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={formatDate}
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}mm`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="consumption"
          name="Consumption"
          stroke="#F59E0B"
          strokeWidth={2}
          fill="url(#consGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }}
        />
        <Bar
          yAxisId="right"
          dataKey="rainfall"
          name="Rainfall"
          fill="rgba(14,165,233,0.20)"
          radius={[3, 3, 0, 0]}
          maxBarSize={12}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
