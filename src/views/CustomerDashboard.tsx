import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { crApi, drApi, TransportAssignmentV3 } from '../lib/api_v3';
import { PackageCheck, ShieldCheck } from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const [incoming, setIncoming] = useState<TransportAssignmentV3[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TransportAssignmentV3 | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states (Weights & Exceptions)
  const [destGross, setDestGross] = useState('49850');
  const [destTare, setDestTare] = useState('15120');
  const [issues, setIssues] = useState('No damages detected');
  const [unitCalc, setUnitCalc] = useState('Convert 34730 kg to 34.73 TON');
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadIncoming = async () => {
    setLoading(true);
    setOtpVerified(false);
    try {
      const data = await crApi.getIncomingAssignments();
      setIncoming(data);
    } catch (err) {
      console.error('Failed to load incoming assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncoming();
  }, []);

  const handleCaptureDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      // 1. Log weights on dest weighbridge
      await drApi.logWeight(selectedAssignment.id, {
        stage: 'DEST_GROSS',
        weight_kg: parseFloat(destGross)
      });
      await drApi.logWeight(selectedAssignment.id, {
        stage: 'DEST_TARE',
        weight_kg: parseFloat(destTare)
      });

      // 2. Capture delivery parameters
      await crApi.captureDelivery(selectedAssignment.id, {
        truck_data: { gross: destGross, tare: destTare },
        issues,
        unit_calc: unitCalc
      });

      alert('Delivery parameters captured. Awaiting OTP verification.');
    } catch (err) {
      console.error('Failed to log delivery capture:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyDeliveryOTP = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await drApi.otpVerify(selectedAssignment.id, 'DELIVERY', otpCode);
      setOtpVerified(true);
      alert('Delivery OTP verification check passed.');
    } catch (err) {
      console.error('OTP check failed:', err);
      alert('Invalid OTP code for delivery stage');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStampConfirm = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await crApi.stampConfirm(selectedAssignment.id);
      setSelectedAssignment(null);
      setOtpCode('');
      setOtpVerified(false);
      loadIncoming();
      alert('Weighbridge stamp confirmed. Cargo accepted.');
    } catch (err) {
      console.error('Stamping failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader 
          title="Customer Receiving Yard Console"
          subtitle="Verify inbound outline shipments, log arrival weighbridge tare/gross metrics, and verify delivery signatures"
        />
        <button className="btn btn-ghost" onClick={loadIncoming} disabled={loading}>Refresh Queue</button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Loading deliveries...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
          
          {/* Incoming shipments lineup */}
          <Card title={`Active Inbound Cargo Lineup (${incoming.length})`}>
            {incoming.length === 0 ? (
              <EmptyState 
                icon={<PackageCheck size={48} />}
                title="Lineup is Empty"
                description="No outlined shipments are currently en route to your yard location."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incoming.map((a) => {
                  const isSelected = selectedAssignment?.id === a.id;
                  return (
                    <div 
                      key={a.id}
                      style={{
                        border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--neutral-200)',
                        borderRadius: '10px',
                        padding: '16px 20px',
                        backgroundColor: isSelected ? 'var(--neutral-100)' : '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedAssignment(a)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="mono" style={{ fontWeight: 800, color: 'var(--neutral-900)', fontSize: '15px' }}>
                            Assignment #{a.id}
                          </span>
                          <StatusBadge status={a.status} />
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--neutral-700)', fontWeight: 600, margin: 0 }}>
                          Driver: {a.driver_name || 'Carrier Driver'} | Vehicle: {a.vehicle_reg}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--neutral-500)', margin: '4px 0 0 0' }}>
                          Product: {a.material} (PO #{a.sap_po_no})
                        </p>
                      </div>
                      <button className="btn btn-dark btn-sm">Capture Offload</button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Capture Offload form panel */}
          <div>
            {selectedAssignment ? (
              <Card title={`Offload Console: Run #${selectedAssignment.id}`} accentColor="var(--accent-blue)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Step 1: Capture offload parameters */}
                  <form onSubmit={handleCaptureDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Step 1: Capture offload weights</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>Dest Gross (kg)</label>
                        <input 
                          type="number" 
                          value={destGross} 
                          onChange={e => setDestGross(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>Dest Tare (kg)</label>
                        <input 
                          type="number" 
                          value={destTare} 
                          onChange={e => setDestTare(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>Offload Exception Notes</label>
                      <input 
                        type="text" 
                        value={issues} 
                        onChange={e => setIssues(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>Unit Calculation notes</label>
                      <input 
                        type="text" 
                        value={unitCalc} 
                        onChange={e => setUnitCalc(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
                      />
                    </div>

                    <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
                      Capture Delivery weights
                    </button>
                  </form>

                  {/* Step 2: OTP Verification replaces Signature */}
                  <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Step 2: Delivery OTP Verification</h4>
                    <p style={{ fontSize: '12px', color: 'var(--neutral-500)', margin: 0 }}>
                      Verify the OTP code sent to the driver console. Replacing manual signatures for audit integrity.
                    </p>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        value={otpCode} 
                        onChange={e => setOtpCode(e.target.value)}
                        placeholder="e.g. 3410"
                        style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-dark"
                        onClick={handleVerifyDeliveryOTP}
                        disabled={isSubmitting || !otpCode}
                      >
                        Verify OTP
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Confirm stamp */}
                  <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
                    <button 
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={handleStampConfirm}
                      disabled={isSubmitting || !otpVerified}
                    >
                      Confirm stamp & Close offload
                    </button>
                  </div>

                </div>
              </Card>
            ) : (
              <Card title="Offload Inspector">
                <p style={{ fontSize: '13px', color: 'var(--neutral-500)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                  Select an en-route shipment lineup card to verify weight logs, enter OTP codes, and confirm outward stamps.
                </p>
              </Card>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
