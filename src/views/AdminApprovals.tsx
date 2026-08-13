import React, { useState } from 'react';
import { ClipboardCheck, FileText, AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck, Scale, FileSpreadsheet, RefreshCw } from 'lucide-react';
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

  const awaitingCount = offloadRecords.filter(r => r.podStatus === 'SUBMITTED_AWAITING_APPROVAL').length;
  const reviewCount = offloadRecords.filter(r => r.podStatus === 'LOW_CONFIDENCE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header section */}
      <div className="page-header__row">
        <div>
          <h1 className="page-header__title">POD Verification Queue</h1>
          <p className="page-header__subtitle">
            Inspect physical weighbridge tickets, AI OCR match confidence, 4-point weights, and exception clearances.
          </p>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--neutral-100)', padding: '4px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
          <button 
            onClick={() => setActiveTab('AWAITING')} 
            className={`btn btn-sm ${activeTab === 'AWAITING' ? 'btn-dark' : 'btn-ghost'}`}
            style={{ borderRadius: '6px' }}
          >
            Awaiting Approval ({awaitingCount})
          </button>
          <button 
            onClick={() => setActiveTab('REVIEW')} 
            className={`btn btn-sm ${activeTab === 'REVIEW' ? 'btn-dark' : 'btn-ghost'}`}
            style={{ borderRadius: '6px' }}
          >
            Flagged for Audit ({reviewCount})
          </button>
        </div>
      </div>

      {queue.length === 0 ? (
        <EmptyState 
          message={activeTab === 'AWAITING' ? "Verification Queue Clean" : "No Flagged Scans"} 
          submessage="All submitted Proof-of-Delivery documents have been processed and approved for SAP invoice creation."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {queue.map((rec) => {
            const ocr = getOCRData(rec);
            const matchStatus = ocr ? ocr.matchResult : 'MATCH';

            return (
              <div 
                key={rec.waybillNo} 
                className="card"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  borderLeft: matchStatus === 'MATCH' ? '4px solid var(--success-500)' : matchStatus === 'MISMATCH' ? '4px solid var(--error-600)' : '4px solid var(--warning-500)'
                }}
              >
                <div className="card-header">
                  <div>
                    <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>WAYBILL DOCUMENT</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neutral-900)' }}>
                      #{rec.waybillNo}
                    </h3>
                  </div>
                  <StatusBadge status={rec.podStatus} />
                </div>

                <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="data-grid-2">
                    <div>
                      <div className="data-pair__label">Transporter</div>
                      <div className="data-pair__value">{rec.driverName ? 'Sipho Transport Services' : 'MPL Transport'}</div>
                    </div>
                    <div>
                      <div className="data-pair__label">Driver / Vehicle</div>
                      <div className="data-pair__value">{rec.driverName} ({rec.horseRegNo})</div>
                    </div>
                  </div>

                  <div className="data-grid-2">
                    <div>
                      <div className="data-pair__label">Product Material</div>
                      <div className="data-pair__value">{rec.productDescription}</div>
                    </div>
                    <div>
                      <div className="data-pair__label">Dispatch Net Vol</div>
                      <div className="data-pair__value mono" style={{ fontWeight: 700 }}>
                        {((rec.dispatchNetWeightKg || rec.netWeightKg || 34000) / 1000).toFixed(2)} TON
                      </div>
                    </div>
                  </div>

                  {/* OCR Match Status Indicator */}
                  <div 
                    style={{ 
                      backgroundColor: 'var(--neutral-50)', 
                      padding: '10px 14px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--neutral-200)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '4px'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>OCR VERIFICATION SCORE</p>
                      <p style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: matchStatus === 'MATCH' ? 'var(--success-600)' : matchStatus === 'MISMATCH' ? 'var(--error-600)' : 'var(--warning-600)' }}>
                        {matchStatus === 'MATCH' ? '✅ Full Match (98%)' : matchStatus === 'MISMATCH' ? '⚠ Discrepancy Flagged' : '❔ Low Confidence Scan'}
                      </p>
                    </div>
                    <StatusBadge status={matchStatus} />
                  </div>
                </div>

                <div className="card-footer" style={{ background: 'var(--neutral-50)' }}>
                  <button 
                    onClick={() => setSelectedRecord(rec)}
                    className="btn btn-dark"
                    style={{ width: '100%', padding: '9px 16px', fontSize: '13px' }}
                  >
                    Inspect Delivery Slip & Audit Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedRecord && !showConfirmOverride && !showRejectModal}
        onClose={() => { if (!isSubmitting) setSelectedRecord(null); }}
        title={selectedRecord ? `Verification Audit — Waybill #${selectedRecord.waybillNo}` : ''}
        width="820px"
      >
        {selectedRecord && (() => {
          const ocr = getOCRData(selectedRecord);
          if (!ocr) return null;

          return (
            <div>
              {/* Split Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '24px', marginBottom: '24px' }}>
                
                {/* Left Panel: Scanned Document Preview */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>PHYSICAL DELIVERY NOTE SCAN</h4>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>{ocr.fileName}</span>
                  </div>
                  <div 
                    style={{ 
                      width: '100%', 
                      height: '320px', 
                      border: '1px solid var(--neutral-200)', 
                      borderRadius: '12px', 
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      textAlign: 'center',
                      backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
                      backgroundSize: '16px 16px'
                    }}
                  >
                    <FileText size={48} style={{ color: 'var(--brand-navy)', marginBottom: '12px' }} />
                    <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--neutral-900)' }}>{ocr.fileName}</p>
                    <p style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '4px', maxWidth: '220px' }}>
                      Stamped Proof of Delivery image read into AI OCR pipeline.
                    </p>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '6px' }}>
                      <span className="badge badge-neutral">Resolution: 300 DPI</span>
                      <span className="badge badge-blue">Confidence: {((ocr.confidence || 0.95) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Side by Side Verification Checklist */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>COMPLIANCE CHECKLIST</h4>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neutral-500)' }}>
                      SAP PO: {selectedRecord.poRef}
                    </span>
                  </div>

                  {/* Warning Alerts */}
                  {ocr.matchResult === 'MISMATCH' && (
                    <div className="alert alert-error" style={{ marginBottom: '12px', padding: '10px 12px', fontSize: '12px' }}>
                      <AlertTriangle size={16} />
                      <div>
                        <strong>Discrepancy Detected:</strong> Extracted weight differs from SAP Weighbridge log. Require manual override or rejection.
                      </div>
                    </div>
                  )}

                  {ocr.matchResult === 'LOW_CONFIDENCE' && (
                    <div className="alert alert-warning" style={{ marginBottom: '12px', padding: '10px 12px', fontSize: '12px' }}>
                      <AlertCircle size={16} />
                      <div>
                        <strong>Low Confidence Scan:</strong> Document scan clarity is below 85%. Audit physical slip manually before approving.
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* Carrier & Bilty Details */}
                    <div style={{ padding: '10px 12px', backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: '8px', fontSize: '11.5px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📋 Bilty #: <strong className="mono">{selectedRecord.biltyNo || 'BLT-770101'}</strong></span>
                      <span>🪪 License: <strong className="mono">{selectedRecord.driverLicenseNo || 'DL-850912-EC'}</strong> (Valid)</span>
                    </div>

                    {/* Waybill Match Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--neutral-0)', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
                      <div>
                        <p style={{ fontSize: '9px', color: 'var(--neutral-500)', fontWeight: 700 }}>OCR EXTRACTED WAYBILL</p>
                        <p className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{ocr.extracted.waybillNo}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '9px', color: 'var(--neutral-500)', fontWeight: 700 }}>SAP WEIGHBRIDGE SYSTEM RECORD</p>
                        <p className="mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--success-600)' }}>{selectedRecord.waybillNo}</p>
                      </div>
                    </div>

                    {/* 4-Point Weighbridge Comparison */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--neutral-50)', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
                      <div>
                        <p style={{ fontSize: '9px', color: 'var(--neutral-500)', fontWeight: 700 }}>DISPATCH NET (MINE SIDING)</p>
                        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-navy)' }}>
                          {( (selectedRecord.dispatchNetWeightKg || selectedRecord.netWeightKg) / 1000.0).toFixed(2)} TON
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--neutral-500)' }}>
                          Tare: {selectedRecord.dispatchTareWeightKg || selectedRecord.tareWeightKg}kg | Gross: {selectedRecord.dispatchGrossWeightKg || selectedRecord.grossWeightKg}kg
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '9px', color: 'var(--neutral-500)', fontWeight: 700 }}>ARRIVAL NET (CUSTOMER YARD)</p>
                        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--success-600)' }}>
                          {( (selectedRecord.arrivalNetWeightKg || selectedRecord.netWeightKg) / 1000.0).toFixed(2)} TON
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--neutral-500)' }}>
                          Gross: {selectedRecord.arrivalGrossWeightKg || selectedRecord.grossWeightKg}kg | Tare: {selectedRecord.arrivalTareWeightKg || selectedRecord.tareWeightKg}kg
                        </p>
                      </div>
                    </div>

                    {/* Damaged Goods Audit */}
                    {selectedRecord.damagedUnits !== undefined && selectedRecord.damagedUnits > 0 && (
                      <div className="alert alert-warning" style={{ padding: '8px 12px', fontSize: '11px' }}>
                        <div>
                          <strong>Damaged Cargo Recorded:</strong> {selectedRecord.damagedUnits} units damaged ({selectedRecord.damagedWeightKg || 0} kg loss). Reason: {selectedRecord.damageReason || 'Spillage'}
                          <div style={{ fontWeight: 800, marginTop: '2px', fontSize: '12px' }}>
                            Net Billable Payload: {( (selectedRecord.acceptedNetWeightKg || selectedRecord.netWeightKg) / 1000.0).toFixed(2)} TON
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Weight Discrepancy Row */}
                    <div 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '10px 12px', 
                        backgroundColor: ocr.matchResult === 'MISMATCH' ? 'var(--error-50)' : 'var(--neutral-0)', 
                        borderRadius: '8px', 
                        border: ocr.matchResult === 'MISMATCH' ? '1px solid var(--error-600)' : '1px solid var(--neutral-200)' 
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '9px', color: ocr.matchResult === 'MISMATCH' ? 'var(--error-600)' : 'var(--neutral-500)', fontWeight: 700 }}>OCR EXTRACTED NET</p>
                        <p style={{ fontWeight: 700, fontSize: '13px', color: ocr.matchResult === 'MISMATCH' ? 'var(--error-600)' : 'var(--neutral-800)' }}>
                          {ocr.extracted.weight.toFixed(2)} TON
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '9px', color: ocr.matchResult === 'MISMATCH' ? 'var(--error-600)' : 'var(--neutral-500)', fontWeight: 700 }}>SAP WEIGHBRIDGE NET</p>
                        <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--success-600)' }}>
                          {(selectedRecord.netWeightKg / 1000.0).toFixed(2)} TON
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
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
                    className="btn btn-success"
                    style={{ minWidth: '130px' }}
                  >
                    {isSubmitting ? 'Approving...' : 'Approve & Pass POD'}
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
                    >
                      Flag for Review
                    </button>
                    <button 
                      onClick={() => setShowConfirmOverride(true)} 
                      disabled={isSubmitting} 
                      className="btn btn-primary"
                      style={{ backgroundColor: 'var(--warning-600)', borderColor: 'var(--warning-600)' }}
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
                      className="btn btn-primary"
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

      {/* Override Confirm Modal */}
      <Modal
        isOpen={showConfirmOverride}
        onClose={() => setShowConfirmOverride(false)}
        title="Confirm Manual Override"
        width="460px"
      >
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={36} style={{ color: 'var(--warning-600)', marginBottom: '16px' }} />
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '8px' }}>
            Discrepancy Manual Override
          </p>
          <p style={{ fontSize: '13px', color: 'var(--neutral-500)', marginBottom: '24px', lineHeight: 1.5 }}>
            Please confirm that you have physically inspected the uploaded delivery slip and verified that the weighbridge Net payload is accurate despite the OCR scan variance.
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
              style={{ backgroundColor: 'var(--warning-600)', borderColor: 'var(--warning-600)' }}
            >
              {isSubmitting ? 'Processing...' : 'Confirm & Approve Override'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={selectedRecord ? `Reject POD — Waybill #${selectedRecord.waybillNo}` : ''}
        width="480px"
      >
        <form onSubmit={handleRejectSubmit}>
          <div className="form-group">
            <label>REJECTION REASON</label>
            <select 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="form-input"
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
                placeholder="Specify rejection details..."
                className="form-input"
                style={{ minHeight: '90px', resize: 'vertical' }}
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
              className="btn btn-destructive"
              style={{ backgroundColor: 'var(--error-600)', color: '#ffffff' }}
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
