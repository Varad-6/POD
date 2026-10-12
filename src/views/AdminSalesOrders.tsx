import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { RefreshCw, Send, CheckSquare, Square, Package, AlertCircle, ArrowRight } from 'lucide-react';
import { salesOrdersApi, transportersApi, SalesOrderV3, Transporter } from '../lib/api_v3';
import { formatCargoDisplay } from './SupervisorDashboard';

export const AdminSalesOrders: React.FC = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrderV3[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  // Distribution selection state (Target Flow #2: plain table with checkbox per row & select-all)
  const [selectedSoIds, setSelectedSoIds] = useState<number[]>([]);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedTransporterId, setSelectedTransporterId] = useState<number | ''>('');
  const [distributing, setDistributing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sos, trans] = await Promise.all([
        salesOrdersApi.list(),
        transportersApi.list()
      ]);
      setSalesOrders(sos || []);
      setTransporters(trans || []);
    } catch (err: any) {
      console.error('Failed to load Sales Orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshFromSap = async () => {
    setRefreshing(true);
    setStatusMessage(null);
    try {
      const res = await salesOrdersApi.refresh();
      setSyncNote(res.note || (res.fromCache ? 'Data served from local cache' : 'Live data synchronized from SAP S/4HANA'));
      setStatusMessage({ type: 'success', text: res.message || 'Sales Orders synchronized successfully.' });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to refresh from SAP.' });
    } finally {
      setRefreshing(false);
    }
  };

  const openOrders = salesOrders.filter(so => so.portal_status === 'OPEN');
  const allSelectableIds = openOrders.map(so => so.id);
  const isAllSelected = allSelectableIds.length > 0 && allSelectableIds.every(id => selectedSoIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSoIds([]);
    } else {
      setSelectedSoIds(allSelectableIds);
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedSoIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDistributeSubmit = async () => {
    if (selectedSoIds.length === 0 || !selectedTransporterId) return;
    setDistributing(true);
    setStatusMessage(null);
    try {
      const res = await salesOrdersApi.distribute(selectedSoIds, Number(selectedTransporterId));
      setStatusMessage({ type: 'success', text: res.message });
      setShowDistributeModal(false);
      setSelectedSoIds([]);
      setSelectedTransporterId('');
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Distribution failed.' });
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Live SAP Sales Orders"
        subtitle="Extract open sales contracts and dispatches directly from SAP S/4HANA. Select orders to distribute as complete units to transport partners."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="secondary"
              onClick={handleRefreshFromSap}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} style={{ marginRight: '6px' }} />
              {refreshing ? 'Fetching SAP...' : 'Refresh from SAP'}
            </Button>
            {selectedSoIds.length > 0 && (
              <Button
                variant="primary"
                onClick={() => setShowDistributeModal(true)}
              >
                <Send size={15} style={{ marginRight: '6px' }} />
                Distribute ({selectedSoIds.length})
              </Button>
            )}
          </div>
        }
      />

      {/* Standard Packaging & Load Mapping Note Banner */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: '#1e40af'
      }}>
        <Package size={17} style={{ flexShrink: 0, color: '#2563eb' }} />
        <span>
          <strong>Standard Payload Conversion: 1 Box = 1 Ton (1,000 kg).</strong> Quantities from SAP VL03N outbound deliveries map 1:1 into fleet truck capacities.
        </span>
      </div>

      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
          fontSize: '13.5px',
          fontWeight: 600
        }}>
          {statusMessage.text}
        </div>
      )}

      {syncNote && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '6px',
          backgroundColor: 'var(--color-brand-blue-50)',
          color: 'var(--color-brand-blue-800)',
          fontSize: '12.5px'
        }}>
          <AlertCircle size={15} />
          <span>{syncNote}</span>
        </div>
      )}

      <Card title="Sales Order Pipeline" subtitle="All current sales orders fetched from SAP S/4HANA">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading Sales Orders from repository...
          </div>
        ) : salesOrders.length === 0 ? (
          <EmptyState
            title="No Sales Orders Available"
            description="Click 'Refresh from SAP' to fetch open sales orders from SAP S/4HANA."
            action={
              <Button onClick={handleRefreshFromSap}>
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> Fetch Now
              </Button>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', width: '40px' }}>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      title="Select all open orders"
                    >
                      {isAllSelected ? <CheckSquare size={18} color="var(--color-brand-blue-600)" /> : <Square size={18} color="#94a3b8" />}
                    </button>
                  </th>
                  <th style={{ padding: '12px 14px' }}>SAP SO #</th>
                  <th style={{ padding: '12px 14px' }}>Customer Yard</th>
                  <th style={{ padding: '12px 14px' }}>Materials / Line Items</th>
                  <th style={{ padding: '12px 14px' }}>Total Quantity</th>
                  <th style={{ padding: '12px 14px' }}>Delivery Target</th>
                  <th style={{ padding: '12px 14px' }}>SAP Status</th>
                  <th style={{ padding: '12px 14px' }}>Portal Stage</th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.map(so => {
                  const isSelectable = so.portal_status === 'OPEN';
                  const isChecked = selectedSoIds.includes(so.id);

                  return (
                    <tr
                      key={so.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.05)' : undefined,
                        opacity: isSelectable ? 1 : 0.75
                      }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          type="button"
                          disabled={!isSelectable}
                          onClick={() => toggleSelectRow(so.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: isSelectable ? 'pointer' : 'not-allowed',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {isChecked ? (
                            <CheckSquare size={18} color="var(--color-brand-blue-600)" />
                          ) : (
                            <Square size={18} color={isSelectable ? '#94a3b8' : '#cbd5e1'} />
                          )}
                        </button>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace' }}>
                        #{so.sap_so_no}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>{so.customer_name || 'PODZO Mining Yard'}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>{so.sap_customer_no}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {(() => {
                          const cargo = formatCargoDisplay(so.materials_summary, so.materials_codes);
                          return (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <Package size={15} color="var(--color-brand-blue-600)" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--color-text-heading)', fontSize: '12.5px' }}>
                                  {cargo.title}
                                </div>
                                {cargo.codes && (
                                  <span style={{
                                    display: 'inline-block',
                                    marginTop: '3px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    color: 'var(--color-text-muted)',
                                    backgroundColor: '#f1f5f9',
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                    border: '1px solid #e2e8f0'
                                  }}>
                                    SAP #{cargo.codes}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {so.total_qty ? `${so.total_qty.toLocaleString()} Boxes (${so.total_qty.toLocaleString()} Tons)` : '34 Boxes (34 Tons)'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
                        {so.delivery_date || 'Standard'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className="badge badge-blue">
                          {so.overall_status === 'A' ? 'SAP Open' : so.overall_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge status={so.portal_status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Distribution Modal: Whole SO to One Transporter, No splitting */}
      <Modal
        isOpen={showDistributeModal}
        onClose={() => setShowDistributeModal(false)}
        title="Distribute Sales Orders to Transporter"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-body)' }}>
            You have selected <strong>{selectedSoIds.length}</strong> Sales Order(s). Per business rules, each entire Sales Order will be assigned as a whole unit to the selected Transporter.
          </p>

          <div style={{
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: 'var(--color-bg-page)',
            border: '1px solid var(--color-border)',
            fontSize: '12.5px'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>Selected Sales Orders:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selectedSoIds.map(id => {
                const so = salesOrders.find(x => x.id === id);
                return (
                  <span key={id} style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'monospace'
                  }}>
                    SO #{so?.sap_so_no || id}
                  </span>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              Assign To Transporter Partner:
            </label>
            <select
              value={selectedTransporterId}
              onChange={e => setSelectedTransporterId(e.target.value ? Number(e.target.value) : '')}
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
              <option value="">-- Choose Transporter --</option>
              {transporters.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} (GSTIN: {t.gstin})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button
              variant="secondary"
              onClick={() => setShowDistributeModal(false)}
              disabled={distributing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDistributeSubmit}
              disabled={distributing || !selectedTransporterId}
            >
              {distributing ? 'Distributing...' : 'Confirm Distribution'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default AdminSalesOrders;
