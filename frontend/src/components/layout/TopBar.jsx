'use client';

import { Wifi, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function TopBar({ title }) {
  const { user } = useAuth();
  const now = new Date().toLocaleString('en-IN', {
    hour: '2-digit', minute: '2-digit',
    day: 'numeric', month: 'short',
  });

  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>
      <div className="topbar-right">
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span className="live-dot" />
          <span>Live</span>
          <Wifi size={13} />
        </div>

        {/* Timestamp */}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{now}</span>

        {/* Refresh */}
        <button
          className="btn btn-ghost btn-sm"
          style={{ gap: 5, padding: '5px 10px' }}
          onClick={() => window.location.reload()}
          title="Refresh data"
        >
          <RefreshCw size={13} />
        </button>

        {/* User chip */}
        <div className="topbar-chip">
          <div className="avatar">
            {user?.email ? user.email.charAt(0).toUpperCase() : 'O'}
          </div>
          <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? 'operator@aquawatch.io'}
          </span>
        </div>
      </div>
    </header>
  );
}
