import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, Truck, Receipt, CheckCircle, ArrowRight } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { Card } from '../components/Card';
import { formatCurrency, formatDate } from '../utils/format';

export const TransporterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { purchaseOrders, offloadRecords, invoices } = useDemo();

  // Calculations
  const pendingPOsCount = purchaseOrders.filter((po) => po.status === 'PENDING_SIGNATURE').length;
  const awaitingPODsCount = offloadRecords.filter((rec) => rec.podStatus === 'PENDING_POD').length;
  
  const parkedInvoicesCount = invoices.filter((inv) => inv.status === 'PARKED').length;
  const postedInvoicesCount = invoices.filter((inv) => inv.status === 'POSTED').length;
  const paidInvoicesCount = invoices.filter((inv) => inv.status === 'PAID').length;

  // Generate activities based on actual states
  const getActivities = () => {
    const list = [
      { id: '1', text: 'Invoice INV-2026-0091 posted (MIRO clearing completed)', date: '2026-07-10', icon: <Receipt size={14} /> },
      { id: '2', text: 'POD WB-998800 approved by Logistics Admin', date: '2026-07-05', icon: <CheckCircle size={14} style={{ color: 'var(--success-text)' }} /> },
      { id: '3', text: 'Purchase Order #4500012350 signed and accepted', date: '2026-06-26', icon: <FileSignature size={14} /> },
    ];

    // Prepend dynamic items based on session modifications
    const signedPOs = purchaseOrders.filter(po => po.status === 'ACCEPTED_SIGNED' && po.signedDate);
    signedPOs.forEach((po, index) => {
      list.unshift({
        id: `po-${index}`,
        text: `Purchase Order #${po.purchaseOrderNo} accepted and e-signed`,
        date: po.signedDate?.split('T')[0] || '2026-07-14',
        icon: <FileSignature size={14} style={{ color: 'var(--success-text)' }} />
      });
    });

    const submittedPODs = offloadRecords.filter(rec => rec.podStatus === 'SUBMITTED_AWAITING_APPROVAL');
    submittedPODs.forEach((rec, index) => {
      list.unshift({
        id: `pod-${index}`,
        text: `POD for Waybill ${rec.waybillNo} submitted for approval`,
        date: '2026-07-14',
        icon: <Truck size={14} style={{ color: 'var(--warning-text)' }} />
      });
    });

    const activeInvoices = invoices.filter(inv => inv.status === 'PARKED');
    activeInvoices.forEach((inv, index) => {
      list.unshift({
        id: `inv-${index}`,
        text: `Invoice ${inv.invoiceNo} generated for Waybill ${inv.waybillNo}`,
        date: '2026-07-14',
        icon: <Receipt size={14} style={{ color: 'var(--info-text)' }} />
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
        {/* Pending POs */}
        <Card 
          hoverEffect 
          onClick={() => navigate('/transporter/purchase-orders')}
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
            <FileSignature size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{pendingPOsCount}</h4>
            <p style={{ fontSize: '14px', color: 'var(--neutral-secondary)', fontWeight: 600, marginTop: '4px' }}>
              POs Awaiting Signature
            </p>
          </div>
        </Card>

        {/* Active Offloads */}
        <Card 
          hoverEffect 
          onClick={() => navigate('/transporter/pods')}
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
            <Truck size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{awaitingPODsCount}</h4>
            <p style={{ fontSize: '14px', color: 'var(--neutral-secondary)', fontWeight: 600, marginTop: '4px' }}>
              Deliveries Pending POD
            </p>
          </div>
        </Card>

        {/* Invoices summary */}
        <Card 
          hoverEffect 
          onClick={() => navigate('/transporter/invoices')}
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
            <Receipt size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <h4 style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1 }}>
                {parkedInvoicesCount + postedInvoicesCount + paidInvoicesCount}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>Active Invoices</p>
            </div>
            
            {/* Sub-counts */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--info-text)', backgroundColor: 'var(--info-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                {parkedInvoicesCount} Parked
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teal-text)', backgroundColor: 'var(--teal-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                {postedInvoicesCount} Posted
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success-text)', backgroundColor: 'var(--success-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                {paidInvoicesCount} Paid
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card title="Recent Portal Activity">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Activity</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Date</th>
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
