import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileClock, ArrowRight, Server, FileText, CheckCircle2, Activity } from 'lucide-react';

import { caApi, invoicesApi, ContractV3, PurchaseOrderV3, ReviewQueueItemV3, DeliveryInvoiceV3, MiroInvoice } from '../lib/api_v3';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Table, Column } from '../components/Table';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractV3[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderV3[]>([]);
  const [reviews, setReviews] = useState<ReviewQueueItemV3[]>([]);
  const [invoices, setInvoices] = useState<DeliveryInvoiceV3[]>([]);
  const [miroInvoices, setMiroInvoices] = useState<MiroInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const c = await caApi.getContracts();
      setContracts(c || []);
      const pos = await caApi.getPurchaseOrders();
      setPurchaseOrders(pos || []);
      const r = await caApi.getReviewQueue('OPEN');
      setReviews(r || []);
      const i = await caApi.getDeliveryInvoices('SENT_TO_CA');
      setInvoices(i || []);
      const mi = await invoicesApi.listMiro();
      setMiroInvoices(mi || []);
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

  const openPOs = purchaseOrders.filter(p => p.status === 'OPEN');
  const openReviews = reviews.filter(r => r.status === 'OPEN');
  const pendingPodVerify = invoices.filter(i => i.status === 'SENT_TO_CA');
  const pendingMiro = miroInvoices.filter(m => m.status === 'PARKED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner (V3 Royal Blue Theme) */}
      <div 
        className="hero-banner"
        style={{ 
          background: 'linear-gradient(135deg, var(--color-brand-blue-600) 0%, var(--color-brand-blue-700) 100%)', 
          borderRadius: '16px', 
          padding: '28px 32px', 
          color: '#ffffff', 
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="hero-banner-content" style={{ zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="pulse-dot pulse-dot--active" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 0 8px #FFFFFF' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-brand-blue-50)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Company Admin • Action & Verification Control
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
            Fleet Logistics Command Desk
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px', maxWidth: '640px', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            Real-time tracking of outline agreement usage, weight logs, geofence validations, OCR checks, and SAP MIRO invoice automated parking.
          </p>
        </div>

        <div className="hero-banner-actions" style={{ zIndex: 2 }}>
          <Button 
            onClick={() => navigate('/admin/approvals')} 
            variant="primary" 
            style={{ backgroundColor: '#ffffff', color: 'var(--color-brand-blue-600)', borderColor: '#ffffff', fontWeight: 700 }}
          >
            Inspect POD Queue ({openReviews.length}) <ArrowRight size={14} style={{ marginLeft: '4px' }} />
          </Button>
          <Button 
            onClick={() => navigate('/admin/invoices')} 
            variant="secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'; }}
          >
            MIRO Console ({pendingPodVerify.length})
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading telemetry...</div>
      ) : (
        <>
          {/* KPI Cards Grid — Card Encapsulated & Interactive Redirection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            
            {/* 1. Pending PO Release */}
            <div className="kpi-card" onClick={() => navigate('/admin/contracts')} style={{ cursor: 'pointer', borderLeft: openPOs.length > 0 ? '4px solid #2563EB' : '1px solid var(--color-border)' }}>
              <div>
                <div className="kpi-label">Pending PO Release</div>
                <div className="kpi-value">{openPOs.length}</div>
                <div className="kpi-trend kpi-trend--up" style={{ color: openPOs.length > 0 ? '#2563EB' : 'var(--color-text-muted)' }}>
                  {openPOs.length > 0 ? 'Requires CA Action' : 'All released POs handled'}
                </div>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
                <FileText size={20} />
              </div>
            </div>

            {/* 2. Flagged Reviews */}
            <div className="kpi-card" onClick={() => navigate('/admin/approvals')} style={{ cursor: 'pointer', borderLeft: openReviews.length > 0 ? '4px solid #DC2626' : '1px solid var(--color-border)' }}>
              <div>
                <div className="kpi-label">Flagged Reviews</div>
                <div className="kpi-value">{openReviews.length}</div>
                <div className="kpi-trend kpi-trend--down" style={{ color: openReviews.length > 0 ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>
                  {openReviews.length > 0 ? 'Requires Attention' : 'No reviews require attention'}
                </div>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)' }}>
                <ClipboardCheck size={20} />
              </div>
            </div>

            {/* 3. Pending POD Verification */}
            <div className="kpi-card" onClick={() => navigate('/admin/approvals')} style={{ cursor: 'pointer', borderLeft: pendingPodVerify.length > 0 ? '4px solid #D97706' : '1px solid var(--color-border)' }}>
              <div>
                <div className="kpi-label">Pending POD Verification</div>
                <div className="kpi-value">{pendingPodVerify.length}</div>
                <div className="kpi-trend kpi-trend--up" style={{ color: pendingPodVerify.length > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)' }}>
                  {pendingPodVerify.length > 0 ? 'Awaiting Verification' : 'No POD verification pending'}
                </div>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }}>
                <FileClock size={20} />
              </div>
            </div>

            {/* 4. Pending MIRO */}
            <div className="kpi-card" onClick={() => navigate('/admin/invoices')} style={{ cursor: 'pointer', borderLeft: pendingMiro.length > 0 ? '4px solid #059669' : '1px solid var(--color-border)' }}>
              <div>
                <div className="kpi-label">Pending MIRO</div>
                <div className="kpi-value">{pendingMiro.length}</div>
                <div className="kpi-trend kpi-trend--up" style={{ color: pendingMiro.length > 0 ? 'var(--color-success-text)' : 'var(--color-text-muted)' }}>
                  {pendingMiro.length > 0 ? 'Parked Invoices Ready' : 'No MIRO items pending'}
                </div>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                <Server size={20} />
              </div>
            </div>

          </div>


          <div className="responsive-split" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <Card 
              title="Live Outline Agreements Usage Meter" 
              subtitle="Real-time S/4HANA contract fulfillment"
              action={
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate('/admin/contracts')}
                  style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-brand-blue-600)' }}
                >
                  View All ({contracts.length}) <ArrowRight size={13} />
                </Button>
              }
              style={{ padding: 0 }}
            >
              <Table<ContractV3>
                data={contracts}
                onRowClick={(c) => navigate('/admin/contracts', { state: { contractId: c.id } })}
                renderMobileCard={(c) => {
                  const completedCount = (c as any).completed_count || 0;
                  const totalPos = (c as any).total_pos || 5;
                  const pct = Math.round((completedCount / totalPos) * 100);
                  return (
                    <div 
                      onClick={() => navigate('/admin/contracts', { state: { contractId: c.id } })} 
                      style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>{c.sap_contract_no}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.customer_name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        <span>{pct}% Executed</span>
                        <span>{c.start_date} to {c.end_date}</span>
                      </div>
                    </div>
                  );
                }}
                columns={[
                  {
                    header: 'Contract Ref',
                    render: (c) => (
                      <span 
                        className="mono" 
                        style={{ 
                          fontWeight: 700, 
                          color: 'var(--color-brand-blue-600)',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px'
                        }}
                      >
                        {c.sap_contract_no}
                      </span>
                    )
                  },
                  {
                    header: 'Yard Location',
                    render: (c) => <span style={{ fontWeight: 600 }}>{c.customer_name}</span>
                  },
                  {
                    header: 'Volume Delivered (SLA Target)',
                    render: (c) => {
                      const completedCount = (c as any).completed_count || 0;
                      const totalPos = (c as any).total_pos || 5;
                      const pct = Math.round((completedCount / totalPos) * 100);
                      return (
                        <div style={{ minWidth: '180px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                            <span>{pct}% Executed</span>
                            <span style={{ color: 'var(--color-text-muted)' }}>{completedCount > 0 ? 'Target Active' : '0 POs Completed'}</span>
                          </div>
                          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--color-brand-blue-600)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    header: 'Validity Period',
                    render: (c) => <span style={{ fontSize: '12px' }}>{c.start_date} to {c.end_date}</span>
                  },
                  {
                    header: 'Status',
                    render: (c) => <StatusBadge status={c.status} />
                  }
                ]}
              />
            </Card>

            <Card title="System Telemetry Logs">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div 
                  onClick={() => navigate('/admin/contracts')}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px' }}
                  className="table-row-hover"
                  title="View Outline Agreements"
                >
                  <div style={{ backgroundColor: 'var(--color-brand-blue-50)', padding: '6px', borderRadius: '6px', color: 'var(--color-brand-blue-600)' }}>
                    <Activity size={14} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>OData Sync Sequence Active</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>Refreshed outline contracts from S/4HANA</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/admin/approvals')}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px' }}
                  className="table-row-hover"
                  title="View Flagged Review Queue"
                >
                  <div style={{ backgroundColor: 'var(--color-error-bg)', padding: '6px', borderRadius: '6px', color: 'var(--color-error-text)' }}>
                    <ClipboardCheck size={14} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Review Queue Alert</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--color-text-muted)' }}>{reviews.length} items flagged for manual override</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/admin/invoices')}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px' }}
                  className="table-row-hover"
                  title="View SAP MIRO Invoices"
                >
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
