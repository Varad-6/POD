import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { caApi, ContractV3, PurchaseOrderV3, transportersApi, Transporter } from '../lib/api_v3';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { Modal } from '../components/Modal';
import { Checkbox } from '../components/Checkbox';
import {
  Send, Clock, Calendar, Check, ShieldCheck, MapPin,
  FileText, Package, Truck, Layers, ArrowRight, ArrowLeft, X, CheckSquare, Square, RefreshCw,
  Eye, ExternalLink
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/format';

export const AdminContracts: React.FC = () => {
  const location = useLocation();
  const targetContractId = (location.state as any)?.contractId;

  const [contracts, setContracts] = useState<ContractV3[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractV3 | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderV3[]>([]);
  const [selectedPOsToAssign, setSelectedPOsToAssign] = useState<PurchaseOrderV3[]>([]);

  // PO Detail Inspector state
  const [inspectingPo, setInspectingPo] = useState<PurchaseOrderV3 | null>(null);
  const [poDetailLoading, setPoDetailLoading] = useState(false);
  const [poDetailError, setPoDetailError] = useState<string | null>(null);

  const handleOpenPoDetail = async (po: PurchaseOrderV3) => {
    setPoDetailError(null);
    setInspectingPo(po);
    setPoDetailLoading(true);
    try {
      const fresh = await caApi.getPoDetails(po.id);
      if (fresh) {
        setInspectingPo(fresh);
      }
    } catch (err: any) {
      console.warn('[PO Detail Fetch Warning]', err);
    } finally {
      setPoDetailLoading(false);
    }
  };

  const handleClosePoDetail = () => {
    setInspectingPo(null);
    setPoDetailError(null);
  };

  // Search & Filters
  const [contractSearch, setContractSearch] = useState('');
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');

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
  const [showAssignForm, setShowAssignForm] = useState(false);

  // Fetch contracts on load
  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await caApi.getContracts();
      setContracts(data);

      const target = targetContractId ? data.find(c => c.id === targetContractId) : null;
      if (target) {
        handleContractSelect(target);
      } else if (!isSilent && !selectedContract) {
        setSelectedContract(null);
        setPurchaseOrders([]);
        setSelectedPOsToAssign([]);
      }

      // If a contract is currently selected, re-fetch its live PO list
      if (selectedContractRef.current) {
        const detail = await caApi.getContractDetails(selectedContractRef.current.id);
        setSelectedContract(prev => prev ? { ...prev, ...detail } : detail);
        if (detail.purchase_orders) {
          setPurchaseOrders(detail.purchase_orders);
        }
      }

      const transList = await transportersApi.list();
      setTransporters(transList);
      if (transList.length > 0 && !targetTransporterId) {
        setTargetTransporterId(transList[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load contracts data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const selectedContractRef = React.useRef(selectedContract);
  useEffect(() => {
    selectedContractRef.current = selectedContract;
  }, [selectedContract]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (targetContractId && contracts.length > 0) {
      const target = contracts.find(c => c.id === targetContractId);
      if (target && selectedContract?.id !== target.id) {
        handleContractSelect(target);
      }
    }
  }, [targetContractId, contracts]);

  const handleContractSelect = async (c: ContractV3) => {
    setSelectedPOsToAssign([]);
    setShowAssignForm(false);
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

  const togglePoSelection = (po: PurchaseOrderV3) => {
    if (po.status !== 'OPEN' && !selectedPOsToAssign.some(p => p.id === po.id)) {
      alert(`PO #${po.sap_po_no} / ${po.po_item_no} is currently ${po.status} and cannot be assigned.`);
      return;
    }

    if (selectedPOsToAssign.some(p => p.id === po.id)) {
      setSelectedPOsToAssign(prev => prev.filter(p => p.id !== po.id));
    } else {
      setSelectedPOsToAssign(prev => [...prev, po]);
    }
  };

  const toggleSelectAllPos = () => {
    const openPos = purchaseOrders.filter(p => p.contract_id === selectedContract?.id && p.status === 'OPEN');
    if (selectedPOsToAssign.length === openPos.length && openPos.length > 0) {
      setSelectedPOsToAssign([]);
    } else {
      setSelectedPOsToAssign(openPos);
    }
  };

  const handleDistributeSubmit = async () => {
    if (selectedPOsToAssign.length === 0 || !targetTransporterId) return;
    setIsSubmitting(true);
    try {
      const targetPo = selectedPOsToAssign[0];
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
      setSelectedPOsToAssign([]);
      setShowAssignForm(false);
    } catch (err) {
      console.error('Failed to distribute transport execution:', err);
      alert('Error creating multi-PO transport execution');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper metadata
  const getContractAgreementType = (no: string) => {
    return no === '4600000026' || no === '4600000021' || no === '4600000017'
      ? 'Value Contract (WK)'
      : 'Quantity Contract (MK)';
  };

  const getContractSupplier = (no: string) => {
    return no === '4600000026' || no === '4600000021'
      ? '1403 — Gajanan Enterprises'
      : '1402 — ABC Enterprises';
  };

  const filteredContracts = useMemo(() => {
    if (!contractSearch) return contracts;
    const term = contractSearch.toLowerCase();
    return contracts.filter(c =>
      c.sap_contract_no.toLowerCase().includes(term) ||
      (c.customer_name && c.customer_name.toLowerCase().includes(term)) ||
      (c as any).material?.toLowerCase().includes(term)
    );
  }, [contracts, contractSearch]);

  const contractLinkedPos = useMemo(() => {
    if (!selectedContract) return [];
    return purchaseOrders.filter(po => po.contract_id === selectedContract.id);
  }, [purchaseOrders, selectedContract]);

  const filteredLinkedPos = useMemo(() => {
    return contractLinkedPos.filter(po => {
      const matchesSearch = !poSearch ||
        po.sap_po_no.toLowerCase().includes(poSearch.toLowerCase()) ||
        po.material.toLowerCase().includes(poSearch.toLowerCase());
      const matchesStatus = poStatusFilter === 'ALL' || po.status === poStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contractLinkedPos, poSearch, poStatusFilter]);

  const openPos = useMemo(() => contractLinkedPos.filter(p => p.status === 'OPEN'), [contractLinkedPos]);

  // Derived Line Items from contract POs or contract data
  const contractLineItems = useMemo(() => {
    if (!selectedContract) return [];
    if (contractLinkedPos.length > 0) {
      return contractLinkedPos.map((po, idx) => ({
        itemNo: po.po_item_no || `${(idx + 1) * 10}`,
        material: po.material,
        description: `${po.material} — Bulk Industrial Grade`,
        targetQty: po.target_qty,
        uom: po.uom,
        netPrice: po.rate
      }));
    }
    return [
      {
        itemNo: '10',
        material: (selectedContract as any).material || 'Washed Coal Grade A',
        description: 'Industrial Bulk Energy Feedstock',
        targetQty: (selectedContract as any).target_qty || 25000,
        uom: 'TON',
        netPrice: 1200
      }
    ];
  }, [selectedContract, contractLinkedPos]);

  const totalSelectedPayload = useMemo(() => {
    return selectedPOsToAssign.reduce((sum, p) => sum + (Number(p.target_qty) || 0), 0);
  }, [selectedPOsToAssign]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {!selectedContract ? (
        <>
          {/* 1. Page Header */}
          <PageHeader 
            title="Contracts & PO Release Console"
            subtitle="Manage active SAP S/4HANA Outline Agreements (ME33K / ME33L) and distribute purchase orders to transporters"
            actions={
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => loadData(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Refresh
              </Button>
            }
          />

          {/* 2. Contracts Table Card */}
          <Card 
            title={`Active Outline Agreements (${contracts.length})`}
            subtitle="Synchronized from SAP S/4HANA S21 master data. Click any row to inspect line items and release orders."
            style={{ padding: 0 }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#FFFFFF' }}>
              <div style={{ maxWidth: '360px' }}>
                <input 
                  type="text"
                  placeholder="Search contract number or customer..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '13px', padding: '6px 12px' }}
                />
              </div>
            </div>

            <Table<ContractV3>
              data={filteredContracts}
              onRowClick={(c: ContractV3) => handleContractSelect(c)}
              getRowStyle={(c: ContractV3) => ({
                backgroundColor: (selectedContract as any)?.id === (c as any)?.id ? 'var(--color-brand-blue-50)' : 'transparent',
                cursor: 'pointer'
              })}
              columns={[
                {
                  header: 'Contract Number',
                  render: (c) => (
                    <span 
                      className="mono" 
                      style={{ 
                        fontWeight: 700, 
                        color: 'var(--color-brand-blue-600)',
                        textDecoration: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {c.sap_contract_no}
                    </span>
                  )
                },
                {
                  header: 'Customer / Yard',
                  render: (c) => <span style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>{c.customer_name}</span>
                },
                {
                  header: 'Agreement Type',
                  render: (c) => (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-body)' }}>
                      {getContractAgreementType(c.sap_contract_no)}
                    </span>
                  )
                },
                {
                  header: 'Supplier',
                  render: (c) => (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {getContractSupplier(c.sap_contract_no)}
                    </span>
                  )
                },
                {
                  header: 'Validity Period',
                  render: (c) => <span style={{ fontSize: '12px' }}>{c.start_date} → {c.end_date}</span>
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
                      return (
                        <span className="badge badge-blue">
                          {uniqueMaterials.length} Items
                        </span>
                      );
                    } else if (uniqueMaterials.length === 1) {
                      materialDisplay = uniqueMaterials[0];
                    }

                    return <span>{materialDisplay}</span>;
                  }
                },
                {
                  header: 'Status',
                  render: (c) => <StatusBadge status={c.status} />
                }
              ]}
            />
          </Card>
        </>
      ) : (
        /* 3. Dedicated Contract Detail View (Sections 10 & 11) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header Bar for Selected Contract */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  setSelectedContract(null);
                  setSelectedPOsToAssign([]);
                  setShowAssignForm(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              >
                <ArrowLeft size={15} /> Back to Outline Agreements
              </Button>

              <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--color-border)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-brand-blue-50)',
                  color: 'var(--color-brand-blue-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Outline Agreement Inspector
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-heading)' }}>
                      Contract #{selectedContract.sap_contract_no}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)' }}>·</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-body)' }}>
                      {selectedContract.customer_name}
                    </span>
                    <StatusBadge status={selectedContract.status} />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedContract(null);
                setSelectedPOsToAssign([]);
                setShowAssignForm(false);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}
            >
              <X size={14} /> Close View
            </Button>
          </div>

          {/* Section 1: General Information */}
          <Card title="General Information" subtitle="SAP Outline Agreement Header Attributes">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '14px 16px',
              backgroundColor: '#F8F9FA',
              borderRadius: '6px',
              border: '1px solid var(--color-border)'
            }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Contract Number</span>
                <span className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-heading)' }}>#{selectedContract.sap_contract_no}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Agreement Type</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-blue-700)' }}>{getContractAgreementType(selectedContract.sap_contract_no)}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Supplier</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-heading)' }}>{getContractSupplier(selectedContract.sap_contract_no)}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Agreement Date</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-body)' }}>{selectedContract.start_date || '12.08.2026'}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Validity Range</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-body)' }}>{selectedContract.start_date} → {selectedContract.end_date}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Currency</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-body)' }}>INR (₹)</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Loading Siding (Plant)</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-heading)' }}>MON1 Siding Yard 1001</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Receiving Customer</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-heading)' }}>{selectedContract.customer_name}</span>
              </div>
            </div>
          </Card>

          {/* Section 2: Contract Line Items (TABLE FORMAT) */}
          <Card 
            title={`Contract Line Items (${contractLineItems.length})`}
            subtitle="Material schedule & contracted price breakdown"
            style={{ padding: 0 }}
          >
            <Table
              data={contractLineItems}
              columns={[
                {
                  header: 'Item',
                  render: (item) => <span className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-700)' }}>{item.itemNo}</span>
                },
                {
                  header: 'Material',
                  render: (item) => <strong style={{ color: 'var(--color-text-heading)' }}>{item.material}</strong>
                },
                {
                  header: 'Description',
                  render: (item) => <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.description}</span>
                },
                {
                  header: 'Target Quantity',
                  render: (item) => <span style={{ fontWeight: 700 }}>{item.targetQty} {item.uom}</span>
                },
                {
                  header: 'Unit',
                  render: (item) => <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.uom}</span>
                },
                {
                  header: 'Net Price',
                  render: (item) => <span className="mono" style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{formatCurrency(item.netPrice)} / {item.uom}</span>
                }
              ]}
            />
          </Card>

          {/* Section 3: Linked Purchase Orders (TABLE FORMAT with checkboxes) */}
          <Card 
            title={`Linked Purchase Orders (${contractLinkedPos.length})`}
            subtitle="Select one or multiple open POs to distribute to a transporter"
            style={{ padding: 0 }}
          >
            {/* Filter Sub-bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="text"
                  placeholder="Search PO # or material..."
                  value={poSearch}
                  onChange={(e) => setPoSearch(e.target.value)}
                  className="form-input"
                  style={{ width: '220px', fontSize: '12px', padding: '6px 10px' }}
                />
                <select
                  value={poStatusFilter}
                  onChange={(e) => setPoStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '12px', padding: '6px 10px', width: 'auto' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open Only</option>
                  <option value="ASSIGNED">Assigned Only</option>
                </select>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Showing {filteredLinkedPos.length} of {contractLinkedPos.length} POs
              </div>
            </div>

            {/* POs Table */}
            <Table<PurchaseOrderV3>
              data={filteredLinkedPos}
              columns={[
                {
                  header: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Checkbox
                        checked={openPos.length > 0 && selectedPOsToAssign.length === openPos.length}
                        indeterminate={selectedPOsToAssign.length > 0 && selectedPOsToAssign.length < openPos.length}
                        disabled={openPos.length === 0}
                        onChange={toggleSelectAllPos}
                        ariaLabel="Select all open purchase orders"
                      />
                    </div>
                  ),
                  style: { width: '44px', textAlign: 'center', padding: '11px 8px' },
                  render: (po) => {
                    const isSelected = selectedPOsToAssign.some(p => p.id === po.id);
                    const isSelectable = po.status === 'OPEN';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Checkbox
                          checked={isSelected}
                          disabled={!isSelectable}
                          onChange={() => {
                            if (isSelectable) togglePoSelection(po);
                          }}
                          ariaLabel={`Select PO ${po.sap_po_no} item ${po.po_item_no}`}
                        />
                      </div>
                    );
                  }
                },
                {
                  header: 'PO Number / Item',
                  render: (po) => (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPoDetail(po);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--color-brand-blue-700)',
                        textAlign: 'left'
                      }}
                      title={`Open details for PO #${po.sap_po_no} / Item ${po.po_item_no}`}
                    >
                      <span className="mono" style={{ fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                        {po.sap_po_no} / {po.po_item_no}
                      </span>
                      <ExternalLink size={12} style={{ opacity: 0.7 }} />
                    </button>
                  )
                },
                {
                  header: 'Material',
                  render: (po) => <span style={{ fontWeight: 600 }}>{po.material}</span>
                },
                {
                  header: 'Target Qty',
                  render: (po) => <span style={{ fontWeight: 700, color: 'var(--color-brand-blue-600)' }}>{po.target_qty}</span>
                },
                {
                  header: 'Unit',
                  render: (po) => <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{po.uom}</span>
                },
                {
                  header: 'Rate / Ton',
                  render: (po) => <span className="mono" style={{ fontSize: '13px' }}>{formatCurrency(po.rate)}</span>
                },
                {
                  header: 'Status',
                  render: (po) => (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPoDetail(po);
                      }}
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                      title={`Click to open PO #${po.sap_po_no} details`}
                    >
                      <StatusBadge status={po.status} />
                    </div>
                  )
                },
                {
                  header: 'Action',
                  align: 'right',
                  render: (po) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPoDetail(po);
                      }}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 600
                      }}
                      title={`Open PO #${po.sap_po_no} / Item ${po.po_item_no}`}
                    >
                      <Eye size={13} />
                      <span>Open</span>
                    </Button>
                  )
                }
              ]}
            />

            {/* Multi-Select Action Bar (Section 11.1 Section 3) */}
            {selectedPOsToAssign.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                backgroundColor: 'var(--color-brand-blue-50)',
                borderTop: '1px solid var(--color-border)',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckSquare size={16} color="var(--color-brand-blue-600)" />
                    <strong style={{ fontSize: '13px', color: 'var(--color-brand-blue-700)' }}>
                      {selectedPOsToAssign.length} PO{selectedPOsToAssign.length > 1 ? 's' : ''} Selected
                    </strong>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-heading)', fontWeight: 700 }}>
                    Total Planned Payload: <span style={{ color: 'var(--color-brand-blue-600)' }}>{totalSelectedPayload.toFixed(2)} TON</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      setSelectedPOsToAssign([]);
                      setShowAssignForm(false);
                    }}
                  >
                    Clear Selection
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => setShowAssignForm(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Proceed to Carrier Allocation <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Section 4: Transporter Assignment Form (Section 11.1 Section 4) */}
          {(showAssignForm || selectedPOsToAssign.length > 0) && (
            <Card 
              title="Transporter Assignment & PO Release" 
              subtitle="Allocate selected orders to a registered transporter and define SAP SLA parameters"
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                
                {/* Left Column: Scope & Route */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Selected Orders Payload ({selectedPOsToAssign.length})
                    </span>
                    <div style={{
                      backgroundColor: '#F8F9FA',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Contract Reference:</span>
                        <strong className="mono" style={{ fontSize: '13px' }}>#{selectedContract.sap_contract_no}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Total Payload:</span>
                        <strong style={{ fontSize: '15px', color: 'var(--color-brand-blue-600)' }}>{totalSelectedPayload.toFixed(2)} TON</strong>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {selectedPOsToAssign.map(po => (
                          <span key={po.id} className="badge badge-blue">
                            PO #{po.sap_po_no} ({po.target_qty}T)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Route Siding Coordinates
                    </span>
                    <div style={{
                      backgroundColor: '#F8F9FA',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      padding: '12px 14px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Loading Origin</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-heading)' }}>MON1 Siding Yard</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>Delivery Destination</span>
                        <strong style={{ fontSize: '13px', color: 'var(--color-text-heading)' }}>{selectedContract.customer_name}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Select Transporter
                    </label>
                    <select
                      value={targetTransporterId}
                      onChange={(e) => setTargetTransporterId(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '13px', fontWeight: 600 }}
                    >
                      {transporters.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column: SLA Schedule Parameters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block' }}>
                    SLA Schedule & Delivery Window
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Window Start</label>
                      <input 
                        type="text" 
                        value={availStart} 
                        onChange={e => setAvailStart(e.target.value)} 
                        className="form-input"
                        style={{ fontSize: '12px' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Window End</label>
                      <input 
                        type="text" 
                        value={availEnd} 
                        onChange={e => setAvailEnd(e.target.value)} 
                        className="form-input"
                        style={{ fontSize: '12px' }} 
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Requested Pickup Datetime</label>
                    <input 
                      type="datetime-local" 
                      value={requestedPickup} 
                      onChange={e => setRequestedPickup(e.target.value)} 
                      className="form-input"
                      style={{ fontSize: '12px' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Expected Delivery Datetime</label>
                    <input 
                      type="datetime-local" 
                      value={expectedDelivery} 
                      onChange={e => setExpectedDelivery(e.target.value)} 
                      className="form-input"
                      style={{ fontSize: '12px' }} 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Acceptance Limit (Hours)</label>
                      <input 
                        type="number" 
                        value={acceptanceHours} 
                        onChange={e => setAcceptanceHours(e.target.value)} 
                        className="form-input"
                        style={{ fontSize: '12px' }} 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Timebound Cutoff</label>
                      <input 
                        type="date" 
                        value={timebound} 
                        onChange={e => setTimebound(e.target.value)} 
                        className="form-input"
                        style={{ fontSize: '12px' }} 
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Form Action Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '16px',
                marginTop: '20px'
              }}>
                <Button 
                  variant="secondary"
                  onClick={() => setShowAssignForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleDistributeSubmit}
                  disabled={isSubmitting || selectedPOsToAssign.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  {isSubmitting ? 'Releasing Orders...' : 'Distribute & Notify Carrier'}
                </Button>
              </div>
            </Card>
          )}

        </div>
      )}

      {/* PO Detail Inspector Modal */}
      {inspectingPo && (
        <Modal
          isOpen={!!inspectingPo}
          onClose={handleClosePoDetail}
          title={`Purchase Order #${inspectingPo.sap_po_no} / Item ${inspectingPo.po_item_no}`}
          width="760px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              backgroundColor: 'var(--color-bg-subtle, #F8FAFC)',
              padding: '16px 20px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading)' }}>
                    PO #{inspectingPo.sap_po_no}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Item {inspectingPo.po_item_no}
                  </span>
                  <StatusBadge status={inspectingPo.status} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  SAP S/4HANA Outline Agreement Release Order (Standard Purchase Order NB)
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Total Line Value
                </div>
                <div className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-brand-blue-700)' }}>
                  {formatCurrency((inspectingPo.rate || 0) * (inspectingPo.target_qty || 0))}
                </div>
              </div>
            </div>

            {poDetailLoading && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Synchronizing live details from S21...
              </div>
            )}

            {poDetailError && (
              <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: '6px', color: '#991B1B', fontSize: '13px' }}>
                {poDetailError}
              </div>
            )}

            {/* Section 1: PO Header Information */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-blue-700)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                PO Header & Organization
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>PO TYPE</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>NB — Standard PO</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>OUTLINE CONTRACT</div>
                  <div className="mono" style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px', color: 'var(--color-brand-blue-700)' }}>
                    {selectedContract?.sap_contract_no || (inspectingPo as any).sap_contract_no || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>AGREEMENT TYPE</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                    {selectedContract ? getContractAgreementType(selectedContract.sap_contract_no) : 'Value Contract (WK)'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>SUPPLIER</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                    {selectedContract ? getContractSupplier(selectedContract.sap_contract_no) : '1402 — ABC Enterprises'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>COMPANY CODE</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>1000 — PODZO Mining SA</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>PURCHASING ORG</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>1000 — Mining Logistics</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>PURCHASING GROUP</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>001 — Heavy Materials</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>CURRENCY</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>ZAR (R) / INR (₹)</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>RECEIVING SITE / CUSTOMER</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                    {selectedContract?.customer_name || (inspectingPo as any).customer_name || 'PODZO Mining – Emoyeni Siding'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>VALIDITY WINDOW</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                    {selectedContract?.start_date ? `${formatDate(selectedContract.start_date)} – ${formatDate(selectedContract.end_date)}` : 'Active Outline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Line Item Details */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-blue-700)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Item {inspectingPo.po_item_no} Specification
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>ITEM NUMBER</div>
                  <div className="mono" style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>{inspectingPo.po_item_no}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>MATERIAL DESCRIPTION</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px', color: 'var(--color-text-heading)' }}>{inspectingPo.material}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>TARGET QUANTITY</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px', color: 'var(--color-brand-blue-600)' }}>
                    {inspectingPo.target_qty} {inspectingPo.uom}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>UNIT OF MEASURE</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>{inspectingPo.uom}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>NET RATE</div>
                  <div className="mono" style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                    {formatCurrency(inspectingPo.rate)} / {inspectingPo.uom}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>COST CENTER</div>
                  <div className="mono" style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                    {inspectingPo.cost_center || 'CC-MINING-01'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>TOLERANCE LIMIT</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>±{inspectingPo.tolerance_pct}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>ALLOWED QUEUE TIME</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{inspectingPo.allowed_queue_time_mins || 60} mins</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>DETENTION RATE</div>
                  <div className="mono" style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
                    {formatCurrency(inspectingPo.detention_rate_per_hour || 150)} / hr
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>PLANT / STORAGE LOCATION</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>1001 / SL01 (Bulk Yard)</div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
              {inspectingPo.status === 'OPEN' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!selectedPOsToAssign.some(p => p.id === inspectingPo.id)) {
                      setSelectedPOsToAssign(prev => [...prev, inspectingPo]);
                    }
                    handleClosePoDetail();
                  }}
                >
                  Select for Transport Distribution
                </Button>
              )}
              <Button variant="secondary" onClick={handleClosePoDetail}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
