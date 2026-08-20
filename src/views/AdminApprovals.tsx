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
  }, [activeTab]);

  const handleResolve = async () => {
    if (!selectedReview) return;
    setIsSubmitting(true);
    try {
      const finalNotes = `Reason: ${overrideReason}. Details: ${resolutionNotes}`;
      await caApi.resolveReview(selectedReview.id, finalNotes);
      setSelectedReview(null);
      setResolutionNotes('');
      loadReviews();
    } catch (err) {
      console.error('Failed to resolve review:', err);
      alert('Error resolving review item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <PageHeader 
        title="Receipt & Weight Check Queue"
        subtitle="Check and approve flagged delivery papers, OCR mismatches, or weight differences before making payment"
      />

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
                    <th>Driver / Vehicle</th>
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
                          <div style={{ fontWeight: 600 }}>{r.driver_name || 'Z. Dlamini'}</div>
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
              <Card title={`Review Detail: #${selectedReview.id}`} accentColor="var(--error-600)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px 0' }}>Flag Details</p>
                    <p style={{ fontWeight: 600, color: 'var(--neutral-900)', margin: 0 }}>
                      This assignment was flagged for <strong style={{ color: 'var(--error-600)' }}>{selectedReview.flag_reason}</strong>.
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px 0' }}>Linked PO Ref</p>
                    <p className="mono" style={{ fontWeight: 700, margin: 0 }}>
                      {selectedReview.sap_po_no}
                    </p>
                  </div>

                  {/* Document & OCR Split Preview Card */}
                  <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '8px', padding: '14px', backgroundColor: '#FFFFFF' }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-700)', margin: '0 0 10px 0', letterSpacing: '0.04em' }}>
                      📄 Stamped Receipt Document & OCR Scan
                    </h5>
                    <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--neutral-200)', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <div style={{ textAlign: 'center', color: 'var(--neutral-600)', fontSize: '12px' }}>
                        <span style={{ fontWeight: 700, display: 'block' }}>📷 Stamped Delivery Receipt Attached</span>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--neutral-400)' }}>/uploads/pods/receipt_stamped.png</span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Point Weighbridge Variance Visualizer */}
                  <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '8px', padding: '14px', backgroundColor: '#F8FAFC' }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neutral-700)', margin: '0 0 10px 0', letterSpacing: '0.04em' }}>
                      4-Point Weighbridge Variance Analysis
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block' }}>MINE TARE / GROSS</span>
                        <strong style={{ color: 'var(--neutral-900)' }}>10.00 T / 44.00 T</strong>
                        <span style={{ fontSize: '11px', color: 'var(--neutral-600)', display: 'block' }}>Net: 34.00 Tons</span>
                      </div>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--neutral-500)', display: 'block' }}>YARD TARE / GROSS</span>
                        <strong style={{ color: 'var(--neutral-900)' }}>10.00 T / 42.00 T</strong>
                        <span style={{ fontSize: '11px', color: 'var(--error-600)', fontWeight: 700, display: 'block' }}>Net: 32.00 Tons</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', color: 'var(--error-600)', fontSize: '11px', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                      <span>VARIANCE EXCEEDED: -2,000 KG (-5.88%)</span>
                      <span>MAX TOLERANCE: ±0.5%</span>
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
                          onClick={async () => {
                            if (!selectedReview || !resolutionNotes) {
                              alert('Please provide resolution notes before rejecting.');
                              return;
                            }
                            setIsSubmitting(true);
                            try {
                              await caApi.resolveReview(selectedReview.id, `REJECTED: ${overrideReason} - ${resolutionNotes}`);
                              setSelectedReview(null);
                              setResolutionNotes('');
                              loadReviews();
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          className="btn btn-ghost"
                          style={{ color: 'var(--error-600)', borderColor: 'var(--error-300)' }}
                          disabled={isSubmitting || !resolutionNotes}
                        >
                          [ REJECT POD ]
                        </button>
                        <button 
                          onClick={handleResolve}
                          className="btn btn-dark"
                          style={{ backgroundColor: '#10B981', color: '#FFFFFF' }}
                          disabled={isSubmitting || !resolutionNotes}
                        >
                          [ APPROVE POD ]
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
