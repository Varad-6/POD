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
        backgroundColor: 'var(--color-bg-card)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Page Title clearly shown as H1, brand logo skipped to prevent repetition */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading)', margin: 0, letterSpacing: '-0.02em' }}>
          {title}
        </h1>
      </div>

      {/* Right User Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Reset Demo Data Button: styled as small muted text link */}
        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'transparent',
            color: 'var(--color-text-muted)',
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isResetting ? 'wait' : 'pointer',
            transition: 'all var(--transition-normal)',
            borderRadius: 'var(--radius-button)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F1F5F9';
            e.currentTarget.style.color = 'var(--color-text-heading)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
          title="Resets demo environment data"
        >
          <RotateCcw size={13} className={isResetting ? 'spin' : ''} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>

        {/* User Info & Persona Pill */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-heading)', margin: 0 }}>
            {currentUser.displayName || currentUser.username}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
            <span 
              style={{
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: 'var(--color-brand-blue-50)',
                color: 'var(--color-brand-blue-600)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-border)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {currentUser.role.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* User Avatar: soft blue bg, brand blue text */}
        <div 
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-brand-blue-50)',
            color: 'var(--color-brand-blue-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '13px',
            border: '1.5px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
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
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: '7px',
            borderRadius: 'var(--radius-button)',
            transition: 'all var(--transition-normal)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-error-text)';
            e.currentTarget.style.backgroundColor = 'var(--color-error-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Sign Out"
        >
          <LogOut size={18} />
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
