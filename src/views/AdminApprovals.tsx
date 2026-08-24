import React, { useState, useEffect } from 'react';
import { ClipboardCheck, AlertTriangle, CheckCircle2, ShieldCheck, Scale, RefreshCw } from 'lucide-react';
import { caApi, ReviewQueueItemV3 } from '../lib/api_v3';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

export const AdminApprovals: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewQueueItemV3[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewQueueItemV3 | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [overrideReason, setOverrideReason] = useState('MOISTURE_EVAPORATION');
  const [activeTab, setActiveTab] = useState<'OPEN' | 'RESOLVED'>('OPEN');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await caApi.getReviewQueue(activeTab);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();

    const handleDataRefreshed = () => {
      loadReviews();
    };
    window.addEventListener('pod_data_refreshed', handleDataRefreshed);
    return () => {
      window.removeEventListener('pod_data_refreshed', handleDataRefreshed);
    };
  }, [activeTab]);

  const handleApprove = async () => {
    if (!selectedReview) return;
    setIsSubmitting(true);
    try {
      const finalNotes = `APPROVED: Reason: ${overrideReason}${resolutionNotes ? `. Details: ${resolutionNotes}` : ''}`;
      await caApi.resolveReview(selectedReview.id, finalNotes, 'APPROVE');
      setSelectedReview(null);
      setResolutionNotes('');
      await loadReviews();
      window.dispatchEvent(new Event('pod_data_refreshed'));
    } catch (err: any) {
      console.error('Failed to approve review:', err);
      alert('Error approving review item: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReview) return;
    if (!resolutionNotes.trim()) {
      alert('Please provide verification audit notes explaining the rejection before clicking Reject POD.');
      return;
    }
    setIsSubmitting(true);
    try {
      const finalNotes = `REJECTED: Reason: ${overrideReason}. Details: ${resolutionNotes.trim()}`;
      await caApi.resolveReview(selectedReview.id, finalNotes, 'REJECT');
      setSelectedReview(null);
      setResolutionNotes('');
      await loadReviews();
    } catch (err: any) {
      console.error('Failed to reject review:', err);
      alert('Error rejecting review item: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReviewWeights = (r: ReviewQueueItemV3 | null) => {
    if (!r) return { dispatchedTons: 0, receivedTons: 0, varianceKg: 0, variancePct: 0 };
    const mineGross = (r as any).mine_gross_kg || 0;
    const mineTare = (r as any).mine_tare_kg || 0;
    const destGross = (r as any).dest_gross_kg || 0;
    const destTare = (r as any).dest_tare_kg || 0;
    const poTarget = (r as any).po_target_qty || 34.0;

    const dispatchedNetKg = (mineGross > 0 && mineTare > 0) ? (mineGross - mineTare) : (poTarget * 1000);
    const dispatchedTons = dispatchedNetKg / 1000;

    const receivedNetKg = (destGross > 0 && destTare > 0) ? (destGross - destTare) : (poTarget * 1000);
    const receivedTons = receivedNetKg / 1000;

    const varianceKg = receivedNetKg - dispatchedNetKg;
    const variancePct = dispatchedNetKg > 0 ? (varianceKg / dispatchedNetKg) * 100 : 0;

    return { dispatchedTons, receivedTons, varianceKg, variancePct };
  };

  const { dispatchedTons, receivedTons, varianceKg, variancePct } = getReviewWeights(selectedReview);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader 
          title="Receipt & Weight Check Queue"
          subtitle="Check and approve flagged delivery papers, OCR mismatches, or weight differences before making payment"
        />
        <button
          onClick={async () => {
            try {
              const res = await caApi.clearReviewQueue();
              await loadReviews();
              window.dispatchEvent(new Event('pod_data_refreshed'));
              alert(`Review queue cleared successfully! (${res.cleared} items removed)`);
            } catch (e: any) {
              alert('Failed to clear review queue: ' + (e.message || 'Error occurred'));
            }
          }}
          style={{
            padding: '8px 14px',
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          CLEAR QUEUE
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('OPEN')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: activeTab === 'OPEN' ? 'var(--neutral-900)' : 'transparent',
            color: activeTab === 'OPEN' ? '#FFFFFF' : 'var(--neutral-600)',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Open Review Queue</span>
          {activeTab === 'OPEN' && (
            <span style={{ backgroundColor: 'var(--error-600)', color: '#FFFFFF', padding: '2px 6px', borderRadius: '12px', fontSize: '10px' }}>
              {reviews.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('RESOLVED')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: activeTab === 'RESOLVED' ? 'var(--neutral-900)' : 'transparent',
            color: activeTab === 'RESOLVED' ? '#FFFFFF' : 'var(--neutral-600)',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Resolved Archive
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Loading queue...</div>
      ) : reviews.length === 0 ? (
        <EmptyState 
          icon={<ClipboardCheck size={48} />}
          title="Review Queue is Clear"
          description={`No dispatch records are currently flagged as ${activeTab.toLowerCase()}. All pipelines operating smoothly.`}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
          
          {/* Left Table List */}
          <Card title={`Flagged Items (${reviews.length})`}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Ref</th>
                    <th>Transporter / Vehicle</th>
                    <th>Flag Reason</th>
                    <th>Blocker</th>
                    <th>Date Flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => {
                    const isSelected = selectedReview?.id === r.id;
                    return (
                      <tr 
                        key={r.id}
                        onClick={() => setSelectedReview(r)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--neutral-100)' : 'transparent'
                        }}
                      >
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>
                          {r.sap_po_no || `#PO-${r.assignment_id}`}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.transporter_name || 'ABC Transport'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>{r.vehicle_reg || 'KV44RCGP'}</div>
                        </td>
                        <td>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            color: r.flag_reason === 'TOLERANCE_EXCEEDED' ? 'var(--error-600)' : '#f59e0b',
                            backgroundColor: r.flag_reason === 'TOLERANCE_EXCEEDED' ? 'var(--error-50)' : 'rgba(245, 158, 11, 0.1)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {r.flag_reason.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: r.blocks_miro_bool ? 'var(--error-600)' : 'var(--neutral-500)' }}>
                          {r.blocks_miro_bool ? 'Blocks MIRO' : 'No Block'}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {r.created_at}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right Action panel */}
          <div>
            {selectedReview ? (
              <Card title="POD VERIFICATION" accentColor="var(--error-600)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', fontSize: '13px', backgroundColor: 'var(--neutral-50)', padding: '16px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>PO Number</span>
                      <strong className="mono" style={{ color: 'var(--neutral-900)' }}>{selectedReview.sap_po_no}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Contract</span>
                      <strong className="mono" style={{ color: 'var(--neutral-900)' }}>C-2026-001</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Transporter</span>
                      <strong style={{ color: 'var(--neutral-900)' }}>{selectedReview.transporter_name || 'ABC Transport'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Transporter Admin</span>
                      <strong style={{ color: 'var(--neutral-900)' }}>Sipho</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Vehicle</span>
                      <strong className="mono" style={{ color: 'var(--neutral-900)' }}>{selectedReview.vehicle_reg || 'KV44RCGP'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Delivery Location</span>
                      <strong style={{ color: 'var(--neutral-900)' }}>Duvha Power Station</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Dispatched Tonnage</span>
                      <strong style={{ color: 'var(--neutral-900)' }}>{dispatchedTons.toFixed(2)} Tons</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Received Tonnage</span>
                      <strong style={{ color: 'var(--neutral-900)' }}>{receivedTons.toFixed(2)} Tons</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Net Variance</span>
                      <strong style={{ 
                        color: varianceKg === 0 ? 'var(--neutral-900)' : varianceKg < 0 ? 'var(--error-600)' : '#059669', 
                        fontSize: '14px' 
                      }}>
                        {varianceKg > 0 ? '+' : ''}{varianceKg.toLocaleString()} KG ({variancePct > 0 ? '+' : ''}{variancePct.toFixed(2)}%)
                      </strong>
                    </div>
                  </div>

                  {/* Document & OCR Split Preview Card */}
                  <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '8px', padding: '14px', backgroundColor: '#FFFFFF' }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-700)', margin: '0 0 10px 0', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📄 STAMPED DELIVERY RECEIPT (POD)</span>
                      <a href="/uploads/sample_pod.pdf" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-600)', textTransform: 'none', textDecoration: 'underline' }}>[View Document]</a>
                    </h5>
                    <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--neutral-200)', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center', color: 'var(--neutral-600)', fontSize: '12px' }}>
                        <span style={{ fontWeight: 700, display: 'block' }}>📷 Stamped POD Slip Attached</span>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>/uploads/pods/receipt_stamped.png</span>
                      </div>
                    </div>
                  </div>

                  {/* OCR Verification Results */}
                  <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '8px', padding: '14px', backgroundColor: '#FFFFFF' }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-700)', margin: '0 0 10px 0', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🔍 AI OCR EXTRACTION RESULTS</span>
                      <span style={{ color: 'var(--success-600)' }}>[View OCR Results]</span>
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--neutral-500)', display: 'block' }}>Extracted Waybill:</span>
                        <strong>{(selectedReview as any).ocr_waybill_extracted || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--neutral-500)', display: 'block' }}>Confidence:</span>
                        <strong style={{ 
                          color: ((selectedReview as any).ocr_confidence_pct || 0) < 50 ? 'var(--error-600)' : 'var(--success-600)' 
                        }}>
                          {(selectedReview as any).ocr_confidence_pct ? `${(selectedReview as any).ocr_confidence_pct}%` : '—'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--neutral-500)', display: 'block' }}>Extracted Weight:</span>
                        <strong>{(selectedReview as any).ocr_weight_extracted ? `${(selectedReview as any).ocr_weight_extracted} Tons` : '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--neutral-500)', display: 'block' }}>Match Status:</span>
                        <strong style={{ 
                          color: (selectedReview as any).ocr_match_status === 'MATCH' 
                            ? 'var(--success-600)' 
                            : (selectedReview as any).ocr_match_status === 'LOW_CONFIDENCE' 
                              ? '#D97706' 
                              : 'var(--error-600)' 
                        }}>
                          {(selectedReview as any).ocr_match_status || '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'OPEN' ? (
                    <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Company Admin Verification Decision</h4>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          Reason / Reason Code Selection
                        </label>
                        <select
                          value={overrideReason}
                          onChange={e => setOverrideReason(e.target.value)}
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
                          <option value="MOISTURE_EVAPORATION">Moisture Evaporation (Acceptable Transit Loss)</option>
                          <option value="SCALE_OFFSET_HOPPER_SPILLAGE">Weighbridge Scale Offset / Hopper Spillage</option>
                          <option value="UNREADABLE_RECEIPT">Unreadable Receipt File / Missing Stamp</option>
                          <option value="QUANTITY_MISMATCH">Quantity / Bilty Mismatch</option>
                          <option value="OTHER">Other Reason (Specify below)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--neutral-600)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          Verification Audit Notes
                        </label>
                        <textarea
                          value={resolutionNotes}
                          onChange={e => setResolutionNotes(e.target.value)}
                          placeholder="Provide explanation or audit notes..."
                          style={{
                            width: '100%',
                            height: '80px',
                            padding: '10px 12px',
                            border: '1px solid var(--neutral-300)',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={handleReject}
                          className="btn btn-ghost"
                          style={{ color: 'var(--error-600)', borderColor: 'var(--error-300)', opacity: isSubmitting ? 0.6 : 1 }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? '[ CANCELLING... ]' : '[ FLAG FOR CANCEL / REJECT ]'}
                        </button>
                        <button 
                          onClick={handleApprove}
                          className="btn btn-dark"
                          style={{ backgroundColor: '#10B981', color: '#FFFFFF', opacity: isSubmitting ? 0.6 : 1 }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? '[ APPROVING... ]' : '[ APPROVE POD ]'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
                      <div style={{ backgroundColor: 'var(--neutral-50)', padding: '12px 16px', borderRadius: '8px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px 0' }}>VERIFICATION LOGGED</p>
                        <p style={{ fontSize: '13px', color: 'var(--neutral-800)', margin: 0 }}>
                          {selectedReview.resolution_notes || 'No resolution notes entered'}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </Card>
            ) : (
              <Card title="Review Inspector">
                <p style={{ fontSize: '13px', color: 'var(--neutral-500)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
                  Select an item from the review queue table to resolve blocks, approve POD discrepancies, or verify payload margins.
                </p>
              </Card>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

// Page Header helper component inside view file
const PageHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--neutral-900)', letterSpacing: '-0.02em', margin: 0 }}>
        {title}
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--neutral-500)', margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
};
