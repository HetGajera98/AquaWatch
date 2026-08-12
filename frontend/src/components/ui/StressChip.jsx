export function StressChip({ severity, size = 'md' }) {
  return (
    <div className={`stress-chip ${severity} size-${size}`}>
      <span className="stress-dot" />
      {severity}
    </div>
  );
}
