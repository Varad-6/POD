import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, Truck, User, Calendar, MapPin,
  Package, ArrowLeft, Clock, AlertCircle, ChevronRight, RefreshCw
} from 'lucide-react';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { taApi, transportersApi, JobConfigV3, Driver, Vehicle } from '../lib/api_v3';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency } from '../utils/format';

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string | number; mono?: boolean; highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <span className={mono ? 'mono' : ''} style={{ fontSize: '14px', fontWeight: 700, color: highlight ? 'var(--accent-blue)' : 'var(--neutral-900)' }}>
      {value}
    </span>
  </div>
);

const StepBadge: React.FC<{ step: number; active: boolean; done: boolean; label: string }> = ({ step, active, done, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: done ? 'var(--success-500)' : active ? 'var(--accent-blue)' : 'var(--neutral-200)',
      color: done || active ? '#fff' : 'var(--neutral-500)',
      fontWeight: 800, fontSize: '14px', transition: 'all 0.2s'
    }}>
      {done ? <CheckCircle2 size={18} /> : step}
    </div>
    <span style={{ fontSize: '10px', fontWeight: 600, color: done ? 'var(--success-600)' : active ? 'var(--accent-blue)' : 'var(--neutral-400)', textAlign: 'center', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  </div>
);

const Divider: React.FC = () => (
  <div style={{ height: '1px', backgroundColor: 'var(--neutral-100)', margin: '20px 0' }} />
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const TransporterPOs: React.FC = () => {
  const { user } = useAuthV3();
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
  const [assignmentStep, setAssignmentStep] = useState(1); // 1=pick driver, 2=confirm
  const [successPO, setSuccessPO] = useState<string | null>(null);

  const transporterId = user?.entityId || 1;

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingList, assignedList, drs, vhs] = await Promise.all([
        taApi.getJobConfigs('PENDING'),
        taApi.getJobConfigs('ASSIGNED'),
        transportersApi.drivers(transporterId),
        transportersApi.vehicles(transporterId),
      ]);
      setJobConfigs([...pendingList, ...assignedList]);
      setDrivers(drs);
      if (drs.length > 0) setSelectedDriverId(drs[0].id.toString());
      setVehicles(vhs);
      if (vhs.length > 0) setSelectedVehicleId(vhs[0].id.toString());
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenPO = (jc: JobConfigV3) => {
    setSelectedPO(jc);
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
      // Keep detail view open showing success
    } catch (err) {
      console.error('Failed to assign:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = jobConfigs.filter(jc => {
    if (activeFilter === 'PENDING') return jc.status === 'PENDING';
    if (activeFilter === 'ASSIGNED') return jc.status === 'ASSIGNED';
    return true;
  });

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
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px',
              border: '1px solid var(--neutral-200)',
              backgroundColor: '#fff', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, color: 'var(--neutral-600)'
            }}
          >
            <ArrowLeft size={14} /> Back to All Orders
          </button>
          <span style={{ color: 'var(--neutral-400)', fontSize: '13px' }}>›</span>
          <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-700)' }}>
            PO #{selectedPO.sap_po_no}
          </span>
        </div>

        {/* PO Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
          borderRadius: '16px', padding: '28px 32px', color: '#fff',
          marginBottom: '24px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '160px', height: '160px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.04)'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Transport Purchase Order
              </div>
              <h1 className="mono" style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                PO #{selectedPO.sap_po_no}
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', margin: 0, fontWeight: 500 }}>
                {selectedPO.material || 'Washed Coal'} — {selectedPO.target_qty || 34} Tons @ {formatCurrency(selectedPO.rate || 151.5)}/Ton
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>Total Value</div>
              <div className="mono" style={{ fontSize: '26px', fontWeight: 900, color: '#38BDF8' }}>
                {formatCurrency((selectedPO.rate || 151.5) * (selectedPO.target_qty || 34))}
              </div>
              <div style={{ marginTop: '8px' }}>
                {isAssigned ? (
                  <span style={{ backgroundColor: '#10B981', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                    ✓ Driver Assigned
                  </span>
                ) : (
                  <span style={{ backgroundColor: '#F59E0B', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                    ⏳ Needs Assignment
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PO Detail Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Order Details Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--neutral-150)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Package size={16} color="var(--accent-blue)" />
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--neutral-500)' }}>Order Details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InfoRow label="Material / Product" value={selectedPO.material || 'SL BIT 20% ASH Washed Coal'} />
              <InfoRow label="Quantity (Target)" value={`${selectedPO.target_qty || 34} Tons`} highlight />
              <InfoRow label="Rate per Ton" value={formatCurrency(selectedPO.rate || 151.5)} mono />
              <InfoRow label="Delivery Window" value={selectedPO.availability_window || '06:00–18:00'} />
            </div>
          </div>

          {/* Route Details Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid var(--neutral-150)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <MapPin size={16} color="#10B981" />
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--neutral-500)' }}>Route Information</span>
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
          // Success State
          <div style={{
            backgroundColor: '#F0FDF4', border: '2px solid #10B981',
            borderRadius: '16px', padding: '40px 32px', textAlign: 'center'
          }}>
            <CheckCircle2 size={56} color="#10B981" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#065F46', margin: '0 0 8px' }}>
              Driver Successfully Assigned!
            </h2>
            <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 24px' }}>
              PO #{successPO} has been assigned. The driver will see this trip on their phone.
            </p>
            <button
              onClick={handleBack}
              style={{
                padding: '12px 28px', backgroundColor: '#10B981', color: '#fff',
                border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Back to All Orders
            </button>
          </div>
        ) : isAssigned ? (
          // Already Assigned State
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '28px', border: '1px solid var(--neutral-150)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CheckCircle2 size={20} color="#10B981" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#065F46' }}>This order is already assigned</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--neutral-500)', margin: 0 }}>
              A driver and truck have been assigned to this order. Track the delivery from your dashboard.
            </p>
          </div>
        ) : (
          // Assignment Form
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid var(--neutral-150)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

            {/* Form Header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--neutral-100)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Assign a Driver & Truck</h3>
                <p style={{ fontSize: '12px', color: 'var(--neutral-500)', margin: 0 }}>Select who will do this delivery run</p>
              </div>
            </div>

            {/* Step Progress */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--neutral-100)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <StepBadge step={1} active={assignmentStep === 1} done={assignmentStep > 1} label="Choose People" />
              <div style={{ flex: 1, height: '2px', backgroundColor: assignmentStep > 1 ? 'var(--success-500)' : 'var(--neutral-200)', borderRadius: '2px', transition: 'background-color 0.3s' }} />
              <StepBadge step={2} active={assignmentStep === 2} done={false} label="Confirm & Send" />
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div style={{ padding: '24px 28px' }}>

                {assignmentStep === 1 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Driver Selector */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                        <User size={12} /> Choose Driver
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {drivers.map(d => (
                          <label
                            key={d.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '14px',
                              padding: '14px 16px', borderRadius: '10px',
                              border: selectedDriverId === d.id.toString() ? '2px solid var(--accent-blue)' : '1px solid var(--neutral-200)',
                              backgroundColor: selectedDriverId === d.id.toString() ? '#EFF6FF' : '#fff',
                              cursor: 'pointer', transition: 'all 0.15s'
                            }}
                          >
                            <input
                              type="radio"
                              name="driver"
                              value={d.id}
                              checked={selectedDriverId === d.id.toString()}
                              onChange={e => setSelectedDriverId(e.target.value)}
                              style={{ accentColor: 'var(--accent-blue)' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: '14px' }}>{d.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '2px' }}>
                                License: {d.license_no} &nbsp;|&nbsp; PrDP valid till {d.prdp_expiry}
                              </div>
                            </div>
                            {selectedDriverId === d.id.toString() && <CheckCircle2 size={16} color="var(--accent-blue)" />}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Vehicle Selector */}
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                        <Truck size={12} /> Choose Truck
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {vehicles.map(v => (
                          <label
                            key={v.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '14px',
                              padding: '14px 16px', borderRadius: '10px',
                              border: selectedVehicleId === v.id.toString() ? '2px solid var(--accent-blue)' : '1px solid var(--neutral-200)',
                              backgroundColor: selectedVehicleId === v.id.toString() ? '#EFF6FF' : '#fff',
                              cursor: 'pointer', transition: 'all 0.15s'
                            }}
                          >
                            <input
                              type="radio"
                              name="vehicle"
                              value={v.id}
                              checked={selectedVehicleId === v.id.toString()}
                              onChange={e => setSelectedVehicleId(e.target.value)}
                              style={{ accentColor: 'var(--accent-blue)' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div className="mono" style={{ fontWeight: 700, fontSize: '14px' }}>{v.reg_no}</div>
                              <div style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '2px' }}>
                                Capacity: {v.capacity} Tons
                              </div>
                            </div>
                            {selectedVehicleId === v.id.toString() && <CheckCircle2 size={16} color="var(--accent-blue)" />}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Schedule */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                          <Calendar size={12} /> Trip Date
                        </label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={e => setScheduledDate(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--neutral-200)', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-600)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                          <MapPin size={12} /> Pickup Siding
                        </label>
                        <input
                          type="text"
                          value={pickupLocation}
                          onChange={e => setPickupLocation(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--neutral-200)', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAssignmentStep(2)}
                      disabled={!selectedDriverId || !selectedVehicleId}
                      style={{
                        padding: '14px 24px', backgroundColor: !selectedDriverId || !selectedVehicleId ? 'var(--neutral-200)' : 'var(--accent-blue)',
                        color: !selectedDriverId || !selectedVehicleId ? 'var(--neutral-400)' : '#fff',
                        border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                        cursor: !selectedDriverId || !selectedVehicleId ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      Review & Confirm <ChevronRight size={16} />
                    </button>
                  </div>

                ) : (
                  // Step 2: Confirmation
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ backgroundColor: 'var(--neutral-50)', borderRadius: '12px', padding: '20px', border: '1px solid var(--neutral-150)' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.06em' }}>Confirm Assignment Details</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <InfoRow label="Purchase Order" value={`PO #${selectedPO.sap_po_no}`} mono highlight />
                        <InfoRow label="Material" value={selectedPO.material || 'Washed Coal'} />
                        <InfoRow label="Assigned Driver" value={selectedDriver?.name || '—'} />
                        <InfoRow label="Driver License" value={selectedDriver?.license_no || '—'} mono />
                        <InfoRow label="Truck Plate" value={selectedVehicle?.reg_no || '—'} mono />
                        <InfoRow label="Truck Capacity" value={`${selectedVehicle?.capacity || 0} Tons`} />
                        <InfoRow label="Trip Date" value={scheduledDate} />
                        <InfoRow label="Pickup Siding" value={pickupLocation} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setAssignmentStep(1)}
                        style={{
                          flex: 1, padding: '14px', backgroundColor: '#fff',
                          border: '1px solid var(--neutral-200)', borderRadius: '10px',
                          fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: 'var(--neutral-700)'
                        }}
                      >
                        ← Go Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          flex: 2, padding: '14px', backgroundColor: isSubmitting ? 'var(--neutral-300)' : '#10B981',
                          color: '#fff', border: 'none', borderRadius: '10px',
                          fontSize: '14px', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
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

  // ─── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--neutral-900)', margin: 0 }}>Purchase Orders</h1>
          <p style={{ fontSize: '13px', color: 'var(--neutral-500)', margin: '4px 0 0 0' }}>
            All transport POs assigned to your company. Click any order to view details & assign a driver.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--neutral-200)',
            backgroundColor: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--neutral-600)'
          }}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'ALL', label: 'All Orders', count: jobConfigs.length },
          { id: 'PENDING', label: '⏳ Needs Driver', count: pendingCount },
          { id: 'ASSIGNED', label: '✓ Assigned', count: assignedCount },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeFilter === tab.id ? 'var(--neutral-900)' : '#fff',
              color: activeFilter === tab.id ? '#fff' : 'var(--neutral-600)',
              fontSize: '13px', fontWeight: 600,
              boxShadow: activeFilter === tab.id ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginLeft: '8px', padding: '2px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 800,
                backgroundColor: activeFilter === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--neutral-100)',
                color: activeFilter === tab.id ? '#fff' : 'var(--neutral-600)',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* PO Cards Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--neutral-400)', fontSize: '14px' }}>
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
          {filtered.map(jc => {
            const isPending = jc.status === 'PENDING';
            return (
              <div
                key={jc.id}
                onClick={() => handleOpenPO(jc)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  border: isPending ? '1px solid #FDE68A' : '1px solid var(--neutral-150)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                {/* Left accent */}
                <div style={{ width: '4px', height: '56px', borderRadius: '2px', backgroundColor: isPending ? '#F59E0B' : '#10B981', flexShrink: 0 }} />

                {/* PO Number */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO Number</div>
                  <div className="mono" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--neutral-900)' }}>#{jc.sap_po_no}</div>
                </div>

                <div style={{ width: '1px', height: '48px', backgroundColor: 'var(--neutral-100)' }} />

                {/* Material */}
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--neutral-900)' }}>{jc.material || 'Washed Coal'}</div>
                </div>

                {/* Quantity */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{jc.target_qty || 34} Tons</div>
                </div>

                {/* Rate */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate / Ton</div>
                  <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-blue)' }}>{formatCurrency(jc.rate || 151.5)}</div>
                </div>

                {/* Status */}
                <div style={{ flexShrink: 0 }}>
                  {isPending ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      backgroundColor: '#FEF3C7', color: '#92400E',
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700
                    }}>
                      <AlertCircle size={12} /> Assign Driver
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      backgroundColor: '#D1FAE5', color: '#065F46',
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700
                    }}>
                      <CheckCircle2 size={12} /> Driver Assigned
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight size={18} color="var(--neutral-300)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
