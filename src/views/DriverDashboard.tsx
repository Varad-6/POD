import React, { useState, useEffect, useRef } from 'react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { drApi, TransportAssignmentV3 } from '../lib/api_v3';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Truck, MapPin, CheckCircle2, Upload, AlertTriangle, Key } from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { user } = useAuthV3();
  const [assignments, setAssignments] = useState<TransportAssignmentV3[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TransportAssignmentV3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP details
  const [otpCode, setOtpCode] = useState('');
  const [otpStage, setOtpStage] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');

  // Weighbridge log input
  const [weighStage, setWeighStage] = useState<'MINE_TARE' | 'MINE_GROSS' | 'DEST_GROSS' | 'DEST_TARE'>('MINE_TARE');
  const [weightKg, setWeightKg] = useState('15000');

  // GPS Tracking states
  const [trackingActive, setTrackingActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // POD Upload simulated file
  const [selectedPodFile, setSelectedPodFile] = useState('/uploads/pod/pod_9.jpg');
  const [ocrResult, setOcrResult] = useState<any>(null);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await drApi.getMineAssignments();
      setAssignments(data);
      if (data.length > 0) {
        setSelectedAssignment(data[0]);
      }
    } catch (err) {
      console.error('Failed to load driver assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Generate OTP
  const handleGenerateOTP = async (stage: 'PICKUP' | 'DELIVERY') => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      const res = await drApi.otpGenerate(selectedAssignment.id, stage);
      setOtpCode(res.otp_code);
      setOtpStage(stage);
      alert(`OTP code generated successfully: ${res.otp_code}. Provide this code to the supervisor/receiving yard.`);
    } catch (err) {
      console.error('Failed to generate OTP:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Log weight
  const handleWeightLog = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await drApi.logWeight(selectedAssignment.id, {
        stage: weighStage,
        weight_kg: parseFloat(weightKg),
        truck_detail: 'Driver console self log'
      });
      loadAssignments();
      alert('Weight log registered successfully.');
    } catch (err) {
      console.error('Failed to log weight:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch Position (Transit events)
  const toggleTracking = () => {
    if (trackingActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setTrackingActive(false);
      setGpsCoords(null);
    } else {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      setTrackingActive(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setGpsCoords({ lat, lng });
          
          // Log en route transit event
          if (selectedAssignment) {
            drApi.logTransitEvent(selectedAssignment.id, {
              status: 'EN_ROUTE',
              gps_lat: lat,
              gps_lng: lng
            }).catch(err => console.error('Transit event sync failed:', err));
          }
        },
        (err) => {
          console.error('GPS Watch error:', err);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Confirm Arrival
  const handleConfirmArrival = () => {
    if (!selectedAssignment) return;
    if (!navigator.geolocation) {
      alert('Geolocation not supported.');
      return;
    }

    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await drApi.confirmArrival(selectedAssignment.id, {
            gps_lat: pos.coords.latitude,
            gps_lng: pos.coords.longitude
          });
          alert(res.message + ` IP Captured: ${res.ip_captured}`);
          loadAssignments();
        } catch (err) {
          console.error('Arrival check failed:', err);
          alert('Could not confirm arrival check.');
        } finally {
          setIsSubmitting(false);
        }
      },
      (err) => {
        console.error('GPS error:', err);
        setIsSubmitting(false);
        alert('Please enable GPS to confirm arrival location.');
      }
    );
  };

  // POD upload
  const handlePodSubmit = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    setOcrResult(null);
    try {
      const res = await drApi.uploadPod(selectedAssignment.id, {
        pod_file_url: selectedPodFile
      });
      setOcrResult(res);
      loadAssignments();
      alert('POD document uploaded & processed by OCR parser.');
    } catch (err) {
      console.error('POD submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Mobile Task-First Header */}
      <div style={{ backgroundColor: 'var(--brand-purple)', borderRadius: '16px', padding: '20px 24px', color: '#FFFFFF', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              MOBILE DRIVER HAULAGE CONSOLE
            </span>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: '2px 0 0 0' }}>
              Today's Assigned Route
            </h1>
          </div>
          <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
            Truck #{user?.entityId || 'KV44RCGP'}
          </span>
        </div>

        {/* Task Execution Stepper */}
        {selectedAssignment && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '10px 12px', borderRadius: '10px', fontSize: '11px', textAlign: 'center' }}>
            <div style={{ color: '#FFFFFF', fontWeight: 700 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>STAGE 1</div>
              <span>Assigned</span>
            </div>
            <div style={{ color: ['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED'].includes(selectedAssignment.status) ? '#10B981' : 'rgba(255, 255, 255, 0.4)', fontWeight: 700 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>STAGE 2</div>
              <span>In Transit</span>
            </div>
            <div style={{ color: ['ARRIVED', 'DELIVERED'].includes(selectedAssignment.status) ? '#10B981' : 'rgba(255, 255, 255, 0.4)', fontWeight: 700 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>STAGE 3</div>
              <span>At Yard</span>
            </div>
            <div style={{ color: selectedAssignment.status === 'DELIVERED' ? '#10B981' : 'rgba(255, 255, 255, 0.4)', fontWeight: 700 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>STAGE 4</div>
              <span>Offloaded</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Loading haulage tasks...</div>
      ) : assignments.length === 0 ? (
        <EmptyState 
          icon={<Truck size={48} />}
          title="No Haulage Assignments"
          description="You do not have any transport assignments scheduled for today."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Assignments selector */}
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
            {assignments.map(a => (
              <button
                key={a.id}
                onClick={() => { setSelectedAssignment(a); setOcrResult(null); }}
                style={{
                  padding: '14px 20px',
                  borderRadius: '12px',
                  border: selectedAssignment?.id === a.id ? '2px solid var(--brand-purple)' : '1px solid var(--neutral-200)',
                  backgroundColor: selectedAssignment?.id === a.id ? 'var(--brand-purple-light)' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  flexShrink: 0,
                  minWidth: '240px',
                  minHeight: '64px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="mono" style={{ fontWeight: 800 }}>Assignment #{a.id}</span>
                  <StatusBadge status={a.status} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-900)' }}>{a.material}</div>
                <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>PO #{a.sap_po_no}</div>
              </button>
            ))}
          </div>

          {selectedAssignment && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Left Column: Details & GPS Tracking */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Card title="Assignment Execution Details">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Consignment Route</span>
                      <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600 }}>{selectedAssignment.from_location} → {selectedAssignment.to_location}</p>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Material Type</span>
                      <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600 }}>{selectedAssignment.material}</p>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Vehicle Horse Trailer</span>
                      <p className="mono" style={{ margin: 0, fontSize: '13.5px', fontWeight: 700 }}>{selectedAssignment.vehicle_reg || 'N/A'}</p>
                    </div>
                  </div>
                </Card>

                <Card title="Live Journey Telemetry & GPS Tracking">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <p style={{ fontSize: '12.5px', color: 'var(--neutral-600)', margin: 0 }}>
                      Initiating journey automatically turns ON live GPS telemetry pings to SAP S/4HANA Control Tower.
                    </p>

                    <button 
                      onClick={toggleTracking} 
                      className={`btn ${trackingActive ? 'btn-danger' : 'btn-primary'}`}
                      style={{ padding: '14px 18px', fontSize: '14px', fontWeight: 800, width: '100%', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {trackingActive ? 'STOP JOURNEY TELEMETRY' : 'START JOURNEY & LIVE GPS'}
                    </button>

                    {trackingActive && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0FDF4', border: '1px solid #10B981', padding: '12px 14px', borderRadius: '8px', fontSize: '12.5px', color: '#065F46' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                          <span className="pulse-dot pulse-dot--active" />
                          <span>LIVE GPS TELEMETRY ACTIVE</span>
                        </div>
                        <span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>
                          {gpsCoords ? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'Acquiring Fix...'}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Arrived Confirmation Check */}
                {['DISPATCHED', 'EN_ROUTE'].includes(selectedAssignment.status) && (
                  <Card title="Destination Arrival Confirmation">
                    <button 
                      onClick={handleConfirmArrival}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      disabled={isSubmitting}
                    >
                      Verify Arrival Location (GPS & IP check)
                    </button>
                  </Card>
                )}
              </div>

              {/* Right Column: OTP Code generation & POD Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Card title="OTP Code Generation (Audit Proof)">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <p style={{ fontSize: '12.5px', color: 'var(--neutral-500)', margin: 0 }}>
                      Generate verification OTP codes to substitute manual signature validation checks.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button 
                        onClick={() => handleGenerateOTP('PICKUP')} 
                        className="btn btn-dark btn-sm"
                        disabled={isSubmitting}
                      >
                        Generate Pickup OTP
                      </button>
                      <button 
                        onClick={() => handleGenerateOTP('DELIVERY')} 
                        className="btn btn-dark btn-sm"
                        disabled={isSubmitting}
                      >
                        Generate Delivery OTP
                      </button>
                    </div>

                    {otpCode && (
                      <div style={{ textAlign: 'center', backgroundColor: 'var(--neutral-50)', padding: '16px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Active {otpStage} OTP</span>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '0.1em', marginTop: '4px' }}>
                          {otpCode}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* POD Slip upload */}
                {['ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW'].includes(selectedAssignment.status) && (
                  <Card title="Submit Proof of Delivery (POD)">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, marginBottom: '6px' }}>Select Waybill slip image file</label>
                        <select 
                          value={selectedPodFile} 
                          onChange={e => setSelectedPodFile(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px', backgroundColor: '#fff' }}
                        >
                          <option value="/uploads/pod/pod_10.jpg">WB-4500012350 (Exact Matching Demo)</option>
                          <option value="/uploads/pod/pod_9.jpg">WB-887711 (Discrepancy / Mismatch Demo)</option>
                        </select>
                      </div>

                      <button 
                        onClick={handlePodSubmit} 
                        className="btn btn-dark" 
                        disabled={isSubmitting}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <Upload size={14} />
                        Upload Waybill Slip
                      </button>

                      {ocrResult && (
                        <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '8px', border: '1px solid var(--neutral-200)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700 }}>OCR PARSER TARGET RESULTS</span>
                          <div style={{ fontSize: '13px' }}>
                            <p style={{ margin: '2px 0' }}>Waybill Extracted: <strong>{ocrResult.ocr?.ocr_waybill_extracted}</strong></p>
                            <p style={{ margin: '2px 0' }}>Weight Extracted: <strong>{ocrResult.ocr?.ocr_weight_extracted} Tons</strong></p>
                            <p style={{ margin: '2px 0' }}>Confidence: <strong>{ocrResult.ocr?.ocr_confidence_pct}%</strong></p>
                            <p style={{ margin: '2px 0' }}>Match Status: <strong style={{ color: ocrResult.ocr?.match_status === 'MATCH' ? 'var(--success-600)' : 'var(--error-600)' }}>{ocrResult.ocr?.match_status}</strong></p>
                          </div>
                          {ocrResult.under_review && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error-600)', fontSize: '12px', fontWeight: 600 }}>
                              <AlertTriangle size={14} />
                              <span>Discrepancy detected. Flagged in review queue.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
