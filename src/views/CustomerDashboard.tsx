import React, { useState } from 'react';
import { useDemo, OffloadRecord } from '../context/DemoContext';
import { Card } from '../components/Card';
import { Scale, CheckCircle2, ClipboardCheck, AlertOctagon, FileSpreadsheet, PlusCircle, ArrowDownCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/format';

export const CustomerDashboard: React.FC = () => {
  const { offloadRecords, customerLogWeights, purchaseOrders, submitInvoice, invoices } = useDemo();
  const [activeTab, setActiveTab] = useState<'RECEIVING' | 'BILLING'>('RECEIVING');
  const [selectedRecord, setSelectedRecord] = useState<OffloadRecord | null>(null);
  const [selectedBillingRecord, setSelectedBillingRecord] = useState<OffloadRecord | null>(null);

  // Form states (Weights)
  const [grossWeight, setGrossWeight] = useState('');
  const [tareWeight, setTareWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states (Invoice)
  const [invoiceNo, setInvoiceNo] = useState('');
  const [fileName, setFileName] = useState('');

  // Filter records
  // 1. Pending arrival: EN_ROUTE
  const incomingRecords = offloadRecords.filter((rec) => rec.podStatus === 'EN_ROUTE');
  // 2. Ready for billing: DELIVERED_STAMPED or POD_APPROVED
  const billingRecords = offloadRecords.filter((rec) => 
    (rec.podStatus === 'DELIVERED_STAMPED' || rec.podStatus === 'POD_APPROVED' || rec.podStatus === 'APPROVED_INVOICE_PENDING') &&
    !invoices.some((inv) => inv.waybillNo === rec.waybillNo && inv.status !== 'AWAITING_INVOICE_SUBMISSION')
  );

  const handleSelectRecord = (rec: OffloadRecord) => {
    setSelectedRecord(rec);
    setGrossWeight('');
    setTareWeight('');
  };

  const handleVerifyWeights = async (approve: boolean) => {
    if (!selectedRecord) return;
    const gross = parseFloat(grossWeight);
    const tare = parseFloat(tareWeight);

    if (isNaN(gross) || gross <= 0 || isNaN(tare) || tare <= 0 || gross <= tare) {
      alert('Please enter valid positive gross and tare weights where Gross exceeds Tare.');
      return;
    }

    setIsSubmitting(true);
    await customerLogWeights(selectedRecord.waybillNo, gross, tare, approve);
    setIsSubmitting(false);
    setSelectedRecord(null);
  };

  const handleCreateInvoice = async () => {
    if (!selectedBillingRecord || !invoiceNo) return;
    setIsSubmitting(true);
    
    // Auto-calculate file name
    const finalFile = fileName || `tax-invoice-${invoiceNo}.pdf`;
    await submitInvoice(selectedBillingRecord.waybillNo, invoiceNo, finalFile);
    
    setIsSubmitting(false);
    setSelectedBillingRecord(null);
    setInvoiceNo('');
    setFileName('');
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: active ? 'var(--primary-color)' : 'transparent',
    color: active ? '#ffffff' : 'var(--neutral-secondary)',
    border: '1px solid ' + (active ? 'var(--primary-color)' : 'var(--border-grey)'),
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginRight: '8px'
  });

  return (
    <div>
      {/* Tab Selectors */}
      <div style={{ display: 'flex', marginBottom: '24px' }}>
        <button onClick={() => setActiveTab('RECEIVING')} style={tabStyle(activeTab === 'RECEIVING')}>
          📥 Receiving Yard Gate
        </button>
        <button onClick={() => setActiveTab('BILLING')} style={tabStyle(activeTab === 'BILLING')}>
          🧾 Site Billing & Invoices
        </button>
      </div>

      {activeTab === 'RECEIVING' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
          {/* Left: Incoming Queue */}
          <div>
            <Card title="Incoming Shipments Awaiting Offload Weight Check">
              {incomingRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--neutral-secondary)' }}>
                  <ArrowDownCircle size={48} style={{ color: 'var(--neutral-secondary)', marginBottom: '12px', strokeWidth: 1.5 }} />
                  <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>No trucks en route</p>
                  <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>All siding dispatches have been loaded and weighed.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {incomingRecords.map((rec) => {
                    const po = purchaseOrders.find((p) => p.purchaseOrderNo === rec.poRef);
                    return (
                      <div 
                        key={rec.waybillNo}
                        style={{
                          border: '1px solid var(--border-grey)',
                          borderRadius: '8px',
                          padding: '16px',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSelectRecord(rec)}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '15px' }}>
                              Waybill #{rec.waybillNo}
                            </span>
                            <span style={{ fontSize: '11px', color: '#1d4ed8', backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              IN TRANSIT
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', fontWeight: 500, margin: '2px 0' }}>
                            Driver: <strong>{rec.driverName}</strong> | Vehicle: <strong>{rec.horseRegNo}</strong>
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>
                            Siding Dispatch Net Weight: <strong>{(rec.netWeightKg / 1000).toFixed(2)} Tons</strong>
                          </p>
                        </div>
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={(e) => { e.stopPropagation(); handleSelectRecord(rec); }}
                        >
                          Check Weights
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Weighbridge Entry card */}
            {selectedRecord && (
              <Card 
                title={`Customer Siding Offload Check — Waybill #${selectedRecord.waybillNo}`}
                style={{ border: '2px solid var(--primary-color)', marginTop: '24px', animation: 'fadeIn 0.2s' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Arrival Loaded Weight (Gross in kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 71600"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Post-Unload Empty Weight (Tare in kg)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 22800"
                      value={tareWeight}
                      onChange={(e) => setTareWeight(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                </div>

                {grossWeight && tareWeight && parseFloat(grossWeight) > parseFloat(tareWeight) && (
                  (() => {
                    const gross = parseFloat(grossWeight);
                    const tare = parseFloat(tareWeight);
                    if (isNaN(gross) || isNaN(tare) || gross <= tare) return null;
                    
                    const receivedNet = (gross - tare) / 1000;
                    const mineNet = selectedRecord.netWeightKg / 1000;
                    const variance = receivedNet - mineNet;
                    const absVariance = Math.abs(variance);
                    const isMatched = absVariance < 0.05; // within 50 kg variance counts as a match

                    return (
                      <>
                        {/* Real-time Match Status Flag Alert */}
                        <div 
                          style={{ 
                            padding: '12px 16px', 
                            borderRadius: '6px', 
                            marginBottom: '20px', 
                            backgroundColor: isMatched ? 'var(--success-bg)' : 'var(--warning-bg)', 
                            color: isMatched ? 'var(--success-text)' : 'var(--warning-text)', 
                            border: '1px solid ' + (isMatched ? 'var(--success-text)' : 'var(--warning-text)'),
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>{isMatched ? '✓' : '⚠'}</span>
                          <span>
                            {isMatched 
                              ? "WEIGHTS MATCH: Received payload perfectly matches Mine Siding weight (0.00 Tons difference)." 
                              : `WEIGHT MISMATCH DETECTED: Variance of ${absVariance.toFixed(2)} Tons compared to Mine Siding.`}
                          </span>
                        </div>

                        <div 
                          style={{ 
                            backgroundColor: '#f8fafc', 
                            border: '1px solid var(--border-grey)', 
                            borderRadius: '6px', 
                            padding: '16px', 
                            marginBottom: '24px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px'
                          }}
                        >
                          <div>
                            <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Received Net Payload</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
                              {receivedNet.toFixed(2)} Tons
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: '4px 0 0 0' }}>
                              Mine Siding Weight: {mineNet.toFixed(2)} Tons
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Transit Variance</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: isMatched ? 'var(--success-text)' : '#b45309', margin: 0 }}>
                              {variance.toFixed(2)} Tons
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => setSelectedRecord(null)}
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleVerifyWeights(false)}
                    className="btn btn-danger"
                    disabled={isSubmitting || !grossWeight || !tareWeight}
                    style={{ backgroundColor: 'var(--error-text)', color: '#ffffff', borderColor: 'var(--error-text)' }}
                  >
                    Flag Weight Mismatch
                  </button>
                  <button 
                    onClick={() => handleVerifyWeights(true)}
                    className="btn btn-primary"
                    disabled={isSubmitting || !grossWeight || !tareWeight}
                  >
                    {isSubmitting ? 'Verifying...' : 'Approve & Apply Stamp'}
                  </button>
                </div>
              </Card>
            )}
          </div>

          {/* Right: Stamp Simulation Preview */}
          <div>
            <Card title="Visual Proof of Delivery Stamp">
              <div 
                style={{ 
                  border: '2px dashed var(--border-grey)', 
                  borderRadius: '12px', 
                  padding: '30px', 
                  textAlign: 'center', 
                  backgroundColor: '#fafafa',
                  color: 'var(--neutral-secondary)'
                }}
              >
                <div 
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    border: '4px solid var(--success-text)',
                    color: 'var(--success-text)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    margin: '0 auto 16px auto',
                    transform: 'rotate(-10deg)',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ fontSize: '14px', letterSpacing: '1px' }}>IKWEZI</span>
                  <span>VERIFIED</span>
                  <span style={{ fontSize: '8px' }}>GATE-PASS</span>
                </div>
                <h4 style={{ fontWeight: 700, color: 'var(--neutral-primary)', fontSize: '15px', marginBottom: '6px' }}>Digital Gate Stamp</h4>
                <p style={{ fontSize: '13px', margin: 0 }}>
                  Approving weights applies this stamp to the delivery note, generating the audited POD record.
                </p>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Billing Tab */
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
          {/* Left: Approved Waybills */}
          <div>
            <Card title="Approved Deliveries Ready for Tax Billing">
              {billingRecords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--neutral-secondary)' }}>
                  <FileSpreadsheet size={48} style={{ color: 'var(--neutral-secondary)', marginBottom: '12px', strokeWidth: 1.5 }} />
                  <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>No billable deliveries available</p>
                  <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>All e-stamped cargo runs have already been invoiced.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {billingRecords.map((rec) => {
                    const po = purchaseOrders.find((p) => p.purchaseOrderNo === rec.poRef);
                    const rate = po?.rate || 245.50;
                    const weight = rec.netWeightKg / 1000;
                    const subtotal = weight * rate;
                    
                    return (
                      <div 
                        key={rec.waybillNo}
                        style={{
                          border: '1px solid var(--border-grey)',
                          borderRadius: '8px',
                          padding: '16px',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedBillingRecord(rec)}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '15px' }}>
                              Waybill #{rec.waybillNo}
                            </span>
                            <span style={{ fontSize: '11px', color: '#047857', backgroundColor: '#d1fae5', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              POD APPROVED
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', fontWeight: 500, margin: '2px 0' }}>
                            Transporter: <strong>{po?.transporter}</strong> | Quantity: <strong>{weight.toFixed(2)} Tons</strong>
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>
                            Agreement Rate: <strong>{formatCurrency(rate)} / Ton</strong> | Total Value: <strong>{formatCurrency(subtotal)}</strong>
                          </p>
                        </div>
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedBillingRecord(rec); }}
                        >
                          Generate Invoice
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Invoice Generation Drawer */}
          <div>
            {selectedBillingRecord ? (
              <Card title="Tax Invoice Generator">
                {(() => {
                  const po = purchaseOrders.find((p) => p.purchaseOrderNo === selectedBillingRecord.poRef);
                  const rate = po?.rate || 245.50;
                  const weight = selectedBillingRecord.netWeightKg / 1000;
                  const subtotal = weight * rate;
                  const vat = subtotal * 0.15;
                  const total = subtotal + vat;

                  return (
                    <div>
                      <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-grey)', paddingBottom: '16px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Delivery Waybill</p>
                        <p style={{ fontWeight: 600, color: 'var(--neutral-primary)', margin: 0 }}>#{selectedBillingRecord.waybillNo}</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                          <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>DELIVERED QUANTITY</p>
                          <p style={{ fontWeight: 600, margin: 0 }}>{weight.toFixed(2)} Tons</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>CONTRACT RATE</p>
                          <p style={{ fontWeight: 600, margin: 0 }}>{formatCurrency(rate)} / Ton</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-grey)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--neutral-secondary)', fontWeight: 500 }}>Subtotal (Excl. VAT):</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--neutral-secondary)', fontWeight: 500 }}>VAT (15%):</span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(vat)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', borderTop: '1px solid var(--border-grey)', paddingTop: '8px', marginTop: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>Total Due:</span>
                          <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{formatCurrency(total)}</span>
                        </div>
                      </div>

                      {/* Inputs */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                          Tax Invoice Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. TAX-2026-9021"
                          value={invoiceNo}
                          onChange={(e) => setInvoiceNo(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                        />
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                          Simulated PDF File Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. esc-inv-9021.pdf"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setSelectedBillingRecord(null)}
                          className="btn btn-secondary"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleCreateInvoice}
                          className="btn btn-primary"
                          disabled={isSubmitting || !invoiceNo}
                        >
                          {isSubmitting ? 'Submitting...' : 'Generate & Submit Invoice'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            ) : (
              <Card title="Action Console">
                <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', margin: 0, textAlign: 'center', padding: '20px 0' }}>
                  Select an approved waybill on the left to start billing generation.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
