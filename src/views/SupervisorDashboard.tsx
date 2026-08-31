import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { assignmentsApi, srApi, drApi, caApi, TransportAssignmentV3, ReviewQueueItemV3 } from '../lib/api_v3';
import { useContractPo } from '../contexts/ContractPoContext';
import { Tabs } from '../components/Tabs';
import {
  ShieldCheck, Scale, CheckCircle2, FileText, MapPin, Check,
  Truck, AlertCircle, ChevronRight, RefreshCw, ArrowLeft, Package, Clock
} from 'lucide-react';

// ─── Step Section Card ────────────────────────────────────────────────────────
const StepCard: React.FC<{
  step: number; title: string; subtitle?: string; done?: boolean; active?: boolean; icon: React.ReactNode; children?: React.ReactNode;
}> = ({ step, title, subtitle, done, active, icon, children }) => (
  <div style={{
    borderRadius: '16px',
    border: active ? '2.5px solid var(--color-brand-blue-600)' : '1.5px solid var(--color-border)',
    overflow: 'hidden',
    backgroundColor: 'var(--color-bg-card)',
    boxShadow: active ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
    transition: 'all var(--transition-normal)'
  }}>
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '16px 20px',
      backgroundColor: active ? 'var(--color-brand-blue-50)' : 'var(--color-bg-card)',
      borderBottom: children ? '1px solid var(--color-border)' : 'none'
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: done || active ? 'var(--color-brand-blue-600)' : 'var(--color-border)',
        color: '#fff', fontWeight: 800
      }}>
        {done ? <Check size={18} /> : icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
          Step {step}: {title}
        </div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{subtitle}</div>}
      </div>
      {done && <span className="badge badge-green">Done ✓</span>}
      {!done && !active && !children && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Waiting...</span>}
    </div>
    {children && <div style={{ padding: '20px', backgroundColor: 'var(--color-bg-card)' }}>{children}</div>}
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form states
  const [licenseValid, setLicenseValid] = useState(true);
  const [prdpValid, setPrdpValid] = useState(true);
  const [biltyValid, setBiltyValid] = useState(true);
  const [materialMatch, setMaterialMatch] = useState(true);
  const [weightKg, setWeightKg] = useState('15200');
  const [otpCode, setOtpCode] = useState('');
  const [biltyNo, setBiltyNo] = useState('BLT-778899');
  const [biltyDate, setBiltyDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadUrl, setUploadUrl] = useState('/uploads/biltys/bilty_sample.png');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

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

  useEffect(() => {
    if (selectedAssignment) {
      const targetQtyTons = selectedAssignment.po_target_qty || 34.0;
      const targetQtyKg = targetQtyTons * 1000;
      if (selectedAssignment.mine_tare_kg) {
        setWeightKg(String(selectedAssignment.mine_tare_kg + targetQtyKg));
      } else {
        setWeightKg('10000');
      }
    }
  }, [selectedAssignment]);

  const activePoObject = selectedPoId === 'ALL' ? null : purchaseOrders.find(p => p.id === Number(selectedPoId));

  const isActiveStatus = (status: string) => !['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(status);

  const filteredAssignments = assignments.filter(a => {
    if (selectedPoId !== 'ALL' && activePoObject && a.sap_po_no !== activePoObject.sap_po_no) return false;
    const active = isActiveStatus(a.status);
    if (activeTab === 'ACTIVE' && !active) return false;
    if (activeTab === 'COMPLETED' && active) return false;
    return true;
  });

  const handleBack = () => { setSelectedAssignment(null); setSuccessMsg(''); setOtpCode(''); };

  const handleVerifyOtpAndPrecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !otpCode) { alert('Please enter the OTP code from the driver.'); return; }
    if (!licenseValid || !prdpValid || !biltyValid || !materialMatch) {
      alert('Safety check failed. All safety checklist items must be verified to proceed.');
      return;
    }
    setIsSubmitting(true);
    try {
      await drApi.otpVerify(selectedAssignment.id, 'PICKUP', otpCode);
      await srApi.gateCheck(selectedAssignment.id, { license_valid: licenseValid, prdp_valid: prdpValid, bilty_valid: biltyValid, material_match: materialMatch });
      setOtpCode('');
      await loadData();
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

    if (currentStage === 'MINE_GROSS') {
      const tare = selectedAssignment.mine_tare_kg || 0;
      const gross = parseFloat(weightKg) || 0;
      const netPayload = gross - tare;
      const capacityTons = selectedAssignment.vehicle_capacity || 70;
      if (netPayload > capacityTons * 1000) {
        alert(`Weight Check Rejected: Loaded Net Payload (${(netPayload/1000).toFixed(2)} Tons) exceeds the registered truck capacity (${capacityTons}.00 Tons).`);
        return;
      }
    }

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
        const targetQtyTons = selectedAssignment.po_target_qty || 34.0;
        const targetQtyKg = targetQtyTons * 1000;
        setWeightKg(String(parseFloat(weightKg) + targetQtyKg));
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
    } catch (err: any) {
      alert('Bilty upload error: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthorizeJourney = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await srApi.authorizeJourney(selectedAssignment.id);
      const updatedList = await assignmentsApi.list();
      const updated = updatedList.find(a => a.id === selectedAssignment.id);
      if (updated) setSelectedAssignment(updated);
      setAssignments(updatedList);
    } catch (err: any) {
      alert('Authorization error: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepStatus = (a: TransportAssignmentV3) => {
    const hasTare = !!a.mine_tare_kg;
    const hasBilty = !!a.bilty_no;
    const isDispatched = ['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(a.status);
    return {
      step1Done: !['ASSIGNED'].includes(a.status),
      step1Active: a.status === 'ASSIGNED',
      step2Done: hasTare,
      step2Active: !['ASSIGNED'].includes(a.status) && !hasTare,
      step3Done: hasBilty,
      step3Active: hasTare && !hasBilty,
      step4Done: isDispatched,
      step4Active: hasTare && hasBilty && !isDispatched,
      isComplete: isDispatched,
    };
  };

  // ─── DETAIL VIEW ─────────────────────────────────────────────────────────
  if (selectedAssignment) {
    const a = selectedAssignment;
    const steps = getStepStatus(a);

    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Back + PO Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            onClick={handleBack}
            variant="secondary"
            size="sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> All Trucks
          </Button>
          <span style={{ color: 'var(--color-border)' }}>›</span>
          <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>PO #{a.sap_po_no} / {a.po_item_no}</span>
          <span style={{ marginLeft: 'auto' }}><StatusBadge status={a.status} /></span>
        </div>

        {/* Info strip: White card, light blue header */}
        <Card title="Active Run Details" accentColor="var(--color-brand-blue-600)">
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div className="data-pair__label">Driver</div>
              <div className="data-pair__value">{a.driver_name || '—'}</div>
            </div>
            <div>
              <div className="data-pair__label">Truck</div>
              <div className="data-pair__value mono">{a.vehicle_reg || '—'}</div>
            </div>
            <div>
              <div className="data-pair__label">Cargo</div>
              <div className="data-pair__value">{a.material || '—'}</div>
            </div>
            <div>
              <div className="data-pair__label">Date</div>
              <div className="data-pair__value">{a.scheduled_date}</div>
            </div>
          </div>
        </Card>

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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  🔑 Enter Pickup Code (from driver's phone)
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Enter 4-digit code"
                  className="mono"
                  style={{
                    width: '100%', padding: '14px 16px', border: '1.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '24px', fontWeight: 800, letterSpacing: '0.15em',
                    textAlign: 'center', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)'
                  }}
                  required
                />
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>Ask the driver for the code shown on their phone screen.</p>
              </div>

              <div style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Safety Checklist</div>
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
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand-blue-600)' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</span>
                  </label>
                ))}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !otpCode}
                variant="primary"
                style={{ padding: '14px', width: '100%' }}
              >
                {isSubmitting ? 'Verifying...' : 'Verify Driver Code & Save Safety Checklist'}
              </Button>
            </form>
          )}
        </StepCard>

        {/* ── Step 2: Weigh Empty Truck (MINE_TARE) ── */}
        <StepCard
          step={2}
          title="Empty Truck Weighbridge (MINE_TARE)"
          subtitle="Weigh empty truck on scale before entering cargo loading area"
          done={steps.step2Done}
          active={steps.step2Active}
          icon={<Scale size={16} />}
        >
          {steps.step2Active && (
            <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-brand-blue-700)', marginBottom: '4px' }}>
                🚛 STEP 2: EMPTY TRUCK WEIGHBRIDGE (MINE_TARE)
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
                Truck is on scale. Capture empty tare weight before sending truck for loading.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Tare Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  placeholder="10000"
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '20px', fontWeight: 800, textAlign: 'right', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                />
              </div>
              <Button
                onClick={handleLogWeight}
                disabled={isSubmitting || !weightKg}
                variant="primary"
                style={{ width: '100%', marginTop: '14px', padding: '14px' }}
              >
                {isSubmitting ? 'Capturing...' : isMobile ? 'Capture Empty Tare Weight' : 'Capture Empty Weight (MINE_TARE) & Send for Loading'}
              </Button>
            </div>
          )}

          {steps.step2Done && a.mine_tare_kg && (
            <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', color: 'var(--color-brand-blue-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} />
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                TARE CAPTURED: <strong>{a.mine_tare_kg.toLocaleString()} kg</strong>
              </div>
            </div>
          )}
        </StepCard>

        {/* ── Step 3: Upload Bilty ── */}
        <StepCard
          step={3}
          title="Upload Bilty Document"
          subtitle="Record the bilty number and upload the receipt to verify cargo credentials"
          done={steps.step3Done}
          active={steps.step3Active}
          icon={<FileText size={16} />}
        >
          {steps.step3Active && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Bilty Number</label>
                  <input
                    type="text"
                    value={biltyNo}
                    onChange={e => setBiltyNo(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Bilty Date</label>
                  <input
                    type="date"
                    value={biltyDate}
                    onChange={e => setBiltyDate(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Bilty Document</label>
                <select
                  value={uploadUrl}
                  onChange={e => setUploadUrl(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', cursor: 'pointer' }}
                >
                  <option value="/uploads/biltys/bilty_sample.png">{`bilty_sample.png — PO #${a.sap_po_no} (${a.po_target_qty || 34.0} Tons)`}</option>
                  <option value="/uploads/bilty/blt_778899.pdf">BLT-778899 — Standard Demo</option>
                </select>
              </div>

              <Button
                onClick={handleBiltyUpload}
                disabled={isSubmitting}
                variant="primary"
                style={{ padding: '14px', width: '100%' }}
              >
                {isSubmitting ? 'Uploading...' : isMobile ? 'Upload Bilty Document' : 'Upload Bilty & Lock Cargo Details'}
              </Button>
            </div>
          )}

          {steps.step3Done && a.bilty_no && (
            <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', color: 'var(--color-brand-blue-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} />
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                BILTY LOCKED: {a.bilty_no} ({a.bilty_date})
              </div>
            </div>
          )}
        </StepCard>

        {/* ── Step 4: Weigh Loaded Truck & Dispatch (MINE_GROSS) ── */}
        <StepCard
          step={4}
          title="Weigh Loaded Truck & Dispatch"
          subtitle="Weigh loaded truck returning from loading bay and authorize final dispatch"
          done={steps.step4Done}
          active={steps.step4Active}
          icon={<Scale size={16} />}
        >
          {steps.step4Active && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!a.mine_gross_kg ? (
                /* Capture Gross weight */
                <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-brand-blue-700)', marginBottom: '4px' }}>
                    Loaded Gross Weighing
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-body)', marginBottom: '12px' }}>
                    Previously captured Empty Tare Weight: <strong>{a.mine_tare_kg?.toLocaleString()} kg</strong>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Loaded Gross Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      placeholder="40000"
                      style={{ width: '100%', padding: '14px 16px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '20px', fontWeight: 800, textAlign: 'right', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                    />
                  </div>

                  {parseFloat(weightKg) > (a.mine_tare_kg || 0) && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-body)' }}>Calculated Net Payload:</span>
                      <span className="mono" style={{ fontSize: '16px', fontWeight: 900, color: 'var(--color-brand-blue-600)' }}>
                        {(parseFloat(weightKg) - (a.mine_tare_kg || 0)).toLocaleString()} kg ({((parseFloat(weightKg) - (a.mine_tare_kg || 0))/1000).toFixed(2)} Tons)
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={handleLogWeight}
                    disabled={isSubmitting || !weightKg}
                    variant="primary"
                    style={{ width: '100%', marginTop: '14px', padding: '14px' }}
                  >
                    {isSubmitting ? 'Capturing...' : isMobile ? 'Capture Loaded Gross Weight' : 'Capture Loaded Weight (MINE_GROSS) & Finalize Origin Net'}
                  </Button>
                </div>
              ) : (
                /* Weights logged, awaiting Journey Authorization */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', color: 'var(--color-brand-blue-600)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-brand-blue-700)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} /> ORIGIN WEIGHBRIDGE COMPLETE
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                      <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>EMPTY / TARE</div>
                        <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-heading)', marginTop: '2px' }}>{a.mine_tare_kg?.toLocaleString()} kg</div>
                      </div>
                      <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>LOADED / GROSS</div>
                        <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-heading)', marginTop: '2px' }}>{a.mine_gross_kg?.toLocaleString()} kg</div>
                      </div>
                      <div style={{ backgroundColor: 'var(--color-brand-blue-50)', padding: '12px', borderRadius: '8px', border: '2px solid var(--color-brand-blue-600)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-brand-blue-600)', fontWeight: 800 }}>NET PAYLOAD</div>
                        <div className="mono" style={{ fontSize: '16px', fontWeight: 950, color: 'var(--color-brand-blue-600)', marginTop: '2px' }}>{((a.mine_gross_kg || 0) - (a.mine_tare_kg || 0)).toLocaleString()} kg</div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-brand-blue-600)', marginTop: '2px' }}>{(((a.mine_gross_kg || 0) - (a.mine_tare_kg || 0))/1000).toFixed(2)} Tons</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-brand-blue-700)' }}>
                      ✓ WEIGHBRIDGE RECORDS LOCKED & READY FOR DISPATCH
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-brand-blue-600)' }}>
                      The loaded net payload is finalized. Click below to authorize dispatch and release the driver.
                    </div>
                    <Button
                      onClick={handleAuthorizeJourney}
                      disabled={isSubmitting}
                      variant="primary"
                      style={{ width: '100%', marginTop: '6px', padding: '14px' }}
                    >
                      {isSubmitting ? 'Authorizing...' : isMobile ? 'Authorize Dispatch & Release' : 'Authorize Start Journey & Dispatch Vehicle'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </StepCard>

        {/* All done */}
        {steps.isComplete && (
          <div style={{
            textAlign: 'center', padding: '32px',
            backgroundColor: 'var(--color-brand-blue-50)', borderRadius: '18px', border: '1.5px solid var(--color-brand-blue-600)',
            boxShadow: 'var(--shadow-card)'
          }}>
            <CheckCircle2 size={40} color="var(--color-brand-blue-600)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-brand-blue-700)', margin: '0 0 6px' }}>Dispatch Complete!</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-brand-blue-600)', margin: 0, fontWeight: 600 }}>Bilty has been uploaded and truck is successfully dispatched.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ───────────────────────────────────────────────────────────
  const pendingGateCheck = assignments.filter(a => a.status === 'ASSIGNED' || a.status === 'ACCEPTED');
  const pendingWeighbridge = assignments.filter(a => (a.status !== 'ASSIGNED' && !a.mine_tare_kg) || (a.loading_status === 'LOADED' && !a.bilty_no));
  const pendingBilty = assignments.filter(a => a.mine_tare_kg && !a.bilty_no);
  const readyForDispatch = assignments.filter(a => a.bilty_no && a.status !== 'DISPATCHED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Gate & Weighbridge Operations
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            All active truck runs at your gate. Click any truck to process it step by step.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button
            onClick={loadData}
            disabled={loading}
            variant="secondary"
            size="sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Actionable KPI Status Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div className="kpi-card" style={{ borderLeft: pendingGateCheck.length > 0 ? '4px solid #2563EB' : '1px solid var(--color-border)' }}>
          <div>
            <div className="kpi-label">Pending Gate Check</div>
            <div className="kpi-value">{pendingGateCheck.length}</div>
            <div className="kpi-trend kpi-trend--up" style={{ color: pendingGateCheck.length > 0 ? '#2563EB' : 'var(--color-text-muted)' }}>
              {pendingGateCheck.length > 0 ? 'Awaiting OTP & Verification' : 'No trucks pending at gate'}
            </div>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}>
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: pendingWeighbridge.length > 0 ? '4px solid #D97706' : '1px solid var(--color-border)' }}>
          <div>
            <div className="kpi-label">Pending Weighbridge</div>
            <div className="kpi-value">{pendingWeighbridge.length}</div>
            <div className="kpi-trend kpi-trend--up" style={{ color: pendingWeighbridge.length > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)' }}>
              {pendingWeighbridge.length > 0 ? 'Tare / Gross Weighing Needed' : 'No weighbridge queue'}
            </div>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }}>
            <Scale size={20} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: pendingBilty.length > 0 ? '4px solid #DC2626' : '1px solid var(--color-border)' }}>
          <div>
            <div className="kpi-label">Pending Bilty</div>
            <div className="kpi-value">{pendingBilty.length}</div>
            <div className="kpi-trend kpi-trend--down" style={{ color: pendingBilty.length > 0 ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>
              {pendingBilty.length > 0 ? 'Bilty Upload Required' : 'All Biltys uploaded'}
            </div>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)' }}>
            <FileText size={20} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '1px solid var(--color-border)' }}>
          <div>
            <div className="kpi-label">Ready for Dispatch</div>
            <div className="kpi-value">{readyForDispatch.length}</div>
            <div className="kpi-trend kpi-trend--up" style={{ color: 'var(--color-success-text)' }}>
              Pre-dispatch Completed
            </div>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
            <Truck size={20} />
          </div>
        </div>

      </div>

      {/* Full-width Flagged Reviews alert banner */}

      {reviews.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          backgroundColor: 'var(--color-error-bg)', border: '1px solid var(--color-error-light)',
          color: 'var(--color-error-text)', padding: '16px 20px', borderRadius: '12px',
          fontSize: '14px', fontWeight: 700, boxShadow: 'var(--shadow-card)'
        }}>
          <AlertCircle size={20} />
          <div>
            <span>{reviews.length} Items Flagged for Review!</span>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginTop: '2px', color: 'var(--color-error-text)', opacity: 0.85 }}>
              Active dispatch operations are temporarily blocked for these runs pending administrative override.
            </span>
          </div>
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'ACTIVE', label: 'Active Siding Queue', count: assignments.filter(a => isActiveStatus(a.status)).length },
          { id: 'COMPLETED', label: 'Completed Runs', count: assignments.filter(a => !isActiveStatus(a.status)).length }
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading trucks...</div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState icon={<Truck size={48} />} title={activeTab === 'ACTIVE' ? "No Trucks at Gate" : "No Completed Runs"} description={activeTab === 'ACTIVE' ? "No trucks are currently assigned or in transit." : "No completed truck runs in history yet."} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredAssignments.map(a => {
            return (
              <Card
                key={a.id}
                onClick={() => setSelectedAssignment(a)}
                hoverEffect
                style={{ padding: '18px 22px', cursor: 'pointer' }}
              >
                {/* Upper row: PO / Contract / Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-text-primary)' }}>PO #{a.sap_po_no} / {a.po_item_no}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-border)' }}></span>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Contract: C-2026-001</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: a.loading_status === 'LOADED' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', padding: '2px 8px', borderRadius: '4px', color: a.loading_status === 'LOADED' ? 'var(--color-success-text)' : 'var(--color-warning-text)', textTransform: 'uppercase', border: a.loading_status === 'LOADED' ? '1px solid rgba(45, 106, 79, 0.2)' : '1px solid rgba(180, 83, 9, 0.2)' }}>
                      Queue: {a.loading_status || 'PENDING'}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>

                {/* Details row: Driver, Vehicle, Timing */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1.2fr 2fr 1.2fr', gap: '16px', fontSize: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '9px' }}>Driver / Vehicle</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{a.driver_name || '—'}</strong>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Reg: {a.vehicle_reg}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '9px' }}>Weighbridge</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>
                      {a.mine_gross_kg ? 'Step 2 (Gross) Complete' : a.mine_tare_kg ? 'Step 1 (Tare) Complete' : 'Pending Weigh'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '9px' }}>Arrival Timings</span>
                    <span style={{ display: 'block', color: 'var(--color-text-secondary)' }}>Expected: <strong style={{ color: 'var(--color-text-primary)' }}>{a.requested_pickup_datetime ? new Date(a.requested_pickup_datetime).toLocaleString() : '—'}</strong></span>
                    {a.queue_entry_time && (
                      <span style={{ display: 'block', color: 'var(--color-success-text)' }}>Actual: <strong>{new Date(a.queue_entry_time).toLocaleString()}</strong></span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span 
                      className="btn btn-secondary btn-sm"
                      style={{ 
                        backgroundColor: 'var(--color-brand-blue-50)', 
                        color: 'var(--color-brand-blue-600)', 
                        borderColor: 'transparent',
                        fontSize: '12px', 
                        fontWeight: 700 
                      }}
                    >
                      Manage Run <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
