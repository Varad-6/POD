import React, { useState } from 'react';
import { useDemo, OffloadRecord } from '../context/DemoContext';
import { Card } from '../components/Card';
import { Truck, MapPin, CheckCircle, Navigation, FileSignature, UploadCloud } from 'lucide-react';
import { formatDate } from '../utils/format';

export const DriverDashboard: React.FC = () => {
  const { purchaseOrders, offloadRecords, driverConfirmArrival, driverDepartSiding, uploadPOD } = useDemo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  // Find active run for this driver
  // In a real app we'd filter by driverName, here we just show the latest active run
  const activeRun = offloadRecords.find((rec) => 
    rec.podStatus === 'DRIVER_ASSIGNED' ||
    rec.podStatus === 'DRIVER_ARRIVED' ||
    rec.podStatus === 'SUPERVISOR_APPROVED' ||
    rec.podStatus === 'SUPERVISOR_REJECTED' ||
    rec.podStatus === 'EN_ROUTE' ||
    rec.podStatus === 'DELIVERED_STAMPED'
  );

  const handleArrival = async () => {
    if (!activeRun) return;
    setIsSubmitting(true);
    await driverConfirmArrival(activeRun.poRef);
    setIsSubmitting(false);
  };

  const handleDeparture = async () => {
    if (!activeRun) return;
    setIsSubmitting(true);
    await driverDepartSiding(activeRun.waybillNo);
    setIsSubmitting(false);
  };

  const handleUploadPOD = async () => {
    if (!activeRun) return;
    setIsSubmitting(true);
    const finalFile = selectedFileName || `${activeRun.waybillNo}-stamped.jpg`;
    await uploadPOD(activeRun.waybillNo, finalFile);
    setIsSubmitting(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card title="Active Cargo Dispatch Assignment">
        {!activeRun ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--neutral-secondary)' }}>
            <Truck size={48} style={{ color: 'var(--neutral-secondary)', marginBottom: '12px', strokeWidth: 1.5 }} />
            <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>No active runs assigned</p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Ask the Transporter Admin to assign a PO run to your vehicle.</p>
          </div>
        ) : (
          <div>
            {/* Run Header */}
            <div 
              style={{ 
                borderBottom: '1px solid var(--border-grey)', 
                paddingBottom: '16px', 
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-color)', margin: '0 0 4px 0' }}>
                  Waybill #{activeRun.waybillNo}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', margin: 0 }}>
                  PO Reference: <strong>#{activeRun.poRef}</strong>
                </p>
              </div>
              <div 
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  textTransform: 'uppercase'
                }}
              >
                {activeRun.podStatus.replace('_', ' ')}
              </div>
            </div>

            {/* Run details split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Vehicle Registration</p>
                <p style={{ fontWeight: 600, margin: 0 }}>{activeRun.horseRegNo} (Horse)</p>
                <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>
                  Trailers: {activeRun.trailer1RegNo} / {activeRun.trailer2RegNo}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Route Definition</p>
                <p style={{ fontWeight: 500, margin: 0 }}>{activeRun.site}</p>
                <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>
                  Destination: Eskom Richards Bay
                </p>
              </div>
            </div>

            {/* Steps Console */}
            <div style={{ borderTop: '1px solid var(--border-grey)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--neutral-primary)' }}>RUN CHECKLIST</h4>
              
              {/* Step 1: Arrival */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: activeRun.podStatus !== 'DRIVER_ASSIGNED' ? 'var(--success-bg)' : '#e2e8f0',
                    color: activeRun.podStatus !== 'DRIVER_ASSIGNED' ? 'var(--success-text)' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  {activeRun.podStatus !== 'DRIVER_ASSIGNED' ? <CheckCircle size={16} /> : '1'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Confirm Siding Siding Arrival</p>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>Check in at yard gate to notify Supervisor.</p>
                </div>
                {activeRun.podStatus === 'DRIVER_ASSIGNED' && (
                  <button onClick={handleArrival} disabled={isSubmitting} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Confirm Arrival
                  </button>
                )}
              </div>

              {/* Step 2: Weighbridge Loading */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 
                      activeRun.podStatus === 'SUPERVISOR_APPROVED' ||
                      activeRun.podStatus === 'EN_ROUTE' ||
                      activeRun.podStatus === 'DELIVERED_STAMPED'
                        ? 'var(--success-bg)' 
                        : '#e2e8f0',
                    color: 
                      activeRun.podStatus === 'SUPERVISOR_APPROVED' ||
                      activeRun.podStatus === 'EN_ROUTE' ||
                      activeRun.podStatus === 'DELIVERED_STAMPED'
                        ? 'var(--success-text)' 
                        : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  {activeRun.podStatus === 'SUPERVISOR_APPROVED' ||
                  activeRun.podStatus === 'EN_ROUTE' ||
                  activeRun.podStatus === 'DELIVERED_STAMPED' ? <CheckCircle size={16} /> : '2'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Weighbridge Pre-Dispatch Weights</p>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>
                    {activeRun.podStatus === 'DRIVER_ARRIVED' 
                      ? 'Supervisor is logging empty & loaded weights...' 
                      : activeRun.podStatus === 'DRIVER_ASSIGNED' 
                      ? 'Awaiting siding arrival confirm...'
                      : `Weights approved: Net payload of ${(activeRun.netWeightKg / 1000).toFixed(2)} Tons registered.`}
                  </p>
                </div>
              </div>

              {/* Step 3: Departure */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 
                      activeRun.podStatus === 'EN_ROUTE' ||
                      activeRun.podStatus === 'DELIVERED_STAMPED'
                        ? 'var(--success-bg)' 
                        : '#e2e8f0',
                    color: 
                      activeRun.podStatus === 'EN_ROUTE' ||
                      activeRun.podStatus === 'DELIVERED_STAMPED'
                        ? 'var(--success-text)' 
                        : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  {activeRun.podStatus === 'EN_ROUTE' ||
                  activeRun.podStatus === 'DELIVERED_STAMPED' ? <CheckCircle size={16} /> : '3'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Depart Siding Siding</p>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>Commence transit delivery to customer siding.</p>
                </div>
                {activeRun.podStatus === 'SUPERVISOR_APPROVED' && (
                  <button onClick={handleDeparture} disabled={isSubmitting} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Depart Yard
                  </button>
                )}
              </div>

              {/* Step 4: Stamped POD Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 
                      activeRun.podStatus === 'DELIVERED_STAMPED' ? '#fef3c7' :
                      activeRun.podStatus === 'APPROVED' || activeRun.podStatus === 'APPROVED_INVOICE_PENDING' ? 'var(--success-bg)' : '#e2e8f0',
                    color: 
                      activeRun.podStatus === 'DELIVERED_STAMPED' ? '#d97706' :
                      activeRun.podStatus === 'APPROVED' || activeRun.podStatus === 'APPROVED_INVOICE_PENDING' ? 'var(--success-text)' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  {'4'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Upload Customer-Stamped POD Note</p>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>
                    {activeRun.podStatus === 'DELIVERED_STAMPED' 
                      ? 'Upload the signed & stamped weighbridge slip from the customer.' 
                      : 'Awaiting customer unloading approval...'}
                  </p>
                  {activeRun.podStatus === 'DELIVERED_STAMPED' && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                      <select 
                        value={selectedFileName} 
                        onChange={(e) => setSelectedFileName(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-grey)',
                          fontSize: '13px'
                        }}
                      >
                        <option value="">Select Stamped File...</option>
                        <option value="WB-998807.jpg">WB-998807-stamped.jpg (Match Slip)</option>
                        <option value="WB-998808.jpg">WB-998808-stamped.jpg (Mismatch Slip)</option>
                        <option value="WB-998809.jpg">WB-998809-stamped.jpg (Blurry Slip)</option>
                      </select>
                      <button onClick={handleUploadPOD} disabled={isSubmitting || !selectedFileName} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        <UploadCloud size={14} style={{ marginRight: '4px' }} />
                        Upload POD
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
