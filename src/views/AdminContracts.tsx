import React, { useState, useEffect } from 'react';
import { caApi, ContractV3, PurchaseOrderV3, transportersApi, Transporter } from '../lib/api_v3';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table, Column } from '../components/Table';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedContract === null ? (
            /* Step 0: Contracts list */
            <Card 
              title={`Active S/4HANA Quantity Contracts (${contracts.length})`}
              subtitle={`Showing ${contracts.length} active outline agreements synchronized from SAP S21 master data`}
              style={{ padding: 0 }}
            >
              <Table<ContractV3,>
                data={contracts}
                onRowClick={(c) => handleContractSelect(c)}
                getRowStyle={(c) => ({
                  backgroundColor: selectedContract?.id === c.id ? 'var(--color-brand-blue-50)' : 'transparent'
                })}
                renderMobileCard={(c) => {
                  const isSelected = selectedContract?.id === c.id;
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
                    <div 
                      onClick={() => handleContractSelect(c)}
                      style={{ 
                        display: 'flex', flexDirection: 'column', gap: '8px', 
                        padding: '12px 16px', borderBottom: '1px solid var(--color-border)', 
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--color-brand-blue-50)' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{c.sap_contract_no}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.customer_name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        <span>{materialDisplay}</span>
                        <span>{c.start_date} to {c.end_date}</span>
                      </div>
                    </div>
                  );
                }}
                columns={[
                  {
                    header: 'Contract Ref',
                    render: (c) => <span className="mono" style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>{c.sap_contract_no}</span>
                  },
                  {
                    header: 'Yard/Customer',
                    render: (c) => <span style={{ fontWeight: 600 }}>{c.customer_name}</span>
                  },
                  {
                    header: 'Validity Period',
                    render: (c) => <span style={{ fontSize: '12px' }}>{c.start_date} to {c.end_date}</span>
                  },
                  {
                    header: 'Material / Items',
                    render: (c) => {
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

                      return uniqueMaterials.length > 1 ? (
                        <span style={{ 
                          backgroundColor: '#EFF6FF', 
                          color: '#1D4ED8', 
                          border: '1px solid #BFDBFE', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {materialDisplay}
                        </span>
                      ) : (
                        materialDisplay
                      );
                    }
                  },
                  {
                    header: 'Status',
                    render: (c) => <StatusBadge status={c.status} />
                  }
                ]}
              />
            </Card>
          ) : selectedPOsToAssign.length === 0 ? (
            /* Step 1: PO Consolidated Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Button 
                variant="secondary" 
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setSelectedContract(null)}
              >
                ← Back to Contracts List
              </Button>
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
            </div>
          ) : (
            /* Step 2: Assign Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Button 
                variant="secondary" 
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setSelectedPOsToAssign([])}
              >
                ← Back to Purchase Orders
              </Button>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(selectedPOsToAssign.length > 0 ? selectedPOsToAssign : (selectedPOToAssign ? [selectedPOToAssign] : [])).map((po) => (
                      <div key={po.id} style={{
                        backgroundColor: 'var(--color-brand-blue-50)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong className="mono" style={{ fontSize: '13.5px', color: 'var(--color-text-heading)' }}>PO #{po.sap_po_no} / {po.po_item_no}</strong>
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
                    ))}
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
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>
                    TOTAL PLANNED PAYLOAD
                  </span>
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
                  <Button 
                    onClick={() => { setSelectedPOToAssign(null); setSelectedPOsToAssign([]); }} 
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDistributeSubmit}
                    disabled={isSubmitting}
                    variant="primary"
                  >
                    <Send size={14} style={{ marginRight: '4px' }} />
                    {isSubmitting ? 'Releasing...' : 'Release PO & Notify'}
                  </Button>
                </div>

              </Card>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left: Contracts & PO queues */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
             <Card 
               title={`Active S/4HANA Quantity Contracts (${contracts.length})`}
               subtitle={`Showing ${contracts.length} active outline agreements synchronized from SAP S21 master data`}
               style={{ padding: 0 }}
             >
               <Table<ContractV3>
                 data={contracts}
                 onRowClick={(c) => handleContractSelect(c)}
                 getRowStyle={(c) => ({
                   backgroundColor: selectedContract?.id === c.id ? 'var(--color-brand-blue-50)' : 'transparent'
                 })}
                 renderMobileCard={(c) => {
                   const isSelected = selectedContract?.id === c.id;
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
                     <div 
                       onClick={() => handleContractSelect(c)}
                       style={{ 
                         display: 'flex', flexDirection: 'column', gap: '8px', 
                         padding: '12px 16px', borderBottom: '1px solid var(--color-border)', 
                         cursor: 'pointer',
                         backgroundColor: isSelected ? 'var(--color-brand-blue-50)' : 'transparent'
                       }}
                     >
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{c.sap_contract_no}</span>
                         <StatusBadge status={c.status} />
                       </div>
                       <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.customer_name}</div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                         <span>{materialDisplay}</span>
                         <span>{c.start_date} to {c.end_date}</span>
                       </div>
                     </div>
                   );
                 }}
                 columns={[
                   {
                     header: 'Contract Ref',
                     render: (c) => <span className="mono" style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>{c.sap_contract_no}</span>
                   },
                   {
                     header: 'Yard/Customer',
                     render: (c) => <span style={{ fontWeight: 600 }}>{c.customer_name}</span>
                   },
                   {
                     header: 'Validity Period',
                     render: (c) => <span style={{ fontSize: '12px' }}>{c.start_date} to {c.end_date}</span>
                   },
                   {
                     header: 'Material / Items',
                     render: (c) => {
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

                       return uniqueMaterials.length > 1 ? (
                         <span style={{ 
                           backgroundColor: '#EFF6FF', 
                           color: '#1D4ED8', 
                           border: '1px solid #BFDBFE', 
                           padding: '3px 8px', 
                           borderRadius: '6px', 
                           fontSize: '11px',
                           fontWeight: 700
                         }}>
                           {materialDisplay}
                         </span>
                       ) : (
                         materialDisplay
                       );
                     }
                   },
                   {
                     header: 'Status',
                     render: (c) => <StatusBadge status={c.status} />
                   }
                 ]}
               />
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {(selectedPOsToAssign.length > 0 ? selectedPOsToAssign : (selectedPOToAssign ? [selectedPOToAssign] : [])).map((po) => (
                      <div key={po.id} style={{
                        backgroundColor: 'var(--color-brand-blue-50)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong className="mono" style={{ fontSize: '13.5px', color: 'var(--color-text-heading)' }}>PO #{po.sap_po_no} / {po.po_item_no}</strong>
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
                    ))}
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
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#1E40AF', textTransform: 'uppercase' }}>
                    TOTAL PLANNED PAYLOAD
                  </span>
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
                  <Button 
                    onClick={() => { setSelectedPOToAssign(null); setSelectedPOsToAssign([]); }} 
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDistributeSubmit}
                    disabled={isSubmitting}
                    variant="primary"
                  >
                    <Send size={14} style={{ marginRight: '4px' }} />
                    {isSubmitting ? 'Releasing...' : 'Release PO & Notify'}
                  </Button>
                </div>

              </Card>
            ) : selectedContract ? (
              <Card title="Contract Detail Inspector">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.04em' }}>
                      SAP Outline Agreement Header (#{selectedContract.sap_contract_no})
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', backgroundColor: 'var(--color-bg-page)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Agreement Type</span>
                        <strong style={{ color: '#2563EB' }}>
                          {selectedContract.sap_contract_no === '4600000026' || selectedContract.sap_contract_no === '4600000021' || selectedContract.sap_contract_no === '4600000017' ? 'Value Contract (WK)' : 'Quantity Contract (MK)'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Supplier</span>
                        <strong style={{ color: 'var(--color-text-heading)' }}>
                          {selectedContract.sap_contract_no === '4600000026' || selectedContract.sap_contract_no === '4600000021' ? '1403 — Gajanan Enterprises' : '1402 — ABC Enterprises'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Agreement Date</span>
                        <strong>{selectedContract.start_date || '12.08.2026'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Currency</span>
                        <strong>INR</strong>
                      </div>
                    </div>
                  </div>

                  {/* Contract Items Overview */}
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', margin: '12px 0 8px 0', letterSpacing: '0.04em' }}>
                      Contract Items & Line Items ({purchaseOrders.filter(p => p.contract_id === selectedContract.id).length > 0 ? purchaseOrders.filter(p => p.contract_id === selectedContract.id).length : 1})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {purchaseOrders.filter(p => p.contract_id === selectedContract.id).map((po) => (
                        <div key={po.id} style={{ fontSize: '12px', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                          <span><strong>Item {po.po_item_no}:</strong> {po.material}</span>
                          <span style={{ color: '#2563EB', fontWeight: 700 }}>{po.target_qty} {po.uom}</span>
                        </div>
                      ))}
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
