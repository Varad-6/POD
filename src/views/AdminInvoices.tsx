import React, { useState } from 'react';
import { FileClock, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { useDemo, Invoice } from '../context/DemoContext';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/format';

export const AdminInvoices: React.FC = () => {
  const { invoices, postInvoice, payInvoice } = useDemo();
  const [activeTab, setActiveTab] = useState<'PARKED' | 'POSTED' | 'PAID'>('PARKED');

  // Modal control states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPostConfirm, setShowPostConfirm] = useState(false);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters invoices
  const parkedInvoices = invoices.filter((inv) => inv.status === 'PARKED');
  const postedInvoices = invoices.filter((inv) => inv.status === 'POSTED');
  const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');

  const handlePostClick = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowPostConfirm(true);
  };

  const handlePayClick = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentRefInput('');
    setShowPayConfirm(true);
  };

  const confirmPost = async () => {
    if (!selectedInvoice || !selectedInvoice.invoiceNo) return;
    setIsSubmitting(true);
    
    await postInvoice(selectedInvoice.invoiceNo);
    
    setIsSubmitting(false);
    setShowPostConfirm(false);
    setSelectedInvoice(null);
    setActiveTab('POSTED'); // Switch to Posted tab
  };

  const confirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !selectedInvoice.invoiceNo || !paymentRefInput) return;
    setIsSubmitting(true);
    
    await payInvoice(selectedInvoice.invoiceNo, paymentRefInput);
    
    setIsSubmitting(false);
    setShowPayConfirm(false);
    setSelectedInvoice(null);
    setActiveTab('PAID'); // Switch to Paid tab
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: active ? '#ffffff' : 'transparent',
    color: active ? 'var(--primary-color)' : 'var(--neutral-secondary)',
    border: 'none',
    borderBottom: active ? '2px solid var(--primary-color)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Tab Select Header */}
      <div 
        style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-grey)', 
          marginBottom: '24px',
          gap: '16px' 
        }}
      >
        <button onClick={() => setActiveTab('PARKED')} style={tabStyle(activeTab === 'PARKED')}>
          Parked ({parkedInvoices.length})
        </button>
        <button onClick={() => setActiveTab('POSTED')} style={tabStyle(activeTab === 'POSTED')}>
          Posted ({postedInvoices.length})
        </button>
        <button onClick={() => setActiveTab('PAID')} style={tabStyle(activeTab === 'PAID')}>
          Paid ({paidInvoices.length})
        </button>
      </div>

      {/* Render tables per tab */}
      {activeTab === 'PARKED' && (
        <Card title="Parked MIRO Invoices (SAP Stage)">
          {parkedInvoices.length === 0 ? (
            <EmptyState 
              message="No parked invoices" 
              submessage="Transporters will submit invoices once their delivery notes are approved."
            />
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Waybill Ref</th>
                    <th>Billing Quantity</th>
                    <th>Invoice Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parkedInvoices.map((inv) => (
                    <tr key={inv.invoiceNo}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{inv.invoiceNo}</td>
                      <td>{inv.waybillNo}</td>
                      <td>{inv.quantity.toFixed(2)} Tons</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(inv.amount)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handlePostClick(inv)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Post Invoice (MIRO)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'POSTED' && (
        <Card title="Posted Supplier Invoices (Approved for Payment)">
          {postedInvoices.length === 0 ? (
            <EmptyState 
              message="No posted invoices awaiting payment" 
              submessage="Post parked invoices to approve them for payment releases."
            />
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Waybill Ref</th>
                    <th>Posting Date</th>
                    <th>Invoice Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {postedInvoices.map((inv) => (
                    <tr key={inv.invoiceNo}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{inv.invoiceNo}</td>
                      <td>{inv.waybillNo}</td>
                      <td>{formatDate(inv.postingDate)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(inv.amount)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handlePayClick(inv)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--success-text)', borderColor: 'var(--success-text)' }}
                        >
                          Mark as Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'PAID' && (
        <Card title="Completed Paid Invoices (Historical Archive)">
          {paidInvoices.length === 0 ? (
            <EmptyState 
              message="No paid invoices yet" 
              submessage="Process payments for posted invoices to archive them here."
            />
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Waybill Ref</th>
                    <th>Posting Date</th>
                    <th>Invoice Amount</th>
                    <th>Status</th>
                    <th>Payment Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {paidInvoices.map((inv) => (
                    <tr key={inv.invoiceNo}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{inv.invoiceNo}</td>
                      <td>{inv.waybillNo}</td>
                      <td>{formatDate(inv.postingDate)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(inv.amount)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td style={{ fontWeight: 600, color: 'var(--success-text)' }}>{inv.paymentRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Post Confirm Modal */}
      <Modal
        isOpen={showPostConfirm}
        onClose={() => setShowPostConfirm(false)}
        title="Post Invoice (SAP S/4HANA Simulation)"
        width="450px"
      >
        <div style={{ textAlign: 'center' }}>
          <FileClock size={36} style={{ color: 'var(--primary-color)', marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-primary)', marginBottom: '12px' }}>
            Simulate Invoice Posting in SAP
          </p>
          <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            This action will simulate the standard creditor accountant check. It posts the parked MIRO document {selectedInvoice?.invoiceNo} as a confirmed posted invoice, making it eligible for bank payment dispatch.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowPostConfirm(false)} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={confirmPost}
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Posting...' : 'Confirm & Post'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Pay Confirm Modal */}
      <Modal
        isOpen={showPayConfirm}
        onClose={() => setShowPayConfirm(false)}
        title="Confirm Payment Dispatch"
        width="460px"
      >
        {selectedInvoice && (
          <form onSubmit={confirmPay}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <CreditCard size={36} style={{ color: 'var(--success-text)', marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-primary)', marginBottom: '6px' }}>
                Dispatch Bank Clearing
              </p>
              <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', lineHeight: 1.4 }}>
                Please provide the bank payment clearing reference number to transition invoice **{selectedInvoice.invoiceNo}** to paid status.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>PAYMENT CLEARING REFERENCE</label>
              <input 
                type="text" 
                value={paymentRefInput}
                onChange={(e) => setPaymentRefInput(e.target.value)}
                placeholder="e.g. PMT-88214"
                className="form-input"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => setShowPayConfirm(false)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!paymentRefInput || isSubmitting}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--success-text)', borderColor: 'var(--success-text)' }}
              >
                {isSubmitting ? 'Clearing...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
