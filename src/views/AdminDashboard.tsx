import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileClock, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { Card } from '../components/Card';
import { formatDate } from '../utils/format';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { offloadRecords, invoices } = useDemo();

  // Calculations
  const pendingApprovalsCount = offloadRecords.filter(
    (rec) => rec.podStatus === 'SUBMITTED_AWAITING_APPROVAL' || rec.podStatus === 'LOW_CONFIDENCE'
  ).length;

  const parkedInvoicesCount = invoices.filter((inv) => inv.status === 'PARKED').length;

  // Static count of transporters from USERS mock data
  const totalTransportersCount = 2;

  // Generate activities based on actual states
  const getActivities = () => {
    const list = [
      { id: '1', text: 'Invoice INV-2026-0091 posted (MIRO clearing completed)', date: '2026-07-10', icon: <FileClock size={14} /> },
      { id: '2', text: 'Transporter BP record updated for Sipho Transport Services', date: '2026-07-09', icon: <Users size={14} /> },
      { id: '3', text: 'Discrepancy audit run complete for cost center CC-MINE-01', date: '2026-07-08', icon: <AlertTriangle size={14} /> },
    ];

    // Prepend dynamic items based on actions
    const approvedPODs = offloadRecords.filter(
      (rec) => rec.podStatus === 'APPROVED' || rec.podStatus === 'APPROVED_MISMATCH_OVERRIDE' || rec.podStatus === 'APPROVED_INVOICE_PENDING'
    );
    
    approvedPODs.forEach((rec, index) => {
      const displayOverride = rec.podStatus === 'APPROVED_MISMATCH_OVERRIDE' ? 'with override' : '';
      list.unshift({
        id: `approve-${index}`,
        text: `POD for Waybill ${rec.waybillNo} approved ${displayOverride}`,
        date: '2026-07-14',
        icon: <CheckCircle size={14} style={{ color: 'var(--success-text)' }} />
      });
    });

    const rejectedPODs = offloadRecords.filter((rec) => rec.podStatus === 'REJECTED');
    rejectedPODs.forEach((rec, index) => {
      list.unshift({
        id: `reject-${index}`,
        text: `POD for Waybill ${rec.waybillNo} rejected: ${rec.rejectionReason}`,
        date: '2026-07-14',
        icon: <XCircle size={14} style={{ color: 'var(--error-text)' }} />
      });
    });

    const postedInvoices = invoices.filter((inv) => inv.status === 'POSTED' || inv.status === 'PAID');
    postedInvoices.forEach((inv, index) => {
      list.unshift({
        id: `post-${index}`,
        text: `Invoice ${inv.invoiceNo} posted for verification`,
        date: '2026-07-14',
        icon: <FileClock size={14} style={{ color: 'var(--teal-text)' }} />
      });
    });

    return list.slice(0, 5);
  };

  return (
    <div>
      {/* 3 Summary Cards */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        {/* Pending Approvals */}
        <Card 
          hoverEffect 
          onClick={() => navigate('/admin/approvals')}
          style={{ display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ClipboardCheck size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{pendingApprovalsCount}</h4>
            <p style={{ fontSize: '14px', color: 'var(--neutral-secondary)', fontWeight: 600, marginTop: '4px' }}>
              Pending POD Approvals
            </p>
          </div>
        </Card>

        {/* Parked Invoices */}
        <Card 
          hoverEffect 
          onClick={() => navigate('/admin/invoices')}
          style={{ display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: 'var(--secondary-bg)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileClock size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{parkedInvoicesCount}</h4>
            <p style={{ fontSize: '14px', color: 'var(--neutral-secondary)', fontWeight: 600, marginTop: '4px' }}>
              Parked Invoices (MIRO)
            </p>
          </div>
        </Card>

        {/* Total Transporters */}
        <Card 
          style={{ display: 'flex', alignItems: 'center', gap: '20px' }}
        >
          <div 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{totalTransportersCount}</h4>
            <p style={{ fontSize: '14px', color: 'var(--neutral-secondary)', fontWeight: 600, marginTop: '4px' }}>
              Active Transporters
            </p>
          </div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card title="Administrative Actions Feed">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Activity Description</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Logged Date</th>
              </tr>
            </thead>
            <tbody>
              {getActivities().map((act) => (
                <tr key={act.id}>
                  <td>
                    <div 
                      style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '6px', 
                        backgroundColor: 'var(--page-bg)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--primary-color)'
                      }}
                    >
                      {act.icon}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{act.text}</td>
                  <td style={{ textAlign: 'right', color: 'var(--neutral-secondary)', fontSize: '13px' }}>
                    {formatDate(act.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
