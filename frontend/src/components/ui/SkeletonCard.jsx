/**
 * SkeletonStatCard — exact same layout/size as a real GlassCard stat-card.
 * Renders an animated shimmer so the grid never collapses on load.
 */
export function SkeletonStatCard() {
  return (
    <div className="glass skeleton-stat">
      <div className="skeleton-stat-label skeleton-pulse" />
      <div className="skeleton-stat-value skeleton-pulse" />
      <div className="skeleton-stat-sub skeleton-pulse" />
    </div>
  );
}

/**
 * SkeletonZoneCard — exact same layout/size as a real ZoneCard.
 * Four columns of metrics, chart area, tank bar, and pump row.
 */
export function SkeletonZoneCard() {
  return (
    <div className="glass skeleton-zone">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton-zone-title skeleton-pulse" />
          <div className="skeleton-zone-city skeleton-pulse" />
        </div>
        <div className="skeleton-pulse" style={{ width: 56, height: 22, borderRadius: 100 }} />
      </div>
      {/* Chart placeholder */}
      <div className="skeleton-zone-chart skeleton-pulse" />
      {/* Tank bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton-pulse" style={{ height: 10, width: '100%', borderRadius: 100 }} />
        <div className="skeleton-zone-bar skeleton-pulse" />
      </div>
      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="skeleton-zone-m1 skeleton-pulse" />
        <div className="skeleton-zone-m2 skeleton-pulse" />
        <div className="skeleton-zone-m3 skeleton-pulse" />
        <div className="skeleton-zone-m4 skeleton-pulse" />
      </div>
      {/* Pump row */}
      <div className="skeleton-zone-pump skeleton-pulse" />
    </div>
  );
}
