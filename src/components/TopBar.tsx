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
      await demoApi.resetData();
      window.dispatchEvent(new Event('pod_data_refreshed'));
      alert('✓ Demo data reset successfully! You can now repeat the end-to-end demo workflow.');
      window.location.reload();
    } catch (err: any) {
      alert('Failed to reset demo data: ' + (err.message || 'Error occurred'));
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
    <header className="topbar">
      <style>{`
        /* Responsive TopBar Styles - Designed for Standard & Compact Views */
        .topbar {
          height: var(--topbar-height);
          background-color: #FFFFFF;
          border-bottom: 1px solid var(--neutral-200);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 90;
          box-shadow: var(--shadow-subtle);
          box-sizing: border-box;
          width: 100%;
        }
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
          flex-shrink: 1;
        }
        .topbar-logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          border-right: 1px solid #E2E8F0;
          padding-right: 16px;
          flex-shrink: 0;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .topbar-btn-reset {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          color: #C2410C;
          border: 1px solid #FFEDD5;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .topbar-user-info {
          text-align: right;
          flex-shrink: 0;
        }
        .topbar-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background-color: var(--brand-purple);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          border: 2px solid #FFFFFF;
          box-shadow: var(--shadow-subtle);
          flex-shrink: 0;
        }
        .topbar-btn-logout {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--neutral-500);
          display: flex;
          align-items: center;
          padding: 7px;
          border-radius: 8px;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .topbar-btn-logout:hover {
          background-color: var(--neutral-100);
          color: var(--neutral-800);
        }

        /* ContractPoSelector styles */
        .contract-po-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #F8FAFC;
          padding: 4px 10px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          font-size: 12px;
          max-width: 100%;
          flex-shrink: 1;
          min-width: 0;
        }
        .contract-po-label {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--brand-orange);
          font-weight: 700;
          flex-shrink: 0;
        }
        .contract-po-select-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #FFFFFF;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #CBD5E1;
          max-width: 180px;
          flex-shrink: 1;
          min-width: 0;
        }
        .contract-po-select {
          border: none;
          outline: none;
          background: transparent;
          font-size: 12px;
          font-weight: 700;
          color: #0A192F;
          cursor: pointer;
          width: 100%;
          max-width: 100%;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }
        .contract-po-arrow {
          color: #94A3B8;
          font-weight: 600;
          flex-shrink: 0;
        }

        /* Responsive breakpoints */
        @media (max-width: 1400px) {
          .topbar-logo-container {
            display: none; /* Hide TopBar Logo - Sidebar already has it */
          }
        }
        @media (max-width: 1280px) {
          .contract-po-select-wrapper {
            max-width: 130px; /* Compress selects */
          }
        }
        @media (max-width: 1200px) {
          .topbar {
            padding: 0 16px;
          }
          .topbar-btn-reset span {
            display: none; /* Icon-only on reset */
          }
          .topbar-btn-reset {
            padding: 8px;
            border-radius: 50%;
          }
        }
        @media (max-width: 1150px) {
          .contract-po-label {
            display: none !important; /* Hide label */
          }
        }
        @media (max-width: 1024px) {
          .topbar-user-info {
            display: none; /* Hide username string, keep avatar */
          }
        }
        @media (max-width: 640px) {
          .topbar {
            padding: 0 8px;
            gap: 4px;
          }
          .topbar-left {
            gap: 8px;
          }
          .topbar-right {
            gap: 6px;
          }
          .contract-po-selector {
            gap: 4px;
            padding: 2px 6px;
            border-radius: 8px;
          }
          .contract-po-select-wrapper {
            max-width: 90px;
            padding: 2px 4px;
            border-radius: 4px;
          }
          .contract-po-arrow {
            font-size: 10px;
          }
        }
      `}</style>

      {/* Title & SAP Environment Badge & Global Contract/PO Selector */}
      <div className="topbar-left">
        <div className="topbar-logo-container">
          <PodzoLogo variant="compact" height={28} />
        </div>
        <ContractPoSelector />
      </div>

      {/* Right User Controls & Refresh Button */}
      <div className="topbar-right">
        {/* Reset Demo Data Button */}
        <button
          onClick={() => setShowResetConfirm(true)}
          disabled={isResetting}
          className="topbar-btn-reset"
          style={{
            backgroundColor: '#FFF7ED',
          }}
          title="Erases execution data and restores demo environment to initial state"
        >
          <RotateCcw size={13} className={isResetting ? 'spin' : ''} style={{ flexShrink: 0 }} />
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
              <Bell size={17} style={{ flexShrink: 0 }} />
              
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
        <div className="topbar-user-info">
          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--neutral-900)', margin: 0, whiteSpace: 'nowrap' }}>
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
        <div className="topbar-avatar">
          {getInitials()}
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="topbar-btn-logout"
          title="Sign Out"
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
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
