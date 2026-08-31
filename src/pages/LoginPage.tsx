import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { AlertCircle, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { PodzoLogo } from '../components/branding/PodzoLogo';

const DEMO_USERS = [
  { username: 'ca_thandiwe', role: 'Company Admin',     color: '#2F5FE0' },
  { username: 'ta_sipho',    role: 'Transporter Admin', color: '#475569' },
  { username: 'cr_mining',   role: 'Customer',          color: '#F79009' },
  { username: 'sr_gate01',   role: 'Supervisor',        color: '#F04438' },
];

const DRIVER_USERS = [
  { username: 'dr_rajesh', name: 'Rajesh Kumar', color: '#12B76A' },
  { username: 'dr_amit',   name: 'Amit Sharma',  color: '#12B76A' },
  { username: 'dr_sunil',  name: 'Sunil Kumar',  color: '#12B76A' },
  { username: 'dr_vikram', name: 'Vikram Singh', color: '#12B76A' },
  { username: 'dr_suresh', name: 'Suresh Kumar', color: '#12B76A' },
  { username: 'dr_anil',   name: 'Anil Kumar',   color: '#12B76A' },
  { username: 'dr_ramesh', name: 'Ramesh Lal (Exp)', color: '#F04438' },
  { username: 'dr_vijay',  name: 'Vijay Singh',  color: '#12B76A' },
];

export default function LoginPage() {
  const { login } = useAuthV3();
  const navigate = useNavigate();
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
      setError(err.message || 'Login failed. Check your credentials.');
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
    <div className="lp-page-selection">
      
      {/* Back button link */}
      <div className="lp-back-nav">
        <button 
          onClick={() => navigate('/')} 
          className="lp-back-btn"
        >
          <ArrowLeft size={16} /> Back to Podzo
        </button>
      </div>

      <div className="lp-selection-container">
        {/* Logo box */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <PodzoLogo variant="compact" height={36} />
        </div>

        <div className="lp-form-inner">
          <div className="lp-form-header">
            <h2>Sign In</h2>
            <p>Access your role-based Podzo portal</p>
          </div>

          {error && (
            <div className="lp-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="lp-form">
            <div className="lp-field">
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

            <div className="lp-field">
              <label>Password</label>
              <div className="lp-pwd-wrap">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="lp-pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="lp-submit-btn" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : 'Sign In to Podzo'}
            </button>
          </form>

          <div className="lp-divider" style={{ margin: '16px 0 8px 0' }}>
            <span>Quick demo access</span>
          </div>

          <div className="lp-demo-users" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {DEMO_USERS.map(u => (
              <button
                key={u.username}
                className="lp-demo-btn"
                onClick={() => quickLogin(u.username)}
                disabled={loading}
                style={{ padding: '8px 10px', borderRadius: '10px' }}
              >
                <span className="lp-demo-dot" style={{ background: u.color }} />
                <div className="lp-demo-info">
                  <span className="lp-demo-role" style={{ fontSize: '11px', fontWeight: 700 }}>{u.role}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="lp-divider" style={{ margin: '12px 0 8px 0' }}>
            <span>Indian Driver Personas</span>
          </div>

          <div className="lp-drivers-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px', marginBottom: '12px' }}>
            {DRIVER_USERS.map(u => (
              <button
                key={u.username}
                className="lp-demo-btn"
                onClick={() => quickLogin(u.username)}
                disabled={loading}
                style={{ padding: '6px 10px', borderRadius: '8px', borderLeft: `3px solid ${u.color}` }}
              >
                <div className="lp-demo-info" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="lp-demo-role" style={{ fontSize: '11px', fontWeight: 700 }}>{u.name}</span>
                </div>
              </button>
            ))}
          </div>

          <p className="lp-hint">All demo accounts: <code>Demo@1234</code></p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }

        .lp-page-selection {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-page, #F6F7FB);
          padding: 2.5rem 1.5rem;
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        .lp-back-nav {
          position: absolute;
          top: 2rem;
          left: 2rem;
        }

        .lp-back-btn {
          background: none;
          border: none;
          color: var(--color-text-muted, #667085);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .lp-back-btn:hover {
          color: var(--color-brand-blue-600, #2F5FE0);
          background: var(--color-brand-blue-50, #EEF2FE);
        }

        .lp-selection-container {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1.5px solid var(--color-border, #E4E7EC);
          box-shadow: 0 12px 32px rgba(47, 95, 224, 0.05);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
        }

        .lp-selection-logo-box {
          display: inline-block;
          background: var(--color-brand-blue-50, #EEF2FE);
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid var(--color-border, #E4E7EC);
        }

        .lp-form-inner {
          width: 100%;
        }

        .lp-form-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .lp-form-header h2 {
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--color-text-heading, #101828);
          margin: 0 0 0.3rem 0;
          letter-spacing: -0.03em;
        }

        .lp-form-header p {
          font-size: 0.875rem;
          color: var(--color-text-muted, #667085);
          margin: 0;
        }

        /* Error */
        .lp-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FEF3F2;
          color: #B42318;
          border: 1px solid rgba(180, 35, 24, 0.2);
          border-radius: 10px;
          padding: 0.625rem 0.875rem;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
          font-weight: 500;
        }

        /* Form */
        .lp-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          margin-bottom: 1.5rem;
        }

        .lp-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .lp-field label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-text-muted, #667085);
          text-transform: uppercase;
          letter-spacing: 0.055em;
        }

        .lp-field input {
          background: #FFFFFF;
          border: 1.5px solid var(--color-border, #E4E7EC);
          border-radius: 10px;
          padding: 0 14px;
          height: 48px;
          color: var(--color-text-heading, #101828);
          font-size: 0.9rem;
          font-family: inherit;
          width: 100%;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .lp-field input:focus {
          outline: none;
          border-color: var(--color-brand-blue-600, #2F5FE0);
          box-shadow: 0 0 0 3px rgba(47, 95, 224, 0.12);
        }

        .lp-field input::placeholder {
          color: var(--color-text-muted, #667085);
          opacity: 0.6;
        }

        .lp-pwd-wrap {
          position: relative;
        }

        .lp-pwd-wrap input {
          padding-right: 2.8rem;
        }

        .lp-pwd-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--color-text-muted, #667085);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 3px;
          transition: color 0.15s;
        }

        .lp-pwd-toggle:hover {
          color: var(--color-brand-blue-600, #2F5FE0);
        }

        /* Submit */
        .lp-submit-btn {
          background: var(--color-brand-blue-600, #2F5FE0);
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          height: 48px;
          width: 100%;
          font-weight: 700;
          font-size: 0.95rem;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
          letter-spacing: -0.01em;
        }

        .lp-submit-btn:hover:not(:disabled) {
          background: var(--color-brand-blue-700, #2648B8);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(47, 95, 224, 0.25);
        }

        .lp-submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Divider */
        .lp-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.25rem 0;
          color: var(--color-text-muted, #667085);
          font-size: 0.72rem;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .lp-divider::before,
        .lp-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border, #E4E7EC);
        }

        /* Demo Users */
        .lp-demo-users {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 1rem;
        }

        .lp-demo-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--color-bg-page, #F6F7FB);
          border: 1.5px solid var(--color-border, #E4E7EC);
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          width: 100%;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
        }

        .lp-demo-btn:hover:not(:disabled) {
          border-color: var(--color-brand-blue-600, #2F5FE0);
          background: var(--color-brand-blue-50, #EEF2FE);
          transform: translateX(2px);
        }

        .lp-demo-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lp-demo-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .lp-demo-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .lp-demo-role {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-text-heading, #101828);
        }

        .lp-demo-user {
          font-size: 0.72rem;
          color: var(--color-text-muted, #667085);
          font-family: 'JetBrains Mono', monospace;
        }

        /* Hint */
        .lp-hint {
          font-size: 0.73rem;
          color: var(--color-text-muted, #667085);
          text-align: center;
        }

        .lp-hint code {
          background: var(--color-brand-blue-50, #EEF2FE);
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--color-brand-blue-700, #2648B8);
        }

        @media (max-width: 640px) {
          .lp-back-nav {
            position: static;
            align-self: flex-start;
            margin-bottom: 1.5rem;
          }
          
          .lp-selection-container {
            padding: 2rem 1.5rem;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
