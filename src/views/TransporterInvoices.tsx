import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Table, Column } from '../components/Table';
import { formatCurrency, formatDate } from '../utils/format';
import { API_BASE } from '../lib/api_v3';

export const TransporterInvoices: React.FC = () => {
  const [ledgerList, setLedgerList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const resLedger = await fetch(`${API_BASE}/delivery-invoices?status=LEDGER`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('podzo_token_v3')}` }
      });
      const dataLedger = await resLedger.json();
      setLedgerList(dataLedger);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const totalPaidSum = ledgerList
    .reduce((sum, inv) => sum + (inv.paid_amount || (inv.status === 'CLEARED' ? inv.amount : 0)), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <PageHeader 
        title="Transporter Invoices & Payments"
        subtitle="Create tax invoices for approved deliveries and track payments"
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading invoices...</div>
      ) : (
        <Card title="Transporter Accounts Ledger" subtitle="Immutable log of cleared freight statements directly synced from SAP Finance" style={{ padding: 0 }}>
          {ledgerList.length === 0 ? (
            <div style={{ padding: '24px' }}>
              <EmptyState 
                title="No invoice statements yet" 
                description="Invoices will be visible here once raised from the Proof of Delivery desk."
              />
            </div>
          ) : (
            <>
              <Table<any>
                data={ledgerList}
                renderMobileCard={(inv) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{ fontWeight: 800, color: 'var(--color-text-heading)' }}>{inv.invoice_no || 'INV-PENDING'}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span className="mono" style={{ color: 'var(--color-text-muted)' }}>#{inv.waybill_no || `WB-${inv.assignment_id}`}</span>
                      <span className="mono" style={{ fontWeight: 800, color: 'var(--color-text-heading)' }}>{formatCurrency(inv.amount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      <span>Billing: {formatDate(new Date())}</span>
                      {inv.posted_date && <span>Posted: {formatDate(inv.posted_date)}</span>}
                    </div>
                    {inv.payment_ref && (
                      <div style={{ fontSize: '11px', color: 'var(--color-brand-blue-600)', fontWeight: 700 }}>
                        Payment Ref: {inv.payment_ref}
                      </div>
                    )}
                  </div>
                )}
                columns={[
                  {
                    header: 'Invoice No',
                    render: (inv) => <span className="mono" style={{ fontWeight: 800, color: 'var(--color-text-heading)' }}>{inv.invoice_no || 'INV-PENDING'}</span>
                  },
                  {
                    header: 'Waybill Ref',
                    render: (inv) => <span className="mono" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>#{inv.waybill_no || `WB-${inv.assignment_id}`}</span>
                  },
                  {
                    header: 'Billing Date',
                    render: () => formatDate(new Date())
                  },
                  {
                    header: 'Total Amount',
                    align: 'right',
                    render: (inv) => (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span className="mono" style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--color-text-heading)' }}>{formatCurrency(inv.amount)}</span>
                        {(inv.paid_amount || 0) > 0 && inv.status !== 'CLEARED' && (
                          <div style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, marginTop: '3px' }}>
                            Paid: {formatCurrency(inv.paid_amount)} ({Math.round((inv.paid_amount / inv.amount) * 100)}%)
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    header: 'Status',
                    render: (inv) => (
                      <>
                        <StatusBadge status={inv.status} />
                        {inv.status === 'POSTED' && (inv.paid_amount || 0) > 0 && (
                          <div style={{ fontSize: '10px', color: '#D97706', fontWeight: 700, marginTop: '3px', textTransform: 'uppercase' }}>
                            Partially Paid
                          </div>
                        )}
                      </>
                    )
                  },
                  {
                    header: 'Posting Date',
                    render: (inv) => inv.posted_date ? formatDate(inv.posted_date) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                  },
                  {
                    header: 'Payment Ref',
                    render: (inv) => inv.payment_ref ? <span className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{inv.payment_ref}</span> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                  }
                ]}
              />
              <div style={{ padding: '16px 20px', borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-brand-blue-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '11.5px', color: 'var(--color-brand-blue-700)' }}>Total Payments Received & Cleared</span>
                <span className="mono" style={{ color: 'var(--color-success-text)', fontSize: '16px', fontWeight: 850 }}>{formatCurrency(totalPaidSum)}</span>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};
