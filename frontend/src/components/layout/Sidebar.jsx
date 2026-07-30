'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Map, Bell, Settings, Droplets, LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { mockAlerts } from '@/lib/mockData';

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const unacknowledgedHigh = mockAlerts.filter(a => a.severity === 'high' && !a.acknowledged).length;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/zones', icon: Map, label: 'Zones' },
    { to: '/alerts', icon: Bell, label: 'Alerts', badge: unacknowledgedHigh || undefined },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Droplets size={20} color="#fff" />
        </div>
        <span className="sidebar-logo-text">AquaWatch</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Monitor</span>
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const isActive = pathname ? (pathname === to || pathname.startsWith(`${to}/`)) : false;
          return (
            <Link
              key={to}
              href={to}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} className="nav-item-icon" />
              {label}
              {badge ? <span className="nav-badge">{badge}</span> : null}
            </Link>
          );
        })}

        <span className="nav-section-label" style={{ marginTop: 12 }}>System</span>
        <Link
          href="/settings"
          className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
        >
          <Settings size={16} className="nav-item-icon" />
          Settings
        </Link>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          className="nav-item"
          style={{ marginBottom: 4, cursor: 'default' }}
        >
          <div className="avatar" style={{ width: 22, height: 22, fontSize: '0.6rem' }}>
            {user?.email ? user.email.charAt(0).toUpperCase() : 'O'}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email ?? 'operator@aquawatch.io'}
          </span>
        </div>
        <button
          className="nav-item"
          onClick={logout}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
        >
          <LogOut size={16} className="nav-item-icon" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
