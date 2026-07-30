'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { useAlerts } from '@/hooks/useAlerts';
import { useAuth } from '@/hooks/useAuth';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/zones':     'Zones',
  '/alerts':    'Alerts',
  '/settings':  'Settings',
};

function resolveTitle(pathname) {
  if (!pathname) return 'AquaWatch';
  if (pathname.startsWith('/zones/')) return 'Zone Detail';
  return PAGE_TITLES[pathname] ?? 'AquaWatch';
}

// Separate component so useAlerts only runs when user is logged in
function ShellWithAlerts({ children, pathname }) {
  const { alerts } = useAlerts();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.acknowledged);
  const showBanner = !bannerDismissed && highAlerts.length > 0;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar title={resolveTitle(pathname)} />
        {showBanner && (
          <AlertBanner
            alerts={alerts}
            onDismiss={() => setBannerDismissed(true)}
          />
        )}
        <main
          className="page-content"
          style={{ marginTop: showBanner ? 'calc(var(--topbar-height) + 46px)' : undefined }}
        >
          {children}
        </main>
      </div>
    </div>
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
    return <>{children}</>;
  }

  // Don't render the shell (and trigger API calls) until we know user is present
  if (!isMounted || !user) {
    return null;
  }

  return <ShellWithAlerts pathname={pathname}>{children}</ShellWithAlerts>;
}
