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
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { Modal } from './Modal';
import { PodzoLogo } from './branding/PodzoLogo';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
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
          width: collapsed ? '72px' : '260px',
          backgroundColor: 'var(--color-bg-sidebar)',
          color: 'var(--color-text-body)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          padding: collapsed ? '20px 8px 16px 8px' : '24px 16px 20px 16px',
          zIndex: 1000,
          borderRight: '1px solid var(--color-border)',
          boxSizing: 'border-box',
          overflowY: 'auto',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Top Header & Brand Identity */}
        <div>
          <div style={{ marginBottom: '24px', paddingLeft: collapsed ? '0' : '4px', paddingRight: collapsed ? '0' : '4px' }}>
            {collapsed ? (
              <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: '6px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <PodzoLogo variant="mark" height={28} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                  <PodzoLogo variant="compact" height={32} />
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

          {/* Section Divider Header */}
          {!collapsed && (
            <div style={{ paddingLeft: '16px', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                MAIN NAVIGATION
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {currentUser.role === 'CA' ? (
              <>
                <NavLink 
                  to="/admin/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "Fleet Logistics Command" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <LayoutDashboard size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Fleet Logistics Command</span>}
                </NavLink>
                
                <NavLink 
                  to="/admin/contracts" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "Contracts & PO Release" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <FileSignature size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Contracts & PO Release</span>}
                </NavLink>
                
                <NavLink 
                  to="/admin/approvals" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "POD Verification Desk" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <ClipboardCheck size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>POD Verification Desk</span>}
                </NavLink>
                
                <NavLink 
                  to="/admin/invoices" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "SAP MIRO Invoices" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <FileClock size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>SAP MIRO Invoices</span>}
                </NavLink>
              </>
            ) : currentUser.role === 'SR' ? (
              <>
                <NavLink 
                  to="/supervisor/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "Weighbridge Siding Gate" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <LayoutDashboard size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Weighbridge Siding Gate</span>}
                </NavLink>
              </>
            ) : currentUser.role === 'CR' ? (
              <>
                <NavLink 
                  to="/customer/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "Yard Receiving Gate" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <LayoutDashboard size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Yard Receiving Gate</span>}
                </NavLink>
              </>
            ) : currentUser.role === 'DR' ? (
              <>
                <NavLink 
                  to="/driver/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "Driver Haulage Console" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <LayoutDashboard size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Driver Haulage Console</span>}
                </NavLink>
              </>
            ) : (
              <>
                <NavLink 
                  to="/transporter/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "Carrier Control Console" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <LayoutDashboard size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Carrier Control Console</span>}
                </NavLink>
                
                <NavLink 
                  to="/transporter/purchase-orders" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "Purchase Orders Queue" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <FileSignature size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Purchase Orders Queue</span>}
                </NavLink>
                
                <NavLink 
                  to="/transporter/pods" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "Waybill POD Uploads" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <Receipt size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Waybill POD Uploads</span>}
                </NavLink>
                
                <NavLink 
                  to="/transporter/invoices" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? "Freight Delivery Invoices" : undefined}
                  style={collapsed ? { justifyContent: 'center', padding: '12px 0', borderLeft: 'none', borderRadius: '10px' } : undefined}
                >
                  <FileClock size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Freight Delivery Invoices</span>}
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Section: Health Telemetry, Collapse Button & Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          {/* Sidebar Collapse/Expand Toggle Button */}
          {onToggle && (
            <button
              onClick={onToggle}
              title={collapsed ? "Open sidebar" : "Close sidebar"}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: collapsed ? '12px 0' : '10px 14px',
                color: 'var(--color-text-body)',
                backgroundColor: 'transparent',
                border: '1.5px solid var(--color-border)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                transition: 'all var(--transition-normal)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = 'var(--color-brand-blue-600)';
                e.currentTarget.style.color = 'var(--color-brand-blue-600)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-body)';
              }}
            >
              {collapsed ? <PanelLeftOpen size={18} style={{ flexShrink: 0 }} /> : <PanelLeftClose size={18} style={{ flexShrink: 0 }} />}
              {!collapsed && <span>Collapse Sidebar</span>}
            </button>
          )}

          {/* Telemetry Status Card */}
          <div
            title={collapsed ? "SAP S21 Adapter Online" : undefined}
            style={{
              padding: collapsed ? '10px 0' : '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              fontSize: '12px',
              color: 'var(--color-text-body)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
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
              {!collapsed && <span>SAP S21 Adapter</span>}
            </span>
            {!collapsed && <span style={{ fontWeight: 800, color: 'var(--color-success-text)', fontSize: '11px', letterSpacing: '0.04em' }}>ONLINE</span>}
          </div>

          {/* Log Out Button */}
          <button
            onClick={handleLogoutClick}
            title={collapsed ? "Sign Out" : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '12px',
              padding: collapsed ? '12px 0' : '12px 14px',
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
            {!collapsed && <span>Sign Out</span>}
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
