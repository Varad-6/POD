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
            Transporter Portal
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Welcome, {user?.displayName?.split(' ')[0] || 'Transporter'}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)', margin: 0, maxWidth: '520px', lineHeight: 1.5 }}>
            Manage your delivery orders, assign drivers and trucks, track trips, upload delivery receipts, and raise invoices — all from one place.
          </p>
        </div>
      </div>

      {/* ── Quick Nav Cards ── */}
      <div>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
          What do you want to do?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <NavCard
            icon={<FileText size={20} />}
            title="Purchase Orders"
            description="View all delivery orders from SAP. Assign drivers and trucks to pending orders."
            route="/transporter/purchase-orders"
            color="var(--color-brand-blue-600)"
            badge="Action Required"
          />
          <NavCard
            icon={<ClipboardList size={20} />}
            title="Delivery Receipts (PODs)"
            description="Upload the stamped delivery receipts after trucks are unloaded at customer yard."
            route="/transporter/pods"
            color="var(--color-brand-blue-600)"
          />
          <NavCard
            icon={<Receipt size={20} />}
            title="Invoices & Payments"
            description="Create tax invoices for completed deliveries and track payment status from SAP."
            route="/transporter/invoices"
            color="var(--color-brand-blue-600)"
          />
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
