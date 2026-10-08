import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  FileClock, 
  ArrowRight, 
  RefreshCw, 
  Package, 
  Activity, 
  CheckSquare, 
  Square, 
  Send,
  Eye,
  AlertCircle
} from 'lucide-react';

import { 
  salesOrdersApi, 
  transportersApi, 
  SalesOrderV3, 
  SalesOrderItemV3, 
  Transporter, 
  caApi, 
  invoicesApi, 
  ReviewQueueItemV3, 
  DeliveryInvoiceV3, 
  MiroInvoice 
} from '../lib/api_v3';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { KPISummaryBar } from '../components/KPISummaryBar';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [salesOrders, setSalesOrders] = useState<SalesOrderV3[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [reviews, setReviews] = useState<ReviewQueueItemV3[]>([]);
  const [invoices, setInvoices] = useState<DeliveryInvoiceV3[]>([]);
  const [miroInvoices, setMiroInvoices] = useState<MiroInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Distribution selection state (Target Flow: plain table with checkbox per row & select-all, whole SO to transporter)
  const [selectedSoIds, setSelectedSoIds] = useState<number[]>([]);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedTransporterId, setSelectedTransporterId] = useState<number | ''>('');
  const [distributing, setDistributing] = useState(false);

  // Line items inspection modal state
  const [inspectSo, setInspectSo] = useState<SalesOrderV3 | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectDetails, setInspectDetails] = useState<SalesOrderV3 | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sos, trans, r, i, mi] = await Promise.all([
        salesOrdersApi.list(),
        transportersApi.list(),
        caApi.getReviewQueue('OPEN'),
        caApi.getDeliveryInvoices('SENT_TO_CA'),
        invoicesApi.listMiro()
      ]);
      setSalesOrders(sos || []);
      setTransporters(trans || []);
      setReviews(r || []);
      setInvoices(i || []);
      setMiroInvoices(mi || []);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
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
      setStatusMessage({ type: 'success', text: res.message || 'Sales Orders synchronized successfully from SAP S/4HANA.' });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to refresh from SAP.' });
    } finally {
      setRefreshing(false);
    }
  };

  const openOrders = salesOrders.filter(so => so.portal_status === 'OPEN');
  const distributedOrders = salesOrders.filter(so => so.portal_status === 'DISTRIBUTED' || so.portal_status === 'IN_PROGRESS');
  const openReviews = reviews.filter(r => r.status === 'OPEN');
  const pendingPodVerify = invoices.filter(i => i.status === 'SENT_TO_CA');
  const pendingMiro = miroInvoices.filter(m => m.status === 'PARKED');

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

  const handleOpenInspect = async (so: SalesOrderV3) => {
    setInspectSo(so);
    setInspectLoading(true);
    try {
      const detail = await salesOrdersApi.get(so.id);
      setInspectDetails(detail);
    } catch (err) {
      console.error('Failed to fetch SO details:', err);
      setInspectDetails(so);
    } finally {
      setInspectLoading(false);
    }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Fleet Logistics Command Desk"
        subtitle="Manage end-to-end logistics execution: extract live SAP Sales Orders, inspect line items, distribute entire orders to transporters, and track physical delivery."
        actions={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshFromSap}
              disabled={refreshing}
            >
              <RefreshCw size={13} className={refreshing ? 'spin' : ''} style={{ marginRight: '6px' }} />
              {refreshing ? 'Syncing...' : 'Sync SAP Orders'}
            </Button>
            {selectedSoIds.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowDistributeModal(true)}
              >
                <Send size={13} style={{ marginRight: '6px' }} />
                Distribute Selected ({selectedSoIds.length})
              </Button>
            )}
            <Button 
              onClick={() => navigate('/admin/approvals')} 
              variant="secondary" 
              size="sm"
            >
              Inspect POD Queue ({openReviews.length})
            </Button>
            <Button 
              onClick={() => navigate('/admin/invoices')} 
              variant="secondary" 
              size="sm"
            >
              Post Invoice Desk ({pendingPodVerify.length})
            </Button>
          </div>
        }
      />

      {statusMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: statusMessage.type === 'success' ? 'var(--color-success-bg, #f0fdf4)' : 'var(--color-error-bg, #fef2f2)',
          color: statusMessage.type === 'success' ? 'var(--color-success-text, #166534)' : 'var(--color-error-text, #991b1b)',
          border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {statusMessage.type === 'success' ? '✓' : '⚠️'} {statusMessage.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
          Loading Sales Orders telemetry...
        </div>
      ) : (
        <>
          {/* Executive KPI Summary Bar — Focused on Sales Orders & Operational Gates */}
          <KPISummaryBar
            items={[
              {
                id: 'open_sos',
                value: openOrders.length,
                label: 'Open Sales Orders',
                subtitle: openOrders.length > 0 ? 'Ready for Distribution' : 'All assigned',
                onClick: () => {
                  setSelectedSoIds(allSelectableIds);
                },
                accentColor: openOrders.length > 0 ? 'var(--color-brand-blue-600)' : undefined,
              },
              {
                id: 'in_progress_sos',
                value: distributedOrders.length,
                label: 'Active Transits',
                subtitle: distributedOrders.length > 0 ? 'With Transporters / En Route' : 'None in transit',
                onClick: () => navigate('/admin/approvals'),
              },
              {
                id: 'reviews',
                value: openReviews.length,
                label: 'Pending POD Verification',
                subtitle: openReviews.length > 0 ? 'Awaiting CA Audit' : 'Queue clear',
                onClick: () => navigate('/admin/approvals'),
                accentColor: openReviews.length > 0 ? 'var(--color-error)' : undefined,
              },
              {
                id: 'pod',
                value: pendingPodVerify.length,
                label: 'Ready to Post Invoice',
                subtitle: pendingPodVerify.length > 0 ? 'Verified Deliveries' : 'None pending',
                onClick: () => navigate('/admin/invoices'),
                accentColor: pendingPodVerify.length > 0 ? 'var(--color-warning)' : undefined,
              },
            ]}
          />

          <div>
            {/* Main Interactive Table: Live SAP Sales Orders full width */}
            <Card 
              title="Live SAP Sales Orders" 
              subtitle="Select orders with checkboxes to distribute them as complete units to transport partners, or click any order to inspect its line items."
              action={
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {selectedSoIds.length > 0 && (
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => setShowDistributeModal(true)}
                    >
                      <Send size={12} style={{ marginRight: '4px' }} /> Distribute ({selectedSoIds.length})
                    </Button>
                  )}
                </div>
              }
              style={{ padding: 0 }}
            >
              {salesOrders.length === 0 ? (
                <div style={{ padding: '32px' }}>
                  <EmptyState
                    title="No Sales Orders Available"
                    description="Click 'Sync SAP Orders' to extract current open orders directly from S/4HANA."
                    action={
                      <Button onClick={handleRefreshFromSap}>
                        <RefreshCw size={14} style={{ marginRight: '6px' }} /> Fetch Now
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-page)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 14px', width: '36px' }}>
                          <button
                            type="button"
                            onClick={toggleSelectAll}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            title="Select all open orders"
                          >
                            {isAllSelected ? <CheckSquare size={17} color="var(--color-brand-blue-600)" /> : <Square size={17} color="#94a3b8" />}
                          </button>
                        </th>
                        <th style={{ padding: '12px 14px' }}>SAP SO #</th>
                        <th style={{ padding: '12px 14px' }}>Customer Yard</th>
                        <th style={{ padding: '12px 14px' }}>Materials / Line Items</th>
                        <th style={{ padding: '12px 14px' }}>Total Qty</th>
                        <th style={{ padding: '12px 14px' }}>Delivery Target</th>
                        <th style={{ padding: '12px 14px' }}>Portal Stage</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
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
                              transition: 'background-color 0.15s'
                            }}
                            className="table-row-hover"
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
                                  <CheckSquare size={17} color="var(--color-brand-blue-600)" />
                                ) : (
                                  <Square size={17} color={isSelectable ? '#94a3b8' : '#cbd5e1'} />
                                )}
                              </button>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span 
                                onClick={() => handleOpenInspect(so)}
                                className="mono" 
                                style={{ 
                                  fontWeight: 700, 
                                  color: 'var(--color-brand-blue-600)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Click to inspect line items"
                              >
                                #{so.sap_so_no}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>{so.customer_name || 'PODZO Mining Yard'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{so.sap_customer_no}</div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Package size={14} color="var(--color-brand-blue-600)" />
                                <span style={{ fontWeight: 500 }}>{so.materials_summary || `${so.item_count || 1} line item(s)`}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                              {so.total_qty ? `${so.total_qty.toFixed(1)} TO` : '34.0 TO'}
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {so.delivery_date || 'Standard'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <StatusBadge status={so.portal_status} />
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleOpenInspect(so)}
                                style={{ padding: '4px 8px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Eye size={12} /> Inspect
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Modal 1: Inspect Line Items & Distribute */}
      <Modal
        isOpen={!!inspectSo}
        onClose={() => {
          setInspectSo(null);
          setInspectDetails(null);
        }}
        title={`Sales Order #${inspectSo?.sap_so_no || ''} Line Items Inspection`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {inspectLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Loading line item details...
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-bg-page)',
                border: '1px solid var(--color-border)',
                fontSize: '12.5px'
              }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Customer:</span>
                  <strong>{inspectDetails?.customer_name || inspectSo?.customer_name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Delivery Target:</span>
                  <strong>{inspectDetails?.delivery_date || inspectSo?.delivery_date || 'Standard'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Portal Status:</span>
                  <StatusBadge status={inspectDetails?.portal_status || inspectSo?.portal_status || 'OPEN'} />
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: 600 }}>Cargo Line Items (Whole Order Distribution)</h4>
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Item</th>
                        <th style={{ padding: '8px 12px' }}>Material</th>
                        <th style={{ padding: '8px 12px' }}>Quantity</th>
                        <th style={{ padding: '8px 12px' }}>Plant</th>
                        <th style={{ padding: '8px 12px' }}>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(inspectDetails?.items && inspectDetails.items.length > 0) ? (
                        inspectDetails.items.map(itm => (
                          <tr key={itm.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>#{itm.item_no}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ fontWeight: 600 }}>{itm.material}</div>
                              {itm.material_desc && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{itm.material_desc}</div>}
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{itm.order_qty} {itm.uom}</td>
                            <td style={{ padding: '8px 12px' }}>{itm.plant || '1001'}</td>
                            <td style={{ padding: '8px 12px' }}>{itm.storage_location || 'SL01'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            No line items registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {inspectSo?.portal_status === 'OPEN' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedSoIds([inspectSo.id]);
                      setInspectSo(null);
                      setInspectDetails(null);
                      setShowDistributeModal(true);
                    }}
                  >
                    <Send size={13} style={{ marginRight: '6px' }} /> Distribute This Order
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal 2: Distribute Sales Orders (Whole Order Assignment) */}
      <Modal
        isOpen={showDistributeModal}
        onClose={() => setShowDistributeModal(false)}
        title="Distribute Sales Orders to Transporter Partner"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-body)' }}>
            You have selected <strong>{selectedSoIds.length}</strong> Sales Order(s). Per business rules, each entire Sales Order will be assigned as a complete unit to the selected Transporter.
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
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'monospace',
                    fontWeight: 600
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
              {distributing ? 'Distributing...' : 'Confirm Whole Order Distribution'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
