import React, { useState, useRef, useEffect } from 'react';
import { FileSignature, CheckCircle2, RotateCcw, PenTool } from 'lucide-react';
import { useDemo, PurchaseOrder } from '../context/DemoContext';
import { Card } from '../components/Card';
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

  const filterTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: active ? 'var(--primary-color)' : 'transparent',
    color: active ? '#ffffff' : 'var(--neutral-secondary)',
    border: '1px solid ' + (active ? 'var(--primary-color)' : 'var(--border-grey)'),
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s'
  });

  return (
    <div>
      {/* Tabs Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => setActiveFilter('ALL')} style={filterTabStyle(activeFilter === 'ALL')}>All</button>
        <button onClick={() => setActiveFilter('PENDING')} style={filterTabStyle(activeFilter === 'PENDING')}>Pending Signature</button>
        <button onClick={() => setActiveFilter('ACCEPTED')} style={filterTabStyle(activeFilter === 'ACCEPTED')}>Accepted</button>
      </div>

      {/* PO Cards Grid */}
      {filteredPOs.length === 0 ? (
        <EmptyState 
          message="No Purchase Orders found" 
          submessage="Try toggling your filters or wait for new PO releases."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {filteredPOs.map((po) => (
            <Card key={po.purchaseOrderNo} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header block with flex to avoid badge collisions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '4px' }}>
                    PO #{po.purchaseOrderNo}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', fontWeight: 500 }}>
                    Date: {formatDate(po.poDate)}
                  </p>
                </div>
                <StatusBadge status={po.status} />
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Material</p>
                  <p style={{ fontWeight: 600 }}>{po.productDescription}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Rate Agreement</p>
                  <p style={{ fontWeight: 600 }}>{formatCurrency(po.rate)} / {po.unit}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Est. Volume</p>
                  <p style={{ fontWeight: 600 }}>{po.targetQuantity} {po.unit}s</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Cost Center</p>
                  <p style={{ fontWeight: 600 }}>{po.costCenter}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Route Details</p>
                  <p style={{ fontWeight: 500, fontSize: '13px' }}>{po.fromLocation} → {po.toLocation}</p>
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
                  Review & Sign
                </button>
              ) : po.status === 'ACCEPTED_SIGNED' || po.status === 'ASSIGNED' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                  <div 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--success-bg)',
                      color: 'var(--success-text)',
                      fontSize: '13px',
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
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Assign Driver & Truck
                  </button>
                </div>
              ) : (
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success-text)',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginTop: 'auto'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>Signed PO #{po.purchaseOrderNo}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--neutral-secondary)', paddingLeft: '24px' }}>
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
            {/* Details Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>TRANSPORTER COMPANY</p>
                <p style={{ fontWeight: 600, color: 'var(--neutral-primary)' }}>{selectedPO.transporter}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>ESTIMATED TOTAL VALUE</p>
                <p style={{ fontWeight: 700, color: 'var(--success-text)', fontSize: '16px' }}>
                  {formatCurrency(selectedPO.targetQuantity * selectedPO.rate)}
                </p>
              </div>
              <div style={{ gridColumn: 'span 2', height: '1px', backgroundColor: 'var(--border-grey)' }}></div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>MATERIAL TYPE</p>
                <p style={{ fontWeight: 500 }}>{selectedPO.productDescription}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>CONTRACT RATE</p>
                <p style={{ fontWeight: 500 }}>{formatCurrency(selectedPO.rate)} / {selectedPO.unit}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>ROUTE DEFINITION</p>
                <p style={{ fontWeight: 500, fontSize: '13px' }}>{selectedPO.fromLocation} → {selectedPO.toLocation}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>PAYMENT CONTRACT TERMS</p>
                <p style={{ fontWeight: 500 }}>{selectedPO.paymentTerms}</p>
              </div>
            </div>

            {/* Signature Area */}
            <div style={{ borderTop: '1px solid var(--border-grey)', paddingTop: '20px', marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-color)', margin: '0 0 4px 0' }}>DIGITAL SIGNATURE</h4>
                <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0, fontWeight: 500 }}>
                  Date Stamped: {formatDate(new Date())}
                </p>
              </div>

              {/* Typed Signature Input */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
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
                    border: signatureError ? '2px solid var(--error-text)' : '1px solid var(--border-grey)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff'
                  }}
                />
                {signatureError && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: 'var(--error-bg)', borderRadius: '6px', border: '1px solid var(--error-text)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--error-text)', fontWeight: 600, margin: 0 }}>
                      {signatureError}
                    </p>
                  </div>
                )}

                {/* Script font preview */}
                {typedSignature && (
                  <div style={{ marginTop: '12px', padding: '12px', border: '1px dashed var(--border-grey)', borderRadius: '6px', backgroundColor: '#fcfcfc', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>E-SIGNATURE PREVIEW</p>
                    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '24px', color: 'var(--primary-color)', margin: 0, letterSpacing: '1px' }}>
                      {typedSignature}
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
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleAcceptPO} 
                disabled={!typedSignature || isSubmitting}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
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
        title={assigningPO ? `Assign Logistics & Driver for PO #${assigningPO.purchaseOrderNo}` : ''}
        width="500px"
      >
        {assigningPO && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Select Logistics Driver
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-grey)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#ffffff'
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
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Truck registration (Horse)
                </label>
                <input
                  type="text"
                  value={horseRegNo}
                  onChange={(e) => setHorseRegNo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-grey)',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Trailer 1 Plate
                  </label>
                  <input
                    type="text"
                    value={trailer1RegNo}
                    onChange={(e) => setTrailer1RegNo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-grey)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Trailer 2 Plate
                  </label>
                  <input
                    type="text"
                    value={trailer2RegNo}
                    onChange={(e) => setTrailer2RegNo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-grey)',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setAssigningPO(null)}
                disabled={isSubmitting}
                className="btn btn-secondary"
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
