import React, { useState, useEffect } from 'react';
import { caApi, ContractV3, PurchaseOrderV3, transportersApi, Transporter } from '../lib/api_v3';
import { Card } from '../components/Card';
import { ConsolidatedContractPoForm } from '../components/ConsolidatedContractPoForm';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { Send, Clock, Calendar, Check, ShieldCheck, MapPin } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/format';

export const AdminContracts: React.FC = () => {
  const [contracts, setContracts] = useState<ContractV3[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractV3 | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderV3[]>([]);
  const [selectedPOToAssign, setSelectedPOToAssign] = useState<PurchaseOrderV3 | null>(null);
  
  // Job Config Form inputs with SAP SLA Schedule parameters
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [targetTransporterId, setTargetTransporterId] = useState('');
  const [availStart, setAvailStart] = useState('06:00');
  const [availEnd, setAvailEnd] = useState('18:00');
  const [requestedPickup, setRequestedPickup] = useState('2026-08-15T08:00');
  const [expectedDelivery, setExpectedDelivery] = useState('2026-08-15T16:00');
  const [finalDue, setFinalDue] = useState('2026-08-16T12:00');
  const [acceptanceHours, setAcceptanceHours] = useState('4');
  const [timebound, setTimebound] = useState('2026-12-31');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch contracts on load
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await caApi.getContracts();
      setContracts(data);
      setSelectedContract(null);
      setPurchaseOrders([]);
      setSelectedPOToAssign(null);
      const transList = await transportersApi.list();
      setTransporters(transList);
      if (transList.length > 0) {
        setTargetTransporterId(transList[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load contracts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [selectedPOsToAssign, setSelectedPOsToAssign] = useState<PurchaseOrderV3[]>([]);

  const handleContractSelect = async (c: ContractV3) => {
    setSelectedPOToAssign(null);
    setSelectedPOsToAssign([]);
    try {
      const detail = await caApi.getContractDetails(c.id);
      setSelectedContract(detail);
      if (detail.purchase_orders) {
        setPurchaseOrders(detail.purchase_orders);
      }
    } catch (err) {
      console.error('Failed to fetch contract details:', err);
    }
  };

  const handleDistributeSubmit = async () => {
    const targetPo = selectedPOToAssign || (selectedPOsToAssign.length > 0 ? selectedPOsToAssign[0] : null);
    if (!targetPo || !targetTransporterId) return;
    setIsSubmitting(true);
    try {
      await caApi.distributePo(targetPo.id, {
        po_ids: selectedPOsToAssign.map(p => p.id),
        transporter_id: parseInt(targetTransporterId),
        availability_window: `${availStart}-${availEnd}`,
        availability_window_start: availStart,
        availability_window_end: availEnd,
        requested_pickup_datetime: requestedPickup,
        expected_delivery_datetime: expectedDelivery,
        final_due_datetime: finalDue,
        acceptance_window_hours: parseInt(acceptanceHours) || 4,
        timebound
      } as any);
      if (selectedContract) {
        handleContractSelect(selectedContract);
      }
      setSelectedPOToAssign(null);
      setSelectedPOsToAssign([]);
    } catch (err) {
      console.error('Failed to distribute transport execution:', err);
      alert('Error creating multi-PO transport execution');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <PageHeader 
        title="Contracts & PO Release Console"
        subtitle="Manage active SAP S/4HANA Outline Agreements (ME33K/ME33L) and distribute purchase orders to transporters"
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading Contracts...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left: Contracts & PO queues */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <Card 
              title={`Active S/4HANA Quantity Contracts (${contracts.length})`}
              subtitle={`Showing ${contracts.length} active outline agreements synchronized from SAP S21 master data`}
            >
              <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: 'var(--color-bg-card)' }}>
                    <tr>
                      <th>Contract Ref</th>
                      <th>Yard/Customer</th>
                      <th>Validity Period</th>
                      <th>Material / Items</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => {
                      const isSelected = selectedContract?.id === c.id;
                      
                      // Calculate distinct line item materials if present in linked POs
                      const contractPoMaterials = purchaseOrders
                        .filter(po => po.contract_id === c.id)
                        .map(po => po.material);
                      const uniqueMaterials = Array.from(new Set(contractPoMaterials));

                      let materialDisplay = (c as any).material || 'Washed Coal Grade A';
                      if (uniqueMaterials.length > 1) {
                        materialDisplay = `Multiple Items (${uniqueMaterials.length})`;
                      } else if (uniqueMaterials.length === 1) {
                        materialDisplay = uniqueMaterials[0];
                      }

                      return (
                        <tr 
                          key={c.id}
                          onClick={() => handleContractSelect(c)}
                          style={{ 
                            cursor: 'pointer', 
                            backgroundColor: isSelected ? 'var(--color-brand-blue-50)' : 'transparent' 
                          }}
                        >
                          <td className="mono" style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>
                            {c.sap_contract_no}
                          </td>
                          <td style={{ fontWeight: 600 }}>{c.customer_name}</td>
                          <td style={{ fontSize: '12px' }}>
                            {c.start_date} to {c.end_date}
                          </td>
                          <td style={{ color: 'var(--color-text-body)', fontWeight: 700 }}>
                            {c.items && c.items.length > 1 ? (
                              <span style={{ 
                                backgroundColor: '#EFF6FF', 
                                color: '#1D4ED8', 
                                border: '1px solid #BFDBFE', 
                                padding: '3px 8px', 
                                borderRadius: '6px', 
                                fontSize: '11px',
                                fontWeight: 700
                              }}>
                                {c.items.length} Contract Items
                              </span>
                            ) : c.items && c.items.length === 1 ? (
                              c.items[0].material_desc
                            ) : (
                              '1 Contract Item'
                            )}
                          </td>
                          <td>
                            {c.sync_mismatch ? (
                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FCA5A5' }}>
                                SYNC MISMATCH
                              </span>
                            ) : (
                              <StatusBadge status={c.status} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>


            {/* PO Distribution Desk */}
            {!selectedContract ? (
              <Card title="Purchase Orders Distribution Queue" subtitle="Inspect purchase order references linked to selected outline contracts">
                <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--color-text-muted)' }}>
                  <p style={{ fontWeight: 750, fontSize: '14px', margin: '0 0 6px 0', color: 'var(--color-text-heading)' }}>No Contract Selected</p>
                  <p style={{ fontSize: '13px', margin: 0 }}>Click on any Active S/4HANA Contract row above to inspect its linked Purchase Orders.</p>
                </div>
              </Card>
            ) : (
              <ConsolidatedContractPoForm
                contract={selectedContract}
                purchaseOrders={purchaseOrders}
                selectedPoIds={selectedPOsToAssign.map(p => p.id)}
                onSelectPosChange={(pos) => {
                  setSelectedPOsToAssign(pos);
                  if (pos.length > 0) setSelectedPOToAssign(pos[0]);
                  else setSelectedPOToAssign(null);
                }}
                onConfirmTransport={(pos) => {
                  setSelectedPOsToAssign(pos);
                  if (pos.length > 0) setSelectedPOToAssign(pos[0]);
                }}
                actionLabel="Proceed to Carrier Allocation"
              />
            )}


          </div>

          {/* Right Column: PO Distribution Form */}
          <div>
            {(selectedPOsToAssign.length > 0 || selectedPOToAssign) ? (
              <Card title="Assign Job & Send to Transporter" accentColor="var(--color-brand-blue-600)">
                
                {/* 1. Contract Context Summary Banner */}
                {selectedContract && (
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Contract Context</div>
                    <div className="mono" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-heading)' }}>#{selectedContract.sap_contract_no}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-body)', fontWeight: 600 }}>{selectedContract.customer_name || 'SAP Client Entity'}</div>
                  </div>
                )}

                {/* 2. Selected Purchase Orders Collection (Multi-PO or Single-PO) */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      SELECTED PURCHASE ORDERS ({selectedPOsToAssign.length > 0 ? selectedPOsToAssign.length : 1})
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(selectedPOsToAssign.length > 0 ? selectedPOsToAssign : (selectedPOToAssign ? [selectedPOToAssign] : [])).map((po) => {
                      const poItems = po.items && po.items.length > 0 ? po.items : [];
                      return (
                        <div key={po.id} style={{
                          backgroundColor: 'var(--color-brand-blue-50)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          padding: '10px 12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong className="mono" style={{ fontSize: '13.5px', color: 'var(--color-text-heading)' }}>PO #{po.sap_po_no}</strong>
                                <StatusBadge status={po.status} />
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-body)', marginTop: '2px' }}>
                                {po.material}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-brand-blue-600)' }}>
                                {po.target_qty} {po.uom}
                              </span>
                              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                {formatCurrency(po.rate)} / {po.uom}
                              </div>
                            </div>
                          </div>

                          {/* Dynamic PO Line Items */}
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #CBD5E1' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                              PO Line Items ({poItems.length > 0 ? poItems.length : 1})
                            </div>
                            {poItems.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {poItems.map((item) => (
                                  <div key={item.id} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                                    <span><strong>Item {item.item_no}:</strong> {item.material_desc}</span>
                                    <span style={{ fontWeight: 700, color: '#2563EB' }}>{item.ordered_qty} {item.uom}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '4px' }}>
                                <span><strong>Item 10:</strong> {po.material}</span>
                                <span style={{ fontWeight: 700, color: '#2563EB' }}>{po.target_qty} {po.uom}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Total Planned Payload Summary */}
                <div style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase', display: 'block' }}>
                      TOTAL PLANNED PAYLOAD
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#3B82F6', fontWeight: 600 }}>
                      Calculated from {selectedPOsToAssign.length > 0 ? selectedPOsToAssign.reduce((sum, p) => sum + (p.items?.length || 1), 0) : (selectedPOToAssign?.items?.length || 1)} PO line item(s)
                    </span>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#1D4ED8' }}>
                    {(selectedPOsToAssign.length > 0 ? selectedPOsToAssign : (selectedPOToAssign ? [selectedPOToAssign] : [])).reduce((sum, p) => sum + (Number(p.target_qty) || 0), 0).toFixed(2)} TON
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* 4. Route Telemetry */}
                  <div style={{ borderTop: '1.5px solid var(--color-border)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Route Locations
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', backgroundColor: 'var(--color-bg-page)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>WHERE TO LOAD</span>
                        <strong style={{ color: 'var(--color-text-heading)' }}>MON1 Siding</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block' }}>WHERE TO DELIVER</span>
                        <strong style={{ color: 'var(--color-text-heading)' }}>{selectedContract?.customer_name || 'Siding Yard 1001'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 5. Carrier Allocation */}
                  <div style={{ borderTop: '1.5px solid var(--color-border)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                      Choose Transporter
                    </span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Select Transporter Company
                        </label>
                        <select
                          value={targetTransporterId}
                          onChange={(e) => setTargetTransporterId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1.5px solid var(--color-border)',
                            borderRadius: '10px',
                            fontSize: '13px',
                            backgroundColor: '#FFFFFF',
                            fontWeight: 600,
                          }}
                        >
                          {transporters.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 6. SAP SLA Schedule */}
                  <div style={{ borderTop: '1.5px solid var(--color-border)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                      SLA Schedule Parameters
                    </span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Window Start</label>
                          <input type="text" value={availStart} onChange={e => setAvailStart(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Window End</label>
                          <input type="text" value={availEnd} onChange={e => setAvailEnd(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }} />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Expected Pickup</label>
                        <input type="datetime-local" value={requestedPickup} onChange={e => setRequestedPickup(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Expected Delivery</label>
                        <input type="datetime-local" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>SLA Acceptance Limit (Hours)</label>
                        <input type="number" value={acceptanceHours} onChange={e => setAcceptanceHours(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--color-border)', borderRadius: '8px', fontSize: '12px' }} />
                      </div>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1.5px solid var(--color-border)', paddingTop: '16px' }}>
                  <button 
                    onClick={() => { setSelectedPOToAssign(null); setSelectedPOsToAssign([]); }} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDistributeSubmit}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    <Send size={14} />
                    {isSubmitting ? 'Releasing...' : 'Release PO & Notify'}
                  </button>
                </div>

              </Card>
            ) : selectedContract ? (
              <Card title="Contract Detail Inspector">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
                        SAP Outline Agreement Header (#{selectedContract.sap_contract_no})
                      </h4>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>
                        Source: S21 SAP
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', backgroundColor: 'var(--color-bg-page)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Agreement Type</span>
                        <strong style={{ color: '#2563EB' }}>
                          {selectedContract.contract_type === 'WK' || selectedContract.sap_contract_no === '4600000026' || selectedContract.sap_contract_no === '4600000021' ? 'Value Contract (WK)' : 'Quantity Contract (MK)'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Supplier</span>
                        <strong style={{ color: 'var(--color-text-heading)' }}>
                          {selectedContract.supplier_name || (selectedContract.sap_contract_no === '4600000026' || selectedContract.sap_contract_no === '4600000021' ? '1403 — Gajanan Enterprises' : '1402 — ABC Enterprises')}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Agreement Date</span>
                        <strong>{selectedContract.agreement_date || selectedContract.start_date || '12.08.2026'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Currency & Plant</span>
                        <strong>{selectedContract.currency || 'INR'} ({selectedContract.plant || 'MON1 Plant'})</strong>
                      </div>
                    </div>
                  </div>

                  {/* Contract Items Overview */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 8px 0' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
                        Contract Line Items ({selectedContract.items ? selectedContract.items.length : 0})
                      </h4>
                      {selectedContract.items && selectedContract.items.length > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                          ✓ S21 Verified ({selectedContract.items.length} Items)
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
                      {selectedContract.items && selectedContract.items.length > 0 ? (
                        selectedContract.items.map((item) => (
                          <div key={item.id} style={{ fontSize: '12px', padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0F172A' }}>
                                Item {item.item_no}: {item.material_desc}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                Material #{item.material_no} | Plant: {item.plant || 'MON1 Plant'} | Storage: {item.storage_loc || 'SL01'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: '#2563EB', fontWeight: 800, fontSize: '13px' }}>
                                {item.target_qty} {item.uom}
                              </span>
                              <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                                Price: {item.net_price} {item.currency || 'INR'}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '12px', textAlign: 'center' }}>
                          Contract header retrieved, but contract line items could not be retrieved from S21.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

            ) : (
              <Card title="Outline Inspector">
                <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                  Select an outline contract from the table list to inspect agreement details or distribute open purchase orders.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
