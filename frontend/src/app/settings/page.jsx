'use client';

import { Settings, Bell, Shield, Database } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();

  const sections = [
    {
      title: 'Account',
      icon: Shield,
      items: [
        { label: 'Email', value: user?.email ?? 'operator@aquawatch.io', editable: false },
        { label: 'Role', value: 'Operator', editable: false },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'High severity alerts', value: 'Enabled', editable: true },
        { label: 'Email notifications', value: 'Disabled', editable: true },
      ],
    },
    {
      title: 'Data',
      icon: Database,
      items: [
        { label: 'Sensor polling interval', value: '10 seconds', editable: true },
        { label: 'Weather refresh', value: 'Every 15 minutes', editable: true },
        { label: 'Historical data retention', value: '90 days', editable: false },
      ],
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Platform configuration and account preferences</p>
      </div>

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sections.map(({ title, icon: Icon, items }) => (
          <GlassCard key={title} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} color="var(--primary)" />
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {items.map(({ label, value, editable }, i) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                    {editable && (
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.70rem', padding: '3px 8px' }}>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}

        <GlassCard style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Settings size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            AquaWatch Next.js v1.0.0 · Hackathon Build · All predictions are rule-based baselines
          </span>
        </GlassCard>
      </div>
    </div>
  );
}
