import React, { useState, useEffect } from 'react';
import { FileClock, CreditCard, Search, ArrowRight, ShieldAlert } from 'lucide-react';
import { invoicesApi, MiroInvoice, DeliveryInvoiceV3, caApi } from '../lib/api_v3';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { Tabs } from '../components/Tabs';
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
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialPercent, setPartialPercent] = useState<number>(25);

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
      await invoicesApi.createMiro({
        freight_invoice_id: dInv.id,
        waybill_no: `WB-${Date.now()}`
      });
      loadData();
      setActiveTab('PARKED');
    } catch (err: any) {
      console.error('Failed to park MIRO:', err);
      const msg = err.message || '';
      if (msg.includes('unique') || msg.includes('constraint') || msg.includes('already exists')) {
        setErrorMsg('SAP DB Alert: A duplicate MIRO document already exists for this Waybill. S/4HANA blocks duplicate entries.');
      } else {
        setErrorMsg(msg || 'Failed to park MIRO');
      }
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
      const msg = err.message || '';
      if (msg.includes('unique') || msg.includes('constraint') || msg.includes('already exists')) {
        setErrorMsg('SAP DB Alert: This MIRO invoice has already been posted to the general ledger.');
      } else {
        setErrorMsg(msg || 'Failed to post MIRO');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearMiro = async () => {
    if (!selectedMiro) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await invoicesApi.clearMiro(selectedMiro.id, paymentRefInput, paymentType, partialPercent);
      const miros = await invoicesApi.listMiro();
      setMiroList(miros);
      const deliveryInvoices = await caApi.getDeliveryInvoices('SENT_TO_CA');
      setUnparkedInvoices(deliveryInvoices);

      const updatedItem = miros.find(m => m.id === selectedMiro.id);
      setShowClearConfirm(false);
      setSelectedMiro(null);
      
      if (updatedItem && updatedItem.status === 'CLEARED') {
        setActiveTab('CLEARED');
      } else {
        setActiveTab('POSTED');
      }
    } catch (err: any) {
      console.error('Failed to clear MIRO:', err);
      const msg = err.message || '';
      if (msg.includes('unique') || msg.includes('constraint') || msg.includes('already exists')) {
        setErrorMsg('SAP DB Alert: This clearing reference or payment transaction is already recorded. S/4HANA blocks duplicate clearing references.');
      } else {
        setErrorMsg(msg || 'Failed to clear MIRO');
      }
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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-heading)', margin: 0 }}>
            Invoice & Payment Desk (SAP MIRO)
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            Verify delivery invoices, park MIROs, post to SAP, and confirm clearings
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
          Refresh Queue
        </button>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-error-bg)', border: '1.5px solid var(--color-error-light)', color: 'var(--color-error-text)', padding: '14px 18px', borderRadius: '12px', fontSize: '13.5px' }}>
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Menu with Unified Reusable Tabs */}
      <Tabs 
        tabs={[
          { id: 'UNPARKED', label: 'Unparked Invoices', count: unparkedInvoices.length },
          { id: 'PARKED', label: 'Parked MIRO', count: parked.length },
          { id: 'POSTED', label: 'Posted Invoices', count: posted.length },
          { id: 'CLEARED', label: 'Cleared Payments', count: cleared.length }
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading invoices data...</div>
      ) : activeList.length === 0 ? (
        <EmptyState 
          icon={<FileClock size={48} />}
          title="No Invoices in This Stage"
          description="Everything is processed and cleared."
        />
      ) : (
        <Card title={`${activeTab.replace(/_/g, ' ')} Pipeline Queue`} subtitle="SAP MIRO accounts verification queue and payment reconciliation log">
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
                      <td className="mono" style={{ fontWeight: 800, color: 'var(--color-text-heading)' }}>#INV-DEL-{inv.id}</td>
                      <td className="mono">{inv.sap_po_no} / {inv.po_item_no}</td>
                      <td style={{ fontWeight: 600 }}>{inv.driver_name || 'STS Carrier'}</td>
                      <td style={{ textAlign: 'right' }}>{(inv.accepted_payload / 1000).toFixed(2)} Tons</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-text-heading)' }}>{formatCurrency(inv.total_value)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-primary btn-sm"
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
                      <td className="mono" style={{ fontWeight: 800, color: 'var(--color-text-heading)' }}>{miro.sap_invoice_no || `Pending (#${miro.id})`}</td>
                      <td className="mono">{miro.sap_po_no} / {miro.po_item_no}</td>
                      <td style={{ fontWeight: 600 }}>{miro.transporter_name || 'Carrier'}</td>
                      <td style={{ textAlign: 'right' }}>{((miro.accepted_payload_kg || 34000) / 1000).toFixed(2)} Tons</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-text-heading)' }}>
                        <div>{formatCurrency(miro.total_value || 0)}</div>
                        {(miro.paid_amount || 0) > 0 && (
                          <div style={{ fontSize: '11px', color: (miro.paid_amount || 0) >= (miro.total_value || 0) ? '#059669' : '#D97706', fontWeight: 700, marginTop: '3px' }}>
                            Paid: {formatCurrency(miro.paid_amount || 0)} ({Math.round(((miro.paid_amount || 0) / (miro.total_value || 1)) * 100)}%)
                          </div>
                        )}
                      </td>
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
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                            onClick={() => {
                              setSelectedMiro(miro);
                              setPaymentRefInput(`PMT-${Date.now()}`);
                              setPaymentType('FULL');
                              setPartialPercent(25);
                              setShowClearConfirm(true);
                            }}
                          >
                            {(miro.paid_amount || 0) > 0 ? 'Pay Remaining' : 'Log Payment Clear'}
                          </button>
                        )}
                         {miro.status === 'CLEARED' && (
                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                             <span className="badge badge-green">CLEARED</span>
                             {miro.paid_amount && (
                               <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px' }}>
                                 Paid: {formatCurrency(miro.paid_amount)}
                               </span>
                             )}
                           </div>
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
           <p style={{ fontSize: '14.5px', color: 'var(--color-text-body)', marginBottom: '24px', lineHeight: 1.5 }}>
             Are you sure you want to execute BAPI invoice post sequence for {selectedMiro?.sap_invoice_no}? This will log an OUT record in the SAP Sync Audit trail.
           </p>
           <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
             <button className="btn btn-secondary" onClick={() => setShowPostConfirm(false)}>Cancel</button>
             <button className="btn btn-primary" onClick={handlePostMiro} disabled={isSubmitting}>Confirm BAPI Post</button>
           </div>
         </div>
       </Modal>
   
       {/* Clear Modal */}
       <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Log Payment Clearing">
         <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
           
           {selectedMiro && (() => {
             const totalVal = selectedMiro.total_value || 0;
             const alreadyPaid = selectedMiro.paid_amount || 0;
             const currentDue = totalVal - alreadyPaid;
             
             let payingNow = currentDue;
             if (paymentType === 'PARTIAL') {
               payingNow = (partialPercent / 100.0) * totalVal;
               if (payingNow > currentDue) payingNow = currentDue;
             }
             const remainingDue = currentDue - payingNow;

             return (
               <div style={{ padding: '14px', backgroundColor: 'var(--color-brand-blue-50)', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Bill Value:</span>
                   <strong style={{ color: 'var(--color-text-heading)' }}>{formatCurrency(totalVal)}</strong>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Already Paid:</span>
                   <strong style={{ color: '#059669' }}>{formatCurrency(alreadyPaid)}</strong>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '8px' }}>
                   <span style={{ color: 'var(--color-text-muted)', fontWeight: 800 }}>Paying Now:</span>
                   <strong style={{ color: 'var(--color-brand-blue-600)', fontSize: '15px' }}>{formatCurrency(payingNow)}</strong>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Remaining Balance:</span>
                   <strong style={{ color: remainingDue > 0 ? '#D97706' : 'var(--color-text-muted)' }}>{formatCurrency(remainingDue)}</strong>
                 </div>
               </div>
             );
           })()}

           <div>
             <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px' }}>Payment Mode</label>
             <div style={{ display: 'flex', gap: '20px' }}>
               <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-heading)', cursor: 'pointer' }}>
                 <input type="radio" name="paymentType" checked={paymentType === 'FULL'} onChange={() => setPaymentType('FULL')} />
                 <span>Full Payment (Clear Remaining)</span>
               </label>
               <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-heading)', cursor: 'pointer' }}>
                 <input type="radio" name="paymentType" checked={paymentType === 'PARTIAL'} onChange={() => setPaymentType('PARTIAL')} />
                 <span>Partial Payment</span>
               </label>
             </div>
           </div>

           {paymentType === 'PARTIAL' && (
             <div>
               <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Select Percentage</label>
               <div style={{ display: 'flex', gap: '10px' }}>
                 {[25, 50, 75].map(pct => (
                   <button
                     key={pct}
                     type="button"
                     onClick={() => setPartialPercent(pct)}
                     className="btn"
                     style={{
                       flex: 1, padding: '10px',
                       backgroundColor: partialPercent === pct ? 'var(--color-brand-blue-600)' : 'var(--color-bg-page)',
                       color: partialPercent === pct ? '#fff' : 'var(--color-text-primary)',
                       border: '1.5px solid var(--color-border)',
                       fontWeight: 700, borderRadius: '8px'
                     }}
                   >
                     {pct}%
                   </button>
                 ))}
               </div>
             </div>
           )}

           <div>
             <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>Payment Reference</label>
             <input 
               type="text" 
               value={paymentRefInput} 
               onChange={e => setPaymentRefInput(e.target.value)}
               style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: '10px', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
             />
           </div>
           
           <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
             <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>Cancel</button>
             <button className="btn btn-primary" onClick={handleClearMiro} disabled={isSubmitting}>Log Clearing</button>
           </div>
         </div>
       </Modal>
  
     </div>
   );
 };
