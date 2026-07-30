'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AlertBanner({ alerts, onDismiss }) {
  const router = useRouter();
  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.acknowledged);
  if (!highAlerts.length) return null;

  const first = highAlerts[0];

  return (
    <div
      className="alert-banner"
      onClick={() => router.push(`/zones/${first.zoneId}`)}
    >
      <span className="alert-banner-dot" />
      <AlertTriangle size={15} style={{ color: '#B91C1C', flexShrink: 0 }} />
      <span className="alert-banner-text">
        <strong>{first.zoneName}</strong> — {first.message}
        {highAlerts.length > 1 && ` (+${highAlerts.length - 1} more)`}
      </span>
      <span className="alert-banner-cta">Investigate →</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#B91C1C', display: 'flex', alignItems: 'center',
          padding: '2px', marginLeft: 4,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
