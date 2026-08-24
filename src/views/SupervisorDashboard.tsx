import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { assignmentsApi, srApi, drApi, caApi, TransportAssignmentV3, ReviewQueueItemV3 } from '../lib/api_v3';
import { useContractPo } from '../contexts/ContractPoContext';
import {
  ShieldCheck, Scale, CheckCircle2, FileText, MapPin,
  Truck, AlertCircle, ChevronRight, RefreshCw, ArrowLeft, Package, Clock
} from 'lucide-react';

// ─── Step Section Card ────────────────────────────────────────────────────────
const StepCard: React.FC<{
  step: number; title: string; subtitle?: string; done?: boolean; active?: boolean; icon: React.ReactNode; children?: React.ReactNode;
}> = ({ step, title, subtitle, done, active, icon, children }) => (
  <div style={{
    borderRadius: '12px',
    border: done ? '1px solid #D1FAE5' : active ? '2px solid #3B82F6' : '1px solid #E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#fff',
    boxShadow: active ? '0 4px 20px rgba(59,130,246,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'all 0.2s'
  }}>
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '16px 20px',
      backgroundColor: done ? '#F0FDF4' : active ? '#EFF6FF' : '#F8FAFC',
      borderBottom: children ? '1px solid #E2E8F0' : 'none'
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: done ? '#10B981' : active ? '#3B82F6' : '#E2E8F0',
        color: done || active ? '#fff' : '#94A3B8', fontWeight: 800
      }}>
        {done ? <CheckCircle2 size={18} /> : icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: done ? '#065F46' : active ? '#1D4ED8' : '#64748B' }}>
          Step {step}: {title}
        </div>
        {subtitle && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      {done && <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', backgroundColor: '#D1FAE5', padding: '3px 10px', borderRadius: '20px' }}>Done ✓</span>}
      {!done && !active && !children && <span style={{ fontSize: '11px', fontWeight: 700, color: '#CBD5E1' }}>Waiting...</span>}
    </div>
    {children && <div style={{ padding: '20px' }}>{children}</div>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const SupervisorDashboard: React.FC = () => {
  const { selectedPoId, purchaseOrders } = useContractPo();
  const [assignments, setAssignments] = useState<TransportAssignmentV3[]>([]);
  const [reviews, setReviews] = useState<ReviewQueueItemV3[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TransportAssignmentV3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [licenseValid, setLicenseValid] = useState(true);
  const [prdpValid, setPrdpValid] = useState(true);
  const [biltyValid, setBiltyValid] = useState(true);
  const [materialMatch, setMaterialMatch] = useState(true);
  const [weightKg, setWeightKg] = useState('15200');
  const [weighStage, setWeighStage] = useState<'MINE_TARE' | 'MINE_GROSS'>('MINE_TARE');
  const [otpCode, setOtpCode] = useState('');
  const [biltyNo, setBiltyNo] = useState('BLT-778899');
  const [biltyDate, setBiltyDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadUrl, setUploadUrl] = useState('/uploads/biltys/bilty_sample.png');
  const [successMsg, setSuccessMsg] = useState('');

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

  useEffect(() => { loadData(); }, []);

  const activePoObject = selectedPoId === 'ALL' ? null : purchaseOrders.find(p => p.id === Number(selectedPoId));

  const filteredAssignments = assignments.filter(a => {
    if (selectedPoId !== 'ALL' && activePoObject && a.sap_po_no !== activePoObject.sap_po_no) return false;
    return true;
  });

  const handleBack = () => { setSelectedAssignment(null); setSuccessMsg(''); setOtpCode(''); };

  const handleVerifyOtpAndPrecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !otpCode) { alert('Please enter the OTP code from the driver.'); return; }
    setIsSubmitting(true);
    try {
      await drApi.otpVerify(selectedAssignment.id, 'PICKUP', otpCode);
      await srApi.gateCheck(selectedAssignment.id, { license_valid: licenseValid, prdp_valid: prdpValid, bilty_valid: biltyValid, material_match: materialMatch });
      setSuccessMsg('Gate check done. Now proceed to weigh the empty truck.');
      setOtpCode('');
      await loadData();
      // Re-select to get updated status
      const updatedList = await assignmentsApi.list();
      const updated = updatedList.find(a => a.id === selectedAssignment.id);
      if (updated) setSelectedAssignment(updated);
    } catch (err: any) {
      alert('Gate check failed: ' + (err.message || 'Wrong OTP code or network error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogWeight = async () => {
    if (!selectedAssignment) return;
    const currentStage = selectedAssignment.mine_tare_kg ? 'MINE_GROSS' : 'MINE_TARE';
    setIsSubmitting(true);
    try {
      await drApi.logWeight(selectedAssignment.id, {
        stage: currentStage,
        weight_kg: parseFloat(weightKg),
        truck_detail: 'Weighbridge Gate 01'
      });
      const updatedList = await assignmentsApi.list();
      const updated = updatedList.find(a => a.id === selectedAssignment.id);
      if (updated) setSelectedAssignment(updated);
      setAssignments(updatedList);
      if (currentStage === 'MINE_TARE') {
        setWeightKg('44870');
        setSuccessMsg('✓ Empty truck weight (MINE_TARE) captured! Truck is cleared and sent for cargo loading.');
      } else {
        setSuccessMsg('✓ Loaded truck weight (MINE_GROSS) captured! Net payload calculated. Proceed to Bilty dispatch.');
      }
    } catch (err: any) {
      alert('Weight log error: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiltyUpload = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await srApi.biltyUpload(selectedAssignment.id, { bilty_no: biltyNo, bilty_date: biltyDate, upload_url: uploadUrl });
      const updatedList = await assignmentsApi.list();
      const updated = updatedList.find(a => a.id === selectedAssignment.id);
      if (updated) setSelectedAssignment(updated);
      setAssignments(updatedList);
      setSuccessMsg('Bilty uploaded! Truck is now dispatched on its journey.');
    } catch (err: any) {
      alert('Bilty upload error: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrivalStamp = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await srApi.stampAssignment(selectedAssignment.id, { gps_lat: -25.7670, gps_lng: 29.4630 });
      const updatedList = await assignmentsApi.list();
      const updated = updatedList.find(a => a.id === selectedAssignment.id);
      if (updated) setSelectedAssignment(updated);
      setAssignments(updatedList);
      setSuccessMsg('Arrival stamp recorded! Truck is at the customer yard.');
    } catch (err: any) {
      alert('Stamp error: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Status → Which steps are done/active ─────────────────────────────────
  const getStepStatus = (a: TransportAssignmentV3) => {
    const hasTare = !!a.mine_tare_kg;
    const hasGross = !!a.mine_gross_kg;
    const isDispatched = ['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(a.status);
    return {
      step1Done: !['ASSIGNED'].includes(a.status),
      step1Active: a.status === 'ASSIGNED',
      step2Done: hasTare && hasGross,
      step2Active: !hasTare || (hasTare && !hasGross),
      step3Done: isDispatched,
      step3Active: hasTare && hasGross && !isDispatched,
      step4Done: (a.supervisor_stamped_count || 0) > 0,
      step4Active: ['DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(a.status) && !(a.supervisor_stamped_count || 0),
      isComplete: ['DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(a.status),
    };
  };

  // ─── DETAIL VIEW ─────────────────────────────────────────────────────────
  if (selectedAssignment) {
    const a = selectedAssignment;
    const steps = getStepStatus(a);

    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Back + PO Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBack}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#fff',
              fontSize: '13px', fontWeight: 600, color: '#64748B', cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} /> All Trucks
          </button>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>PO #{a.sap_po_no}</span>
          <span style={{ marginLeft: 'auto' }}><StatusBadge status={a.status} /></span>
        </div>

        {/* Info strip */}
        <div style={{
          backgroundColor: '#1E293B', borderRadius: '12px', padding: '20px 24px', color: '#fff',
          display: 'flex', gap: '24px', flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Driver</div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{a.driver_name || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Truck</div>
            <div className="mono" style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{a.vehicle_reg || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cargo</div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{a.material || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{a.scheduled_date}</div>
          </div>
        </div>

        {/* Success banner */}
        {successMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            backgroundColor: '#F0FDF4', border: '1px solid #10B981',
            borderRadius: '10px', padding: '14px 18px', color: '#065F46', fontSize: '13px', fontWeight: 600
          }}>
            <CheckCircle2 size={16} color="#10B981" /> {successMsg}
          </div>
        )}

        {/* ── Step 1: Gate Verification ── */}
        <StepCard
          step={1}
          title="Check Driver Code & Safety"
          subtitle="Enter the OTP code from the driver's phone and tick the safety checklist"
          done={steps.step1Done}
          active={steps.step1Active}
          icon={<ShieldCheck size={16} />}
        >
          {steps.step1Active && (
            <form onSubmit={handleVerifyOtpAndPrecheck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                  🔑 Enter Pickup Code (from driver's phone)
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Enter 4-digit code"
                  className="mono"
                  style={{
                    width: '100%', padding: '14px 16px', border: '1px solid #E2E8F0',
                    borderRadius: '10px', fontSize: '24px', fontWeight: 800, letterSpacing: '0.15em',
                    textAlign: 'center', backgroundColor: '#F8FAFC'
                  }}
                  required
                />
                <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>Ask the driver for the code shown on their phone screen.</p>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Safety Checklist</div>
                {[
                  { val: licenseValid, set: setLicenseValid, label: 'Driver License is Valid & OK' },
                  { val: prdpValid, set: setPrdpValid, label: 'PrDP Permit is Valid & OK' },
                  { val: biltyValid, set: setBiltyValid, label: 'Paperwork / Route Details Match' },
                  { val: materialMatch, set: setMaterialMatch, label: 'Coal Specification Matches Order' },
                ].map(({ val, set, label }) => (
                  <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox" checked={val}
                      onChange={e => set(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#3B82F6' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{label}</span>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !otpCode}
                style={{
                  padding: '14px', backgroundColor: !otpCode ? '#E2E8F0' : '#3B82F6',
                  color: !otpCode ? '#94A3B8' : '#fff', border: 'none',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: !otpCode ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Verifying...' : 'Verify Driver Code & Save Safety Checklist'}
              </button>
            </form>
          )}
        </StepCard>

        {/* ── Step 2: Weigh Truck (Two-Stage Origin Workflow) ── */}
        <StepCard
          step={2}
          title={!a.mine_tare_kg ? "Step 1 — Empty Truck Weighbridge (MINE_TARE)" : !a.mine_gross_kg ? "Step 2 — Loaded Truck Weighbridge (MINE_GROSS)" : "Origin Weighbridge Complete"}
          subtitle={!a.mine_tare_kg ? "Weigh empty truck on scale before entering cargo loading area" : !a.mine_gross_kg ? "Weigh loaded truck returning from loading bay" : "Tare, Gross, and Net payload recorded"}
          done={steps.step2Done}
          active={steps.step2Active}
          icon={<Scale size={16} />}
        >
          {steps.step2Active && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!a.mine_tare_kg ? (
                /* STAGE 1: EMPTY TRUCK WEIGHBRIDGE */
                <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E40AF', marginBottom: '4px' }}>
                    🚛 STEP 1: EMPTY TRUCK WEIGHBRIDGE (MINE_TARE)
                  </div>
                  <p style={{ fontSize: '12px', color: '#1E3A8A', margin: '0 0 12px' }}>
                    Truck is on scale. Capture empty tare weight before sending truck for loading.
                  </p>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Tare Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      placeholder="10250"
                      style={{ width: '100%', padding: '14px 16px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '20px', fontWeight: 800, textAlign: 'right', backgroundColor: '#fff' }}
                    />
                  </div>
                  <button
                    onClick={handleLogWeight}
                    disabled={isSubmitting || !weightKg}
                    style={{
                      width: '100%', marginTop: '14px', padding: '14px', backgroundColor: '#2563EB', color: '#fff', border: 'none',
                      borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer'
                    }}
                  >
                    {isSubmitting ? 'Capturing...' : 'Capture Empty Weight (MINE_TARE) & Send for Loading'}
                  </button>
                </div>
              ) : (
                /* STAGE 2: LOADED TRUCK WEIGHBRIDGE */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Loading Stage Status Banner */}
                  <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px', padding: '16px', color: '#92400E' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#B45309' }}>✓ STEP 1 TARE CAPTURED: {a.mine_tare_kg.toLocaleString()} kg</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', color: '#78350F' }}>
                        STATUS: WAITING FOR LOADING
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#92400E' }}>
                      Truck loaded cargo at bay and has returned to weighbridge for Stage 2 gross measurement.
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#065F46', marginBottom: '4px' }}>
                      🚛📦 STEP 2: LOADED TRUCK WEIGHBRIDGE (MINE_GROSS)
                    </div>
                    <div style={{ fontSize: '12px', color: '#047857', marginBottom: '12px' }}>
                      Previously captured Tare Weight: <strong>{a.mine_tare_kg.toLocaleString()} kg</strong>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#065F46', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Loaded Gross Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={weightKg}
                        onChange={e => setWeightKg(e.target.value)}
                        placeholder="44870"
                        style={{ width: '100%', padding: '14px 16px', border: '1px solid #A7F3D0', borderRadius: '10px', fontSize: '20px', fontWeight: 800, textAlign: 'right', backgroundColor: '#fff' }}
                      />
                    </div>

                    {parseFloat(weightKg) > (a.mine_tare_kg || 0) && (
                      <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px border #6EE7B7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#065F46' }}>Calculated Net Payload:</span>
                        <span className="mono" style={{ fontSize: '16px', fontWeight: 900, color: '#047857' }}>
                          {(parseFloat(weightKg) - a.mine_tare_kg).toLocaleString()} kg ({((parseFloat(weightKg) - a.mine_tare_kg)/1000).toFixed(2)} Tons)
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleLogWeight}
                      disabled={isSubmitting || !weightKg}
                      style={{
                        width: '100%', marginTop: '14px', padding: '14px', backgroundColor: '#059669', color: '#fff', border: 'none',
                        borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer'
                      }}
                    >
                      {isSubmitting ? 'Capturing...' : 'Capture Loaded Weight (MINE_GROSS) & Finalize Origin Net'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {steps.step2Done && a.mine_tare_kg && a.mine_gross_kg && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #10B981', borderRadius: '10px', padding: '16px', color: '#065F46' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#059669', marginBottom: '8px' }}>✓ ORIGIN WEIGHBRIDGE COMPLETE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>EMPTY / TARE</div>
                  <div className="mono" style={{ fontSize: '15px', fontWeight: 800 }}>{a.mine_tare_kg.toLocaleString()} kg</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 700 }}>LOADED / GROSS</div>
                  <div className="mono" style={{ fontSize: '15px', fontWeight: 800 }}>{a.mine_gross_kg.toLocaleString()} kg</div>
                </div>
                <div style={{ backgroundColor: '#ECFDF5', padding: '10px', borderRadius: '8px', border: '2px solid #10B981' }}>
                  <div style={{ fontSize: '10px', color: '#047857', fontWeight: 800 }}>NET PAYLOAD</div>
                  <div className="mono" style={{ fontSize: '15px', fontWeight: 900, color: '#065F46' }}>{(a.mine_gross_kg - a.mine_tare_kg).toLocaleString()} kg</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>{((a.mine_gross_kg - a.mine_tare_kg)/1000).toFixed(2)} Tons</div>
                </div>
              </div>
            </div>
          )}
        </StepCard>

        {/* ── Step 3: Upload Bilty ── */}
        <StepCard
          step={3}
          title="Upload Bilty & Dispatch Truck"
          subtitle="Record the bilty number and upload the receipt to send the truck on its way"
          done={steps.step3Done}
          active={steps.step3Active}
          icon={<FileText size={16} />}
        >
          {steps.step3Active && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Bilty Number</label>
                  <input
                    type="text"
                    value={biltyNo}
                    onChange={e => setBiltyNo(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Bilty Date</label>
                  <input
                    type="date"
                    value={biltyDate}
                    onChange={e => setBiltyDate(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Bilty Document</label>
                <select
                  value={uploadUrl}
                  onChange={e => setUploadUrl(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: '#F8FAFC' }}
                >
                  <option value="/uploads/biltys/bilty_sample.png">bilty_sample.png — PO #4500001715 (34.62 Tons)</option>
                  <option value="/uploads/bilty/blt_778899.pdf">BLT-778899 — Standard Demo</option>
                </select>
              </div>

              <button
                onClick={handleBiltyUpload}
                disabled={isSubmitting}
                style={{
                  padding: '14px', backgroundColor: '#059669', color: '#fff', border: 'none',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer'
                }}
              >
                {isSubmitting ? 'Uploading...' : 'Upload Bilty & Send Truck on Journey'}
              </button>
            </div>
          )}
        </StepCard>

        {/* All done */}
        {steps.isComplete && (
          <div style={{
            textAlign: 'center', padding: '32px',
            backgroundColor: '#F0FDF4', borderRadius: '14px', border: '1px solid #D1FAE5'
          }}>
            <CheckCircle2 size={40} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#065F46', margin: '0 0 6px' }}>Dispatch Complete!</h3>
            <p style={{ fontSize: '13px', color: '#047857', margin: 0 }}>Bilty has been uploaded and truck is dispatched on its journey.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Gate & Weighbridge
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            All active truck runs at your gate. Click any truck to process it step by step.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {reviews.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5',
              color: '#991B1B', padding: '8px 14px', borderRadius: '8px',
              fontSize: '12px', fontWeight: 700
            }}>
              <AlertCircle size={14} /> {reviews.length} Items Flagged for Review
            </div>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
              borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#fff',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#64748B'
            }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Loading trucks...</div>
      ) : assignments.length === 0 ? (
        <EmptyState icon={<Truck size={48} />} title="No Trucks at Gate" description="No trucks are currently assigned or in transit." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredAssignments.map(a => {
            const steps = getStepStatus(a);
            const progress = [steps.step1Done, steps.step2Done, steps.step3Done].filter(Boolean).length;

            return (
              <div
                key={a.id}
                onClick={() => setSelectedAssignment(a)}
                style={{
                  backgroundColor: '#fff', borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '18px 22px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '18px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                {/* PO Number */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO Number</div>
                  <div className="mono" style={{ fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>#{a.sap_po_no}</div>
                </div>

                <div style={{ width: '1px', height: '40px', backgroundColor: '#F1F5F9' }} />

                {/* Driver */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Driver</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{a.driver_name || '—'}</div>
                  <div className="mono" style={{ fontSize: '11px', color: '#64748B' }}>{a.vehicle_reg}</div>
                </div>

                {/* Progress */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>Progress</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        height: '6px', flex: 1, borderRadius: '3px',
                        backgroundColor: i < progress ? '#10B981' : '#E2E8F0',
                        transition: 'background-color 0.2s'
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{progress}/3 steps done</div>
                </div>

                <StatusBadge status={a.status} />
                <ChevronRight size={18} color="#CBD5E1" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
