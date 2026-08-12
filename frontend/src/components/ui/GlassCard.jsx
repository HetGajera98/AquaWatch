export function GlassCard({ children, className = '', style, onClick, interactive = false, glow = null }) {
  const isInteractive = interactive || Boolean(onClick);
  const glowClass = glow ? `glass-glow-${glow}` : '';

  return (
    <div
      className={`glass ${isInteractive ? 'glass-interactive' : ''} ${glowClass} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

