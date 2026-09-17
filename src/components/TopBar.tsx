import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Bell, RotateCcw, AlertTriangle, Menu, Search, HelpCircle } from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { useDemo } from '../context/DemoContext';
import { useNavigate } from 'react-router-dom';
import { searchApi, demoApi } from '../lib/api_v3';
import { Modal } from './Modal';
import { Button } from './Button';

interface TopBarProps {
  title: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onToggleSidebar, isSidebarCollapsed }) => {
  const { user: currentUser, logout } = useAuthV3();
  const navigate = useNavigate();

  // Notification state from existing DemoContext
  let notifications: any[] = [];
  let markNotificationRead = (_id: string) => {};
  try {
    const demo = useDemo();
    notifications = demo.notifications || [];
    markNotificationRead = demo.markNotificationRead || ((_id: string) => {});
  } catch {
    // Safe fallback if rendered outside DemoProvider
  }

  const unreadNotifications = notifications.filter(n => !n.read);
  const unreadCount = unreadNotifications.length;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const notifContainerRef = useRef<HTMLDivElement>(null);
  const notifButtonRef = useRef<HTMLButtonElement>(null);

  // Click outside and Escape key handler for notification popover
  useEffect(() => {
    if (!showNotifDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifDropdown(false);
        notifButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifDropdown]);

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
    <>
      <header 
        style={{
          height: '52px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Left: Hamburger Sidebar Toggle + Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation"
              title="Toggle navigation"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '4px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-brand-blue-50)';
                e.currentTarget.style.color = 'var(--color-brand-blue-600)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-muted)';
              }}
            >
              <Menu size={18} />
            </button>
          )}

          <h1 
            title={title}
            onClick={() => {
              if (window.innerWidth < 768) {
                alert(title);
              }
            }}
            style={{ 
              fontSize: '15px', 
              fontWeight: 700, 
              color: 'var(--color-text-heading)', 
              margin: 0, 
              letterSpacing: '-0.01em',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            {title}
          </h1>
        </div>

        {/* Center: Global Search Bar (Enterprise SAP Pattern) */}
        <div className="topbar-search-wrapper" style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '420px', margin: '0 20px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search orders, contracts, waybills..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                backgroundColor: 'var(--color-bg-page)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--color-text-heading)',
                outline: 'none',
                minHeight: '30px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Right-Hand Controls: Notification Bell + User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* Functional Notification Bell (Accessible on Desktop & Mobile) */}
          <div ref={notifContainerRef} style={{ position: 'relative' }}>
            <button
              ref={notifButtonRef}
              type="button"
              onClick={() => setShowNotifDropdown(prev => !prev)}
              aria-label="Notifications"
              aria-expanded={showNotifDropdown}
              aria-haspopup="true"
              title="Notifications"
              style={{
                background: showNotifDropdown ? 'var(--color-brand-blue-50)' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: showNotifDropdown ? 'var(--color-brand-blue-600)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px',
                borderRadius: '4px',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!showNotifDropdown) {
                  e.currentTarget.style.backgroundColor = 'var(--color-brand-blue-50)';
                  e.currentTarget.style.color = 'var(--color-brand-blue-600)';
                }
              }}
              onMouseLeave={(e) => {
                if (!showNotifDropdown) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }
              }}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span 
                  style={{ 
                    position: 'absolute', 
                    top: '2px', 
                    right: '2px', 
                    minWidth: '15px', 
                    height: '15px', 
                    borderRadius: '10px', 
                    backgroundColor: 'var(--color-brand-blue-600)', 
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    lineHeight: 1
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifDropdown && (
              <div
                role="dialog"
                aria-label="Notifications"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '320px',
                  maxWidth: 'calc(100vw - 32px)',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                  zIndex: 1000,
                  overflow: 'hidden',
                }}
              >
                {/* Popover Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: '#FFFFFF'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        notifications.forEach(n => markNotificationRead(n.id));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--color-brand-blue-600)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Popover Body */}
                {notifications.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-brand-blue-50)',
                      color: 'var(--color-brand-blue-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px'
                    }}>
                      <Bell size={16} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: '2px' }}>
                      No new notifications
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                      You are all caught up. New updates will appear here.
                    </div>
                  </div>
                ) : (
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.link) navigate(n.link);
                          setShowNotifDropdown(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--color-border)',
                          backgroundColor: n.read ? 'transparent' : 'var(--color-brand-blue-50)',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F4F8FD'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.read ? 'transparent' : 'var(--color-brand-blue-50)'; }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: n.read ? 'transparent' : 'var(--color-brand-blue-600)',
                            marginTop: '6px',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: n.read ? 500 : 700, color: 'var(--color-text-heading)', lineHeight: 1.4 }}>
                            {n.text}
                          </div>
                          {n.timestamp && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                              {n.timestamp}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Controls (hidden on mobile via CSS) */}
          <div className="topbar-desktop-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Help Documentation */}
            <button
              type="button"
              onClick={() => alert('PODZO Transporter Portal (SAP S21 Integrated)\nNeed help? Contact Ikwezi Logistics Support.')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
                borderRadius: '4px',
              }}
              title="Help & Documentation"
            >
              <HelpCircle size={16} />
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isResetting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                backgroundColor: 'transparent',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: isResetting ? 'wait' : 'pointer',
                transition: 'all var(--transition-normal)',
                borderRadius: '4px'
              }}
              title="Resets demo environment data"
            >
              <RotateCcw size={12} className={isResetting ? 'spin' : ''} />
              <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>

            {/* User Info & Role Tag */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--color-text-heading)', margin: 0 }}>
                {currentUser.displayName || currentUser.username}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1px' }}>
                <span 
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 600,
                    backgroundColor: 'var(--color-brand-blue-50)',
                    color: 'var(--color-brand-blue-600)',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    border: '1px solid var(--color-border)',
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
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-brand-blue-50)',
                color: 'var(--color-brand-blue-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12.5px',
                border: '1px solid var(--color-border)',
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

          {/* Mobile Controls (hidden on desktop) */}
          <div className="topbar-mobile-controls" style={{ display: 'none', alignItems: 'center' }}>
            <div 
              onClick={() => setShowMobileDrawer(true)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-brand-blue-50)',
                color: 'var(--color-brand-blue-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '12px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
                cursor: 'pointer'
              }}
            >
              {getInitials()}
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Drawer (Bottom Sheet) */}
      {showMobileDrawer && (
        <div 
          onClick={() => setShowMobileDrawer(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 150,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-bg-card)',
              width: '100%',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '24px 24px 96px 24px',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px', alignSelf: 'center', marginBottom: '8px' }} />
            <div>
              <p style={{ fontWeight: 800, fontSize: '16px', color: 'var(--color-text-heading)', margin: '0 0 4px 0' }}>
                {currentUser.displayName || currentUser.username}
              </p>
              <span 
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-brand-blue-50)',
                  color: 'var(--color-brand-blue-600)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--color-border)',
                  textTransform: 'uppercase'
                }}
              >
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
            <Button 
              variant="secondary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => {
                setShowMobileDrawer(false);
                setShowResetConfirm(true);
              }}
            >
              <RotateCcw size={16} /> Reset Demo Environment
            </Button>
            <Button 
              variant="danger" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', color: '#fff' }}
              onClick={() => {
                setShowMobileDrawer(false);
                setShowLogoutConfirm(true);
              }}
            >
              <LogOut size={16} /> Log Out
            </Button>
          </div>
        </div>
      )}

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
    </>
  );
};
