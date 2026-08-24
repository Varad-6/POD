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
      // Fetch ledgerList
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
    .filter((inv) => inv.status === 'CLEARED' || inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <PageHeader 
        title="Transporter Invoices & Payments"
        subtitle="Create tax invoices for approved deliveries and track payments"
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-50)' }}>Loading invoices...</div>
      ) : (
        <Card title="Transporter Accounts Ledger">
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
                      <td className="mono" style={{ fontWeight: 800, color: 'var(--neutral-900)' }}>
                        {inv.invoice_no || 'INV-PENDING'}
                      </td>
                      <td className="mono" style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>#{inv.waybill_no || `WB-${inv.assignment_id}`}</td>
                      <td>{formatDate(new Date())}</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px' }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td>
                        {inv.posted_date ? formatDate(inv.posted_date) : <span style={{ color: 'var(--neutral-400)' }}>—</span>}
                      </td>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--success-600)' }}>
                        {inv.payment_ref || <span style={{ color: 'var(--neutral-400)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                  
                  <tr style={{ background: 'var(--neutral-100)', fontWeight: 800 }}>
                    <td colSpan={3} style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', color: 'var(--neutral-600)' }}>
                      Total Payments Received & Cleared
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--success-600)', fontSize: '16px', fontWeight: 800 }}>
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
