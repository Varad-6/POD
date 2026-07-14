import React, { useState } from 'react';
import { useDemo, OffloadRecord } from '../context/DemoContext';
import { Card } from '../components/Card';
import { Truck, Scale, CheckCircle2, AlertOctagon, ClipboardCheck, ArrowUpRight } from 'lucide-react';
import { formatDate } from '../utils/format';

export const SupervisorDashboard: React.FC = () => {
  const { offloadRecords, supervisorLogWeights, purchaseOrders } = useDemo();
  const [selectedRecord, setSelectedRecord] = useState<OffloadRecord | null>(null);

  // Form states
  const [tareWeight, setTareWeight] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter records
  // 1. Pending pre-dispatch checks: Status is 'DRIVER_ARRIVED'
  const pendingRecords = offloadRecords.filter((rec) => rec.podStatus === 'DRIVER_ARRIVED');
  // 2. Completed logs: Status is 'SUPERVISOR_APPROVED' or 'SUPERVISOR_REJECTED' or 'EN_ROUTE' or later
  const completedLogs = offloadRecords.filter((rec) => 
    rec.podStatus !== 'DRIVER_ARRIVED' && rec.podStatus !== 'DRIVER_ASSIGNED' && rec.podStatus !== 'PENDING_POD'
  );

  const handleSelectRecord = (rec: OffloadRecord) => {
    setSelectedRecord(rec);
    setTareWeight('');
    setGrossWeight('');
  };

  const handleLogWeights = async (approve: boolean) => {
    if (!selectedRecord) return;
    const tare = parseFloat(tareWeight);
    const gross = parseFloat(grossWeight);

    if (isNaN(tare) || tare <= 0 || isNaN(gross) || gross <= 0 || gross <= tare) {
      alert('Please enter valid positive gross and tare weights where Gross exceeds Tare.');
      return;
    }

    setIsSubmitting(true);
    await supervisorLogWeights(selectedRecord.waybillNo, tare, gross, approve);
    setIsSubmitting(false);
    setSelectedRecord(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
      {/* Left Column: Log Entry Desk */}
      <div>
        <Card title="Awaiting Siding Pre-Dispatch Weight Entry" style={{ marginBottom: '24px' }}>
          {pendingRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--neutral-secondary)' }}>
              <Scale size={48} style={{ color: 'var(--neutral-secondary)', marginBottom: '12px', strokeWidth: 1.5 }} />
              <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>No trucks in yard siding</p>
              <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Waiting for drivers to check in arrival confirm.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingRecords.map((rec) => {
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
                      transition: 'border-color 0.15s',
                    }}
                    onClick={() => handleSelectRecord(rec)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '15px' }}>
                          Waybill #{rec.waybillNo}
                        </span>
                        <span style={{ fontSize: '11px', color: '#ea580c', backgroundColor: '#ffedd5', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          ARRIVED AT YARD
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', fontWeight: 500, margin: '2px 0' }}>
                        Driver: <strong>{rec.driverName}</strong> | Vehicle: <strong>{rec.horseRegNo}</strong>
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: 0 }}>
                        Product: {rec.productDescription} | Expected: <strong>{po?.targetQuantity || 30.00} Tons</strong>
                      </p>
                    </div>
                    <button 
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={(e) => { e.stopPropagation(); handleSelectRecord(rec); }}
                    >
                      Log Weights
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Selected Record Weights Input Form */}
        {selectedRecord && (
          <Card 
            title={`Weighbridge Checkpoint — Waybill #${selectedRecord.waybillNo}`}
            style={{ border: '2px solid var(--primary-color)', animation: 'fadeIn 0.2s' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Tare Weight / Empty Vehicle (kg)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    placeholder="e.g. 22840"
                    value={tareWeight}
                    onChange={(e) => setTareWeight(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>KG</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Gross Weight / Loaded Vehicle (kg)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    placeholder="e.g. 71660"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-grey)', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                  />
                  <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>KG</span>
                </div>
              </div>
            </div>

            {/* Calculations Card */}
            {tareWeight && grossWeight && parseFloat(grossWeight) > parseFloat(tareWeight) && (
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
                  <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Calculated Net Weight</p>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>
                    {((parseFloat(grossWeight) - parseFloat(tareWeight)) / 1000).toFixed(2)} Tons
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: '4px 0 0 0' }}>
                    {parseFloat(grossWeight) - parseFloat(tareWeight)} kg
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Target PO Weight</p>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--neutral-primary)', margin: 0 }}>
                    {(purchaseOrders.find((po) => po.purchaseOrderNo === selectedRecord.poRef)?.targetQuantity || 30.0).toFixed(2)} Tons
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedRecord(null)}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleLogWeights(false)}
                disabled={isSubmitting || !tareWeight || !grossWeight}
                className="btn"
                style={{ backgroundColor: 'var(--error-text)', borderColor: 'var(--error-text)', color: '#ffffff' }}
              >
                Reject Dispatch
              </button>
              <button 
                onClick={() => handleLogWeights(true)}
                disabled={isSubmitting || !tareWeight || !grossWeight}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                {isSubmitting ? 'Approving...' : 'Approve Pre-Dispatch'}
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Right Column: Historical Logs */}
      <div>
        <Card title="Today's Siding Dispatch Log">
          {completedLogs.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--neutral-secondary)', fontSize: '13px' }}>
              No gate dispatches logged yet today.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {completedLogs.map((rec) => {
                const isApproved = rec.podStatus !== 'SUPERVISOR_REJECTED';
                return (
                  <div 
                    key={rec.waybillNo}
                    style={{
                      border: '1px solid var(--border-grey)',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#fcfcfc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>Waybill #{rec.waybillNo}</span>
                      <span 
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          backgroundColor: isApproved ? 'var(--success-bg)' : 'var(--error-bg)',
                          color: isApproved ? 'var(--success-text)' : 'var(--error-text)'
                        }}
                      >
                        {isApproved ? 'DISPATCHED' : 'HELD / BLOCKED'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', margin: '2px 0' }}>
                      Vehicle: <strong>{rec.horseRegNo}</strong> | Net Payload: <strong>{(rec.netWeightKg / 1000).toFixed(2)} Tons</strong>
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', margin: 0 }}>
                      Gate Clearance: {rec.operatorName} | Date: {formatDate(rec.offloadDate)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
