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
  ChevronLeft,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { Modal } from './Modal';

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
          backgroundColor: 'var(--brand-purple)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          padding: collapsed ? '20px 8px 16px 8px' : '24px 16px 20px 16px',
          zIndex: 1000,
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          boxSizing: 'border-box',
          overflowY: 'auto',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Top Header & Brand Identity */}
        <div>
          <div style={{ marginBottom: '24px', paddingLeft: collapsed ? '0' : '4px', paddingRight: collapsed ? '0' : '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  flexShrink: 0,
                  margin: collapsed ? '0 auto' : '0',
                  overflow: 'hidden',
                  padding: '2px'
                }}
                title="PODZO — Let’s make delivery simple."
              >
                <img src="/podzo-logo.png" alt="PODZO Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              {!collapsed && (
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h1 
                    style={{ 
                      fontSize: '18px', 
                      fontWeight: 900, 
                      color: '#FFFFFF', 
                      letterSpacing: '0.05em', 
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    PODZO
                  </h1>
                  <div style={{ fontSize: '10px', color: '#FF9E66', fontWeight: 600, fontStyle: 'italic', marginBottom: '4px' }}>
                    Let’s make delivery simple.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span 
                      style={{ 
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#FF6200',
                        boxShadow: '0 0 8px #FF6200'
                      }} 
                    />
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        color: '#FFFFFF', 
                        backgroundColor: 'rgba(255, 98, 0, 0.3)',
                        border: '1px solid rgba(255, 98, 0, 0.5)',
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
              )}
            </div>
          </div>

          {/* Quick Persona Switcher Bar for Demo Efficiency */}
          {!collapsed && (
            <div style={{ margin: '0 4px 16px 4px', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#FF9E66', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                DEMO PERSONA SWITCHER
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/admin/dashboard')} style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', border: 'none', backgroundColor: currentUser.role === 'CA' ? '#FF6200' : 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>Admin</button>
                <button onClick={() => navigate('/transporter/dashboard')} style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', border: 'none', backgroundColor: currentUser.role === 'TA' ? '#FF6200' : 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>Transporter</button>
                <button onClick={() => navigate('/supervisor/dashboard')} style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', border: 'none', backgroundColor: currentUser.role === 'SR' ? '#FF6200' : 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>Gate</button>
                <button onClick={() => navigate('/customer/dashboard')} style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', border: 'none', backgroundColor: currentUser.role === 'CR' ? '#FF6200' : 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>Yard</button>
                <button onClick={() => navigate('/driver/dashboard')} style={{ fontSize: '10px', padding: '3px 6px', borderRadius: '4px', border: 'none', backgroundColor: currentUser.role === 'DR' ? '#FF6200' : 'rgba(255,255,255,0.15)', color: '#FFF', cursor: 'pointer', fontWeight: 700 }}>Driver</button>
              </div>
            </div>
          )}

          {/* Section Divider Header */}
          {!collapsed && (
            <div style={{ paddingLeft: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
                color: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {collapsed ? <PanelLeftOpen size={18} color="#FFFFFF" style={{ flexShrink: 0 }} /> : <PanelLeftClose size={18} color="#FFFFFF" style={{ flexShrink: 0 }} />}
              {!collapsed && <span>Collapse Sidebar</span>}
            </button>
          )}

          {/* Telemetry Status Card */}
          <div
            title={collapsed ? "SAP S21 Adapter Online" : undefined}
            style={{
              padding: collapsed ? '10px 0' : '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '12px',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <Activity size={15} color="#10B981" style={{ flexShrink: 0 }} />
              {!collapsed && <span>SAP S21 Adapter</span>}
            </span>
            {!collapsed && <span style={{ fontWeight: 800, color: '#10B981', fontSize: '11px', letterSpacing: '0.04em' }}>ONLINE</span>}
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
