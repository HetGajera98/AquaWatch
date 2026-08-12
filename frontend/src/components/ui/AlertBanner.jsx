'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AlertBanner({ alerts, onDismiss }) {
  const router = useRouter();
  const highAlerts = alerts.filter(a => a.severity === 'high' && !a.acknowledged);
  if (!highAlerts.length) return null;

  const first = highAlerts[0];
  const extraCount = highAlerts.length - 1;

  return (
    <div
      className="alert-banner"
      role="alert"
      onClick={() => router.push(`/zones/${first.zoneId}`)}
    >
      {/* Pulsing dot */}
      <span className="alert-banner-dot" />

      {/* Icon */}
      <AlertTriangle size={15} className="alert-banner-icon" />

      {/* Text — truncated in single line */}
      <span className="alert-banner-text">
        <strong>{first.zoneName}</strong>
        {' — '}
        {first.message}
        {extraCount > 0 && ` (+${extraCount} more)`}
      </span>

      {/* CTA */}
      <button
        className="alert-banner-cta"
        onClick={e => { e.stopPropagation(); router.push(`/zones/${first.zoneId}`); }}
      >
        View →
      </button>

      {/* Close */}
      <button
        className="alert-banner-close"
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        aria-label="Dismiss alert"
      >
        <X size={14} />
      </button>
    </div>
  );
}
