import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileSignature, 
  ClipboardCheck, 
  Menu, 
  Receipt 
} from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';

interface BottomNavProps {
  onMenuClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onMenuClick }) => {
  const { user } = useAuthV3();

  if (!user) return null;

  const role = user.role;

  // Single-page dashboard roles: SR (Supervisor), CR (Customer), DR (Driver)
  const isSinglePageRole = ['SR', 'CR', 'DR'].includes(role);

  if (isSinglePageRole) {
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 998,
          boxShadow: '0 -4px 16px rgba(16, 24, 40, 0.05)'
        }}
      >
        <button
          type="button"
          onClick={onMenuClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--color-brand-blue-600)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '8px 24px',
            borderRadius: '20px',
            backgroundColor: 'var(--color-brand-blue-50)'
          }}
        >
          <Menu size={18} />
          <span>Open Portal Menu</span>
        </button>
      </div>
    );
  }

  // CA (Company Admin) Navigation configuration
  const renderCA = () => (
    <>
      <NavLink 
        to="/admin/dashboard" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>Logistics</span>
      </NavLink>
      <NavLink 
        to="/admin/contracts" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <FileSignature size={20} />
        <span>Contracts</span>
      </NavLink>
      <NavLink 
        to="/admin/approvals" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <ClipboardCheck size={20} />
        <span>Approvals</span>
      </NavLink>
      <button type="button" onClick={onMenuClick} className="bottom-nav-item">
        <Menu size={20} />
        <span>More</span>
      </button>
    </>
  );

  // TA (Transporter Admin) Navigation configuration
  const renderTA = () => (
    <>
      <NavLink 
        to="/transporter/dashboard" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink 
        to="/transporter/purchase-orders" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <FileSignature size={20} />
        <span>Orders</span>
      </NavLink>
      <NavLink 
        to="/transporter/pods" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Receipt size={20} />
        <span>PODs</span>
      </NavLink>
      <button type="button" onClick={onMenuClick} className="bottom-nav-item">
        <Menu size={20} />
        <span>More</span>
      </button>
    </>
  );

  return (
    <div 
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 998,
        boxShadow: '0 -4px 16px rgba(16, 24, 40, 0.05)'
      }}
    >
      {role === 'CA' ? renderCA() : renderTA()}
    </div>
  );
};
