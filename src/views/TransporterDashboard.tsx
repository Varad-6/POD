import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { Truck, FileText, ClipboardList, Receipt, ArrowRight, ChevronRight } from 'lucide-react';

// ─── Dashboard Card ────────────────────────────────────────────────────────────
const NavCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  route: string;
  color: string;
  badge?: string;
}> = ({ icon, title, description, route, color, badge }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(route)}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        padding: '24px 24px 20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--shadow-card)',
        transition: 'all var(--transition-normal)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = 'var(--shadow-card-hover)';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = 'var(--shadow-card)';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px',
          backgroundColor: 'var(--color-brand-blue-600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#FFFFFF',
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
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-heading)', margin: '0 0 6px' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-body)', margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-brand-blue-600)', fontSize: '13.5px', fontWeight: 700, marginTop: 'auto', paddingTop: '8px' }}>
        <span>Open Console</span>
        <ChevronRight size={15} />
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const TransporterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthV3();
  const [jobConfigs, setJobConfigs] = React.useState<any[]>([]);
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadTAStats() {
      setLoading(true);
      try {
        const jobs = await fetch('http://localhost:3001/api/v3/job-configs', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('podzo_token_v3') || ''}` }
        }).then(r => r.json());
        setJobConfigs(jobs || []);

        const trips = await fetch('http://localhost:3001/api/v3/assignments', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('podzo_token_v3') || ''}` }
        }).then(r => r.json());
        setAssignments(trips || []);
      } catch (err) {
        console.warn('Failed to load TA metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTAStats();
  }, []);

  const pendingPO = jobConfigs.filter(j => j.status === 'PENDING');
  const pendingDriverAssign = jobConfigs.filter(j => j.status === 'PENDING' && (!j.driver_id || !j.vehicle_id));
  const activeTransports = assignments.filter(a => a.status === 'DISPATCHED' || a.status === 'IN_TRANSIT' || a.status === 'ACCEPTED');
  const podPending = assignments.filter(a => (a.status === 'DELIVERED' && !a.pod_file_url) || a.status === 'REJECTED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Welcome Header (V3 Blue Hero Banner) ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-brand-blue-600) 0%, var(--color-brand-blue-700) 100%)',
        borderRadius: '16px', padding: '32px 36px', color: '#fff',
        position: 'relative', overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Background circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: '-20px', right: '100px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-blue-50)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Transporter Admin • Operations Console
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Welcome, {user?.displayName?.split(' ')[0] || 'Transporter'}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)', margin: 0, maxWidth: '520px', lineHeight: 1.5 }}>
            Manage your delivery orders, assign drivers and trucks, track trips, upload delivery receipts, and raise invoices — all from one place.
          </p>
        </div>
      </div>

      {/* ── Actionable KPI Status Cards ── */}
      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
          Action Required Right Now
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          
          <div className="kpi-card" onClick={() => navigate('/transporter/purchase-orders')} style={{ cursor: 'pointer', borderLeft: pendingPO.length > 0 ? '4px solid #2563EB' : '1px solid var(--color-border)' }}>
            <div>
              <div className="kpi-label">Pending PO</div>
              <div className="kpi-value">{pendingPO.length}</div>
              <div className="kpi-trend kpi-trend--up" style={{ color: pendingPO.length > 0 ? '#2563EB' : 'var(--color-text-muted)' }}>
                {pendingPO.length > 0 ? 'Requires Transport Action' : 'All released POs handled'}
              </div>
            </div>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
              <FileText size={20} />
            </div>
          </div>

          <div className="kpi-card" onClick={() => navigate('/transporter/purchase-orders')} style={{ cursor: 'pointer', borderLeft: pendingDriverAssign.length > 0 ? '4px solid #D97706' : '1px solid var(--color-border)' }}>
            <div>
              <div className="kpi-label">Pending Driver Assignment</div>
              <div className="kpi-value">{pendingDriverAssign.length}</div>
              <div className="kpi-trend kpi-trend--up" style={{ color: pendingDriverAssign.length > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)' }}>
                {pendingDriverAssign.length > 0 ? 'Driver / Vehicle Needed' : 'All jobs assigned'}
              </div>
            </div>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }}>
              <Truck size={20} />
            </div>
          </div>

          <div className="kpi-card" onClick={() => navigate('/transporter/trips')} style={{ cursor: 'pointer', borderLeft: '1px solid var(--color-border)' }}>
            <div>
              <div className="kpi-label">Active Transports</div>
              <div className="kpi-value">{activeTransports.length}</div>
              <div className="kpi-trend kpi-trend--up" style={{ color: 'var(--color-brand-blue-600)' }}>
                Trips In Transit
              </div>
            </div>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-brand-blue-50)', color: 'var(--color-brand-blue-600)' }}>
              <ClipboardList size={20} />
            </div>
          </div>

          <div className="kpi-card" onClick={() => navigate('/transporter/pods')} style={{ cursor: 'pointer', borderLeft: podPending.length > 0 ? '4px solid #DC2626' : '1px solid var(--color-border)' }}>
            <div>
              <div className="kpi-label">POD Pending</div>
              <div className="kpi-value">{podPending.length}</div>
              <div className="kpi-trend kpi-trend--down" style={{ color: podPending.length > 0 ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>
                {podPending.length > 0 ? 'POD Upload Required' : 'All PODs uploaded'}
              </div>
            </div>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)' }}>
              <Receipt size={20} />
            </div>
          </div>

        </div>
      </div>


      {/* ── How it works ── */}
      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
          How the process works
        </h2>
        <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', gap: '0', position: 'relative', flexWrap: 'wrap' }}>

            {[
              { num: '1', title: 'Order Arrives', desc: 'Company admin releases a PO. You receive it here.' },
              { num: '2', title: 'Assign Driver', desc: 'Pick a driver and truck. Set the trip date and siding.' },
              { num: '3', title: 'Driver Does Trip', desc: 'Driver loads coal, travels, and unloads at customer.' },
              { num: '4', title: 'Upload POD', desc: 'Upload the stamped delivery receipt for approval.' },
              { num: '5', title: 'Get Paid', desc: 'Create invoice. Company approves and SAP clears payment.' },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px', position: 'relative', padding: '10px' }}>
                {/* Connector line */}
                {i < arr.length - 1 && (
                  <div style={{
                    position: 'absolute', top: '28px', left: 'calc(50% + 18px)', right: 'calc(-50% + 18px)',
                    height: '2.5px', backgroundColor: 'var(--color-border)', zIndex: 0
                  }} />
                )}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'var(--color-brand-blue-600)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 900, flexShrink: 0, position: 'relative', zIndex: 1,
                  boxShadow: '0 2px 6px rgba(47, 95, 224, 0.2)'
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>{step.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Action (Blue Tinted Banner) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'var(--color-brand-blue-50)', borderRadius: '16px', padding: '18px 24px',
        border: '1px solid var(--color-border)', cursor: 'pointer',
        boxShadow: 'var(--shadow-card)',
        transition: 'all var(--transition-normal)'
      }}
        onClick={() => navigate('/transporter/purchase-orders')}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EEF2FE'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-brand-blue-50)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-brand-blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-blue-700)' }}>Go to Purchase Orders</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Assign drivers to pending orders now</div>
          </div>
        </div>
        <ArrowRight size={20} color="var(--color-brand-blue-600)" />
      </div>
    </div>
  );
};
