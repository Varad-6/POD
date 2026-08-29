import React, { useState, useEffect, useRef } from 'react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { drApi, TransportAssignmentV3 } from '../lib/api_v3';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { PodzoLogo } from '../components/branding/PodzoLogo';
import {
  Truck, MapPin, CheckCircle2, Upload, AlertTriangle, Key, Check,
  Navigation, Package, Clock, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';

// ─── Step indicator ───────────────────────────────────────────────────────────
const JourneyStep: React.FC<{ num: number; label: string; done: boolean; active: boolean }> = ({ num, label, done, active }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: done || active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.25)',
      color: done || active ? '#1D4ED8' : '#FFFFFF',
      fontWeight: 900, fontSize: '13px',
      border: active ? '2px solid #FFFFFF' : 'none',
      boxShadow: active ? '0 0 0 4px rgba(255, 255, 255, 0.4)' : 'none',
      transition: 'all var(--transition-normal)'
    }}>
      {done ? <Check size={16} strokeWidth={3} /> : num}
    </div>
    <span style={{ 
      fontSize: '11.5px', 
      fontWeight: active ? 900 : 700, 
      color: '#FFFFFF', 
      textAlign: 'center', 
      whiteSpace: 'nowrap',
      opacity: active ? 1 : done ? 0.95 : 0.85,
      textShadow: active ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
    }}>
      {label}
    </span>
  </div>
);

const StepConnector: React.FC<{ done: boolean }> = ({ done }) => (
  <div style={{ flex: 1, height: '3px', backgroundColor: done ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)', marginBottom: '18px', transition: 'background-color 0.3s' }} />
);


// ─── Section card ─────────────────────────────────────────────────────────────
const ActionCard: React.FC<{ title: string; subtitle?: string; icon: React.ReactNode; locked?: boolean; children: React.ReactNode; accentColor?: string }> = ({ title, subtitle, icon, locked, children, accentColor = 'var(--color-brand-blue-600)' }) => (
  <div style={{
    backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: '1.5px solid var(--color-border)',
    overflow: 'hidden', boxShadow: 'var(--shadow-card)',
    opacity: locked ? 0.45 : 1, transition: 'opacity 0.3s',
    pointerEvents: locked ? 'none' : 'auto'
  }}>
    <div style={{
      padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', gap: '12px',
      borderLeft: `4px solid ${locked ? 'var(--color-border)' : accentColor}`,
      backgroundColor: 'var(--color-bg-card)'
    }}>
      <div style={{ color: locked ? 'var(--color-text-muted)' : accentColor }}>{icon}</div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: locked ? 'var(--color-text-muted)' : 'var(--color-text-heading)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      {locked && <span className="badge badge-neutral" style={{ marginLeft: 'auto', padding: '2px 8px' }}>Locked</span>}
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

  const loadAssignments = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await drApi.getMineAssignments();
      setAssignments(data);
      setSelectedAssignment(prev => {
        if (!prev) return data.find(a => !['DELIVERED', 'POD_UPLOADED', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(a.status)) || data[0] || null;
        const updated = data.find(a => a.id === prev.id);
        return updated || data.find(a => !['DELIVERED', 'POD_UPLOADED', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(a.status)) || data[0] || null;
      });
    } catch (err) {
      console.error('Failed to load driver assignments:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  const isCompletedStatus = (status: string) => ['DELIVERED', 'POD_UPLOADED', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(status);
  const activeTrips = assignments.filter(a => !isCompletedStatus(a.status));
  const completedTrips = assignments.filter(a => isCompletedStatus(a.status));

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  const getJourneyStage = (status: string) => {
    if (['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(status)) return 2;
    if (['ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW'].includes(status)) return 3;
    if (['DELIVERED', 'POD_UPLOADED'].includes(status)) return 4;
    return 1;
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
  }, [s, trackingActive]);

  const handleGenerateOTP = async (type: 'PICKUP' | 'DELIVERY') => {
    if (!s) return;
    setIsSubmitting(true);
    try {
      const res = await drApi.otpGenerate(s.id, type);
      if (type === 'PICKUP') setPickupOtp(res.otp_code);
      if (type === 'DELIVERY') setDeliveryOtp(res.otp_code);
    } catch (err: any) {
      alert('OTP Generation failed: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmArrival = async () => {
    if (!s || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await drApi.confirmArrival(s.id, { gps_lat: -25.7670, gps_lng: 29.4630 });
      await loadAssignments(true);
    } catch (err: any) {
      alert('Arrival Confirmation failed: ' + (err.message || 'Please check coordinates'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePodSubmit = async () => {
    if (!s || !selectedPodFile) return;
    setIsSubmitting(true);
    try {
      const res = await drApi.uploadPod(s.id, {
        pod_file_url: selectedPodFile,
        mock_scenario: mockScenario
      });
      setOcrResult(res);
      await loadAssignments();
    } catch (err: any) {
      console.error('Failed to upload POD:', err);
      alert('Error uploading POD: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading your trips...</div>;

  if (assignments.length === 0) return (
    <EmptyState icon={<Truck size={48} />} title="No Trips Today" description="You don't have any trips assigned yet." />
  );

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header Banner (Royal Blue theme for high visibility) ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-brand-blue-600) 0%, var(--color-brand-blue-700) 100%)',
        borderRadius: '16px', padding: '24px 28px', color: '#fff',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '6px 12px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', border: '1px solid var(--color-border)' }}>
            <PodzoLogo variant="compact" height={28} />
          </div>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
            {user?.displayName || 'Driver'}
          </div>
        </div>

        {/* Journey Progress Bar */}
        {s && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: '12px', padding: '14px 16px' }}>
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

      {/* ── Driver Actionable KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="kpi-card" style={{ padding: '16px', borderLeft: '4px solid #2563EB' }}>
          <div>
            <div className="kpi-label">Assigned Trips</div>
            <div className="kpi-value" style={{ fontSize: '20px' }}>{assignments.length}</div>
            <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700 }}>Total Driver Trips</div>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px', borderLeft: assignments.filter(a => a.status === 'ASSIGNED' || a.status === 'ACCEPTED').length > 0 ? '4px solid #D97706' : '1px solid var(--color-border)' }}>
          <div>
            <div className="kpi-label">Pickup Pending</div>
            <div className="kpi-value" style={{ fontSize: '20px' }}>{assignments.filter(a => a.status === 'ASSIGNED' || a.status === 'ACCEPTED').length}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-warning-text)', fontWeight: 700 }}>Gate / Tare Required</div>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px', borderLeft: assignments.filter(a => a.status === 'DISPATCHED' || a.status === 'IN_TRANSIT').length > 0 ? '4px solid #2563EB' : '1px solid var(--color-border)' }}>
          <div>
            <div className="kpi-label">Delivery Pending</div>
            <div className="kpi-value" style={{ fontSize: '20px' }}>{assignments.filter(a => a.status === 'DISPATCHED' || a.status === 'IN_TRANSIT').length}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-brand-blue-600)', fontWeight: 700 }}>En Route to Site</div>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: '16px', borderLeft: assignments.filter(a => a.status === 'DELIVERED' && !(a as any).pod_file_url).length > 0 ? '4px solid #DC2626' : '1px solid var(--color-border)' }}>
          <div>
            <div className="kpi-label">POD Upload Pending</div>
            <div className="kpi-value" style={{ fontSize: '20px' }}>{assignments.filter(a => a.status === 'DELIVERED' && !(a as any).pod_file_url).length}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-error-text)', fontWeight: 700 }}>Photo Receipt Needed</div>
          </div>
        </div>

      </div>


      {/* ── Tab Switcher ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2.5px solid var(--color-border)', paddingBottom: '12px' }}>
        <button
          onClick={() => {
            setActiveTab('ACTIVE');
            if (activeTrips.length > 0) setSelectedAssignment(activeTrips[0]);
          }}
          style={{
            padding: '10px 20px', borderRadius: '10px', border: activeTab === 'ACTIVE' ? 'none' : '1.5px solid var(--color-border)',
            backgroundColor: activeTab === 'ACTIVE' ? 'var(--color-brand-blue-600)' : 'var(--color-bg-card)',
            color: activeTab === 'ACTIVE' ? '#fff' : 'var(--color-text-muted)',
            fontWeight: 700, fontSize: '13.5px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: activeTab === 'ACTIVE' ? 'var(--shadow-card-hover)' : 'var(--shadow-card)'
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
            padding: '10px 20px', borderRadius: '10px', border: activeTab === 'COMPLETED' ? 'none' : '1.5px solid var(--color-border)',
            backgroundColor: activeTab === 'COMPLETED' ? 'var(--color-brand-blue-600)' : 'var(--color-bg-card)',
            color: activeTab === 'COMPLETED' ? '#fff' : 'var(--color-text-muted)',
            fontWeight: 700, fontSize: '13.5px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: activeTab === 'COMPLETED' ? 'var(--shadow-card-hover)' : 'var(--shadow-card)'
          }}
        >
          ✅ Completed Trips ({completedTrips.length})
        </button>
      </div>

      {activeTab === 'COMPLETED' ? (
        <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: '1.5px solid var(--color-border)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-heading)', margin: '0 0 14px' }}>Completed Trips Log</h3>
          {completedTrips.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              No completed trips in your history yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {completedTrips.map(ct => (
                <div key={ct.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--color-bg-page)', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div className="mono" style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-text-heading)' }}>PO #{ct.sap_po_no} / {ct.po_item_no}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-body)', marginTop: '2px' }}>{ct.material} • Truck: {ct.vehicle_reg}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{ct.scheduled_date}</span>
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
            backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: '1.5px solid var(--color-border)',
            padding: '20px 24px', display: 'flex', gap: '24px', flexWrap: 'wrap',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Purchase Order / Item</div>
              <div className="mono" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)' }}>PO #{s.sap_po_no} / {s.po_item_no}</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cargo</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.material}</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>My Truck</div>
              <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.vehicle_reg || '—'}</div>
            </div>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
              <StatusBadge status={s.status} />
            </div>
          </div>

          {/* Route */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--color-brand-blue-50)', borderRadius: '12px', padding: '14px 20px', border: '1px solid var(--color-border)' }}>
            <MapPin size={14} color="var(--color-brand-blue-600)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-blue-700)' }}>{s.from_location || 'MON1 Plant / Siding'}</span>
            <ArrowRight size={14} color="var(--color-border)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-blue-700)' }}>{s.to_location || 'PODZO Mining – Emoyeni Siding'}</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)' }}>{s.scheduled_date}</span>
          </div>

          {/* ── STEP 1: Get Pickup Code ── */}
          <ActionCard
            title="Step 1 — Get Pickup Code (OTP)"
            subtitle="Get a secret 4-digit code. Give it to the supervisor at the loading siding."
            icon={<Key size={18} />}
            accentColor="var(--color-brand-blue-600)"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button
                onClick={() => handleGenerateOTP('PICKUP')}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ padding: '14px 20px', width: '100%', minHeight: '48px', justifyContent: 'center' }}
              >
                <Key size={16} /> Get Pickup Code (OTP)
              </button>

              {pickupOtp && (
                <div style={{
                  textAlign: 'center', backgroundColor: 'var(--color-brand-blue-50)', border: '2px dashed var(--color-brand-blue-600)',
                  borderRadius: '12px', padding: '20px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-blue-700)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    🔑 Your Pickup Code (show this to the supervisor)
                  </div>
                  <div className="mono" style={{ fontSize: '42px', fontWeight: 900, color: 'var(--color-brand-blue-600)', letterSpacing: '0.15em' }}>
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

            return (
              <ActionCard
                title="Step 2 — Dispatch Validation & Start Journey"
                subtitle="View origin weighbridge progress. Start journey when loaded weighment and Bilty are complete."
                icon={<Navigation size={18} />}
                accentColor="var(--color-brand-blue-600)"
              >
                {/* Real-time Dispatch Progress Checklist */}
                <div style={{ backgroundColor: 'var(--color-bg-page)', borderRadius: '12px', padding: '16px', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                    DISPATCH PROGRESS CHECKLIST
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-success-text)', fontWeight: 600 }}>
                      <span>✓ Driver & Vehicle Verified</span>
                      <span className="badge badge-green" style={{ fontSize: '10px', padding: '2px 8px' }}>Passed</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: hasTare ? 'var(--color-success-text)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                      <span>{hasTare ? '✓' : '○'} Empty Weight Captured (MINE_TARE)</span>
                      <span className={hasTare ? 'badge badge-green' : 'badge badge-neutral'} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {hasTare ? `${s.mine_tare_kg!.toLocaleString()} kg` : 'Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: hasGross ? 'var(--color-success-text)' : hasTare ? 'var(--color-warning-text)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                      <span>{hasGross ? '✓ Loaded Weight Captured (MINE_GROSS)' : hasTare ? '● Loading Cargo / Waiting for Gross Scale' : '○ Loaded Weight Captured (MINE_GROSS)'}</span>
                      <span className={hasGross ? 'badge badge-green' : hasTare ? 'badge badge-amber' : 'badge badge-neutral'} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {hasGross ? `${s.mine_gross_kg!.toLocaleString()} kg` : hasTare ? 'Loading...' : 'Pending'}
                      </span>
                    </div>
                    {hasTare && hasGross && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color-brand-blue-600)', fontWeight: 700 }}>
                        <span>✓ Calculated Net Payload</span>
                        <span className="badge badge-blue" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          {(s.mine_gross_kg! - s.mine_tare_kg!).toLocaleString()} kg ({((s.mine_gross_kg! - s.mine_tare_kg!)/1000).toFixed(2)} Tons)
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: hasBilty ? 'var(--color-success-text)' : 'var(--color-text-muted)', fontWeight: 600 }}>
                      <span>{hasBilty ? '✓' : '○'} Bilty Generated & Dispatch Validated</span>
                      <span className={hasBilty ? 'badge badge-green' : 'badge badge-neutral'} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {hasBilty ? `${s.bilty_no}` : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {trackingActive ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: 'var(--color-brand-blue-50)', border: '1px solid var(--color-border)',
                      borderRadius: '10px', padding: '14px 18px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, color: 'var(--color-brand-blue-700)' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-brand-blue-600)', display: 'inline-block' }} />
                        GPS ACTIVE — Tracking Transit Route
                      </div>
                      <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>
                        {gpsCoords ? `${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)}` : 'Resolving GPS...'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-light)', borderRadius: '10px', padding: '14px 16px', color: 'var(--color-warning-text)', fontSize: '13px', fontWeight: 600 }}>
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
            accentColor="var(--color-brand-blue-600)"
            locked={!['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(s.status)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!isArrived ? (
                <button
                  onClick={handleConfirmArrival}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '16px 20px', minHeight: '48px',
                    fontSize: '15px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                  }}
                >
                  <MapPin size={16} /> Confirm Arrival at Customer Yard
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success-text)', fontWeight: 700, fontSize: '15px', backgroundColor: 'var(--color-success-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-success-light)' }}>
                    <CheckCircle2 size={18} /> Location Checked & Arrival Confirmed!
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-success-text)', fontWeight: 600, paddingLeft: '4px' }}>
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
            accentColor="var(--color-brand-blue-600)"
            locked={!canUploadPod}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {isUploaded ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success-text)', fontWeight: 700, fontSize: '14px', backgroundColor: 'var(--color-success-bg)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-success-light)', marginBottom: '4px' }}>
                  <CheckCircle2 size={18} /> Waybill POD Successfully Uploaded! Run Complete.
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
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
                      style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', cursor: 'pointer' }}
                    >
                      <option value="MATCH">🟢 MATCH (Clean Scan, 100% Weight Agreement)</option>
                      <option value="MISMATCH">🔴 MISMATCH (Variance Found, Weight Discrepancy)</option>
                      <option value="BLURRY">🟡 BLURRY (Low Image Quality, Low OCR Confidence)</option>
                    </select>
                    {selectedPodFile && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-brand-blue-700)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} color="var(--color-success)" /> Selected Mock Document: {selectedPodFile.split('/').pop()}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handlePodSubmit}
                    disabled={isSubmitting || !selectedPodFile}
                    className="btn btn-primary"
                    style={{
                      padding: '14px 20px', width: '100%', minHeight: '48px',
                      display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'
                    }}
                  >
                    <Upload size={16} /> Upload Receipt & Submit for Verification
                  </button>
                </>
              )}

              {ocrResult && (
                <div style={{ backgroundColor: 'var(--color-bg-page)', borderRadius: '12px', padding: '16px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Receipt Scan Results
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Bill Number</span>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>{ocrResult.ocr?.ocr_waybill_extracted || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Weight Read</span>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>{ocrResult.ocr?.ocr_weight_extracted || '—'} Tons</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Scan Quality</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>{ocrResult.ocr?.ocr_confidence_pct || '—'}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Matches SAP PO?</span>
                      <span style={{ 
                        fontWeight: 850, 
                        color: ocrResult.ocr?.match_status === 'MATCH' 
                          ? 'var(--color-success-text)' 
                          : ocrResult.ocr?.match_status === 'LOW_CONFIDENCE' 
                            ? 'var(--color-warning-text)' 
                            : 'var(--color-error-text)' 
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', backgroundColor: 'var(--color-success-bg)', borderRadius: '8px', padding: '10px 12px', color: 'var(--color-success-text)', fontSize: '12px', fontWeight: 600, border: '1px solid var(--color-success-light)' }}>
                      <CheckCircle2 size={14} /> Clean OCR match! Queued for standard review.
                    </div>
                  )}
                  {ocrResult.ocr?.match_status === 'MISMATCH' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', backgroundColor: 'var(--color-error-bg)', borderRadius: '8px', padding: '10px 12px', color: 'var(--color-error-text)', fontSize: '12px', fontWeight: 600, border: '1px solid var(--color-error-light)' }}>
                      <AlertTriangle size={14} /> Weight difference detected. Sent to company admin review queue.
                    </div>
                  )}
                  {ocrResult.ocr?.match_status === 'LOW_CONFIDENCE' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', backgroundColor: 'var(--color-warning-bg)', borderRadius: '8px', padding: '10px 12px', color: 'var(--color-warning-text)', fontSize: '12px', fontWeight: 600, border: '1px solid var(--color-warning-light)' }}>
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
