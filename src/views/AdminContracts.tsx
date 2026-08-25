import React, { useState, useEffect } from 'react';
import { caApi, ContractV3, PurchaseOrderV3, transportersApi, Transporter } from '../lib/api_v3';
import { Card } from '../components/Card';
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

  const handleContractSelect = async (c: ContractV3) => {
    setSelectedPOToAssign(null);
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
    if (!selectedPOToAssign || !targetTransporterId) return;
    setIsSubmitting(true);
    try {
      await caApi.distributePo(selectedPOToAssign.id, {
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
    } catch (err) {
      console.error('Failed to distribute PO:', err);
      alert('Error distributing PO');
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
            
            <Card title="Active S/4HANA Quantity Contracts" subtitle="Outline agreement lists directly mapped from SAP master database schema">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Contract Ref</th>
                      <th>Yard/Customer</th>
                      <th>Validity Period</th>
                      <th>Material</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => {
                      const isSelected = selectedContract?.id === c.id;
                      
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
                          <td style={{ color: 'var(--color-text-body)' }}>{(c as any).material || 'Washed Coal Grade A'}</td>
                          <td>
                            <StatusBadge status={c.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* PO Distribution Desk */}
            <Card title="Purchase Orders Distribution Queue" subtitle="Inspect purchase order references linked to selected outline contracts">
              {!selectedContract ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--color-text-muted)' }}>
                  <p style={{ fontWeight: 750, fontSize: '14px', margin: '0 0 6px 0', color: 'var(--color-text-heading)' }}>No Contract Selected</p>
                  <p style={{ fontSize: '13px', margin: 0 }}>Click on any Active S/4HANA Contract row above to inspect its linked Purchase Orders.</p>
                </div>
              ) : purchaseOrders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  No active purchase orders found for Contract #{selectedContract.sap_contract_no}.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {purchaseOrders.map((po) => (
                    <div 
                      key={po.id}
                      style={{
                        border: '1.5px solid var(--color-border)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        backgroundColor: 'var(--color-bg-card)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: 'var(--shadow-card)',
                        transition: 'all var(--transition-normal)'
                      }}
                    >
                      <div>
                        <p className="mono" style={{ fontWeight: 800, color: 'var(--color-text-heading)', margin: '0 0 4px 0', fontSize: '15px' }}>
                          PO #{po.sap_po_no}
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-body)', margin: '2px 0' }}>
                          Product: <strong>{po.material}</strong> | Target: <strong>{po.target_qty} {po.uom}s</strong>
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                          Rate: {formatCurrency(po.rate)} | Cost Center: {po.cost_center || 'N/A'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <StatusBadge status={po.status} />
                        {po.status === 'OPEN' && (
                          <button 
                            onClick={() => setSelectedPOToAssign(po)}
                            className="btn btn-primary btn-sm"
                          >
                            <Send size={12} />
                            Distribute PO
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: PO Distribution Form */}
          <div>
            {selectedPOToAssign ? (
              <Card title="Assign Job & Send to Transporter" accentColor="var(--color-brand-blue-600)">
                
                {/* 1. Header Summary Badge */}
                <div style={{ backgroundColor: 'var(--color-brand-blue-50)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-brand-blue-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Purchase Order</span>
                      <h3 className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading)', margin: '2px 0 0 0' }}>#{selectedPOToAssign.sap_po_no}</h3>
                    </div>
                    <span style={{ backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-blue-600)', border: '1px solid var(--color-border)' }}>
                      RATE: {formatCurrency(selectedPOToAssign.rate)} / {selectedPOToAssign.uom}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-body)', margin: '0 0 4px 0' }}>
                    {selectedPOToAssign.material}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <span>Target Volume: <strong>{selectedPOToAssign.target_qty} {selectedPOToAssign.uom}s</strong></span>
                    <span>Cost Center: <strong>{selectedPOToAssign.cost_center || 'CC-MINING-01'}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* 2. Route Telemetry */}
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

                  {/* 3. Carrier Allocation */}
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

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Cargo Quantity ({selectedPOToAssign.uom})
                        </label>
                        <input 
                          type="number"
                          defaultValue={selectedPOToAssign.target_qty}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 700 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. SAP SLA Schedule */}
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
                    onClick={() => setSelectedPOToAssign(null)} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDistributeSubmit}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? 'Distributing...' : 'Release PO & Notify'}
                  </button>
                </div>
              </Card>
            ) : selectedContract ? (
              <Card title="Contract Detail Inspector">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.04em' }}>SAP Outline Agreement Info</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', backgroundColor: 'var(--color-bg-page)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Contract Type</span>
                        <strong>Quantity Contract (MK)</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Target Quantity</span>
                        <strong>170 Tons (Combined)</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Purchasing Org</span>
                        <strong>SAP Org 3000</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Agreement Date</span>
                        <strong>{selectedContract.start_date}</strong>
                      </div>
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
