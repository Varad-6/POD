import React, { useState } from 'react';
import { ClipboardCheck, FileText, AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useDemo, OffloadRecord } from '../context/DemoContext';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';
import { OCR_RESULTS, REJECTION_REASONS } from '../data/mockData';

export const AdminApprovals: React.FC = () => {
  const { offloadRecords, approvePOD, rejectPOD, uploadPOD } = useDemo();
  const [activeTab, setActiveTab] = useState<'AWAITING' | 'REVIEW'>('AWAITING');
  
  // Modal controllers
  const [selectedRecord, setSelectedRecord] = useState<OffloadRecord | null>(null);
  const [showConfirmOverride, setShowConfirmOverride] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Rejection form states
  const [rejectReason, setRejectReason] = useState('');
  const [rejectComment, setRejectComment] = useState('');

  // Queue lists offloads filtered by active tab
  const queue = offloadRecords.filter((rec) => {
    if (activeTab === 'AWAITING') {
      return rec.podStatus === 'SUBMITTED_AWAITING_APPROVAL';
    } else {
      return rec.podStatus === 'LOW_CONFIDENCE';
    }
  });

  // Get simulated OCR data based on record uploadedFileName
  const getOCRData = (record: OffloadRecord) => {
    const fileName = record.uploadedFileName || "";
    let key = "WB-998807"; // default
    if (fileName.includes('mismatch') || record.waybillNo === 'WB-998808') {
      key = "WB-998808";
    } else if (fileName.includes('blurry') || record.waybillNo === 'WB-998809') {
      key = "WB-998809";
    } else if (record.waybillNo === 'WB-998807') {
      return {
        fileName: "WB-998807.jpg",
        confidence: 0.98,
        extracted: { waybillNo: "WB-998807", truckNo: "NJD982GP", weight: 33.75 },
        sapRecord: { waybillNo: "WB-998807", truckNo: "NJD982GP", weight: 33.75 },
        matchResult: "MATCH",
      };
    }
    return OCR_RESULTS[key as keyof typeof OCR_RESULTS] as any;
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    
    await approvePOD(selectedRecord.waybillNo, false);
    
    setIsSubmitting(false);
    setSelectedRecord(null);
  };

  const handleOverrideApprove = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    
    await approvePOD(selectedRecord.waybillNo, true); // True triggers Mismatch Override status
    
    setIsSubmitting(false);
    setShowConfirmOverride(false);
    setSelectedRecord(null);
  };

  const handleManualReviewFlag = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    
    // Simulate setting status to manual review pending (LOW_CONFIDENCE)
    await uploadPOD(selectedRecord.waybillNo, 'delivery-slip-blurry.jpg');
    
    setSelectedRecord(null);
    setIsSubmitting(false);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !rejectReason) return;
    
    setIsSubmitting(true);
    const finalReason = rejectReason === 'Other (comment)' ? rejectComment : rejectReason;
    
    await rejectPOD(selectedRecord.waybillNo, finalReason);
    
    setIsSubmitting(false);
    setShowRejectModal(false);
    setSelectedRecord(null);
    
    // Clear forms
    setRejectReason('');
    setRejectComment('');
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: active ? 'var(--primary-color)' : 'transparent',
    color: active ? '#ffffff' : 'var(--neutral-secondary)',
    border: '1px solid ' + (active ? 'var(--primary-color)' : 'var(--border-grey)'),
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s'
  });

  const awaitingCount = offloadRecords.filter(r => r.podStatus === 'SUBMITTED_AWAITING_APPROVAL').length;
  const reviewCount = offloadRecords.filter(r => r.podStatus === 'LOW_CONFIDENCE').length;

  return (
    <div>
      {/* Queue Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => setActiveTab('AWAITING')} style={tabStyle(activeTab === 'AWAITING')}>
          Awaiting Approval ({awaitingCount})
        </button>
        <button onClick={() => setActiveTab('REVIEW')} style={tabStyle(activeTab === 'REVIEW')}>
          Flagged for Review ({reviewCount})
        </button>
      </div>

      {queue.length === 0 ? (
        <EmptyState 
          message={activeTab === 'AWAITING' ? "No pending approvals" : "No flagged documents under review"} 
          submessage="Outstanding PODs have been completely verified and approved."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {queue.map((rec) => {
            const ocr = getOCRData(rec);
            const matchStatus = ocr ? ocr.matchResult : 'MATCH';

            return (
              <Card key={rec.waybillNo} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)' }}>
                      Waybill #{rec.waybillNo}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)' }}>
                      Transporter: Sipho Transport Services
                    </p>
                  </div>
                  <StatusBadge status={rec.podStatus} />
                </div>

                <div 
                  style={{ 
                    backgroundColor: 'var(--page-bg)', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)' }}>OCR SCAN MATCH STATUS</p>
                    <p style={{ fontWeight: 700, marginTop: '2px', color: matchStatus === 'MATCH' ? 'var(--success-text)' : matchStatus === 'MISMATCH' ? 'var(--error-text)' : 'var(--warning-text)' }}>
                      {matchStatus === 'MATCH' ? '✅ Full Match' : matchStatus === 'MISMATCH' ? '⚠ Discrepancy Found' : '❔ Low Confidence'}
                    </p>
                  </div>
                  <StatusBadge status={matchStatus} />
                </div>

                <button 
                  onClick={() => setSelectedRecord(rec)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  Review Delivery Note
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedRecord && !showConfirmOverride && !showRejectModal}
        onClose={() => { if (!isSubmitting) setSelectedRecord(null); }}
        title={selectedRecord ? `Verification — Waybill ${selectedRecord.waybillNo}` : ''}
        width="760px"
      >
        {selectedRecord && (() => {
          const ocr = getOCRData(selectedRecord);
          if (!ocr) return null;

          return (
            <div>
              {/* Split Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Left Panel: Scanned Slip */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-secondary)', marginBottom: '12px' }}>PHYSICAL DELIVERY SLIP</h4>
                  <div 
                    style={{ 
                      width: '100%', 
                      height: '260px', 
                      border: '1px solid var(--border-grey)', 
                      borderRadius: '8px', 
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--neutral-secondary)',
                        padding: '16px',
                        textAlign: 'center',
                        backgroundImage: 'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                    >
                      <FileText size={48} style={{ color: 'var(--primary-color)', marginBottom: '12px' }} />
                      <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--neutral-primary)' }}>{ocr.fileName}</p>
                      <p style={{ fontSize: '11px' }}>Simulated scan preview loaded into reader</p>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Side by Side Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-secondary)' }}>MATCH VERIFICATION CHECKLIST</h4>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neutral-secondary)' }}>
                      OCR Confidence: {(ocr.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Red Mismatch Box */}
                  {ocr.matchResult === 'MISMATCH' && (
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <AlertTriangle size={14} />
                      Weight variance detected. Action required.
                    </div>
                  )}

                  {/* Yellow Blurry Box */}
                  {ocr.matchResult === 'LOW_CONFIDENCE' && (
                    <div style={{ padding: '8px 12px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <AlertCircle size={14} />
                      Low resolution read. Please audit manually.
                    </div>
                  )}

                  {/* Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Waybill */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid var(--border-grey)' }}>
                      <div>
                        <p style={{ fontSize: '9px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>OCR EXTRACTED WAYBILL</p>
                        <p style={{ fontWeight: 600, fontSize: '13px' }}>{ocr.extracted.waybillNo}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '9px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>SAP WEIGHBRIDGE RECORD</p>
                        <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--success-text)' }}>{selectedRecord.waybillNo}</p>
                      </div>
                    </div>

                    {/* Truck */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid var(--border-grey)' }}>
                      <div>
                        <p style={{ fontSize: '9px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>OCR EXTRACTED TRUCK</p>
                        <p style={{ fontWeight: 600, fontSize: '13px' }}>{ocr.extracted.truckNo}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '9px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>SAP WEIGHBRIDGE RECORD</p>
                        <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--success-text)' }}>{selectedRecord.horseRegNo}</p>
                      </div>
                    </div>

                    {/* Weight */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '10px 12px', 
                        backgroundColor: ocr.matchResult === 'MISMATCH' ? 'var(--error-bg)' : '#fafafa', 
                        borderRadius: '6px', 
                        border: ocr.matchResult === 'MISMATCH' ? '1px solid var(--error-text)' : '1px solid var(--border-grey)' 
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '9px', color: ocr.matchResult === 'MISMATCH' ? 'var(--error-text)' : 'var(--neutral-secondary)', fontWeight: 600 }}>OCR EXTRACTED WEIGHT</p>
                        <p style={{ fontWeight: 700, fontSize: '13px', color: ocr.matchResult === 'MISMATCH' ? 'var(--error-text)' : 'var(--neutral-primary)' }}>
                          {ocr.extracted.weight.toFixed(2)} Tons
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '9px', color: ocr.matchResult === 'MISMATCH' ? 'var(--error-text)' : 'var(--neutral-secondary)', fontWeight: 600 }}>SAP WEIGHBRIDGE RECORD</p>
                        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--success-text)' }}>
                          {(selectedRecord.netWeightKg / 1000.0).toFixed(2)} Tons
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-grey)', paddingTop: '20px' }}>
                <button 
                  onClick={() => setSelectedRecord(null)} 
                  disabled={isSubmitting} 
                  className="btn btn-secondary"
                >
                  Close
                </button>

                {ocr.matchResult === 'MATCH' && (
                  <button 
                    onClick={handleApprove} 
                    disabled={isSubmitting} 
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--success-text)', borderColor: 'var(--success-text)', minWidth: '120px' }}
                  >
                    {isSubmitting ? 'Approving...' : 'Approve POD'}
                  </button>
                )}

                {ocr.matchResult === 'MISMATCH' && (
                  <>
                    <button 
                      onClick={() => setShowRejectModal(true)} 
                      disabled={isSubmitting} 
                      className="btn btn-destructive"
                    >
                      Reject POD
                    </button>
                    <button 
                      onClick={handleManualReviewFlag} 
                      disabled={isSubmitting} 
                      className="btn btn-secondary"
                      style={{ minWidth: '130px' }}
                    >
                      Send for Review
                    </button>
                    <button 
                      onClick={() => setShowConfirmOverride(true)} 
                      disabled={isSubmitting} 
                      className="btn btn-primary"
                      style={{ border: '2px solid var(--warning-text)', backgroundColor: 'transparent', color: 'var(--warning-text)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--warning-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Override & Approve
                    </button>
                  </>
                )}

                {ocr.matchResult === 'LOW_CONFIDENCE' && (
                  <>
                    <button 
                      onClick={() => setShowRejectModal(true)} 
                      disabled={isSubmitting} 
                      className="btn btn-destructive"
                    >
                      Reject POD
                    </button>
                    <button 
                      onClick={handleManualReviewFlag} 
                      disabled={isSubmitting} 
                      className="btn btn-secondary"
                      style={{ minWidth: '150px' }}
                    >
                      Send for Manual Review
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Override Confirm Sub-step Modal */}
      <Modal
        isOpen={showConfirmOverride}
        onClose={() => setShowConfirmOverride(false)}
        title="Verify Manual Override"
        width="450px"
      >
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={36} style={{ color: 'var(--warning-text)', marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-primary)', marginBottom: '12px' }}>
            Manual Discrepancy Verification
          </p>
          <p style={{ fontSize: '13px', color: 'var(--neutral-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            Please confirm that you have physically inspected the uploaded delivery slip and have verified that the SAP system weight is correct despite the OCR discrepancy.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowConfirmOverride(false)} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={handleOverrideApprove}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--warning-text)', borderColor: 'var(--warning-text)' }}
            >
              {isSubmitting ? 'Processing...' : 'Confirm & Approve'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={selectedRecord ? `Reject POD — Waybill ${selectedRecord.waybillNo}` : ''}
        width="480px"
      >
        <form onSubmit={handleRejectSubmit}>
          <div className="form-group">
            <label>REJECTION REASON</label>
            <select 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="form-input"
              style={{ padding: '10px' }}
              required
            >
              <option value="">Select a reason...</option>
              {REJECTION_REASONS.map((r: string) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {rejectReason === 'Other (comment)' && (
            <div className="form-group animate-slide-in">
              <label>ADDITIONAL COMMENT</label>
              <textarea 
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Enter details about why this slip was rejected..."
                className="form-input"
                style={{ minHeight: '100px', resize: 'vertical' }}
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button 
              type="button" 
              onClick={() => setShowRejectModal(false)} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!rejectReason || (rejectReason === 'Other (comment)' && !rejectComment) || isSubmitting}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--error-text)', borderColor: 'var(--error-text)' }}
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
