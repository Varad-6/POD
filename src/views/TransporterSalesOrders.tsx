import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { Truck, Calendar, User, Package, CheckCircle, Clock } from 'lucide-react';
import { salesOrdersApi, transportersApi, SoDistributionV3, Driver, Vehicle } from '../lib/api_v3';

export const TransporterSalesOrders: React.FC = () => {
  const [distributions, setDistributions] = useState<SoDistributionV3[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [selectedDist, setSelectedDist] = useState<SoDistributionV3 | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | ''>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleAssignSubmit = async () => {
    if (!selectedDist || !selectedDriverId || !selectedVehicleId) return;
    setAssigning(true);
    setMessage(null);
    try {
      const res = await salesOrdersApi.assignDriver(
        selectedDist.id,
        Number(selectedDriverId),
        Number(selectedVehicleId),
        scheduledDate
      );
      setMessage({ type: 'success', text: res.message });
      setSelectedDist(null);
      setSelectedDriverId('');
      setSelectedVehicleId('');
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Driver assignment failed.' });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Assigned Sales Orders"
        subtitle="Manage complete Sales Orders distributed by Company Admin. Allocate authorized fleet drivers and trucks to initiate hauling operations."
      />

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          fontSize: '13.5px',
          fontWeight: 600
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
            description="Company Admin has not yet distributed any Sales Orders to your fleet."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px' }}>SAP SO #</th>
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

                  return (
                    <tr key={dist.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace' }}>
                        #{dist.sap_so_no}
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
                          <span>{dist.materials_summary || `${dist.total_qty || 34.0} TO`}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                        {dist.delivery_date || 'Standard'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {dist.driver_name ? (
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
                            onClick={() => {
                              setSelectedDist(dist);
                              setSelectedDriverId('');
                              setSelectedVehicleId('');
                            }}
                          >
                            <Truck size={14} style={{ marginRight: '6px' }} />
                            Assign Driver
                          </Button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={14} /> Assigned
                          </span>
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

      {/* Driver Assignment Modal */}
      <Modal
        isOpen={Boolean(selectedDist)}
        onClose={() => setSelectedDist(null)}
        title={`Assign Driver & Truck — SO #${selectedDist?.sap_so_no}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-body)' }}>
            Allocate an active driver and registered heavy commercial vehicle from your fleet to service this entire order.
          </p>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              Select Fleet Driver:
            </label>
            <select
              value={selectedDriverId}
              onChange={e => setSelectedDriverId(e.target.value ? Number(e.target.value) : '')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-body)',
                fontSize: '13.5px'
              }}
            >
              <option value="">-- Choose Driver --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} (License: {d.license_no} | Phone: {d.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              Select Vehicle / Truck:
            </label>
            <select
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value ? Number(e.target.value) : '')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-body)',
                fontSize: '13.5px'
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

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              Scheduled Haul Date:
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-body)',
                fontSize: '13.5px'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
              disabled={assigning || !selectedDriverId || !selectedVehicleId}
            >
              {assigning ? 'Assigning...' : 'Dispatch Driver'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default TransporterSalesOrders;
