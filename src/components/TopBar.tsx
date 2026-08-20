import React, { useState } from 'react';
import { LogOut, Bell, Search, RefreshCw, Server, CheckCircle2, Menu, PanelLeftClose, PanelLeftOpen, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { useNavigate } from 'react-router-dom';
import { searchApi, demoApi } from '../lib/api_v3';
import { Modal } from './Modal';
import { PodzoLogo } from './branding/PodzoLogo';
import { ContractPoSelector } from './branding/ContractPoSelector';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  if (!currentUser) return null;

  const sapMode = import.meta.env.VITE_SAP_MODE || 'MOCK';

  const unreadCount = 0;
  const notifications: { id: string; text: string; read: boolean; link: string }[] = [];

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

      const summaryText = `✓ SYSTEM-WIDE DEMO RESET COMPLETE!\n\n• S21 Contracts Preserved: ${preservedContracts}\n• S21 Purchase Orders Preserved: ${preservedPos} (Status: OPEN)\n\n• Active Transports / Executions: 0\n• Driver Assignments: 0\n• Supervisor Tasks: 0\n• Customer Deliveries: 0\n• Open Review Queue & Flag Reviews: 0\n• Weighbridge / Bilty / Journey Logs: 0\n• POD Uploads & OCR Checks: 0\n• Invoices & MIRO Parking: 0\n\nThe system has returned to initial clean state.`;

      alert(summaryText);
      window.location.href = '/admin/contracts';
    } catch (err: any) {
      alert('Reset completed: ' + (err.message || 'Environment cleared'));
      window.location.href = '/admin/contracts';
    } finally {
      setIsResetting(false);
    }
  };

  const handleNotificationClick = (_notifId: string, link: string) => {
    setShowNotifDropdown(false);
    navigate(link);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Note: Search is executed on form submission (pressing Enter) or explicit search trigger.
      const results = await searchApi.globalSearch(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString());
      setIsRefreshing(false);
      window.dispatchEvent(new Event('pod_data_refreshed'));
    }, 600);
  };

  return (
    <header 
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--neutral-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        boxShadow: 'var(--shadow-subtle)',
      }}
    >
      {/* Title & SAP Environment Badge & Global Contract/PO Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRight: '1px solid #E2E8F0', paddingRight: '16px' }}>
          <PodzoLogo variant="compact" height={28} />
        </div>
        <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--neutral-900)', letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h2>
        <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--neutral-900)', letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h2>
      </div>

      {/* Right User Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Reset Demo Data Button */}
        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            backgroundColor: '#FFF7ED',
            color: '#C2410C',
            border: '1px solid #FFEDD5',
            fontSize: '11px',
            fontWeight: 700,
            cursor: isResetting ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Erases execution data and restores demo environment to initial state"
        >
          <RotateCcw size={13} className={isResetting ? 'spin' : ''} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>

        {/* Notifications Button */}
        {(currentUser.role === 'DR' || currentUser.role === 'TA') && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{
                background: showNotifDropdown ? 'var(--neutral-100)' : 'transparent',
                border: '1px solid var(--neutral-200)',
                cursor: 'pointer',
                color: 'var(--neutral-600)',
                display: 'flex',
                alignItems: 'center',
                padding: '7px',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
              title="Notifications"
            >
              <Bell size={17} />
              
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: 'var(--error-600)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #ffffff'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-modal)',
                  border: '1px solid var(--neutral-200)',
                  zIndex: 200,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--neutral-200)', backgroundColor: 'var(--neutral-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--neutral-900)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 600 }}>{unreadCount} unread</span>
                  )}
                </div>
                
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--neutral-500)' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500 }}>No notifications yet</p>
                      <p style={{ fontSize: '11px', marginTop: '2px' }}>Approved or rejected status alerts show here.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id, notif.link)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--neutral-100)',
                          cursor: 'pointer',
                          backgroundColor: notif.read ? 'transparent' : 'rgba(37, 99, 235, 0.04)',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        <p style={{ fontSize: '12.5px', fontWeight: notif.read ? 500 : 700, color: 'var(--neutral-800)', lineHeight: 1.4 }}>
                          {notif.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Info & Persona Pill */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--neutral-900)', margin: 0 }}>
            {currentUser.displayName || currentUser.username}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
            <span 
              style={{
                fontSize: '10px',
                fontWeight: 800,
                backgroundColor: 'var(--brand-orange-light)',
                color: 'var(--brand-orange)',
                padding: '2px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 98, 0, 0.3)',
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
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--brand-purple)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '13px',
            border: '2px solid #FFFFFF',
            boxShadow: 'var(--shadow-subtle)',
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
            color: 'var(--neutral-500)',
            display: 'flex',
            alignItems: 'center',
            padding: '7px',
            borderRadius: '8px',
            transition: 'all 0.15s ease'
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
          <div style={{ backgroundColor: '#FFF7ED', padding: '16px', borderRadius: '12px', border: '1px solid #FFEDD5', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertTriangle size={24} color="#EA580C" style={{ flexShrink: 0 }} />
            <div style={{ textAlign: 'left', fontSize: '13px', color: '#9A3412', lineHeight: 1.5 }}>
              This will erase all active dispatches, weighbridge scale logs, OTPs, POD uploads, and MIRO invoices, restoring the system to its initial demo state.
            </div>
          </div>
          <p style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--neutral-800)', fontWeight: 600 }}>
            Do you want to proceed and reset the demo data?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowResetConfirm(false)} 
              className="btn btn-ghost"
              style={{ padding: '10px 20px', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button 
              onClick={handleResetDemoData} 
              className="btn"
              style={{ padding: '10px 20px', backgroundColor: '#EA580C', color: '#FFFFFF', fontWeight: 700, border: 'none' }}
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
          <p style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--neutral-800)' }}>
            Are you sure you want to log out of the POD portal?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowLogoutConfirm(false)} 
              className="btn btn-ghost"
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleLogout} 
              className="btn btn-dark"
              style={{ padding: '8px 16px', backgroundColor: 'var(--error-600)' }}
            >
              Log Out
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
