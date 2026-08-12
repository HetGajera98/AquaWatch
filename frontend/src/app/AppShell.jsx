'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { useAlerts } from '@/hooks/useAlerts';
import { useAuth } from '@/hooks/useAuth';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/zones':     'Zones',
  '/alerts':    'Alerts',
  '/settings':  'Settings',
  '/devices':   'Live Devices',
};

function resolveTitle(pathname) {
  if (!pathname) return 'AquaWatch';
  if (pathname.startsWith('/zones/')) return 'Zone Detail';
  return PAGE_TITLES[pathname] ?? 'AquaWatch';
}

// Ambient Background liquid orbs
function AmbientBackground() {
  return (
    <div className="ambient-bg">
      <div className="liquid-orb orb-1" />
      <div className="liquid-orb orb-2" />
      <div className="liquid-orb orb-3" />
    </div>
  );
}

// Separate component so useAlerts only runs when user is logged in
function ShellWithAlerts({ children, pathname }) {
  const { alerts } = useAlerts();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.acknowledged);
  const showBanner = !bannerDismissed && highAlerts.length > 0;

  return (
    <>
      <AmbientBackground />
      <div className="app-shell">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-area">
          <TopBar
            title={resolveTitle(pathname)}
            onMenuToggle={() => setSidebarOpen(prev => !prev)}
          />
          {showBanner && (
            <AlertBanner
              alerts={alerts}
              onDismiss={() => setBannerDismissed(true)}
            />
          )}
          <main className="page-content">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </>
  );
}

export function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isMounted && !user && !isLoginPage) {
      router.replace('/login');
    }
  }, [isMounted, user, isLoginPage, router]);

  if (isLoginPage) {
    return (
      <>
        <AmbientBackground />
        {children}
      </>
    );
  }

  // Don't render the shell (and trigger API calls) until we know user is present
  if (!isMounted || !user) {
    return null;
  }

  return <ShellWithAlerts pathname={pathname}>{children}</ShellWithAlerts>;
}

