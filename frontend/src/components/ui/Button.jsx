export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const isLight = variant === 'ghost';
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className} ${loading ? 'loading' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <span className={`spinner ${isLight ? 'spinner-dark' : ''}`} style={{ width: 14, height: 14 }} />
          <span>Processing...</span>
        </>
      ) : children}
    </button>
  );
}

