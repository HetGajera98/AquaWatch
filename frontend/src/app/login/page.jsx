'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Droplets, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const [tab, setTab]             = useState('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const { login, signup }         = useAuth();
  const router                    = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fn = tab === 'login' ? login : signup;
    const err = await fn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push('/dashboard');
  };

  return (
    <div className="login-page">
      {/* Background blobs */}
      <div className="login-blob blob-1" />
      <div className="login-blob blob-2" />

      <GlassCard className="login-card animate-slide-up">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon" style={{ background: 'transparent', padding: 0 }}>
            <Logo size={42} />
          </div>
          <span className="login-logo-text">AquaWatch</span>
        </div>

        <p className="login-tagline">
          Water Intelligence Platform<br />
          <span style={{ fontSize: '0.78rem' }}>Monitor · Predict · Act</span>
        </p>

        {/* Tabs */}
        <div className="tab-row">
          <button
            className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); }}
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="operator@aquawatch.io"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {tab === 'login' ? 'Sign In →' : 'Create Account →'}
          </Button>
        </form>

        <div className="divider" />

        {/* Demo hint */}
        <div style={{
          background: 'rgba(14,165,233,0.06)',
          border: '1px solid rgba(14,165,233,0.15)',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}>
          <strong style={{ color: 'var(--primary)' }}>Demo credentials</strong><br />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Operator</span><br />
              Email: <code>operator@aquawatch.io</code><br />
              Password: <code>demo1234</code>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Admin</span><br />
              Email: <code>admin@aquawatch.io</code><br />
              Password: <code>demo1234</code>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
