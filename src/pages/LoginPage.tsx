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
                <div className="logo-name">PODZO Portal</div>
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
          background: linear-gradient(145deg, #4D148C 0%, #380C68 60%, #2B0852 100%);
          padding: 3rem;
          display: flex;
          align-items: center;
        }
        .login-hero-content { color: white; }
        .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 3rem; }
        .logo-icon {
          width: 48px; height: 48px;
          background: #FF6200;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(255, 98, 0, 0.4);
        }
        .logo-name { font-size: 1.25rem; font-weight: 800; color: white; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.02em; }
        .logo-sub { font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 600; }
        .login-hero-title {
          font-size: 1.875rem; font-weight: 800; line-height: 1.2;
          margin-bottom: 1rem; color: white; text-transform: uppercase; letter-spacing: -0.02em;
        }
        .login-hero-desc { color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 2rem; font-size: 0.9rem; }
        .login-stats { display: flex; gap: 2rem; }
        .login-stat { text-align: center; }
        .stat-num { display: block; font-size: 1.5rem; font-weight: 800; color: #FF6200; }
        .stat-lbl { font-size: 0.7rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }

        .login-form-panel {
          background: #FFFFFF;
          display: flex; align-items: center; justify-content: center;
          padding: 2.5rem;
        }
        .login-form-inner { width: 100%; max-width: 360px; }
        .login-form-header { margin-bottom: 2rem; }
        .login-form-header h2 { font-size: 1.5rem; font-weight: 800; color: #333333; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.02em; }
        .login-form-header p { font-size: 0.875rem; color: #666666; }

        .login-error {
          display: flex; align-items: center; gap: 8px;
          background: rgba(211, 47, 47, 0.1); color: #D32F2F;
          border: 1px solid rgba(211, 47, 47, 0.25);
          border-radius: 6px; padding: 0.625rem 0.875rem;
          font-size: 0.85rem; margin-bottom: 1rem;
        }

        .login-form { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { font-size: 0.75rem; font-weight: 700; color: #666666; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-group input {
          background: #FAFAFA;
          border: 1px solid #CCCCCC;
          border-radius: 6px;
          padding: 0.625rem 0.875rem;
          color: #333333;
          font-size: 0.9rem;
          transition: border-color 0.15s;
          width: 100%;
        }
        .form-group input:focus { outline: none; border-color: #4D148C; }
        .password-input-wrap { position: relative; }
        .password-input-wrap input { padding-right: 2.5rem; }
        .pwd-toggle {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #666666;
          cursor: pointer; display: flex; align-items: center; padding: 2px;
        }
        .btn-login {
          background: #FF6200;
          color: white; border: none; border-radius: 9999px;
          padding: 0.75rem; font-weight: 800; font-size: 0.9rem;
          text-transform: uppercase; letter-spacing: 0.04em;
          cursor: pointer; transition: background 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-login:hover:not(:disabled) { background: #E05600; box-shadow: 0 4px 14px rgba(255, 98, 0, 0.35); }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .demo-divider {
          display: flex; align-items: center; gap: 1rem;
          margin: 1.25rem 0; color: #666666; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em;
        }
        .demo-divider::before, .demo-divider::after {
          content: ''; flex: 1; height: 1px; background: #E3E3E3;
        }
        .demo-users { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .demo-user-btn {
          display: flex; align-items: center; gap: 10px;
          background: #FAFAFA; border: 1px solid #E3E3E3;
          border-radius: 6px; padding: 0.625rem 0.875rem;
          cursor: pointer; text-align: left; transition: border-color 0.15s, background 0.15s;
          width: 100%;
        }
        .demo-user-btn:hover:not(:disabled) {
          border-color: #4D148C;
          background: #F2ECFB;
        }
        .demo-user-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .demo-user-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .demo-user-info { display: flex; flex-direction: column; }
        .demo-user-role { font-size: 0.8rem; font-weight: 700; color: #333333; }
        .demo-user-name { font-size: 0.72rem; color: #666666; }
        .demo-pwd-hint { font-size: 0.75rem; color: #666666; text-align: center; }
        .demo-pwd-hint code { background: #F5F5F5; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: 700; }

        @media (max-width: 640px) {
          .login-container { grid-template-columns: 1fr; }
          .login-hero { display: none; }
        }
      `}</style>
    </div>
  );
}
