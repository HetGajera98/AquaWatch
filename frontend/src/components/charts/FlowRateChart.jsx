'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

function formatHour(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.90)',
        border: '1px solid rgba(255,255,255,0.95)',
        borderRadius: 10,
        padding: '8px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
        fontSize: '0.78rem',
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>{formatHour(label)}</div>
        <div style={{ fontWeight: 700, color: '#8B5CF6', fontSize: '0.90rem' }}>
          {payload[0].value.toFixed(2)} L/min
        </div>
      </div>
    );
  }
  return null;
};

export function FlowRateChart({ data, height = 160 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={formatHour}
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
