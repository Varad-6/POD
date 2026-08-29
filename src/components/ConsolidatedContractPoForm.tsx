import React, { useState, useMemo } from 'react';
import { ContractV3, PurchaseOrderV3 } from '../lib/api_v3';
import { StatusBadge } from './StatusBadge';
import { FileText, Package, Search, Filter, CheckCircle2, ArrowRight, CheckSquare, Square, X } from 'lucide-react';
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

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 'var(--radius-card)',
      border: '1px solid var(--color-border)',
      padding: '16px 20px',
      boxShadow: 'var(--shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* ── 1. SAP FIORI CONTRACT OBJECT HEADER ── */}
      <div style={{
        backgroundColor: '#F4F6F9',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--color-border)',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Top Title Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--color-brand-blue-600)" />
              <h3 className="mono" style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-heading)' }}>
                Agreement #{contract.sap_contract_no}
              </h3>
              {contract.sync_mismatch ? (
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '2px 6px', borderRadius: '3px', border: '1px solid #FCA5A5' }}>
                  SYNC MISMATCH
                </span>
              ) : (
                <StatusBadge status={contract.status} />
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              {contract.customer_name || 'SAP Customer Entity'} — {contract.start_date} to {contract.end_date}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Total Contract Line Items</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>
              {contract.items ? contract.items.length : contract.items_count || 0} Items
            </span>
          </div>
        </div>

        {/* Contract Dynamic Items Table */}
        {contract.items && contract.items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Contract Line Items ({contract.items.length})
            </div>
            <div className="table-container" style={{ border: '1px solid var(--color-border)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Material Code</th>
                    <th>Description</th>
                    <th className="col-numeric">Agreed Qty</th>
                    <th className="col-numeric">Net Price</th>
                    <th>Plant</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.items.map((item) => (
                    <tr key={item.id}>
                      <td className="mono" style={{ fontWeight: 600 }}>{item.item_no}</td>
                      <td className="mono">{item.material_no}</td>
                      <td style={{ fontWeight: 500 }}>{item.material_desc}</td>
                      <td className="col-numeric" style={{ fontWeight: 600 }}>{item.target_qty} {item.uom}</td>
                      <td className="col-numeric">{formatCurrency(item.net_price)} / {item.uom}</td>
                      <td>{item.plant || 'PL01'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. MULTI-PO SELECTION SUMMARY PANEL ── */}
      {selectedPOObjects.length > 0 && (
        <div style={{
          backgroundColor: 'var(--color-brand-blue-50)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--color-brand-blue-600)" />
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                SELECTED FOR TRANSPORT ALLOCATION ({selectedPOObjects.length} POs)
              </h4>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>
              Total Planned Payload: {totalPlannedQty.toFixed(2)} TON
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedPOObjects.map((po) => {
              const poItems = po.items && po.items.length > 0 ? po.items : [];
              return (
                <div key={po.id} style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '8px 12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                        PO #{po.sap_po_no}
                      </span>
                      <StatusBadge status={po.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>
                        PO Total: {po.target_qty} {po.uom}
                      </span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => togglePoSelection(po)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PO Line Items Overview */}
                  <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '4px', marginTop: '4px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      PO LINE ITEMS ({poItems.length > 0 ? poItems.length : 1})
                    </div>
                    {poItems.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {poItems.map((item) => (
                          <div key={item.id} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: '3px 6px', borderRadius: '3px', border: '1px solid var(--color-border)' }}>
                            <span><strong>Item {item.item_no}:</strong> {item.material_desc} (Material #{item.material_no})</span>
                            <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{item.ordered_qty} {item.uom} @ {item.net_price} {item.currency || 'INR'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: '3px 6px', borderRadius: '3px' }}>
                        <span><strong>Item 10:</strong> {po.material}</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{po.target_qty} {po.uom}</span>
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
                className="btn btn-primary btn-sm"
                onClick={() => onConfirmTransport(selectedPOObjects)}
              >
                {actionLabel} <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 3. SEARCH & CONTROLS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Package size={16} color="var(--color-brand-blue-600)" />
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
            Available Purchase Orders ({filteredPOs.length} of {contractPOs.length})
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            padding: '4px 8px',
            width: '200px'
          }}>
            <Search size={13} color="var(--color-text-muted)" />
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
                color: 'var(--color-text-primary)',
                width: '100%',
                minHeight: 'auto',
                padding: 0
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            padding: '4px 8px'
          }}>
            <Filter size={13} color="var(--color-text-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                minHeight: 'auto',
                padding: 0
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
          padding: '24px 16px',
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-card)',
          border: '1px dashed var(--color-border)',
          color: 'var(--color-text-muted)',
          fontSize: '12px'
        }}>
          No purchase orders found matching your search criteria under <strong>Contract #{contract.sap_contract_no}</strong>.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-card)',
                  border: isSelected ? '1px solid var(--color-brand-blue-600)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-brand-blue-50)' : '#FFFFFF',
                  cursor: po.status === 'OPEN' || isSelected ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease-in-out',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
                  <div style={{ color: isSelected ? 'var(--color-brand-blue-600)' : 'var(--color-text-muted)' }}>
                    {isSelected ? <CheckSquare size={18} color="var(--color-brand-blue-600)" /> : <Square size={18} color="var(--color-border-strong)" />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-heading)' }}>
                        PO #{po.sap_po_no}
                      </span>
                      <StatusBadge status={po.status} />
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-text-body)', marginTop: '2px' }}>
                      Material: <strong style={{ color: 'var(--color-text-heading)' }}>{po.material}</strong> | Target Qty: <strong style={{ color: 'var(--color-brand-blue-600)' }}>{po.target_qty} {po.uom}</strong>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                      Rate: {formatCurrency(po.rate)}/{po.uom} | Cost Center: {po.cost_center || 'CC-MINING-01'}
                    </div>
                  </div>
                </div>

                {!readOnly && (
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isSelected ? 'var(--color-brand-blue-600)' : 'var(--color-text-muted)',
                      backgroundColor: isSelected ? '#FFFFFF' : '#F1F5F9',
                      border: '1px solid var(--color-border)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-button)'
                    }}>
                      {isSelected ? '✓ Selected' : po.status === 'OPEN' ? '+ Click to Select' : po.status}
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
