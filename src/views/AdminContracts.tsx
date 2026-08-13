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
  
  // Job Config Form inputs
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [targetTransporterId, setTargetTransporterId] = useState('');
  const [availabilityWindow, setAvailabilityWindow] = useState('08:00-17:00');
  const [timebound, setTimebound] = useState('2026-12-31');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch contracts on load
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await caApi.getContracts();
      setContracts(data);
      if (data.length > 0) {
        // Fetch details of first contract by default
        const detail = await caApi.getContractDetails(data[0].id);
        setSelectedContract(detail);
        if (detail.purchase_orders) {
          setPurchaseOrders(detail.purchase_orders);
        }
      }
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
        availability_window: availabilityWindow,
        timebound
      });
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
                          <td style={{ color: 'var(--neutral-600)' }}>{c.material || 'Coal SL'}</td>
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
              {purchaseOrders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--neutral-500)', fontSize: '13px' }}>
                  No active purchase orders found for the selected contract.
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
              <Card title="Distribute & Configure Job Target" accentColor="var(--accent-blue)">
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Release PO Target</p>
                  <p className="mono" style={{ fontWeight: 800, fontSize: '18px', color: 'var(--neutral-900)', margin: 0 }}>#{selectedPOToAssign.sap_po_no}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
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
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Availability Window
                    </label>
                    <input 
                      type="text" 
                      value={availabilityWindow}
                      onChange={e => setAvailabilityWindow(e.target.value)}
                      placeholder="e.g. 08:00-17:00"
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
                      Timebound Lock
                    </label>
                    <input 
                      type="date" 
                      value={timebound}
                      onChange={e => setTimebound(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--neutral-300)',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    />
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
                        href={`http://localhost:3001${selectedContract.pdf_url}`}
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
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>LINKED OUTLINE AGREEMENT POS</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {purchaseOrders.map((po) => (
                        <div 
                          key={po.id}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--neutral-200)',
                            backgroundColor: 'var(--neutral-50)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span className="mono" style={{ fontSize: '13px', fontWeight: 700 }}>PO #{po.sap_po_no}</span>
                          <StatusBadge status={po.status} />
                        </div>
                      ))}
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
