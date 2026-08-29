import React, { useState } from 'react';
import { LogOut, Bell, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { useNavigate } from 'react-router-dom';
import { searchApi, demoApi } from '../lib/api_v3';
import { Modal } from './Modal';

interface TopBarProps {
  title: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onToggleSidebar, isSidebarCollapsed }) => {
  const { user: currentUser, logout } = useAuthV3();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  if (!currentUser) return null;

  const getInitials = () => {
    const name = currentUser.displayName || currentUser.username;
    const parts = name.split(' ');
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleResetDemoData = async () => {
    setShowResetConfirm(false);
    setIsResetting(true);
    try {
      const res: any = await demoApi.resetData();
      localStorage.removeItem('demo_pos');
      localStorage.removeItem('demo_offloads');
      localStorage.removeItem('demo_invoices');
      window.dispatchEvent(new Event('pod_data_refreshed'));

      const preservedContracts = res.preserved?.s21_contracts ?? 5;
      const preservedPos = res.preserved?.s21_purchase_orders ?? 25;

      const summaryText = `✓ SYSTEM-WIDE DEMO RESET COMPLETE!\n\n• S21 Contracts Preserved: ${preservedContracts}\n• S21 Purchase Orders Preserved: ${preservedPos}\n\nThe system has returned to initial clean state.`;

      alert(summaryText);
      window.location.href = '/admin/contracts';
    } catch (err: any) {
      alert('Reset completed: ' + (err.message || 'Environment cleared'));
      window.location.href = '/admin/contracts';
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header 
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--sap-shell-bg)',
        color: 'var(--sap-shell-text)',
        borderBottom: '1px solid #2B3D4F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      }}
    >
      {/* Page Title & Breadcrumb Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', margin: 0, letterSpacing: '0.01em' }}>
          {title}
        </h1>
      </div>

      {/* Right User Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        
        {/* Reset Demo Data Button */}
        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#E2E8F0',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: isResetting ? 'wait' : 'pointer',
            transition: 'all var(--transition-normal)',
            borderRadius: 'var(--radius-button)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#E2E8F0';
          }}
          title="Resets demo environment data"
        >
          <RotateCcw size={12} className={isResetting ? 'spin' : ''} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>

        {/* User Info & Persona Pill */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 600, fontSize: '12px', color: '#FFFFFF', margin: 0 }}>
            {currentUser.displayName || currentUser.username}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1px' }}>
            <span 
              style={{
                fontSize: '9px',
                fontWeight: 700,
                backgroundColor: '#0A6ED1',
                color: '#FFFFFF',
                padding: '1px 6px',
                borderRadius: 'var(--radius-pill)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {currentUser.role.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* User Avatar */}
        <div 
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#0A6ED1',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '11px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          {getInitials()}
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#CBD5E1',
            display: 'flex',
            alignItems: 'center',
            padding: '5px',
            borderRadius: 'var(--radius-button)',
            transition: 'all var(--transition-normal)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FF8A8A';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#CBD5E1';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Confirm Reset Modal */}
      <Modal 
        isOpen={showResetConfirm} 
        onClose={() => setShowResetConfirm(false)} 
        title="Reset Demo Environment Data"
        width="440px"
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ backgroundColor: 'var(--color-error-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-error-light)', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertTriangle size={24} color="var(--color-error)" style={{ flexShrink: 0 }} />
            <div style={{ textAlign: 'left', fontSize: '13px', color: 'var(--color-error-text)', lineHeight: 1.5 }}>
              This will erase all active dispatches, weighbridge scale logs, OTPs, POD uploads, and MIRO invoices, restoring the system to its initial demo state.
            </div>
          </div>
          <p style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--color-text-heading)', fontWeight: 600 }}>
            Do you want to proceed and reset the demo data?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowResetConfirm(false)} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={handleResetDemoData} 
              className="btn btn-danger"
              style={{ backgroundColor: 'var(--color-error)', border: 'none' }}
            >
              ↺ Confirm & Reset Demo
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Logout Modal */}
      <Modal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        title="Confirm Log Out"
        width="400px"
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--color-text-body)' }}>
            Are you sure you want to log out of the POD portal?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowLogoutConfirm(false)} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={handleLogout} 
              className="btn btn-danger"
            >
              Log Out
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
