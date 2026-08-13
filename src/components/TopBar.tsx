import React, { useState } from 'react';
import { LogOut, Bell, Search, RefreshCw, Server, CheckCircle2 } from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '../lib/api_v3';
import { Modal } from './Modal';

interface TopBarProps {
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { user: currentUser, logout } = useAuthV3();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const handleNotificationClick = (_notifId: string, link: string) => {
    setShowNotifDropdown(false);
    navigate(link);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
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
      {/* Title & SAP Environment Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--neutral-900)', letterSpacing: '-0.02em', margin: 0 }}>
          {title}
        </h2>

        {/* SAP Environment Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 800,
            backgroundColor: sapMode === 'LIVE' ? 'rgba(0, 138, 0, 0.1)' : 'var(--brand-purple-light)',
            color: sapMode === 'LIVE' ? 'var(--success-600)' : 'var(--brand-purple)',
            border: `1px solid ${sapMode === 'LIVE' ? 'rgba(0, 138, 0, 0.3)' : 'rgba(77, 20, 140, 0.3)'}`,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
          title={sapMode === 'LIVE' ? 'Connected to S21 OData Server' : 'Operating in Persistent Mock SAP Mode'}
        >
          <Server size={12} />
          <span>{sapMode === 'LIVE' ? 'S21 SAP' : 'MOCK SAP'}</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1, maxWidth: '380px', margin: '0 24px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={16} color="var(--neutral-400)" style={{ position: 'absolute', left: '14px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO, Contract, Driver, Truck, POD..."
            style={{
              width: '100%',
              padding: '8px 14px 8px 38px',
              fontSize: '12.5px',
              borderRadius: '9999px',
              border: '1px solid var(--neutral-300)',
              backgroundColor: 'var(--neutral-50)',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
          />
        </div>

        {/* Search Results Dropdown Card */}
        {searchResults && (
          <div
            style={{
              position: 'absolute',
              top: '44px',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid var(--neutral-200)',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 200,
              maxHeight: '360px',
              overflowY: 'auto',
              padding: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--neutral-100)' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>
                Search Results for "{searchResults.query}"
              </span>
              <button onClick={() => setSearchResults(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--brand-purple)', fontWeight: 700 }}>
                Close
              </button>
            </div>

            {searchResults.contracts.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-purple)', textTransform: 'uppercase' }}>Contracts ({searchResults.contracts.length})</span>
                {searchResults.contracts.map((c: any) => (
                  <div key={c.id} onClick={() => { setSearchResults(null); navigate('/admin/contracts'); }} style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'var(--neutral-50)', marginTop: '4px', fontSize: '12px', fontWeight: 600 }}>
                    📄 {c.sap_contract_no} — {c.customer_name}
                  </div>
                ))}
              </div>
            )}

            {searchResults.purchaseOrders.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-purple)', textTransform: 'uppercase' }}>Purchase Orders ({searchResults.purchaseOrders.length})</span>
                {searchResults.purchaseOrders.map((po: any) => (
                  <div key={po.id} onClick={() => { setSearchResults(null); navigate('/transporter/purchase-orders'); }} style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'var(--neutral-50)', marginTop: '4px', fontSize: '12px', fontWeight: 600 }}>
                    📋 {po.sap_po_no} — {po.material} ({po.target_qty} TON)
                  </div>
                ))}
              </div>
            )}

            {searchResults.assignments.length > 0 && (
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-purple)', textTransform: 'uppercase' }}>Dispatches ({searchResults.assignments.length})</span>
                {searchResults.assignments.map((a: any) => (
                  <div key={a.id} onClick={() => { setSearchResults(null); navigate('/admin/dashboard'); }} style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'var(--neutral-50)', marginTop: '4px', fontSize: '12px', fontWeight: 600 }}>
                    🚚 Dispatch #{a.id} — {a.driver_name} ({a.vehicle_reg}) • {a.status}
                  </div>
                ))}
              </div>
            )}

            {searchResults.contracts.length === 0 && searchResults.purchaseOrders.length === 0 && searchResults.assignments.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--neutral-500)', fontSize: '12px' }}>
                No records found matching "{searchResults.query}"
              </div>
            )}
          </div>
        )}
      </form>

      {/* Right User Controls & Refresh Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Refresh Button with Timestamp */}
        <button
          onClick={handleManualRefresh}
          className="btn btn-ghost btn-sm"
          style={{ gap: '6px', fontSize: '11px', borderRadius: '9999px' }}
          title={`Click to refresh data. Last refreshed at ${lastRefreshed}`}
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : `Refreshed ${lastRefreshed}`}</span>
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
