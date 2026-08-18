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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#F8FAFC',
        padding: '4px 10px',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        fontSize: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-orange)', fontWeight: 700 }}>
        <Filter size={14} />
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Context:</span>
      </div>

      {/* Contract Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
        <FileText size={13} color="#0B192F" />
        <select
          value={selectedContractId}
          onChange={(e) => setSelectedContractId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '12px',
            fontWeight: 700,
            color: '#0A192F',
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Contracts ({contracts.length})</option>
          {contracts.map((c: ContractV3) => (
            <option key={c.id} value={c.id}>
              {c.sap_contract_no} ({c.customer_name || 'SAP Client'})
            </option>
          ))}
        </select>
      </div>

      <span style={{ color: '#94A3B8', fontWeight: 600 }}>➜</span>

      {/* PO Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
        <Package size={13} color="#FF5B00" />
        <select
          value={selectedPoId}
          onChange={(e) => setSelectedPoId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '12px',
            fontWeight: 700,
            color: '#0A192F',
            cursor: 'pointer',
          }}
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
