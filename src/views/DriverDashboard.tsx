import React, { useState, useEffect, useRef } from 'react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { drApi, TransportAssignmentV3 } from '../lib/api_v3';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { PodzoLogo } from '../components/branding/PodzoLogo';
import {
  Truck, MapPin, CheckCircle2, Upload, AlertTriangle, Key,
  Navigation, Package, Clock, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';

// ─── Step indicator ───────────────────────────────────────────────────────────
const JourneyStep: React.FC<{ num: number; label: string; done: boolean; active: boolean }> = ({ num, label, done, active }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: done ? '#10B981' : active ? 'var(--brand-purple)' : '#E2E8F0',
      color: done || active ? '#fff' : '#94A3B8',
      fontWeight: 800, fontSize: '13px',
      boxShadow: active ? '0 0 0 4px rgba(139,92,246,0.2)' : 'none',
      transition: 'all 0.3s'
    }}>
      {done ? <CheckCircle2 size={16} /> : num}
    </div>
    <span style={{ fontSize: '10px', fontWeight: 600, color: done ? '#059669' : active ? 'var(--brand-purple)' : '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  </div>
);

const StepConnector: React.FC<{ done: boolean }> = ({ done }) => (
  <div style={{ flex: 1, height: '2px', backgroundColor: done ? '#10B981' : '#E2E8F0', marginBottom: '16px', transition: 'background-color 0.3s' }} />
);

// ─── Section card ─────────────────────────────────────────────────────────────
const ActionCard: React.FC<{ title: string; subtitle?: string; icon: React.ReactNode; locked?: boolean; children: React.ReactNode; accentColor?: string }> = ({ title, subtitle, icon, locked, children, accentColor = '#6366F1' }) => (
  <div style={{
    backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0',
    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    opacity: locked ? 0.45 : 1, transition: 'opacity 0.3s',
    pointerEvents: locked ? 'none' : 'auto'
  }}>
    <div style={{
      padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
      display: 'flex', alignItems: 'center', gap: '12px',
      borderLeft: `4px solid ${locked ? '#E2E8F0' : accentColor}`
    }}>
      <div style={{ color: locked ? '#CBD5E1' : accentColor }}>{icon}</div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: locked ? '#94A3B8' : '#0F172A' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>{subtitle}</div>}
      </div>
      {locked && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', backgroundColor: '#F8FAFC', padding: '3px 8px', borderRadius: '4px' }}>Locked</span>}
    </div>
    <div style={{ padding: '20px' }}>
      {children}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const DriverDashboard: React.FC = () => {
  const { user } = useAuthV3();
  const [assignments, setAssignments] = useState<TransportAssignmentV3[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TransportAssignmentV3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS
  const [trackingActive, setTrackingActive] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // OTP
  const [pickupOtp, setPickupOtp] = useState('');
  const [deliveryOtp, setDeliveryOtp] = useState('');

  // POD
  const [selectedPodFile, setSelectedPodFile] = useState('/uploads/pods/pod_sample.png');
  const [ocrResult, setOcrResult] = useState<any>(null);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await drApi.getMineAssignments();
      setAssignments(data);
      if (data.length > 0) {
        if (selectedAssignment) {
          const updated = data.find(a => a.id === selectedAssignment.id);
          if (updated) setSelectedAssignment(updated);
          else setSelectedAssignment(data[0]);
        } else {
          setSelectedAssignment(data[0]);
        }
      } else {
        setSelectedAssignment(null);
      }
    } catch (err) {
      console.error('Failed to load driver assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  // Derive journey stage from status
  const getJourneyStage = (status: string) => {
    if (['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(status)) return 2; // On My Way / Arrived
    if (['ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW'].includes(status)) return 3;
    if (['DELIVERED', 'POD_UPLOADED'].includes(status)) return 4;
    return 1; // ASSIGNED = At Loading Siding
  };

  const s = selectedAssignment;
  const isEnRoute = s && ['DISPATCHED', 'EN_ROUTE'].includes(s.status);
  const isArrived = s && ['ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(s.status);
  const canUploadPod = s && ['ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW'].includes(s.status);

  const handleStartTrip = () => {
    if (!s) return;
    if (!navigator.geolocation) { alert('GPS not available.'); return; }
    setTrackingActive(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsCoords({ lat, lng });
        drApi.logTransitEvent(s.id, { status: 'EN_ROUTE', gps_lat: lat, gps_lng: lng })
          .catch(err => console.error('Transit sync failed:', err));
      },
      () => { alert('Please enable GPS.'); setTrackingActive(false); },
      { enableHighAccuracy: true }
    );
  };

  const handleStopTrip = () => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    setTrackingActive(false);
    setGpsCoords(null);
  };

  const handleGenerateOTP = async (stage: 'PICKUP' | 'DELIVERY') => {
    if (!s) return;
    setIsSubmitting(true);
    try {
      const res = await drApi.otpGenerate(s.id, stage);
      if (stage === 'PICKUP') setPickupOtp(res.otp_code);
      else setDeliveryOtp(res.otp_code);
    } catch (err) {
      console.error('OTP generate failed:', err);
      alert('Failed to generate code. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmArrival = () => {
    if (!s) return;
    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await drApi.confirmArrival(s.id, { gps_lat: pos.coords.latitude, gps_lng: pos.coords.longitude });
          handleStopTrip();
          await loadAssignments();
        } catch (err) {
          alert('Could not confirm arrival. Check your GPS and try again.');
        } finally {
          setIsSubmitting(false);
        }
      },
      () => { setIsSubmitting(false); alert('Please enable GPS to confirm arrival.'); }
    );
  };

  const handlePodSubmit = async () => {
    if (!s) return;
    setIsSubmitting(true);
    try {
      const res = await drApi.uploadPod(s.id, { pod_file_url: selectedPodFile });
      setOcrResult(res);
      await loadAssignments();
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Loading your trips...</div>;

  if (assignments.length === 0) return (
    <EmptyState icon={<Truck size={48} />} title="No Trips Today" description="You don't have any trips assigned yet." />
  );

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #7C3AED 100%)',
        borderRadius: '16px', padding: '24px 28px', color: '#fff',
        boxShadow: '0 8px 32px rgba(109,40,217,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '6px 12px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <PodzoLogo variant="compact" height={28} />
          </div>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
            {user?.displayName || 'Driver'}
          </div>
        </div>

        {/* Journey Progress Bar */}
        {s && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <JourneyStep num={1} label="At Siding" done={getJourneyStage(s.status) > 1} active={getJourneyStage(s.status) === 1} />
              <StepConnector done={getJourneyStage(s.status) > 1} />
              <JourneyStep num={2} label="Driving" done={getJourneyStage(s.status) > 2} active={getJourneyStage(s.status) === 2} />
              <StepConnector done={getJourneyStage(s.status) > 2} />
              <JourneyStep num={3} label="At Customer" done={getJourneyStage(s.status) > 3} active={getJourneyStage(s.status) === 3} />
              <StepConnector done={getJourneyStage(s.status) > 3} />
              <JourneyStep num={4} label="Delivered" done={s.status === 'DELIVERED' || s.status === 'POD_UPLOADED'} active={false} />
            </div>
          </div>
        )}
      </div>

      {/* ── Trip Selector (if multiple) ── */}
      {assignments.length > 1 && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {assignments.map(a => (
            <button
              key={a.id}
              onClick={() => { setSelectedAssignment(a); setOcrResult(null); setPickupOtp(''); setDeliveryOtp(''); }}
              style={{
                flexShrink: 0, padding: '12px 18px', borderRadius: '10px', cursor: 'pointer',
                border: s?.id === a.id ? '2px solid var(--brand-purple)' : '1px solid #E2E8F0',
                backgroundColor: s?.id === a.id ? 'rgba(109,40,217,0.07)' : '#fff',
                textAlign: 'left', minWidth: '200px'
              }}
            >
              <div className="mono" style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>PO #{a.sap_po_no}</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{a.material} · {a.vehicle_reg}</div>
            </button>
          ))}
        </div>
      )}

      {s && (
        <>
          {/* ── PO Info Banner ── */}
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0',
            padding: '20px 24px', display: 'flex', gap: '24px', flexWrap: 'wrap',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Purchase Order</div>
              <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>PO #{s.sap_po_no}</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cargo</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{s.material}</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>My Truck</div>
              <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{s.vehicle_reg || '—'}</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
              <StatusBadge status={s.status} />
            </div>
          </div>

          {/* Route */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '14px 20px' }}>
            <MapPin size={14} color="#10B981" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{s.from_location || 'MON1 Plant / Siding'}</span>
            <ArrowRight size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{s.to_location || 'PODZO Mining – Emoyeni Siding'}</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#64748B' }}>{s.scheduled_date}</span>
          </div>

          {/* ── STEP 1: Get Pickup Code ── */}
          <ActionCard
            title="Step 1 — Get Pickup Code (OTP)"
            subtitle="Get a secret 4-digit code. Give it to the supervisor at the loading siding."
            icon={<Key size={18} />}
            accentColor="#F59E0B"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button
                onClick={() => handleGenerateOTP('PICKUP')}
                disabled={isSubmitting}
                style={{
                  padding: '14px 20px', backgroundColor: '#FEF3C7', color: '#92400E',
                  border: '1px solid #FCD34D', borderRadius: '10px', fontSize: '14px',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Key size={16} /> Get Pickup Code (OTP)
              </button>

              {pickupOtp && (
                <div style={{
                  textAlign: 'center', backgroundColor: '#FFFBEB', border: '2px dashed #F59E0B',
                  borderRadius: '12px', padding: '20px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', marginBottom: '8px' }}>
                    🔑 Your Pickup Code (show this to the supervisor)
                  </div>
                  <div className="mono" style={{ fontSize: '48px', fontWeight: 900, color: '#92400E', letterSpacing: '0.15em' }}>
                    {pickupOtp}
                  </div>
                </div>
              )}
            </div>
          </ActionCard>

          {/* ── STEP 2: Start Trip & GPS ── */}
          <ActionCard
            title="Step 2 — Start Your Journey"
            subtitle="Tap Start Trip to turn on GPS tracking. The siding can see where your truck is."
            icon={<Navigation size={18} />}
            accentColor="#6366F1"
          >
            {!trackingActive ? (
              <button
                onClick={handleStartTrip}
                style={{
                  width: '100%', padding: '18px 20px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontSize: '16px', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.35)'
                }}
              >
                <Navigation size={20} /> START TRIP & TURN ON GPS
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: '#F0FDF4', border: '1px solid #10B981',
                  borderRadius: '10px', padding: '14px 18px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, color: '#065F46' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                    GPS IS ON — Tracking your trip
                  </div>
                  <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>
                    {gpsCoords ? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'Getting location...'}
                  </span>
                </div>

                <button
                  onClick={handleStopTrip}
                  style={{
                    width: '100%', padding: '12px', backgroundColor: '#FEF2F2',
                    color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: '10px',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Stop GPS Tracking
                </button>
              </div>
            )}
          </ActionCard>

          {/* ── STEP 3: Confirm Arrival ── */}
          <ActionCard
            title="Step 3 — Confirm I Have Arrived"
            subtitle="When you reach the customer's yard, tap here. Your GPS location is recorded."
            icon={<MapPin size={18} />}
            accentColor="#10B981"
            locked={!isEnRoute && s.status !== 'ASSIGNED'}
          >
            <button
              onClick={handleConfirmArrival}
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '16px 20px',
                backgroundColor: isArrived ? '#D1FAE5' : '#ECFDF5',
                color: isArrived ? '#065F46' : '#047857',
                border: `2px solid ${isArrived ? '#10B981' : '#6EE7B7'}`,
                borderRadius: '12px', fontSize: '15px', fontWeight: 800,
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}
            >
              {isArrived ? <><CheckCircle2 size={18} /> Arrived — Confirmed!</> : 'Verify I Have Arrived (uses GPS)'}
            </button>
          </ActionCard>

          {/* ── STEP 4: Get Delivery Code ── */}
          <ActionCard
            title="Step 4 — Get Delivery Code (OTP)"
            subtitle="Get a second secret code. Give it to the customer at the unloading yard."
            icon={<Key size={18} />}
            accentColor="#8B5CF6"
            locked={!isArrived}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button
                onClick={() => handleGenerateOTP('DELIVERY')}
                disabled={isSubmitting}
                style={{
                  padding: '14px 20px', backgroundColor: '#EDE9FE', color: '#5B21B6',
                  border: '1px solid #C4B5FD', borderRadius: '10px', fontSize: '14px',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Key size={16} /> Get Delivery Code (OTP)
              </button>

              {deliveryOtp && (
                <div style={{
                  textAlign: 'center', backgroundColor: '#F5F3FF', border: '2px dashed #8B5CF6',
                  borderRadius: '12px', padding: '20px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#5B21B6', textTransform: 'uppercase', marginBottom: '8px' }}>
                    🔑 Your Delivery Code (show to customer)
                  </div>
                  <div className="mono" style={{ fontSize: '48px', fontWeight: 900, color: '#5B21B6', letterSpacing: '0.15em' }}>
                    {deliveryOtp}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#8B5CF6', marginTop: '8px' }}>
                    Secret DELIVERY Code
                  </div>
                </div>
              )}
            </div>
          </ActionCard>

          {/* ── STEP 5: Upload POD ── */}
          {canUploadPod && (
            <ActionCard
              title="Step 5 — Upload Delivery Receipt (POD)"
              subtitle="Take a photo of the stamped receipt and upload it here."
              icon={<Upload size={18} />}
              accentColor="#0EA5E9"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Choose receipt file
                  </label>
                  <select
                    value={selectedPodFile}
                    onChange={e => setSelectedPodFile(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: '#F8FAFC' }}
                  >
                    <option value="/uploads/pods/pod_sample.png">pod_sample.png — PO #4500001715 (34.62 Tons)</option>
                    <option value="/uploads/pod/pod_10.jpg">WB-4500012350 — Exact Match Demo</option>
                    <option value="/uploads/pod/pod_9.jpg">WB-887711 — Mismatch Demo</option>
                  </select>
                </div>

                <button
                  onClick={handlePodSubmit}
                  disabled={isSubmitting}
                  style={{
                    padding: '14px 20px', backgroundColor: '#0EA5E9', color: '#fff',
                    border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'
                  }}
                >
                  <Upload size={16} /> Upload Receipt File
                </button>

                {ocrResult && (
                  <div style={{ backgroundColor: '#F0F9FF', borderRadius: '10px', padding: '16px', border: '1px solid #BAE6FD' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Receipt Scan Results
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#64748B' }}>Bill Number</span>
                        <span className="mono" style={{ fontWeight: 700 }}>{ocrResult.ocr?.ocr_waybill_extracted || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#64748B' }}>Weight Read</span>
                        <span className="mono" style={{ fontWeight: 700 }}>{ocrResult.ocr?.ocr_weight_extracted || '—'} Tons</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#64748B' }}>Scan Quality</span>
                        <span style={{ fontWeight: 700 }}>{ocrResult.ocr?.ocr_confidence_pct || '—'}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid #BAE6FD', paddingTop: '8px', marginTop: '4px' }}>
                        <span style={{ color: '#64748B' }}>Matches SAP PO?</span>
                        <span style={{ fontWeight: 800, color: ocrResult.ocr?.match_status === 'MATCH' ? '#059669' : '#DC2626' }}>
                          {ocrResult.ocr?.match_status === 'MATCH' ? '✓ Yes, Matches' : '✗ No, Mismatch — Sent for Review'}
                        </span>
                      </div>
                    </div>
                    {ocrResult.under_review && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', padding: '10px 12px', color: '#991B1B', fontSize: '12px', fontWeight: 600 }}>
                        <AlertTriangle size={14} /> Weight difference found. Sent to company admin for checking.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ActionCard>
          )}
        </>
      )}
    </div>
  );
};
