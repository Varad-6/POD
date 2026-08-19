import React from 'react';
import { useContractPo } from '../../contexts/ContractPoContext';
import { ContractV3, PurchaseOrderV3 } from '../../lib/api_v3';
import { FileText, Package, Filter } from 'lucide-react';

export const ContractPoSelector: React.FC = () => {
  const {
    contracts,
    selectedContractId,
    selectedPoId,
    setSelectedContractId,
    setSelectedPoId,
    filteredPOs,
    loading,
  } = useContractPo();

  if (loading) return null;

  return (
    <div className="contract-po-selector">
      <div className="contract-po-label">
        <Filter size={14} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Context:</span>
      </div>

      {/* Contract Selector */}
      <div className="contract-po-select-wrapper">
        <FileText size={13} color="#0B192F" style={{ flexShrink: 0 }} />
        <select
          value={selectedContractId}
          onChange={(e) => setSelectedContractId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          className="contract-po-select"
        >
          <option value="ALL">All Contracts ({contracts.length})</option>
          {contracts.map((c: ContractV3) => (
            <option key={c.id} value={c.id}>
              {c.sap_contract_no} ({c.customer_name || 'SAP Client'})
            </option>
          ))}
        </select>
      </div>

      <span className="contract-po-arrow">➜</span>

      {/* PO Selector */}
      <div className="contract-po-select-wrapper">
        <Package size={13} color="#FF5B00" style={{ flexShrink: 0 }} />
        <select
          value={selectedPoId}
          onChange={(e) => setSelectedPoId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          className="contract-po-select"
        >
          <option value="ALL">All POs ({filteredPOs.length})</option>
          {filteredPOs.map((po: PurchaseOrderV3) => (
            <option key={po.id} value={po.id}>
              {po.sap_po_no} — {po.material} ({po.target_qty} TON)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
