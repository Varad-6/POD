import React, { useState } from 'react';
import { Truck, Upload, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useDemo, OffloadRecord } from '../context/DemoContext';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { FileUploadBox } from '../components/FileUploadBox';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatDate } from '../utils/format';
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

    setTimeout(() => {
      setUploadStep('RESULT');
    }, 2100);
  };

  const handleFinalSubmit = async () => {
    if (!uploadingRecord || !selectedFileName) return;
    await uploadPOD(uploadingRecord.waybillNo, selectedFileName);
    setUploadingRecord(null);
    setUploadStep('UPLOAD');
    setSelectedFileName(null);
    setSelectedFileObj(null);
  };

  const getOCRData = () => {
    if (!uploadingRecord || !selectedFileName) return null;
    let key = "WB-998807";
    if (selectedFileName.includes('mismatch')) {
      key = "WB-998808";
    } else if (selectedFileName.includes('blurry')) {
      key = "WB-998809";
    }
    return OCR_RESULTS[key as keyof typeof OCR_RESULTS];
  };

  const ocrData = getOCRData() as any;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <PageHeader 
        title="Proof of Delivery Uploads Desk"
        subtitle="Upload scanned delivery slips for AI OCR validation, 4-point weight verification, and admin approval"
        actions={
          <Tabs 
            tabs={[
              { id: 'ALL', label: 'All Runs', count: offloadRecords.length },
              { id: 'PENDING', label: 'Pending POD', count: offloadRecords.filter(r => r.podStatus === 'PENDING_POD').length },
              { id: 'SUBMITTED', label: 'Submitted', count: offloadRecords.filter(r => r.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || r.podStatus === 'LOW_CONFIDENCE').length },
              { id: 'APPROVED', label: 'Approved', count: offloadRecords.filter(r => r.podStatus.startsWith('APPROVED')).length },
              { id: 'REJECTED', label: 'Rejected', count: offloadRecords.filter(r => r.podStatus === 'REJECTED').length },
            ]}
            activeTab={activeFilter}
            onChange={(id) => setActiveFilter(id as any)}
          />
        }
      />

      {/* Grid List */}
      {filteredRecords.length === 0 ? (
        <EmptyState 
          message="No delivery records match active filter" 
          submessage="Wait for weighbridge offload logging or toggle filters to view past runs."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredRecords.map((rec) => (
            <Card key={rec.waybillNo} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                <div>
                  <h3 className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neutral-900)', marginBottom: '2px' }}>
                    #{rec.waybillNo}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 500 }}>
                    Offload Date: {formatDate(rec.offloadDate)}
                  </p>
                </div>
                <StatusBadge status={rec.podStatus} />
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Material</p>
                  <p style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{rec.productDescription}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Net Weight</p>
                  <p className="mono" style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>{((rec.netWeightKg || 34000) / 1000.0).toFixed(2)} Tons</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>Truck Reg</p>
                  <p className="mono" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Truck size={14} style={{ color: 'var(--neutral-500)' }} />
                    {rec.horseRegNo}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', fontWeight: 700, textTransform: 'uppercase' }}>PO Ref</p>
                  <p 
                    onClick={() => navigate('/transporter/purchase-orders')}
                    className="mono"
                    style={{ fontWeight: 700, color: 'var(--accent-blue)', cursor: 'pointer' }}
                  >
                    #{rec.poRef}
                  </p>
                </div>
              </div>

              {rec.podStatus === 'REJECTED' && rec.rejectionReason && (
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--error-50)', color: 'var(--error-700)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-600)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <Clock size={16} />
                  Submitted — Awaiting Approval
                </div>
              )}

              {rec.podStatus === 'LOW_CONFIDENCE' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning-600)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <AlertCircle size={16} />
                  Submitted — Flagged for Admin Review
                </div>
              )}

              {rec.podStatus === 'REJECTED' && (
                <button 
                  onClick={() => setUploadingRecord(rec)}
                  className="btn btn-dark"
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  <Upload size={16} />
                  Re-upload POD Slip
                </button>
              )}

              {(rec.podStatus === 'APPROVED' || rec.podStatus === 'APPROVED_MISMATCH_OVERRIDE') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-600)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <CheckCircle2 size={16} />
                  Approved — Ready to Invoice
                </div>
              )}

              {rec.podStatus === 'APPROVED_INVOICE_PENDING' && (
                <button 
                  onClick={() => navigate('/transporter/invoices')}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto' }}
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
        title={uploadingRecord ? `Upload Proof of Delivery — Waybill #${uploadingRecord.waybillNo}` : ''}
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
              <button onClick={() => setUploadingRecord(null)} className="btn btn-ghost">Cancel</button>
              <button 
                onClick={handleSubmitVerification} 
                disabled={!selectedFileName}
                className="btn btn-primary"
              >
                Submit for AI OCR Verification
              </button>
            </div>
          </div>
        )}

        {uploadStep === 'PROCESSING' && (
          <LoadingSpinner />
        )}

        {uploadStep === 'RESULT' && ocrData && uploadingRecord && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: '8px' }}>DOCUMENT PREVIEW</h4>
                <div style={{ width: '100%', height: '240px', border: '1px solid var(--neutral-200)', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--neutral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedFileObj ? (
                    <img 
                      src={URL.createObjectURL(selectedFileObj)} 
                      alt="Uploaded slip" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ color: 'var(--neutral-500)', fontSize: '12px' }}>Slip Preview</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase' }}>OCR FIELD COMPARISON</h4>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--neutral-600)' }}>Confidence: {(ocrData.confidence * 100).toFixed(0)}%</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--neutral-50)', borderRadius: '6px', border: '1px solid var(--neutral-200)' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--neutral-500)', fontWeight: 700 }}>EXTRACTED WAYBILL</p>
                      <p className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{ocrData.extracted.waybillNo}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '10px', color: 'var(--neutral-500)', fontWeight: 700 }}>SAP SYSTEM</p>
                      <p className="mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--success-600)' }}>
                        {uploadingRecord.waybillNo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setUploadStep('UPLOAD'); handleClearFile(); }} 
                className="btn btn-ghost"
              >
                Re-upload
              </button>
              <button 
                onClick={handleFinalSubmit}
                className="btn btn-primary"
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
