import React, { useState, useEffect } from 'react';
import { FileClock, CreditCard, Search, ArrowRight, ShieldAlert } from 'lucide-react';
import { invoicesApi, MiroInvoice, DeliveryInvoiceV3, caApi } from '../lib/api_v3';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/format';

export const AdminInvoices: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PARKED' | 'POSTED' | 'CLEARED' | 'UNPARKED'>('UNPARKED');
  const [miroList, setMiroList] = useState<MiroInvoice[]>([]);
  const [unparkedInvoices, setUnparkedInvoices] = useState<DeliveryInvoiceV3[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [selectedMiro, setSelectedMiro] = useState<MiroInvoice | null>(null);
  const [selectedUnparked, setSelectedUnparked] = useState<DeliveryInvoiceV3 | null>(null);
  const [showPostConfirm, setShowPostConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const miros = await invoicesApi.listMiro();
      setMiroList(miros);
      const deliveryInvoices = await caApi.getDeliveryInvoices('SENT_TO_CA');
      setUnparkedInvoices(deliveryInvoices);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleParkMiro = async (dInv: DeliveryInvoiceV3) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      // Find main invoice link or park MIRO directly
      // In V3, we park MIRO using freight_invoice_id (which maps to delivery_invoice_id)
      await invoicesApi.createMiro({
        freight_invoice_id: dInv.id,
        waybill_no: `WB-${Date.now()}`
      });
      loadData();
      setActiveTab('PARKED');
    } catch (err: any) {
      console.error('Failed to park MIRO:', err);
      setErrorMsg(err.message || 'Failed to park MIRO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostMiro = async () => {
    if (!selectedMiro) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await invoicesApi.postMiro(selectedMiro.id);
      loadData();
      setShowPostConfirm(false);
      setSelectedMiro(null);
      setActiveTab('POSTED');
    } catch (err: any) {
      console.error('Failed to post MIRO:', err);
      setErrorMsg(err.message || 'Failed to post MIRO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearMiro = async () => {
    if (!selectedMiro) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await invoicesApi.clearMiro(selectedMiro.id, paymentRefInput);
      loadData();
      setShowClearConfirm(false);
      setSelectedMiro(null);
      setActiveTab('CLEARED');
    } catch (err: any) {
      console.error('Failed to clear MIRO:', err);
      setErrorMsg(err.message || 'Failed to clear MIRO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parked = miroList.filter(m => m.status === 'PARKED');
  const posted = miroList.filter(m => m.status === 'POSTED');
  const cleared = miroList.filter(m => m.status === 'CLEARED');

  const activeList = 
    activeTab === 'UNPARKED' ? unparkedInvoices :
    activeTab === 'PARKED' ? parked :
    activeTab === 'POSTED' ? posted : cleared;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--neutral-900)', margin: 0 }}>
            Invoice Control Desk (SAP MIRO)
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--neutral-500)', margin: '4px 0 0 0' }}>
            Verify delivery invoices, park MIROs, post to SAP S/4HANA Finance (LIV), and log clearings
          </p>
        </div>
        <button className="btn btn-ghost" onClick={loadData} disabled={loading}>
          Refresh Queue
        </button>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--error-50)', border: '1px solid var(--error-100)', color: 'var(--error-600)', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}>
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Menu with Distinct Status Badges */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveTab('UNPARKED')}
          style={{
            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            backgroundColor: activeTab === 'UNPARKED' ? '#D97706' : 'transparent',
            color: activeTab === 'UNPARKED' ? '#FFFFFF' : 'var(--neutral-600)',
            fontWeight: 700, fontSize: '13px'
          }}
        >
          Unparked Invoices ({unparkedInvoices.length})
        </button>
        <button 
          onClick={() => setActiveTab('PARKED')}
          style={{
            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            backgroundColor: activeTab === 'PARKED' ? '#2563EB' : 'transparent',
            color: activeTab === 'PARKED' ? '#FFFFFF' : 'var(--neutral-600)',
            fontWeight: 700, fontSize: '13px'
          }}
        >
          Parked MIRO ({parked.length})
        </button>
        <button 
          onClick={() => setActiveTab('POSTED')}
          style={{
            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            backgroundColor: activeTab === 'POSTED' ? '#059669' : 'transparent',
            color: activeTab === 'POSTED' ? '#FFFFFF' : 'var(--neutral-600)',
            fontWeight: 700, fontSize: '13px'
          }}
        >
          Posted ({posted.length})
        </button>
        <button 
          onClick={() => setActiveTab('CLEARED')}
          style={{
            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            backgroundColor: activeTab === 'CLEARED' ? 'var(--neutral-900)' : 'transparent',
            color: activeTab === 'CLEARED' ? '#FFFFFF' : 'var(--neutral-600)',
            fontWeight: 700, fontSize: '13px'
          }}
        >
          Cleared ({cleared.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Loading invoices data...</div>
      ) : activeList.length === 0 ? (
        <EmptyState 
          icon={<FileClock size={48} />}
          title="No Invoices in This Stage"
          description="Everything is processed and cleared."
        />
      ) : (
        <Card title={`${activeTab} Pipeline Queue`}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>PO Reference</th>
                  <th>Transporter / Driver</th>
                  <th style={{ textAlign: 'right' }}>Payload / Weight</th>
                  <th style={{ textAlign: 'right' }}>Total Value</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'UNPARKED' ? (
                  (activeList as DeliveryInvoiceV3[]).map(inv => (
                    <tr key={inv.id}>
                      <td className="mono" style={{ fontWeight: 700 }}>#INV-DEL-{inv.id}</td>
                      <td className="mono">{inv.sap_po_no}</td>
                      <td>{inv.driver_name || 'STS Carrier'}</td>
                      <td style={{ textAlign: 'right' }}>{(inv.accepted_payload / 1000).toFixed(2)} Tons</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(inv.total_value)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-dark btn-sm"
                          onClick={() => handleParkMiro(inv)}
                          disabled={isSubmitting}
                        >
                          Park MIRO in SAP
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  (activeList as MiroInvoice[]).map(miro => (
                    <tr key={miro.id}>
                      <td className="mono" style={{ fontWeight: 700 }}>{miro.sap_invoice_no || `Pending (#${miro.id})`}</td>
                      <td className="mono">{miro.sap_po_no}</td>
                      <td>{miro.transporter_name || 'Carrier'}</td>
                      <td style={{ textAlign: 'right' }}>{((miro.accepted_payload_kg || 34000) / 1000).toFixed(2)} Tons</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(miro.total_value || 0)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {miro.status === 'PARKED' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedMiro(miro);
                              setShowPostConfirm(true);
                            }}
                          >
                            Post to SAP
                          </button>
                        )}
                        {miro.status === 'POSTED' && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setSelectedMiro(miro);
                              setPaymentRefInput(`PMT-${Date.now()}`);
                              setShowClearConfirm(true);
                            }}
                          >
                            Log Payment Clear
                          </button>
                        )}
                        {miro.status === 'CLEARED' && (
                          <span style={{ fontSize: '12px', color: 'var(--success-600)', fontWeight: 700 }}>CLEARED</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Post Modal */}
      <Modal isOpen={showPostConfirm} onClose={() => setShowPostConfirm(false)} title="Confirm SAP LIV Posting">
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--neutral-600)', marginBottom: '20px' }}>
            Are you sure you want to execute BAPI invoice post sequence for {selectedMiro?.sap_invoice_no}? This will log an OUT record in the SAP Sync Audit trail.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowPostConfirm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePostMiro} disabled={isSubmitting}>Confirm BAPI Post</button>
          </div>
        </div>
      </Modal>

      {/* Clear Modal */}
      <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Log Payment Clearing">
        <div style={{ padding: '8px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--neutral-600)', marginBottom: '6px' }}>Payment Reference</label>
            <input 
              type="text" 
              value={paymentRefInput} 
              onChange={e => setPaymentRefInput(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--neutral-300)', borderRadius: '8px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowClearConfirm(false)}>Cancel</button>
            <button className="btn btn-success" onClick={handleClearMiro} disabled={isSubmitting}>Log Clearing</button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
