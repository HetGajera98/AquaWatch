export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className} ${loading ? 'loading' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Processing...' : children}
    </button>
  );
}
