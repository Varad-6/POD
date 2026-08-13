import React, { useState } from 'react';
import { FileClock, CheckCircle, CreditCard, AlertCircle, Search, Filter, Server, ArrowRight } from 'lucide-react';
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

    return matchesSearch && matchesTransporter;
  });

  const parkedInvoices = filteredInvoices.filter((inv) => inv.status === 'PARKED');
  const postedInvoices = filteredInvoices.filter((inv) => inv.status === 'POSTED');
  const paidInvoices = filteredInvoices.filter((inv) => inv.status === 'PAID');

  const activeList = activeTab === 'PARKED' ? parkedInvoices : activeTab === 'POSTED' ? postedInvoices : paidInvoices;

  const handlePostClick = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowPostConfirm(true);
  };

  const handlePayClick = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentRefInput(`PMT-${Math.floor(10000 + Math.random() * 90000)}`);
    setShowPayConfirm(true);
  };

  const confirmPost = async () => {
    if (!selectedInvoice || !selectedInvoice.invoiceNo) return;
    setIsSubmitting(true);
    
    await postInvoice(selectedInvoice.invoiceNo);
    
    setIsSubmitting(false);
    setShowPostConfirm(false);
    setSelectedInvoice(null);
    setActiveTab('POSTED');
  };

  const confirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !selectedInvoice.invoiceNo || !paymentRefInput) return;
    setIsSubmitting(true);
    
    await payInvoice(selectedInvoice.invoiceNo, paymentRefInput);
    
    setIsSubmitting(false);
    setShowPayConfirm(false);
    setSelectedInvoice(null);
    setActiveTab('PAID');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header section */}
      <div className="page-header__row">
        <div>
          <h1 className="page-header__title">Invoice Control Desk (SAP MIRO)</h1>
          <p className="page-header__subtitle">
            Manage parked supplier invoices, post to SAP S/4HANA Finance (LIV), and log outgoing payment clearings.
          </p>
        </div>
        
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--neutral-100)', padding: '4px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
          <button 
            onClick={() => setActiveTab('PARKED')} 
            className={`btn btn-sm ${activeTab === 'PARKED' ? 'btn-dark' : 'btn-ghost'}`}
            style={{ borderRadius: '6px' }}
          >
            Parked MIRO ({invoices.filter(i => i.status === 'PARKED').length})
          </button>
          <button 
            onClick={() => setActiveTab('POSTED')} 
            className={`btn btn-sm ${activeTab === 'POSTED' ? 'btn-dark' : 'btn-ghost'}`}
            style={{ borderRadius: '6px' }}
          >
            Posted ({invoices.filter(i => i.status === 'POSTED').length})
          </button>
          <button 
            onClick={() => setActiveTab('PAID')} 
            className={`btn btn-sm ${activeTab === 'PAID' ? 'btn-dark' : 'btn-ghost'}`}
            style={{ borderRadius: '6px' }}
          >
            Cleared / Paid ({invoices.filter(i => i.status === 'PAID').length})
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--neutral-0)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--neutral-200)', flexWrap: 'wrap' }}>
        <div className="input-wrapper" style={{ flex: 1, minWidth: '240px' }}>
          <Search className="input-icon-left" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input has-icon-left" 
            placeholder="Filter by Invoice # or Waybill #..."
          />
        </div>

        <select 
          value={transporterFilter}
          onChange={(e) => setTransporterFilter(e.target.value)}
          className="form-input"
          style={{ width: '220px' }}
        >
          <option value="">All Transporters</option>
          <option value="Sipho Transport Services">Sipho Transport Services</option>
          <option value="VDM Transport">VDM Transport</option>
          <option value="CBS Logistics">CBS Logistics</option>
          <option value="ONYX Logistics">ONYX Logistics</option>
          <option value="MPL Transport">MPL Transport</option>
        </select>
      </div>

      {/* Invoices List Table */}
      <Card title={`${activeTab === 'PARKED' ? 'Parked Invoices (Awaiting SAP Verification)' : activeTab === 'POSTED' ? 'Posted Invoices (Awaiting Payment Clearing)' : 'Cleared Invoices (FI-AP Paid)'}`}>
        {activeList.length === 0 ? (
          <EmptyState 
            message="No invoices match active status & filter criteria" 
            submessage="New transporter tax invoices submitted against approved PODs will automatically appear here."
          />
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Waybill No</th>
                  <th>Transporter / PO</th>
                  <th className="numeric">Delivered Payload</th>
                  <th className="numeric">Rate (ZAR)</th>
                  <th className="numeric">Total Value (ZAR)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeList.map((inv) => {
                  const po = getPOForInvoice(inv);
                  const transporterName = po?.transporter || 'Sipho Transport';

                  return (
                    <tr key={inv.waybillNo}>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>
                        {inv.invoiceNo || 'DRAFT-INVOICE'}
                      </td>
                      <td className="mono" style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>
                        #{inv.waybillNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{transporterName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>PO: {po?.purchaseOrderNo || 'PO-41000001'}</div>
                      </td>
                      <td className="numeric mono" style={{ fontWeight: 600 }}>
                        {inv.quantity.toFixed(2)} TON
                      </td>
                      <td className="numeric mono" style={{ color: 'var(--neutral-500)' }}>
                        R {inv.rate.toFixed(2)}
                      </td>
                      <td className="numeric mono" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--neutral-900)' }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {inv.status === 'PARKED' && (
                          <button 
                            onClick={() => handlePostClick(inv)} 
                            className="btn btn-sm btn-primary"
                            style={{ padding: '5px 10px', fontSize: '11px' }}
                          >
                            Post (MIRO)
                          </button>
                        )}
                        {inv.status === 'POSTED' && (
                          <button 
                            onClick={() => handlePayClick(inv)} 
                            className="btn btn-sm btn-success"
                            style={{ padding: '5px 10px', fontSize: '11px' }}
                          >
                            Mark Paid
                          </button>
                        )}
                        {inv.status === 'PAID' && (
                          <span className="mono" style={{ fontSize: '11px', color: 'var(--success-600)', fontWeight: 700 }}>
                            {inv.paymentRef || 'CLEARED'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Post Modal */}
      <Modal
        isOpen={showPostConfirm}
        onClose={() => setShowPostConfirm(false)}
        title="Confirm SAP MIRO Invoice Posting"
        width="460px"
      >
        {selectedInvoice && (
          <div style={{ textAlign: 'center' }}>
            <FileClock size={40} style={{ color: 'var(--accent-blue)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '4px' }}>
              Post Invoice {selectedInvoice.invoiceNo} to SAP S/4HANA
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--neutral-500)', marginBottom: '20px' }}>
              Amount: <strong>{formatCurrency(selectedInvoice.amount)}</strong> | Quantity: <strong>{selectedInvoice.quantity.toFixed(2)} TON</strong>
            </p>
            <p style={{ fontSize: '12px', color: 'var(--neutral-500)', background: 'var(--neutral-50)', padding: '10px', borderRadius: '8px', marginBottom: '24px', textAlign: 'left' }}>
              ℹ This action simulates SAP MIRO clearing, releasing the parked document into SAP FI-AP Accounts Payable for payment processing.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setShowPostConfirm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={confirmPost} 
                disabled={isSubmitting} 
                className="btn btn-primary"
              >
                {isSubmitting ? 'Posting...' : 'Confirm SAP MIRO Post'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pay Modal */}
      <Modal
        isOpen={showPayConfirm}
        onClose={() => setShowPayConfirm(false)}
        title="Log Payment Clearing (FI-AP)"
        width="460px"
      >
        {selectedInvoice && (
          <form onSubmit={confirmPay}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <CreditCard size={40} style={{ color: 'var(--success-600)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                Mark Invoice {selectedInvoice.invoiceNo} as PAID
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--neutral-500)', marginTop: '4px' }}>
                Clearing Amount: <strong>{formatCurrency(selectedInvoice.amount)}</strong>
              </p>
            </div>

            <div className="form-group">
              <label>SAP PAYMENT CLEARING REFERENCE</label>
              <input 
                type="text" 
                value={paymentRefInput}
                onChange={(e) => setPaymentRefInput(e.target.value)}
                className="form-input mono"
                placeholder="e.g. PMT-90024"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" onClick={() => setShowPayConfirm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!paymentRefInput || isSubmitting} 
                className="btn btn-success"
              >
                {isSubmitting ? 'Clearing...' : 'Confirm Paid Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};
