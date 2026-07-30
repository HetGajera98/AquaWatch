export function GlassCard({ children, className = '', style, onClick }) {
  return (
    <div
      className={`glass ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
