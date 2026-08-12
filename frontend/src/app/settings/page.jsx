'use client';

import { useState } from 'react';
import { Settings, Bell, Shield, Database, Palette, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/app/providers';

// Premium Animated Toggle Component
function Toggle({ checked, onChange }) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--primary)' : 'var(--border)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.3s ease',
        border: '1px solid',
        borderColor: checked ? 'var(--primary)' : 'rgba(255,255,255,0.1)'
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }} />
    </div>
  );
}

// Premium Select Dropdown Component
function Dropdown({ value, options, onChange }) {
  return (
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'rgba(14, 165, 233, 0.05)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: '0.82rem',
        fontWeight: 600,
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        paddingRight: 24,
      }}
      className="settings-select"
    >
      {options.map(opt => <option key={opt} value={opt} style={{ background: 'var(--card-bg)' }}>{opt}</option>)}
    </select>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] = useState({
    alertsEnabled: true,
    emailEnabled: false,
    pollingInterval: '10 seconds',
    weatherRefresh: 'Every 15 minutes',
    exportFormat: 'CSV',
    language: 'English (US)',
  });

  const updateSetting = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const sections = [
    {
      title: 'Account',
      icon: Shield,
      items: [
        { label: 'Email', value: user?.email ?? 'operator@aquawatch.io', type: 'text' },
        { label: 'Role', value: user?.role === 'admin' ? 'Admin' : 'Operator', type: 'text' },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { 
          label: 'High severity alerts', 
          type: 'toggle', 
          checked: settings.alertsEnabled, 
          onChange: (v) => updateSetting('alertsEnabled', v) 
        },
        { 
          label: 'Email notifications', 
          type: 'toggle', 
          checked: settings.emailEnabled, 
          onChange: (v) => updateSetting('emailEnabled', v) 
        },
      ],
    },
    {
      title: 'Data & Telemetry',
      icon: Database,
      items: [
        { 
          label: 'Sensor polling interval', 
          type: 'select', 
          value: settings.pollingInterval, 
          options: ['5 seconds', '10 seconds', '30 seconds', '1 minute'],
          onChange: (v) => updateSetting('pollingInterval', v) 
        },
        { 
          label: 'Weather refresh', 
          type: 'select', 
          value: settings.weatherRefresh, 
          options: ['Every 15 minutes', 'Every 30 minutes', 'Hourly'],
          onChange: (v) => updateSetting('weatherRefresh', v) 
        },
        { label: 'Historical data retention', value: '90 days', type: 'text' },
        { 
          label: 'Data export format', 
          type: 'select', 
          value: settings.exportFormat, 
          options: ['CSV', 'JSON', 'Excel (XLSX)'],
          onChange: (v) => updateSetting('exportFormat', v) 
        },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        { label: 'Dark Mode', type: 'action', value: 'Toggle Theme', action: 'theme' },
        { 
          label: 'Language', 
          type: 'select', 
          value: settings.language, 
          options: ['English (US)', 'English (UK)', 'Hindi', 'Gujarati'],
          onChange: (v) => updateSetting('language', v) 
        },
      ],
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Platform configuration and account preferences</p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .settings-select {
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 8px top 50% !important;
          background-size: 8px auto !important;
        }
        .settings-select:hover {
          border-color: var(--primary) !important;
        }
      `}} />

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
        {sections.map(({ title, icon: Icon, items }) => (
          <GlassCard key={title} style={{ padding: '22px', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)'
              }}>
                <Icon size={16} color="var(--primary)" />
              </div>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>{title}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {items.map((item, i) => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.type === 'action' && item.action === 'theme' && (
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={toggleTheme}
                        style={{ fontSize: '0.78rem', padding: '6px 14px', borderRadius: 8 }}
                      >
                        {theme === 'dark' ? 'Switch to Light Mode ☀' : 'Switch to Dark Mode 🌙'}
                      </button>
                    )}
                    {item.type === 'text' && (
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</span>
                    )}
                    {item.type === 'toggle' && (
                      <Toggle checked={item.checked} onChange={item.onChange} />
                    )}
                    {item.type === 'select' && (
                      <Dropdown value={item.value} options={item.options} onChange={item.onChange} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: 14, border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Check size={16} color="#10b981" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10b981' }}>
              All settings synced successfully
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            AquaWatch OS v1.0
          </span>
        </div>
      </div>
    </div>
  );
}
