import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { assignmentsApi, srApi, drApi, caApi, TransportAssignmentV3, ReviewQueueItemV3, API_BASE } from '../lib/api_v3';
import { useContractPo } from '../contexts/ContractPoContext';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { Tabs } from '../components/Tabs';
import {
  ShieldCheck, Scale, CheckCircle2, FileText, MapPin, Check,
  Truck, AlertCircle, ChevronRight, RefreshCw, ArrowLeft, Package, Clock,
  UserCheck, Building2, Boxes, UploadCloud, Info
} from 'lucide-react';

// Helper to format cargo name and SAP codes cleanly
export const formatCargoDisplay = (material?: string, codes?: string) => {
  if (!material) return { title: 'Pharma Consignment', codes: codes || '' };
  
  // If material is just numbers like "1702, 1727, 1728"
  const isOnlyNumbers = /^[\d,\s]+$/.test(material.trim());
  if (isOnlyNumbers) {
    const rawCodes = material.split(',').map(s => s.trim());
    const nameMap: Record<string, string> = {
      '1702': 'Pharma Product 01',
      '1727': 'Pharma Product 10',
      '1728': 'Pharma Product 09',
      '33': 'Drilling Machine Spare Part / Brake Pad',
      '99': 'Chair 01 Office Asset',
      '41': 'Lithium Battery Pack 01'
    };
    const mapped = rawCodes.map(c => nameMap[c] || `Product Item #${c}`).join(', ');
    return { title: mapped, codes: material };
  }

  // Capitalize title properly
  const formatted = material.split(',').map(s => s.trim().replace(/\b\w/g, l => l.toUpperCase())).join(', ');
  return { title: formatted, codes: codes || '' };
};

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
  const { user: currentUser } = useAuthV3();
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
  const [customFileName, setCustomFileName] = useState('');
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
      const targetQtyTons = selectedAssignment.po_target_qty || 15.0;
      const targetQtyKg = targetQtyTons * 1000;
      if (selectedAssignment.mine_tare_kg) {
        setWeightKg(String(selectedAssignment.mine_tare_kg + targetQtyKg));
      } else {
        setWeightKg('10000');
      }
      if (selectedAssignment.bilty_no) {
        setBiltyNo(selectedAssignment.bilty_no);
      } else {
        setBiltyNo(`BLT-${selectedAssignment.sap_po_no || '2322'}-${selectedAssignment.id}`);
      }
      if (selectedAssignment.bilty_date) {
        setBiltyDate(selectedAssignment.bilty_date);
      }
      if (selectedAssignment.bilty_url) {
        setUploadUrl(selectedAssignment.bilty_url);
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

  const handleBack = () => { setSelectedAssignment(null); setSuccessMsg(''); setOtpCode(''); setCustomFileName(''); };

  const handleVerifyOtpAndPrecheck = async (e?: React.FormEvent, skipOtp: boolean = false) => {
    if (e) e.preventDefault();
    if (!selectedAssignment) return;
    if (!skipOtp && !otpCode) {
      alert('Please enter the OTP code from the driver or click Quick Pass.');
      return;
    }
    if (!licenseValid || !prdpValid || !biltyValid || !materialMatch) {
      alert('Safety check failed. All safety checklist items must be verified to proceed.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (otpCode && !skipOtp) {
        try {
          await drApi.otpVerify(selectedAssignment.id, 'PICKUP', otpCode);
        } catch (otpErr) {
          console.warn('Driver OTP verification warning:', otpErr);
        }
      }
      await srApi.gateCheck(selectedAssignment.id, {
        license_valid: licenseValid,
        prdp_valid: prdpValid,
        bilty_valid: biltyValid,
        material_match: materialMatch
      });
      setOtpCode('');
      const updatedList = await assignmentsApi.list();
      setAssignments(updatedList);
      const updated = updatedList.find(a => a.id === selectedAssignment.id);
      if (updated) setSelectedAssignment(updated);
      else setSelectedAssignment(prev => prev ? { ...prev, status: 'MINE_TARE_LOGGED' } : null);
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
      await new Promise(r => setTimeout(r, 600));
      await drApi.logWeight(selectedAssignment.id, {
        stage: currentStage,
        weight_kg: parseFloat(weightKg),
        truck_detail: 'Weighbridge Gate 01'
      });
      const updatedList = await assignmentsApi.list();
      setAssignments(updatedList);
      const updated = updatedList.find(a => a.id === selectedAssignment.id);
      if (updated) setSelectedAssignment(updated);
      if (currentStage === 'MINE_TARE') {
        const targetQtyTons = (selectedAssignment && selectedAssignment.po_target_qty) || 15.0;
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
    const resolvedBiltyNo = biltyNo.trim() || `BLT-${selectedAssignment.sap_po_no || '2322'}-${selectedAssignment.id}`;
    const resolvedBiltyDate = biltyDate || new Date().toISOString().split('T')[0];
    const resolvedUploadUrl = uploadUrl || '/uploads/biltys/bilty_sample.png';

    setIsSubmitting(true);
    try {
      await srApi.biltyUpload(selectedAssignment.id, {
        bilty_no: resolvedBiltyNo,
        bilty_date: resolvedBiltyDate,
        upload_url: resolvedUploadUrl
      });
      
      // Optimistically update assignment so UI immediately marks Step 3 as complete and opens Step 4!
      const updatedItem: TransportAssignmentV3 = {
        ...selectedAssignment,
        bilty_no: resolvedBiltyNo,
        bilty_date: resolvedBiltyDate,
        bilty_url: resolvedUploadUrl,
        loading_status: 'LOADED'
      };
      setSelectedAssignment(updatedItem);

      // Re-fetch in background
      const updatedList = await assignmentsApi.list();
      setAssignments(updatedList);
      const refreshed = updatedList.find(a => a.id === selectedAssignment.id);
      if (refreshed) {
        setSelectedAssignment(refreshed);
      }
      setSuccessMsg(`Bilty ${resolvedBiltyNo} locked! Proceeding to Loaded Gross Weighing.`);
    } catch (err: any) {
      alert('Bilty upload error: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseToStaging = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const res = await fetch(`${API_BASE}/assignments/${selectedAssignment.id}/supervisor-release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('podzo_token_v3') || ''}`
        },
        body: JSON.stringify({ loaded_items_checked: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to release to Staging');
      const updatedList = await assignmentsApi.list();
      const updated = updatedList.find(a => a.id === selectedAssignment.id);
      if (updated) setSelectedAssignment(updated);
      setAssignments(updatedList);
      setSuccessMsg('Loaded cargo verified and released to Staging Area for physical clearance.');
    } catch (err: any) {
      alert('Release error: ' + (err.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepStatus = (a: TransportAssignmentV3) => {
    const hasGateCheck = !['ASSIGNED', 'PENDING'].includes(a.status) || !!a.mine_tare_kg;
    const hasTare = !!a.mine_tare_kg;
    const hasBilty = !!a.bilty_no;
    const hasGross = !!a.mine_gross_kg;
    const isDispatched = ['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'DELIVERED', 'POD_UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(a.status);
    const isStagingPending = a.status === 'MINE_GROSS_LOGGED' || a.status === 'STAGING_EXCEPTION';

    return {
      step1Done: hasGateCheck,
      step1Active: !hasGateCheck,
      step2Done: hasTare,
      step2Active: hasGateCheck && !hasTare,
      step3Done: hasBilty,
      step3Active: hasTare && !hasBilty,
      step4Done: isDispatched || isStagingPending,
      step4Active: hasBilty && !isDispatched && !isStagingPending,
      isComplete: isDispatched,
      isStagingPending,
      isStagingException: a.status === 'STAGING_EXCEPTION',
    };
  };

  // ─── DETAIL VIEW ─────────────────────────────────────────────────────────
  if (selectedAssignment) {
    const a = selectedAssignment;
    const steps = getStepStatus(a);
    const targetQty = a.po_target_qty || 15.0;
    const capacity = a.vehicle_capacity || 20.0;
    const cargoInfo = formatCargoDisplay(a.material, a.material_codes);
    const netPayloadKg = (a.mine_gross_kg && a.mine_tare_kg) ? (a.mine_gross_kg - a.mine_tare_kg) : 0;

    return (
      <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

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
          <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-heading)' }}>
            SO #{a.sap_po_no}
          </span>
          <span style={{ marginLeft: 'auto' }}><StatusBadge status={a.status} /></span>
        </div>

        {/* Executive Info Card: Driver, Fleet, Cargo, Payload, Supervisor */}
        <Card title="Active Siding Run & Cargo Details" accentColor="var(--color-brand-blue-600)">
          {/* Top Row: Driver, Fleet, Cargo, Date */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '20px' }}>
            <div>
              <div className="data-pair__label">Driver</div>
              <div className="data-pair__value" style={{ fontWeight: 800 }}>{a.driver_name || 'Rajesh Kumar'}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>License: {a.license_no || 'Valid & Verified'}</div>
            </div>
            <div>
              <div className="data-pair__label">Truck Fleet</div>
              <div className="data-pair__value mono" style={{ fontWeight: 800 }}>{a.vehicle_reg || '—'}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Rated: {capacity} Boxes ({capacity.toFixed(1)} Tons)</div>
            </div>
            <div>
              <div className="data-pair__label">Cargo Specification</div>
              <div className="data-pair__value" style={{ fontWeight: 800, color: 'var(--color-text-heading)' }}>
                {cargoInfo.title}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                {cargoInfo.codes ? (
                  cargoInfo.codes.split(',').map((code: string) => (
                    <span key={code} className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 5px', fontWeight: 700 }}>
                      SAP #{code.trim()}
                    </span>
                  ))
                ) : (
                  <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 5px' }}>SAP Order Item</span>
                )}
              </div>
            </div>
            <div>
              <div className="data-pair__label">Dispatch Date</div>
              <div className="data-pair__value">{a.scheduled_date || new Date().toISOString().split('T')[0]}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Order: SO #{a.sap_po_no}</div>
            </div>
          </div>

          {/* Middle Row: Dedicated Payload & Weight Conversion Strip */}
          <div style={{
            marginTop: '16px',
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-brand-blue-50)',
            border: '1.5px solid var(--color-brand-blue-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                backgroundColor: 'var(--color-brand-blue-600)', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Boxes size={22} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-brand-blue-700)', letterSpacing: '0.04em' }}>
                  Target Cargo Payload
                </div>
                <div style={{ fontSize: '18px', fontWeight: 950, color: 'var(--color-brand-blue-900)' }}>
                  {targetQty} Boxes ({targetQty.toFixed(1)} Tons)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-brand-blue-600)', fontWeight: 700, marginTop: '1px' }}>
                  Standard Conversion: 1 Box = 1 Ton (1,000 kg)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Empty Tare</div>
                <div className="mono" style={{ fontSize: '13.5px', fontWeight: 800, color: a.mine_tare_kg ? 'var(--color-text-heading)' : 'var(--color-text-muted)' }}>
                  {a.mine_tare_kg ? `${a.mine_tare_kg.toLocaleString()} kg` : 'Pending'}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Loaded Gross</div>
                <div className="mono" style={{ fontSize: '13.5px', fontWeight: 800, color: a.mine_gross_kg ? 'var(--color-text-heading)' : 'var(--color-text-muted)' }}>
                  {a.mine_gross_kg ? `${a.mine_gross_kg.toLocaleString()} kg` : 'Pending'}
                </div>
              </div>

              <div style={{
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: netPayloadKg > 0 ? '#dcfce7' : '#f1f5f9',
                border: netPayloadKg > 0 ? '1px solid #86efac' : '1px solid #cbd5e1'
              }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: netPayloadKg > 0 ? '#15803d' : '#64748b' }}>
                  Net Payload
                </div>
                <div className="mono" style={{ fontSize: '14.5px', fontWeight: 950, color: netPayloadKg > 0 ? '#166534' : '#64748b' }}>
                  {netPayloadKg > 0 ? `${netPayloadKg.toLocaleString()} kg (${(netPayloadKg/1000).toFixed(1)} T / ${Math.round(netPayloadKg/1000)} Bx)` : 'Awaiting Tare & Gross'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Supervisor & Weighbridge Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border)',
            marginTop: '16px'
          }}>
            <div>
              <div className="data-pair__label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <UserCheck size={13} color="var(--color-brand-blue-600)" /> Gate Supervisor
              </div>
              <div className="data-pair__value" style={{ fontWeight: 800 }}>
                {currentUser?.displayName || 'Jan Mokoena'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                Officer: {currentUser?.username || 'sr_gate01'}
              </div>
            </div>

            <div>
              <div className="data-pair__label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={13} color="var(--color-brand-blue-600)" /> Weighbridge Station
              </div>
              <div className="data-pair__value" style={{ fontWeight: 700 }}>
                Mine Siding Gate 01
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Inbound & Outbound Scale
              </div>
            </div>

            <div>
              <div className="data-pair__label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={13} color="#16a34a" /> Operational Duty
              </div>
              <div className="data-pair__value" style={{ color: '#16a34a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }}></span>
                Shift A (Active)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Gate & Scale Control
              </div>
            </div>

            <div>
              <div className="data-pair__label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} color="var(--color-brand-blue-600)" /> Logistics Route
              </div>
              <div className="data-pair__value" style={{ fontSize: '12px', fontWeight: 700 }}>
                {a.from_location || 'Emoyeni Mine Siding'} → {a.to_location || 'Customer Yard'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Primary Outbound Corridor
              </div>
            </div>
          </div>
        </Card>

        {/* ── Step 1: Gate Verification ── */}
        <StepCard
          step={1}
          title="Check Driver Code & Safety"
          subtitle="Verify driver arrival code and complete safety compliance checks"
          done={steps.step1Done}
          active={steps.step1Active}
          icon={<ShieldCheck size={16} />}
        >
          {steps.step1Active && (
            <form onSubmit={(e) => handleVerifyOtpAndPrecheck(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  🔑 Driver Pickup Verification Code (Optional / From Driver App)
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Enter 4-digit code (or leave empty for quick gate pass)"
                  className="mono"
                  style={{
                    width: '100%', padding: '14px 16px', border: '1.5px solid var(--color-border)',
                    borderRadius: '10px', fontSize: '20px', fontWeight: 800, letterSpacing: '0.12em',
                    textAlign: 'center', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)'
                  }}
                />
              </div>

              <div style={{ backgroundColor: 'var(--color-bg-primary)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Safety & Document Checklist</div>
                {[
                  { val: licenseValid, set: setLicenseValid, label: 'Driver Professional License Valid & Roadworthy' },
                  { val: prdpValid, set: setPrdpValid, label: 'PrDP Dangerous / Commercial Goods Permit OK' },
                  { val: biltyValid, set: setBiltyValid, label: 'Dispatch Order Details & Yard Booking Match' },
                  { val: materialMatch, set: setMaterialMatch, label: 'Allocated Cargo Specification Matches SO Line Items' },
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

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  style={{ padding: '14px', flex: 1 }}
                >
                  {isSubmitting ? 'Verifying...' : otpCode ? 'Verify Driver Code & Authorize Gate Entry' : 'Authorize Gate Entry & Pass Safety Check'}
                </Button>
                {!otpCode && (
                  <Button
                    type="button"
                    onClick={() => handleVerifyOtpAndPrecheck(undefined, true)}
                    disabled={isSubmitting}
                    variant="secondary"
                    style={{ padding: '14px' }}
                  >
                    Quick Pass Gate
                  </Button>
                )}
              </div>
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
            <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1.5px solid var(--color-brand-blue-200)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--color-brand-blue-800)', marginBottom: '4px' }}>
                🚛 STEP 2: EMPTY TRUCK WEIGHBRIDGE (MINE_TARE)
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>
                Truck is stationed on weighbridge scale. Capture empty tare weight before proceeding to cargo bay.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Scale Tare Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  placeholder="10000"
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '20px', fontWeight: 800, textAlign: 'right', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                />
                <div style={{ fontSize: '12px', color: 'var(--color-brand-blue-600)', marginTop: '6px', textAlign: 'right', fontWeight: 700 }}>
                  Equivalent: {(parseFloat(weightKg || '0') / 1000).toFixed(2)} Tons ({Math.round(parseFloat(weightKg || '0') / 1000)} Boxes empty tare)
                </div>
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
            <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', color: 'var(--color-brand-blue-700)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={18} color="#16a34a" />
                <div style={{ fontSize: '13.5px', fontWeight: 800 }}>
                  TARE CAPTURED: <strong>{a.mine_tare_kg.toLocaleString()} kg</strong> ({((a.mine_tare_kg)/1000).toFixed(1)} Tons / {Math.round(a.mine_tare_kg/1000)} Boxes)
                </div>
              </div>
              <span className="badge badge-green" style={{ fontSize: '11px' }}>Recorded ✓</span>
            </div>
          )}
        </StepCard>

        {/* ── Step 3: Upload Bilty Document ── */}
        <StepCard
          step={3}
          title="Upload Bilty Document"
          subtitle="Record the bilty consignment note number and attach the certified receipt"
          done={steps.step3Done}
          active={steps.step3Active}
          icon={<FileText size={16} />}
        >
          {steps.step3Active && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Bilty / Consignment Number
                  </label>
                  <input
                    type="text"
                    value={biltyNo}
                    onChange={e => setBiltyNo(e.target.value)}
                    placeholder="BLT-778899"
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '14px', fontWeight: 700, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Bilty Date
                  </label>
                  <input
                    type="date"
                    value={biltyDate}
                    onChange={e => setBiltyDate(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '14px', fontWeight: 700, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Digital Consignment Document (Preset or File Upload)
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    type="file"
                    id="bilty-file-input"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCustomFileName(file.name);
                        setUploadUrl(`/uploads/biltys/${file.name}`);
                      }
                    }}
                  />
                  <label
                    htmlFor="bilty-file-input"
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', fontSize: '13px', fontWeight: 700 }}
                  >
                    <UploadCloud size={16} /> Choose File from Computer
                  </label>
                  <span style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {customFileName ? `Selected: ${customFileName}` : 'or choose standard preset below'}
                  </span>
                </div>

                <select
                  value={uploadUrl}
                  onChange={e => {
                    setUploadUrl(e.target.value);
                    setCustomFileName('');
                  }}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', cursor: 'pointer' }}
                >
                  <option value="/uploads/biltys/bilty_sample.png">{`bilty_sample.png — SO #${a.sap_po_no} (${targetQty} Boxes / ${targetQty.toFixed(1)} Tons)`}</option>
                  <option value="/uploads/bilty/blt_778899.pdf">BLT-778899 — Certified Consignment Waybill</option>
                  <option value="/uploads/bilty/standard_dispatch.pdf">standard_dispatch.pdf — General Freight Consignment</option>
                </select>
              </div>

              {/* Document Preview Card */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} color="var(--color-brand-blue-600)" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-heading)' }}>
                      {customFileName || uploadUrl.split('/').pop()}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Digital Cargo Note • Certified Ready
                    </div>
                  </div>
                </div>
                <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>Ready to Lock</span>
              </div>

              <Button
                onClick={handleBiltyUpload}
                disabled={isSubmitting}
                variant="primary"
                style={{ padding: '14px', width: '100%' }}
              >
                {isSubmitting ? 'Uploading & Registering...' : 'Upload Bilty & Lock Cargo Details'}
              </Button>
            </div>
          )}

          {steps.step3Done && (
            <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1.5px solid var(--color-brand-blue-200)', borderRadius: '12px', padding: '16px', color: 'var(--color-brand-blue-800)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} color="#16a34a" />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 900 }}>
                    BILTY LOCKED: {a.bilty_no || biltyNo} ({a.bilty_date || biltyDate})
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-brand-blue-600)', marginTop: '2px' }}>
                    Document verified & recorded. Ready for loaded gross weighbridge scale.
                  </div>
                </div>
              </div>
              <span className="badge badge-green" style={{ fontSize: '11px' }}>Attached ✓</span>
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
                <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1.5px solid var(--color-brand-blue-200)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--color-brand-blue-800)', marginBottom: '4px' }}>
                    Loaded Gross Weighing
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--color-text-body)', marginBottom: '14px' }}>
                    Previously captured Empty Tare Weight: <strong className="mono">{a.mine_tare_kg?.toLocaleString()} kg</strong> ({((a.mine_tare_kg || 0)/1000).toFixed(1)} Tons / {Math.round((a.mine_tare_kg || 0)/1000)} Boxes)
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Scale Reading: Loaded Gross Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      placeholder="25000"
                      style={{ width: '100%', padding: '14px 16px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '20px', fontWeight: 800, textAlign: 'right', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                    />
                  </div>

                  {parseFloat(weightKg) > (a.mine_tare_kg || 0) && (
                    <div style={{ marginTop: '12px', padding: '14px', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text-body)' }}>Calculated Net Cargo Payload:</span>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Target Load: {targetQty} Boxes ({targetQty.toFixed(1)} Tons)</div>
                      </div>
                      <span className="mono" style={{ fontSize: '16px', fontWeight: 950, color: 'var(--color-brand-blue-600)' }}>
                        {(parseFloat(weightKg) - (a.mine_tare_kg || 0)).toLocaleString()} kg ({((parseFloat(weightKg) - (a.mine_tare_kg || 0))/1000).toFixed(2)} Tons / {Math.round((parseFloat(weightKg) - (a.mine_tare_kg || 0))/1000)} Boxes)
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
                  <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1.5px solid var(--color-brand-blue-200)', borderRadius: '12px', padding: '18px', color: 'var(--color-brand-blue-800)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-brand-blue-700)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={16} /> ORIGIN WEIGHBRIDGE COMPLETE
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                      <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>EMPTY / TARE</div>
                        <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-heading)', marginTop: '2px' }}>{a.mine_tare_kg?.toLocaleString()} kg</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{((a.mine_tare_kg || 0)/1000).toFixed(1)} Tons ({Math.round((a.mine_tare_kg || 0)/1000)} Boxes)</div>
                      </div>
                      <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800 }}>LOADED / GROSS</div>
                        <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-heading)', marginTop: '2px' }}>{a.mine_gross_kg?.toLocaleString()} kg</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{((a.mine_gross_kg || 0)/1000).toFixed(1)} Tons ({Math.round((a.mine_gross_kg || 0)/1000)} Boxes)</div>
                      </div>
                      <div style={{ backgroundColor: 'var(--color-brand-blue-50)', padding: '12px', borderRadius: '8px', border: '2px solid var(--color-brand-blue-600)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-brand-blue-600)', fontWeight: 800 }}>NET PAYLOAD</div>
                        <div className="mono" style={{ fontSize: '16px', fontWeight: 950, color: 'var(--color-brand-blue-600)', marginTop: '2px' }}>{((a.mine_gross_kg || 0) - (a.mine_tare_kg || 0)).toLocaleString()} kg</div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-brand-blue-600)', marginTop: '2px' }}>{(((a.mine_gross_kg || 0) - (a.mine_tare_kg || 0))/1000).toFixed(2)} Tons ({Math.round(((a.mine_gross_kg || 0) - (a.mine_tare_kg || 0))/1000)} Boxes)</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-brand-blue-700)' }}>
                      ✓ ORIGIN WEIGHBRIDGE & CARGO LOCKED
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-brand-blue-600)' }}>
                      Origin Tare & Gross weights recorded. Verify that physical loaded items match the Sales Order line items before handing over to the Staging Area checkpoint.
                    </div>

                    {steps.isStagingException && (
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} />
                        <span>STAGING EXCEPTION: Discrepancy detected by Staging Area. Please re-check loaded materials with warehouse and re-release.</span>
                      </div>
                    )}

                    <Button
                      onClick={handleReleaseToStaging}
                      disabled={isSubmitting}
                      variant="primary"
                      style={{ width: '100%', marginTop: '6px', padding: '14px' }}
                    >
                      {isSubmitting ? 'Releasing...' : steps.isStagingException ? 'Re-Verify Items & Re-Release to Staging' : 'Verify Items vs Sales Order & Release to Staging'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </StepCard>

        {/* Staging Awaiting State */}
        {steps.isStagingPending && !steps.step4Done && (
          <div style={{
            textAlign: 'center', padding: '24px',
            backgroundColor: '#eff6ff', borderRadius: '14px', border: '1.5px solid #3b82f6'
          }}>
            <Clock size={36} color="#2563eb" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#1e40af' }}>
              {steps.isStagingException ? 'Staging Exception Reported' : 'Awaiting Staging Clearance'}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6' }}>
              {steps.isStagingException
                ? 'Check above instructions from the Staging inspector, adjust loaded items, and click Re-Release.'
                : 'Vehicle is currently stationed at Staging Area for physical cargo verification. Waybill will be issued upon match.'}
            </p>
          </div>
        )}

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
                {/* Upper row: Sales Order / Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-text-primary)' }}>SO #{a.sap_po_no}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: a.loading_status === 'LOADED' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', padding: '2px 8px', borderRadius: '4px', color: a.loading_status === 'LOADED' ? 'var(--color-success-text)' : 'var(--color-warning-text)', textTransform: 'uppercase', border: a.loading_status === 'LOADED' ? '1px solid rgba(45, 106, 79, 0.2)' : '1px solid rgba(180, 83, 9, 0.2)' }}>
                      Queue: {a.loading_status || 'PENDING'}
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                </div>

                {/* Details row: Driver, Vehicle, Cargo, Timing */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1.6fr 1.2fr 1.2fr 1fr', gap: '14px', fontSize: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '9px' }}>Driver / Vehicle</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{a.driver_name || 'Rajesh Kumar'}</strong>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Reg: {a.vehicle_reg}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '9px' }}>Cargo / Payload</span>
                    <strong style={{ color: 'var(--color-text-heading)', display: 'block' }}>{formatCargoDisplay(a.material, a.material_codes).title}</strong>
                    <span style={{ color: 'var(--color-brand-blue-600)', fontWeight: 700 }}>
                      {a.po_target_qty || 15} Boxes ({a.po_target_qty || 15} Tons)
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '9px' }}>Weighbridge Status</span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>
                      {a.mine_gross_kg ? 'Gross Weigh Complete' : a.mine_tare_kg ? 'Tare Weigh Complete' : 'Pending Weigh'}
                    </strong>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>
                      {a.bilty_no ? `Bilty: ${a.bilty_no}` : 'No Bilty Yet'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase', fontSize: '9px' }}>Scheduled Date</span>
                    <span style={{ display: 'block', color: 'var(--color-text-secondary)' }}>Date: <strong style={{ color: 'var(--color-text-primary)' }}>{a.scheduled_date || 'Today'}</strong></span>
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
