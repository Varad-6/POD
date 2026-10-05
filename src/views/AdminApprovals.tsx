import React, { useState, useEffect } from 'react';
import { ClipboardCheck, AlertTriangle, CheckCircle2, ShieldCheck, Scale, RefreshCw, FileText, Eye, XCircle } from 'lucide-react';
import { caApi, ReviewQueueItemV3 } from '../lib/api_v3';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Tabs } from '../components/Tabs';
import { Table } from '../components/Table';
import { Button } from '../components/Button';

export const AdminApprovals: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewQueueItemV3[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewQueueItemV3 | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [overrideReason, setOverrideReason] = useState('MOISTURE_EVAPORATION');
  const [activeTab, setActiveTab] = useState<'OPEN' | 'RESOLVED'>('OPEN');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await caApi.getReviewQueue(activeTab);
      const validData = Array.isArray(data) ? data.filter(d => d && d.id !== 0) : [];
      setReviews(validData);
      if (selectedReview) {
        const stillPresent = validData.find(d => d.id === selectedReview.id);
        setSelectedReview(stillPresent || (validData.length > 0 ? validData[0] : null));
      } else if (validData.length > 0) {
        setSelectedReview(validData[0]);
      } else {
        setSelectedReview(null);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [activeTab]);

  const handleApprove = async () => {
    if (!selectedReview) return;
    setIsSubmitting(true);
    try {
      const finalNotes = `APPROVED: Reason: ${overrideReason}${resolutionNotes ? `. Details: ${resolutionNotes.trim()}` : ''}`;
      await caApi.resolveReview(selectedReview.id, finalNotes, 'APPROVE');
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
      setResolutionNotes('');
      await loadReviews();
      window.dispatchEvent(new Event('pod_data_refreshed'));
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

  // Parse any embedded line items
  let parsedLineItems: any[] = [];
  try {
    const rawJson = (selectedReview as any)?.ocr_line_items_json;
    if (rawJson) parsedLineItems = JSON.parse(rawJson);
  } catch (_) {}

  const podUrl = (selectedReview as any)?.scanned_pod_url || (selectedReview as any)?.pod_file_url || '/uploads/sample_pod.pdf';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <PageHeader 
          title="POD Verification Desk"
          subtitle="Audit and approve flagged proof of delivery slips, AI OCR invoice extractions, or weighbridge variances"
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={loadReviews}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to clear the review queue?')) return;
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
            Clear Queue
          </button>
        </div>
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
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          Loading verification queue...
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState 
          icon={<ClipboardCheck size={48} />}
          title="Review Queue is Clear"
          description={`No dispatch records are currently flagged as ${activeTab.toLowerCase()}. All weighbridge tolerances and invoice verifications are in sync.`}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Table List */}
          <Card title={`Flagged Deliveries (${reviews.length})`} subtitle="Select any consignment below to inspect document scans & OCR data" style={{ padding: 0 }}>
            <Table<ReviewQueueItemV3>
              data={reviews}
              onRowClick={(r) => setSelectedReview(r)}
              getRowStyle={(r) => ({
                backgroundColor: selectedReview?.id === r.id ? 'var(--color-brand-blue-50)' : 'transparent',
                cursor: 'pointer'
              })}
              columns={[
                {
                  header: 'PO Ref / Item',
                  render: (r) => (
                    <div>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--color-text-heading)', display: 'block' }}>
                        {r.sap_po_no ? `${r.sap_po_no} / ${r.po_item_no || '10'}` : `#PO-${r.assignment_id}`}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {r.transporter_name || 'Transport Carrier'}
                      </span>
                    </div>
                  )
                },
                {
                  header: 'Reason',
                  render: (r) => {
                    const reason = r.flag_reason || 'MANUAL_REVIEW';
                    return (
                      <span className={reason === 'TOLERANCE_EXCEEDED' ? 'badge badge-red' : 'badge badge-amber'}>
                        {reason.replace(/_/g, ' ')}
                      </span>
                    );
                  }
                },
                {
                  header: 'Variance',
                  align: 'right',
                  render: (r) => {
                    const { variancePct } = getReviewWeights(r);
                    return (
                      <span className="mono" style={{ fontWeight: 700, color: Math.abs(variancePct) > 0.5 ? 'var(--color-error-text)' : 'var(--color-text-heading)' }}>
                        {variancePct !== 0 ? `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(2)}%` : '0.00%'}
                      </span>
                    );
                  }
                },
                {
                  header: 'MIRO Status',
                  render: (r) => (
                    <span style={{ fontWeight: 600, fontSize: '11px', color: r.blocks_miro_bool ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>
                      {r.blocks_miro_bool ? '🔒 Blocks MIRO' : '✓ Unblocked'}
                    </span>
                  )
                }
              ]}
            />
          </Card>

          {/* Inspector Panel */}
          <div>
            {selectedReview ? (
              <Card title="VERIFICATION INSPECTOR" accentColor="var(--color-brand-blue-600)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Metadata Header Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', fontSize: '13px', backgroundColor: 'var(--color-brand-blue-50)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>PO Number / Item</span>
                      <strong className="mono" style={{ color: 'var(--color-text-heading)' }}>{selectedReview.sap_po_no || '4500001714'} / {selectedReview.po_item_no || '10'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Vehicle Reg</span>
                      <strong className="mono" style={{ color: 'var(--color-text-heading)' }}>{selectedReview.vehicle_reg || 'KV44RCGP'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Transporter</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>{selectedReview.transporter_name || 'Sipho Transport Services'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Driver</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>{selectedReview.driver_name || 'Rajesh Kumar'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Dispatched Tonnage</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>{dispatchedTons.toFixed(2)} Tons</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Received Tonnage</span>
                      <strong style={{ color: 'var(--color-text-heading)' }}>{receivedTons.toFixed(2)} Tons</strong>
                    </div>
                  </div>

                  {/* Document Scan Preview */}
                  <div style={{ border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '14px', backgroundColor: 'var(--color-bg-card)' }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 10px 0', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Attached Document Scan</span>
                      <a href={podUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-blue-600)', textTransform: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={12} /> Open Full Document
                      </a>
                    </h5>
                    <div style={{ backgroundColor: 'var(--color-bg-page)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText size={24} style={{ color: 'var(--color-brand-blue-600)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: '12.5px', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {podUrl.split('/').pop() || 'invoice_document.pdf'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {(selectedReview as any)?.ocr_provider || 'OpenAI Vision'} · {(selectedReview as any)?.ocr_processing_status || 'EXTRACTED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI OCR Extraction Results */}
                  <div style={{ border: '1.5px solid var(--color-border)', borderRadius: '12px', padding: '14px', backgroundColor: '#FFFFFF' }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-heading)', margin: '0 0 10px 0', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🔍 AI OCR EXTRACTION RESULTS</span>
                      <span className="badge badge-green" style={{ fontSize: '10px' }}>GPT-4o Vision</span>
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Extracted Invoice No:</span>
                        <strong className="mono">{(selectedReview as any)?.ocr_invoice_no || (selectedReview as any)?.ocr_waybill_extracted || 'INV-2026-0001'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Vendor GSTIN / Entity:</span>
                        <strong>{(selectedReview as any)?.ocr_vendor_name || selectedReview.transporter_name || 'Sipho Transport Services'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Invoice Total Amount:</span>
                        <strong className="mono" style={{ color: 'var(--color-brand-blue-700)' }}>
                          {(selectedReview as any)?.ocr_total_amount ? `R ${Number((selectedReview as any).ocr_total_amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'R 5,923.65'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Extraction Match Status:</span>
                        <strong style={{ color: (selectedReview as any)?.ocr_match_status === 'MISMATCH' ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>
                          {(selectedReview as any)?.ocr_match_status || 'MATCH'}
                        </strong>
                      </div>
                    </div>

                    {parsedLineItems.length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px dashed var(--color-border)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Extracted Line Items:</span>
                        {parsedLineItems.map((li, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', padding: '2px 0' }}>
                            <span>{li.description || `Item #${li.itemNumber || idx + 1}`}</span>
                            <span className="mono">{li.quantity} {li.uom} @ R{li.unitPrice} = R{li.lineTotal}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {selectedReview.status === 'OPEN' ? (
                    <div style={{ borderTop: '1.5px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          SAP Finance Release Override Reason
                        </label>
                        <select
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', fontWeight: 600, backgroundColor: '#FFFFFF' }}
                        >
                          <option value="MOISTURE_EVAPORATION">Moisture Evaporation / Transit Loss</option>
                          <option value="SCALE_CALIBRATION">Siding Scale Calibration Variance</option>
                          <option value="EXCEPTIONAL_ALLOWANCE">Exceptional Commercial Allowance</option>
                          <option value="RE-WEIGH_ORDERED">Re-weigh Ordered / Manual Adjustment</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                          Verification Audit Notes (Logged in SAP S/4HANA Mirror)
                        </label>
                        <textarea
                          placeholder="Provide commercial justification or verification notes..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          rows={2}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', resize: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <Button 
                          onClick={handleReject} 
                          disabled={isSubmitting} 
                          variant="secondary"
                          style={{ color: 'var(--color-error-text)', borderColor: 'var(--color-error-light)' }}
                        >
                          <XCircle size={14} style={{ marginRight: '6px' }} />
                          {isSubmitting ? 'Processing...' : 'Reject POD'}
                        </Button>
                        <Button 
                          onClick={handleApprove} 
                          disabled={isSubmitting} 
                          variant="primary"
                        >
                          <CheckCircle2 size={14} style={{ marginRight: '6px' }} />
                          {isSubmitting ? 'Overriding...' : 'Force Release & Approve'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: '1.5px solid var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-light)', padding: '12px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success-text)' }}>
                        <CheckCircle2 size={16} />
                        <strong style={{ fontSize: '13px' }}>Resolved & Released to SAP Invoice Desk</strong>
                      </div>
                      <div style={{ backgroundColor: 'var(--color-bg-page)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px 0' }}>VERIFICATION LOGGED</p>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-heading)', margin: 0 }}>
                          {selectedReview.resolution_notes || 'Approved and verified by Company Admin'}
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
