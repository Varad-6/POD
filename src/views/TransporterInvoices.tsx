import React, { useState } from 'react';
import { Receipt, FileText, Upload, Plus, DollarSign } from 'lucide-react';
import { useDemo, Invoice } from '../context/DemoContext';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { FileUploadBox } from '../components/FileUploadBox';
import { formatCurrency, formatDate } from '../utils/format';

export const TransporterInvoices: React.FC = () => {
  const { invoices, purchaseOrders, submitInvoice } = useDemo();
  const [activeTab, setActiveTab] = useState<'CREATE' | 'LEDGER'>('CREATE');

  // Input states for invoice creation
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOcrExtracting, setIsOcrExtracting] = useState(false);

  const handleFileSelect = (name: string) => {
    setFileName(name);
    if (selectedInvoice) {
      setIsOcrExtracting(true);
      setTimeout(() => {
        let extractedNum = `INV-2026-0${selectedInvoice.waybillNo.substring(selectedInvoice.waybillNo.length - 3)}`;
        if (selectedInvoice.waybillNo === "WB-998821") {
          extractedNum = "INV-2026-0092";
        } else if (selectedInvoice.waybillNo === "WB-998830") {
          extractedNum = "INV-2026-0030";
        }
        setInvoiceNumber(extractedNum);
        setIsOcrExtracting(false);
      }, 800);
    }
  };

  // Split invoices
  const createList = invoices.filter((inv) => inv.status === 'AWAITING_INVOICE_SUBMISSION');
  const ledgerList = invoices.filter((inv) => inv.status !== 'AWAITING_INVOICE_SUBMISSION');

  // Calculate sum of Paid invoices
  const totalPaidSum = ledgerList
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const getAssociatedPORate = (waybillNo: string) => {
    // Locate invoice, find waybill offload, find PO
    const associatedInvoice = invoices.find((inv) => inv.waybillNo === waybillNo);
    return associatedInvoice?.rate || 245.50;
  };

  const handleInvoiceSelect = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setInvoiceNumber('');
    setFileName(null);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !invoiceNumber || !fileName) return;

    setIsSubmitting(true);
    await submitInvoice(selectedInvoice.waybillNo, invoiceNumber, fileName);
    setIsSubmitting(false);

    // Cleanup
    setSelectedInvoice(null);
    setInvoiceNumber('');
    setFileName(null);
    setActiveTab('LEDGER'); // Automatically switch to ledger
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
        <button onClick={() => { setActiveTab('CREATE'); setSelectedInvoice(null); }} style={tabStyle(activeTab === 'CREATE')}>
          Create Invoice
        </button>
        <button onClick={() => { setActiveTab('LEDGER'); setSelectedInvoice(null); }} style={tabStyle(activeTab === 'LEDGER')}>
          Payment Ledger
        </button>
      </div>

      {activeTab === 'CREATE' && (
        <div>
          {!selectedInvoice ? (
            /* Choose delivery to invoice */
            createList.length === 0 ? (
              <EmptyState 
                message="No deliveries ready for invoicing" 
                submessage="Invoicing is unlocked once the mine manager approves your uploaded PODs."
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                {createList.map((inv) => (
                  <Card key={inv.waybillNo} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)' }}>
                          Waybill #{inv.waybillNo}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)' }}>
                          Volume Approved
                        </p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>

                    {/* Cost Box */}
                    <div 
                      style={{ 
                        backgroundColor: 'var(--secondary-bg)', 
                        padding: '16px', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(31, 78, 121, 0.1)',
                        marginBottom: '20px',
                        textAlign: 'center'
                      }}
                    >
                      <p style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Calculated Freight Value
                      </p>
                      <p style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-color)' }}>
                        {formatCurrency(inv.amount)}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', marginTop: '2px' }}>
                        Formula: {inv.quantity.toFixed(2)} Tons × {formatCurrency(inv.rate)} / Ton
                      </p>
                    </div>

                    <button 
                      onClick={() => handleInvoiceSelect(inv)}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: 'auto' }}
                    >
                      <Plus size={16} />
                      Raise Invoice Bill
                    </button>
                  </Card>
                ))}
              </div>
            )
          ) : (
            /* Raising bill form screen */
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <Card title={`Raise Invoice — Waybill ${selectedInvoice.waybillNo}`}>
                {/* Guide Banner */}
                <div 
                  style={{ 
                    padding: '12px 16px', 
                    backgroundColor: 'var(--info-bg)', 
                    color: 'var(--info-text)', 
                    borderRadius: '8px', 
                    fontSize: '12.5px', 
                    fontWeight: 500, 
                    marginBottom: '20px',
                    border: '1px solid rgba(21, 101, 192, 0.15)',
                    lineHeight: 1.45
                  }}
                >
                  <strong>💡 Demo Guidance:</strong> In this step, the transporter submits their formal tax bill to request payment. Enter an invoice number and upload the document <strong><code>tax-bill-sample.pdf</code></strong> from your files to simulate the SAP MIRO parked invoice process.
                </div>
                <form onSubmit={handleInvoiceSubmit}>
                  {/* Freight details summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--page-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-grey)', marginBottom: '24px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)' }}>DELIVERED QUANTITY</p>
                      <p style={{ fontWeight: 600 }}>{selectedInvoice.quantity.toFixed(2)} Tons</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)' }}>AGREED RATE</p>
                      <p style={{ fontWeight: 600 }}>{formatCurrency(selectedInvoice.rate)} / Ton</p>
                    </div>
                    <div style={{ gridColumn: 'span 2', height: '1px', backgroundColor: 'var(--border-grey)' }}></div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)' }}>TOTAL INVOICE AMOUNT</p>
                      <p style={{ fontWeight: 800, fontSize: '20px', color: 'var(--primary-color)' }}>
                        {formatCurrency(selectedInvoice.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ margin: 0 }}>TAX INVOICE NUMBER</label>
                      {isOcrExtracting && (
                        <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span className="animate-spin" style={{ display: 'inline-block', width: '10px', height: '10px', border: '1.5px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
                          Extracting from document...
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={isOcrExtracting ? "Reading document..." : invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-0092"
                      className="form-input"
                      disabled={isOcrExtracting}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label>UPLOAD INVOICE FILE (PDF/IMAGE)</label>
                    <FileUploadBox 
                      onFileSelect={handleFileSelect}
                      selectedFileName={fileName}
                      onClear={() => { setFileName(null); setInvoiceNumber(''); }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedInvoice(null)} 
                      disabled={isSubmitting}
                      className="btn btn-secondary"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={!invoiceNumber || !fileName || isSubmitting}
                      className="btn btn-primary"
                      style={{ minWidth: '150px' }}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Invoice'}
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'LEDGER' && (
        <Card title="Transporter Accounts Ledger">
          {ledgerList.length === 0 ? (
            <EmptyState 
              message="No invoice statements yet" 
              submessage="Submit an invoice in the 'Create Invoice' tab to populate this ledger."
            />
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Waybill Ref</th>
                    <th>Billing Date</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th>Posting Date</th>
                    <th>Payment Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerList.map((inv) => (
                    <tr key={inv.invoiceNo}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                        {inv.invoiceNo}
                      </td>
                      <td style={{ fontWeight: 500 }}>{inv.waybillNo}</td>
                      <td>{formatDate(new Date())}</td>
                      <td style={{ fontWeight: 700 }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td>
                        {inv.postingDate ? formatDate(inv.postingDate) : <span style={{ color: 'var(--neutral-secondary)' }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--success-text)' }}>
                        {inv.paymentRef || <span style={{ color: 'var(--neutral-secondary)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Totals Row */}
                  <tr className="total-row">
                    <td colSpan={3}>Total Payments Received</td>
                    <td colSpan={4} style={{ color: 'var(--success-text)', fontSize: '16px' }}>
                      {formatCurrency(totalPaidSum)}
                    </td>
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
