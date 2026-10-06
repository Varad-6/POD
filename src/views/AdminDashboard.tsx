import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileClock, ArrowRight, Server, FileText, CheckCircle2, Activity } from 'lucide-react';

import { caApi, invoicesApi, ContractV3, PurchaseOrderV3, ReviewQueueItemV3, DeliveryInvoiceV3, MiroInvoice } from '../lib/api_v3';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Table, Column } from '../components/Table';
import { KPISummaryBar } from '../components/KPISummaryBar';
import { PageHeader } from '../components/PageHeader';

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
  }, []);

  const openPOs = purchaseOrders.filter(p => p.status === 'OPEN');
  const openReviews = reviews.filter(r => r.status === 'OPEN');
  const pendingPodVerify = invoices.filter(i => i.status === 'SENT_TO_CA');
  const pendingMiro = miroInvoices.filter(m => m.status === 'PARKED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <PageHeader
        title="Fleet Logistics Command Desk"
        subtitle="Real-time tracking of outline agreement usage, weight logs, geofence validations, OCR checks, and SAP MIRO invoice automated parking."
        actions={
          <>
            <Button 
              onClick={() => navigate('/admin/approvals')} 
              variant="primary" 
              size="sm"
            >
              Inspect POD Queue ({openReviews.length}) <ArrowRight size={13} style={{ marginLeft: '4px' }} />
            </Button>
            <Button 
              onClick={() => navigate('/admin/invoices')} 
              variant="secondary"
              size="sm"
            >
              MIRO Console ({pendingPodVerify.length})
            </Button>
          </>
        }
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading telemetry...</div>
      ) : (
        <>
          {/* SAP Enterprise Horizontal KPI Summary Bar (Screenshot 1) */}
          <KPISummaryBar
            items={[
              {
                id: 'pos',
                value: openPOs.length,
                label: 'Pending PO Release',
                subtitle: openPOs.length > 0 ? 'Requires CA Action' : 'All handled',
                onClick: () => navigate('/admin/contracts'),
              },
              {
                id: 'reviews',
                value: openReviews.length,
                label: 'Pending POD Verification',
                subtitle: openReviews.length > 0 ? 'Awaiting CA Audit' : 'Queue clear',
                onClick: () => navigate('/admin/approvals'),
                accentColor: openReviews.length > 0 ? 'var(--color-error)' : undefined,
              },
              {
                id: 'pod',
                value: pendingPodVerify.length,
                label: 'Freight Invoices',
                subtitle: pendingPodVerify.length > 0 ? 'Ready for MIRO Parking' : 'None pending',
                onClick: () => navigate('/admin/invoices'),
                accentColor: pendingPodVerify.length > 0 ? 'var(--color-warning)' : undefined,
              },
              {
                id: 'miro',
                value: pendingMiro.length,
                label: 'Parked SAP MIRO',
                subtitle: pendingMiro.length > 0 ? 'Ready for Clearing' : 'None pending',
                onClick: () => navigate('/admin/invoices'),
              },
            ]}
          />


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
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{c.sap_contract_no}</span>
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
                          cursor: 'pointer'
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
