import React, { useState } from 'react';
import { LogOut, Bell } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';

interface TopBarProps {
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { currentUser, logout, notifications, markNotificationRead } = useDemo();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  if (!currentUser) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get Initials for Avatar
  const getInitials = () => {
    if (currentUser.displayName) {
      const parts = currentUser.displayName.split(' ');
      return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }
    if (currentUser.companyName) {
      const parts = currentUser.companyName.split(' ');
      return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }
    return currentUser.username.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const handleNotificationClick = (notifId: string, link: string) => {
    markNotificationRead(notifId);
    setShowNotifDropdown(false);
    navigate(link);
  };

  return (
    <header 
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-grey)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 'var(--demo-bar-height)',
        zIndex: 90,
      }}
    >
      {/* Title */}
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--neutral-primary)' }}>
        {title}
      </h2>

      {/* User Info & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
        
        {/* Notification Bell (Only for Transporter Roles) */}
        {(currentUser.role === 'DRIVER' || currentUser.role === 'TRANSPORTER_ADMIN' || currentUser.role === 'TRANSPORTER') && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--neutral-secondary)',
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.15s',
                backgroundColor: showNotifDropdown ? 'var(--secondary-bg)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!showNotifDropdown) e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                if (!showNotifDropdown) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Notifications"
            >
              <Bell size={20} />
              
              {/* Unread Badge */}
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: 'var(--error-text)',
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
                className="animate-slide-in"
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '320px',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  border: '1px solid var(--border-grey)',
                  zIndex: 200,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-grey)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary-color)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 500 }}>{unreadCount} unread</span>
                  )}
                </div>
                
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--neutral-secondary)' }}>
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
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          backgroundColor: notif.read ? 'transparent' : 'rgba(31, 78, 121, 0.04)',
                          transition: 'background-color 0.1s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.read ? 'transparent' : 'rgba(31, 78, 121, 0.04)'}
                      >
                        <p style={{ fontSize: '12.5px', fontWeight: notif.read ? 500 : 700, color: 'var(--neutral-primary)', lineHeight: 1.4 }}>
                          {notif.text}
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 500 }}>
                          Click to raise invoice statement
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-primary)' }}>
            {currentUser.displayName || currentUser.companyName}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
            <span 
              style={(() => {
                const role = currentUser.role;
                let bg = '#f1f5f9';
                let color = '#475569';
                if (role === 'COMPANY_ADMIN' || role === 'IKWEZI_ADMIN') {
                  bg = '#EFF6FF';
                  color = '#2563EB';
                } else if (role === 'SUPERVISOR') {
                  bg = '#E0F2FE';
                  color = '#0284C7';
                } else if (role === 'CUSTOMER') {
                  bg = '#F5F3FF';
                  color = '#7C3AED';
                } else if (role === 'DRIVER') {
                  bg = '#FEF3C7';
                  color = '#B45309';
                } else if (role === 'TRANSPORTER_ADMIN' || role === 'TRANSPORTER') {
                  bg = '#F0FDFA';
                  color = '#0D9488';
                }
                return {
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: bg,
                  color: color,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${color}33`,
                  display: 'inline-block'
                };
              })()}
            >
              {(() => {
                const role = currentUser.role;
                if (role === 'COMPANY_ADMIN' || role === 'IKWEZI_ADMIN') return 'Company Admin';
                if (role === 'SUPERVISOR') return 'Supervisor';
                if (role === 'CUSTOMER') return 'Customer';
                if (role === 'DRIVER') return 'Truck Driver';
                return 'Transporter Admin';
              })()}
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--secondary-bg)',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            border: '1.5px solid var(--primary-color)'
          }}
        >
          {getInitials()}
        </div>

        {/* Quick Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--neutral-secondary)',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--error-text)';
            e.currentTarget.style.backgroundColor = 'var(--error-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--neutral-secondary)';
            e.currentTarget.style.backgroundColor = 'transparent';
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
              onClick={handleLogout} 
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
    </header>
  );
};
