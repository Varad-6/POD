import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Truck, FileCheck, CheckCircle2, Server } from 'lucide-react';
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
    { username: 'company_admin', role: 'COMPANY_ADMIN', label: 'Company Admin', badge: 'Control Tower', color: 'var(--accent-blue)', bg: 'var(--accent-blue-light)' },
    { username: 'transporter_admin', role: 'TRANSPORTER_ADMIN', label: 'Transport Admin', badge: 'Carrier Ops', color: 'var(--teal-600)', bg: 'var(--teal-50)' },
    { username: 'driver', role: 'DRIVER', label: 'Logistics Driver', badge: 'Mobile Workflow', color: 'var(--amber-600)', bg: 'var(--amber-50)' },
    { username: 'supervisor', role: 'SUPERVISOR', label: 'Web Supervisor', badge: 'Dispatch Gate', color: 'var(--info-600)', bg: 'var(--info-50)' },
    { username: 'customer', role: 'CUSTOMER', label: 'Customer Service', badge: 'Receiving Gate', color: 'var(--purple-600)', bg: 'var(--purple-50)' }
  ];

  const handleRouteForRole = (role?: string) => {
    if (role === 'COMPANY_ADMIN' || role === 'IKWEZI_ADMIN') {
      navigate('/admin/dashboard');
    } else if (role === 'SUPERVISOR') {
      navigate('/supervisor/dashboard');
    } else if (role === 'CUSTOMER') {
      navigate('/customer/dashboard');
    } else if (role === 'DRIVER') {
      navigate('/driver/dashboard');
    } else {
      navigate('/transporter/dashboard');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(username);
    if (success) {
      const matched = USERS.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
      handleRouteForRole(matched?.role);
    } else {
      setError('Invalid enterprise credentials');
    }
  };

  const handlePersonaClick = (uname: string) => {
    setError('');
    setUsername(uname);
    setPassword('password123');
    
    const success = login(uname);
    if (success) {
      const matched = USERS.find((u: any) => u.username.toLowerCase() === uname.toLowerCase());
      handleRouteForRole(matched?.role);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--brand-navy)', display: 'flex', flexDirection: 'column', color: '#ffffff' }}>
      
      {/* Top Enterprise Banner */}
      <header style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>POD</h2>
            <p style={{ fontSize: '11px', color: 'var(--neutral-400)', fontWeight: 500, letterSpacing: '0.04em' }}>SAP Transport Execution Platform</p>
          </div>
        </div>
      </header>

      {/* Main Split Body */}
      <main className="responsive-split" style={{ flex: 1, gridTemplateColumns: '1.1fr 0.9fr', maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '40px 32px', gap: '48px', alignItems: 'center' }}>
        
        {/* Left Hand Column: Value Proposition & Diagram */}
        <div className="animate-fade-in">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '16px', backgroundColor: 'rgba(29, 78, 216, 0.2)', border: '1px solid rgba(29, 78, 216, 0.4)', color: 'var(--accent-blue-muted)', fontSize: '12px', fontWeight: 600, marginBottom: '20px' }}>
            <ShieldCheck size={14} /> Enterprise Transport Execution & Proof-of-Delivery
          </div>

          <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Seamless S/4HANA Transport Verification & Automated Invoicing.
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--neutral-300)', lineHeight: 1.6, maxWidth: '540px', marginBottom: '32px' }}>
            Integrated operational layer bridging physical weighbridge execution, 5-persona verification workflows, AI document validation, and automated SAP MIRO parked invoicing.
          </p>

          {/* Visual Architecture Chain */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '20px', marginBottom: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--neutral-400)', marginBottom: '12px' }}>
              END-TO-END EXECUTION WORKFLOW
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--neutral-200)' }}>
              <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--accent-blue-muted)' }}>SAP S21</div><div>PO & Contract</div></div>
              <ArrowRight size={12} color="var(--neutral-500)" />
              <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--teal-600)' }}>Carrier TA</div><div>Dispatch Task</div></div>
              <ArrowRight size={12} color="var(--neutral-500)" />
              <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--amber-600)' }}>Driver / SR</div><div>Weighbridge</div></div>
              <ArrowRight size={12} color="var(--neutral-500)" />
              <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--purple-600)' }}>Customer</div><div>Receipt Stamp</div></div>
              <ArrowRight size={12} color="var(--neutral-500)" />
              <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--success-500)' }}>CA / SAP</div><div>OCR & MIRO</div></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', color: 'var(--neutral-400)', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={15} color="var(--success-500)" /> 4-Point Weighbridge Tracking</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={15} color="var(--success-500)" /> AI OCR Document Engine</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={15} color="var(--success-500)" /> Auto MIRO Clearance</div>
          </div>
        </div>

        {/* Right Hand Column: Login Panel + Persona Switcher */}
        <div 
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-modal)',
            padding: '32px 28px',
            color: 'var(--neutral-800)',
            border: '1px solid var(--neutral-200)'
          }}
          className="animate-scale-in"
        >
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--neutral-900)' }}>Enterprise Portal Access</h3>
            <p style={{ fontSize: '13px', color: 'var(--neutral-500)', marginTop: '2px' }}>Sign in to your role-specific dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>USERNAME</label>
              <div className="input-wrapper">
                <User className="input-icon-left" size={16} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input has-icon-left" 
                  placeholder="Enter corporate username"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>PASSWORD</label>
              <div className="input-wrapper">
                <Lock className="input-icon-left" size={16} />
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '16px', padding: '8px 12px', fontSize: '12px' }}>
                ⚠ {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px 20px', fontSize: '14px', fontWeight: 700 }}
            >
              Sign In to Portal <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Persona Demo Switcher */}
          <div style={{ margin: '20px 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ height: '1px', backgroundColor: 'var(--neutral-200)', flex: 1 }}></div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--neutral-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              DEMO PERSONA ACCESS
            </span>
            <div style={{ height: '1px', backgroundColor: 'var(--neutral-200)', flex: 1 }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {personas.map((p) => (
              <button
                key={p.username}
                type="button"
                onClick={() => handlePersonaClick(p.username)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--neutral-200)',
                  backgroundColor: 'var(--neutral-50)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = p.color;
                  e.currentTarget.style.backgroundColor = p.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--neutral-200)';
                  e.currentTarget.style.backgroundColor = 'var(--neutral-50)';
                }}
              >
                <div style={{ flex: 1, marginRight: '8px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-900)' }}>{p.label}</p>
                </div>
                <span 
                  style={{ 
                    fontSize: '9.5px', 
                    fontWeight: 700, 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    backgroundColor: p.bg, 
                    color: p.color, 
                    whiteSpace: 'nowrap',
                    border: `1px solid ${p.color}33`
                  }}
                >
                  {p.badge}
                </span>
              </button>
            ))}
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '16px 32px', textAlign: 'center', fontSize: '12px', color: 'var(--neutral-400)' }}>
        POD Platform v2.0 • Integrated with Ikwezi Mining SAP S21 Environment • Standard Operating Procedure Compliant
      </footer>

    </div>
  );
};
