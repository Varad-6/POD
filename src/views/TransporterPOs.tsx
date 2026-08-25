import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, Truck, User, Calendar, MapPin, Check,
  Package, ArrowLeft, Clock, AlertCircle, ChevronRight, RefreshCw
} from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { useContractPo } from '../contexts/ContractPoContext';
import { taApi, transportersApi, assignmentsApi, JobConfigV3, Driver, Vehicle } from '../lib/api_v3';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Tabs } from '../components/Tabs';
import { formatCurrency } from '../utils/format';

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string | number; mono?: boolean; highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <span className={mono ? 'mono' : ''} style={{ fontSize: '14.5px', fontWeight: 700, color: highlight ? 'var(--color-brand-blue-600)' : 'var(--color-text-heading)' }}>
      {value}
    </span>
  </div>
);

const StepBadge: React.FC<{ step: number; active: boolean; done: boolean; label: string }> = ({ step, active, done, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: done || active ? 'var(--color-brand-blue-600)' : 'var(--color-border)',
      color: '#fff',
      fontWeight: 800, fontSize: '14px', transition: 'all 0.2s'
    }}>
      {done ? <Check size={18} /> : step}
    </div>
    <span style={{ fontSize: '11px', fontWeight: 700, color: done ? 'var(--color-brand-blue-700)' : active ? 'var(--color-brand-blue-600)' : 'var(--color-text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const TransporterPOs: React.FC = () => {
  const { user } = useAuthV3();
  const { selectedPoId, purchaseOrders } = useContractPo();
  const [jobConfigs, setJobConfigs] = useState<JobConfigV3[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'ASSIGNED'>('ALL');
  const [selectedPO, setSelectedPO] = useState<JobConfigV3 | null>(null);

  // Assignment form state
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupLocation, setPickupLocation] = useState('MON1 Plant / Siding');
  const [assignmentStep, setAssignmentStep] = useState(1);
  const [successPO, setSuccessPO] = useState<string | null>(null);

  const transporterId = user?.entityId || 1;
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingList, assignedList, drs, vhs, activeAssigns] = await Promise.all([
        taApi.getJobConfigs('PENDING'),
        taApi.getJobConfigs('ASSIGNED'),
        transportersApi.drivers(transporterId),
        transportersApi.vehicles(transporterId),
        assignmentsApi.list().catch(() => [])
      ]);
      setJobConfigs([...pendingList, ...assignedList]);
      setDrivers(drs);
      setVehicles(vhs);
      setAssignmentsList(activeAssigns);
      setSelectedVehicleId('');
      setSelectedDriverId('');
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const activePoObject = selectedPoId === 'ALL' ? null : purchaseOrders.find(p => p.id === Number(selectedPoId));

  const filteredJobConfigs = jobConfigs.filter(jc => {
    if (activeFilter === 'PENDING' && jc.status !== 'PENDING') return false;
    if (activeFilter === 'ASSIGNED' && jc.status !== 'ASSIGNED') return false;
    if (selectedPoId !== 'ALL' && activePoObject && jc.sap_po_no !== activePoObject.sap_po_no) return false;
    return true;
  });

  const handleOpenPO = (jc: JobConfigV3) => {
    setSelectedPO(jc);
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setAssignmentStep(1);
    setSuccessPO(null);
  };

  const handleBack = () => { setSelectedPO(null); setSuccessPO(null); };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO || !selectedDriverId || !selectedVehicleId) return;
    setIsSubmitting(true);
    try {
      const dr = drivers.find(d => d.id === parseInt(selectedDriverId));
      await taApi.assignJob(selectedPO.id, {
        driver_id: parseInt(selectedDriverId),
        vehicle_id: parseInt(selectedVehicleId),
        license_no: dr?.license_no || 'DL-TEMP',
        gstin: '27AABCS0001A1Z1',
        scheduled_date: scheduledDate,
        location: pickupLocation
      });
      setSuccessPO(selectedPO.sap_po_no || '');
      await loadData();
    } catch (err) {
      console.error('Failed to assign:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = jobConfigs.filter(j => j.status === 'PENDING').length;
  const assignedCount = jobConfigs.filter(j => j.status === 'ASSIGNED').length;

  const selectedDriver = drivers.find(d => d.id === parseInt(selectedDriverId));
  const selectedVehicle = vehicles.find(v => v.id === parseInt(selectedVehicleId));

  // ─── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (selectedPO) {
    const isAssigned = selectedPO.status === 'ASSIGNED';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '900px', margin: '0 auto' }}>

        {/* Back button + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={handleBack}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> Back to All Orders
          </button>
          <span style={{ color: 'var(--color-border)', fontSize: '13px' }}>›</span>
          <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
            PO #{selectedPO.sap_po_no}
          </span>
        </div>

        {/* PO Header Banner (V3 Blue Theme) */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-brand-blue-600) 0%, var(--color-brand-blue-700) 100%)',
          borderRadius: '16px', padding: '28px 32px', color: '#fff',
          marginBottom: '24px', position: 'relative', overflow: 'hidden',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '160px', height: '160px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-blue-50)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Transport Purchase Order
              </div>
              <h1 className="mono" style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                PO #{selectedPO.sap_po_no}
              </h1>
              <p style={{ fontSize: '14.5px', color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 600 }}>
                {selectedPO.material || 'Washed Coal'} — {selectedPO.target_qty || 34} Tons @ {formatCurrency(selectedPO.rate || 151.5)}/Ton
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-blue-50)', textTransform: 'uppercase', marginBottom: '6px' }}>Total Value</div>
              <div className="mono" style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF' }}>
                {formatCurrency((selectedPO.rate || 151.5) * (selectedPO.target_qty || 34))}
              </div>
              <div style={{ marginTop: '8px' }}>
                {isAssigned ? (
                  <span className="badge badge-green">✓ Assigned</span>
                ) : (
                  <span className="badge badge-amber">⏳ Pending</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PO Detail Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Order Details Card */}
          <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', padding: '24px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Package size={16} color="var(--color-brand-blue-600)" />
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>Order Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InfoRow label="Material / Product" value={selectedPO.material || 'SL BIT 20% ASH Washed Coal'} />
              <InfoRow label="Quantity (Target)" value={`${selectedPO.target_qty || 34} Tons`} highlight />
              <InfoRow label="Rate per Ton" value={formatCurrency(selectedPO.rate || 151.5)} mono />
              <InfoRow label="Delivery Window" value={selectedPO.availability_window || '06:00–18:00'} />
            </div>
          </div>

          {/* Route Details Card */}
          <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', padding: '24px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <MapPin size={16} color="var(--color-brand-blue-600)" />
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>Route Information</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InfoRow label="Loading Point (Origin)" value="MON1 Plant / Siding" />
              <InfoRow label="Delivery Point (Destination)" value="PODZO Mining – Emoyeni Siding" />
              <InfoRow label="Delivery Deadline" value={selectedPO.timebound || '2026-08-16'} />
              <InfoRow label="Tender Acceptance Limit" value="4 Hours (Standard)" />
            </div>
          </div>
        </div>

        {/* ─── ASSIGNMENT SECTION ─── */}
        {successPO ? (
          <div style={{
            backgroundColor: 'var(--color-success-bg)', border: '1.5px solid var(--color-success-light)',
            borderRadius: '16px', padding: '40px 32px', textAlign: 'center', boxShadow: 'var(--shadow-card)'
          }}>
            <CheckCircle2 size={56} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-success-text)', margin: '0 0 8px' }}>
              Driver Successfully Assigned!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-success-text)', margin: '0 0 24px' }}>
              PO #{successPO} has been assigned. The driver will see this trip on their phone.
            </p>
            <button
              onClick={handleBack}
              className="btn btn-primary"
              style={{ minHeight: '44px' }}
            >
              Back to All Orders
            </button>
          </div>
        ) : isAssigned ? (
          <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', padding: '28px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CheckCircle2 size={20} color="var(--color-success)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-success-text)' }}>This order is already assigned</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-body)', margin: 0 }}>
              A driver and truck have been assigned to this order. Track the delivery from your dashboard.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>

            {/* Form Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--color-brand-blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--color-text-heading)' }}>Assign a Driver & Truck</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', margin: 0 }}>Select who will do this delivery run</p>
              </div>
            </div>

            {/* Step Progress */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StepBadge step={1} active={assignmentStep === 1} done={assignmentStep > 1} label="Choose compatible fleet" />
              <div style={{ flex: 1, height: '2.5px', backgroundColor: assignmentStep > 1 ? 'var(--color-brand-blue-600)' : 'var(--color-border)', borderRadius: '2px', transition: 'background-color 0.3s' }} />
              <StepBadge step={2} active={assignmentStep === 2} done={false} label="Confirm & Dispatch" />
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div style={{ padding: '24px 28px' }}>

                {assignmentStep === 1 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Step 1.1: Choose Truck First */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          <Truck size={14} color="var(--color-brand-blue-600)" /> 1. Select a Truck
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          Cargo Required: <strong style={{ color: 'var(--color-text-heading)' }}>{selectedPO.material || 'Bulk Cargo / Coal'}</strong> ({selectedPO.target_qty || 34} Tons)
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {vehicles.map((v, idx) => {
                          const specs = [
                            { type: 'Side Tipper B-Double', body: 'Open Top Hydraulic Tipper', suitableFor: ['Washed Coal', 'Coal', 'Ore', 'Aggregate', 'Bulk Sand'], icon: '🚛', payload: 34 },
                            { type: 'End Tipper Super-Cube', body: 'Reinforced Steel Dump Body', suitableFor: ['Washed Coal', 'Raw Coal', 'GRAVEL', 'SPARE_PARTS_BOX'], icon: '🚚', payload: 30 },
                            { type: 'Flatbed Double Trailer', body: 'Enclosed Side Curtain / Flatbed', suitableFor: ['SPARE_PARTS_BOX', 'CONTAINER', 'Palletized Goods'], icon: '📦', payload: 28 },
                            { type: 'Tanker Semi-Trailer', body: 'Closed Cylindrical Pressure Tank', suitableFor: ['Oil', 'Fuel', 'Chemicals', 'Liquid Bulk'], icon: '🛢️', payload: 32 }
                          ];
                          const spec = specs[idx % specs.length];
                          const materialMatch = spec.suitableFor.some(m => (selectedPO.material || '').toLowerCase().includes(m.toLowerCase()));
                          const isSelected = selectedVehicleId === v.id.toString();

                          return (
                            <label
                              key={v.id}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: '14px',
                                padding: '16px', borderRadius: '12px',
                                border: isSelected ? '2px solid var(--color-brand-blue-600)' : '1.5px solid var(--color-border)',
                                backgroundColor: isSelected ? 'var(--color-brand-blue-50)' : '#fff',
                                cursor: 'pointer', transition: 'all 0.15s ease',
                                boxShadow: isSelected ? 'var(--shadow-card-hover)' : 'none'
                              }}
                            >
                              <input
                                type="radio"
                                name="vehicle"
                                value={v.id}
                                checked={isSelected}
                                onChange={e => setSelectedVehicleId(e.target.value)}
                                style={{ accentColor: 'var(--color-brand-blue-600)', marginTop: '4px' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '18px' }}>{spec.icon}</span>
                                    <span className="mono" style={{ fontWeight: 800, fontSize: '15px', color: 'var(--color-text-heading)' }}>{v.reg_no}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-blue-600)', backgroundColor: 'var(--color-brand-blue-50)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                      {spec.type}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '12px', fontWeight: 800, color: v.capacity >= (selectedPO.target_qty || 30) ? 'var(--color-success-text)' : 'var(--color-warning-text)' }}>
                                    Capacity: {v.capacity} Tons
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px', fontSize: '11.5px', color: 'var(--color-text-body)' }}>
                                  <span>🔒 Body Spec: <strong>{spec.body}</strong></span>
                                  <span>📦 Works best with: <strong>{spec.suitableFor.join(', ')}</strong></span>
                                </div>

                                {materialMatch && (
                                  <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--color-success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={12} color="var(--color-success)" /> Recommended for {selectedPO.material || 'this cargo'}
                                  </div>
                                )}
                              </div>
                              {isSelected && <Check size={18} color="var(--color-brand-blue-600)" style={{ marginTop: '2px' }} />}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 1.2: Choose Driver for the Selected Truck */}
                    <div style={{
                      position: 'relative',
                      opacity: selectedVehicleId ? 1 : 0.65,
                      pointerEvents: selectedVehicleId ? 'auto' : 'none',
                      transition: 'all 0.2s ease',
                      border: selectedVehicleId ? 'none' : '1.5px dashed var(--color-border)',
                      borderRadius: '12px',
                      padding: selectedVehicleId ? '0' : '16px',
                      backgroundColor: selectedVehicleId ? 'transparent' : 'var(--color-bg-page)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: selectedVehicleId ? 'var(--color-text-muted)' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                          <User size={14} color={selectedVehicleId ? 'var(--color-brand-blue-600)' : 'var(--color-text-muted)'} /> 2. Select a Driver
                        </label>
                        {!selectedVehicleId && (
                          <span className="badge badge-amber" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            🔒 Select a Truck First
                          </span>
                        )}
                      </div>

                      {!selectedVehicleId ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 600 }}>
                          👈 Please choose a truck above to view and assign compatible drivers.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {drivers.map(d => {
                            const isDriverSelected = selectedDriverId === d.id.toString();
                            const activeJob = assignmentsList.find((a: any) => a.driver_id === d.id && !['DELIVERED', 'POD_UPLOADED', 'APPROVED', 'INVOICED', 'MIRO_PARKED', 'MIRO_POSTED', 'CLEARED'].includes(a.status));
                            const isBusy = !!activeJob;

                            return (
                              <label
                                key={d.id}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '14px',
                                  padding: '14px 16px', borderRadius: '10px',
                                  border: isDriverSelected ? '2px solid var(--color-brand-blue-600)' : '1.5px solid var(--color-border)',
                                  backgroundColor: isBusy ? '#F8FAFC' : isDriverSelected ? 'var(--color-brand-blue-50)' : '#fff',
                                  cursor: isBusy ? 'not-allowed' : 'pointer',
                                  opacity: isBusy ? 0.6 : 1,
                                  transition: 'all 0.15s'
                                }}
                              >
                                <input
                                  type="radio"
                                  name="driver"
                                  value={d.id}
                                  disabled={isBusy}
                                  checked={isDriverSelected}
                                  onChange={e => setSelectedDriverId(e.target.value)}
                                  style={{ accentColor: 'var(--color-brand-blue-600)' }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-heading)' }}>{d.name}</span>
                                    {isBusy && (
                                      <span className="badge badge-red">
                                        ⛔ Busy (PO #{activeJob.sap_po_no})
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-body)', marginTop: '2px' }}>
                                    License: <span className="mono">{d.license_no}</span> | Phone: {d.phone || '+27 82 000 0000'}
                                  </div>
                                </div>
                                {isDriverSelected && <Check size={18} color="var(--color-brand-blue-600)" />}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Step Navigation */}
                    {selectedVehicleId && selectedDriverId && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setAssignmentStep(2)}
                          className="btn btn-primary"
                          style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          Next: Review Assignment <ChevronRight size={16} />
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  // Step 2: Confirm and Save
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ backgroundColor: 'var(--color-brand-blue-50)', padding: '20px', borderRadius: '12px', border: '1.5px solid var(--color-border)' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-brand-blue-700)', textTransform: 'uppercase', margin: '0 0 16px 0', letterSpacing: '0.04em' }}>
                        Verification Summary
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, margin: '0 0 4px 0' }}>SELECTED DRIVER</p>
                          <p style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-heading)', margin: 0 }}>{selectedDriver?.name}</p>
                          <p style={{ fontSize: '11.5px', color: 'var(--color-text-body)', margin: '2px 0 0 0' }}>Lic: {selectedDriver?.license_no}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, margin: '0 0 4px 0' }}>SELECTED VEHICLE</p>
                          <p className="mono" style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-heading)', margin: 0 }}>{selectedVehicle?.reg_no}</p>
                          <p style={{ fontSize: '11.5px', color: 'var(--color-text-body)', margin: '2px 0 0 0' }}>Payload Limit: {selectedVehicle?.capacity} Tons</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Scheduled Date</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={e => setScheduledDate(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Pickup Siding</label>
                        <input
                          type="text"
                          value={pickupLocation}
                          onChange={e => setPickupLocation(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setAssignmentStep(1)}
                        className="btn btn-secondary"
                        style={{ padding: '12px 20px' }}
                      >
                        Back to Selection
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                        style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {isSubmitting ? 'Assigning...' : <><CheckCircle2 size={16} /> Confirm & Assign Driver</>}
                      </button>
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

  // ─── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Purchase Orders</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            All transport POs assigned to your company. Click any order to view details & assign a driver.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter Tabs using the standard Tabs component */}
      <Tabs 
        tabs={[
          { id: 'ALL', label: 'All Orders', count: jobConfigs.length },
          { id: 'PENDING', label: 'Needs Driver', count: pendingCount },
          { id: 'ASSIGNED', label: 'Driver Assigned', count: assignedCount },
        ]}
        activeTab={activeFilter}
        onChange={(id) => setActiveFilter(id as any)}
      />

      {/* PO Cards Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Loading purchase orders...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No Orders Found"
          description="No purchase orders match this filter."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((jc: JobConfigV3) => {
            const isPending = jc.status === 'PENDING';
            return (
              <div
                key={jc.id}
                onClick={() => handleOpenPO(jc)}
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  borderRadius: '16px',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-card)',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  transition: 'all var(--transition-normal)',
                }}
                onMouseEnter={e => { 
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)'; 
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; 
                }}
                onMouseLeave={e => { 
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'; 
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; 
                }}
              >
                {/* Left accent line: pending is orange, assigned is blue */}
                <div style={{ width: '4px', height: '56px', borderRadius: '2px', backgroundColor: isPending ? 'var(--color-warning)' : 'var(--color-brand-blue-600)', flexShrink: 0 }} />

                {/* PO Number */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO Number</div>
                  <div className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-text-primary)' }}>#{jc.sap_po_no}</div>
                </div>

                <div style={{ width: '1px', height: '48px', backgroundColor: 'var(--color-border)' }} />

                {/* Material */}
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{jc.material || 'Washed Coal'}</div>
                </div>

                {/* Quantity */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{jc.target_qty || 34} Tons</div>
                </div>

                {/* Rate */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate / Ton</div>
                  <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{formatCurrency(jc.rate || 151.5)}</div>
                </div>

                {/* Status */}
                <div style={{ flexShrink: 0 }}>
                  {isPending ? (
                    <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <AlertCircle size={12} /> Assign Driver
                    </span>
                  ) : (
                    <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={12} /> Driver Assigned
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight size={18} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
