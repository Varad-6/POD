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
  X
} from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { Modal } from './Modal';
import { PodzoLogo } from './branding/PodzoLogo';

const navLabelStyle: React.CSSProperties = {
  whiteSpace: 'normal',
  lineHeight: '1.25',
  fontSize: '13px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }) => {
  const { user: currentUser, logout } = useAuthV3();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isEffectiveCollapsed = mobileOpen ? false : collapsed;

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
      {mobileOpen && (
        <div 
          onClick={onMobileClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 24, 40, 0.55)',
            zIndex: 999,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}
      <aside 
        className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: isEffectiveCollapsed ? '72px' : '260px',
          backgroundColor: 'var(--color-bg-sidebar)',
          color: 'var(--color-text-body)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          padding: isEffectiveCollapsed ? '20px 8px 16px 8px' : '24px 16px 20px 16px',
          zIndex: 1000,
          borderRight: '1px solid var(--color-border)',
          boxSizing: 'border-box',
          overflowY: 'auto',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Top Header & Brand Identity */}
        <div>
          <div style={{ marginBottom: '24px', paddingLeft: isEffectiveCollapsed ? '0' : '4px', paddingRight: isEffectiveCollapsed ? '0' : '4px' }}>
            {isEffectiveCollapsed ? (
              <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: '6px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <PodzoLogo variant="mark" height={28} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', position: 'relative' }}>
                  <PodzoLogo variant="compact" height={32} />
                  {mobileOpen && (
                    <button 
                      onClick={onMobileClose}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-bg-page)'
                      }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      color: 'var(--color-text-muted)', 
                      fontWeight: 700, 
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {formatRoleName(currentUser.role)} Console
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links Grouped Logically (Section 7) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentUser.role === 'CA' ? (
              <>
                {/* Group 1: OPERATIONS */}
                <div>
                  {!isEffectiveCollapsed && (
                    <div style={{ padding: '0 14px 6px', fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      OPERATIONS
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <NavLink 
                      to="/admin/dashboard" 
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={isEffectiveCollapsed ? "Fleet Logistics Command" : undefined}
                      style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                    >
                      <LayoutDashboard size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      {!isEffectiveCollapsed && <span style={navLabelStyle}>Fleet Logistics Command</span>}
                    </NavLink>
                    
                    <NavLink 
                      to="/admin/approvals" 
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={isEffectiveCollapsed ? "POD Verification Desk" : undefined}
                      style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                    >
                      <ClipboardCheck size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      {!isEffectiveCollapsed && <span style={navLabelStyle}>POD Verification Desk</span>}
                    </NavLink>
                  </div>
                </div>

                {/* Group 2: PROCUREMENT */}
                <div>
                  {!isEffectiveCollapsed && (
                    <div style={{ padding: '0 14px 6px', fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      PROCUREMENT
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <NavLink 
                      to="/admin/contracts" 
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={isEffectiveCollapsed ? "Contracts & PO Release" : undefined}
                      style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                    >
                      <FileSignature size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      {!isEffectiveCollapsed && <span style={navLabelStyle}>Contracts & PO Release</span>}
                    </NavLink>
                  </div>
                </div>

                {/* Group 3: FINANCE */}
                <div>
                  {!isEffectiveCollapsed && (
                    <div style={{ padding: '0 14px 6px', fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      FINANCE
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <NavLink 
                      to="/admin/invoices" 
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={isEffectiveCollapsed ? "SAP MIRO Invoices" : undefined}
                      style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                    >
                      <FileClock size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      {!isEffectiveCollapsed && <span style={navLabelStyle}>SAP MIRO Invoices</span>}
                    </NavLink>
                  </div>
                </div>
              </>
            ) : currentUser.role === 'SR' ? (
              <div>
                {!isEffectiveCollapsed && (
                  <div style={{ padding: '0 14px 6px', fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    OPERATIONS
                  </div>
                )}
                <NavLink 
                  to="/supervisor/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={isEffectiveCollapsed ? "Weighbridge Siding Gate" : undefined}
                  style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                >
                  <LayoutDashboard size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  {!isEffectiveCollapsed && <span style={navLabelStyle}>Weighbridge Siding Gate</span>}
                </NavLink>
              </div>
            ) : currentUser.role === 'CR' ? (
              <div>
                {!isEffectiveCollapsed && (
                  <div style={{ padding: '0 14px 6px', fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    OPERATIONS
                  </div>
                )}
                <NavLink 
                  to="/customer/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={isEffectiveCollapsed ? "Yard Receiving Gate" : undefined}
                  style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                >
                  <LayoutDashboard size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  {!isEffectiveCollapsed && <span style={navLabelStyle}>Yard Receiving Gate</span>}
                </NavLink>
              </div>
            ) : currentUser.role === 'DR' ? (
              <div>
                {!isEffectiveCollapsed && (
                  <div style={{ padding: '0 14px 6px', fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    OPERATIONS
                  </div>
                )}
                <NavLink 
                  to="/driver/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={isEffectiveCollapsed ? "Driver Haulage Console" : undefined}
                  style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                >
                  <LayoutDashboard size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  {!isEffectiveCollapsed && <span style={navLabelStyle}>Driver Haulage Console</span>}
                </NavLink>
              </div>
            ) : (
              <>
                {/* Transporter Admin: OPERATIONS */}
                <div>
                  {!isEffectiveCollapsed && (
                    <div style={{ padding: '0 14px 6px', fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      OPERATIONS
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <NavLink 
                      to="/transporter/dashboard" 
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={isEffectiveCollapsed ? "Carrier Control Console" : undefined}
                      style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                    >
                      <LayoutDashboard size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      {!isEffectiveCollapsed && <span style={navLabelStyle}>Carrier Control Console</span>}
                    </NavLink>
                    
                    <NavLink 
                      to="/transporter/pods" 
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={isEffectiveCollapsed ? "Waybill POD Uploads" : undefined}
                      style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                    >
                      <Receipt size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      {!isEffectiveCollapsed && <span style={navLabelStyle}>Waybill POD Uploads</span>}
                    </NavLink>
                  </div>
                </div>

                {/* Transporter Admin: ORDERS */}
                <div>
                  {!isEffectiveCollapsed && (
                    <div style={{ padding: '0 14px 6px', fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      ORDERS
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <NavLink 
                      to="/transporter/purchase-orders" 
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={isEffectiveCollapsed ? "Purchase Orders Queue" : undefined}
                      style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                    >
                      <FileSignature size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      {!isEffectiveCollapsed && <span style={navLabelStyle}>Purchase Orders Queue</span>}
                    </NavLink>
                  </div>
                </div>

                {/* Transporter Admin: FINANCE */}
                <div>
                  {!isEffectiveCollapsed && (
                    <div style={{ padding: '0 14px 6px', fontSize: '10.5px', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      FINANCE
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <NavLink 
                      to="/transporter/invoices" 
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={isEffectiveCollapsed ? "Freight Delivery Invoices" : undefined}
                      style={isEffectiveCollapsed ? { justifyContent: 'center', padding: '10px 0', borderLeft: 'none', borderRadius: '4px' } : undefined}
                    >
                      <FileClock size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      {!isEffectiveCollapsed && <span style={navLabelStyle}>Freight Delivery Invoices</span>}
                    </NavLink>
                  </div>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Section: Health Telemetry & Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>

          {/* Telemetry Status Card */}
          <div
            title={isEffectiveCollapsed ? "SAP S21 Adapter Online" : undefined}
            style={{
              padding: isEffectiveCollapsed ? '10px 0' : '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              fontSize: '12px',
              color: 'var(--color-text-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isEffectiveCollapsed ? 'center' : 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <span 
                style={{ 
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success)'
                }} 
              />
              {!isEffectiveCollapsed && <span>SAP S21 Adapter</span>}
            </span>
            {!isEffectiveCollapsed && <span style={{ fontWeight: 800, color: 'var(--color-success-text)', fontSize: '11px', letterSpacing: '0.04em' }}>ONLINE</span>}
          </div>

          {/* Log Out Button */}
          <button
            onClick={handleLogoutClick}
            title={isEffectiveCollapsed ? "Sign Out" : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isEffectiveCollapsed ? 'center' : 'flex-start',
              gap: '12px',
              padding: isEffectiveCollapsed ? '12px 0' : '12px 14px',
              color: 'var(--color-text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              transition: 'all var(--transition-normal)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-error-text)';
              e.currentTarget.style.backgroundColor = 'var(--color-error-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            {!isEffectiveCollapsed && <span>Sign Out</span>}
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
          <p style={{ fontSize: '14px', color: 'var(--color-text-body)', marginBottom: '24px' }}>
            Are you sure you want to end your current session? You will be redirected to the login screen.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setShowLogoutConfirm(false)} className="btn btn-secondary">
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
