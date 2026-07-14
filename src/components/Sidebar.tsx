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
  Users
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { Modal } from './Modal';

export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useDemo();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!currentUser) return null;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive ? '600' : '500',
    borderRadius: '8px',
    transition: 'all 0.15s ease',
    marginBottom: '4px'
  });

  return (
    <div 
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--primary-color)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--demo-bar-height))',
        position: 'fixed',
        top: 'var(--demo-bar-height)',
        left: 0,
        padding: '24px 16px',
        zIndex: 100,
        borderRight: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Logo Area */}
      <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', letterSpacing: '0.5px' }}>
          Ikwezi Portal
        </h1>
        <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
          {currentUser.role === 'COMPANY_ADMIN' || currentUser.role === 'IKWEZI_ADMIN' || currentUser.role === 'SUPERVISOR' || currentUser.role === 'CUSTOMER' ? 'Mining Administrator' : 'Transporter Panel'}
        </p>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1 }}>
        {currentUser.role === 'DRIVER' || currentUser.role === 'TRANSPORTER_ADMIN' || currentUser.role === 'TRANSPORTER' ? (
          <>
            <NavLink 
              to="/transporter/dashboard" 
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            
            <NavLink 
              to="/transporter/purchase-orders" 
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <FileSignature size={18} />
              Purchase Orders
            </NavLink>
            
            <NavLink 
              to="/transporter/pods" 
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <Truck size={18} />
              Proof of Delivery
            </NavLink>
            
            <NavLink 
              to="/transporter/invoices" 
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <Receipt size={18} />
              Invoices
            </NavLink>
          </>
        ) : (
          <>
            <NavLink 
              to="/admin/dashboard" 
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            
            <NavLink 
              to="/admin/approvals" 
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <ClipboardCheck size={18} />
              POD Approvals
            </NavLink>
            
            <NavLink 
              to="/admin/invoices" 
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <FileClock size={18} />
              Invoices
            </NavLink>
          </>
        )}
      </nav>

      {/* Logout button pinned to bottom */}
      <button
        onClick={handleLogoutClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          color: 'rgba(255, 255, 255, 0.7)',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '8px',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <LogOut size={18} />
        Log Out
      </button>

      {/* Confirm Logout Modal */}
      <Modal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        title="Confirm Log Out"
        width="400px"
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15px', marginBottom: '24px', color: 'var(--neutral-primary)' }}>
            Are you sure you want to log out of the portal?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowLogoutConfirm(false)} 
              className="btn btn-secondary"
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button 
              onClick={confirmLogout} 
              className="btn btn-primary"
              style={{ padding: '8px 16px', backgroundColor: 'var(--error-text)', borderColor: 'var(--error-text)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--error-text)'}
            >
              Log Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
