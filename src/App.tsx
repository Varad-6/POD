import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/Toast';
import LoginPage from './pages/LoginPage';
import { AuthProviderV3, useAuthV3 } from './contexts/AuthContextV3';
import { DemoProvider } from './context/DemoContext';
import { PodzoLogo } from './components/branding/PodzoLogo';

import { Footer } from './components/Footer';

// Existing views
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

function getDefaultRoute(role: string): string {
  switch (role) {
    case 'CA': return '/admin/dashboard';
    case 'SR': return '/supervisor/dashboard';
    case 'CR': return '/customer/dashboard';
    case 'DR': return '/driver/dashboard';
    case 'TA': return '/transporter/dashboard';
    default:   return '/login';
  }
}

function getPageTitle(path: string, role: string): string {
  if (path.includes('/admin/dashboard')) return 'Control Tower';
  if (path.includes('/transporter/dashboard')) return 'Transport Operations';
  if (path.includes('/purchase-orders')) return 'Transport Purchase Orders';
  if (path.includes('/pods')) return 'Proof of Delivery Upload & Management';
  if (path.includes('/invoices')) return role === 'CA' ? 'SAP MIRO Invoice Clearing' : 'Freight Invoices & Ledger';
  if (path.includes('/approvals')) return 'OCR POD Verification Desk';
  if (path.includes('/contracts')) return 'Outline Contracts';
  if (path.includes('/supervisor/dashboard')) return 'Pre-Dispatch Weighbridge Console';
  if (path.includes('/customer/dashboard')) return 'Yard Receiving & Gate Clearance';
  if (path.includes('/driver/dashboard')) return 'Driver Transport App';
  return 'Transport Execution Platform';
}

const MainApp: React.FC = () => {
  const { user, loading } = useAuthV3();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(() => {
    return localStorage.getItem('podzo_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('podzo_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (loading) return;
    if (!user && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    } else if (user && location.pathname === '/login') {
      navigate(getDefaultRoute(user.role), { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname === '/login') {
      document.title = "PODZO — Sign In";
    } else if (user) {
      const pageTitle = getPageTitle(location.pathname, user.role);
      document.title = `PODZO — ${pageTitle}`;
    } else {
      document.title = "PODZO — Let's make delivery simple.";
    }
  }, [location.pathname, user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A192F', color: '#FFFFFF' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px 28px', borderRadius: '14px', marginBottom: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <PodzoLogo variant="full" height={54} />
        </div>
        <div style={{ color: '#FF5B00', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Loading PODZO Platform...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const sidebarWidth = isSidebarCollapsed ? '72px' : '260px';

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        ['--sidebar-width' as any]: sidebarWidth
      }}
    >
      <div className="app-container">
        <Sidebar collapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <div className="main-wrapper" style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <TopBar title={getPageTitle(location.pathname, user.role)} onToggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
          <main className="content-container">
            <Routes>
              {/* Transporter Routes */}
              <Route path="/transporter/dashboard"      element={<TransporterDashboard />} />
              <Route path="/transporter/purchase-orders" element={<TransporterPOs />} />
              <Route path="/transporter/pods"           element={<TransporterPODs />} />
              <Route path="/transporter/invoices"       element={<TransporterInvoices />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard"  element={<AdminDashboard />} />
              <Route path="/admin/contracts"  element={<AdminContracts />} />
              <Route path="/admin/approvals"  element={<AdminApprovals />} />
              <Route path="/admin/invoices"   element={<AdminInvoices />} />

              {/* Supervisor Routes */}
              <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />

              {/* Customer Routes */}
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />

              {/* Driver Routes */}
              <Route path="/driver/dashboard" element={<DriverDashboard />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to={getDefaultRoute(user.role)} replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

import { ContractPoProvider } from './contexts/ContractPoContext';

export default function App() {
  return (
    <AuthProviderV3>
      <DemoProvider>
        <ContractPoProvider>
          <MainApp />
        </ContractPoProvider>
      </DemoProvider>
    </AuthProviderV3>
  );
}
