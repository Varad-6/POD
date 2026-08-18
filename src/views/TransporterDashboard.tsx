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
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '28px 28px 24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
        el.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
        el.style.transform = 'translateY(0)';
      }}
    >
      {/* Accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: color, borderRadius: '16px 16px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          backgroundColor: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
        {badge && (
          <span style={{
            backgroundColor: '#FEF3C7', color: '#92400E',
            padding: '4px 10px', borderRadius: '20px',
            fontSize: '11px', fontWeight: 800
          }}>
            {badge}
          </span>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: color, fontSize: '13px', fontWeight: 700, marginTop: 'auto' }}>
        Open <ChevronRight size={15} />
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

      {/* ── Welcome Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        borderRadius: '18px', padding: '32px 36px', color: '#fff',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Background circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: '-20px', right: '100px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Transporter Portal
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Welcome, {user?.displayName?.split(' ')[0] || 'Transporter'}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: 0, maxWidth: '480px' }}>
            Manage your delivery orders, assign drivers and trucks, track trips, upload delivery receipts, and raise invoices — all from one place.
          </p>
        </div>
      </div>

      {/* ── Quick Nav Cards ── */}
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
          What do you want to do?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <NavCard
            icon={<FileText size={24} />}
            title="Purchase Orders"
            description="View all delivery orders from SAP. Assign drivers and trucks to pending orders."
            route="/transporter/purchase-orders"
            color="#3B82F6"
            badge="Action Required"
          />
          <NavCard
            icon={<ClipboardList size={24} />}
            title="Delivery Receipts (PODs)"
            description="Upload the stamped delivery receipts after trucks are unloaded at customer yard."
            route="/transporter/pods"
            color="#8B5CF6"
          />
          <NavCard
            icon={<Receipt size={24} />}
            title="Invoices & Payments"
            description="Create tax invoices for completed deliveries and track payment status from SAP."
            route="/transporter/invoices"
            color="#10B981"
          />
        </div>
      </div>

      {/* ── How it works ── */}
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
          How the process works
        </h2>
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', gap: '0', position: 'relative' }}>

            {[
              { num: '1', title: 'Order Arrives', desc: 'Company admin releases a PO. You receive it here.', color: '#3B82F6' },
              { num: '2', title: 'Assign Driver', desc: 'Pick a driver and truck. Set the trip date and siding.', color: '#8B5CF6' },
              { num: '3', title: 'Driver Does Trip', desc: 'Driver loads coal, travels, and unloads at customer.', color: '#F59E0B' },
              { num: '4', title: 'Upload POD', desc: 'Upload the stamped delivery receipt for approval.', color: '#10B981' },
              { num: '5', title: 'Get Paid', desc: 'Create invoice. Company approves and SAP clears payment.', color: '#EF4444' },
            ].map((step, i, arr) => (
              <div key={step.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px', position: 'relative' }}>
                {/* Connector line */}
                {i < arr.length - 1 && (
                  <div style={{
                    position: 'absolute', top: '18px', left: 'calc(50% + 18px)', right: 'calc(-50% + 18px)',
                    height: '2px', backgroundColor: '#E2E8F0', zIndex: 0
                  }} />
                )}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: step.color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 900, flexShrink: 0, position: 'relative', zIndex: 1
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>{step.title}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Action ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#EFF6FF', borderRadius: '12px', padding: '18px 24px',
        border: '1px solid #BFDBFE', cursor: 'pointer'
      }}
        onClick={() => navigate('/transporter/purchase-orders')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1D4ED8' }}>Go to Purchase Orders</div>
            <div style={{ fontSize: '12px', color: '#3B82F6' }}>Assign drivers to pending orders now</div>
          </div>
        </div>
        <ArrowRight size={20} color="#3B82F6" />
      </div>
    </div>
  );
};
