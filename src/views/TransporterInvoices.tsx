import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDemo, Invoice } from '../context/DemoContext';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Tabs } from '../components/Tabs';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { FileUploadBox } from '../components/FileUploadBox';
import { formatCurrency, formatDate } from '../utils/format';

export const TransporterInvoices: React.FC = () => {
  const { invoices, submitInvoice } = useDemo();
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

  const totalPaidSum = ledgerList
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

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

    setSelectedInvoice(null);
    setInvoiceNumber('');
    setFileName(null);
    setActiveTab('LEDGER');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <PageHeader 
        title="Carrier Invoicing & Payment Ledger"
        subtitle="Raise formal tax bills against approved proof-of-delivery receipts and track SAP payment clearings"
        actions={
          <Tabs 
            tabs={[
              { id: 'CREATE', label: 'Create Invoice', count: createList.length },
              { id: 'LEDGER', label: 'Payment Ledger', count: ledgerList.length },
            ]}
            activeTab={activeTab}
            onChange={(id) => { setActiveTab(id as any); setSelectedInvoice(null); }}
          />
        }
      />

      {activeTab === 'CREATE' && (
        <div>
          {!selectedInvoice ? (
            createList.length === 0 ? (
              <EmptyState 
                message="No deliveries ready for invoicing" 
                submessage="Invoicing unlocks automatically once mine supervisors approve your submitted PODs."
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                {createList.map((inv) => (
                  <Card key={inv.waybillNo} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neutral-900)' }}>
                          #{inv.waybillNo}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>
                          Approved Net Freight Payload
                        </p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>

                    <div 
                      style={{ 
                        backgroundColor: 'var(--neutral-50)', 
                        padding: '16px', 
                        borderRadius: '10px', 
                        border: '1px solid var(--neutral-200)',
                        marginBottom: '20px',
                        textAlign: 'center'
                      }}
                    >
                      <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                        Calculated Freight Value
                      </p>
                      <p className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--neutral-900)' }}>
                        {formatCurrency(inv.amount)}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '2px' }}>
                        Formula: {inv.quantity.toFixed(2)} Tons × {formatCurrency(inv.rate)} / Ton
                      </p>
                    </div>

                    <button 
                      onClick={() => handleInvoiceSelect(inv)}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: 'auto' }}
                    >
                      <Plus size={16} />
                      Raise Tax Invoice Bill
                    </button>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
              <Card title={`Raise Invoice — Waybill #${selectedInvoice.waybillNo}`}>
                <form onSubmit={handleInvoiceSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--neutral-50)', padding: '16px', borderRadius: '10px', border: '1px solid var(--neutral-200)', marginBottom: '24px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>DELIVERED QUANTITY</p>
                      <p className="mono" style={{ fontWeight: 700 }}>{selectedInvoice.quantity.toFixed(2)} Tons</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>AGREED RATE</p>
                      <p className="mono" style={{ fontWeight: 700 }}>{formatCurrency(selectedInvoice.rate)} / Ton</p>
                    </div>
                    <div style={{ gridColumn: 'span 2', height: '1px', backgroundColor: 'var(--neutral-200)' }}></div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL INVOICE AMOUNT</p>
                      <p className="mono" style={{ fontWeight: 800, fontSize: '22px', color: 'var(--accent-blue)' }}>
                        {formatCurrency(selectedInvoice.amount)}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--neutral-600)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      TAX INVOICE NUMBER
                    </label>
                    <input 
                      type="text" 
                      value={isOcrExtracting ? "Reading document..." : invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-0092"
                      className="mono"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                      disabled={isOcrExtracting}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--neutral-600)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      UPLOAD TAX INVOICE FILE (PDF/IMAGE)
                    </label>
                    <FileUploadBox 
                      onFileSelect={handleFileSelect}
                      selectedFileName={fileName}
                      onClear={() => { setFileName(null); setInvoiceNumber(''); }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedInvoice(null)} 
                      disabled={isSubmitting}
                      className="btn btn-ghost"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={!invoiceNumber || !fileName || isSubmitting}
                      className="btn btn-primary"
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
                    <tr key={inv.invoiceNo}>
                      <td className="mono" style={{ fontWeight: 800, color: 'var(--neutral-900)' }}>
                        {inv.invoiceNo}
                      </td>
                      <td className="mono" style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>#{inv.waybillNo}</td>
                      <td>{formatDate(new Date())}</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px' }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td>
                        {inv.postingDate ? formatDate(inv.postingDate) : <span style={{ color: 'var(--neutral-400)' }}>—</span>}
                      </td>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--success-600)' }}>
                        {inv.paymentRef || <span style={{ color: 'var(--neutral-400)' }}>—</span>}
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
