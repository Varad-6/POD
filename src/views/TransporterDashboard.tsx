import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { KPISummaryBar } from '../components/KPISummaryBar';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { salesOrdersApi, SoDistributionV3, API_BASE } from '../lib/api_v3';
import { Truck, FileText, ClipboardList, Receipt, ArrowRight, ChevronRight, RefreshCw, Package } from 'lucide-react';

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
  const [distributions, setDistributions] = useState<SoDistributionV3[]>([]);
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
      const [jobsRes, assignsRes, dists] = await Promise.all([
        fetch(`${API_BASE}/job-configs`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('podzo_token_v3') || ''}` }
        }),
        fetch(`${API_BASE}/assignments`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('podzo_token_v3') || ''}` }
        }),
        salesOrdersApi.getDistributions().catch(() => [])
      ]);

      const jobs = await jobsRes.json();
      const assigns = await assignsRes.json();
      setJobConfigs(Array.isArray(jobs) ? jobs : []);
      setAssignments(Array.isArray(assigns) ? assigns : []);
      setDistributions(Array.isArray(dists) ? dists : []);
    } catch (err) {
      console.error('Failed to load transporter stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTAStats();
  }, []);

  const pendingDist = distributions.filter(d => d.status === 'PENDING');
  const pendingDriverDist = distributions.filter(d => !d.driver_name || d.status === 'PENDING');
  const activeTransports = assignments.filter(a => ['ASSIGNED', 'MINE_TARE_LOGGED', 'MINE_GROSS_LOGGED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(a.status));
  const podPending = assignments.filter(a => a.status === 'DELIVERED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* 1. Page Header */}
      <PageHeader 
        title={`Welcome, ${user?.displayName?.split(' ')[0] || 'Transporter'}`}
        subtitle="Operations Command Console • Manage assigned SAP Sales Orders, fleet dispatch, trip telemetry, and delivery verification."
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

      {/* 2. SAP Horizontal KPI Summary Bar */}
      <KPISummaryBar
        items={[
          {
            id: 'pending-so',
            value: distributions.length,
            label: 'Assigned Orders',
            subtitle: pendingDist.length > 0 ? `${pendingDist.length} Awaiting Dispatch` : 'All allocated active',
            onClick: () => navigate('/transporter/sales-orders'),
            accentColor: distributions.length > 0 ? 'var(--color-brand-blue-600)' : undefined
          },
          {
            id: 'driver-assign',
            value: pendingDriverDist.length,
            label: 'Driver Needed',
            subtitle: pendingDriverDist.length > 0 ? 'Driver / Truck Required' : 'All crewed',
            onClick: () => navigate('/transporter/sales-orders'),
            accentColor: pendingDriverDist.length > 0 ? 'var(--color-warning)' : undefined
          },
          {
            id: 'active-trips',
            value: activeTransports.length,
            label: 'Active Trips',
            subtitle: 'In Transit Telemetry',
            onClick: () => navigate('/transporter/sales-orders'),
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <NavCard
          icon={<FileText size={20} />}
          title="Assigned Sales Orders"
          description="View complete Sales Orders distributed by Company Admin and allocate fleet capacity."
          route="/transporter/sales-orders"
          badge={distributions.length > 0 ? `${distributions.length} Orders` : undefined}
        />
        <NavCard
          icon={<ClipboardList size={20} />}
          title="Delivery Receipts (POD)"
          description="Upload signed proof of delivery notes for automated OCR verification."
          route="/transporter/pods"
          badge={podPending.length > 0 ? `${podPending.length} Needed` : undefined}
        />
      </div>

      {/* Standard Packaging & Load Mapping Note Banner */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: '#1e40af'
      }}>
        <Package size={17} style={{ flexShrink: 0, color: '#2563eb' }} />
        <span>
          <strong>Standard Payload Conversion: 1 Box = 1 Ton (1,000 kg).</strong> Fleet trucks are allocated based on box capacity.
        </span>
      </div>

      {/* 4. Active Allocated Orders Section */}
      <Card
        title="Allocated Sales Orders Haulage"
        subtitle="Live orders distributed by Company Admin requiring fleet crew allocation"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/transporter/sales-orders')}
          >
            Manage Fleet Hauls <ArrowRight size={13} style={{ marginLeft: '4px' }} />
          </Button>
        }
      >
        {distributions.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13.5px' }}>
            No Sales Orders distributed to your fleet yet. Orders distributed by Company Admin will appear here.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>SAP SO #</th>
                  <th style={{ padding: '10px 12px' }}>Outbound Deliveries (VL03N)</th>
                  <th style={{ padding: '10px 12px' }}>Client Yard</th>
                  <th style={{ padding: '10px 12px' }}>Allocated Load</th>
                  <th style={{ padding: '10px 12px' }}>Assigned Fleet</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {distributions.slice(0, 5).map(dist => (
                  <tr key={dist.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace' }}>
                      #{dist.sap_so_no}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {dist.deliveries_summary ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {dist.deliveries_summary.split(', ').map((delNo: string) => (
                            <span
                              key={delNo}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#1d4ed8'
                              }}
                            >
                              #{delNo}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600 }}>{dist.customer_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{dist.sap_customer_no}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package size={13} color="var(--color-brand-blue-600)" />
                        <span style={{ fontWeight: 600 }}>
                          {dist.total_qty ? `${dist.total_qty.toLocaleString()} Boxes (${dist.total_qty.toLocaleString()} Tons)` : `${dist.item_count || 1} Packages`}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {dist.driver_name ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{dist.driver_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{dist.vehicle_reg}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <StatusBadge status={dist.assignment_status || dist.status} />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant={dist.status === 'ASSIGNED' ? 'secondary' : 'primary'}
                        onClick={() => navigate('/transporter/sales-orders')}
                        style={{ padding: '3px 8px', fontSize: '12px' }}
                      >
                        {dist.status === 'ASSIGNED' ? 'View Trip' : 'Assign Driver'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 5. Guided Workflow Process Bar */}
      <Card title="Transport Execution Lifecycle" subtitle="Standard operating procedure from Sales Order allocation to SAP clearance">
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '0', position: 'relative' }}>
          {[
            { num: '1', title: 'Order Release', desc: 'Admin allocates Sales Order' },
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
