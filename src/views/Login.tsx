import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Key } from 'lucide-react';
import { useDemo } from '../context/DemoContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useDemo();
  
  const [activeTab, setActiveTab] = useState<'TRANSPORTER' | 'IKWEZI_ADMIN'>('TRANSPORTER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(username);
    if (success) {
      if (activeTab === 'TRANSPORTER') {
        navigate('/transporter/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } else {
      setError('Invalid username or password');
    }
  };

  const handleQuickAccess = () => {
    setError('');
    const demoUser = activeTab === 'TRANSPORTER' ? 'transporter' : 'admin';
    setUsername(demoUser);
    setPassword('password123');
    
    const success = login(demoUser);
    if (success) {
      if (activeTab === 'TRANSPORTER') {
        navigate('/transporter/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    }
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1F4E79 0%, #0F2A43 100%)',
        padding: '24px'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          padding: '40px 32px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        className="animate-scale-in"
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ color: 'var(--primary-color)', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Ikwezi Mining
          </h1>
          <p style={{ color: 'var(--neutral-secondary)', fontSize: '14px', marginTop: '4px', fontWeight: '500' }}>
            Transporter & Invoice Portal
          </p>
        </div>

        {/* Form Role Toggle */}
        <div 
          style={{
            display: 'flex',
            backgroundColor: 'var(--page-bg)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid var(--border-grey)'
          }}
        >
          <button
            onClick={() => {
              setActiveTab('TRANSPORTER');
              setError('');
              setUsername('');
              setPassword('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'TRANSPORTER' ? '#ffffff' : 'transparent',
              color: activeTab === 'TRANSPORTER' ? 'var(--primary-color)' : 'var(--neutral-secondary)',
              boxShadow: activeTab === 'TRANSPORTER' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Transporter
          </button>
          <button
            onClick={() => {
              setActiveTab('IKWEZI_ADMIN');
              setError('');
              setUsername('');
              setPassword('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'IKWEZI_ADMIN' ? '#ffffff' : 'transparent',
              color: activeTab === 'IKWEZI_ADMIN' ? 'var(--primary-color)' : 'var(--neutral-secondary)',
              boxShadow: activeTab === 'IKWEZI_ADMIN' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Ikwezi Admin
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>USERNAME</label>
            <div className="input-wrapper">
              <User className="input-icon-left" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input has-icon-left" 
                placeholder={activeTab === 'TRANSPORTER' ? "transporter" : "admin"}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>PASSWORD</label>
            <div className="input-wrapper">
              <Lock className="input-icon-left" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input has-icon-left has-icon-right" 
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="input-icon-right"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p 
              style={{ 
                color: 'var(--error-text)', 
                fontSize: '12px', 
                fontWeight: 600, 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ⚠ {error}
            </p>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px 20px', fontSize: '15px', marginTop: '8px' }}
          >
            Sign In
          </button>
        </form>

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ height: '1px', backgroundColor: 'var(--border-grey)', flex: 1 }}></div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--neutral-secondary)', textTransform: 'uppercase' }}>Demo Automation</span>
          <div style={{ height: '1px', backgroundColor: 'var(--border-grey)', flex: 1 }}></div>
        </div>

        {/* Quick Access fast track button */}
        <button
          onClick={handleQuickAccess}
          style={{
            width: '100%',
            backgroundColor: 'var(--secondary-bg)',
            border: '1px solid rgba(31, 78, 121, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-color)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(31, 78, 121, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <Key size={18} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1px' }}>
              Instant Quick Access
            </p>
            <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)' }}>
              Auto-fill demo credentials for {activeTab === 'TRANSPORTER' ? 'Transporter' : 'Ikwezi Admin'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
