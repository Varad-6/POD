import React, { useState, useEffect } from 'react';
import { ClipboardCheck, AlertTriangle, CheckCircle2, ShieldCheck, Scale, RefreshCw } from 'lucide-react';
import { caApi, ReviewQueueItemV3 } from '../lib/api_v3';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Tabs } from '../components/Tabs';

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
          className="btn btn-danger btn-sm"
          style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)', borderColor: 'var(--color-error-light)' }}
        >
          CLEAR QUEUE
        </button>
      </div>

      {/* Tabs */}
      <Tabs 
        tabs={[
          { id: 'OPEN', label: 'Open Review Queue', count: activeTab === 'OPEN' ? reviews.length : undefined },
          { id: 'RESOLVED', label: 'Resolved Archive', count: activeTab === 'RESOLVED' ? reviews.length : undefined }
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading queue...</div>
      ) : reviews.length === 0 ? (
        <EmptyState 
          icon={<ClipboardCheck size={48} />}
          title="Review Queue is Clear"
          description={`No dispatch records are currently flagged as ${activeTab.toLowerCase()}. All pipelines operating smoothly.`}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Left Table List */}
          <Card title={`Flagged Items (${reviews.length})`} subtitle="Select an item below to load detailed verification inspector">
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
                          backgroundColor: isSelected ? 'var(--color-brand-blue-50)' : 'transparent'
                        }}
                      >
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--color-text-heading)' }}>
                          {r.sap_po_no ? `${r.sap_po_no} / ${r.po_item_no}` : `#PO-${r.assignment_id}`}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.transporter_name || 'ABC Transport'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{r.vehicle_reg || 'KV44RCGP'}</div>
                        </td>
                        <td>
                          <span className={r.flag_reason === 'TOLERANCE_EXCEEDED' ? 'badge badge-red' : 'badge badge-amber'}>
                            {r.flag_reason.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: r.blocks_miro_bool ? 'var(--color-error-text)' : 'var(--color-text-muted)' }}>
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
              <Card title="POD VERIFICATION" accentColor="var(--color-brand-blue-600)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', fontSize: '13px', backgroundColor: 'var(--color-brand-blue-50)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>PO Number / Item</span>
                      <strong className="mono" style={{ color: 'var(--color-text-heading)' }}>{selectedReview.sap_po_no} / {selectedReview.po_item_no}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Contract</span>
                      <strong className="mono" style={{ color: 'var(--color-text-heading)' }}>C-2026-001</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Transporter</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>{selectedReview.transporter_name || 'ABC Transport'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Transporter Admin</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>Sipho</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Vehicle</span>
                      <strong className="mono" style={{ color: 'var(--color-text-heading)' }}>{selectedReview.vehicle_reg || 'KV44RCGP'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Delivery Location</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>Duvha Power Station</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Dispatched Tonnage</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>{dispatchedTons.toFixed(2)} Tons</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Received Tonnage</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>{receivedTons.toFixed(2)} Tons</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Net Variance</span>
                      <strong style={{ 
                        color: varianceKg === 0 ? 'var(--color-text-heading)' : varianceKg < 0 ? 'var(--color-error-text)' : 'var(--color-success-text)', 
                        fontSize: '14.5px' 
                      }}>
                        {varianceKg > 0 ? '+' : ''}{varianceKg.toLocaleString()} KG ({variancePct > 0 ? '+' : ''}{variancePct.toFixed(2)}%)
                      </strong>
                    </div>
                  </div>

                  {/* Document & OCR Split Preview Card */}
                  <div style={{ border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '14px', backgroundColor: 'var(--color-bg-card)' }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 10px 0', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📄 STAMPED DELIVERY RECEIPT (POD)</span>
                      <a href="/uploads/sample_pod.pdf" target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-blue-600)', textTransform: 'none', textDecoration: 'underline' }}>[View Document]</a>
                    </h5>
                    <div style={{ backgroundColor: 'var(--color-bg-page)', borderRadius: '6px', border: '1px solid var(--color-border)', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center', color: 'var(--color-text-body)', fontSize: '12px' }}>
                        <span style={{ fontWeight: 700, display: 'block' }}>📷 Stamped POD Slip Attached</span>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>/uploads/pods/receipt_stamped.png</span>
                      </div>
                    </div>
                  </div>

                  {/* OCR Verification Results */}
                  <div style={{ border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '14px', backgroundColor: '#FFFFFF' }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-heading)', margin: '0 0 10px 0', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🔍 AI OCR EXTRACTION RESULTS</span>
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Extracted Waybill:</span>
                        <strong>{(selectedReview as any).ocr_waybill_extracted || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Confidence:</span>
                        <strong style={{ 
                          color: ((selectedReview as any).ocr_confidence_pct || 0) < 50 ? 'var(--color-error)' : 'var(--color-success)' 
                        }}>
                          {(selectedReview as any).ocr_confidence_pct ? `${(selectedReview as any).ocr_confidence_pct}%` : '—'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Extracted Weight:</span>
                        <strong>{(selectedReview as any).ocr_weight_extracted ? `${(selectedReview as any).ocr_weight_extracted} Tons` : '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Match Status:</span>
                        <strong style={{ 
                          color: (selectedReview as any).ocr_match_status === 'MATCH' 
                            ? 'var(--color-success-text)' 
                            : (selectedReview as any).ocr_match_status === 'LOW_CONFIDENCE' 
                              ? 'var(--color-warning-text)' 
                              : 'var(--color-error-text)' 
                        }}>
                          {(selectedReview as any).ocr_match_status || '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'OPEN' ? (
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--color-text-heading)' }}>Verification Decision</h4>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          Reason Selection
                        </label>
                        <select
                          value={overrideReason}
                          onChange={e => setOverrideReason(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1.5px solid var(--color-border)',
                            borderRadius: '10px',
                            fontSize: '13px',
                            backgroundColor: 'var(--color-bg-elevated)',
                            color: 'var(--color-text-primary)',
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
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
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
                            border: '1.5px solid var(--color-border)',
                            borderRadius: '10px',
                            fontSize: '13px',
                            backgroundColor: 'var(--color-bg-elevated)',
                            color: 'var(--color-text-primary)'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={handleReject}
                          className="btn btn-ghost"
                          style={{ color: 'var(--color-error-text)', borderColor: 'var(--color-error-light)', opacity: isSubmitting ? 0.6 : 1 }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Rejecting...' : 'Reject POD'}
                        </button>
                        <button 
                          onClick={handleApprove}
                          className="btn btn-primary"
                          style={{ backgroundColor: 'var(--color-brand-blue-600)', color: '#FFFFFF', opacity: isSubmitting ? 0.6 : 1 }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Approving...' : 'Approve POD'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                      <div style={{ backgroundColor: 'var(--color-bg-page)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px 0' }}>VERIFICATION LOGGED</p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-heading)', margin: 0 }}>
                          {selectedReview.resolution_notes || 'No resolution notes entered'}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </Card>
            ) : (
              <Card title="Review Inspector">
                <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px 0', margin: 0 }}>
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
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-heading)', margin: 0 }}>
        {title}
      </h1>
      <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
};
