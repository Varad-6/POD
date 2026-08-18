import React, { useState, useEffect } from 'react';
import { Truck, Upload, AlertCircle, CheckCircle2, Clock, ClipboardList } from 'lucide-react';
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
import { assignmentsApi, drApi } from '../lib/api_v3';

export const TransporterPODs: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('ALL');
  
  // Modal states
  const [uploadingAssignment, setUploadingAssignment] = useState<any | null>(null);
  const [uploadStep, setUploadStep] = useState<'UPLOAD' | 'PROCESSING' | 'RESULT'>('UPLOAD');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [ocrData, setOcrData] = useState<any | null>(null);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const list = await assignmentsApi.list();
      setAssignments(list);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  // Map backend status to frontend podStatus
  const getMappedPodStatus = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'PENDING_POD';
      case 'POD_UPLOADED':
        return 'SUBMITTED_AWAITING_APPROVAL';
      case 'UNDER_REVIEW':
        return 'LOW_CONFIDENCE';
      case 'APPROVED':
        return 'APPROVED_INVOICE_PENDING';
      case 'INVOICED':
      case 'MIRO_PARKED':
      case 'MIRO_POSTED':
      case 'CLEARED':
        return 'APPROVED';
      case 'GATE_DENIED':
        return 'REJECTED';
      default:
        return 'PENDING_POD';
    }
  };

  // Filters assignments
  const filteredAssignments = assignments
    .map(a => ({
      ...a,
      podStatus: getMappedPodStatus(a.status),
      waybillNo: a.ocr_waybill_extracted || `WB-${a.id}`,
      productDescription: a.material || 'Coal Grade A',
      horseRegNo: a.vehicle_reg || 'TEMP-REG',
      poRef: a.sap_po_no || 'PO-TEMP',
      offloadDate: a.scheduled_date || new Date().toISOString(),
      netWeightKg: a.ocr_weight_extracted ? a.ocr_weight_extracted * 1000 : 34000
    }))
    .filter((rec) => {
      if (activeFilter === 'PENDING') return rec.podStatus === 'PENDING_POD';
      if (activeFilter === 'SUBMITTED') return rec.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || rec.podStatus === 'LOW_CONFIDENCE';
      if (activeFilter === 'APPROVED') return rec.podStatus.startsWith('APPROVED') || rec.podStatus === 'APPROVED_INVOICE_PENDING';
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
    if (!uploadingAssignment) return;
    setUploadStep('PROCESSING');

    setTimeout(() => {
      let key = "WB-998807";
      if (selectedFileName && selectedFileName.includes('mismatch')) {
        key = "WB-998808";
      } else if (selectedFileName && selectedFileName.includes('blurry')) {
        key = "WB-998809";
      }
      const data = OCR_RESULTS[key as keyof typeof OCR_RESULTS];
      setOcrData(data);
      setUploadStep('RESULT');
    }, 2100);
  };

  const handleFinalSubmit = async () => {
    if (!uploadingAssignment || !selectedFileName) return;
    try {
      await drApi.uploadPod(uploadingAssignment.id, { pod_file_url: selectedFileName });
      setUploadingAssignment(null);
      setUploadStep('UPLOAD');
      setSelectedFileName(null);
      setSelectedFileObj(null);
      setOcrData(null);
      loadAssignments();
    } catch (err) {
      console.error('Failed to submit POD:', err);
      alert('Error submitting POD for verification');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <PageHeader 
        title="Delivery Receipts (POD) Upload Desk"
        subtitle="Upload signed delivery papers for OCR checking and approval"
        actions={
          <Tabs 
            tabs={[
              { id: 'ALL', label: 'All Trips', count: assignments.length },
              { id: 'PENDING', label: 'Need Receipt (POD)', count: assignments.filter(r => getMappedPodStatus(r.status) === 'PENDING_POD').length },
              { id: 'SUBMITTED', label: 'Waiting for Approval', count: assignments.filter(r => getMappedPodStatus(r.status) === 'SUBMITTED_AWAITING_APPROVAL' || getMappedPodStatus(r.status) === 'LOW_CONFIDENCE').length },
              { id: 'APPROVED', label: 'Approved', count: assignments.filter(r => getMappedPodStatus(r.status).startsWith('APPROVED') || getMappedPodStatus(r.status) === 'APPROVED_INVOICE_PENDING').length },
              { id: 'REJECTED', label: 'Rejected', count: assignments.filter(r => getMappedPodStatus(r.status) === 'REJECTED').length },
            ]}
            activeTab={activeFilter}
            onChange={(id) => setActiveFilter(id as any)}
          />
        }
      />

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Loading receipts...</div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState 
          icon={<ClipboardList size={48} />}
          title="No Trips Found"
          description="Wait for unloading yard to weigh the truck or change tabs to see past runs."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredAssignments.map((rec) => (
            <Card key={rec.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                  onClick={() => setUploadingAssignment(rec)}
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
                  onClick={() => setUploadingAssignment(rec)}
                  className="btn btn-dark"
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  <Upload size={16} />
                  Re-upload POD Slip
                </button>
              )}

              {(rec.podStatus === 'APPROVED') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-600)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <CheckCircle2 size={16} />
                  Approved — Invoice Raised
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
        isOpen={!!uploadingAssignment}
        onClose={() => { if (uploadStep !== 'PROCESSING') setUploadingAssignment(null); }}
        title={uploadingAssignment ? `Upload Proof of Delivery — Waybill #${uploadingAssignment.waybillNo}` : ''}
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
              <button onClick={() => setUploadingAssignment(null)} className="btn btn-ghost">Cancel</button>
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

        {uploadStep === 'RESULT' && ocrData && uploadingAssignment && (
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
                        {uploadingAssignment.waybillNo}
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
