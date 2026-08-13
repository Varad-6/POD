import React, { useState } from 'react';
import { useDemo, OffloadRecord } from '../context/DemoContext';
import { Card } from '../components/Card';
import { Scale, CheckCircle2, ClipboardCheck, AlertOctagon, FileSpreadsheet, PlusCircle, ArrowDownCircle, PackageCheck, AlertTriangle } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/format';

export const CustomerDashboard: React.FC = () => {
  const { offloadRecords, customerLogWeights, purchaseOrders, submitInvoice, invoices } = useDemo();
  const [activeTab, setActiveTab] = useState<'RECEIVING' | 'BILLING'>('RECEIVING');
  const [selectedRecord, setSelectedRecord] = useState<OffloadRecord | null>(null);
  const [selectedBillingRecord, setSelectedBillingRecord] = useState<OffloadRecord | null>(null);

  // Form states (Weights & Exceptions)
  const [grossWeight, setGrossWeight] = useState('');
  const [tareWeight, setTareWeight] = useState('');
  const [damagedUnits, setDamagedUnits] = useState('0');
  const [damagedWeightKg, setDamagedWeightKg] = useState('0');
  const [damageReason, setDamageReason] = useState('None');
  const [weightExceptionReason, setWeightExceptionReason] = useState<OffloadRecord['weightExceptionReason']>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states (Invoice)
  const [invoiceNo, setInvoiceNo] = useState('');
  const [fileName, setFileName] = useState('');

  // Filter records
  const incomingRecords = offloadRecords.filter((rec) => rec.podStatus === 'EN_ROUTE' || rec.podStatus === 'SUPERVISOR_APPROVED');
  const billingRecords = offloadRecords.filter((rec) => 
    (rec.podStatus === 'DELIVERED_STAMPED' || rec.podStatus === 'POD_APPROVED' || rec.podStatus === 'APPROVED_INVOICE_PENDING') &&
    !invoices.some((inv) => inv.waybillNo === rec.waybillNo && inv.status !== 'AWAITING_INVOICE_SUBMISSION')
  );

  const handleSelectRecord = (rec: OffloadRecord) => {
    setSelectedRecord(rec);
    setGrossWeight(rec.dispatchGrossWeightKg ? (rec.dispatchGrossWeightKg / 1000).toString() : '55.10');
    setTareWeight(rec.dispatchTareWeightKg ? (rec.dispatchTareWeightKg / 1000).toString() : '21.10');
    setDamagedUnits('0');
    setDamagedWeightKg('0');
    setDamageReason('None');
    setWeightExceptionReason('NONE');
  };

  const handleVerifyWeights = async (approve: boolean) => {
    if (!selectedRecord) return;
    const grossKg = Math.round((parseFloat(grossWeight) || 55.1) * 1000);
    const tareKg = Math.round((parseFloat(tareWeight) || 21.1) * 1000);
    const damUnits = parseInt(damagedUnits) || 0;
    const damKg = Math.round((parseFloat(damagedWeightKg) || 0) * 1000);

    if (grossKg <= tareKg) {
      alert('Gross weight must be strictly greater than Tare weight.');
      return;
    }

    setIsSubmitting(true);
    await customerLogWeights(
      selectedRecord.waybillNo,
      grossKg,
      tareKg,
      damUnits,
      damKg,
      damageReason,
      weightExceptionReason,
      approve
    );
    setIsSubmitting(false);
    setSelectedRecord(null);
  };

  const handleCreateInvoice = async () => {
    if (!selectedBillingRecord || !invoiceNo) return;
    setIsSubmitting(true);
    
    const finalFile = fileName || `tax-invoice-${invoiceNo}.pdf`;
    await submitInvoice(selectedBillingRecord.waybillNo, invoiceNo, finalFile);
    
    setIsSubmitting(false);
    setSelectedBillingRecord(null);
    setInvoiceNo('');
    setFileName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="page-header__row">
        <div>
          <h1 className="page-header__title">Customer Receiving Yard</h1>
          <p className="page-header__subtitle">
            Verify inbound deliveries, log customer weighbridge weights, report cargo damage, and confirm physical delivery receipt.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', background: 'var(--neutral-100)', padding: '4px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
          <button 
            onClick={() => setActiveTab('RECEIVING')} 
            className={`btn btn-sm ${activeTab === 'RECEIVING' ? 'btn-dark' : 'btn-ghost'}`}
            style={{ borderRadius: '6px' }}
          >
            Inbound Deliveries ({incomingRecords.length})
          </button>
          <button 
            onClick={() => setActiveTab('BILLING')} 
            className={`btn btn-sm ${activeTab === 'BILLING' ? 'btn-dark' : 'btn-ghost'}`}
            style={{ borderRadius: '6px' }}
          >
            Confirmed Receipts ({billingRecords.length})
          </button>
        </div>
      </div>

      {activeTab === 'RECEIVING' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          
          {/* Incoming Shipment Desk */}
          <Card title="Active Inbound Deliveries">
            {incomingRecords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon"><PackageCheck size={32} /></div>
                <p className="empty-state__title">No shipments en route to yard</p>
                <p className="empty-state__body">Dispatched trucks cleared by siding supervisors will appear here for customer receiving verification.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incomingRecords.map((rec) => {
                  const isSelected = selectedRecord?.waybillNo === rec.waybillNo;
                  const dispatchNet = ((rec.dispatchNetWeightKg || 34150) / 1000).toFixed(2);

                  return (
                    <div 
                      key={rec.waybillNo}
                      style={{
                        border: isSelected ? '2px solid var(--purple-600)' : '1px solid var(--neutral-200)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        backgroundColor: isSelected ? 'var(--purple-50)' : 'var(--neutral-0)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => handleSelectRecord(rec)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="mono" style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '15px' }}>
                            #{rec.waybillNo}
                          </span>
                          <span className="badge badge-purple">EN ROUTE</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--neutral-700)', fontWeight: 600 }}>
                          Driver: {rec.driverName} | Truck: <span className="mono">{rec.horseRegNo}</span>
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '2px' }}>
                          Material: {rec.productDescription} | Dispatch Net: <strong>{dispatchNet} TON</strong>
                        </p>
                      </div>
                      <button 
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-dark'}`}
                        style={{ backgroundColor: isSelected ? 'var(--purple-600)' : undefined }}
                        onClick={(e) => { e.stopPropagation(); handleSelectRecord(rec); }}
                      >
                        {isSelected ? 'Verifying...' : 'Verify Delivery'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Verification Form Card */}
          {selectedRecord ? (
            <Card 
              title={`Customer Verification — Waybill #${selectedRecord.waybillNo}`}
              style={{ border: '2px solid var(--purple-600)', animation: 'slideUp 0.2s ease-out' }}
            >
              <div className="data-grid-2" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label>ARRIVAL GROSS WEIGHT (TONS)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 55.10"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    className="form-input mono"
                    style={{ fontSize: '15px', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label>ARRIVAL TARE WEIGHT (TONS)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 21.10"
                    value={tareWeight}
                    onChange={(e) => setTareWeight(e.target.value)}
                    className="form-input mono"
                    style={{ fontSize: '15px', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Damaged Goods Logging */}
              <div style={{ background: 'var(--neutral-50)', padding: '14px', borderRadius: '10px', border: '1px solid var(--neutral-200)', marginBottom: '20px' }}>
                <label className="form-label" style={{ color: 'var(--amber-600)' }}>DAMAGED CARGO / SPILLAGE AUDIT</label>
                <div className="data-grid-2" style={{ marginTop: '8px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label-normal">Damaged Bags / Units</label>
                    <input
                      type="number"
                      value={damagedUnits}
                      onChange={(e) => setDamagedUnits(e.target.value)}
                      className="form-input mono"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label-normal">Loss Consideration (Tons)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={damagedWeightKg}
                      onChange={(e) => setDamagedWeightKg(e.target.value)}
                      className="form-input mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedRecord(null)} disabled={isSubmitting} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={() => handleVerifyWeights(false)} disabled={isSubmitting} className="btn btn-destructive">
                  Report Deviation
                </button>
                <button onClick={() => handleVerifyWeights(true)} disabled={isSubmitting || !grossWeight || !tareWeight} className="btn btn-success" style={{ minWidth: '160px' }}>
                  {isSubmitting ? 'Confirming...' : 'Stamp & Confirm Receipt'}
                </button>
              </div>
            </Card>
          ) : (
            <Card title="Receiving Desk Instructions">
              <div style={{ fontSize: '13px', color: 'var(--neutral-600)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p>Select an incoming delivery from the list to log customer weighbridge weights and inspect cargo condition.</p>
                <div className="alert alert-info" style={{ padding: '10px 12px' }}>
                  ℹ Confirming delivery generates the customer stamped receipt required for driver POD submission.
                </div>
              </div>
            </Card>
          )}

        </div>
      ) : (
        /* Confirmed Receipts Desk */
        <Card title="Confirmed Delivery Records">
          {billingRecords.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__body">No completed receipts pending invoice creation.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Waybill #</th>
                    <th>Transporter</th>
                    <th>Material</th>
                    <th className="numeric">Delivered Net</th>
                    <th className="numeric">Accepted Net</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billingRecords.map((rec) => {
                    const delNet = ((rec.arrivalNetWeightKg || rec.dispatchNetWeightKg || 34000) / 1000).toFixed(2);
                    const accNet = ((rec.acceptedNetWeightKg || rec.arrivalNetWeightKg || 34000) / 1000).toFixed(2);

                    return (
                      <tr key={rec.waybillNo}>
                        <td className="mono" style={{ fontWeight: 700 }}>#{rec.waybillNo}</td>
                        <td style={{ fontWeight: 500 }}>{rec.driverName}</td>
                        <td>{rec.productDescription}</td>
                        <td className="numeric mono">{delNet} TON</td>
                        <td className="numeric mono" style={{ fontWeight: 700, color: 'var(--success-600)' }}>{accNet} TON</td>
                        <td><span className="badge badge-success">STAMPED RECEIPT</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

    </div>
  );
};
