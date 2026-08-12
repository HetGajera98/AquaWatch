'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Map, Bell, Settings, Droplets, LogOut, X, Cpu, Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAlerts } from '@/hooks/useAlerts';
import { Logo } from '@/components/ui/Logo';

export function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { alerts } = useAlerts();
  const unreadCount = alerts.filter(a => a.severity === 'high' && !a.acknowledged).length;

  const navItems = [
    { to: '/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
    ...(user?.role === 'admin' ? [{ to: '/operators', Icon: Users, label: 'Operators' }] : []),
    { to: '/zones',     Icon: Map,             label: user?.role === 'admin' ? 'Zones' : 'Motor Stations' },
    { to: '/alerts',    Icon: Bell,            label: 'Alerts',  badge: unreadCount || undefined },
    ...(user?.role !== 'admin' ? [{ to: '/devices', Icon: Cpu, label: 'Devices' }] : []),
  ];

  const isActive = (to) =>
    pathname ? (pathname === to || pathname.startsWith(`${to}/`)) : false;

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : 'O';
  const email   = user?.email ?? 'operator@aquawatch.io';

  return (
    <>
      {/* Backdrop — only rendered when open, tapping closes drawer */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${isOpen ? ' open' : ''}`} aria-label="Sidebar navigation">
        {/* ── Header ── */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: 'transparent', padding: 0 }}>
            <Logo size={40} />
          </div>
          <span className="sidebar-logo-text">AquaWatch</span>
          {/* Close button only visible on tablet/mobile */}
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">Monitor</span>

          {navItems.map(({ to, Icon, label, badge }) => (
            <Link
              key={to}
              href={to}
              className={`nav-item${isActive(to) ? ' active' : ''}`}
              onClick={onClose}
              aria-current={isActive(to) ? 'page' : undefined}
            >
              <Icon size={18} className="nav-item-icon" />
              {label}
              {badge ? <span className="nav-badge">{badge}</span> : null}
            </Link>
          ))}

          <span className="nav-section-label" style={{ marginTop: 14 }}>System</span>

          <Link
            href="/settings"
            className={`nav-item${isActive('/settings') ? ' active' : ''}`}
            onClick={onClose}
            aria-current={isActive('/settings') ? 'page' : undefined}
          >
            <Settings size={18} className="nav-item-icon" />
            Settings
          </Link>
        </nav>

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          {/* User row */}
          <div className="nav-item" style={{ cursor: 'default', pointerEvents: 'none' }}>
            <div className="avatar" style={{ width: 26, height: 26, fontSize: '0.65rem', flexShrink: 0 }}>
              {initial}
            </div>
            <span style={{
              fontSize: '0.80rem', color: 'var(--text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, minWidth: 0,
            }}>
              {email}
            </span>
          </div>

          {/* Sign out */}
          <button
            className="nav-item"
            onClick={() => { onClose(); logout(); }}
            style={{ width: '100%', textAlign: 'left' }}
          >
            <LogOut size={18} className="nav-item-icon" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
