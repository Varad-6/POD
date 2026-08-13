import React, { useState } from 'react';
import { useDemo, OffloadRecord } from '../context/DemoContext';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { FileUploadBox } from '../components/FileUploadBox';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatDate } from '../utils/format';
import { Truck, MapPin, CheckCircle2, Upload, AlertTriangle } from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { 
    purchaseOrders, 
    offloadRecords, 
    driverConfirmArrival, 
    driverDepartSiding,
    supervisorLogWeights,
    customerLogWeights,
    uploadPOD,
    currentUser
  } = useDemo();

  // Selected records for modals
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [selectedOffload, setSelectedOffload] = useState<OffloadRecord | null>(null);
  
  // E-Sign States
  const [typedSignature, setTypedSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sigError, setSigError] = useState<string | null>(null);

  // Presenter Simulation States (for demo speed)
  const [showSimulateSupervisor, setShowSimulateSupervisor] = useState(false);
  const [showSimulateCustomer, setShowSimulateCustomer] = useState(false);
  const [tareInput, setTareInput] = useState('21.10');
  const [grossInput, setGrossInput] = useState('55.25');
  const [isSimulationApproved, setIsSimulationApproved] = useState(true);

  // File upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<'UPLOAD' | 'PROCESSING' | 'RESULT'>('UPLOAD');
  const [selectedStepDetail, setSelectedStepDetail] = useState<number | null>(null);

  // Find active run for this driver
  const activeRun = offloadRecords.find((rec) => 
    rec.podStatus === 'DRIVER_ASSIGNED' ||
    rec.podStatus === 'DRIVER_ARRIVED' ||
    rec.podStatus === 'SUPERVISOR_APPROVED' ||
    rec.podStatus === 'SUPERVISOR_REJECTED' ||
    rec.podStatus === 'EN_ROUTE' ||
    rec.podStatus === 'DELIVERED_STAMPED'
  );

  const getPOForActiveRun = () => {
    if (!activeRun) return null;
    return purchaseOrders.find(p => p.purchaseOrderNo === activeRun.poRef);
  };

  const handleConfirmArrival = async () => {
    if (!activeRun || !typedSignature) return;

    const expectedName = currentUser?.displayName?.split('(')[0]?.trim().toLowerCase() || "dumisani dlamini";
    if (typedSignature.trim().toLowerCase() !== expectedName && typedSignature.trim().length < 3) {
      setSigError(`Please type your driver name signature: "${currentUser?.displayName || 'Dumisani Dlamini'}"`);
      return;
    }

    setIsSubmitting(true);
    setSigError(null);

    // E-sign arrival
    await driverConfirmArrival(activeRun.poRef);
    
    setIsSubmitting(false);
    setSelectedPO(null);
    setTypedSignature('');
  };

  const handleSimulateSupervisor = async () => {
    if (!activeRun) return;
    setIsSubmitting(true);
    
    const tareKg = Math.round((parseFloat(tareInput) || 21.1) * 1000);
    const grossKg = Math.round((parseFloat(grossInput) || 55.25) * 1000);

    await supervisorLogWeights(activeRun.waybillNo, tareKg, grossKg, isSimulationApproved);
    
    setIsSubmitting(false);
    setShowSimulateSupervisor(false);
  };

  const handleSimulateCustomer = async () => {
    if (!activeRun) return;
    setIsSubmitting(true);
    
    const tareKg = Math.round((parseFloat(tareInput) || 21.1) * 1000);
    const grossKg = Math.round((parseFloat(grossInput) || 55.25) * 1000);

    await customerLogWeights(activeRun.waybillNo, grossKg, tareKg, 0, 0, 'None', 'NONE', isSimulationApproved);
    
    setIsSubmitting(false);
    setShowSimulateCustomer(false);
  };

  const handleDepartYard = async () => {
    if (!activeRun) return;
    setIsSubmitting(true);
    await driverDepartSiding(activeRun.waybillNo);
    setIsSubmitting(false);
  };

  const handlePODUploadSubmit = async () => {
    if (!activeRun || !selectedFileName) return;
    
    setUploadStep('PROCESSING');
    await new Promise((resolve) => setTimeout(resolve, 2100));
    setUploadStep('RESULT');
  };

  const handleConfirmPODFile = async () => {
    if (!activeRun || !selectedFileName) return;
    
    setIsSubmitting(true);
    await uploadPOD(activeRun.waybillNo, selectedFileName);
    
    setIsSubmitting(false);
    setShowUploadModal(false);
    setSelectedFileName(null);
    setUploadStep('UPLOAD');
  };

  const po = getPOForActiveRun();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>
      
      {/* Banner */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: 'var(--primary-color)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '28px',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px', color: '#ffffff' }}>Welcome back, Dumisani!</h2>
          <p style={{ fontSize: '14px', color: '#e2e8f0' }}>Manage your active deliveries, e-sign PO arrival, and upload verified POD slips.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span 
            style={{ 
              fontSize: '12px', 
              fontWeight: 700, 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              color: '#ffffff', 
              padding: '6px 14px', 
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            Role: Truck Driver
          </span>
        </div>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Truck size={18} /> Active Delivery Assignment
      </h3>

      {!activeRun ? (
        <EmptyState 
          message="No active deliveries assigned"
          submessage="Check back later or contact your Transporter Administrator to assign a new job."
        />
      ) : (
        <Card>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-grey)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-color)' }}>
                  Waybill #{activeRun.waybillNo}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>
                  (PO: #{activeRun.poRef})
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)' }}>
                Route: {activeRun.site} → Eskom Richards Bay
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--neutral-secondary)', fontWeight: 500 }}>
                Date: {formatDate(activeRun.offloadDate)}
              </span>
              <StatusBadge status={activeRun.podStatus} />
            </div>
          </div>

          {/* Logistics details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Vehicle Horse</span>
              <p style={{ fontWeight: 600, fontSize: '14px' }}>{activeRun.horseRegNo}</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Trailers</span>
              <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-secondary)' }}>
                {activeRun.trailer1RegNo} / {activeRun.trailer2RegNo}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Net Payload</span>
              <p style={{ fontWeight: 600, fontSize: '14px', color: activeRun.netWeightKg ? 'var(--success-text)' : 'var(--neutral-secondary)' }}>
                {activeRun.netWeightKg ? `${(activeRun.netWeightKg / 1000).toFixed(2)} TON` : '—'}
              </p>
            </div>
          </div>

          {/* Journey Steps Tracking */}
          <div style={{ backgroundColor: 'var(--page-bg)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--neutral-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
              Delivery Journey Stages
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              
              <div 
                onClick={() => setSelectedStepDetail(1)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 1, cursor: 'pointer' }}
                title="Click to view details for Stage 1"
              >
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: activeRun.podStatus === 'DRIVER_ASSIGNED' ? 'var(--warning-bg)' : 'var(--success-bg)',
                    color: activeRun.podStatus === 'DRIVER_ASSIGNED' ? 'var(--warning-text)' : 'var(--success-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: '2px solid ' + (activeRun.podStatus === 'DRIVER_ASSIGNED' ? 'var(--warning-text)' : 'var(--success-text)')
                  }}
                >
                  {activeRun.podStatus === 'DRIVER_ASSIGNED' ? '1' : '✓'}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, marginTop: '6px', textDecoration: selectedStepDetail === 1 ? 'underline' : 'none' }}>Arrival Signed</span>
              </div>

              <div 
                onClick={() => setSelectedStepDetail(2)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 1, cursor: 'pointer' }}
                title="Click to view details for Stage 2"
              >
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: activeRun.podStatus === 'DRIVER_ARRIVED' ? 'var(--warning-bg)' : 
                                      (activeRun.podStatus === 'SUPERVISOR_APPROVED' || activeRun.podStatus === 'EN_ROUTE' || activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? 'var(--success-bg)' : '#e2e8f0'),
                    color: activeRun.podStatus === 'DRIVER_ARRIVED' ? 'var(--warning-text)' : 
                           (activeRun.podStatus === 'SUPERVISOR_APPROVED' || activeRun.podStatus === 'EN_ROUTE' || activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? 'var(--success-text)' : 'var(--neutral-secondary)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: '2px solid ' + (activeRun.podStatus === 'DRIVER_ARRIVED' ? 'var(--warning-text)' : 
                                           (activeRun.podStatus === 'SUPERVISOR_APPROVED' || activeRun.podStatus === 'EN_ROUTE' || activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? 'var(--success-text)' : '#cbd5e1'))
                  }}
                >
                  {activeRun.podStatus === 'SUPERVISOR_APPROVED' || activeRun.podStatus === 'EN_ROUTE' || activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? '✓' : '2'}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, marginTop: '6px', textDecoration: selectedStepDetail === 2 ? 'underline' : 'none' }}>Supervisor Load</span>
              </div>

              <div 
                onClick={() => setSelectedStepDetail(3)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 1, cursor: 'pointer' }}
                title="Click to view details for Stage 3"
              >
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: activeRun.podStatus === 'SUPERVISOR_APPROVED' ? '#e2e8f0' :
                                      activeRun.podStatus === 'EN_ROUTE' ? 'var(--warning-bg)' : 
                                      (activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? 'var(--success-bg)' : '#e2e8f0'),
                    color: activeRun.podStatus === 'SUPERVISOR_APPROVED' ? 'var(--neutral-secondary)' :
                           activeRun.podStatus === 'EN_ROUTE' ? 'var(--warning-text)' : 
                           (activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? 'var(--success-text)' : 'var(--neutral-secondary)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: '2px solid ' + (activeRun.podStatus === 'SUPERVISOR_APPROVED' ? '#cbd5e1' :
                                           activeRun.podStatus === 'EN_ROUTE' ? 'var(--warning-text)' : 
                                           (activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? 'var(--success-text)' : '#cbd5e1'))
                  }}
                >
                  {activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? '✓' : '3'}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, marginTop: '6px', textDecoration: selectedStepDetail === 3 ? 'underline' : 'none' }}>Customer Stamp</span>
              </div>

              <div 
                onClick={() => setSelectedStepDetail(4)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 1, cursor: 'pointer' }}
                title="Click to view details for Stage 4"
              >
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: activeRun.podStatus === 'DELIVERED_STAMPED' ? 'var(--warning-bg)' : 
                                      (activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? 'var(--success-bg)' : '#e2e8f0'),
                    color: activeRun.podStatus === 'DELIVERED_STAMPED' ? 'var(--warning-text)' : 
                           (activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? 'var(--success-text)' : 'var(--neutral-secondary)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                    border: '2px solid ' + (activeRun.podStatus === 'DELIVERED_STAMPED' ? 'var(--warning-text)' : 
                                           (activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? 'var(--success-text)' : '#cbd5e1'))
                  }}
                >
                  {activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' ? '✓' : '4'}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, marginTop: '6px', textDecoration: selectedStepDetail === 4 ? 'underline' : 'none' }}>POD Uploaded</span>
              </div>

            </div>

            {/* Selected Step Explanation Detail Card */}
            {selectedStepDetail !== null && (
              <div style={{
                marginTop: '16px',
                padding: '14px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-grey)',
                borderRadius: '8px',
                animation: 'fadeIn 0.2s',
                position: 'relative'
              }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedStepDetail(null); }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    border: 'none',
                    background: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: 'var(--neutral-secondary)',
                    fontWeight: 'bold'
                  }}
                >
                  ×
                </button>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)' }}>
                  {selectedStepDetail === 1 && "Stage 1: Arrival Signed Check-in"}
                  {selectedStepDetail === 2 && "Stage 2: Supervisor Weighbridge Loading"}
                  {selectedStepDetail === 3 && "Stage 3: Customer Siding Stamp Verification"}
                  {selectedStepDetail === 4 && "Stage 4: Proof of Delivery (POD) Document OCR"}
                </h5>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--neutral-secondary)', lineHeight: '1.4' }}>
                  {selectedStepDetail === 1 && "Driver check-in gate confirmation. The driver e-signs the PO to certify their physical arrival at the mine loading sidings. This triggers S/4HANA weighbridge ticket generation."}
                  {selectedStepDetail === 2 && "Pre-dispatch weighbridge measurement. Empty (Tare) and Loaded (Gross) truck weights are checked. If net weight falls within safe cargo limits (e.g. 30 Tons), supervisor approves dispatch."}
                  {selectedStepDetail === 3 && "Receiving yard offload check. Eskom customer verifies cargo on arrival by re-weighing loaded and unloaded tare weights. Verification applies the official e-gate receipt stamp."}
                  {selectedStepDetail === 4 && "Final digital proof of delivery. Driver uploads the physically stamped gate waybill slip. Automated OCR extracts information and cross-references S/4HANA records to clear the AP invoice run."}
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--neutral-secondary)', borderTop: '1px solid var(--border-grey)', paddingTop: '10px' }}>
                  <div>
                    <strong>Actor:</strong>{" "}
                    {selectedStepDetail === 1 && "Truck Driver"}
                    {selectedStepDetail === 2 && "Weighbridge Supervisor (Pieter Botha)"}
                    {selectedStepDetail === 3 && "Customer (John Ndlovu)"}
                    {selectedStepDetail === 4 && "Truck Driver / System OCR"}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {selectedStepDetail === 1 && (activeRun.podStatus !== 'DRIVER_ASSIGNED' ? "✓ Complete (Signed)" : "Awaiting signature")}
                    {selectedStepDetail === 2 && ((activeRun.podStatus === 'SUPERVISOR_APPROVED' || activeRun.podStatus === 'EN_ROUTE' || activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED') ? `✓ Complete (Net: ${(activeRun.netWeightKg / 1000).toFixed(2)} Tons)` : "Awaiting weighbridge entry")}
                    {selectedStepDetail === 3 && ((activeRun.podStatus === 'DELIVERED_STAMPED' || activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED') ? "✓ Complete (Stamped)" : "Awaiting offload check")}
                    {selectedStepDetail === 4 && ((activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED') ? `✓ Complete (${activeRun.uploadedFileName || 'Waybill.jpg'})` : "Awaiting upload")}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contextual Action Button based on Current Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeRun.podStatus === 'DRIVER_ASSIGNED' && (
              <button 
                onClick={() => setSelectedPO(activeRun)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <MapPin size={16} /> Confirm Siding Arrival (E-Sign)
              </button>
            )}

            {activeRun.podStatus === 'DRIVER_ARRIVED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--warning-bg)', borderRadius: '8px', color: 'var(--warning-text)', fontSize: '13px', fontWeight: 600 }}>
                  <MapPin size={16} /> Awaiting Pre-Dispatch Weighing by Siding Supervisor (Pieter Botha)
                </div>
                {/* Presenter shortcut */}
                <button 
                  onClick={() => { setSelectedOffload(activeRun); setIsSimulationApproved(true); setShowSimulateSupervisor(true); }}
                  className="btn"
                  style={{ border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', width: 'fit-content' }}
                >
                  ⚙️ presenter shortcut: simulate supervisor weighing
                </button>
              </div>
            )}

            {activeRun.podStatus === 'SUPERVISOR_APPROVED' && (
              <button 
                onClick={handleDepartYard}
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                <Truck size={16} /> Start Journey (Depart Siding)
              </button>
            )}

            {activeRun.podStatus === 'EN_ROUTE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--info-bg)', borderRadius: '8px', color: 'var(--info-text)', fontSize: '13px', fontWeight: 600 }}>
                  <Truck size={16} /> Truck is currently en route. Awaiting Eskom Customer delivery verification.
                </div>
                {/* Presenter shortcut */}
                <button 
                  onClick={() => { setSelectedOffload(activeRun); setIsSimulationApproved(true); setShowSimulateCustomer(true); }}
                  className="btn"
                  style={{ border: '1px dashed var(--primary-color)', color: 'var(--primary-color)', width: 'fit-content' }}
                >
                  ⚙️ presenter shortcut: simulate customer delivery stamp
                </button>
              </div>
            )}

            {activeRun.podStatus === 'DELIVERED_STAMPED' && (
              <button 
                onClick={() => { setSelectedOffload(activeRun); setShowUploadModal(true); }}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <Upload size={16} /> Upload Customer Stamped POD Note
              </button>
            )}

            {(activeRun.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || activeRun.podStatus === 'APPROVED' || activeRun.podStatus === 'APPROVED_INVOICE_PENDING') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--success-bg)', borderRadius: '8px', color: 'var(--success-text)', fontSize: '13px', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Proof of Delivery (POD) has been submitted successfully to S/4HANA.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* MODAL 1: Confirm Arrival (Driver E-Sign) */}
      <Modal
        isOpen={!!selectedPO}
        onClose={() => { if (!isSubmitting) setSelectedPO(null); }}
        title={selectedPO ? `E-Sign Arrival Confirmation — Waybill #${selectedPO.waybillNo}` : ''}
        width="500px"
      >
        {selectedPO && (
          <div>
            <p style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--neutral-secondary)' }}>
              Confirm your arrival at the mine loading yard. This activates the Supervisor Tare weighing gate.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--neutral-secondary)' }}>
                TYPE DRIVER FULL NAME TO SIGN
              </label>
              <input 
                type="text" 
                placeholder="Dumisani Dlamini"
                value={typedSignature}
                onChange={(e) => { setTypedSignature(e.target.value); setSigError(null); }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-grey)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              {sigError && <p style={{ color: 'var(--error-text)', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{sigError}</p>}
            </div>

            {typedSignature && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>SIGNATURE PREVIEW</span>
                <div style={{ border: '1px solid var(--border-grey)', padding: '16px', borderRadius: '6px', backgroundColor: '#fcfcfc', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '26px', color: 'var(--primary-color)', textAlign: 'center' }}>
                  {typedSignature}
                </div>
              </div>
            )}

            <button 
              onClick={handleConfirmArrival}
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={!typedSignature || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Sign Arrival & Confirm'}
            </button>
          </div>
        )}
      </Modal>

      {/* MODAL 2: Presenter Supervisor Weight simulation */}
      <Modal
        isOpen={showSimulateSupervisor}
        onClose={() => setShowSimulateSupervisor(false)}
        title="Presenter Shortcut: Supervisor Siding Weighbridge"
        width="480px"
      >
        <div>
          <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', marginBottom: '16px' }}>
            Simulates the Weighbridge Supervisor clearing truck weights on dispatch. (Saves role switching steps).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Tare Weight (Tons)</label>
              <input type="text" value={tareInput} onChange={(e) => setTareInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-grey)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Gross Weight (Tons)</label>
              <input type="text" value={grossInput} onChange={(e) => setGrossInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-grey)' }} />
            </div>
          </div>
          <button onClick={handleSimulateSupervisor} className="btn btn-primary" style={{ width: '100%' }}>
            Confirm weighbridge pre-dispatch approval
          </button>
        </div>
      </Modal>

      {/* MODAL 3: Presenter Customer Stamp simulation */}
      <Modal
        isOpen={showSimulateCustomer}
        onClose={() => setShowSimulateCustomer(false)}
        title="Presenter Shortcut: Customer Offloading Stamp"
        width="480px"
      >
        <div>
          <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', marginBottom: '16px' }}>
            Simulates the Eskom Siding Customer checking delivery cargo weight and applying the e-gate pass stamp.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Customer Gross (Tons)</label>
              <input type="text" value={grossInput} onChange={(e) => setGrossInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-grey)' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Customer Tare (Tons)</label>
              <input type="text" value={tareInput} onChange={(e) => setTareInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-grey)' }} />
            </div>
          </div>
          <button onClick={handleSimulateCustomer} className="btn btn-primary" style={{ width: '100%' }}>
            Verify & Apply Receipt Stamp
          </button>
        </div>
      </Modal>

      {/* MODAL 4: Driver POD File Upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => { if (!isSubmitting) setShowUploadModal(false); }}
        title="Upload Stamped Proof of Delivery (POD)"
        width="600px"
      >
        {activeRun && (
          <div>
            {uploadStep === 'UPLOAD' && (
              <div>
                <p style={{ fontSize: '14px', color: 'var(--neutral-secondary)', marginBottom: '16px' }}>
                  Please upload a clear scan/photo of the physically stamped weighbridge waybill note (e.g. <code>WB-998807.jpg</code>).
                </p>
                <FileUploadBox 
                  selectedFileName={selectedFileName}
                  onFileSelect={(name: string) => { setSelectedFileName(name); }}
                  onClear={() => { setSelectedFileName(null); }}
                />
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '8px', padding: '10px 14px', backgroundColor: 'var(--secondary-bg)', color: 'var(--primary-color)', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                  💡 Demo Tip: Upload "WB-998807.jpg" for a perfect match, "WB-998808_mismatch.jpg" for weight discrepancy warning, or "WB-998809_blurry.jpg" for manual review.
                </div>
                <button 
                  onClick={handlePODUploadSubmit}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '20px' }}
                  disabled={!selectedFileName}
                >
                  Submit for Verification
                </button>
              </div>
            )}
            {uploadStep === 'PROCESSING' && (
              <LoadingSpinner 
                statusTexts={["Uploading scanned POD document...", "Running OCR text extraction...", "Cross-referencing with weighbridge S/4HANA records..."]}
                intervalMs={700}
              />
            )}
            {uploadStep === 'RESULT' && (
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '16px' }}>
                  OCR Extraction Report
                </h4>
                
                <div style={{ border: '1px solid var(--border-grey)', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-grey)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--neutral-secondary)' }}>Field</th>
                        <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--neutral-secondary)' }}>Extracted (POD)</th>
                        <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--neutral-secondary)' }}>SAP Records</th>
                        <th style={{ textAlign: 'center', padding: '8px 4px', color: 'var(--neutral-secondary)' }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-grey)' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600 }}>Waybill Number</td>
                        <td style={{ padding: '10px 4px' }}>{activeRun.waybillNo}</td>
                        <td style={{ padding: '10px 4px' }}>{activeRun.waybillNo}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--success-text)', fontWeight: 'bold' }}>✓ Match</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-grey)' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600 }}>Truck Number</td>
                        <td style={{ padding: '10px 4px' }}>{activeRun.horseRegNo}</td>
                        <td style={{ padding: '10px 4px' }}>{activeRun.horseRegNo}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--success-text)', fontWeight: 'bold' }}>✓ Match</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-grey)' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600 }}>Net Cargo Weight</td>
                        <td style={{ padding: '10px 4px' }}>{(activeRun.netWeightKg / 1000).toFixed(2)} TON</td>
                        <td style={{ padding: '10px 4px' }}>{(activeRun.netWeightKg / 1000).toFixed(2)} TON</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--success-text)', fontWeight: 'bold' }}>✓ Match</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setUploadStep('UPLOAD')}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Re-upload
                  </button>
                  <button 
                    onClick={handleConfirmPODFile}
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm & Submit to Admin'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
