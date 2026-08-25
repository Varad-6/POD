import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileClock, CheckCircle, XCircle, ArrowRight, Server, ShieldCheck, Activity } from 'lucide-react';
import { caApi, invoicesApi, ContractV3, ReviewQueueItemV3, DeliveryInvoiceV3, MiroInvoice } from '../lib/api_v3';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractV3[]>([]);
  const [reviews, setReviews] = useState<ReviewQueueItemV3[]>([]);
  const [invoices, setInvoices] = useState<DeliveryInvoiceV3[]>([]);
  const [miroInvoices, setMiroInvoices] = useState<MiroInvoice[]>([]);
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
      const mi = await invoicesApi.listMiro();
      setMiroInvoices(mi);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    const handleDataRefreshed = () => {
      loadStats();
    };
    window.addEventListener('pod_data_refreshed', handleDataRefreshed);
    return () => {
      window.removeEventListener('pod_data_refreshed', handleDataRefreshed);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner (V3 Royal Blue Theme) */}
      <div 
        style={{ 
          background: 'linear-gradient(135deg, var(--color-brand-blue-600) 0%, var(--color-brand-blue-700) 100%)', 
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
            <span className="pulse-dot pulse-dot--active" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 0 8px #FFFFFF' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-brand-blue-50)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Fleet Telemetry • SAP S/4HANA Live Integration
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
            Fleet Logistics Command Desk
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', maxWidth: '640px', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            Real-time tracking of outline agreement usage, weight logs, geofence validations, OCR checks, and SAP MIRO invoice automated parking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
          <button 
            onClick={() => navigate('/admin/approvals')} 
            className="btn btn-primary" 
            style={{ backgroundColor: '#ffffff', color: 'var(--color-brand-blue-600)', borderColor: '#ffffff', fontWeight: 700 }}
          >
            Inspect POD Queue ({reviews.length}) <ArrowRight size={14} />
          </button>
          <button 
            onClick={() => navigate('/admin/invoices')} 
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'; }}
          >
            MIRO Console ({invoices.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading telemetry...</div>
      ) : (
        <>
          {/* KPI Cards Grid — Card Encapsulated & Interactive Redirection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="kpi-card" onClick={() => navigate('/admin/approvals')} style={{ cursor: 'pointer' }}>
              <div>
                <div className="kpi-label">Flagged Reviews</div>
                <div className="kpi-value">{reviews.length}</div>
                <div className="kpi-trend kpi-trend--down" style={{ color: 'var(--color-error-text)' }}>Requires Attention</div>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)' }}>
                <ClipboardCheck size={20} />
              </div>
            </div>

            <div className="kpi-card" onClick={() => navigate('/admin/invoices')} style={{ cursor: 'pointer' }}>
              <div>
                <div className="kpi-label">Park Pending</div>
                <div className="kpi-value">{invoices.length}</div>
                <div className="kpi-trend kpi-trend--up" style={{ color: 'var(--color-warning-text)' }}>Ready to Park</div>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }}>
                <FileClock size={20} />
              </div>
            </div>

            <div className="kpi-card" onClick={() => navigate('/admin/invoices')} style={{ cursor: 'pointer' }}>
              <div>
                <div className="kpi-label">Pending MIRO</div>
                <div className="kpi-value">{miroInvoices.filter(m => m.status === 'PARKED').length}</div>
                <div className="kpi-trend kpi-trend--up" style={{ color: 'var(--color-brand-blue-600)' }}>Parked Docs</div>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-brand-blue-50)', color: 'var(--color-brand-blue-600)' }}>
                <Server size={20} />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-label">BAPI Sync Status</div>
                <div className="kpi-value" style={{ fontSize: '18px', marginTop: '10px', color: 'var(--color-success-text)' }}>ONLINE</div>
                <div className="kpi-trend kpi-trend--up" style={{ color: 'var(--color-success-text)' }}>S/4HANA Sync Active</div>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                <ShieldCheck size={20} />
              </div>
            </div>
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
                      const completedCount = (c as any).completed_count || 0;
                      const totalPos = (c as any).total_pos || 5;
                      const pct = Math.round((completedCount / totalPos) * 100);
                      return (
                        <tr key={c.id} onClick={() => navigate('/admin/contracts')} style={{ cursor: 'pointer' }}>
                          <td className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{c.sap_contract_no}</td>
                          <td style={{ fontWeight: 600 }}>{c.customer_name}</td>
                          <td style={{ minWidth: '180px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                              <span>{pct}% Executed</span>
                              <span style={{ color: 'var(--color-text-muted)' }}>{completedCount > 0 ? 'Target Active' : '0 POs Completed'}</span>
                            </div>
                            <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--color-brand-blue-600)', borderRadius: '3px' }} />
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
                  <div style={{ backgroundColor: 'var(--color-brand-blue-50)', padding: '6px', borderRadius: '6px', color: 'var(--color-brand-blue-600)' }}>
                    <Activity size={14} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>OData Sync Sequence Active</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>Refreshed outline contracts from S/4HANA</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'var(--color-error-bg)', padding: '6px', borderRadius: '6px', color: 'var(--color-error-text)' }}>
                    <ClipboardCheck size={14} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Review Queue Alert</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>{reviews.length} items flagged for manual override</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ backgroundColor: 'var(--color-success-bg)', padding: '6px', borderRadius: '6px', color: 'var(--color-success-text)' }}>
                    <FileClock size={14} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>MIRO Post Sequence Connected</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>Live connectivity to SAP Finance module</p>
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
