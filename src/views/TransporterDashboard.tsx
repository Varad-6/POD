import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { KPISummaryBar } from '../components/KPISummaryBar';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { Truck, FileText, ClipboardList, Receipt, ArrowRight, ChevronRight, RefreshCw } from 'lucide-react';

// ─── Dashboard Navigation Card ────────────────────────────────────────────────
const NavCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  route: string;
  badge?: string;
}> = ({ icon, title, description, route, badge }) => {
  const navigate = useNavigate();
  return (
    <Card
      onClick={() => navigate(route)}
      hoverEffect
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: 'pointer',
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '6px',
          backgroundColor: 'var(--color-brand-blue-50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-brand-blue-600)',
        }}>
          {icon}
        </div>
        {badge && (
          <span className="badge badge-amber">
            {badge}
          </span>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-heading)', margin: '0 0 4px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
          {description}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-brand-blue-600)', fontSize: '13px', fontWeight: 600, marginTop: 'auto', paddingTop: '4px' }}>
        <span>Open Console</span>
        <ChevronRight size={14} />
      </div>
    </Card>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const TransporterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthV3();
  const [jobConfigs, setJobConfigs] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadTAStats = async () => {
    setLoading(true);
    try {
      const [jobsRes, assignsRes] = await Promise.all([
        fetch('http://localhost:3001/api/v3/job-configs', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('podzo_token_v3') || ''}` }
        }),
        fetch('http://localhost:3001/api/v3/assignments', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('podzo_token_v3') || ''}` }
        })
      ]);

      const jobs = await jobsRes.json();
      const assigns = await assignsRes.json();
      setJobConfigs(Array.isArray(jobs) ? jobs : []);
      setAssignments(Array.isArray(assigns) ? assigns : []);
    } catch (err) {
      console.error('Failed to load transporter stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTAStats();
  }, []);

  const pendingPO = jobConfigs.filter(j => j.status === 'PENDING');
  const pendingDriverAssign = jobConfigs.filter(j => j.status === 'PENDING' && (!j.driver_id || !j.vehicle_id));
  const activeTransports = assignments.filter(a => a.status === 'DISPATCHED' || a.status === 'IN_TRANSIT' || a.status === 'ACCEPTED');
  const podPending = assignments.filter(a => (a.status === 'DELIVERED' && !a.pod_file_url) || a.status === 'REJECTED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* 1. Page Header */}
      <PageHeader 
        title={`Welcome, ${user?.displayName?.split(' ')[0] || 'Transporter'}`}
        subtitle="Operations Command Console • Manage transport purchase orders, fleet assignments, trip telemetry, and freight settlements."
        actions={
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadTAStats}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </Button>
        }
      />

      {/* 2. SAP Horizontal KPI Summary Bar (Reference Screenshot 1) */}
      <KPISummaryBar
        items={[
          {
            id: 'pending-po',
            value: pendingPO.length,
            label: 'Pending Orders',
            subtitle: pendingPO.length > 0 ? 'Requires Action' : 'All released handled',
            onClick: () => navigate('/transporter/purchase-orders'),
            accentColor: pendingPO.length > 0 ? 'var(--color-brand-blue-600)' : undefined
          },
          {
            id: 'driver-assign',
            value: pendingDriverAssign.length,
            label: 'Driver Needed',
            subtitle: pendingDriverAssign.length > 0 ? 'Driver / Truck Needed' : 'All assigned',
            onClick: () => navigate('/transporter/purchase-orders'),
            accentColor: pendingDriverAssign.length > 0 ? 'var(--color-warning)' : undefined
          },
          {
            id: 'active-trips',
            value: activeTransports.length,
            label: 'Active Trips',
            subtitle: 'In Transit Telemetry',
            onClick: () => navigate('/transporter/trips'),
          },
          {
            id: 'pod-pending',
            value: podPending.length,
            label: 'POD Pending',
            subtitle: podPending.length > 0 ? 'Upload Required' : 'All uploaded',
            onClick: () => navigate('/transporter/pods'),
            accentColor: podPending.length > 0 ? 'var(--color-error)' : undefined
          }
        ]}
      />

      {/* 3. Primary Operational Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <NavCard
          icon={<FileText size={20} />}
          title="Purchase Orders"
          description="View incoming transport execution orders and assign drivers and trucks."
          route="/transporter/purchase-orders"
          badge={pendingPO.length > 0 ? `${pendingPO.length} Pending` : undefined}
        />
        <NavCard
          icon={<Truck size={20} />}
          title="Active Transports"
          description="Track active deliveries, weighbridge slips, and trip milestones."
          route="/transporter/trips"
        />
        <NavCard
          icon={<ClipboardList size={20} />}
          title="Delivery Receipts (POD)"
          description="Upload signed proof of delivery notes for automated OCR verification."
          route="/transporter/pods"
          badge={podPending.length > 0 ? `${podPending.length} Needed` : undefined}
        />
        <NavCard
          icon={<Receipt size={20} />}
          title="Invoices & Payments"
          description="Raise tax invoices for approved trips and inspect SAP payment remittances."
          route="/transporter/invoices"
        />
      </div>

      {/* 4. Guided Workflow Process Bar */}
      <Card title="Transport Execution Lifecycle" subtitle="Standard operating procedure from PO allocation to SAP clearance">
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '0', position: 'relative' }}>
          {[
            { num: '1', title: 'Order Release', desc: 'Admin releases outline agreement PO' },
            { num: '2', title: 'Assign Fleet', desc: 'Allocate driver and truck capacity' },
            { num: '3', title: 'Trip Execution', desc: 'Loading siding, scale, transit, delivery' },
            { num: '4', title: 'Upload POD', desc: 'Submit delivery receipt for OCR audit' },
            { num: '5', title: 'SAP Settlement', desc: 'Auto MIRO invoice parking & payment' },
          ].map((step, i, arr) => (
            <div 
              key={step.num} 
              style={{ 
                flex: 1, 
                minWidth: '130px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center', 
                gap: '8px', 
                position: 'relative', 
                padding: '8px 12px' 
              }}
            >
              {i < arr.length - 1 && !isMobile && (
                <div style={{
                  position: 'absolute', 
                  top: '22px', 
                  left: 'calc(50% + 16px)', 
                  right: 'calc(-50% + 16px)',
                  height: '1.5px', 
                  backgroundColor: 'var(--color-border)', 
                  zIndex: 0
                }} />
              )}
              <div style={{
                width: '30px', 
                height: '30px', 
                borderRadius: '50%',
                backgroundColor: 'var(--color-brand-blue-50)', 
                color: 'var(--color-brand-blue-600)',
                border: '1.5px solid var(--color-brand-blue-600)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '13px', 
                fontWeight: 800, 
                flexShrink: 0, 
                position: 'relative', 
                zIndex: 1
              }}>
                {step.num}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};
