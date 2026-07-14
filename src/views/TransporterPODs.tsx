import React, { useState } from 'react';
import { Truck, Upload, AlertCircle, CheckCircle2, FileClock, Clock } from 'lucide-react';
import { useDemo, OffloadRecord } from '../context/DemoContext';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { FileUploadBox } from '../components/FileUploadBox';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/format';
import { OCR_RESULTS } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

export const TransporterPODs: React.FC = () => {
  const { offloadRecords, uploadPOD } = useDemo();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('ALL');
  
  // Modal states
  const [uploadingRecord, setUploadingRecord] = useState<OffloadRecord | null>(null);
  const [uploadStep, setUploadStep] = useState<'UPLOAD' | 'PROCESSING' | 'RESULT'>('UPLOAD');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);

  // Filters records
  const filteredRecords = offloadRecords.filter((rec) => {
    if (activeFilter === 'PENDING') return rec.podStatus === 'PENDING_POD';
    if (activeFilter === 'SUBMITTED') return rec.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || rec.podStatus === 'LOW_CONFIDENCE';
    if (activeFilter === 'APPROVED') return rec.podStatus.startsWith('APPROVED');
    if (activeFilter === 'REJECTED') return rec.podStatus === 'REJECTED';
    return true;
  });

  const handleFileSelect = (fileName: string, file: File | null) => {
    setSelectedFileName(fileName);
    setSelectedFileObj(file);
  };

  const handleClearFile = () => {
    setSelectedFileName(null);
    setSelectedFileObj(null);
  };

  const handleSubmitVerification = () => {
    if (!uploadingRecord) return;
    setUploadStep('PROCESSING');

    // Simulate 2.1-second processing time
    setTimeout(() => {
      setUploadStep('RESULT');
    }, 2100);
  };

  const handleFinalSubmit = async () => {
    if (!uploadingRecord || !selectedFileName) return;
    
    await uploadPOD(uploadingRecord.waybillNo, selectedFileName);
    
    // Cleanup
    setUploadingRecord(null);
    setUploadStep('UPLOAD');
    setSelectedFileName(null);
    setSelectedFileObj(null);
  };

  // Get simulated OCR data based on uploaded filename
  const getOCRData = () => {
    if (!uploadingRecord || !selectedFileName) return null;
    
    // Look up in OCR_RESULTS based on waybill
    // We map uploaded filenames to specific waybills for the demo:
    // delivery-slip-match.jpg -> WB-998821
    // delivery-slip-mismatch.jpg -> WB-998841
    // delivery-slip-blurry.jpg -> WB-998850
    let key = "WB-998821"; // default happy match
    
    if (selectedFileName.includes('mismatch')) {
      key = "WB-998841";
    } else if (selectedFileName.includes('blurry')) {
      key = "WB-998850";
    }
    
    return OCR_RESULTS[key as keyof typeof OCR_RESULTS];
  };

  const filterTabStyle = (active: boolean): React.CSSProperties => ({
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

  const ocrData = getOCRData() as any;

  return (
    <div>
      {/* Tabs Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => setActiveFilter('ALL')} style={filterTabStyle(activeFilter === 'ALL')}>All</button>
        <button onClick={() => setActiveFilter('PENDING')} style={filterTabStyle(activeFilter === 'PENDING')}>Pending POD</button>
        <button onClick={() => setActiveFilter('SUBMITTED')} style={filterTabStyle(activeFilter === 'SUBMITTED')}>Submitted</button>
        <button onClick={() => setActiveFilter('APPROVED')} style={filterTabStyle(activeFilter === 'APPROVED')}>Approved</button>
        <button onClick={() => setActiveFilter('REJECTED')} style={filterTabStyle(activeFilter === 'REJECTED')}>Rejected</button>
      </div>

      {/* Grid List */}
      {filteredRecords.length === 0 ? (
        <EmptyState 
          message="No delivery records found" 
          submessage="Check your filters or wait for new weighbridge entries."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {filteredRecords.map((rec) => (
            <Card key={rec.waybillNo} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header block with flex to avoid badge collisions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '4px' }}>
                    Waybill #{rec.waybillNo}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', fontWeight: 500 }}>
                    Offload Date: {formatDate(rec.offloadDate)}
                  </p>
                </div>
                <StatusBadge status={rec.podStatus} />
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Material</p>
                  <p style={{ fontWeight: 600 }}>{rec.productDescription}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Weighbridge Weight</p>
                  <p style={{ fontWeight: 600 }}>{(rec.netWeightKg / 1000.0).toFixed(2)} Tons</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Truck Number</p>
                  <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Truck size={14} style={{ color: 'var(--neutral-secondary)' }} />
                    {rec.horseRegNo}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>PO Reference</p>
                  <p 
                    onClick={() => navigate('/transporter/purchase-orders')}
                    style={{ fontWeight: 600, color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    #{rec.poRef}
                  </p>
                </div>
              </div>

              {/* Mismatch note */}
              {rec.podStatus === 'REJECTED' && rec.rejectionReason && (
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: '6px', fontSize: '12px', fontWeight: 500, marginBottom: '16px' }}>
                  <strong>Rejection Reason:</strong> {rec.rejectionReason}
                </div>
              )}

              {/* Action Buttons */}
              {rec.podStatus === 'PENDING_POD' && (
                <button 
                  onClick={() => setUploadingRecord(rec)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  <Upload size={16} />
                  Upload POD Slip
                </button>
              )}

              {rec.podStatus === 'SUBMITTED_AWAITING_APPROVAL' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-text)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <Clock size={16} />
                  Submitted — Awaiting Approval
                </div>
              )}

              {rec.podStatus === 'LOW_CONFIDENCE' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-text)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <AlertCircle size={16} />
                  Submitted — Flagged for Admin Review
                </div>
              )}

              {rec.podStatus === 'REJECTED' && (
                <button 
                  onClick={() => setUploadingRecord(rec)}
                  className="btn btn-destructive"
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  <Upload size={16} />
                  Re-upload POD Slip
                </button>
              )}

              {(rec.podStatus === 'APPROVED' || rec.podStatus === 'APPROVED_MISMATCH_OVERRIDE') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-text)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <CheckCircle2 size={16} />
                  Approved — Ready to Invoice
                </div>
              )}

              {rec.podStatus === 'APPROVED_INVOICE_PENDING' && (
                <button 
                  onClick={() => navigate('/transporter/invoices')}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                >
                  Create Invoice
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Upload POD Modal */}
      <Modal
        isOpen={!!uploadingRecord}
        onClose={() => { if (uploadStep !== 'PROCESSING') setUploadingRecord(null); }}
        title={uploadingRecord ? `Upload Proof of Delivery — Waybill ${uploadingRecord.waybillNo}` : ''}
        width={uploadStep === 'RESULT' ? '720px' : '500px'}
      >
        {uploadStep === 'UPLOAD' && (
          <div>
            <FileUploadBox 
              onFileSelect={handleFileSelect}
              selectedFileName={selectedFileName}
              onClear={handleClearFile}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setUploadingRecord(null)} className="btn btn-secondary">Cancel</button>
              <button 
                onClick={handleSubmitVerification} 
                disabled={!selectedFileName}
                className="btn btn-primary"
              >
                Submit for Verification
              </button>
            </div>
          </div>
        )}

        {uploadStep === 'PROCESSING' && (
          <LoadingSpinner />
        )}

        {uploadStep === 'RESULT' && ocrData && uploadingRecord && (
          <div>
            {/* Split Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Left Panel: Preview */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-secondary)', marginBottom: '12px' }}>UPLOADED DOCUMENT</h4>
                <div style={{ width: '100%', height: '240px', border: '1px solid var(--border-grey)', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedFileObj ? (
                    <img 
                      src={URL.createObjectURL(selectedFileObj)} 
                      alt="Uploaded slip" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ color: 'var(--neutral-secondary)' }}>File Preview</span>
                  )}
                </div>
              </div>

              {/* Right Panel: OCR Comparison Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-secondary)' }}>OCR FIELD COMPARISON</h4>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neutral-secondary)' }}>Confidence: {(ocrData.confidence * 100).toFixed(0)}%</span>
                </div>

                {/* Banner Warnings */}
                {ocrData.matchResult === 'LOW_CONFIDENCE' && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <AlertCircle size={14} />
                    Unclear document. Flags manual review.
                  </div>
                )}
                {ocrData.matchResult === 'MISMATCH' && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <AlertCircle size={14} />
                    Data discrepancy found!
                  </div>
                )}

                {/* Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Waybill */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid var(--border-grey)' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>WAYBILL NUMBER</p>
                      <p style={{ fontWeight: 600, fontSize: '13px' }}>{ocrData.extracted.waybillNo}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>SAP SYSTEM</p>
                      <p style={{ fontWeight: 600, fontSize: '13px', color: ocrData.extracted.waybillNo === uploadingRecord.waybillNo ? 'var(--success-text)' : 'var(--error-text)' }}>
                        {uploadingRecord.waybillNo}
                      </p>
                    </div>
                  </div>

                  {/* Truck No */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid var(--border-grey)' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>TRUCK LICENSE</p>
                      <p style={{ fontWeight: 600, fontSize: '13px' }}>{ocrData.extracted.truckNo}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '10px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>SAP SYSTEM</p>
                      <p style={{ fontWeight: 600, fontSize: '13px', color: ocrData.extracted.truckNo === uploadingRecord.horseRegNo ? 'var(--success-text)' : 'var(--error-text)' }}>
                        {uploadingRecord.horseRegNo}
                      </p>
                    </div>
                  </div>

                  {/* Weight */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '10px 12px', 
                      backgroundColor: ocrData.mismatchField === 'weight' ? 'var(--error-bg)' : '#fafafa', 
                      borderRadius: '6px', 
                      border: ocrData.mismatchField === 'weight' ? '1px solid var(--error-text)' : '1px solid var(--border-grey)' 
                    }}
                  >
                    <div>
                       <p style={{ fontSize: '10px', color: ocrData.mismatchField === 'weight' ? 'var(--error-text)' : 'var(--neutral-secondary)', fontWeight: 600 }}>DELIVERED WEIGHT</p>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: ocrData.mismatchField === 'weight' ? 'var(--error-text)' : 'var(--neutral-primary)' }}>
                        {ocrData.extracted.weight.toFixed(2)} Tons
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '10px', color: ocrData.mismatchField === 'weight' ? 'var(--error-text)' : 'var(--neutral-secondary)', fontWeight: 600 }}>SAP SYSTEM</p>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--success-text)' }}>
                        {(uploadingRecord.netWeightKg / 1000.0).toFixed(2)} Tons
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note */}
            {(ocrData.matchResult === 'MISMATCH' || ocrData.matchResult === 'LOW_CONFIDENCE') && (
              <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', fontStyle: 'italic', marginBottom: '20px' }}>
                Note: Discrepancies and low-confidence characters will trigger manual verification loops for the mine manager.
              </p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setUploadStep('UPLOAD'); handleClearFile(); }} 
                className="btn btn-secondary"
              >
                Re-upload File
              </button>
              <button 
                onClick={handleFinalSubmit}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                Submit for Approval
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
