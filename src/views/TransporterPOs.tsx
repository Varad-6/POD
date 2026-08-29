import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, CheckCircle2, Truck, User, Check,
  Package, ArrowLeft, AlertCircle, ChevronRight, RefreshCw,
  Plus, Trash2, ChevronDown, ChevronUp, Layers, Zap, MapPin
} from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { useContractPo } from '../contexts/ContractPoContext';
import { taApi, transportersApi, assignmentsApi, JobConfigV3, PoItemV3, Driver, VehicleEnriched, MultiTruckAssignPayload } from '../lib/api_v3';
import { EmptyState } from '../components/EmptyState';
import { Tabs } from '../components/Tabs';
import { formatCurrency } from '../utils/format';

const InfoRow: React.FC<{ label: string; value: string | number; mono?: boolean; highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <span className={mono ? 'mono' : ''} style={{ fontSize: '14.5px', fontWeight: 700, color: highlight ? 'var(--color-brand-blue-600)' : 'var(--color-text-heading)' }}>{value}</span>
  </div>
);

const StepBadge: React.FC<{ step: number; active: boolean; done: boolean; label: string }> = ({ step, active, done, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
    <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: done || active ? 'var(--color-brand-blue-600)' : 'var(--color-border)', color: '#fff', fontWeight: 800, fontSize: '14px', transition: 'all 0.2s' }}>
      {done ? <Check size={18} /> : step}
    </div>
    <span style={{ fontSize: '11.5px', fontWeight: active ? 800 : 600, color: done || active ? 'var(--color-brand-blue-700)' : 'var(--color-text-body)', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
  </div>
);

interface SlotSelectOption { value: string; label: string; blocked?: boolean; blockedReason?: string; }
const SlotSelect: React.FC<{ value: string; options: SlotSelectOption[]; placeholder: string; onChange: (v: string) => void; borderColor?: string }> = ({ value, options, placeholder, onChange, borderColor }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '10px 12px', border: `1.5px solid ${borderColor || 'var(--color-border)'}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999, overflow: 'hidden', maxHeight: '220px', overflowY: 'auto' }}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => { if (!opt.blocked) { onChange(opt.value); setOpen(false); } }}
              style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: opt.blocked ? '#DC2626' : 'var(--color-text-primary)', backgroundColor: value === opt.value ? 'var(--color-brand-blue-50)' : opt.blocked ? '#FFF5F5' : '#fff', cursor: opt.blocked ? 'not-allowed' : 'pointer', textDecoration: opt.blocked ? 'line-through' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6' }}
              onMouseEnter={e => { if (!opt.blocked) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F9FAFB'; }}
              onMouseLeave={e => { if (!opt.blocked) (e.currentTarget as HTMLDivElement).style.backgroundColor = value === opt.value ? 'var(--color-brand-blue-50)' : '#fff'; }}
            >
              <span>{opt.label}</span>
              {opt.blocked && <span style={{ fontSize: '10px', fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '2px 7px', borderRadius: '5px', marginLeft: '6px', textDecoration: 'none', whiteSpace: 'nowrap' }}>{opt.blockedReason}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TransporterPOs: React.FC = () => {
  const { user } = useAuthV3();
  const { selectedPoId, purchaseOrders } = useContractPo();
  const [jobConfigs, setJobConfigs] = useState<JobConfigV3[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<VehicleEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'ASSIGNED'>('ALL');
  const [selectedJC, setSelectedJC] = useState<JobConfigV3 | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [assignmentStep, setAssignmentStep] = useState(1);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupLocation, setPickupLocation] = useState('MON1 Plant / Siding');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ driverId: string; vehicleId: string; qty: string }[]>([{ driverId: '', vehicleId: '', qty: '' }]);
  const [compatData, setCompatData] = useState<{ can_single_truck: boolean; min_trucks_needed: number; recommended_body_type: string } | null>(null);
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const transporterId = user?.entityId || 1;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingList, assignedList, drs, activeAssigns] = await Promise.all([
        taApi.getJobConfigs('PENDING'), taApi.getJobConfigs('ASSIGNED'),
        transportersApi.drivers(transporterId), assignmentsApi.list().catch(() => [])
      ]);
      setJobConfigs([...pendingList, ...assignedList]);
      setDrivers(drs); setAssignmentsList(activeAssigns);
    } catch (err) { console.error('Failed to load:', err); } finally { setLoading(false); }
  }, [transporterId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!selectedJC) return;
    const totalQty = selectedJC.total_planned_qty || selectedJC.target_qty || 0;
    const primaryMaterial = selectedJC.po_items?.[0]?.material || selectedJC.material || '';
    transportersApi.compatibleVehicles(transporterId, totalQty, primaryMaterial)
      .then(data => {
        setVehicles(data.vehicles as VehicleEnriched[]);
        setCompatData({ can_single_truck: data.can_single_truck, min_trucks_needed: data.min_trucks_needed, recommended_body_type: data.recommended_body_type });
        const needed = Math.max(1, data.min_trucks_needed || 1);
        setSlots(Array.from({ length: needed }, () => ({ driverId: '', vehicleId: '', qty: '' })));
      })
      .catch(() => { transportersApi.vehicles(transporterId).then(vhs => setVehicles(vhs as VehicleEnriched[])); });
  }, [selectedJC, transporterId]);

  const activePoObject = selectedPoId === 'ALL' ? null : purchaseOrders.find(p => p.id === Number(selectedPoId));
  const filteredJobConfigs = jobConfigs.filter(jc => {
    if (activeFilter === 'PENDING' && jc.status !== 'PENDING') return false;
    if (activeFilter === 'ASSIGNED' && jc.status !== 'ASSIGNED') return false;
    if (selectedPoId !== 'ALL' && activePoObject && jc.sap_po_no !== activePoObject.sap_po_no) return false;
    return true;
  });

  const handleOpenJC = (jc: JobConfigV3) => { setSelectedJC(jc); setAssignmentStep(1); setSuccessMsg(null); setSlots([{ driverId: '', vehicleId: '', qty: '' }]); setCompatData(null); };
  const handleBack = () => { setSelectedJC(null); setSuccessMsg(null); };
  const addSlot = () => setSlots(s => [...s, { driverId: '', vehicleId: '', qty: '' }]);
  const removeSlot = (i: number) => setSlots(s => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, field: 'driverId' | 'vehicleId' | 'qty', val: string) =>
    setSlots(s => s.map((slot, idx) => idx === i ? { ...slot, [field]: val } : slot));

  const totalPlanQty = selectedJC?.total_planned_qty || selectedJC?.target_qty || 0;
  const sumAssigned = slots.reduce((s, slot) => s + (Number(slot.qty) || 0), 0);
  const remaining = totalPlanQty > 0 ? totalPlanQty - sumAssigned : 0;
  const isFullyAllocated = totalPlanQty > 0 ? Math.abs(remaining) < 0.5 : slots.every(s => s.driverId && s.vehicleId);
  const allSlotsHaveDriverTruck = slots.every(s => s.driverId && s.vehicleId);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJC) return;
    setIsSubmitting(true);
    try {
      const payload: MultiTruckAssignPayload = {
        assignments: slots.map(slot => {
          const dr = drivers.find(d => d.id === parseInt(slot.driverId));
          return { driver_id: parseInt(slot.driverId), vehicle_id: parseInt(slot.vehicleId), license_no: dr?.license_no || 'DL-TEMP', gstin: '27AABCS0001A1Z1', assigned_qty: Number(slot.qty) || totalPlanQty / slots.length };
        }),
        scheduled_date: scheduledDate, location: pickupLocation,
      };
      const result = await taApi.assignJob(selectedJC.id, payload);
      setSuccessMsg(`${result.truck_count} truck${(result.truck_count || 1) > 1 ? 's' : ''} assigned to PO #${selectedJC.sap_po_no}!`);
      await loadData();
    } catch (err: any) { alert(err.message || 'Something went wrong.'); } finally { setIsSubmitting(false); }
  };

  const pendingCount = jobConfigs.filter(j => j.status === 'PENDING').length;
  const assignedCount = jobConfigs.filter(j => j.status === 'ASSIGNED').length;

  if (selectedJC) {
    const isAssigned = selectedJC.status === 'ASSIGNED';
    const poItems: PoItemV3[] = selectedJC.po_items || [];
    const isMultiItem = poItems.length > 1;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={handleBack} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ArrowLeft size={14} /> Back to All Orders</button>
          <span style={{ color: 'var(--color-border)', fontSize: '13px' }}>›</span>
          <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>PO #{selectedJC.sap_po_no}{isMultiItem ? ` · ${poItems.length} items` : ` / ${selectedJC.po_item_no}`}</span>
        </div>
        <div style={{ background: 'linear-gradient(135deg, var(--color-brand-blue-600) 0%, var(--color-brand-blue-700) 100%)', borderRadius: '16px', padding: '28px 32px', color: '#fff', marginBottom: '24px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Transport {isMultiItem ? 'Execution' : 'Purchase Order'}</div>
              <h1 className="mono" style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>PO #{selectedJC.sap_po_no} {isMultiItem ? '' : `/ ${selectedJC.po_item_no}`}</h1>
              {isMultiItem ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {poItems.map(item => (
                    <div key={item.po_id} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '10px', padding: '8px 14px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Item {item.po_item_no}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{item.material}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{item.planned_qty} {item.uom} @ {formatCurrency(item.rate)}/T</div>
                    </div>
                  ))}
                </div>
              ) : (<p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 600 }}>{selectedJC.material} — {selectedJC.target_qty} Tons @ {formatCurrency(selectedJC.rate || 0)}/Ton</p>)}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '6px' }}>Total Value</div>
              <div className="mono" style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>{formatCurrency(isMultiItem ? poItems.reduce((s, i) => s + i.planned_qty * i.rate, 0) : (selectedJC.rate || 0) * (selectedJC.target_qty || 0))}</div>
              <div style={{ marginTop: '8px' }}>{isAssigned ? <span className="badge badge-green">✓ Assigned</span> : <span className="badge badge-amber">⏳ Pending</span>}</div>
              {isMultiItem && <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{poItems.length} items · {totalPlanQty} Tons total</div>}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', padding: '24px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><Package size={16} color="var(--color-brand-blue-600)" /><span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>Order Details</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isMultiItem ? poItems.map(item => (
                <div key={item.po_id} style={{ padding: '12px', borderRadius: '10px', background: 'var(--color-bg-page)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Item {item.po_item_no}</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-heading)', marginBottom: '4px' }}>{item.material}</div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-body)' }}><span style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{item.planned_qty} {item.uom}</span><span>{item.body_icon} {item.body_type}</span></div>
                </div>
              )) : (<><InfoRow label="Material / Product" value={selectedJC.material || '—'} /><InfoRow label="Quantity (Target)" value={`${selectedJC.target_qty} Tons`} highlight /><InfoRow label="Rate per Ton" value={formatCurrency(selectedJC.rate || 0)} mono /><InfoRow label="Delivery Window" value={selectedJC.availability_window || '06:00–18:00'} /></>)}
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', padding: '24px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}><MapPin size={16} color="var(--color-brand-blue-600)" /><span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>Route Information</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InfoRow label="Loading Point (Origin)" value="MON1 Plant / Siding" />
              <InfoRow label="Delivery Point (Destination)" value="PODZO Mining – Emoyeni Siding" />
              <InfoRow label="Delivery Deadline" value={selectedJC.timebound || '2026-12-31'} />
              <InfoRow label="Tender Acceptance Limit" value="4 Hours (Standard)" />
            </div>
          </div>
        </div>
        {successMsg ? (
          <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1.5px solid var(--color-success-light)', borderRadius: '16px', padding: '40px 32px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <CheckCircle2 size={56} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-success-text)', margin: '0 0 8px' }}>Fleet Assigned Successfully!</h2>
            <p style={{ fontSize: '14px', color: 'var(--color-success-text)', margin: '0 0 24px' }}>{successMsg}</p>
            <button onClick={handleBack} className="btn btn-primary" style={{ minHeight: '44px' }}>Back to All Orders</button>
          </div>
        ) : isAssigned ? (
          <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', padding: '28px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}><CheckCircle2 size={20} color="var(--color-success)" /><h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-success-text)' }}>This order is already assigned</h3></div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-body)', margin: 0 }}>Driver(s) and truck(s) have been assigned. Track the delivery from your dashboard.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-brand-blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size={20} color="#fff" /></div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--color-text-heading)' }}>Assign Fleet & Dispatch</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', margin: 0 }}>{compatData?.can_single_truck === false ? `Split load required — minimum ${compatData.min_trucks_needed} trucks needed` : 'Select driver(s) and truck(s) for this delivery run'}</p>
              </div>
              {compatData && !compatData.can_single_truck && (<span style={{ background: '#FFF3CD', border: '1px solid #FFCA28', color: '#856404', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={12} /> Split Load</span>)}
            </div>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StepBadge step={1} active={assignmentStep === 1} done={assignmentStep > 1} label="Cargo Review" />
              <div style={{ flex: 1, height: '2.5px', backgroundColor: assignmentStep > 1 ? 'var(--color-brand-blue-600)' : 'var(--color-border)', borderRadius: '2px', transition: 'background-color 0.3s' }} />
              <StepBadge step={2} active={assignmentStep === 2} done={assignmentStep > 2} label="Assign Fleet" />
              <div style={{ flex: 1, height: '2.5px', backgroundColor: assignmentStep > 2 ? 'var(--color-brand-blue-600)' : 'var(--color-border)', borderRadius: '2px', transition: 'background-color 0.3s' }} />
              <StepBadge step={3} active={assignmentStep === 3} done={false} label="Confirm & Dispatch" />
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div style={{ padding: '24px 28px' }}>
                {assignmentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'var(--color-bg-page)', borderRadius: '12px', padding: '20px', border: '1.5px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Package size={15} color="var(--color-brand-blue-600)" /><span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Cargo Breakdown</span></div>
                      {poItems.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {poItems.map(item => (
                            <div key={item.po_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-heading)' }}>{item.body_icon} {item.material}<span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Item {item.po_item_no}</span></div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-body)', marginTop: '2px' }}>Body required: <strong>{item.body_type}</strong></div>
                              </div>
                              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-brand-blue-600)' }}>{item.planned_qty} {item.uom}</div><div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{formatCurrency(item.rate)}/T</div></div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: '2px solid var(--color-border)', marginTop: '4px', fontWeight: 800 }}>
                            <span style={{ color: 'var(--color-text-heading)' }}>TOTAL REQUIRED</span>
                            <span style={{ color: 'var(--color-brand-blue-600)', fontSize: '16px' }}>{totalPlanQty} Tons</span>
                          </div>
                        </div>
                      ) : (<div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}><strong>{selectedJC.material}</strong> — {totalPlanQty} Tons</div>)}
                    </div>
                    {compatData && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', background: compatData.can_single_truck ? '#F0FDF4' : '#FFFBEB', border: `1.5px solid ${compatData.can_single_truck ? '#BBF7D0' : '#FCD34D'}` }}>
                        {compatData.can_single_truck ? <CheckCircle2 size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: compatData.can_single_truck ? '#15803D' : '#92400E' }}>{compatData.can_single_truck ? 'Single truck can handle this load' : `Split load required — ${compatData.min_trucks_needed} trucks minimum`}</div>
                          <div style={{ fontSize: '12px', color: compatData.can_single_truck ? '#166534' : '#92400E', marginTop: '2px' }}>Recommended body: <strong>{compatData.recommended_body_type}</strong>{!compatData.can_single_truck && `. ${compatData.min_trucks_needed} truck slots pre-added below.`}</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setAssignmentStep(2)} className="btn btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}>Next: Assign Fleet <ChevronRight size={16} /></button>
                    </div>
                  </div>
                )}
                {assignmentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: '12px', background: isFullyAllocated ? '#F0FDF4' : '#FFFBEB', border: `1.5px solid ${isFullyAllocated ? '#BBF7D0' : '#FCD34D'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Layers size={18} color={isFullyAllocated ? '#16A34A' : '#D97706'} /><span style={{ fontWeight: 700, fontSize: '13px', color: isFullyAllocated ? '#15803D' : '#92400E' }}>{isFullyAllocated ? '✅ Fully allocated' : `⚠️ ${remaining.toFixed(1)} Tons still unassigned`}</span></div>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '12px', fontWeight: 700 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Required: <strong style={{ color: 'var(--color-text-heading)' }}>{totalPlanQty}T</strong></span>
                        <span style={{ color: 'var(--color-brand-blue-600)' }}>Assigned: <strong>{sumAssigned.toFixed(1)}T</strong></span>
                        {!isFullyAllocated && <span style={{ color: '#D97706' }}>Remaining: <strong>{remaining.toFixed(1)}T</strong></span>}
                      </div>
                    </div>
                    {slots.map((slot, i) => {
                      const selVehicle = vehicles.find(v => v.id === parseInt(slot.vehicleId));
                      const selDriver = drivers.find(d => d.id === parseInt(slot.driverId));
                      const slotQty = Number(slot.qty) || 0;
                      const overCapacity = selVehicle && slotQty > selVehicle.capacity;
                      const activeDrJob = slot.driverId ? assignmentsList.find((a: any) => a.driver_id === parseInt(slot.driverId) && !['DELIVERED','POD_UPLOADED','APPROVED','INVOICED','MIRO_PARKED','MIRO_POSTED','CLEARED'].includes(a.status)) : null;
                      const usedDriverIds = new Set(slots.filter((_, j) => j !== i).map(s => s.driverId).filter(Boolean));
                      const usedVehicleIds = new Set(slots.filter((_, j) => j !== i).map(s => s.vehicleId).filter(Boolean));
                      return (
                        <div key={i} style={{ border: `2px solid ${overCapacity ? '#F87171' : slot.driverId && slot.vehicleId ? 'var(--color-brand-blue-600)' : 'var(--color-border)'}`, borderRadius: '14px', padding: '18px', background: slot.driverId && slot.vehicleId && !overCapacity ? 'var(--color-brand-blue-50)' : '#fff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-brand-blue-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>{i + 1}</div>
                              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-heading)' }}>Truck Slot {i + 1}</span>
                              {selVehicle && <span style={{ fontSize: '11px', background: 'var(--color-brand-blue-100)', color: 'var(--color-brand-blue-700)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>{selVehicle.capacity}T cap</span>}
                            </div>
                            {slots.length > 1 && (<button type="button" onClick={() => removeSlot(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}><Trash2 size={16} /></button>)}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            {/* Driver */}
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Driver</label>
                              <SlotSelect
                                value={slot.driverId}
                                placeholder="Select driver..."
                                borderColor={activeDrJob ? '#F87171' : undefined}
                                onChange={v => updateSlot(i, 'driverId', v)}
                                options={drivers.map(d => {
                                  const busy = !!assignmentsList.find((a: any) => a.driver_id === d.id && !['DELIVERED','POD_UPLOADED','APPROVED','INVOICED','MIRO_PARKED','MIRO_POSTED','CLEARED'].includes(a.status));
                                  const taken = usedDriverIds.has(String(d.id));
                                  const slotNum = taken ? slots.findIndex((s, j) => j !== i && s.driverId === String(d.id)) + 1 : null;
                                  return { value: String(d.id), label: d.name, blocked: busy || taken, blockedReason: busy ? '⛔ On job' : taken ? `Slot ${slotNum}` : undefined };
                                })}
                              />
                              {activeDrJob && <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '4px', fontWeight: 700 }}>⛔ Driver is on an active job!</div>}
                            </div>
                            {/* Truck */}
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Truck</label>
                              <SlotSelect
                                value={slot.vehicleId}
                                placeholder="Select truck..."
                                borderColor={overCapacity ? '#F87171' : undefined}
                                onChange={v => updateSlot(i, 'vehicleId', v)}
                                options={vehicles.map(v => {
                                  const taken = usedVehicleIds.has(String(v.id));
                                  const slotNum = taken ? slots.findIndex((s, j) => j !== i && s.vehicleId === String(v.id)) + 1 : null;
                                  return { value: String(v.id), label: `${v.reg_no} (${v.capacity}T)`, blocked: v.is_busy || taken, blockedReason: v.is_busy ? '⛔ Busy' : taken ? `Slot ${slotNum}` : undefined };
                                })}
                              />
                              {overCapacity && <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '4px', fontWeight: 700 }}>⛔ Exceeds {selVehicle?.capacity}T!</div>}
                            </div>
                            {/* Qty */}
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Qty (Tons)</label>
                              <input type="number" min="0.1" max={selVehicle?.capacity} step="0.5" value={slot.qty} onChange={e => updateSlot(i, 'qty', e.target.value)} placeholder="" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${overCapacity ? '#F87171' : 'var(--color-border)'}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" onClick={addSlot} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: '1.5px dashed var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-blue-600)' }}><Plus size={16} /> Add Another Truck</button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                      <button type="button" onClick={() => setAssignmentStep(1)} className="btn btn-secondary" style={{ padding: '12px 20px' }}>← Back</button>
                      <button type="button" onClick={() => setAssignmentStep(3)} disabled={!allSlotsHaveDriverTruck || !isFullyAllocated} className="btn btn-primary" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px', opacity: (!allSlotsHaveDriverTruck || !isFullyAllocated) ? 0.5 : 1 }}>Next: Review & Confirm <ChevronRight size={16} /></button>
                    </div>
                  </div>
                )}
                {assignmentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'var(--color-brand-blue-50)', padding: '20px', borderRadius: '12px', border: '1.5px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-brand-blue-700)', textTransform: 'uppercase', margin: '0 0 16px 0', letterSpacing: '0.04em' }}>Fleet Summary — {slots.length} Truck{slots.length > 1 ? 's' : ''}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {slots.map((slot, i) => {
                          const dr = drivers.find(d => d.id === parseInt(slot.driverId));
                          const veh = vehicles.find(v => v.id === parseInt(slot.vehicleId));
                          return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-brand-blue-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                                <div><div style={{ fontWeight: 700, fontSize: '13px' }}>🚚 {veh?.reg_no} ({veh?.capacity}T) — {dr?.name}</div><div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>License: {dr?.license_no}</div></div>
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-brand-blue-600)' }}>{slot.qty}T</div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '10px 16px', background: 'var(--color-brand-blue-600)', borderRadius: '10px', color: '#fff', fontWeight: 800 }}><span>TOTAL DISPATCHING</span><span>{sumAssigned.toFixed(1)} Tons across {slots.length} truck{slots.length > 1 ? 's' : ''}</span></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div><label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Scheduled Date</label><input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }} required /></div>
                      <div><label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Pickup Siding</label><input type="text" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }} required /></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                      <button type="button" onClick={() => setAssignmentStep(2)} className="btn btn-secondary" style={{ padding: '12px 20px' }}>← Back to Fleet</button>
                      <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800 }}>{isSubmitting ? 'Dispatching...' : <><CheckCircle2 size={16} /> Confirm & Dispatch {slots.length} Truck{slots.length > 1 ? 's' : ''}</>}</button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  const filtered = filteredJobConfigs;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Purchase Orders</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>All transport POs assigned to your company. Click any order to view details & assign fleet.</p>
        </div>
        <button onClick={loadData} disabled={loading} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh</button>
      </div>
      <Tabs tabs={[{ id: 'ALL', label: 'All Orders', count: jobConfigs.length }, { id: 'PENDING', label: 'Needs Driver', count: pendingCount }, { id: 'ASSIGNED', label: 'Driver Assigned', count: assignedCount }]} activeTab={activeFilter} onChange={(id) => setActiveFilter(id as any)} />
      {loading ? (<div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>Loading purchase orders...</div>
      ) : filtered.length === 0 ? (<EmptyState icon={<FileText size={48} />} title="No Orders Found" description="No purchase orders match this filter." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((jc: JobConfigV3) => {
            const isPending = jc.status === 'PENDING';
            const isMulti = (jc.item_count || 0) > 1;
            const isExpanded = expandedCards.has(jc.id);
            const poItems: PoItemV3[] = jc.po_items || [];
            return (
              <div key={jc.id} style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                <div onClick={() => handleOpenJC(jc)} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all var(--transition-normal)' }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--color-bg-page)'; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = ''; }}>
                  <div style={{ width: '4px', height: isMulti ? '72px' : '56px', borderRadius: '2px', backgroundColor: isPending ? 'var(--color-warning)' : 'var(--color-brand-blue-600)', flexShrink: 0 }} />
                  <div style={{ flexShrink: 0, minWidth: '160px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO Number / Item</div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-text-primary)' }}>#{jc.sap_po_no}{!isMulti ? ` / ${jc.po_item_no}` : ''}</div>
                    {isMulti && <div style={{ marginTop: '4px' }}><span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--color-brand-blue-600)', color: '#fff', padding: '2px 8px', borderRadius: '6px' }}>{jc.item_count} items</span></div>}
                  </div>
                  <div style={{ width: '1px', height: '48px', backgroundColor: 'var(--color-border)' }} />
                  <div style={{ flex: 2 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</div>
                    {isMulti ? (<div><div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{poItems[0]?.material}</div><div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>+ {(jc.item_count || 1) - 1} more item{(jc.item_count || 1) > 2 ? 's' : ''}</div></div>) : (<div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{jc.material}</div>)}
                  </div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Qty</div><div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{jc.total_planned_qty || jc.target_qty || 0} Tons</div></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate / Ton</div><div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{formatCurrency(jc.rate || 0)}</div></div>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isPending ? <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><AlertCircle size={12} /> Assign Driver</span> : <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><CheckCircle2 size={12} /> Assigned</span>}
                    {isMulti && (<button type="button" onClick={e => { e.stopPropagation(); setExpandedCards(prev => { const next = new Set(prev); next.has(jc.id) ? next.delete(jc.id) : next.add(jc.id); return next; }); }} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', padding: '4px 6px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>)}
                    <ChevronRight size={18} color="var(--color-text-muted)" />
                  </div>
                </div>
                {isMulti && isExpanded && (
                  <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 24px 16px', background: 'var(--color-bg-page)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '10px', paddingLeft: '24px' }}>All Items in this Job</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '24px' }}>
                      {poItems.map(item => (
                        <div key={item.po_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fff', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '16px' }}>{item.body_icon}</span><div><div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-heading)' }}>{item.material}</div><div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Item {item.po_item_no} · {item.body_type}</div></div></div>
                          <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-brand-blue-600)' }}>{item.planned_qty} {item.uom}</div><div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{formatCurrency(item.rate)}/T</div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


