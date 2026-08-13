import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/Toast';
import { Login } from './views/Login';
import { TransporterDashboard } from './views/TransporterDashboard';
import { TransporterPOs } from './views/TransporterPOs';
import { TransporterPODs } from './views/TransporterPODs';
import { TransporterInvoices } from './views/TransporterInvoices';
import { AdminDashboard } from './views/AdminDashboard';
import { AdminApprovals } from './views/AdminApprovals';
import { AdminInvoices } from './views/AdminInvoices';
import { AdminContracts } from './views/AdminContracts';
import { SupervisorDashboard } from './views/SupervisorDashboard';
import { CustomerDashboard } from './views/CustomerDashboard';
import { DriverDashboard } from './views/DriverDashboard';
import { useDemo, DemoProvider } from './context/DemoContext';
import { USERS } from './data/mockData';
import { RefreshCw, UserCheck, Settings } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, toasts, removeToast, resetDemo, login } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!currentUser && location.pathname !== '/login') {
      navigate('/login');
    } else if (currentUser && location.pathname === '/login') {
      const role = currentUser.role;
      if (role === 'COMPANY_ADMIN' || role === 'IKWEZI_ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'SUPERVISOR') {
        navigate('/supervisor/dashboard');
      } else if (role === 'CUSTOMER') {
        navigate('/customer/dashboard');
      } else if (role === 'DRIVER') {
        navigate('/driver/dashboard');
      } else {
        navigate('/transporter/dashboard');
      }
    }
  }, [currentUser, location.pathname, navigate]);

  // Determine page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Portal Dashboard';
    if (path.includes('/purchase-orders')) return 'Transport Purchase Orders';
    if (path.includes('/pods')) return 'Proof of Delivery matching';
    if (path.includes('/invoices')) return currentUser?.role === 'COMPANY_ADMIN' || currentUser?.role === 'IKWEZI_ADMIN' ? 'Invoice Control Management' : 'Freight Invoices & Statements';
    if (path.includes('/approvals')) return 'POD Verification Queue';
    return 'Portal';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Demo Control Bar (Presenters Helper Bar) */}
      <div 
        style={{
          backgroundColor: '#111827',
          color: '#e5e7eb',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          fontWeight: 600,
          borderBottom: '1px solid #374151',
          zIndex: 1000,
          position: 'sticky',
          top: 0,
          height: 'var(--demo-bar-height)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Empty left title spot */}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>ACTIVE ROLE:</span>
              <select
                value={currentUser.username}
                onChange={(e) => {
                  const val = e.target.value;
                  const u = USERS.find((user) => user.username === val);
                  login(val);
                  if (u?.role === 'COMPANY_ADMIN' || u?.role === 'IKWEZI_ADMIN') {
                    navigate('/admin/dashboard');
                  } else if (u?.role === 'SUPERVISOR') {
                    navigate('/supervisor/dashboard');
                  } else if (u?.role === 'CUSTOMER') {
                    navigate('/customer/dashboard');
                  } else if (u?.role === 'DRIVER') {
                    navigate('/driver/dashboard');
                  } else {
                    navigate('/transporter/dashboard');
                  }
                }}
                style={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #4b5563',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {USERS.map((user) => (
                  <option key={user.username} value={user.username}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              resetDemo();
              navigate('/login');
            }}
            style={{
              background: '#ef4444',
              border: '1px solid #dc2626',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            <RefreshCw size={11} />
            Reset Demo State
          </button>
        </div>
      </div>

      {/* Main app layout wrapper */}
      {!currentUser ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="app-container" style={{ paddingTop: '0px' }}>
          <Sidebar />
          <div className="main-wrapper">
            <TopBar title={getPageTitle()} />
            <main className="content-container">
              <Routes>
                 {/* Transporter Routes */}
                <Route path="/transporter/dashboard" element={<TransporterDashboard />} />
                <Route path="/transporter/purchase-orders" element={<TransporterPOs />} />
                <Route path="/transporter/pods" element={<TransporterPODs />} />
                <Route path="/transporter/invoices" element={<TransporterInvoices />} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/contracts" element={<AdminContracts />} />
                <Route path="/admin/approvals" element={<AdminApprovals />} />
                <Route path="/admin/invoices" element={<AdminInvoices />} />

                {/* Supervisor Routes */}
                <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />

                {/* Customer Routes */}
                <Route path="/customer/dashboard" element={<CustomerDashboard />} />

                {/* Driver Routes */}
                <Route path="/driver/dashboard" element={<DriverDashboard />} />

                {/* Catch-all redirect */}
                <Route 
                  path="*" 
                  element={
                    <Navigate 
                      to={
                        currentUser.role === 'COMPANY_ADMIN' || currentUser.role === 'IKWEZI_ADMIN'
                          ? "/admin/dashboard"
                          : currentUser.role === 'SUPERVISOR'
                          ? "/supervisor/dashboard"
                          : currentUser.role === 'CUSTOMER'
                          ? "/customer/dashboard"
                          : currentUser.role === 'DRIVER'
                          ? "/driver/dashboard"
                          : "/transporter/dashboard"
                      } 
                      replace 
                    />
                  } 
                />
              </Routes>
            </main>
          </div>
        </div>
      )}

      {/* Slide-in notification container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <DemoProvider>
      <MainApp />
    </DemoProvider>
  );
}
