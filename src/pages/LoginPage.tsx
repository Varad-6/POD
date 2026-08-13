import React, { useState } from 'react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { Shield, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

const DEMO_USERS = [
  { username: 'ca_thandiwe', role: 'Company Admin', color: '#3b82f6' },
  { username: 'ta_sipho',    role: 'Transporter Admin', color: '#8b5cf6' },
  { username: 'dr_zweli',    role: 'Driver', color: '#10b981' },
  { username: 'cr_mining',   role: 'Customer', color: '#f59e0b' },
  { username: 'sr_gate01',   role: 'Supervisor', color: '#ef4444' },
];

export default function LoginPage() {
  const { login } = useAuthV3();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (u: string) => {
    setError('');
    setLoading(true);
    try {
      await login(u, 'Demo@1234');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Panel — Branding */}
        <div className="login-hero">
          <div className="login-hero-content">
            <div className="login-logo">
              <div className="logo-icon">
                <Shield size={28} strokeWidth={1.5} />
              </div>
              <div>
                <div className="logo-name">Ikwezi Portal</div>
                <div className="logo-sub">Transporter Management</div>
              </div>
            </div>
            <h1 className="login-hero-title">Automate POD-to-Payment</h1>
            <p className="login-hero-desc">
              End-to-end dispatch management connected to SAP S/4HANA. From gate-check to MIRO clearance.
            </p>
            <div className="login-stats">
              <div className="login-stat">
                <span className="stat-num">5</span>
                <span className="stat-lbl">Role Levels</span>
              </div>
              <div className="login-stat">
                <span className="stat-num">18+</span>
                <span className="stat-lbl">Pipeline Steps</span>
              </div>
              <div className="login-stat">
                <span className="stat-num">SAP</span>
                <span className="stat-lbl">S/4HANA Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="login-form-panel">
          <div className="login-form-inner">
            <div className="login-form-header">
              <h2>Sign In</h2>
              <p>Access your role-based portal</p>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="password-input-wrap">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : 'Sign In'}
              </button>
            </form>

            <div className="demo-divider">
              <span>Quick demo access</span>
            </div>

            <div className="demo-users">
              {DEMO_USERS.map(u => (
                <button
                  key={u.username}
                  className="demo-user-btn"
                  onClick={() => quickLogin(u.username)}
                  disabled={loading}
                  style={{ '--accent': u.color } as React.CSSProperties}
                >
                  <span className="demo-user-dot" style={{ background: u.color }} />
                  <div className="demo-user-info">
                    <span className="demo-user-role">{u.role}</span>
                    <span className="demo-user-name">{u.username}</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="demo-pwd-hint">All demo accounts: <code>Demo@1234</code></p>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg);
          padding: 1rem;
        }
        .login-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 960px;
          width: 100%;
          min-height: 600px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.35);
        }
        .login-hero {
          background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 60%, #1e40af 100%);
          padding: 3rem;
          display: flex;
          align-items: center;
        }
        .login-hero-content { color: white; }
        .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 3rem; }
        .logo-icon {
          width: 48px; height: 48px;
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white;
        }
        .logo-name { font-size: 1.25rem; font-weight: 700; color: white; line-height: 1.2; }
        .logo-sub { font-size: 0.75rem; color: rgba(255,255,255,0.6); }
        .login-hero-title {
          font-size: 1.875rem; font-weight: 700; line-height: 1.2;
          margin-bottom: 1rem; color: white;
        }
        .login-hero-desc { color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 2rem; font-size: 0.9rem; }
        .login-stats { display: flex; gap: 2rem; }
        .login-stat { text-align: center; }
        .stat-num { display: block; font-size: 1.5rem; font-weight: 700; color: white; }
        .stat-lbl { font-size: 0.7rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; }

        .login-form-panel {
          background: var(--color-surface);
          display: flex; align-items: center; justify-content: center;
          padding: 2.5rem;
        }
        .login-form-inner { width: 100%; max-width: 360px; }
        .login-form-header { margin-bottom: 2rem; }
        .login-form-header h2 { font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.25rem; }
        .login-form-header p { font-size: 0.875rem; color: var(--color-text-muted); }

        .login-error {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.1); color: #ef4444;
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px; padding: 0.625rem 0.875rem;
          font-size: 0.85rem; margin-bottom: 1rem;
        }

        .login-form { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .form-group input {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          color: var(--color-text);
          font-size: 0.9rem;
          transition: border-color 0.15s;
          width: 100%;
        }
        .form-group input:focus { outline: none; border-color: var(--color-primary); }
        .password-input-wrap { position: relative; }
        .password-input-wrap input { padding-right: 2.5rem; }
        .pwd-toggle {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: var(--color-text-muted);
          cursor: pointer; display: flex; align-items: center; padding: 2px;
        }
        .btn-login {
          background: var(--color-primary);
          color: white; border: none; border-radius: 8px;
          padding: 0.75rem; font-weight: 600; font-size: 0.9rem;
          cursor: pointer; transition: opacity 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-login:hover:not(:disabled) { opacity: 0.9; }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .demo-divider {
          display: flex; align-items: center; gap: 1rem;
          margin: 1.25rem 0; color: var(--color-text-muted); font-size: 0.75rem;
        }
        .demo-divider::before, .demo-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--color-border);
        }
        .demo-users { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .demo-user-btn {
          display: flex; align-items: center; gap: 10px;
          background: var(--color-bg); border: 1px solid var(--color-border);
          border-radius: 8px; padding: 0.625rem 0.875rem;
          cursor: pointer; text-align: left; transition: border-color 0.15s, background 0.15s;
          width: 100%;
        }
        .demo-user-btn:hover:not(:disabled) {
          border-color: var(--accent, var(--color-primary));
          background: rgba(59,130,246,0.05);
        }
        .demo-user-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .demo-user-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .demo-user-info { display: flex; flex-direction: column; }
        .demo-user-role { font-size: 0.8rem; font-weight: 600; color: var(--color-text); }
        .demo-user-name { font-size: 0.72rem; color: var(--color-text-muted); }
        .demo-pwd-hint { font-size: 0.75rem; color: var(--color-text-muted); text-align: center; }
        .demo-pwd-hint code { background: var(--color-bg); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }

        @media (max-width: 640px) {
          .login-container { grid-template-columns: 1fr; }
          .login-hero { display: none; }
        }
      `}</style>
    </div>
  );
}
