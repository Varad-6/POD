import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText, CheckCircle2, Truck, User, Check,
  Package, ArrowLeft, AlertCircle, ChevronRight, RefreshCw,
  Plus, Trash2, ChevronDown, ChevronUp, Layers, Zap, MapPin, X
} from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { useContractPo } from '../contexts/ContractPoContext';
import {
  taApi, transportersApi, assignmentsApi,
  JobConfigV3, PoItemV3, Driver, VehicleEnriched, MultiTruckAssignPayload
} from '../lib/api_v3';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Tabs } from '../components/Tabs';
import { Table } from '../components/Table';
import { FilterBar, FilterChip } from '../components/FilterBar';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/PageHeader';
import { formatCurrency } from '../utils/format';

const InfoRow: React.FC<{ label: string; value: string | number; mono?: boolean; highlight?: boolean }> = ({
  label, value, mono, highlight
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </span>
    <span className={mono ? 'mono' : ''} style={{ fontSize: '14px', fontWeight: 700, color: highlight ? 'var(--color-brand-blue-600)' : 'var(--color-text-heading)' }}>
      {value}
    </span>
  </div>
);

const StepBadge: React.FC<{ step: number; active: boolean; done: boolean; label: string }> = ({
  step, active, done, label
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div style={{
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: done ? 'var(--color-brand-blue-600)' : active ? 'var(--color-brand-blue-600)' : '#E2E8F0',
      color: done || active ? '#FFFFFF' : 'var(--color-text-muted)',
      fontWeight: 700,
      fontSize: '13px',
      transition: 'all 0.2s'
    }}>
      {done ? <Check size={16} /> : step}
    </div>
    <span style={{
      fontSize: '13px',
      fontWeight: active ? 700 : 500,
      color: done || active ? 'var(--color-brand-blue-700)' : 'var(--color-text-muted)',
      whiteSpace: 'nowrap'
    }}>
      {label}
    </span>
  </div>
);

interface SlotSelectOption { value: string; label: string; blocked?: boolean; blockedReason?: string; }

const SlotSelect: React.FC<{
  value: string;
  options: SlotSelectOption[];
  placeholder: string;
  onChange: (v: string) => void;
  borderColor?: string;
}> = ({ value, options, placeholder, onChange, borderColor }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '8px 12px',
          border: `1.5px solid ${borderColor || 'var(--color-border)'}`,
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 600,
          backgroundColor: '#FFFFFF',
          color: selected ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 999,
          overflow: 'hidden',
          maxHeight: '220px',
          overflowY: 'auto'
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => {
                if (!opt.blocked) {
                  onChange(opt.value);
                  setOpen(false);
                }
              }}
              style={{
                padding: '9px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: opt.blocked ? '#DC2626' : 'var(--color-text-primary)',
                backgroundColor: value === opt.value ? 'var(--color-brand-blue-50)' : opt.blocked ? '#FFF5F5' : '#FFFFFF',
                cursor: opt.blocked ? 'not-allowed' : 'pointer',
                textDecoration: opt.blocked ? 'line-through' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #F3F4F6'
              }}
              onMouseEnter={e => {
                if (!opt.blocked) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F8FAFC';
              }}
              onMouseLeave={e => {
                if (!opt.blocked) (e.currentTarget as HTMLDivElement).style.backgroundColor = value === opt.value ? 'var(--color-brand-blue-50)' : '#FFFFFF';
              }}
            >
              <span>{opt.label}</span>
              {opt.blocked && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#DC2626',
                  background: '#FEE2E2',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginLeft: '6px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap'
                }}>
                  {opt.blockedReason}
                </span>
              )}
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
  
  // Filter States
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ASSIGNED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJC, setSelectedJC] = useState<JobConfigV3 | null>(null);

  // Pagination States (Reference Screenshot 2)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Guided Assignment Step States (Step 1, Step 2, Step 3)
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
        taApi.getJobConfigs('PENDING').catch(() => []),
        taApi.getJobConfigs('ASSIGNED').catch(() => []),
        transportersApi.drivers(transporterId).catch(() => []),
        assignmentsApi.list().catch(() => [])
      ]);
      setJobConfigs([...(Array.isArray(pendingList) ? pendingList : []), ...(Array.isArray(assignedList) ? assignedList : [])]);
      setDrivers(Array.isArray(drs) ? drs : []);
      setAssignmentsList(Array.isArray(activeAssigns) ? activeAssigns : []);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [transporterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedJC) return;
    const totalQty = selectedJC.total_planned_qty || selectedJC.target_qty || 0;
    const primaryMaterial = selectedJC.po_items?.[0]?.material || selectedJC.material || '';
    transportersApi.compatibleVehicles(transporterId, totalQty, primaryMaterial)
      .then(data => {
        setVehicles(data.vehicles as VehicleEnriched[]);
        setCompatData({
          can_single_truck: data.can_single_truck,
          min_trucks_needed: data.min_trucks_needed,
          recommended_body_type: data.recommended_body_type
        });
        const needed = Math.max(1, data.min_trucks_needed || 1);
        setSlots(Array.from({ length: needed }, () => ({ driverId: '', vehicleId: '', qty: '' })));
      })
      .catch(() => {
        transportersApi.vehicles(transporterId).then(vhs => setVehicles(vhs as VehicleEnriched[]));
      });
  }, [selectedJC, transporterId]);

  const activePoObject = selectedPoId === 'ALL' ? null : purchaseOrders.find(p => p.id === Number(selectedPoId));

  // Filtered list
  const filteredJobConfigs = useMemo(() => {
    return jobConfigs.filter(jc => {
      // Tab filter
      if (activeTab === 'PENDING' && jc.status !== 'PENDING') return false;
      if (activeTab === 'ASSIGNED' && jc.status !== 'ASSIGNED') return false;

      // Text search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesPo = jc.sap_po_no ? jc.sap_po_no.toLowerCase().includes(term) : false;
        const matchesMat = (jc.material || '').toLowerCase().includes(term);
        const matchesCustomer = (jc.customer_name || '').toLowerCase().includes(term);
        const matchesItem = jc.po_items?.some(i => i.material.toLowerCase().includes(term));
        if (!matchesPo && !matchesMat && !matchesCustomer && !matchesItem) return false;
      }

      return true;
    });
  }, [jobConfigs, activeTab, searchTerm]);

  // Paginated list
  const paginatedJobConfigs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobConfigs.slice(start, start + pageSize);
  }, [filteredJobConfigs, currentPage, pageSize]);

  // Counts for tabs
  const pendingCount = useMemo(() => jobConfigs.filter(j => j.status === 'PENDING').length, [jobConfigs]);
  const assignedCount = useMemo(() => jobConfigs.filter(j => j.status === 'ASSIGNED').length, [jobConfigs]);

  // Filter chips
  const filterChips: FilterChip[] = useMemo(() => {
    const chips: FilterChip[] = [];
    if (searchTerm) {
      chips.push({
        id: 'search',
        label: `Search: "${searchTerm}"`,
        onRemove: () => setSearchTerm('')
      });
    }
    if (activeTab !== 'ALL') {
      chips.push({
        id: 'tab',
        label: `Status: ${activeTab === 'PENDING' ? 'Needs Driver' : 'Driver Assigned'}`,
        onRemove: () => setActiveTab('ALL')
      });
    }
    return chips;
  }, [searchTerm, activeTab]);

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setActiveTab('ALL');
  };

  const handleOpenJC = (jc: JobConfigV3) => {
    setSelectedJC(jc);
    setAssignmentStep(1);
    setSuccessMsg(null);
    setSlots([{ driverId: '', vehicleId: '', qty: '' }]);
    setCompatData(null);
  };

  const handleBack = () => {
    setSelectedJC(null);
    setSuccessMsg(null);
  };

  const addSlot = () => setSlots(s => [...s, { driverId: '', vehicleId: '', qty: '' }]);
  const removeSlot = (i: number) => setSlots(s => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, field: 'driverId' | 'vehicleId' | 'qty', val: string) => {
    setSlots(s => s.map((slot, idx) => idx === i ? { ...slot, [field]: val } : slot));
  };

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
          return {
            driver_id: parseInt(slot.driverId),
            vehicle_id: parseInt(slot.vehicleId),
            license_no: dr?.license_no || 'DL-TEMP',
            gstin: '27AABCS0001A1Z1',
            assigned_qty: Number(slot.qty) || totalPlanQty / slots.length
          };
        }),
        scheduled_date: scheduledDate,
        location: pickupLocation,
      };
      await new Promise(r => setTimeout(r, 1200));
      const result = await taApi.assignJob(selectedJC.id, payload);
      setSuccessMsg(`${result.truck_count} truck${(result.truck_count || 1) > 1 ? 's' : ''} assigned to PO #${selectedJC.sap_po_no}!`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: ORDER DETAIL & FLEET ASSIGNMENT VIEW
  // ─────────────────────────────────────────────────────────────
  if (selectedJC) {
    const isAssigned = selectedJC.status === 'ASSIGNED';
    const poItems: PoItemV3[] = selectedJC.po_items || [];
    const isMultiItem = poItems.length > 1;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto' }}>
        
        {/* Navigation Breadcrumb / Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button 
            onClick={handleBack} 
            variant="secondary" 
            size="sm" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to All Orders
          </Button>
          <span style={{ color: 'var(--color-border)', fontSize: '14px' }}>/</span>
          <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
            Order #{selectedJC.sap_po_no}{isMultiItem ? ` (${poItems.length} items)` : ` / ${selectedJC.po_item_no}`}
          </span>
        </div>

        {/* Header Summary Card (Clean Fiori style) */}
        <Card style={{ padding: '20px 24px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Purchase Order / Transport Execution
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 className="mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-heading)', margin: 0 }}>
                  PO #{selectedJC.sap_po_no} {!isMultiItem && `/ ${selectedJC.po_item_no}`}
                </h1>
                <StatusBadge status={isAssigned ? 'Assigned' : 'Pending'} />
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-body)', marginTop: '4px', fontWeight: 500 }}>
                Customer: <strong>{selectedJC.customer_name || 'Jindal Steel & Power'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Total Quantity</span>
                <strong style={{ fontSize: '18px', color: 'var(--color-brand-blue-600)' }}>
                  {totalPlanQty} TON
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Total Value</span>
                <span className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading)' }}>
                  {formatCurrency(isMultiItem ? poItems.reduce((s, i) => s + i.planned_qty * i.rate, 0) : (selectedJC.rate || 0) * (selectedJC.target_qty || 0))}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* General Info & Route Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <Card title="Order Specifications" subtitle="Product cargo & delivery details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {isMultiItem ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {poItems.map(item => (
                    <div key={item.po_id} style={{ padding: '10px 12px', borderRadius: '6px', background: '#F8F9FA', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Item #{item.po_item_no}</div>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-heading)' }}>{item.material}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Required Body: {item.body_type}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)', fontSize: '14px' }}>{item.planned_qty} {item.uom}</div>
                        <div className="mono" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{formatCurrency(item.rate)}/TON</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <InfoRow label="Material / Product" value={selectedJC.material || '—'} />
                  <InfoRow label="Target Payload" value={`${selectedJC.target_qty} TON`} highlight />
                  <InfoRow label="Agreed Rate" value={`${formatCurrency(selectedJC.rate || 0)} / TON`} mono />
                  <InfoRow label="Pickup Window" value={selectedJC.availability_window || '06:00–18:00'} />
                </>
              )}
            </div>
          </Card>

          <Card title="Route & Schedule Coordinates" subtitle="Origin and destination parameters">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <InfoRow label="Loading Point (Origin)" value="MON1 Plant / Siding Yard 1001" />
              <InfoRow label="Delivery Point (Destination)" value={selectedJC.customer_name || 'PODZO Siding Yard'} />
              <InfoRow label="Delivery Deadline" value={selectedJC.timebound || '2026-12-31'} />
              <InfoRow label="Tender Acceptance Limit" value="4 Hours (Standard SAP SLA)" />
            </div>
          </Card>
        </div>

        {/* Assignment Workflow / Success / Status */}
        {successMsg ? (
          <Card style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0', padding: '36px 24px', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#16A34A" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#15803D', margin: '0 0 8px' }}>Fleet Assigned Successfully!</h2>
            <p style={{ fontSize: '14px', color: '#166534', margin: '0 0 20px' }}>{successMsg}</p>
            <Button onClick={handleBack} variant="primary">Back to All Orders</Button>
          </Card>
        ) : isAssigned ? (
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <CheckCircle2 size={18} color="var(--color-success)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-text-heading)' }}>
                This order is already assigned
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              Driver(s) and truck(s) have been allocated. You can track progress and milestones on your dashboard.
            </p>
          </Card>
        ) : (
          <Card 
            title="Assign Fleet & Dispatch" 
            subtitle={compatData?.can_single_truck === false ? `Split load required — minimum ${compatData.min_trucks_needed} trucks needed` : 'Select driver(s) and vehicle(s) for this transport run'}
            style={{ padding: 0 }}
          >
            {/* Step Progress Indicator (Section 13) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: '#F8F9FA',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <StepBadge step={1} active={assignmentStep === 1} done={assignmentStep > 1} label="1. Cargo Review" />
              <div style={{ flex: 1, height: '1.5px', backgroundColor: assignmentStep > 1 ? 'var(--color-brand-blue-600)' : 'var(--color-border)', margin: '0 8px' }} />
              <StepBadge step={2} active={assignmentStep === 2} done={assignmentStep > 2} label="2. Assign Fleet" />
              <div style={{ flex: 1, height: '1.5px', backgroundColor: assignmentStep > 2 ? 'var(--color-brand-blue-600)' : 'var(--color-border)', margin: '0 8px' }} />
              <StepBadge step={3} active={assignmentStep === 3} done={false} label="3. Confirm & Dispatch" />
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div style={{ padding: '20px 24px' }}>
                
                {/* STEP 1: CARGO REVIEW */}
                {assignmentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ backgroundColor: '#F8F9FA', borderRadius: '6px', padding: '16px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Package size={15} color="var(--color-brand-blue-600)" />
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
                          Cargo Breakdown
                        </span>
                      </div>

                      {poItems.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {poItems.map(item => (
                            <div key={item.po_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-heading)' }}>
                                  {item.body_icon} {item.material}
                                  <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Item #{item.po_item_no}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                  Required Body: <strong>{item.body_type}</strong>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-brand-blue-600)' }}>{item.planned_qty} {item.uom}</div>
                                <div className="mono" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{formatCurrency(item.rate)}/TON</div>
                              </div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1.5px solid var(--color-border)', marginTop: '4px', fontWeight: 700 }}>
                            <span style={{ color: 'var(--color-text-heading)', fontSize: '13px' }}>TOTAL REQUIRED PAYLOAD</span>
                            <span style={{ color: 'var(--color-brand-blue-600)', fontSize: '15px' }}>{totalPlanQty} TON</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                          <strong>{selectedJC.material}</strong> — {totalPlanQty} TON
                        </div>
                      )}
                    </div>

                    {compatData && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '14px 16px',
                        borderRadius: '6px',
                        background: compatData.can_single_truck ? '#F0FDF4' : '#FFFBEB',
                        border: `1px solid ${compatData.can_single_truck ? '#BBF7D0' : '#FCD34D'}`
                      }}>
                        {compatData.can_single_truck ? (
                          <CheckCircle2 size={18} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                        ) : (
                          <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: compatData.can_single_truck ? '#15803D' : '#92400E' }}>
                            {compatData.can_single_truck ? 'Single truck can handle this load' : `Split load required — ${compatData.min_trucks_needed} trucks minimum`}
                          </div>
                          <div style={{ fontSize: '12px', color: compatData.can_single_truck ? '#166534' : '#92400E', marginTop: '2px' }}>
                            Recommended body: <strong>{compatData.recommended_body_type}</strong>{!compatData.can_single_truck && `. ${compatData.min_trucks_needed} truck slots pre-configured.`}
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                      <Button type="button" onClick={() => setAssignmentStep(2)} variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Next: Assign Fleet <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: ASSIGN FLEET */}
                {assignmentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      background: isFullyAllocated ? '#F0FDF4' : '#FFFBEB',
                      border: `1px solid ${isFullyAllocated ? '#BBF7D0' : '#FCD34D'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={16} color={isFullyAllocated ? '#16A34A' : '#D97706'} />
                        <span style={{ fontWeight: 700, fontSize: '13px', color: isFullyAllocated ? '#15803D' : '#92400E' }}>
                          {isFullyAllocated ? 'Fully Allocated' : `${remaining.toFixed(1)} TON Still Unassigned`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Required: <strong style={{ color: 'var(--color-text-heading)' }}>{totalPlanQty}T</strong></span>
                        <span style={{ color: 'var(--color-brand-blue-600)' }}>Assigned: <strong>{sumAssigned.toFixed(1)}T</strong></span>
                        {!isFullyAllocated && <span style={{ color: '#D97706' }}>Remaining: <strong>{remaining.toFixed(1)}T</strong></span>}
                      </div>
                    </div>

                    {slots.map((slot, i) => {
                      const selVehicle = vehicles.find(v => v.id === parseInt(slot.vehicleId));
                      const slotQty = Number(slot.qty) || 0;
                      const overCapacity = selVehicle && slotQty > selVehicle.capacity;
                      const activeDrJob = slot.driverId ? assignmentsList.find((a: any) => a.driver_id === parseInt(slot.driverId) && !['DELIVERED','POD_UPLOADED','APPROVED','INVOICED','MIRO_PARKED','MIRO_POSTED','CLEARED'].includes(a.status)) : null;
                      const usedDriverIds = new Set(slots.filter((_, j) => j !== i).map(s => s.driverId).filter(Boolean));
                      const usedVehicleIds = new Set(slots.filter((_, j) => j !== i).map(s => s.vehicleId).filter(Boolean));

                      return (
                        <div 
                          key={i} 
                          style={{
                            border: `1.5px solid ${overCapacity ? '#F87171' : slot.driverId && slot.vehicleId ? 'var(--color-brand-blue-600)' : 'var(--color-border)'}`,
                            borderRadius: '6px',
                            padding: '14px 16px',
                            backgroundColor: slot.driverId && slot.vehicleId && !overCapacity ? 'var(--color-brand-blue-50)' : '#FFFFFF'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-brand-blue-600)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                                {i + 1}
                              </div>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-heading)' }}>
                                Truck Slot {i + 1}
                              </span>
                              {selVehicle && (
                                <span className="badge badge-blue">
                                  {selVehicle.capacity}T capacity
                                </span>
                              )}
                            </div>
                            {slots.length > 1 && (
                              <button 
                                type="button" 
                                onClick={() => removeSlot(i)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                            {/* Driver Select */}
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Driver
                              </label>
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
                              {activeDrJob && <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '2px', fontWeight: 700 }}>⛔ Driver is on active job</div>}
                            </div>

                            {/* Truck Select */}
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Truck
                              </label>
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
                              {overCapacity && <div style={{ fontSize: '10px', color: '#DC2626', marginTop: '2px', fontWeight: 700 }}>⛔ Exceeds {selVehicle?.capacity}T!</div>}
                            </div>

                            {/* Qty Input */}
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Qty (TON)
                              </label>
                              <input 
                                type="number" 
                                min="0.1" 
                                max={selVehicle?.capacity} 
                                step="0.5" 
                                value={slot.qty} 
                                onChange={e => updateSlot(i, 'qty', e.target.value)} 
                                className="form-input"
                                placeholder="Tonnage"
                                style={{ fontSize: '13px' }} 
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <Button 
                      type="button" 
                      onClick={addSlot} 
                      variant="secondary" 
                      size="sm"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Plus size={14} /> Add Another Truck Slot
                    </Button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                      <Button type="button" onClick={() => setAssignmentStep(1)} variant="secondary">
                        ← Back to Review
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setAssignmentStep(3)} 
                        disabled={!allSlotsHaveDriverTruck || !isFullyAllocated} 
                        variant="primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: (!allSlotsHaveDriverTruck || !isFullyAllocated) ? 0.5 : 1 }}
                      >
                        Next: Review & Confirm <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: CONFIRM & DISPATCH */}
                {assignmentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: 'var(--color-brand-blue-50)', padding: '16px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-blue-700)', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.04em' }}>
                        Fleet Allocation Summary — {slots.length} Truck{slots.length > 1 ? 's' : ''}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {slots.map((slot, i) => {
                          const dr = drivers.find(d => d.id === parseInt(slot.driverId));
                          const veh = vehicles.find(v => v.id === parseInt(slot.vehicleId));
                          return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--color-brand-blue-600)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                                  {i + 1}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '13px' }}>
                                    🚚 {veh?.reg_no} ({veh?.capacity}T) — {dr?.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                    License: {dr?.license_no}
                                  </div>
                                </div>
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--color-brand-blue-600)' }}>
                                {slot.qty} TON
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '12px',
                        padding: '10px 14px',
                        background: 'var(--color-brand-blue-600)',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}>
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>TOTAL ALLOCATED PAYLOAD</span>
                        <span>{sumAssigned.toFixed(1)} TON across {slots.length} truck{slots.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Scheduled Date
                        </label>
                        <input 
                          type="date" 
                          value={scheduledDate} 
                          onChange={e => setScheduledDate(e.target.value)} 
                          className="form-input"
                          style={{ fontSize: '13px' }} 
                          required 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Pickup Siding
                        </label>
                        <input 
                          type="text" 
                          value={pickupLocation} 
                          onChange={e => setPickupLocation(e.target.value)} 
                          className="form-input"
                          style={{ fontSize: '13px' }} 
                          required 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                      <Button type="button" onClick={() => setAssignmentStep(2)} variant="secondary">
                        ← Back to Fleet
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        variant="primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <CheckCircle2 size={16} />
                        {isSubmitting ? 'Dispatching...' : `Confirm & Dispatch ${slots.length} Truck${slots.length > 1 ? 's' : ''}`}
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            </form>
          </Card>
        )}

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: ORDERS LIST (Directly matching Reference Screenshots 2 & 3)
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Page Header */}
      <PageHeader 
        title="Purchase Orders"
        subtitle="Transport execution orders assigned to your company. Select any order to inspect details and assign fleet."
        actions={
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </Button>
        }
      />

      {/* 2. Top Tabs (Reference Screenshot 2) */}
      <Tabs 
        tabs={[
          { id: 'ALL', label: 'All Orders', count: jobConfigs.length },
          { id: 'PENDING', label: 'Needs Driver', count: pendingCount },
          { id: 'ASSIGNED', label: 'Driver Assigned', count: assignedCount }
        ]} 
        activeTab={activeTab} 
        onChange={(id) => {
          setActiveTab(id as any);
          setCurrentPage(1);
          loadData();
        }} 
      />

      {/* 3. Filter Bar (Reference Screenshot 3) */}
      <FilterBar
        title="Filter Orders"
        count={filteredJobConfigs.length}
        searchValue={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by PO number, customer, material..."
        chips={filterChips}
        onClearAllChips={handleClearAllFilters}
      />

      {/* 4. Orders Table Card (Reference Screenshot 2) */}
      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Loading purchase orders...
          </div>
        ) : filteredJobConfigs.length === 0 ? (
          <EmptyState 
            icon={<FileText size={44} />} 
            title="No Orders Found" 
            description="No transport purchase orders match the current search or filters." 
          />
        ) : (
          <>
            <Table<JobConfigV3>
              data={paginatedJobConfigs}
              onRowClick={(jc) => handleOpenJC(jc)}
              columns={[
                {
                  header: 'Order Number',
                  render: (jc) => (
                    <span 
                      className="mono" 
                      style={{ 
                        fontWeight: 700, 
                        color: 'var(--color-brand-blue-600)',
                        cursor: 'pointer',
                        textDecoration: 'none'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenJC(jc);
                      }}
                    >
                      #{jc.sap_po_no} {jc.item_count && jc.item_count > 1 ? '' : `/ ${jc.po_item_no}`}
                    </span>
                  )
                },
                {
                  header: 'Customer',
                  render: (jc) => (
                    <span style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>
                      {jc.customer_name || 'Jindal Steel & Power'}
                    </span>
                  )
                },
                {
                  header: 'Material / Items',
                  render: (jc) => {
                    const isMulti = (jc.item_count || 0) > 1;
                    if (isMulti) {
                      return (
                        <span className="badge badge-blue">
                          {jc.item_count} Items
                        </span>
                      );
                    }
                    return <span>{jc.material || 'Washed Coal Grade A'}</span>;
                  }
                },
                {
                  header: 'Quantity',
                  render: (jc) => (
                    <span style={{ fontWeight: 700 }}>
                      {jc.total_planned_qty || jc.target_qty || 0} TON
                    </span>
                  )
                },
                {
                  header: 'Rate / Amount',
                  render: (jc) => (
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-700)' }}>
                      {formatCurrency(jc.rate || 0)} / TON
                    </span>
                  )
                },
                {
                  header: 'Status',
                  render: (jc) => (
                    <StatusBadge status={jc.status === 'PENDING' ? 'Pending' : 'Assigned'} />
                  )
                },
                {
                  header: 'Actions',
                  render: (jc) => (
                    <Button 
                      variant={jc.status === 'PENDING' ? 'primary' : 'secondary'} 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenJC(jc);
                      }}
                    >
                      {jc.status === 'PENDING' ? 'Assign Fleet' : 'View Details'}
                    </Button>
                  )
                }
              ]}
            />

            {/* 5. Pagination (Reference Screenshot 2) */}
            <Pagination 
              currentPage={currentPage}
              totalItems={filteredJobConfigs.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </Card>

    </div>
  );
};
