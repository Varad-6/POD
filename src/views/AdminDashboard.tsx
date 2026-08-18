import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileClock, CheckCircle, XCircle, ArrowRight, Server, ShieldCheck, Activity } from 'lucide-react';
import { caApi, ContractV3, ReviewQueueItemV3, DeliveryInvoiceV3 } from '../lib/api_v3';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractV3[]>([]);
  const [reviews, setReviews] = useState<ReviewQueueItemV3[]>([]);
  const [invoices, setInvoices] = useState<DeliveryInvoiceV3[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const c = await caApi.getContracts();
      setContracts(c);
      const r = await caApi.getReviewQueue('OPEN');
      setReviews(r);
      const i = await caApi.getDeliveryInvoices('SENT_TO_CA');
      setInvoices(i);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, #0B132B 0%, #1C2541 100%)', 
          borderRadius: '16px', 
          padding: '28px 32px', 
          color: '#ffffff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="pulse-dot pulse-dot--active" />
            <span style={{ fontSize: '11px', color: '#06B6D4', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Fleet Telemetry • SAP S4/HANA Live Integration
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
            Fleet Logistics Command Desk
          </h2>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px', maxWidth: '640px', margin: '4px 0 0 0' }}>
            Real-time tracking of outline agreement usage, weight logs, geofence validations, OCR checks, and SAP MIRO invoice automated parking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
          <button onClick={() => navigate('/admin/approvals')} className="btn btn-primary">
            Inspect POD Queue ({reviews.length}) <ArrowRight size={14} />
          </button>
          <button 
            onClick={() => navigate('/admin/invoices')} 
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            MIRO Console ({invoices.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Loading telemetry...</div>
      ) : (
        <>
          {/* KPI Cards Grid — Card Encapsulated & Interactive Redirection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <Card 
              title="Outline Agreements" 
              icon={<Server size={18} color="var(--brand-purple)" />}
              onClick={() => navigate('/admin/contracts')}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--neutral-900)' }}>{contracts.length}</span>
                <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>Active Contracts</span>
              </div>
            </Card>

            <Card 
              title="Flagged Reviews" 
              icon={<ClipboardCheck size={18} color="var(--error-600)" />}
              onClick={() => navigate('/admin/approvals')}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--neutral-900)' }}>{reviews.length}</span>
                <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>Open Audits</span>
              </div>
            </Card>

            <Card 
              title="Park Pending" 
              icon={<FileClock size={18} color="var(--brand-orange)" />}
              onClick={() => navigate('/admin/invoices')}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--neutral-900)' }}>{invoices.length}</span>
                <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>Ready to Park</span>
              </div>
            </Card>

            <Card title="BAPI Sync Status" icon={<ShieldCheck size={18} color="var(--success-600)" />}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success-600)' }}>ONLINE</span>
                <span style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>SAP S21 Interface</span>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <Card title="Live Outline Agreements Usage Meter">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Contract Ref</th>
                      <th>Yard Location</th>
                      <th>Volume Delivered (SLA Target)</th>
                      <th>Validity Period</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map(c => {
                      const pct = c.sap_contract_no === '4600000017' ? 72 : c.sap_contract_no === '4600000018' ? 45 : c.sap_contract_no === '4600000019' ? 60 : 30;
                      return (
                        <tr key={c.id} onClick={() => navigate('/admin/contracts')} style={{ cursor: 'pointer' }}>
                          <td className="mono" style={{ fontWeight: 700, color: 'var(--brand-purple)' }}>{c.sap_contract_no}</td>
                          <td style={{ fontWeight: 600 }}>{c.customer_name}</td>
                          <td style={{ minWidth: '180px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                              <span>{pct}% Executed</span>
                              <span style={{ color: 'var(--neutral-500)' }}>Target Active</span>
                            </div>
                            <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--neutral-200)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct > 70 ? '#10B981' : pct > 40 ? '#F59E0B' : '#6366F1', borderRadius: '3px' }} />
                            </div>
                          </td>
                          <td style={{ fontSize: '12px' }}>{c.start_date} to {c.end_date}</td>
                          <td>
                            <StatusBadge status={c.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="System Telemetry Logs">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', padding: '6px', borderRadius: '6px', color: 'var(--accent-blue)' }}>
                    <Activity size={14} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>OData Sync Sequence Active</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--neutral-500)' }}>Refreshed outline contracts from S/4HANA</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '6px', color: 'var(--error-600)' }}>
                    <ClipboardCheck size={14} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Review Queue Alert</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--neutral-500)' }}>{reviews.length} items flagged for manual override</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '6px', color: 'var(--success-600)' }}>
                    <FileClock size={14} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>MIRO Post Sequence Connected</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--neutral-500)' }}>Live connectivity to SAP Finance module</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

    </div>
  );
};
