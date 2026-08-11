import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Key } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { USERS } from '../data/mockData';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useDemo();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const personas = [
    { username: 'company_admin', role: 'COMPANY_ADMIN', label: 'Company Admin', desc: 'Thandiwe Nkosi (Admin)', color: '#1e3a8a', bg: '#dbeafe' },
    { username: 'transporter_admin', role: 'TRANSPORTER_ADMIN', label: 'Transporter Admin', desc: 'Sipho Kumalo (Transporter)', color: '#0f766e', bg: '#ccfbf1' },
    { username: 'driver', role: 'DRIVER', label: 'Transporter (Driver)', desc: 'Dumisani Dlamini (Driver)', color: '#d97706', bg: '#fef3c7' },
    { username: 'customer', role: 'CUSTOMER', label: 'Customer / Client', desc: 'John Ndlovu (Client)', color: '#7c3aed', bg: '#ede9fe' },
    { username: 'supervisor', role: 'SUPERVISOR', label: 'Weighbridge Supervisor', desc: 'Pieter Botha (Supervisor)', color: '#2563eb', bg: '#dbeafe' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(username);
    if (success) {
      const matched = USERS.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
      const role = matched?.role;
      if (role === 'COMPANY_ADMIN' || role === 'IKWEZI_ADMIN' || role === 'SUPERVISOR' || role === 'CUSTOMER') {
        navigate('/admin/dashboard');
      } else {
        navigate('/transporter/dashboard');
      }
    } else {
      setError('Invalid username or password');
    }
  };

  const handlePersonaClick = (uname: string) => {
    setError('');
    setUsername(uname);
    setPassword('password123');
    
    const success = login(uname);
    if (success) {
      const matched = USERS.find((u: any) => u.username.toLowerCase() === uname.toLowerCase());
      const role = matched?.role;
      if (role === 'COMPANY_ADMIN' || role === 'IKWEZI_ADMIN' || role === 'SUPERVISOR' || role === 'CUSTOMER') {
        navigate('/admin/dashboard');
      } else {
        navigate('/transporter/dashboard');
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
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          padding: '36px 28px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        className="animate-scale-in"
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ color: 'var(--primary-color)', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Apex Logistics
          </h1>
          <p style={{ color: 'var(--neutral-secondary)', fontSize: '14px', marginTop: '4px', fontWeight: '500' }}>
            Transporter & Invoice Portal
          </p>
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
                placeholder="Enter username"
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

        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ height: '1px', backgroundColor: 'var(--border-grey)', flex: 1 }}></div>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--neutral-secondary)', textTransform: 'uppercase' }}>Demo Quick Access</span>
          <div style={{ height: '1px', backgroundColor: 'var(--border-grey)', flex: 1 }}></div>
        </div>

        {/* Persona Select Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
          {personas.map((p) => (
            <button
              key={p.username}
              type="button"
              onClick={() => handlePersonaClick(p.username)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-grey)',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = p.color;
                e.currentTarget.style.backgroundColor = p.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-grey)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <div style={{ flex: 1, marginRight: '8px' }}>
                <p style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--neutral-primary)' }}>{p.label}</p>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', marginTop: '2px', lineHeight: 1.2 }}>{p.desc}</p>
              </div>
              <span 
                style={{ 
                  fontSize: '9px', 
                  fontWeight: 700, 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  backgroundColor: p.bg, 
                  color: p.color, 
                  whiteSpace: 'nowrap',
                  border: '1px solid ' + p.color + '22'
                }}
              >
                {p.role.replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
