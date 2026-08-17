import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { assignmentsApi, srApi, drApi, caApi, TransportAssignmentV3, ReviewQueueItemV3 } from '../lib/api_v3';
import { ShieldCheck, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const SupervisorDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<TransportAssignmentV3[]>([]);
  const [reviews, setReviews] = useState<ReviewQueueItemV3[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TransportAssignmentV3 | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [licenseValid, setLicenseValid] = useState(true);
  const [prdpValid, setPrdpValid] = useState(true);
  const [biltyValid, setBiltyValid] = useState(true);
  const [materialMatch, setMaterialMatch] = useState(true);
  
  const [weightKg, setWeightKg] = useState('15200');
  const [weighStage, setWeighStage] = useState<'MINE_TARE' | 'MINE_GROSS'>('MINE_TARE');
  const [otpCode, setOtpCode] = useState('');
  
  const [biltyNo, setBiltyNo] = useState('BLT-778899');
  const [biltyDate, setBiltyDate] = useState('2026-08-14');
  const [uploadUrl, setUploadUrl] = useState('/uploads/bilty/blt_778899.pdf');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await assignmentsApi.list();
      setAssignments(list);
      const openReviews = await caApi.getReviewQueue('OPEN');
      setReviews(openReviews);
    } catch (err) {
      console.error('Failed to load supervisor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      // 1. Submit checks
      await srApi.supervisorCheck(selectedAssignment.id, {
        arrival_date: new Date().toISOString().split('T')[0],
        arrival_time: new Date().toLocaleTimeString(),
        weight_check_bool: true,
        bilty_check_bool: biltyValid,
        material_check_bool: materialMatch,
        license_check_bool: licenseValid
      });

      // 2. Perform Gate check
      await srApi.gateCheck(selectedAssignment.id, {
        license_valid: licenseValid,
        prdp_valid: prdpValid,
        bilty_valid: biltyValid,
        material_match: materialMatch
      });

      loadData();
      setSelectedAssignment(null);
    } catch (err) {
      console.error('Gate check failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogWeight = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await drApi.logWeight(selectedAssignment.id, {
        stage: weighStage,
        weight_kg: parseFloat(weightKg),
        truck_detail: 'Weighbridge Gate 01 horse-trailer scale'
      });
      loadData();
      setSelectedAssignment(null);
    } catch (err) {
      console.error('Failed to log weight:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupervisorStamp = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      // Confirm OTP first
      await drApi.otpVerify(selectedAssignment.id, 'PICKUP', otpCode);
      
      // Submit stamp
      await srApi.stampAssignment(selectedAssignment.id, {
        gps_lat: -25.7670,
        gps_lng: 29.4630,
        otp_match_bool: true,
        bilty_no: biltyNo,
        bilty_date: biltyDate,
        upload_url: uploadUrl
      });
      loadData();
      setSelectedAssignment(null);
      setOtpCode('');
    } catch (err) {
      console.error('Failed to stamp assignment:', err);
      alert('OTP mismatch or verification error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader 
          title="Pre-Dispatch Weighbridge Gate Console"
          subtitle="Emoyeni Siding Gate 01 — Verify licenses, log siding weights, and stamp outward dispatches"
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          {reviews.length > 0 && (
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px', 
              backgroundColor: 'var(--error-50)', border: '1px solid var(--error-100)', 
              color: 'var(--error-600)', padding: '6px 12px', borderRadius: '8px', 
              fontSize: '12px', fontWeight: 700 
            }}>
              <AlertTriangle size={14} />
              {reviews.length} Flagged Reviews Open
            </span>
          )}
          <button className="btn btn-ghost" onClick={loadData} disabled={loading}>Refresh Queue</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Loading arrivals...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
          
          {/* Active assignments table */}
          <Card title="Siding Active Logistics Lineup">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Driver / Vehicle</th>
                    <th>Date Scheduled</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => {
                    const isSelected = selectedAssignment?.id === a.id;
                    return (
                      <tr 
                        key={a.id}
                        onClick={() => setSelectedAssignment(a)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--neutral-100)' : 'transparent'
                        }}
                      >
                        <td className="mono" style={{ fontWeight: 700 }}>#{a.id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{a.driver_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>{a.vehicle_reg}</div>
                        </td>
                        <td>{a.scheduled_date}</td>
                        <td>
                          <StatusBadge status={a.status} />
                        </td>
                        <td>
                          <button className="btn btn-dark btn-sm">Capture</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right Column: Execution Form dependent on assignment status */}
          <div>
            {selectedAssignment ? (
              <Card title={`Dispatch Step: Assignment #${selectedAssignment.id}`} accentColor="var(--accent-blue)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Step 1: Gate Check / Pre-Check (ASSIGNED status) */}
                  {selectedAssignment.status === 'ASSIGNED' && (
                    <form onSubmit={handleGateCheck} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Driver gate compliance verification</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={licenseValid} onChange={e => setLicenseValid(e.target.checked)} />
                          <span style={{ fontSize: '13px' }}>Driver License Valid Check</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={prdpValid} onChange={e => setPrdpValid(e.target.checked)} />
                          <span style={{ fontSize: '13px' }}>PrDP permit validation check</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={biltyValid} onChange={e => setBiltyValid(e.target.checked)} />
                          <span style={{ fontSize: '13px' }}>Pre-consignment bilty documentation match</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={materialMatch} onChange={e => setMaterialMatch(e.target.checked)} />
                          <span style={{ fontSize: '13px' }}>Material specification match (outline vs loaded)</span>
                        </label>
                      </div>

                      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        Submit Gate Pre-check
                      </button>
                    </form>
                  )}

                  {/* Step 2: Weight Logging (MINE_TARE_LOGGED to MINE_GROSS_LOGGED) */}
                  {selectedAssignment.status === 'MINE_TARE_LOGGED' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Weighbridge log values</h4>
                                            <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>Weighbridge Stage</label>
                        <select 
                          value={weighStage} 
                          onChange={e => setWeighStage(e.target.value as any)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px', backgroundColor: '#fff' }}
                        >
                          <option value="MINE_TARE">Mine Tare (Empty Horse Trailer)</option>
                          <option value="MINE_GROSS">Mine Gross (Loaded Consignment)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>Weight (kg)</label>
                        <input 
                          type="number" 
                          value={weightKg} 
                          onChange={e => setWeightKg(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
                        />
                      </div>

                      <div style={{ backgroundColor: 'var(--neutral-50)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px' }}>
                        <p style={{ margin: 0, fontWeight: 700 }}>IP Address Captured Server-side: <span className="mono">Captured on POST</span></p>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>OTP Code from Driver Console</label>
                        <input 
                          type="text" 
                          value={otpCode} 
                          onChange={e => setOtpCode(e.target.value)}
                          placeholder="e.g. 9827"
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>Bilty No</label>
                        <input 
                          type="text" 
                          value={biltyNo} 
                          onChange={e => setBiltyNo(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>Bilty Date</label>
                        <input 
                          type="date" 
                          value={biltyDate} 
                          onChange={e => setBiltyDate(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
                        />
                      </div>

                      <button className="btn btn-primary" onClick={handleSupervisorStamp} disabled={isSubmitting}>
                        Stamp & Dispatch Run
                      </button>
                    </div>
                  )}

                  {/* Fallback for already dispatched stages */}
                  {(selectedAssignment.status === 'DISPATCHED' || selectedAssignment.status === 'EN_ROUTE' || selectedAssignment.status === 'ARRIVED' || selectedAssignment.status === 'DELIVERED') && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <CheckCircle2 size={32} color="var(--success-600)" style={{ margin: '0 auto 12px auto' }} />
                      <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Run Cleared Out of Mine Siding</p>
                      <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '4px' }}>
                        This assignment has transitioned to the transport transit/delivery cycle.
                      </p>
                    </div>
                  )}

                </div>
              </Card>
            ) : (
              <Card title="Lineup Inspector">
                <p style={{ fontSize: '13px', color: 'var(--neutral-500)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                  Select a haulage run from the lining list on the left to capture weighing logs, verify compliance, or confirm driver OTP signatures.
                </p>
              </Card>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
