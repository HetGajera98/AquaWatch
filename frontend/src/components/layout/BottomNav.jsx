'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map, Bell, Settings } from 'lucide-react';
import { mockAlerts } from '@/lib/mockData';

export function BottomNav() {
  const pathname = usePathname();
  const unreadCount = mockAlerts.filter(a => a.severity === 'high' && !a.acknowledged).length;

  const items = [
    { to: '/dashboard', label: 'Home',    Icon: LayoutDashboard },
    { to: '/zones',     label: 'Zones',   Icon: Map },
    { to: '/alerts',    label: 'Alerts',  Icon: Bell, badge: unreadCount || undefined },
    { to: '/settings',  label: 'Settings',Icon: Settings },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {items.map(({ to, label, Icon, badge }) => {
        const isActive = pathname
          ? pathname === to || pathname.startsWith(`${to}/`)
          : false;
        return (
          <Link
            key={to}
            href={to}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
            {badge ? <span className="bottom-nav-badge" aria-label={`${badge} alerts`} /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
