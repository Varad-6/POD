import React, { useState } from 'react';
import { useDemo, PurchaseOrder } from '../context/DemoContext';
import { Card } from '../components/Card';
import { FileText, PlusCircle, CheckCircle, Clock, Send, Users } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/format';

export const AdminContracts: React.FC = () => {
  const { contracts, purchaseOrders, offloadRecords, assignPOToTransporter } = useDemo();
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [selectedPOToAssign, setSelectedPOToAssign] = useState<PurchaseOrder | null>(null);
  const [targetTransporter, setTargetTransporter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group POs by contract
  const getContractPOs = (contractNo: string) => {
    return purchaseOrders.filter((po) => po.contractRef === contractNo);
  };

  // Get cumulative delivered tonnage for a contract
  const getContractDeliveredVolume = (contractNo: string) => {
    // Find all POs under contract
    const contractPOIds = purchaseOrders
      .filter((po) => po.contractRef === contractNo)
      .map((po) => po.purchaseOrderNo);

    // Sum weights of completed deliveries
    return offloadRecords
      .filter((r) => contractPOIds.includes(r.poRef) && (r.podStatus === 'DELIVERED_STAMPED' || r.podStatus === 'POD_SUBMITTED' || r.podStatus === 'POD_APPROVED' || r.podStatus === 'APPROVED' || r.podStatus === 'APPROVED_INVOICE_PENDING'))
      .reduce((sum, r) => sum + (r.netWeightKg / 1000), 0);
  };

  const handleAssignSubmit = async () => {
    if (!selectedPOToAssign || !targetTransporter) return;
    setIsSubmitting(true);
    await assignPOToTransporter(selectedPOToAssign.purchaseOrderNo, targetTransporter);
    setIsSubmitting(false);
    setSelectedPOToAssign(null);
    setTargetTransporter('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
      {/* Left: Contracts & PO queues */}
      <div>
        <Card title="Active S/4HANA Quantity Contracts" style={{ marginBottom: '24px' }}>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Contract Ref</th>
                  <th>Transporter</th>
                  <th>Material Type</th>
                  <th style={{ textAlign: 'right' }}>Unit Rate</th>
                  <th style={{ width: '180px' }}>Usage Progress</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => {
                  const delivered = getContractDeliveredVolume(c.contractNumber);
                  const target = c.targetQuantity;
                  const pct = Math.min(100, Math.round((delivered / target) * 100));
                  
                  return (
                    <tr 
                      key={c.contractNumber}
                      onClick={() => setSelectedContract(c)}
                      style={{ cursor: 'pointer', backgroundColor: selectedContract?.contractNumber === c.contractNumber ? '#f0f7ff' : 'transparent' }}
                    >
                      <td style={{ fontWeight: 700 }}>#{c.contractNumber}</td>
                      <td style={{ fontWeight: 600 }}>{c.transporter}</td>
                      <td>{c.qualityType}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(c.rate)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct > 85 ? '#ef4444' : 'var(--primary-color)' }}></div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neutral-secondary)' }}>{pct}%</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--neutral-secondary)', marginTop: '2px' }}>
                          {delivered.toFixed(1)} / {target} Tons
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* PO Distribution Desk */}
        <Card title="Purchase Orders Siding Distribution Queue">
          {purchaseOrders.filter(po => po.status === 'PENDING_ASSIGNMENT').length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--neutral-secondary)', fontSize: '13px' }}>
              All purchase orders have been dispatched and assigned.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {purchaseOrders
                .filter(po => po.status === 'PENDING_ASSIGNMENT')
                .map((po) => (
                  <div 
                    key={po.purchaseOrderNo}
                    style={{
                      border: '1px solid var(--border-grey)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--primary-color)', margin: '0 0 4px 0', fontSize: '15px' }}>
                        PO #{po.purchaseOrderNo}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', margin: '2px 0' }}>
                        Product: <strong>{po.productDescription}</strong> | Target: <strong>{po.targetQuantity} {po.unit}s</strong>
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>
                        Route: {po.fromLocation} → {po.toLocation}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedPOToAssign(po);
                        setTargetTransporter(po.transporter);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <Send size={12} style={{ marginRight: '4px' }} />
                      Distribute PO
                    </button>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* Right Column: Contract Detail Drawer or Assign Box */}
      <div>
        {selectedPOToAssign ? (
          <Card title="Distribute & Assign Purchase Order" style={{ border: '2px solid var(--primary-color)' }}>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Release PO Target</p>
              <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary-color)', margin: 0 }}>#{selectedPOToAssign.purchaseOrderNo}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Select Transporter Admin Company
              </label>
              <select
                value={targetTransporter}
                onChange={(e) => setTargetTransporter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-grey)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="Sipho Transport Services">Sipho Transport Services (Primary)</option>
                <option value="CBS Logistics">CBS Logistics (Secondary)</option>
                <option value="MPL Transport">MPL Transport</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedPOToAssign(null)}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignSubmit}
                disabled={isSubmitting || !targetTransporter}
                className="btn btn-primary"
              >
                Release PO Run
              </button>
            </div>
          </Card>
        ) : selectedContract ? (
          <Card title={`Contract Details: #${selectedContract.contractNumber}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, margin: '0 0 2px 0' }}>VENDOR / TRANSPORTER</p>
                <p style={{ fontWeight: 600, color: 'var(--neutral-primary)', margin: 0 }}>{selectedContract.transporter}</p>
              </div>

              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, margin: '0 0 2px 0' }}>CONTRACT UOM & RATE</p>
                <p style={{ fontWeight: 600, color: 'var(--neutral-primary)', margin: 0 }}>
                  {formatCurrency(selectedContract.rate)} per {selectedContract.uom}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-grey)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>LINKED DISPATCH POS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {getContractPOs(selectedContract.contractNumber).map((po) => (
                    <div 
                      key={po.purchaseOrderNo}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-grey)',
                        backgroundColor: '#fafafa',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>PO #{po.purchaseOrderNo}</span>
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          backgroundColor: po.status === 'ACCEPTED_SIGNED' || po.status === 'DRIVER_ASSIGNED' || po.status === 'DRIVER_ARRIVED' || po.status === 'SUPERVISOR_APPROVED' || po.status === 'EN_ROUTE' || po.status === 'DELIVERED_STAMPED' || po.status === 'POD_SUBMITTED' || po.status === 'POD_APPROVED' || po.status === 'INVOICE_SUBMITTED' || po.status === 'PAID' ? 'var(--success-bg)' : '#fef3c7',
                          color: po.status === 'ACCEPTED_SIGNED' || po.status === 'DRIVER_ASSIGNED' || po.status === 'DRIVER_ARRIVED' || po.status === 'SUPERVISOR_APPROVED' || po.status === 'EN_ROUTE' || po.status === 'DELIVERED_STAMPED' || po.status === 'POD_SUBMITTED' || po.status === 'POD_APPROVED' || po.status === 'INVOICE_SUBMITTED' || po.status === 'PAID' ? 'var(--success-text)' : '#d97706'
                        }}
                      >
                        {po.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Contract Inspector">
            <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
              Select a contract on the left to inspect linked runs and usage metrics.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
