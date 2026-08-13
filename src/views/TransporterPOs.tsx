import React, { useState } from 'react';
import { PenTool, CheckCircle2 } from 'lucide-react';
import { useDemo, PurchaseOrder } from '../context/DemoContext';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';

export const TransporterPOs: React.FC = () => {
  const { purchaseOrders, acceptPO, offloadRecords, assignPOToDriver } = useDemo();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED'>('ALL');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  // Signature states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureError, setSignatureError] = useState<string | null>(null);

  // Driver Assignment states
  const [assigningPO, setAssigningPO] = useState<PurchaseOrder | null>(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [horseRegNo, setHorseRegNo] = useState('KV44RCGP');
  const [trailer1RegNo, setTrailer1RegNo] = useState('LD 09 RP GP');
  const [trailer2RegNo, setTrailer2RegNo] = useState('LD 10 RP GP');

  // Filters POs
  const filteredPOs = purchaseOrders.filter((po) => {
    if (activeFilter === 'PENDING') return po.status === 'PENDING_SIGNATURE';
    if (activeFilter === 'ACCEPTED') return po.status === 'ACCEPTED_SIGNED';
    return true;
  });

  const handleAcceptPO = async () => {
    if (!selectedPO || !typedSignature) return;
    
    // Find assigned driver from matching offload records
    const matchingPod = offloadRecords.find((r) => r.poRef === selectedPO.purchaseOrderNo);
    const assignedDriver = matchingPod ? matchingPod.driverName : "ZWELITHINI DLAMINI";

    if (typedSignature.trim().toLowerCase() !== assignedDriver.toLowerCase()) {
      setSignatureError(`Incorrect signature name. The signature must match the assigned driver's full name: "${assignedDriver}"`);
      return;
    }

    setIsSubmitting(true);
    setSignatureError(null);
    
    // Draw typed signature on an in-memory canvas to generate the dataUrl image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 100;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.font = 'italic 32px Georgia';
      tempCtx.fillStyle = '#1F4E79';
      tempCtx.fillText(typedSignature, 30, 58);
    }
    const dataUrl = tempCanvas.toDataURL();
    
    await acceptPO(selectedPO.purchaseOrderNo, dataUrl);
    
    setIsSubmitting(false);
    setSelectedPO(null);
    setTypedSignature('');
  };

  const handleAssignDriverSubmit = async () => {
    if (!assigningPO || !selectedDriver) return;
    setIsSubmitting(true);
    await assignPOToDriver(assigningPO.purchaseOrderNo, selectedDriver, horseRegNo, trailer1RegNo, trailer2RegNo);
    setIsSubmitting(false);
    setAssigningPO(null);
    setSelectedDriver('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <PageHeader 
        title="Purchase Orders Execution Queue"
        subtitle="Review released transport POs, sign acknowledgments, and assign drivers & fleet vehicles"
        actions={
          <Tabs 
            tabs={[
              { id: 'ALL', label: 'All POs', count: purchaseOrders.length },
              { id: 'PENDING', label: 'Pending Signature', count: purchaseOrders.filter(p => p.status === 'PENDING_SIGNATURE').length },
              { id: 'ACCEPTED', label: 'Accepted', count: purchaseOrders.filter(p => p.status === 'ACCEPTED_SIGNED').length },
            ]}
            activeTab={activeFilter}
            onChange={(id) => setActiveFilter(id as any)}
          />
        }
      />

      {/* PO Cards Grid */}
      {filteredPOs.length === 0 ? (
        <EmptyState 
          message="No Purchase Orders match active filter" 
          submessage="Check back soon for new PO releases from Company Administration."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredPOs.map((po) => (
            <Card key={po.purchaseOrderNo} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                <div>
                  <h3 className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neutral-900)', marginBottom: '2px' }}>
                    PO #{po.purchaseOrderNo}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 500 }}>
                    Date: {formatDate(po.poDate)}
                  </p>
                </div>
                <StatusBadge status={po.status} />
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Material</p>
                  <p style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{po.productDescription}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Rate</p>
                  <p className="mono" style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{formatCurrency(po.rate)} / {po.unit}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Volume</p>
                  <p style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{po.targetQuantity} {po.unit}s</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Cost Center</p>
                  <p className="mono" style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{po.costCenter}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Route Details</p>
                  <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--neutral-800)' }}>{po.fromLocation} → {po.toLocation}</p>
                </div>
              </div>

              {/* Action Button */}
              {po.status === 'PENDING_SIGNATURE' ? (
                <button 
                  onClick={() => setSelectedPO(po)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  <PenTool size={16} />
                  Review & Sign PO
                </button>
              ) : po.status === 'ACCEPTED_SIGNED' || po.status === 'ASSIGNED' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--success-50)',
                      color: 'var(--success-600)',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Signed by {po.signedBy || 'Transporter'}
                  </div>
                  <button 
                    onClick={() => {
                      setAssigningPO(po);
                      setSelectedDriver('');
                    }}
                    className="btn btn-dark"
                    style={{ width: '100%' }}
                  >
                    Assign Driver & Vehicle
                  </button>
                </div>
              ) : (
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--success-50)',
                    color: 'var(--success-600)',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginTop: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>Signed PO #{po.purchaseOrderNo}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-500)', paddingLeft: '24px' }}>
                    Assigned to Driver
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* PO Detail & E-Sign Modal */}
      <Modal
        isOpen={!!selectedPO}
        onClose={() => { if (!isSubmitting) setSelectedPO(null); }}
        title={selectedPO ? `Review PO #${selectedPO.purchaseOrderNo}` : ''}
        width="680px"
      >
        {selectedPO && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>TRANSPORTER COMPANY</p>
                <p style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{selectedPO.transporter}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>ESTIMATED VALUE</p>
                <p className="mono" style={{ fontWeight: 800, color: 'var(--success-600)', fontSize: '16px' }}>
                  {formatCurrency(selectedPO.targetQuantity * selectedPO.rate)}
                </p>
              </div>
              <div style={{ gridColumn: 'span 2', height: '1px', backgroundColor: 'var(--neutral-200)' }}></div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>MATERIAL</p>
                <p style={{ fontWeight: 600 }}>{selectedPO.productDescription}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>CONTRACT RATE</p>
                <p className="mono" style={{ fontWeight: 600 }}>{formatCurrency(selectedPO.rate)} / {selectedPO.unit}</p>
              </div>
            </div>

            {/* Signature Input */}
            <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '20px', marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--neutral-900)', margin: '0 0 4px 0' }}>DIGITAL E-SIGNATURE</h4>
                <p style={{ fontSize: '12px', color: 'var(--neutral-500)', margin: 0 }}>
                  Date Stamped: {formatDate(new Date())}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Type Assigned Driver Name to Confirm (Verification Gate)
                </label>
                <input
                  type="text"
                  placeholder="Enter assigned driver name to sign..."
                  value={typedSignature}
                  onChange={(e) => {
                    setTypedSignature(e.target.value);
                    if (signatureError) setSignatureError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: signatureError ? '2px solid var(--error-600)' : '1px solid var(--neutral-300)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                />
                {signatureError && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: 'var(--error-50)', borderRadius: '6px', border: '1px solid var(--error-600)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--error-700)', fontWeight: 600, margin: 0 }}>
                      {signatureError}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setSelectedPO(null); setSignatureError(null); setTypedSignature(''); }} 
                disabled={isSubmitting}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={handleAcceptPO} 
                disabled={!typedSignature || isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Accepting...' : 'Accept & Sign PO'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Driver Assignment Modal */}
      <Modal
        isOpen={!!assigningPO}
        onClose={() => { if (!isSubmitting) setAssigningPO(null); }}
        title={assigningPO ? `Assign Driver & Vehicle for PO #${assigningPO.purchaseOrderNo}` : ''}
        width="500px"
      >
        {assigningPO && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Select Logistics Driver
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--neutral-300)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600,
                  }}
                >
                  <option value="">Choose a Driver...</option>
                  <option value="Dumisani Dlamini">Dumisani Dlamini (STS Driver)</option>
                  <option value="Austin">Austin (MPL Driver)</option>
                  <option value="Jan Mokoena">Jan Mokoena (CBS Driver)</option>
                  <option value="ZWELITHINI DLAMINI">Zwelithini Dlamini (Independent)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Truck Plate (Horse)
                </label>
                <input
                  type="text"
                  value={horseRegNo}
                  onChange={(e) => setHorseRegNo(e.target.value)}
                  className="mono"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--neutral-300)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Trailer 1 Plate
                  </label>
                  <input
                    type="text"
                    value={trailer1RegNo}
                    onChange={(e) => setTrailer1RegNo(e.target.value)}
                    className="mono"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--neutral-300)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Trailer 2 Plate
                  </label>
                  <input
                    type="text"
                    value={trailer2RegNo}
                    onChange={(e) => setTrailer2RegNo(e.target.value)}
                    className="mono"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--neutral-300)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setAssigningPO(null)}
                disabled={isSubmitting}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignDriverSubmit}
                disabled={isSubmitting || !selectedDriver}
                className="btn btn-primary"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
