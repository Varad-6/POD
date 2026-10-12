import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import {
  Truck,
  Calendar,
  User,
  Package,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Eye,
  Layers,
  Scale,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  salesOrdersApi,
  transportersApi,
  SoDistributionV3,
  Driver,
  Vehicle,
  TransportAssignmentSummaryV3
} from '../lib/api_v3';

interface FleetAllocationSlot {
  slotId: string;
  driver_id: number | '';
  vehicle_id: number | '';
  assigned_qty: number;
  scheduled_date: string;
}

export const TransporterSalesOrders: React.FC = () => {
  const [distributions, setDistributions] = useState<SoDistributionV3[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-Driver Fleet Allocation Modal
  const [selectedDist, setSelectedDist] = useState<SoDistributionV3 | null>(null);
  const [allocations, setAllocations] = useState<FleetAllocationSlot[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fleet View Modal for assigned orders
  const [viewingDist, setViewingDist] = useState<SoDistributionV3 | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const dists = await salesOrdersApi.getDistributions();
      setDistributions(dists || []);

      // Transporter ID 1 default for demo TA
      const [dList, vList] = await Promise.all([
        transportersApi.drivers(1),
        transportersApi.vehicles(1)
      ]);
      setDrivers(dList || []);
      setVehicles(vList || []);
    } catch (err: any) {
      console.error('Failed to load Transporter Sales Orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (dist: SoDistributionV3) => {
    const totalQty = dist.total_qty || 15;
    setSelectedDist(dist);
    setAllocations([
      {
        slotId: `slot-${Date.now()}-1`,
        driver_id: '',
        vehicle_id: '',
        assigned_qty: totalQty,
        scheduled_date: new Date().toISOString().slice(0, 10)
      }
    ]);
  };

  const handleAddSlot = () => {
    if (!selectedDist) return;
    const totalQty = selectedDist.total_qty || 15;
    const currentAllocated = allocations.reduce((sum, s) => sum + (Number(s.assigned_qty) || 0), 0);
    const remaining = Math.max(0, totalQty - currentAllocated);

    setAllocations(prev => [
      ...prev,
      {
        slotId: `slot-${Date.now()}-${prev.length + 1}`,
        driver_id: '',
        vehicle_id: '',
        assigned_qty: remaining > 0 ? remaining : 5,
        scheduled_date: new Date().toISOString().slice(0, 10)
      }
    ]);
  };

  const handleRemoveSlot = (slotId: string) => {
    if (allocations.length <= 1) return;
    setAllocations(prev => prev.filter(s => s.slotId !== slotId));
  };

  const handleUpdateSlot = (slotId: string, field: keyof FleetAllocationSlot, value: any) => {
    setAllocations(prev =>
      prev.map(slot => (slot.slotId === slotId ? { ...slot, [field]: value } : slot))
    );
  };

  const handleAssignSubmit = async () => {
    if (!selectedDist || allocations.length === 0) return;

    for (let i = 0; i < allocations.length; i++) {
      const a = allocations[i];
      if (!a.driver_id || !a.vehicle_id) {
        setMessage({ type: 'error', text: `Please select both a Driver and Truck for Fleet Unit #${i + 1}.` });
        return;
      }
      if (!a.assigned_qty || Number(a.assigned_qty) <= 0) {
        setMessage({ type: 'error', text: `Please specify a valid payload in Boxes/Tons for Fleet Unit #${i + 1}.` });
        return;
      }
    }

    setAssigning(true);
    setMessage(null);
    try {
      const payload = allocations.map(a => ({
        driver_id: Number(a.driver_id),
        vehicle_id: Number(a.vehicle_id),
        assigned_qty: Number(a.assigned_qty),
        scheduled_date: a.scheduled_date
      }));

      const res = await salesOrdersApi.assignDriver(selectedDist.id, payload);
      setMessage({ type: 'success', text: res.message });
      setSelectedDist(null);
      setAllocations([]);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Driver assignment failed.' });
    } finally {
      setAssigning(false);
    }
  };

  // Calculations for active modal
  const totalOrderQty = selectedDist?.total_qty || 15;
  const currentTotalAllocated = allocations.reduce((sum, s) => sum + (Number(s.assigned_qty) || 0), 0);
  const remainingQty = totalOrderQty - currentTotalAllocated;

  const selectedDriverIds = allocations.map(a => a.driver_id).filter(Boolean);
  const hasDuplicateDriver = selectedDriverIds.length !== new Set(selectedDriverIds).size;
  const selectedVehicleIds = allocations.map(a => a.vehicle_id).filter(Boolean);
  const hasDuplicateVehicle = selectedVehicleIds.length !== new Set(selectedVehicleIds).size;

  const isFormValid =
    allocations.length > 0 &&
    allocations.every(a => a.driver_id && a.vehicle_id && Number(a.assigned_qty) > 0) &&
    !hasDuplicateDriver &&
    !hasDuplicateVehicle &&
    currentTotalAllocated <= totalOrderQty &&
    currentTotalAllocated > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Assigned Sales Orders"
        subtitle="Manage complete Sales Orders distributed by Company Admin. Allocate single or multiple fleet vehicles & drivers to split loads and initiate hauling operations."
      />

      {/* Standard Packaging & Load Mapping Note Banner */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '13px',
        color: '#1e40af'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={18} style={{ flexShrink: 0, color: '#2563eb' }} />
          <span>
            <strong>Standard Payload Conversion: 1 Box = 1 Ton (1,000 kg).</strong> Bulk sales orders can be split dynamically across multiple trucks and drivers based on vehicle payload capacities.
          </span>
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: '#dbeafe',
          padding: '4px 10px',
          borderRadius: '20px',
          color: '#1d4ed8'
        }}>
          Multi-Driver Fleet Dispatch Enabled
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          fontSize: '13.5px',
          fontWeight: 600,
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {message.text}
        </div>
      )}

      <Card title="Transport Operations Pipeline" subtitle="All Sales Orders allocated to your transport company">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading allocated orders...
          </div>
        ) : distributions.length === 0 ? (
          <EmptyState
            title="No Assigned Orders"
            description="Company Admin has not yet distributed any Sales Orders to your fleet. Once an order is distributed, it will appear here."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px' }}>SAP SO #</th>
                  <th style={{ padding: '12px 14px' }}>Outbound Deliveries (VL03N)</th>
                  <th style={{ padding: '12px 14px' }}>Client Yard</th>
                  <th style={{ padding: '12px 14px' }}>Allocated Load</th>
                  <th style={{ padding: '12px 14px' }}>Delivery Target</th>
                  <th style={{ padding: '12px 14px' }}>Assigned Fleet</th>
                  <th style={{ padding: '12px 14px' }}>Dispatch State</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map(dist => {
                  const isAssigned = dist.status === 'ASSIGNED';
                  const hasMultiFleet = dist.assignments && dist.assignments.length > 0;

                  return (
                    <tr key={dist.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace' }}>
                        #{dist.sap_so_no}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {dist.deliveries_summary ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {dist.deliveries_summary.split(', ').map((delNo: string) => (
                              <span
                                key={delNo}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#1d4ed8'
                                }}
                              >
                                #{delNo}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>
                          {dist.customer_name || 'PODZO Mining Yard'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                          {dist.sap_customer_no}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Package size={14} color="var(--color-brand-blue-600)" />
                          <span style={{ fontWeight: 600 }}>
                            {dist.total_qty ? `${dist.total_qty.toLocaleString()} Boxes (${dist.total_qty.toLocaleString()} Tons)` : `${dist.item_count || 1} Packages`}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                        {dist.delivery_date || 'Standard'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {hasMultiFleet ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 700, color: '#1e40af' }}>
                              <Truck size={13} color="#2563eb" />
                              <span>{dist.assignments!.length} {dist.assignments!.length === 1 ? 'Truck' : 'Trucks'} Assigned</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>({dist.total_allocated_qty || dist.total_qty} T)</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {dist.assignments!.slice(0, 2).map((a, idx) => (
                                <div
                                  key={a.id || idx}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '11.5px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: '#0f172a' }}>{a.driver_name}</strong>
                                    <span style={{ color: '#64748b', marginLeft: '4px', fontFamily: 'monospace' }}>({a.vehicle_reg})</span>
                                  </div>
                                  <span style={{
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    backgroundColor: '#eff6ff',
                                    color: '#1d4ed8'
                                  }}>
                                    {a.assigned_qty ? `${a.assigned_qty} T` : ''}
                                  </span>
                                </div>
                              ))}
                              {dist.assignments!.length > 2 && (
                                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
                                  +{dist.assignments!.length - 2} more fleet units
                                </span>
                              )}
                            </div>
                          </div>
                        ) : dist.driver_name ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{dist.driver_name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                              {dist.vehicle_reg}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '12.5px' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={dist.assignment_status || dist.status} />
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {!isAssigned ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openAssignModal(dist)}
                          >
                            <Truck size={14} style={{ marginRight: '6px' }} />
                            Assign Fleet
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setViewingDist(dist)}
                          >
                            <Eye size={13} style={{ marginRight: '5px' }} />
                            Fleet ({dist.assignments?.length || 1})
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Multi-Driver Fleet Allocation Modal */}
      <Modal
        isOpen={Boolean(selectedDist)}
        onClose={() => setSelectedDist(null)}
        title={`Allocate Fleet Drivers & Trucks — SO #${selectedDist?.sap_so_no}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '80vh', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* Order Header Summary Card */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
                  Client Yard & Destination
                </span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                  {selectedDist?.customer_name || 'PODZO Mining Yard'} ({selectedDist?.sap_customer_no})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
                  Total Order Load
                </span>
                <div style={{ fontWeight: 800, fontSize: '15px', color: '#0854A0' }}>
                  {totalOrderQty} Boxes ({totalOrderQty}.0 Tons)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
              <Scale size={14} color="#0854A0" />
              <span>Standard Rule: <strong>1 Box = 1 Ton (1,000 kg)</strong>. You may split this load across multiple trucks.</span>
            </div>
          </div>

          {/* Real-Time Load Allocation Strip */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: remainingQty === 0 ? '#f0fdf4' : remainingQty > 0 ? '#fefce8' : '#fef2f2',
            border: `1px solid ${remainingQty === 0 ? '#bbf7d0' : remainingQty > 0 ? '#fef08a' : '#fecaca'}`,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>
                Fleet Load Allocation Balance
              </span>
              <span style={{
                fontWeight: 700,
                fontSize: '12px',
                color: remainingQty === 0 ? '#15803d' : remainingQty > 0 ? '#a16207' : '#b91c1c'
              }}>
                {remainingQty === 0 ? '✓ 100% Balanced' : remainingQty > 0 ? `${remainingQty} Boxes Unassigned` : `Over-allocated by ${Math.abs(remainingQty)} Boxes`}
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, (currentTotalAllocated / totalOrderQty) * 100))}%`,
                  height: '100%',
                  backgroundColor: remainingQty === 0 ? '#16a34a' : remainingQty > 0 ? '#eab308' : '#dc2626',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
              <span>Target: <strong>{totalOrderQty} Tons</strong></span>
              <span>Allocated: <strong>{currentTotalAllocated} Tons</strong></span>
              <span>Remaining: <strong style={{ color: remainingQty === 0 ? '#16a34a' : remainingQty > 0 ? '#d97706' : '#dc2626' }}>{remainingQty} Tons</strong></span>
            </div>

            {hasDuplicateDriver && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>
                <AlertTriangle size={14} />
                <span>Error: The same driver cannot be assigned to multiple trucks simultaneously.</span>
              </div>
            )}
            {hasDuplicateVehicle && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>
                <AlertTriangle size={14} />
                <span>Error: The same vehicle cannot be selected for multiple allocation slots.</span>
              </div>
            )}
          </div>

          {/* Allocation Slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                Fleet Units & Drivers ({allocations.length})
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddSlot}
                disabled={assigning}
              >
                <Plus size={14} style={{ marginRight: '4px' }} />
                Add Another Driver & Truck
              </Button>
            </div>

            {allocations.map((slot, index) => {
              const selectedVehicle = vehicles.find(v => v.id === slot.vehicle_id);
              const isOverCapacity = selectedVehicle && slot.assigned_qty > selectedVehicle.capacity;

              return (
                <div
                  key={slot.slotId}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#0854A0',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {index + 1}
                      </span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                        Fleet Unit #{index + 1}
                      </strong>
                    </div>

                    {allocations.length > 1 && (
                      <button
                        onClick={() => handleRemoveSlot(slot.slotId)}
                        disabled={assigning}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    
                    {/* Driver Selection */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Driver:
                      </label>
                      <select
                        value={slot.driver_id}
                        onChange={e => handleUpdateSlot(slot.slotId, 'driver_id', e.target.value ? Number(e.target.value) : '')}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          fontSize: '13px',
                          color: '#0f172a'
                        }}
                      >
                        <option value="">-- Choose Driver --</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.license_no})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Truck Selection */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Truck / Vehicle:
                      </label>
                      <select
                        value={slot.vehicle_id}
                        onChange={e => handleUpdateSlot(slot.slotId, 'vehicle_id', e.target.value ? Number(e.target.value) : '')}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          fontSize: '13px',
                          color: '#0f172a'
                        }}
                      >
                        <option value="">-- Choose Vehicle --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.reg_no} ({v.capacity} Ton capacity)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Assigned Qty */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                          Payload (Boxes / Tons):
                        </label>
                        {selectedVehicle && (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Cap: {selectedVehicle.capacity} T
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={totalOrderQty}
                        value={slot.assigned_qty}
                        onChange={e => handleUpdateSlot(slot.slotId, 'assigned_qty', Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${isOverCapacity ? '#f87171' : '#cbd5e1'}`,
                          backgroundColor: '#f8fafc',
                          fontSize: '13px',
                          color: '#0f172a'
                        }}
                      />
                      {isOverCapacity && (
                        <span style={{ display: 'block', fontSize: '10.5px', color: '#dc2626', marginTop: '3px' }}>
                          ⚠️ Exceeds vehicle capacity of {selectedVehicle.capacity} Tons
                        </span>
                      )}
                    </div>

                    {/* Scheduled Date */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Scheduled Date:
                      </label>
                      <input
                        type="date"
                        value={slot.scheduled_date}
                        onChange={e => handleUpdateSlot(slot.slotId, 'scheduled_date', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          fontSize: '13px',
                          color: '#0f172a'
                        }}
                      />
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
            <Button
              variant="secondary"
              onClick={() => setSelectedDist(null)}
              disabled={assigning}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignSubmit}
              disabled={assigning || !isFormValid}
            >
              {assigning
                ? 'Assigning Fleet...'
                : `Dispatch Fleet (${allocations.length} ${allocations.length === 1 ? 'Truck' : 'Trucks'})`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Fleet Details Modal */}
      <Modal
        isOpen={Boolean(viewingDist)}
        onClose={() => setViewingDist(null)}
        title={`Assigned Fleet Cockpit — SO #${viewingDist?.sap_so_no}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e3a8a' }}>
                {viewingDist?.customer_name || 'PODZO Mining Yard'}
              </div>
              <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                Customer Code: {viewingDist?.sap_customer_no}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600 }}>Total Payload</div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#1e40af' }}>
                {viewingDist?.total_qty} Boxes ({viewingDist?.total_qty}.0 Tons)
              </div>
            </div>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
            Allocated Fleet Units ({viewingDist?.assignments?.length || 1})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {viewingDist?.assignments && viewingDist.assignments.length > 0 ? (
              viewingDist.assignments.map((a, idx) => (
                <div
                  key={a.id || idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb'
                    }}>
                      <Truck size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                        {a.driver_name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        Vehicle: <strong style={{ fontFamily: 'monospace' }}>{a.vehicle_reg}</strong> {a.vehicle_capacity ? `(${a.vehicle_capacity}T cap)` : ''} {a.driver_phone ? `• ${a.driver_phone}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Assigned Share</div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0854A0' }}>
                        {a.assigned_qty ? `${a.assigned_qty} Boxes (${a.assigned_qty} T)` : `${viewingDist.total_qty} T`}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{viewingDist?.driver_name || 'Driver'}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>{viewingDist?.vehicle_reg}</div>
                </div>
                <StatusBadge status={viewingDist?.assignment_status || viewingDist?.status || 'ASSIGNED'} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setViewingDist(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TransporterSalesOrders;
