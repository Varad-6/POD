import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Truck, 
  FileSignature, 
  Receipt, 
  ClipboardCheck, 
  FileClock, 
  LogOut, 
  LayoutDashboard,
  Activity,
  ChevronRight
} from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { Modal } from './Modal';

export const Sidebar: React.FC = () => {
  const { user: currentUser, logout } = useAuthV3();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!currentUser) return null;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login', { replace: true });
  };

  const formatRoleName = (role: string) => {
    if (role === 'CA') return 'Company Admin';
    if (role === 'SR') return 'Gate Supervisor';
    if (role === 'CR') return 'Yard Receiving';
    if (role === 'DR') return 'Truck Driver';
    if (role === 'TA') return 'Transporter Admin';
    return 'Portal User';
  };

  return (
    <>
      <aside 
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: '#0B132B',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          padding: '24px 16px 20px 16px',
          zIndex: 1000,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}
      >
        {/* Top Header & Brand Identity */}
        <div>
          <div style={{ marginBottom: '28px', paddingLeft: '4px', paddingRight: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #0284C7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  flexShrink: 0
                }}
              >
                <Truck size={22} color="#FFFFFF" strokeWidth={2.2} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: 800, 
                    color: '#FFFFFF', 
                    letterSpacing: '-0.02em', 
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  POD Control Desk
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span 
                    style={{ 
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      boxShadow: '0 0 8px #10B981'
                    }} 
                  />
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      color: '#60A5FA', 
                      backgroundColor: 'rgba(37, 99, 235, 0.18)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 700, 
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatRoleName(currentUser.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Divider Header */}
          <div style={{ paddingLeft: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              MAIN NAVIGATION
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {currentUser.role === 'CA' ? (
              <>
                <NavLink 
                  to="/admin/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={20} strokeWidth={2} />
                  <span>Fleet Logistics Command</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/contracts" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <FileSignature size={20} strokeWidth={2} />
                  <span>Contracts & PO Release</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/approvals" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <ClipboardCheck size={20} strokeWidth={2} />
                  <span>POD Verification Desk</span>
                </NavLink>
                
                <NavLink 
                  to="/admin/invoices" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <FileClock size={20} strokeWidth={2} />
                  <span>SAP MIRO Invoices</span>
                </NavLink>
              </>
            ) : currentUser.role === 'SR' ? (
              <>
                <NavLink 
                  to="/supervisor/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={20} strokeWidth={2} />
                  <span>Weighbridge Siding Gate</span>
                </NavLink>
              </>
            ) : currentUser.role === 'CR' ? (
              <>
                <NavLink 
                  to="/customer/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={20} strokeWidth={2} />
                  <span>Yard Receiving Gate</span>
                </NavLink>
              </>
            ) : currentUser.role === 'DR' ? (
              <>
                <NavLink 
                  to="/driver/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={20} strokeWidth={2} />
                  <span>Driver Haulage Console</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink 
                  to="/transporter/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={20} strokeWidth={2} />
                  <span>Carrier Control Console</span>
                </NavLink>
                
                <NavLink 
                  to="/transporter/purchase-orders" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <FileSignature size={20} strokeWidth={2} />
                  <span>Purchase Orders Queue</span>
                </NavLink>
                
                <NavLink 
                  to="/transporter/pods" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Truck size={20} strokeWidth={2} />
                  <span>Proof of Delivery (POD)</span>
                </NavLink>
                
                <NavLink 
                  to="/transporter/invoices" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Receipt size={20} strokeWidth={2} />
                  <span>Tax Invoices & Ledger</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Section: Health Telemetry & Logout Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {/* Telemetry Status Card */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '12px',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <Activity size={15} color="#10B981" />
              SAP S21 Adapter
            </span>
            <span style={{ fontWeight: 800, color: '#10B981', fontSize: '11px', letterSpacing: '0.04em' }}>ONLINE</span>
          </div>

          {/* Log Out Button */}
          <button
            onClick={handleLogoutClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              color: '#94A3B8',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={18} strokeWidth={2} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirm Sign Out"
        width="420px"
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--neutral-600)', marginBottom: '24px' }}>
            Are you sure you want to end your current session? You will be redirected to the login screen.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setShowLogoutConfirm(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={confirmLogout} className="btn btn-danger">
              Sign Out Now
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
