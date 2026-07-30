'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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
        <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>{formatDate(label)}</div>
        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.90rem' }}>
          {payload[0].value.toFixed(1)}%
        </div>
      </div>
    );
  }
  return null;
};

export function TankLevelChart({ data, height = 180 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="tankGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0EA5E9" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.00} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tickFormatter={formatDate}
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#0EA5E9"
          strokeWidth={2}
          fill="url(#tankGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#0EA5E9', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
