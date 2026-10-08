import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { ShieldCheck, AlertTriangle, CheckCircle, Package, Truck, User } from 'lucide-react';
import { stagingApi, StagingQueueItemV3 } from '../lib/api_v3';

export const StagingDashboard: React.FC = () => {
  const [queue, setQueue] = useState<StagingQueueItemV3[]>([]);
  const [loading, setLoading] = useState(true);

  // Mismatch Modal
  const [selectedItem, setSelectedItem] = useState<StagingQueueItemV3 | null>(null);
  const [mismatchNotes, setMismatchNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertBanner, setAlertBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await stagingApi.getQueue();
      setQueue(data || []);
    } catch (err: any) {
      console.error('Failed to load Staging queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleMatch = async (item: StagingQueueItemV3) => {
    setSubmitting(true);
    setAlertBanner(null);
    try {
      const res = await stagingApi.check(item.assignment_id, 'MATCH');
      setAlertBanner({
        type: 'success',
        text: `Trip #${item.assignment_id} verified! ${res.waybill_no ? `Waybill #${res.waybill_no} issued.` : ''} Driver cleared for transit.`
      });
      await loadQueue();
    } catch (err: any) {
      setAlertBanner({ type: 'error', text: err.message || 'Match verification failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMismatchSubmit = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    setAlertBanner(null);
    try {
      const res = await stagingApi.check(selectedItem.assignment_id, 'MISMATCH', mismatchNotes);
      setAlertBanner({
        type: 'error',
        text: `Staging Exception logged for Trip #${selectedItem.assignment_id}. Supervisor notified to rectify loaded materials.`
      });
      setSelectedItem(null);
      setMismatchNotes('');
      await loadQueue();
    } catch (err: any) {
      setAlertBanner({ type: 'error', text: err.message || 'Failed to submit exception.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Staging Area Pre-Clearance Console"
        subtitle="Independent physical inspection checkpoint. Re-validate physical cargo against SAP Sales Order line items before authorizing waybills."
      />

      {alertBanner && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: alertBanner.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: alertBanner.type === 'success' ? '#166534' : '#991b1b',
          fontSize: '13.5px',
          fontWeight: 600
        }}>
          {alertBanner.text}
        </div>
      )}

      <Card
        title="Staging Inspection Queue"
        subtitle="Vehicles released from weighing scale waiting for physical line item reconciliation"
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading inspection queue...
          </div>
        ) : queue.length === 0 ? (
          <EmptyState
            title="Staging Queue Clear"
            description="No vehicles are currently waiting at the staging checkpoint."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {queue.map(item => (
              <div
                key={item.assignment_id}
                style={{
                  padding: '18px',
                  borderRadius: '10px',
                  border: item.assignment_status === 'STAGING_EXCEPTION'
                    ? '2px solid #ef4444'
                    : '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                      Trip #{item.assignment_id}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>
                      SO #{item.sap_so_no}
                    </span>
                    <StatusBadge status={item.assignment_status} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Destination: <strong>{item.customer_name}</strong>
                  </div>
                </div>

                {item.assignment_status === 'STAGING_EXCEPTION' && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertTriangle size={16} />
                    <span><strong>Active Staging Exception:</strong> {item.last_staging_notes || 'Discrepancy reported to Supervisor.'}</span>
                  </div>
                )}

                {/* Driver & Scale Weights Info */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-bg-page)',
                  fontSize: '13px'
                }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Driver: </span>
                    <strong>{item.driver_name}</strong> ({item.license_no})
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Truck Reg: </span>
                    <strong style={{ fontFamily: 'monospace' }}>{item.vehicle_reg}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Tare Scale: </span>
                    <strong>{item.mine_tare_kg ? `${item.mine_tare_kg.toLocaleString()} kg` : 'Logged'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Gross Scale: </span>
                    <strong>{item.mine_gross_kg ? `${item.mine_gross_kg.toLocaleString()} kg` : 'Logged'}</strong>
                  </div>
                </div>

                {/* Line Items Checklist */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '8px', color: 'var(--color-text-heading)' }}>
                    Required Line Items (From Sales Order):
                  </div>
                  <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                        <th style={{ padding: '6px 8px' }}>Item #</th>
                        <th style={{ padding: '6px 8px' }}>Material Code & Description</th>
                        <th style={{ padding: '6px 8px' }}>Order Quantity</th>
                        <th style={{ padding: '6px 8px' }}>Plant / Storage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.line_items.map(li => (
                        <tr key={li.id || li.item_no} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>#{li.item_no}</td>
                          <td style={{ padding: '6px 8px' }}>
                            <strong>{li.material}</strong> {li.material_desc && `— ${li.material_desc}`}
                          </td>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{li.order_qty} {li.uom}</td>
                          <td style={{ padding: '6px 8px', color: 'var(--color-text-muted)' }}>{li.plant || '1001'} / {li.storage_location || 'SL01'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Staging Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={submitting}
                    onClick={() => {
                      setSelectedItem(item);
                      setMismatchNotes('');
                    }}
                  >
                    <AlertTriangle size={14} style={{ marginRight: '6px' }} />
                    Mismatch Exception
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleMatch(item)}
                  >
                    <ShieldCheck size={14} style={{ marginRight: '6px' }} />
                    Verify Match & Issue Waybill
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Mismatch Exception Modal */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={`Log Staging Mismatch — Trip #${selectedItem?.assignment_id}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-body)' }}>
            Reporting a mismatch will put Trip #{selectedItem?.assignment_id} into <strong>STAGING_EXCEPTION</strong> status. The Pre-Dispatch Supervisor will be alerted to rectify cargo before the driver can proceed.
          </p>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              Discrepancy Details / Notes for Supervisor:
            </label>
            <textarea
              rows={4}
              value={mismatchNotes}
              onChange={e => setMismatchNotes(e.target.value)}
              placeholder="e.g. Physical count shows 12 units loaded, expected 15 units. Packaging damaged."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-body)',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              variant="secondary"
              onClick={() => setSelectedItem(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleMismatchSubmit}
              disabled={submitting || !mismatchNotes.trim()}
            >
              {submitting ? 'Logging...' : 'Confirm Exception'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default StagingDashboard;
