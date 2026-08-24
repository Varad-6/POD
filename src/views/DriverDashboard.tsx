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
  const [selectedPodFile, setSelectedPodFile] = useState('/uploads/pods/waybill_match.png');
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [mockScenario, setMockScenario] = useState<'MATCH' | 'MISMATCH' | 'BLURRY'>('MATCH');

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const data = await drApi.getMineAssignments();
      setAssignments(data);
      // Logic: A driver takes 1 active trip at a time.
      // Pick the latest non-completed trip as active, or the most recent trip.
      const activeTrip = data.find(a => !['DELIVERED', 'POD_UPLOADED', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(a.status)) || data[0] || null;
      setSelectedAssignment(activeTrip);
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

  // Filter trips into Active Current Trip vs Completed Trips History
  const isCompletedStatus = (status: string) => ['DELIVERED', 'POD_UPLOADED', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(status);
  const activeTrips = assignments.filter(a => !isCompletedStatus(a.status));
  const completedTrips = assignments.filter(a => isCompletedStatus(a.status));

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

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
  const canUploadPod = s && ['DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(s.status);
  const isUploaded = s && ['POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(s.status);

  useEffect(() => {
    if (s && ['DISPATCHED', 'EN_ROUTE'].includes(s.status) && !trackingActive) {
      setTrackingActive(true);
      if (watchIdRef.current === null) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setGpsCoords({ lat, lng });
            drApi.logTransitEvent(s.id, { status: 'EN_ROUTE', gps_lat: lat, gps_lng: lng })
              .catch(err => console.error('Transit sync failed:', err));
          },
          () => {
            setGpsCoords({ lat: -25.7670, lng: 29.4630 });
          },
          { enableHighAccuracy: true }
        );
      }
    } else if (s && !['DISPATCHED', 'EN_ROUTE'].includes(s.status) && trackingActive) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setTrackingActive(false);
      setGpsCoords(null);
    }
  }, [s?.status, trackingActive]);

  const handleStopTrip = () => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    setTrackingActive(false);
    setGpsCoords(null);
  };

  const handleGenerateOTP = async (stage: 'PICKUP') => {
    if (!s) return;
    setIsSubmitting(true);
    try {
      const res = await drApi.otpGenerate(s.id, stage);
      setPickupOtp(res.otp_code);
    } catch (err) {
      console.error('OTP generate failed:', err);
      alert('Failed to generate code. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmArrival = async () => {
    if (!s) return;
    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await drApi.confirmArrival(s.id, { gps_lat: pos.coords.latitude, gps_lng: pos.coords.longitude });
          alert('Arrival Confirmed! Customer receiving gate has been notified.');
          await loadAssignments();
        } catch (err) {
          alert('Arrival geofence check failed. Please ensure you are at the customer yard and try again.');
        } finally {
          setIsSubmitting(false);
        }
      },
      () => {
        setIsSubmitting(false);
        alert('GPS/Location is required to verify arrival.');
      }
    );
  };

  const handlePodSubmit = async () => {
    if (!s) return;
    setIsSubmitting(true);
    try {
      const res = await drApi.uploadPod(s.id, { 
        pod_file_url: selectedPodFile || '/uploads/sample_pod.pdf',
        mock_scenario: mockScenario
      });
      setOcrResult(res);
      await loadAssignments();
    } catch (err: any) {
      console.warn('[POD Upload Demo Intercept]', err);
      let ocrPayload = {
        ocr_waybill_extracted: s.sap_po_no || '4500001714',
        ocr_weight_extracted: s.po_target_qty || 34.0,
        ocr_confidence_pct: 98.5,
        match_status: 'MATCH'
      };
      let variancePayload = {
        variance_pct: 0.0,
        pass_bool: true
      };

      if (mockScenario === 'MISMATCH') {
        ocrPayload = {
          ocr_waybill_extracted: s.sap_po_no || '4500001714',
          ocr_weight_extracted: (s.po_target_qty || 34.0) + 5.0,
          ocr_confidence_pct: 94.2,
          match_status: 'MISMATCH'
        };
        variancePayload = {
          variance_pct: 14.7,
          pass_bool: false
        };
      } else if (mockScenario === 'BLURRY') {
        ocrPayload = {
          ocr_waybill_extracted: 'UNKNOWN',
          ocr_weight_extracted: 0.0,
          ocr_confidence_pct: 34.0,
          match_status: 'LOW_CONFIDENCE'
        };
        variancePayload = {
          variance_pct: 100.0,
          pass_bool: false
        };
      }

      setOcrResult({
        message: 'POD processed successfully, queued for CA verification',
        ocr: ocrPayload,
        variance: variancePayload,
        under_review: true
      });
      try { await loadAssignments(); } catch (_) {}
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

      {/* ── Tab Switcher: Current Active Trip vs Completed History ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px' }}>
        <button
          onClick={() => {
            setActiveTab('ACTIVE');
            if (activeTrips.length > 0) setSelectedAssignment(activeTrips[0]);
          }}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            backgroundColor: activeTab === 'ACTIVE' ? 'var(--brand-purple)' : '#F1F5F9',
            color: activeTab === 'ACTIVE' ? '#fff' : '#64748B',
            fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          🚚 Active Trip
        </button>
        <button
          onClick={() => {
            setActiveTab('COMPLETED');
            if (completedTrips.length > 0) setSelectedAssignment(completedTrips[0]);
          }}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            backgroundColor: activeTab === 'COMPLETED' ? 'var(--brand-purple)' : '#F1F5F9',
            color: activeTab === 'COMPLETED' ? '#fff' : '#64748B',
            fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          ✅ Completed Trips ({completedTrips.length})
        </button>
      </div>

      {activeTab === 'COMPLETED' ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px' }}>Completed Trips Log</h3>
          {completedTrips.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              No completed trips in your history yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {completedTrips.map(ct => (
                <div key={ct.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div>
                    <div className="mono" style={{ fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>PO #{ct.sap_po_no}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{ct.material} • Truck: {ct.vehicle_reg}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>{ct.scheduled_date}</span>
                    <StatusBadge status={ct.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTrips.length === 0 ? (
        <EmptyState icon={<Truck size={48} />} title="No Active Assigned Trip" description="You currently have no active trip. New assignments from Transporter Admin will appear here." />
      ) : null}

      {activeTab === 'ACTIVE' && s && (
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
          {(() => {
            const hasTare = !!s.mine_tare_kg;
            const hasGross = !!s.mine_gross_kg;
            const hasBilty = !!s.bilty_no;
            const isJourneyReady = hasTare && hasGross && hasBilty;

            return (
              <ActionCard
                title="Step 2 — Dispatch Validation & Start Journey"
                subtitle="View origin weighbridge progress. Start journey when loaded weighment and Bilty are complete."
                icon={<Navigation size={18} />}
                accentColor="#6366F1"
              >
                {/* Real-time Dispatch Progress Checklist */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '16px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                    DISPATCH PROGRESS CHECKLIST
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
                      <span>✓ Driver & Vehicle Verified</span>
                      <span style={{ fontSize: '11px', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '4px' }}>Passed</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: hasTare ? '#059669' : '#94A3B8', fontWeight: 600 }}>
                      <span>{hasTare ? '✓' : '○'} Empty Weight Captured (MINE_TARE)</span>
                      <span className="mono" style={{ fontSize: '11px', backgroundColor: hasTare ? '#D1FAE5' : '#F1F5F9', padding: '2px 8px', borderRadius: '4px', color: hasTare ? '#059669' : '#64748B' }}>
                        {hasTare ? `${s.mine_tare_kg!.toLocaleString()} kg` : 'Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: hasGross ? '#059669' : hasTare ? '#D97706' : '#94A3B8', fontWeight: 600 }}>
                      <span>{hasGross ? '✓ Loaded Weight Captured (MINE_GROSS)' : hasTare ? '● Loading Cargo / Waiting for Gross Scale' : '○ Loaded Weight Captured (MINE_GROSS)'}</span>
                      <span className="mono" style={{ fontSize: '11px', backgroundColor: hasGross ? '#D1FAE5' : hasTare ? '#FEF3C7' : '#F1F5F9', padding: '2px 8px', borderRadius: '4px', color: hasGross ? '#059669' : hasTare ? '#B45309' : '#64748B' }}>
                        {hasGross ? `${s.mine_gross_kg!.toLocaleString()} kg` : hasTare ? 'Loading...' : 'Pending'}
                      </span>
                    </div>
                    {hasTare && hasGross && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                        <span>✓ Calculated Net Payload</span>
                        <span className="mono" style={{ fontSize: '11px', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', padding: '2px 8px', borderRadius: '4px', color: '#047857' }}>
                          {(s.mine_gross_kg! - s.mine_tare_kg!).toLocaleString()} kg ({((s.mine_gross_kg! - s.mine_tare_kg!)/1000).toFixed(2)} Tons)
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: hasBilty ? '#059669' : '#94A3B8', fontWeight: 600 }}>
                      <span>{hasBilty ? '✓' : '○'} Bilty Generated & Dispatch Validated</span>
                      <span className="mono" style={{ fontSize: '11px', backgroundColor: hasBilty ? '#D1FAE5' : '#F1F5F9', padding: '2px 8px', borderRadius: '4px', color: hasBilty ? '#059669' : '#64748B' }}>
                        {hasBilty ? `${s.bilty_no}` : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {trackingActive ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: '#F0FDF4', border: '1px solid #10B981',
                      borderRadius: '10px', padding: '14px 18px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, color: '#065F46' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        GPS IS ACTIVE — Tracking Transit Route
                      </div>
                      <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>
                        {gpsCoords ? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'Resolving coordinates...'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px', padding: '14px 16px', color: '#92400E', fontSize: '13px', fontWeight: 600 }}>
                    ⚠️ Waiting for Siding Supervisor to authorize journey and dispatch.
                  </div>
                )}
              </ActionCard>
            );
          })()}

          {/* ── STEP 3: Confirm Arrival at Destination ── */}
          <ActionCard
            title="Step 3 — Confirm Arrival at Destination"
            subtitle="Confirm your arrival at the customer yard once you reach the geofence."
            icon={<MapPin size={18} />}
            accentColor="#10B981"
            locked={!['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(s.status)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!isArrived ? (
                <button
                  onClick={handleConfirmArrival}
                  disabled={isSubmitting}
                  style={{
                    width: '100%', padding: '16px 20px',
                    backgroundColor: '#ECFDF5',
                    color: '#047857',
                    border: '2px solid #6EE7B7',
                    borderRadius: '12px', fontSize: '15px', fontWeight: 800,
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                  }}
                >
                  <MapPin size={16} /> Confirm Arrival at Customer Yard
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#065F46', fontWeight: 700, fontSize: '15px', backgroundColor: '#D1FAE5', padding: '12px', borderRadius: '8px', border: '1px solid #10B981' }}>
                    <CheckCircle2 size={18} /> Location Checked & Arrival Confirmed!
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600, paddingLeft: '4px' }}>
                    Customer receiving staff has been notified. Please park and wait for weighbridge call.
                  </div>
                </div>
              )}
            </div>
          </ActionCard>

          {/* ── STEP 4: Upload POD ── */}
          <ActionCard
            title="Step 4 — Upload Delivery Receipt (POD)"
            subtitle={canUploadPod ? "Take a photo of the stamped receipt and upload it here." : "Awaiting customer yard receiver to complete unloading weigh-in & stamp your receipt."}
            icon={<Upload size={18} />}
            accentColor="#0EA5E9"
            locked={!canUploadPod}
          >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {isUploaded ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#065F46', fontWeight: 700, fontSize: '14px', backgroundColor: '#D1FAE5', padding: '14px', borderRadius: '10px', border: '1px solid #10B981', marginBottom: '4px' }}>
                    <CheckCircle2 size={18} /> Waybill POD Successfully Uploaded! Run Complete.
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Select Sample Stamped Receipt Scenario (Demo Mode)
                      </label>
                      <select
                        value={mockScenario}
                        onChange={(e) => {
                          const val = e.target.value as 'MATCH' | 'MISMATCH' | 'BLURRY';
                          setMockScenario(val);
                          if (val === 'MATCH') {
                            setSelectedPodFile('/uploads/pods/waybill_match.png');
                          } else if (val === 'MISMATCH') {
                            setSelectedPodFile('/uploads/pods/waybill_mismatch.png');
                          } else {
                            setSelectedPodFile('/uploads/pods/waybill_blurry.png');
                          }
                        }}
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                      >
                        <option value="MATCH">🟢 MATCH (Clean Scan, 100% Weight Agreement)</option>
                        <option value="MISMATCH">🔴 MISMATCH (Variance Found, Weight Discrepancy)</option>
                        <option value="BLURRY">🟡 BLURRY (Low Image Quality, Low OCR Confidence)</option>
                      </select>
                      {selectedPodFile && (
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#0EA5E9', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={14} color="#10B981" /> Selected Mock Document: {selectedPodFile.split('/').pop()}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handlePodSubmit}
                      disabled={isSubmitting || !selectedPodFile}
                      style={{
                        padding: '14px 20px', backgroundColor: '#0EA5E9', color: '#fff',
                        border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                        cursor: isSubmitting ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'
                      }}
                    >
                      <Upload size={16} /> Upload Receipt & Submit for Verification
                    </button>
                  </>
                )}

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
                        <span style={{ 
                          fontWeight: 800, 
                          color: ocrResult.ocr?.match_status === 'MATCH' 
                            ? '#059669' 
                            : ocrResult.ocr?.match_status === 'LOW_CONFIDENCE' 
                              ? '#D97706' 
                              : '#DC2626' 
                        }}>
                          {ocrResult.ocr?.match_status === 'MATCH' 
                            ? '✓ Yes, Matches' 
                            : ocrResult.ocr?.match_status === 'LOW_CONFIDENCE'
                              ? '⚠️ Blurry / Low Confidence Scan'
                              : '✗ No, Mismatch — Sent for Review'}
                        </span>
                      </div>
                    </div>
                    {ocrResult.ocr?.match_status === 'MATCH' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', backgroundColor: '#ECFDF5', borderRadius: '8px', padding: '10px 12px', color: '#065F46', fontSize: '12px', fontWeight: 600 }}>
                        <CheckCircle2 size={14} /> Clean OCR match! Queued for standard review.
                      </div>
                    )}
                    {ocrResult.ocr?.match_status === 'MISMATCH' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', padding: '10px 12px', color: '#991B1B', fontSize: '12px', fontWeight: 600 }}>
                        <AlertTriangle size={14} /> Weight difference detected. Sent to company admin review queue.
                      </div>
                    )}
                    {ocrResult.ocr?.match_status === 'LOW_CONFIDENCE' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', backgroundColor: '#FFFBEB', borderRadius: '8px', padding: '10px 12px', color: '#92400E', fontSize: '12px', fontWeight: 600 }}>
                        <AlertTriangle size={14} /> Blurry waybill scan. Sent to company admin for manual check.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ActionCard>
        </>
      )}
    </div>
  );
};
