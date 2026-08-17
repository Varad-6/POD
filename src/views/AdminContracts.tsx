import React, { useState, useEffect } from 'react';
import { caApi, ContractV3, PurchaseOrderV3, transportersApi, Transporter } from '../lib/api_v3';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { FileSignature, Send, Download } from 'lucide-react';
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
  const [availabilityWindow, setAvailabilityWindow] = useState('06:00-18:00');
  const [timebound, setTimebound] = useState('2026-12-31');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch contracts on load
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await caApi.getContracts();
      setContracts(data);
      // Explicitly keep selectedContract and purchaseOrders empty until user clicks a contract
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
      // reload
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
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Loading Contracts...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
          {/* Left: Contracts & PO queues */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <Card title="Active S/4HANA Quantity Contracts">
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
                            backgroundColor: isSelected ? 'var(--neutral-100)' : 'transparent' 
                          }}
                        >
                          <td className="mono" style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>
                            {c.sap_contract_no}
                          </td>
                          <td style={{ fontWeight: 600 }}>{c.customer_name}</td>
                          <td style={{ fontSize: '12px' }}>
                            {c.start_date} to {c.end_date}
                          </td>
                          <td style={{ color: 'var(--neutral-600)' }}>{(c as any).material || 'Washed Coal Grade A'}</td>
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
            <Card title="Purchase Orders Distribution Queue">
              {!selectedContract ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--neutral-500)' }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', margin: '0 0 6px 0', color: 'var(--neutral-800)' }}>No Contract Selected</p>
                  <p style={{ fontSize: '13px', margin: 0 }}>Click on any Active S/4HANA Contract row above to inspect its linked Purchase Orders.</p>
                </div>
              ) : purchaseOrders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--neutral-500)', fontSize: '13px' }}>
                  No active purchase orders found for Contract #{selectedContract.sap_contract_no}.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {purchaseOrders.map((po) => (
                    <div 
                      key={po.id}
                      style={{
                        border: '1px solid var(--neutral-200)',
                        borderRadius: '10px',
                        padding: '16px 20px',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p className="mono" style={{ fontWeight: 800, color: 'var(--neutral-900)', margin: '0 0 4px 0', fontSize: '15px' }}>
                          PO #{po.sap_po_no}
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--neutral-600)', margin: '2px 0' }}>
                          Product: <strong>{po.material}</strong> | Target: <strong>{po.target_qty} {po.uom}s</strong>
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--neutral-500)', margin: 0 }}>
                          Rate: {formatCurrency(po.rate)} | Cost Center: {po.cost_center || 'N/A'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <StatusBadge status={po.status} />
                        {po.status === 'OPEN' && (
                          <button 
                            onClick={() => setSelectedPOToAssign(po)}
                            className="btn btn-dark btn-sm"
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

          {/* Right Column: Contract Detail Inspector or Distribute PO Box */}
          <div>
            {selectedPOToAssign ? (
              <Card title="Distribute & Tender Freight Target" accentColor="var(--brand-purple)">
                
                {/* 1. Header Summary Badge: Material, Rate & Available Tonnage */}
                <div style={{ backgroundColor: 'var(--brand-purple-light)', border: '1px solid rgba(114, 9, 183, 0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--brand-purple)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SAP RELEASE PO TARGET</span>
                      <h3 className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neutral-900)', margin: '2px 0 0 0' }}>#{selectedPOToAssign.sap_po_no}</h3>
                    </div>
                    <span style={{ backgroundColor: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--brand-purple)', border: '1px solid rgba(114, 9, 183, 0.3)' }}>
                      RATE: {formatCurrency(selectedPOToAssign.rate)} / {selectedPOToAssign.uom}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-800)', margin: '0 0 4px 0' }}>
                    {selectedPOToAssign.material}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--neutral-600)' }}>
                    <span>Target Volume: <strong>{selectedPOToAssign.target_qty} {selectedPOToAssign.uom}s</strong></span>
                    <span>Cost Center: <strong>{selectedPOToAssign.cost_center || 'CC-MINING-01'}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* 2. Section: Route Telemetry */}
                  <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Route Telemetry & Site Geofences
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block' }}>LOADING PLANT (ORIGIN)</span>
                        <strong style={{ color: 'var(--neutral-900)' }}>MON1 Plant / Siding</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block' }}>UNLOADING YARD (DESTINATION)</span>
                        <strong style={{ color: 'var(--neutral-900)' }}>{selectedContract?.customer_name || 'Siding Yard 1001'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 3. Section: Carrier & Quantity Allocation */}
                  <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                      Carrier Allocation & Tonnage Target
                    </span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Transporter Admin Assignee
                        </label>
                        <select
                          value={targetTransporterId}
                          onChange={(e) => setTargetTransporterId(e.target.value)}
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
                          {transporters.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Allocated Release Volume ({selectedPOToAssign.uom})
                        </label>
                        <input 
                          type="number"
                          defaultValue={selectedPOToAssign.target_qty}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Section: SAP SLA Schedule & Timestamps */}
                  <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '10px' }}>
                      SAP SLA Schedule & Gate Operating Windows
                    </span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Plant Operating Window */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Plant Weighbridge Gate Operating Hours
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <input 
                            type="time" 
                            value={availStart}
                            onChange={e => setAvailStart(e.target.value)}
                            style={{ padding: '8px 10px', border: '1px solid var(--neutral-300)', borderRadius: '6px', fontSize: '12px' }}
                          />
                          <input 
                            type="time" 
                            value={availEnd}
                            onChange={e => setAvailEnd(e.target.value)}
                            style={{ padding: '8px 10px', border: '1px solid var(--neutral-300)', borderRadius: '6px', fontSize: '12px' }}
                          />
                        </div>
                      </div>

                      {/* Requested Pickup Date & Time */}
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Exact Requested Loading Pickup Date & Time
                        </label>
                        <input 
                          type="datetime-local" 
                          value={requestedPickup}
                          onChange={e => setRequestedPickup(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--neutral-300)', borderRadius: '6px', fontSize: '12px' }}
                        />
                      </div>

                      {/* Expected Delivery & Final Due SLA Cutoff */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Expected Delivery
                          </label>
                          <input 
                            type="datetime-local" 
                            value={expectedDelivery}
                            onChange={e => setExpectedDelivery(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--neutral-300)', borderRadius: '6px', fontSize: '11px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '10px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                            Final Due Cutoff (SLA)
                          </label>
                          <input 
                            type="datetime-local" 
                            value={finalDue}
                            onChange={e => setFinalDue(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--neutral-300)', borderRadius: '6px', fontSize: '11px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Section: Acceptance Countdown Tender Limit */}
                  <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--neutral-700)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                      Carrier Acceptance Tender Limit
                    </span>
                    <select
                      value={acceptanceHours}
                      onChange={(e) => setAcceptanceHours(e.target.value)}
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
                      <option value="2">2 Hours (Urgent Priority Tender)</option>
                      <option value="4">4 Hours (Standard Shift Window)</option>
                      <option value="12">12 Hours (Half-Day Buffer)</option>
                      <option value="24">24 Hours (Day Ahead Booking)</option>
                    </select>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-500)', margin: '6px 0 0 0' }}>
                      Target Expiry Notice: Carrier response required by {new Date(Date.now() + Number(acceptanceHours) * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} today.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => setSelectedPOToAssign(null)}
                    disabled={isSubmitting}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDistributeSubmit}
                    disabled={isSubmitting || !targetTransporterId}
                    className="btn btn-primary"
                  >
                    Release PO
                  </button>
                </div>
              </Card>
            ) : selectedContract ? (
              <Card title={`Contract: ${selectedContract.sap_contract_no}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px 0' }}>YARD / CUSTOMER SITE</p>
                    <p style={{ fontWeight: 700, color: 'var(--neutral-900)', margin: 0, fontSize: '14px' }}>{selectedContract.customer_name}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px 0' }}>VALIDITY RANGE</p>
                    <p style={{ fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                      {selectedContract.start_date} to {selectedContract.end_date}
                    </p>
                  </div>

                  {selectedContract.pdf_url && (
                    <div>
                      <a 
                        href={selectedContract.pdf_url.startsWith('http') ? selectedContract.pdf_url : `http://localhost:3001${selectedContract.pdf_url}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={14} />
                        View PDF Outline Agreement
                      </a>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '12px', color: 'var(--neutral-900)' }}>
                      LINKED OUTLINE AGREEMENT POS ({purchaseOrders.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {purchaseOrders.map((po: any) => {
                        const isSelectedPO = selectedPOToAssign && (selectedPOToAssign as any).id === po.id;
                        return (
                          <div 
                            key={po.id}
                            onClick={() => {
                              if (po.status === 'OPEN') {
                                setSelectedPOToAssign(po);
                              }
                            }}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: isSelectedPO ? '2px solid var(--brand-purple)' : '1px solid var(--neutral-200)',
                              backgroundColor: isSelectedPO ? 'var(--brand-purple-light)' : 'var(--neutral-50)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: po.status === 'OPEN' ? 'pointer' : 'default',
                              opacity: po.status === 'OPEN' ? 1 : 0.85,
                              transition: 'all 0.15s ease',
                              boxShadow: isSelectedPO ? 'var(--shadow-subtle)' : 'none',
                            }}
                            className={po.status === 'OPEN' ? "card-hover-item" : ""}
                            title={po.status === 'OPEN' ? `Click to distribute PO #${po.sap_po_no}` : `PO #${po.sap_po_no} is already ${po.status} and cannot be redistributed`}
                          >
                            <div>
                              <span className="mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--neutral-900)' }}>
                                PO #{po.sap_po_no}
                              </span>
                              <p style={{ fontSize: '11px', color: 'var(--neutral-500)', margin: '2px 0 0 0' }}>
                                {po.material} • {po.target_qty} {po.uom}
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <StatusBadge status={po.status} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card title="Contract Inspector">
                <p style={{ fontSize: '13px', color: 'var(--neutral-500)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                  Select a contract row from the left table to inspect linked purchase orders and volume usage.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
