import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileClock, Users, CheckCircle, XCircle, AlertTriangle, ArrowRight, ShieldCheck, Server, Truck, Activity } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { Card } from '../components/Card';
import { formatDate } from '../utils/format';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { offloadRecords, invoices, purchaseOrders, contracts } = useDemo();

  // Metric calculations
  const pendingApprovalsCount = offloadRecords.filter(
    (rec) => rec.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || rec.podStatus === 'LOW_CONFIDENCE'
  ).length;

  const parkedInvoicesCount = invoices.filter((inv) => inv.status === 'PARKED').length;
  const postedInvoicesCount = invoices.filter((inv) => inv.status === 'POSTED' || inv.status === 'PAID').length;
  const totalTransportersCount = 4; // Sipho, VDM, CBS, ONYX, MPL

  const totalDeliveredTons = offloadRecords
    .filter((r) => r.podStatus === 'APPROVED' || r.podStatus === 'APPROVED_MISMATCH_OVERRIDE' || r.podStatus === 'PAID')
    .reduce((acc, r) => acc + (r.acceptedNetWeightKg || r.arrivalNetWeightKg || r.dispatchNetWeightKg || 0) / 1000, 0);

  // Generate real audit activity feed
  const getActivities = () => {
    const list = [
      { id: '1', text: 'SAP S21 interface sync completed for 4 contracts', date: '2026-08-12', type: 'SYNC', icon: <Server size={14} color="var(--accent-blue)" /> },
      { id: '2', text: 'Invoice INV-2026-0015 posted (MIRO clearing reference PMT-90024)', date: '2026-07-16', type: 'MIRO', icon: <FileClock size={14} color="var(--success-600)" /> },
      { id: '3', text: 'Weighbridge tolerance check enabled (0.5% threshold)', date: '2026-07-14', type: 'CONFIG', icon: <ShieldCheck size={14} color="var(--warning-600)" /> },
    ];

    const approvedPODs = offloadRecords.filter(
      (rec) => rec.podStatus === 'APPROVED' || rec.podStatus === 'APPROVED_MISMATCH_OVERRIDE' || rec.podStatus === 'APPROVED_INVOICE_PENDING'
    );
    
    approvedPODs.forEach((rec, index) => {
      const displayOverride = rec.podStatus === 'APPROVED_MISMATCH_OVERRIDE' ? ' (manual override)' : '';
      list.unshift({
        id: `approve-${index}`,
        text: `POD for Waybill ${rec.waybillNo} approved ${displayOverride}`,
        date: rec.offloadDate || '2026-07-14',
        type: 'APPROVAL',
        icon: <CheckCircle size={14} style={{ color: 'var(--success-600)' }} />
      });
    });

    const rejectedPODs = offloadRecords.filter((rec) => rec.podStatus === 'REJECTED');
    rejectedPODs.forEach((rec, index) => {
      list.unshift({
        id: `reject-${index}`,
        text: `POD for Waybill ${rec.waybillNo} rejected: ${rec.rejectionReason || 'Discrepancy'}`,
        date: rec.offloadDate || '2026-07-14',
        type: 'REJECTION',
        icon: <XCircle size={14} style={{ color: 'var(--error-600)' }} />
      });
    });

    return list.slice(0, 6);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner / System Status */}
      <div style={{ background: 'var(--brand-navy)', borderRadius: '16px', padding: '24px 28px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="sap-mode-badge"><Server size={10} /> MOCK SAP MODE</span>
            <span style={{ fontSize: '12px', color: 'var(--neutral-400)', fontWeight: 500 }}>Ikwezi Logistics Control Tower</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>Operations Control Tower</h2>
          <p style={{ fontSize: '13px', color: 'var(--neutral-300)', marginTop: '2px' }}>
            Monitoring contract fulfillment, weighbridge validation queues, and SAP MIRO invoice posting.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/admin/approvals')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
            Review POD Queue ({pendingApprovalsCount}) <ArrowRight size={14} />
          </button>
          <button onClick={() => navigate('/admin/invoices')} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}>
            MIRO Desk ({parkedInvoicesCount})
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="metric-grid-4">
        {/* Pending POD Approvals */}
        <div 
          className="metric-card" 
          onClick={() => navigate('/admin/approvals')}
          style={{ cursor: 'pointer', borderLeft: '4px solid var(--warning-500)' }}
        >
          <div className="metric-card__row">
            <div>
              <div className="metric-card__value">{pendingApprovalsCount}</div>
              <div className="metric-card__label">Pending POD Verification</div>
            </div>
            <div className="metric-card__icon" style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
              <ClipboardCheck size={22} />
            </div>
          </div>
          <div className="metric-card__delta warning" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '11px', fontWeight: 600 }}>
            <Activity size={12} /> Requires CA Sign-off
          </div>
        </div>

        {/* Parked Invoices */}
        <div 
          className="metric-card" 
          onClick={() => navigate('/admin/invoices')}
          style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent-blue)' }}
        >
          <div className="metric-card__row">
            <div>
              <div className="metric-card__value">{parkedInvoicesCount}</div>
              <div className="metric-card__label">Parked Invoices (MIRO)</div>
            </div>
            <div className="metric-card__icon" style={{ background: 'var(--accent-blue-light)', color: 'var(--accent-blue)' }}>
              <FileClock size={22} />
            </div>
          </div>
          <div className="metric-card__delta info" style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '11px', fontWeight: 600 }}>
            Awaiting SAP Posting
          </div>
        </div>

        {/* Verified Delivered Freight Tons */}
        <div className="metric-card" style={{ borderLeft: '4px solid var(--success-500)' }}>
          <div className="metric-card__row">
            <div>
              <div className="metric-card__value">{totalDeliveredTons.toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-500)' }}>TONS</span></div>
              <div className="metric-card__label">Verified Volume</div>
            </div>
            <div className="metric-card__icon" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
              <Truck size={22} />
            </div>
          </div>
          <div className="metric-card__delta positive" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', fontSize: '11px', fontWeight: 600 }}>
            Accepted Net Weight Total
          </div>
        </div>

        {/* Active Carriers */}
        <div className="metric-card" style={{ borderLeft: '4px solid var(--purple-600)' }}>
          <div className="metric-card__row">
            <div>
              <div className="metric-card__value">{totalTransportersCount}</div>
              <div className="metric-card__label">Contracted Carriers</div>
            </div>
            <div className="metric-card__icon" style={{ background: 'var(--purple-50)', color: 'var(--purple-600)' }}>
              <Users size={22} />
            </div>
          </div>
          <div className="metric-card__delta" style={{ color: 'var(--purple-600)', marginTop: '12px', fontSize: '11px', fontWeight: 600 }}>
            {purchaseOrders.length} Active PO Runs
          </div>
        </div>
      </div>

      {/* Main Split: Approval Attention Queue + Audit Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* Pending Approvals Table Card */}
        <Card 
          title="POD Approvals Needing Attention" 
          subtitle="Review uploaded weighbridge slips, OCR matching status, and tolerance checks"
        >
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Waybill</th>
                  <th>Transporter</th>
                  <th>Product</th>
                  <th>Weight (Net)</th>
                  <th>OCR Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {offloadRecords
                  .filter((r) => r.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || r.podStatus === 'LOW_CONFIDENCE' || r.podStatus === 'PENDING_POD')
                  .slice(0, 5)
                  .map((rec) => {
                    const weightTons = ((rec.acceptedNetWeightKg || rec.dispatchNetWeightKg || 34000) / 1000).toFixed(2);
                    const isLowConf = rec.podStatus === 'LOW_CONFIDENCE';

                    return (
                      <tr key={rec.waybillNo}>
                        <td className="mono" style={{ fontWeight: 700 }}>{rec.waybillNo}</td>
                        <td style={{ fontWeight: 500 }}>{rec.driverName ? rec.driverName.split(' ')[1] || rec.driverName : 'Sipho Freight'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>{rec.productDescription}</td>
                        <td className="numeric">{weightTons} T</td>
                        <td>
                          {isLowConf ? (
                            <span className="badge badge-warning"><AlertTriangle size={10} /> Low Confidence</span>
                          ) : (
                            <span className="badge badge-blue"><Activity size={10} /> In Queue</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => navigate('/admin/approvals')} 
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Audit Log Card */}
        <Card title="Administrative Event Stream" subtitle="Audit trail of POD approvals, rejections, and MIRO postings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {getActivities().map((act) => (
              <div 
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--neutral-50)',
                  border: '1px solid var(--neutral-200)'
                }}
              >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  {act.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--neutral-800)', lineHeight: 1.3 }}>{act.text}</p>
                  <p style={{ fontSize: '10.5px', color: 'var(--neutral-500)', marginTop: '2px' }}>{formatDate(act.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  );
};
