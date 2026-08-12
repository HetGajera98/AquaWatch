'use client';

import { useState, useEffect } from 'react';
import { Menu, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceLive } from '@/hooks/useDeviceLive';

export function TopBar({ title, onMenuToggle }) {
  const { user } = useAuth();
  const { data } = useDeviceLive();
  const [time, setTime] = useState('');
  const [spinning, setSpinning] = useState(false);
  
  const isOnline = data?.online ?? false;

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      );
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  function handleRefresh() {
    setSpinning(true);
    setTimeout(() => { window.location.reload(); }, 400);
  }

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'O';
  const email   = user?.email ?? 'operator@aquawatch.io';

  return (
    <header className="topbar">
      {/* Left — hamburger + title */}
      <div className="topbar-left">
        <button
          className="menu-toggle-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={19} />
        </button>
        <span className="topbar-title">{title}</span>
      </div>

      {/* Right — live chip · time · refresh · user */}
      <div className="topbar-right">
        {/* Live badge */}
        <div className="live-badge" style={{
          borderColor: isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
          background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
        }}>
          <span className="live-dot" style={{ 
            background: isOnline ? '#10B981' : '#ef4444',
            boxShadow: isOnline ? '0 0 6px #10B981' : 'none'
          }} />
          <span style={{ color: isOnline ? '#10B981' : '#ef4444' }}>
            {isOnline ? 'Live' : 'Offline'}
          </span>
          {isOnline ? <Wifi size={12} color="#10B981" /> : <WifiOff size={12} color="#ef4444" />}
        </div>

        {/* Clock */}
        <span className="topbar-time">{time}</span>

        {/* Refresh */}
        <button
          className="refresh-btn"
          onClick={handleRefresh}
          title="Refresh data"
          style={spinning ? { animation: 'spin 0.4s linear' } : {}}
        >
          <RefreshCw size={15} />
        </button>

        {/* User chip */}
        <div className="topbar-chip">
          <div className="avatar">{initial}</div>
          <span className="topbar-chip-text">{email}</span>
        </div>
      </div>
    </header>
  );
}
