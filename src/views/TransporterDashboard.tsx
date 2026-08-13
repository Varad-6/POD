import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Truck, Send, CheckCircle2 } from 'lucide-react';
import { taApi, transportersApi, JobConfigV3, Driver, Vehicle } from '../lib/api_v3';
import { useAuthV3 } from '../contexts/AuthContextV3';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const TransporterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthV3();
  const [jobConfigs, setJobConfigs] = useState<JobConfigV3[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<JobConfigV3 | null>(null);
  
  // Driver & Vehicle lists
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('2026-08-14');
  const [location, setLocation] = useState('Witbank Siding');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const transporterId = user?.entityId || 1;

  const loadTAData = async () => {
    setLoading(true);
    try {
      const configs = await taApi.getJobConfigs('PENDING');
      setJobConfigs(configs);

      const drs = await transportersApi.drivers(transporterId);
      setDrivers(drs);
      if (drs.length > 0) setDriverId(drs[0].id.toString());

      const vhs = await transportersApi.vehicles(transporterId);
      setVehicles(vhs);
      if (vhs.length > 0) setVehicleId(vhs[0].id.toString());
    } catch (err) {
      console.error('Failed to load TA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTAData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig || !driverId || !vehicleId) return;

    setIsSubmitting(true);
    try {
      const dr = drivers.find(d => d.id === parseInt(driverId));
      const vh = vehicles.find(v => v.id === parseInt(vehicleId));

      await taApi.assignJob(selectedConfig.id, {
        driver_id: parseInt(driverId),
        vehicle_id: parseInt(vehicleId),
        license_no: dr?.license_no || 'DL-TEMP',
        gstin: '27AABCS0001A1Z1',
        scheduled_date: scheduledDate,
        location: location
      });

      setSelectedConfig(null);
      loadTAData();
    } catch (err) {
      console.error('Failed to assign driver:', err);
      alert('Error assigning driver/vehicle target');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--neutral-900)', margin: 0 }}>
          Carrier Operations Control Console
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--neutral-500)', margin: '4px 0 0 0' }}>
          Assign drivers, configure vehicles, and track outlined logistics agreements
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Loading operations...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
          
          {/* Pending Job Configs */}
          <Card title="Pending Outline Job Allocations">
            {jobConfigs.length === 0 ? (
              <EmptyState 
                icon={<FileSignature size={48} />}
                title="All Jobs Assigned"
                description="There are no pending jobs requiring assignment config at this moment."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {jobConfigs.map((jc) => {
                  const isSelected = selectedConfig?.id === jc.id;
                  return (
                    <div 
                      key={jc.id}
                      style={{
                        border: '1px solid var(--neutral-200)',
                        borderRadius: '10px',
                        padding: '16px 20px',
                        backgroundColor: isSelected ? 'var(--neutral-100)' : '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedConfig(jc)}
                    >
                      <div>
                        <p className="mono" style={{ fontWeight: 800, color: 'var(--neutral-900)', margin: '0 0 4px 0', fontSize: '15px' }}>
                          Job Config #{jc.id} (PO #{jc.sap_po_no})
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--neutral-600)', margin: '2px 0' }}>
                          Product: <strong>{jc.material}</strong> | Target: <strong>{jc.target_qty} TONs</strong>
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--neutral-500)', margin: 0 }}>
                          Availability: {jc.availability_window} | Timebound: {jc.timebound}
                        </p>
                      </div>
                      <button className="btn btn-dark btn-sm">Configure Run</button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Right Panel Assignment Form */}
          <div>
            {selectedConfig ? (
              <Card title="Transport Assignment Details" accentColor="var(--accent-blue)">
                <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Driver
                    </label>
                    <select
                      value={driverId}
                      onChange={e => setDriverId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        backgroundColor: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.license_no})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Horse Trailer / Vehicle
                    </label>
                    <select
                      value={vehicleId}
                      onChange={e => setVehicleId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        backgroundColor: '#FFFFFF',
                        fontWeight: 600,
                      }}
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.reg_no} (Cap: {v.capacity}t)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Scheduled Date
                    </label>
                    <input 
                      type="date" 
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Location Siding
                    </label>
                    <input 
                      type="text" 
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedConfig(null)}
                      className="btn btn-ghost"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      Assign driver & truck
                    </button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card title="Job Allocator Desk">
                <p style={{ fontSize: '13px', color: 'var(--neutral-500)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                  Select an outlined job card on the left to configure assignments, verify license expiration, and dispatch logistics resources.
                </p>
              </Card>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
