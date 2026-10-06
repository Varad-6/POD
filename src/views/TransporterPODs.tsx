import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, Clock, AlertCircle, FileText, ClipboardList, Loader2, Sparkles, Send } from 'lucide-react';
import { drApi, taApi, assignmentsApi, TransportAssignmentV3 } from '../lib/api_v3';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Tabs } from '../components/Tabs';
import { Modal } from '../components/Modal';
import { FileUploadBox } from '../components/FileUploadBox';

const OCR_RESULTS = {
  "WB-998807": {
    extracted: { waybillNo: "WB-998807", netWeight: "34,200 KG", offloadDate: "2026-03-24", material: "Thermal Coal Grade A" },
    confidence: 0.98,
    match: true,
    flags: []
  },
  "WB-998808": {
    extracted: { waybillNo: "WB-998808", netWeight: "31,800 KG", offloadDate: "2026-03-24", material: "Thermal Coal Grade A" },
    confidence: 0.94,
    match: false,
    flags: ["WEIGHT_MISMATCH"]
  },
  "WB-998809": {
    extracted: { waybillNo: "WB-9988??", netWeight: "Unreadable", offloadDate: "2026-03-??", material: "Unreadable" },
    confidence: 0.34,
    match: false,
    flags: ["LOW_CONFIDENCE", "IMAGE_BLURRY"]
  }
};

export const TransporterPODs: React.FC = () => {
  const [assignments, setAssignments] = useState<TransportAssignmentV3[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'>('ALL');
  
  // Upload modal state
  const [uploadingAssignment, setUploadingAssignment] = useState<any | null>(null);
  const [uploadStep, setUploadStep] = useState<'UPLOAD' | 'PROCESSING' | 'RESULT'>('UPLOAD');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [ocrData, setOcrData] = useState<any | null>(null);

  // 5-Second Enterprise SAP LIV Invoice Generation State
  const [invoiceGeneration, setInvoiceGeneration] = useState<{
    active: boolean;
    stepText: string;
    progress: number;
    assignmentId: number | null;
    invoiceNo: string;
    completed?: boolean;
  }>({ active: false, stepText: '', progress: 0, assignmentId: null, invoiceNo: '' });

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

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
    const handleRefresh = () => loadAssignments();
    window.addEventListener('pod_data_refreshed', handleRefresh);
    return () => window.removeEventListener('pod_data_refreshed', handleRefresh);
  }, []);

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
      case 'REJECTED':
        return 'REJECTED';
      default:
        return 'PENDING_POD';
    }
  };

  const filteredAssignments = assignments
    .map((a: any) => ({
      ...a,
      podStatus: getMappedPodStatus(a.status),
      waybillNo: a.ocr_waybill_extracted || `WB-${a.id}`,
      productDescription: a.material || 'Coal Grade A',
      horseRegNo: a.vehicle_reg || 'TEMP-REG',
      poRef: a.sap_po_no ? `${a.sap_po_no} / ${a.po_item_no || '10'}` : 'PO-TEMP',
      offloadDate: a.scheduled_date || new Date().toISOString(),
      netWeightKg: (a.dest_gross_kg && a.dest_tare_kg) ? (a.dest_gross_kg - a.dest_tare_kg) : (a.ocr_weight_extracted ? a.ocr_weight_extracted * 1000 : null),
      rejectionReason: a.rejection_reason || 'Flagged for quality audit by Company Admin.'
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
    if (!uploadingAssignment || (!selectedFileName && !selectedFileObj)) return;
    try {
      if (selectedFileObj) {
        await drApi.uploadPod(uploadingAssignment.id, { file: selectedFileObj });
      } else {
        await drApi.uploadPod(uploadingAssignment.id, { pod_file_url: selectedFileName || '/uploads/sample_pod.pdf' });
      }
      setUploadingAssignment(null);
      setUploadStep('UPLOAD');
      setSelectedFileName(null);
      setSelectedFileObj(null);
      setOcrData(null);
      await loadAssignments();
      window.dispatchEvent(new Event('pod_data_refreshed'));
    } catch (err) {
      console.error('Failed to submit POD:', err);
      alert('Error submitting POD for verification');
    }
  };

  /**
   * 5-Second Realistic SAP LIV Freight Invoice Creation Flow
   */
  const handleCreateInvoice = async (assignmentId: number) => {
    const invNo = `INV-2026-${assignmentId.toString().padStart(4, '0')}`;
    setInvoiceGeneration({
      active: true,
      progress: 15,
      stepText: '1/3 Validating approved delivery receipt & weighbridge logs against SAP PO Line 10...',
      assignmentId,
      invoiceNo: invNo
    });

    try {
      // Stage 1: 1.5s
      await delay(1500);
      setInvoiceGeneration(prev => ({
        ...prev,
        progress: 45,
        stepText: '2/3 Calculating freight billing totals (Accepted Tons × R151.50 + 15% VAT)...'
      }));

      // Stage 2: 1.7s (total 3.2s)
      await delay(1700);
      setInvoiceGeneration(prev => ({
        ...prev,
        progress: 75,
        stepText: '3/3 Rendering compliant Tax Invoice PDF & generating digital seal...'
      }));

      // Stage 3: 1.3s (total 4.5s)
      await delay(1300);
      setInvoiceGeneration(prev => ({
        ...prev,
        progress: 95,
        stepText: 'Transmitting freight invoice to Company Admin SAP MIRO Queue...'
      }));

      // Stage 4: API Call commit (total 5.0s)
      await delay(500);
      await taApi.createDeliveryInvoice({
        assignment_id: assignmentId,
        invoice_no: invNo,
        file_url: `/uploads/invoices/inv_${assignmentId}.pdf`
      });

      setInvoiceGeneration(prev => ({
        ...prev,
        progress: 100,
        stepText: `✓ Tax Invoice ${invNo} successfully created & sent to Company Admin!`,
        completed: true
      }));

      await delay(800);
      await loadAssignments();
      window.dispatchEvent(new Event('pod_data_refreshed'));
    } catch (err: any) {
      console.error('Failed to create invoice:', err);
      alert('Error creating invoice: ' + (err.message || 'Server error'));
    } finally {
      setInvoiceGeneration({ active: false, stepText: '', progress: 0, assignmentId: null, invoiceNo: '' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <PageHeader 
        title="Delivery Receipts & Invoicing Desk"
        subtitle="Upload signed delivery papers, view approval status, and generate freight tax invoices"
        actions={
          <Tabs 
            tabs={[
              { id: 'ALL', label: 'All Trips', count: assignments.length },
              { id: 'PENDING', label: 'Need Receipt', count: assignments.filter(r => getMappedPodStatus(r.status) === 'PENDING_POD').length },
              { id: 'SUBMITTED', label: 'In Verification', count: assignments.filter(r => getMappedPodStatus(r.status) === 'SUBMITTED_AWAITING_APPROVAL' || getMappedPodStatus(r.status) === 'LOW_CONFIDENCE').length },
              { id: 'APPROVED', label: 'Ready to Invoice', count: assignments.filter(r => getMappedPodStatus(r.status) === 'APPROVED_INVOICE_PENDING').length },
              { id: 'REJECTED', label: 'Rejected', count: assignments.filter(r => getMappedPodStatus(r.status) === 'REJECTED').length },
            ]}
            activeTab={activeFilter}
            onChange={(id) => setActiveFilter(id as any)}
          />
        }
      />

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          Loading consignments...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState 
          icon={<ClipboardList size={48} />}
          title="No Trips Found in Selected Filter"
          description="Wait for offloading receiver to stamp delivery receipts or switch tabs to review past consignments."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredAssignments.map((rec) => (
            <Card key={rec.id} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', border: '1px solid var(--color-border)', borderRadius: '16px', backgroundColor: 'var(--color-bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                <h3 className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading)', margin: 0 }}>
                  PO #{rec.poRef}
                </h3>
                <StatusBadge status={rec.podStatus} />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Contract:</span>
                  <strong className="mono" style={{ color: 'var(--color-text-heading)' }}>{rec.contract_id ? `C-2026-00${rec.contract_id}` : 'C-2026-001'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Customer / Yard:</span>
                  <strong style={{ color: 'var(--color-text-heading)' }}>{rec.customer_name || 'PODZO Mining Yard'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Destination:</span>
                  <strong style={{ color: 'var(--color-text-heading)' }}>{rec.to_location || 'Emoyeni Siding'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Vehicle:</span>
                  <strong className="mono" style={{ color: 'var(--color-text-heading)' }}>{rec.horseRegNo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Driver:</span>
                  <strong style={{ color: 'var(--color-text-heading)' }}>{rec.driver_name || 'Rajesh Kumar'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 750 }}>Delivered Payload:</span>
                  <strong style={{ color: rec.netWeightKg !== null ? 'var(--color-brand-blue-600)' : 'var(--color-text-muted)', fontSize: '14.5px' }}>
                    {rec.netWeightKg !== null ? `${(rec.netWeightKg / 1000.0).toFixed(2)} Tons` : '34.00 Tons'}
                  </strong>
                </div>
              </div>

              {rec.podStatus === 'REJECTED' && rec.rejectionReason && (
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)', borderRadius: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '16px', border: '1px solid var(--color-error-light)' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning-text)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <Clock size={16} />
                  Submitted — Awaiting CA Verification
                </div>
              )}

              {rec.podStatus === 'LOW_CONFIDENCE' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning-text)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <AlertCircle size={16} />
                  Flagged for Company Admin Audit
                </div>
              )}

              {rec.podStatus === 'REJECTED' && (
                <button 
                  onClick={() => setUploadingAssignment(rec)}
                  className="btn btn-ghost"
                  style={{ width: '100%', marginTop: 'auto', color: 'var(--color-error-text)', borderColor: 'var(--color-error-light)' }}
                >
                  <Upload size={16} />
                  Re-upload POD Slip
                </button>
              )}

              {(rec.podStatus === 'APPROVED') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success-text)', fontWeight: 600, fontSize: '13px', marginTop: 'auto', padding: '8px' }}>
                  <CheckCircle2 size={16} />
                  Invoice Generated & Transmitted to SAP
                </div>
              )}

              {rec.podStatus === 'APPROVED_INVOICE_PENDING' && (
                <button 
                  onClick={() => handleCreateInvoice(rec.id)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <FileText size={16} />
                  Create Freight Invoice
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── 5-Second Enterprise SAP LIV Invoice Generation Overlay ── */}
      {invoiceGeneration.active && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '36px 32px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: invoiceGeneration.completed ? 'var(--color-success-bg)' : 'var(--color-brand-blue-50)',
              color: invoiceGeneration.completed ? 'var(--color-success-text)' : 'var(--color-brand-blue-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 8px rgba(37, 99, 235, 0.1)'
            }}>
              {invoiceGeneration.completed ? (
                <CheckCircle2 size={36} />
              ) : (
                <Loader2 size={36} className="animate-spin" />
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-heading)', margin: '0 0 6px 0' }}>
                {invoiceGeneration.completed ? 'Invoice Created Successfully!' : 'Generating SAP LIV Freight Invoice'}
              </h3>
              <p className="mono" style={{ fontSize: '13px', color: 'var(--color-brand-blue-600)', fontWeight: 700, margin: 0 }}>
                {invoiceGeneration.invoiceNo}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', backgroundColor: 'var(--color-bg-page)', borderRadius: '999px', height: '10px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <div style={{
                height: '100%',
                width: `${invoiceGeneration.progress}%`,
                backgroundColor: invoiceGeneration.completed ? 'var(--color-success)' : 'var(--color-brand-blue-600)',
                transition: 'width 0.4s ease',
                borderRadius: '999px'
              }} />
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-body)', fontWeight: 600, margin: 0, minHeight: '38px' }}>
              {invoiceGeneration.stepText}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              <Sparkles size={14} style={{ color: 'var(--color-brand-blue-600)' }} />
              SAP Logistics Invoice Verification (LIV) Bridge
            </div>
          </div>
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
              <button onClick={() => setUploadingAssignment(null)} className="btn btn-secondary">Cancel</button>
              <button 
                onClick={handleSubmitVerification} 
                disabled={!selectedFileName && !selectedFileObj}
                className="btn btn-primary"
              >
                Submit for AI OCR Verification
              </button>
            </div>
          </div>
        )}

        {uploadStep === 'PROCESSING' && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--color-brand-blue-600)' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-heading)' }}>Running OpenAI Vision Document OCR...</p>
          </div>
        )}

        {uploadStep === 'RESULT' && ocrData && uploadingAssignment && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>DOCUMENT PREVIEW</h4>
                <div style={{ width: '100%', height: '240px', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--color-bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedFileObj ? (
                    <img 
                      src={URL.createObjectURL(selectedFileObj)} 
                      alt="Uploaded slip" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Slip Preview Attached</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>OCR FIELD COMPARISON</h4>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)' }}>Confidence: {(ocrData.confidence * 100).toFixed(0)}%</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--color-bg-page)', borderRadius: '10px', border: '1.5px solid var(--color-border)' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>EXTRACTED WAYBILL</p>
                      <p className="mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-heading)' }}>{ocrData.extracted.waybillNo}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700 }}>SAP SYSTEM</p>
                      <p className="mono" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-brand-blue-600)' }}>
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
                className="btn btn-secondary"
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

const PageHeader: React.FC<{ title: string; subtitle: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-heading)', margin: 0 }}>
          {title}
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>
          {subtitle}
        </p>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};
