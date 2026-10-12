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
  AlertCircle,
  FileText,
  Truck,
  RotateCcw
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
import { formatCargoDisplay } from './SupervisorDashboard';

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
  const [inspectTab, setInspectTab] = useState<'SO' | 'DELIVERY'>('SO');
  const [selectedDeliveryNo, setSelectedDeliveryNo] = useState<string | null>(null);

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
  const distributedOrders = salesOrders.filter(so => ['DISTRIBUTED', 'IN_PROGRESS', 'IN_TRANSIT'].includes(so.portal_status));
  const openReviews = reviews.filter(r => r.status === 'OPEN');
  const pendingPodVerify = invoices.filter(i => i.status === 'SENT_TO_CA');
  const pendingMiro = miroInvoices.filter(m => m.status === 'PARKED');
  const completedOrders = salesOrders.filter(so => ['COMPLETED', 'DELIVERED', 'INVOICED', 'PAID', 'APPROVED', 'CLEARED'].includes(so.portal_status));

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

  const handleOpenInspect = async (so: SalesOrderV3, targetDeliveryNo?: string) => {
    setInspectSo(so);
    setInspectLoading(true);
    if (targetDeliveryNo) {
      setInspectTab('DELIVERY');
      setSelectedDeliveryNo(targetDeliveryNo);
    } else {
      setInspectTab('SO');
      setSelectedDeliveryNo(null);
    }
    try {
      const detail = await salesOrdersApi.get(so.id);
      setInspectDetails(detail);
      if (detail.deliveries && detail.deliveries.length > 0 && !targetDeliveryNo) {
        setSelectedDeliveryNo(detail.deliveries[0].sap_delivery_no);
      }
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

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo execution data? All Sales Orders will return to OPEN status and no orders will be distributed.')) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      await fetch('/api/v3/demo/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('podzo_token_v3') || ''}`
        }
      });
      setStatusMessage({ type: 'success', text: 'Demo environment reset. All Sales Orders are now OPEN and ready to distribute.' });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Reset failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Open Sales Orders"
        subtitle="Manage end-to-end logistics execution: extract live SAP Sales Orders, inspect line items & outbound deliveries, and distribute entire orders to transporters."
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
              variant="ghost"
              size="sm"
              onClick={handleResetDemo}
              style={{ color: '#dc2626', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}
            >
              <RotateCcw size={13} style={{ marginRight: '6px' }} />
              Reset Demo State
            </Button>
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
              {
                id: 'completed_sos',
                value: completedOrders.length,
                label: 'Fully Completed',
                subtitle: completedOrders.length > 0 ? 'POD Approved & Cleared' : 'None completed',
                onClick: () => navigate('/admin/invoices'),
                accentColor: '#16a34a',
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
                        <th style={{ padding: '12px 14px' }}>Outbound Deliveries (VL03N)</th>
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
                              {so.deliveries_summary ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {so.deliveries_summary.split(', ').map(delNo => (
                                    <span 
                                      key={delNo}
                                      onClick={() => handleOpenInspect(so, delNo)}
                                      title={`View VL03N Delivery #${delNo} Breakdown`}
                                      style={{
                                        padding: '2px 7px',
                                        borderRadius: '4px',
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        fontFamily: 'monospace',
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        color: '#1d4ed8',
                                        cursor: 'pointer'
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
                              <div style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>{so.customer_name || 'PODZO Mining Yard'}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{so.sap_customer_no}</div>
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
        title={`SAP Sales Order #${inspectSo?.sap_so_no || ''} Detailed Document Overview`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {inspectLoading ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Loading SAP S/4HANA document hierarchy...
            </div>
          ) : (
            <>
              {/* Document Type Tabs: VA03 vs VL03N */}
              <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '8px',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => setInspectTab('SO')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: inspectTab === 'SO' ? 'var(--color-brand-blue-600)' : 'var(--color-bg-page)',
                    color: inspectTab === 'SO' ? '#ffffff' : 'var(--color-text-body)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileText size={14} />
                  Sales Order Cargo (VA03)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInspectTab('DELIVERY');
                    if (!selectedDeliveryNo && inspectDetails?.deliveries && inspectDetails.deliveries.length > 0) {
                      setSelectedDeliveryNo(inspectDetails.deliveries[0].sap_delivery_no);
                    }
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: inspectTab === 'DELIVERY' ? 'var(--color-brand-blue-600)' : 'var(--color-bg-page)',
                    color: inspectTab === 'DELIVERY' ? '#ffffff' : 'var(--color-text-body)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Truck size={14} />
                  Outbound Deliveries (VL03N)
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    backgroundColor: inspectTab === 'DELIVERY' ? 'rgba(255,255,255,0.25)' : 'var(--color-brand-blue-100, #dbeafe)',
                    color: inspectTab === 'DELIVERY' ? '#ffffff' : 'var(--color-brand-blue-700, #1d4ed8)',
                    fontWeight: 700
                  }}>
                    {(inspectDetails?.deliveries || []).length}
                  </span>
                </button>
              </div>

              {inspectTab === 'SO' ? (
                <>
                  {/* Header Box with Customer, Address & Net Value in INR */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-bg-page)',
                    border: '1px solid var(--color-border)',
                    fontSize: '12.5px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Sold-To Party (Customer)</span>
                      <strong style={{ fontSize: '13.5px', color: 'var(--color-text-heading)' }}>{inspectDetails?.customer_name || inspectSo?.customer_name}</strong>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {inspectDetails?.customer_address || 'Pune, Maharashtra, India'}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Total Net Value (VA03)</span>
                      <strong style={{ fontSize: '14px', color: 'var(--color-brand-blue-600)' }}>
                        {Number(inspectDetails?.total_net_amount ?? inspectSo?.total_net_amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {inspectDetails?.currency || 'INR'}
                      </strong>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Status: <span style={{ fontWeight: 600 }}>{inspectDetails?.overall_status === 'A' ? 'Active / Open' : 'Processed'}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Logistics Execution Stage</span>
                      <div style={{ marginTop: '4px' }}>
                        <StatusBadge status={inspectDetails?.portal_status || inspectSo?.portal_status || 'OPEN'} />
                      </div>
                    </div>
                  </div>

                  {/* Outbound Deliveries Summary in VA03 view */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                        Linked Outbound Deliveries (VL03N)
                      </h4>
                      <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                        Click a delivery to inspect VL03N details
                      </span>
                    </div>

                    {(inspectDetails?.deliveries && inspectDetails.deliveries.length > 0) ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {inspectDetails.deliveries.map(del => (
                          <div
                            key={del.id}
                            onClick={() => {
                              setSelectedDeliveryNo(del.sap_delivery_no);
                              setInspectTab('DELIVERY');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              backgroundColor: del.delivery_type === 'COMPLETE' ? '#f0fdf4' : '#eff6ff',
                              border: `1px solid ${del.delivery_type === 'COMPLETE' ? '#bbf7d0' : '#bfdbfe'}`,
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
                              Delivery #{del.sap_delivery_no}
                            </span>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              backgroundColor: del.delivery_type === 'COMPLETE' ? '#16a34a' : '#2563eb',
                              color: '#ffffff'
                            }}>
                              {del.delivery_type === 'COMPLETE' ? 'Complete Delivery' : 'Partial Delivery'}
                            </span>
                            <Eye size={12} color="#64748b" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--color-bg-page)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        No outbound delivery generated yet in SAP S/4HANA.
                      </div>
                    )}
                  </div>

                  {/* Real Cargo Line Items Breakdown (VA03) */}
                  <div>
                    <h4 style={{ margin: '4px 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                      Sales Order Cargo Items (VA03)
                    </h4>
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '8px 12px' }}>Item #</th>
                            <th style={{ padding: '8px 12px' }}>Material</th>
                            <th style={{ padding: '8px 12px' }}>Description</th>
                            <th style={{ padding: '8px 12px' }}>Order Qty</th>
                            <th style={{ padding: '8px 12px' }}>Net Price</th>
                            <th style={{ padding: '8px 12px' }}>Plant</th>
                            <th style={{ padding: '8px 12px' }}>SLoc</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(inspectDetails?.items && inspectDetails.items.length > 0) ? (
                            inspectDetails.items.map(itm => (
                              <tr key={itm.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700 }}>#{itm.item_no}</td>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--color-brand-blue-600)', fontWeight: 600 }}>
                                  {itm.material}
                                </td>
                                <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                                  {itm.material_desc || itm.material}
                                </td>
                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                                  {itm.order_qty} {itm.uom}
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                  {Number(itm.net_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
                                </td>
                                <td style={{ padding: '8px 12px' }}>{itm.plant || 'RBP1'}</td>
                                <td style={{ padding: '8px 12px' }}>{itm.storage_location || 'SL01'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No line items registered.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                /* Outbound Delivery (VL03N) Tab */
                (() => {
                  const delList = inspectDetails?.deliveries || [];
                  const activeDelivery = delList.find(d => d.sap_delivery_no === selectedDeliveryNo) || delList[0];

                  if (!activeDelivery) {
                    return (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No Outbound Delivery document exists for this Sales Order.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Delivery Selector Pills if multiple */}
                      {delList.length > 1 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {delList.map(del => {
                            const isSelected = (del.sap_delivery_no === (selectedDeliveryNo || activeDelivery.sap_delivery_no));
                            return (
                              <button
                                key={del.id}
                                type="button"
                                onClick={() => setSelectedDeliveryNo(del.sap_delivery_no)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: isSelected ? '2px solid #2563eb' : '1px solid var(--color-border)',
                                  backgroundColor: isSelected ? '#eff6ff' : 'var(--color-bg-page)',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                              >
                                <span>Delivery #{del.sap_delivery_no}</span>
                                <span style={{
                                  fontSize: '10px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: del.delivery_type === 'COMPLETE' ? '#16a34a' : '#2563eb',
                                  color: '#ffffff',
                                  fontWeight: 700
                                }}>
                                  {del.delivery_type === 'COMPLETE' ? 'Complete' : 'Partial'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Authentic SAP VL03N Delivery Header Box */}
                      <div style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-bg-page)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-brand-blue-700, #1d4ed8)' }}>
                              Outbound Delivery #{activeDelivery.sap_delivery_no}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: activeDelivery.delivery_type === 'COMPLETE' ? '#16a34a' : '#2563eb',
                              color: '#ffffff'
                            }}>
                              {activeDelivery.delivery_type === 'COMPLETE' ? 'Complete Delivery' : 'Partial Delivery'}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                            Tcode: VL03N
                          </span>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '12px',
                          fontSize: '12.5px'
                        }}>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Ship-To Party</span>
                            <strong style={{ fontSize: '13px', color: 'var(--color-text-heading)' }}>
                              {activeDelivery.ship_to_party || inspectDetails?.sap_customer_no} — {activeDelivery.ship_to_name || inspectDetails?.customer_name}
                            </strong>
                            <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {activeDelivery.ship_to_address || inspectDetails?.customer_address || 'Pune, Maharashtra, India'}
                            </div>
                          </div>

                          <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Movement Dates</span>
                            <div>Doc Date: <strong>{activeDelivery.document_date || '07.10.2026'}</strong></div>
                            <div style={{ marginTop: '2px' }}>
                              Planned GI: <strong style={{ color: '#2563eb' }}>{activeDelivery.planned_gi_date || '07.10.2026'}</strong>
                            </div>
                            {activeDelivery.actual_gi_date && (
                              <div style={{ marginTop: '2px', color: '#16a34a', fontWeight: 600 }}>
                                Actual GI: {activeDelivery.actual_gi_date}
                              </div>
                            )}
                          </div>

                          <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Weight & Packaging</span>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                              Total Weight: {activeDelivery.total_weight_kg ? `${activeDelivery.total_weight_kg.toLocaleString('en-IN', { minimumFractionDigits: 1 })} KG` : '10.0 KG'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              No. of Packages: <strong>{activeDelivery.no_packages ?? 0}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* VL03N Delivered Line Items Overview Table */}
                      <div>
                        <h4 style={{ margin: '4px 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                          Item Overview — Delivered Materials (VL03N)
                        </h4>
                        <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--color-bg-page)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '8px 12px' }}>Item #</th>
                                <th style={{ padding: '8px 12px' }}>Material</th>
                                <th style={{ padding: '8px 12px' }}>Description</th>
                                <th style={{ padding: '8px 12px' }}>Deliv. Qty</th>
                                <th style={{ padding: '8px 12px' }}>Unit</th>
                                <th style={{ padding: '8px 12px' }}>Plant</th>
                                <th style={{ padding: '8px 12px' }}>SLoc</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(activeDelivery.items && activeDelivery.items.length > 0) ? (
                                activeDelivery.items.map((itm: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700 }}>#{itm.item_no}</td>
                                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: 'var(--color-brand-blue-600)', fontWeight: 600 }}>
                                      {itm.material}
                                    </td>
                                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                                      {itm.material_desc || itm.material}
                                    </td>
                                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#16a34a' }}>
                                      {itm.deliv_qty}
                                    </td>
                                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                                      {itm.uom || 'EA'}
                                    </td>
                                    <td style={{ padding: '8px 12px' }}>{itm.plant || 'DSA1'}</td>
                                    <td style={{ padding: '8px 12px' }}>{itm.storage_location || 'SL01'}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    No item records registered for this delivery document.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              {inspectSo?.portal_status === 'OPEN' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
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
