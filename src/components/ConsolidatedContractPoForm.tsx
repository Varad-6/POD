import React, { useState, useMemo } from 'react';
import { ContractV3, PurchaseOrderV3 } from '../lib/api_v3';
import { StatusBadge } from './StatusBadge';
import { FileText, Package, Search, Filter, CheckCircle2, ArrowRight, Layers, CheckSquare, Square, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface ConsolidatedContractPoFormProps {
  contract: ContractV3;
  purchaseOrders: PurchaseOrderV3[];
  selectedPoIds?: number[];
  onSelectPosChange?: (selectedPOs: PurchaseOrderV3[]) => void;
  onConfirmTransport?: (selectedPOs: PurchaseOrderV3[]) => void;
  actionLabel?: string;
  readOnly?: boolean;
}

export const ConsolidatedContractPoForm: React.FC<ConsolidatedContractPoFormProps> = ({
  contract,
  purchaseOrders,
  selectedPoIds = [],
  onSelectPosChange,
  onConfirmTransport,
  actionLabel = 'Create Transport Execution',
  readOnly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedPoIds);

  // Filter POs belonging strictly to this contract
  const contractPOs = useMemo(() => {
    return purchaseOrders.filter(po => po.contract_id === contract.id);
  }, [purchaseOrders, contract.id]);

  // Apply search & status filter within this contract
  const filteredPOs = useMemo(() => {
    return contractPOs.filter(po => {
      const matchesSearch =
        !searchTerm ||
        po.sap_po_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.cost_center && po.cost_center.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contractPOs, searchTerm, statusFilter]);

  const selectedPOObjects = useMemo(() => {
    return contractPOs.filter(po => selectedIds.includes(po.id));
  }, [contractPOs, selectedIds]);

  const totalPlannedQty = useMemo(() => {
    return selectedPOObjects.reduce((sum, po) => sum + (Number(po.target_qty) || 0), 0);
  }, [selectedPOObjects]);

  const togglePoSelection = (po: PurchaseOrderV3) => {
    if (readOnly) return;
    if (po.status !== 'OPEN' && !selectedIds.includes(po.id)) {
      alert(`PO #${po.sap_po_no} is currently ${po.status} and cannot be assigned.`);
      return;
    }

    let updated: number[];
    if (selectedIds.includes(po.id)) {
      updated = selectedIds.filter(id => id !== po.id);
    } else {
      updated = [...selectedIds, po.id];
    }
    setSelectedIds(updated);
    if (onSelectPosChange) {
      onSelectPosChange(contractPOs.filter(p => updated.includes(p.id)));
    }
  };

  const handleRemovePo = (poId: number) => {
    const updated = selectedIds.filter(id => id !== poId);
    setSelectedIds(updated);
    if (onSelectPosChange) {
      onSelectPosChange(contractPOs.filter(p => updated.includes(p.id)));
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1.5px solid #E2E8F0',
      padding: '24px',
      boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* ── 1. CONTRACT HEADER ── */}
      <div style={{
        backgroundColor: '#F8FAFC',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#DBEAFE',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SAP Outline Agreement / Contract
              </div>
              <h3 className="mono" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                Contract #{contract.sap_contract_no}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: '1px solid #CBD5E1',
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {contract.source_indicator || 'Source: S21 SAP | Connection: Live Read-Only'}
            </span>

            {contract.sync_mismatch ? (
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                ⚠️ SYNC MISMATCH (Expected: {contract.expected_items_count}, Available: {contract.items_count})
              </span>
            ) : (
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                backgroundColor: '#ECFDF5',
                color: '#059669',
                border: '1px solid #A7F3D0',
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                ✓ SAP ITEM COUNT VERIFIED ({contract.items_count || (contract.items ? contract.items.length : 0)} Items)
              </span>
            )}

            <StatusBadge status={contract.status} />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #E2E8F0',
          fontSize: '13px'
        }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Customer / Yard</span>
            <strong style={{ color: '#0F172A' }}>{contract.customer_name || 'SAP Client Entity'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Agreement Type & Supplier</span>
            <span style={{ color: '#334155', fontWeight: 600 }}>
              {contract.contract_type || 'WK'} — {contract.supplier_name || '1403 - Gajanan Enterprises'} ({contract.supplier_no || '1403'})
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>Validity Period</span>
            <span style={{ color: '#334155', fontWeight: 600 }}>{contract.start_date} → {contract.end_date}</span>
          </div>
        </div>

        {/* ── CONTRACT ITEMS ONE-TO-MANY LIST ── */}
        {contract.items && contract.items.length > 0 && (
          <div style={{ marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Contract Items ({contract.items.length})
              </span>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                Purchasing Org: {contract.purchasing_org || '1000'} | Plant: {contract.plant || 'MON1 Plant'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
              {contract.items.map((item) => (
                <div key={item.id} style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>
                      Item {item.item_no}: {item.material_desc}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Material #{item.material_no} | {item.material_group || 'GENERAL'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#2563EB' }}>
                      {item.target_qty} {item.uom}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                      {formatCurrency(item.net_price)} / {item.uom}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 2. MULTI-PO SELECTION SUMMARY PANEL ── */}
      {selectedPOObjects.length > 0 && (
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#2563EB" />
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1E40AF' }}>
                SELECTED FOR TRANSPORT EXECUTION ({selectedPOObjects.length} POs)
              </h4>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1D4ED8' }}>
              Total Planned Payload: {totalPlannedQty.toFixed(2)} TON
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedPOObjects.map((po) => {
              const poItems = po.items && po.items.length > 0 ? po.items : [];
              return (
                <div key={po.id} style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #93C5FD',
                  borderRadius: '8px',
                  padding: '10px 14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontSize: '13.5px', fontWeight: 800, color: '#1E3A8A' }}>
                        PO #{po.sap_po_no}
                      </span>
                      <StatusBadge status={po.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB' }}>
                        PO Total: {po.target_qty} {po.uom}
                      </span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => togglePoSelection(po)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PO Line Items Overview */}
                  <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '6px', marginTop: '4px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                      PO LINE ITEMS ({poItems.length > 0 ? poItems.length : 1})
                    </div>
                    {poItems.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {poItems.map((item) => (
                          <div key={item.id} style={{ fontSize: '11.5px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: '4px 8px', borderRadius: '4px', border: '1px solid #F1F5F9' }}>
                            <span><strong>Item {item.item_no}:</strong> {item.material_desc} (Material #{item.material_no})</span>
                            <span style={{ fontWeight: 700, color: '#059669' }}>{item.ordered_qty} {item.uom} @ {item.net_price} {item.currency || 'INR'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11.5px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: '4px 8px', borderRadius: '4px' }}>
                        <span><strong>Item 10:</strong> {po.material}</span>
                        <span style={{ fontWeight: 700, color: '#059669' }}>{po.target_qty} {po.uom}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {onConfirmTransport && !readOnly && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => onConfirmTransport(selectedPOObjects)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                }}
              >
                {actionLabel} <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 3. SEARCH & CONTROLS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={18} color="#2563EB" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
            Available Purchase Orders ({filteredPOs.length} of {contractPOs.length})
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '6px 12px',
            width: '220px'
          }}>
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search PO # or Material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: '#0F172A',
                width: '100%'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '6px 10px'
          }}>
            <Filter size={14} color="#94A3B8" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0F172A',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Available)</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. PURCHASE ORDERS LISTING WITH MULTI-SELECT ── */}
      {filteredPOs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '32px 16px',
          backgroundColor: '#F8FAFC',
          borderRadius: '12px',
          border: '1px dashed #CBD5E1',
          color: '#64748B',
          fontSize: '13px'
        }}>
          No purchase orders found matching your search criteria under <strong>Contract #{contract.sap_contract_no}</strong>.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredPOs.map((po) => {
            const isSelected = selectedIds.includes(po.id);

            return (
              <div
                key={po.id}
                onClick={() => togglePoSelection(po)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  cursor: po.status === 'OPEN' || isSelected ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease-in-out',
                  boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
                  <div style={{ color: isSelected ? '#2563EB' : '#94A3B8' }}>
                    {isSelected ? <CheckSquare size={22} color="#2563EB" /> : <Square size={22} color="#CBD5E1" />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                        PO #{po.sap_po_no}
                      </span>
                      <StatusBadge status={po.status} />
                    </div>

                    <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                      Product: <strong style={{ color: '#0F172A' }}>{po.material}</strong> | Target: <strong style={{ color: '#2563EB' }}>{po.target_qty} {po.uom}</strong>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      Rate: {formatCurrency(po.rate)}/{po.uom} | Cost Center: {po.cost_center || 'CC-MINING-01'}
                    </div>
                  </div>
                </div>

                {!readOnly && (
                  <div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: isSelected ? '#2563EB' : '#64748B',
                      backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                      padding: '6px 12px',
                      borderRadius: '6px'
                    }}>
                      {isSelected ? '✓ Selected for Transport' : po.status === 'OPEN' ? '+ Click to Select' : po.status}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
