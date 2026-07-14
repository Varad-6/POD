import React, { useState } from 'react';
import { FileClock, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { useDemo, Invoice } from '../context/DemoContext';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/format';

export const AdminInvoices: React.FC = () => {
  const { invoices, postInvoice, payInvoice, offloadRecords, purchaseOrders } = useDemo();
  const [activeTab, setActiveTab] = useState<'PARKED' | 'POSTED' | 'PAID'>('PARKED');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [transporterFilter, setTransporterFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal control states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPostConfirm, setShowPostConfirm] = useState(false);
  const [showPayConfirm, setShowPayConfirm] = useState(false);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to find PO details for an invoice
  const getPOForInvoice = (inv: Invoice) => {
    const record = offloadRecords.find((r) => r.waybillNo === inv.waybillNo);
    if (!record) return null;
    return purchaseOrders.find((po) => po.purchaseOrderNo === record.poRef);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const po = getPOForInvoice(inv);
    
    const matchesSearch = 
      !searchQuery ||
      (inv.invoiceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.waybillNo || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTransporter = 
      !transporterFilter || 
      po?.transporter === transporterFilter;
      
    const matchesContract = 
      !contractFilter || 
      po?.contractRef === contractFilter;
      
    const matchesDate = 
      !dateFilter ||
      (dateFilter === 'EARLY_JULY' && po && po.poDate <= '2026-07-05') ||
      (dateFilter === 'MID_JULY' && po && po.poDate > '2026-07-05' && po.poDate <= '2026-07-10') ||
      (dateFilter === 'LATE_JULY' && po && po.poDate > '2026-07-10');

    return matchesSearch && matchesTransporter && matchesContract && matchesDate;
  });

  const parkedInvoices = filteredInvoices.filter((inv) => inv.status === 'PARKED');
  const postedInvoices = filteredInvoices.filter((inv) => inv.status === 'POSTED');
  const paidInvoices = filteredInvoices.filter((inv) => inv.status === 'PAID');

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

      {/* Invoice Filter Bar */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          backgroundColor: '#fafafa',
          border: '1px solid var(--border-grey)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--neutral-secondary)', marginBottom: '6px' }}>SEARCH INVOICE / WAYBILL</label>
          <input 
            type="text"
            placeholder="Search number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--neutral-secondary)', marginBottom: '6px' }}>TRANSPORTER FILTER</label>
          <select
            value={transporterFilter}
            onChange={(e) => setTransporterFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '13px', backgroundColor: '#ffffff', outline: 'none' }}
          >
            <option value="">All Transporters</option>
            <option value="Sipho Transport Services">Sipho Transport</option>
            <option value="CBS Logistics">CBS Logistics</option>
            <option value="MPL Transport">MPL Transport</option>
            <option value="Reckless Transport">Reckless Transport</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--neutral-secondary)', marginBottom: '6px' }}>CONTRACT FILTER</label>
          <select
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '13px', backgroundColor: '#ffffff', outline: 'none' }}
          >
            <option value="">All Contracts</option>
            <option value="40000014">Contract #40000014</option>
            <option value="40000015">Contract #40000015</option>
            <option value="40000016">Contract #40000016</option>
            <option value="40000017">Contract #40000017</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--neutral-secondary)', marginBottom: '6px' }}>PO DATE RANGE</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '13px', backgroundColor: '#ffffff', outline: 'none' }}
          >
            <option value="">All Dates</option>
            <option value="EARLY_JULY">Early July (Jul 1 - Jul 5)</option>
            <option value="MID_JULY">Mid July (Jul 6 - Jul 10)</option>
            <option value="LATE_JULY">Late July (Jul 11+)</option>
          </select>
        </div>
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
