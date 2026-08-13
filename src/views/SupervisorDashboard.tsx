import React, { useState } from 'react';
import { useDemo, OffloadRecord } from '../context/DemoContext';
import { Card } from '../components/Card';
import { Truck, Scale, CheckCircle2, AlertOctagon, ClipboardCheck, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { formatDate } from '../utils/format';

export const SupervisorDashboard: React.FC = () => {
  const { offloadRecords, supervisorLogWeights, purchaseOrders } = useDemo();
  const [selectedRecord, setSelectedRecord] = useState<OffloadRecord | null>(null);

  // Form states
  const [tareWeight, setTareWeight] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter records
  const pendingRecords = offloadRecords.filter((rec) => rec.podStatus === 'DRIVER_ARRIVED');
  const completedLogs = offloadRecords.filter((rec) => 
    rec.podStatus !== 'DRIVER_ARRIVED' && rec.podStatus !== 'DRIVER_ASSIGNED' && rec.podStatus !== 'PENDING_POD'
  );

  const handleSelectRecord = (rec: OffloadRecord) => {
    setSelectedRecord(rec);
    setTareWeight(rec.dispatchTareWeightKg ? (rec.dispatchTareWeightKg / 1000).toString() : '21.10');
    setGrossWeight(rec.dispatchGrossWeightKg ? (rec.dispatchGrossWeightKg / 1000).toString() : '55.25');
  };

  const handleLogWeights = async (approve: boolean) => {
    if (!selectedRecord) return;
    const tareKg = Math.round((parseFloat(tareWeight) || 21.1) * 1000);
    const grossKg = Math.round((parseFloat(grossWeight) || 55.25) * 1000);

    if (grossKg <= tareKg) {
      alert('Gross weight must be strictly greater than Tare weight.');
      return;
    }

    setIsSubmitting(true);
    await supervisorLogWeights(selectedRecord.waybillNo, tareKg, grossKg, approve);
    setIsSubmitting(false);
    setSelectedRecord(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
      
      {/* Left Column: Pre-Dispatch Weighbridge Gate */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ background: 'var(--brand-navy)', borderRadius: '16px', padding: '24px 28px', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-amber"><Scale size={10} /> Station Gate 01</span>
            <span style={{ fontSize: '12px', color: 'var(--neutral-400)' }}>Emoyeni Siding Weighbridge</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>Weighbridge Pre-Dispatch Gate</h2>
          <p style={{ fontSize: '13px', color: 'var(--neutral-300)', marginTop: '2px' }}>
            Verify driver licenses, capture empty (tare) and loaded (gross) truck weights, and grant pre-dispatch clearances.
          </p>
        </div>

        <Card title={`Pending Siding Arrivals (${pendingRecords.length})`}>
          {pendingRecords.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><Scale size={32} /></div>
              <p className="empty-state__title">No trucks waiting at siding gate</p>
              <p className="empty-state__body">Drivers who confirm arrival at siding will automatically appear here for pre-dispatch weight logging.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingRecords.map((rec) => {
                const po = purchaseOrders.find((p) => p.purchaseOrderNo === rec.poRef);
                const isSelected = selectedRecord?.waybillNo === rec.waybillNo;

                return (
                  <div 
                    key={rec.waybillNo}
                    style={{
                      border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--neutral-200)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      backgroundColor: isSelected ? 'var(--accent-blue-light)' : 'var(--neutral-0)',
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
                        <span className="badge badge-amber">DRIVER ARRIVED</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--neutral-700)', fontWeight: 600 }}>
                        Driver: {rec.driverName} | Vehicle: <span className="mono">{rec.horseRegNo}</span>
                      </p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                        <span className="badge badge-success">🪪 License: {rec.driverLicenseNo || 'DL-850912-EC'} (VERIFIED)</span>
                        <span className="badge badge-teal">📋 Bilty #: {rec.biltyNo || 'BLT-770101'}</span>
                      </div>
                    </div>
                    <button 
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-dark'}`}
                      onClick={(e) => { e.stopPropagation(); handleSelectRecord(rec); }}
                    >
                      {isSelected ? 'Logging...' : 'Capture Weights'}
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
            title={`Weighbridge Logging — Waybill #${selectedRecord.waybillNo}`}
            style={{ border: '2px solid var(--accent-blue)', animation: 'slideUp 0.2s ease-out' }}
          >
            {/* Driver License Badge */}
            <div className="alert alert-success" style={{ marginBottom: '20px', padding: '10px 14px' }}>
              <ShieldCheck size={18} />
              <div>
                <strong>Driver License & PrDP Verified:</strong> {selectedRecord.driverName} ({selectedRecord.driverLicenseNo || 'DL-850912-EC'}) — License Valid
              </div>
            </div>

            <div className="data-grid-2" style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>DISPATCH TARE / EMPTY TRUCK (TONS)</label>
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

              <div className="form-group">
                <label>DISPATCH GROSS / LOADED TRUCK (TONS)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 55.25"
                  value={grossWeight}
                  onChange={(e) => setGrossWeight(e.target.value)}
                  className="form-input mono"
                  style={{ fontSize: '15px', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Calculations Panel */}
            {tareWeight && grossWeight && parseFloat(grossWeight) > parseFloat(tareWeight) && (
              <div 
                style={{ 
                  backgroundColor: 'var(--neutral-50)', 
                  border: '1px solid var(--neutral-200)', 
                  borderRadius: '10px', 
                  padding: '16px 20px', 
                  marginBottom: '20px', 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}
              >
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>CALCULATED NET PAYLOAD</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-blue)', margin: '2px 0 0 0' }}>
                    {(parseFloat(grossWeight) - parseFloat(tareWeight)).toFixed(2)} TON
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>
                    {Math.round((parseFloat(grossWeight) - parseFloat(tareWeight)) * 1000)} kg
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>TARGET PO VOL</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--neutral-800)', margin: '2px 0 0 0' }}>
                    {(purchaseOrders.find((po) => po.purchaseOrderNo === selectedRecord.poRef)?.targetQuantity || 30.0).toFixed(2)} TON
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
                className="btn btn-destructive"
              >
                Reject Dispatch
              </button>
              <button 
                onClick={() => handleLogWeights(true)}
                disabled={isSubmitting || !tareWeight || !grossWeight}
                className="btn btn-success"
                style={{ minWidth: '160px' }}
              >
                {isSubmitting ? 'Processing...' : 'Approve Pre-Dispatch'}
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Right Column: Gate Clearance Log */}
      <div>
        <Card title="Today's Pre-Dispatch Clearance Log">
          {completedLogs.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__body">No gate clearances logged today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {completedLogs.map((rec) => {
                const isApproved = rec.podStatus !== 'SUPERVISOR_REJECTED';
                const netTons = ((rec.dispatchNetWeightKg || rec.netWeightKg || 34150) / 1000).toFixed(2);

                return (
                  <div 
                    key={rec.waybillNo}
                    style={{
                      border: '1px solid var(--neutral-200)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      backgroundColor: 'var(--neutral-0)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>#{rec.waybillNo}</span>
                        <span className={`badge ${isApproved ? 'badge-success' : 'badge-error'}`}>
                          {isApproved ? 'DISPATCHED' : 'HELD'}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>
                        Vehicle: <span className="mono">{rec.horseRegNo}</span> | Net: <strong>{netTons} TON</strong>
                      </p>
                    </div>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>
                      {formatDate(rec.offloadDate)}
                    </span>
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
