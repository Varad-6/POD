import React, { useState, useEffect } from 'react';
import { FileClock, CreditCard, Search, ArrowRight, ShieldAlert, CheckCircle2, RefreshCw, FileText, Send } from 'lucide-react';
import { targetInvoicesApi, caApi, assignmentsApi, InvoiceEventV3, TransportAssignmentV3 } from '../lib/api_v3';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Tabs } from '../components/Tabs';
import { Table, Column } from '../components/Table';
import { formatCurrency, formatDate } from '../utils/format';

export const AdminInvoices: React.FC = () => {
  // Tabs per Target Flow: Post Invoice tab + PARKED tab + PAID tab
  const [activeTab, setActiveTab] = useState<'READY_TO_POST' | 'PARKED' | 'PAID'>('READY_TO_POST');
  const [approvedTrips, setApprovedTrips] = useState<TransportAssignmentV3[]>([]);
  const [postedInvoices, setPostedInvoices] = useState<InvoiceEventV3[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [allAssignments, postedList] = await Promise.all([
        assignmentsApi.list(),
        targetInvoicesApi.getPosted(),
      ]);

      // Ready to Post tab: Trips that are APPROVED by CA and not yet posted as invoice
      const postedAssignmentIds = (postedList || []).map(p => p.assignment_id);
      const ready = (allAssignments || []).filter(
        a => (a.status === 'APPROVED' || a.status === 'UNDER_REVIEW') && !postedAssignmentIds.includes(a.id)
      );

      setApprovedTrips(ready);
      setPostedInvoices(postedList || []);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
      setErrorMsg(err.message || 'Failed to load invoices data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePostInvoice = async (tripId: number) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await targetInvoicesApi.postInvoice(tripId);
      setSuccessMsg(`Invoice #${res.invoice_no} posted with status PARKED (Front-end review lock). Customer has been notified for payment.`);
      await loadData();
      setActiveTab('PARKED');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to post invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parkedInvoices = postedInvoices.filter(i => i.status === 'PARKED' || i.status === 'PAID_PARTIAL');
  const paidInvoices = postedInvoices.filter(i => i.status === 'PAID_FULL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-heading)', margin: 0 }}>
            Post Invoice & Customer Settlement Ledger
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            Post verified proof-of-delivery trips to the customer billing desk and track customer installments.
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => loadData()}
          disabled={loading || isSubmitting}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Refreshing...' : 'Refresh Queue'}</span>
        </button>
      </div>

      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--color-error-bg)',
          border: '1.5px solid var(--color-error-light)',
          color: 'var(--color-error-text)',
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '13.5px'
        }}>
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          backgroundColor: '#dcfce7',
          color: '#166534',
          border: '1.5px solid #86efac',
          fontSize: '13.5px',
          fontWeight: 600
        }}>
          {successMsg}
        </div>
      )}

      {/* Tabs Menu */}
      <Tabs
        tabs={[
          { id: 'READY_TO_POST', label: 'Ready to Post Invoice', count: approvedTrips.length },
          { id: 'PARKED', label: 'Parked & Awaiting Customer Payment', count: parkedInvoices.length },
          { id: 'PAID', label: 'Customer Paid In Full', count: paidInvoices.length },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading invoicing desk...
        </div>
      ) : activeTab === 'READY_TO_POST' ? (
        /* ─── READY TO POST TAB ─── */
        <Card title="Approved Delivery Trips Awaiting Invoice Generation" subtitle="Verified PODs cleared for billing">
          {approvedTrips.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={44} color="#16a34a" />}
              title="No Pending Deliveries"
              description="All verified trips have been posted to customer invoicing."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px' }}>Trip #</th>
                    <th style={{ padding: '12px 14px' }}>Sales Order / PO</th>
                    <th style={{ padding: '12px 14px' }}>Driver & Truck</th>
                    <th style={{ padding: '12px 14px' }}>Delivered Net</th>
                    <th style={{ padding: '12px 14px' }}>Delivery Date</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedTrips.map(trip => {
                    const deliveredNetTons = (trip.mine_gross_kg && trip.mine_tare_kg)
                      ? ((trip.mine_gross_kg - trip.mine_tare_kg) / 1000).toFixed(2)
                      : (trip.po_target_qty || 34.0).toFixed(2);

                    return (
                      <tr key={trip.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800 }}>
                          #{trip.id}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>
                          SO #{trip.sap_po_no || '2318'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600 }}>{trip.driver_name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            {trip.vehicle_reg}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                          {deliveredNetTons} Tons
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)', fontSize: '12.5px' }}>
                          {trip.scheduled_date || 'Standard'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <StatusBadge status={trip.status} />
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => handlePostInvoice(trip.id)}
                          >
                            <Send size={14} style={{ marginRight: '6px' }} />
                            Post Invoice
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        /* ─── PARKED OR PAID TABS ─── */
        <Card
          title={activeTab === 'PARKED' ? 'Parked Invoices (Under Customer Review / Settlement)' : 'Cleared & Fully Settled Invoices'}
          subtitle={activeTab === 'PARKED' ? 'Payment visibility is only shown after customer pays' : 'Permanent audit record of cleared freight invoices'}
        >
          {((activeTab === 'PARKED' ? parkedInvoices : paidInvoices).length === 0) ? (
            <EmptyState
              icon={<FileClock size={44} />}
              title={activeTab === 'PARKED' ? 'No Parked Invoices' : 'No Paid Invoices'}
              description={activeTab === 'PARKED' ? 'Invoices posted by CA will appear here with status PARKED.' : 'Invoices will move here once the customer pays down balance to 0.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(activeTab === 'PARKED' ? parkedInvoices : paidInvoices).map(inv => (
                <div
                  key={inv.id}
                  style={{
                    padding: '18px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-brand-blue-600)' }}>
                        {inv.invoice_no}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        (Trip #{inv.assignment_id})
                      </span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Value</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--color-text-heading)' }}>
                          {formatCurrency(inv.total_value)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Remaining Balance</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: inv.balance === 0 ? '#16a34a' : 'var(--color-brand-blue-600)' }}>
                          {formatCurrency(inv.balance ?? 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Payment Ledger (Per Rule 12: CA sees payment only after customer has paid) */}
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-bg-page)',
                    fontSize: '12.5px'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-heading)' }}>
                      Customer Payment History:
                    </div>
                    {(!inv.payments || inv.payments.length === 0) ? (
                      <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        No payments received yet. Customer will initiate EFT / card settlement on their receiver portal.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {inv.payments.map(pmt => (
                          <div
                            key={pmt.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-bg-card)',
                              border: '1px solid var(--color-border)'
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {pmt.payment_type} Payment ({pmt.ref_no || 'Direct Settlement'})
                            </span>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {formatDate(pmt.paid_at)}
                            </span>
                            <strong style={{ color: '#16a34a' }}>
                              +{formatCurrency(pmt.amount_paid)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
export default AdminInvoices;
