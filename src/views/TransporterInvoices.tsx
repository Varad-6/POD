import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';

export const TransporterInvoices: React.FC = () => {
  const [ledgerList, setLedgerList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const resLedger = await fetch('http://localhost:3001/api/v3/delivery-invoices?status=LEDGER', {
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
        <Card title="Transporter Accounts Ledger" subtitle="Immutable log of cleared freight statements directly synced from SAP Finance">
          {ledgerList.length === 0 ? (
            <EmptyState 
              message="No invoice statements yet" 
              submessage="Invoices will be visible here once raised from the Proof of Delivery desk."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Waybill Ref</th>
                    <th>Billing Date</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th>Status</th>
                    <th>Posting Date</th>
                    <th>Payment Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerList.map((inv) => (
                    <tr key={inv.id}>
                      <td className="mono" style={{ fontWeight: 800, color: 'var(--color-text-heading)' }}>
                        {inv.invoice_no || 'INV-PENDING'}
                      </td>
                      <td className="mono" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>#{inv.waybill_no || `WB-${inv.assignment_id}`}</td>
                      <td>{formatDate(new Date())}</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 800, fontSize: '14.5px', color: 'var(--color-text-heading)' }}>
                        <div>{formatCurrency(inv.amount)}</div>
                        {(inv.paid_amount || 0) > 0 && inv.status !== 'CLEARED' && (
                          <div style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, marginTop: '3px' }}>
                            Paid: {formatCurrency(inv.paid_amount)} ({Math.round((inv.paid_amount / inv.amount) * 100)}%)
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} />
                        {inv.status === 'POSTED' && (inv.paid_amount || 0) > 0 && (
                          <div style={{ fontSize: '10px', color: '#D97706', fontWeight: 700, marginTop: '3px', textTransform: 'uppercase' }}>
                            Partially Paid
                          </div>
                        )}
                      </td>
                      <td>
                        {inv.posted_date ? formatDate(inv.posted_date) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>
                        {inv.payment_ref || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                  
                  <tr style={{ background: 'var(--color-brand-blue-50)', fontWeight: 800 }}>
                    <td colSpan={3} style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', color: 'var(--color-brand-blue-700)' }}>
                      Total Payments Received & Cleared
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--color-success-text)', fontSize: '16px', fontWeight: 850 }}>
                      {formatCurrency(totalPaidSum)}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
