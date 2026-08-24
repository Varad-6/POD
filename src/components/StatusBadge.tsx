import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let text = status.replace(/_/g, ' ');
  let style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    borderRadius: '999px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '700',
    width: 'fit-content'
  };
  
  let icon: React.ReactNode = null;

  switch (status) {
    // PO Statuses
    case 'PENDING_SIGNATURE':
      style.color = 'var(--warning-text)';
      style.backgroundColor = 'var(--warning-bg)';
      text = 'Ready for Driver';
      break;
    case 'ACCEPTED_SIGNED':
      style.color = 'var(--success-text)';
      style.backgroundColor = 'var(--success-bg)';
      text = 'Driver Assigned';
      break;
    case 'UNASSIGNED':
      style.color = 'var(--neutral-secondary)';
      style.backgroundColor = '#E5E7EB';
      text = 'Unassigned';
      break;
    case 'ASSIGNED':
    case 'ASSIGNED_TO_TRANSPORTER':
      style.color = 'var(--info-text)';
      style.backgroundColor = 'var(--info-bg)';
      text = 'Assigned to Transporter';
      break;
    case 'DRIVER_ASSIGNED':
    case 'ASSIGNED_TO_DRIVER':
      style.color = 'var(--info-text)';
      style.backgroundColor = 'var(--info-bg)';
      text = 'Assigned to Driver';
      break;
    case 'DRIVER_ARRIVED':
      style.color = 'var(--warning-text)';
      style.backgroundColor = 'var(--warning-bg)';
      text = 'Driver Arrived';
      break;
    case 'MINE_TARE_LOGGED':
      style.color = '#B45309';
      style.backgroundColor = '#FEF3C7';
      text = 'Tare Captured (Loading)';
      break;
    case 'MINE_GROSS_LOGGED':
      style.color = '#047857';
      style.backgroundColor = '#D1FAE5';
      text = 'Gross Captured (Ready for Bilty)';
      break;
    case 'SUPERVISOR_APPROVED':
      style.color = 'var(--success-text)';
      style.backgroundColor = 'var(--success-bg)';
      text = 'Supervisor Approved';
      break;
    case 'SUPERVISOR_REJECTED':
      style.color = 'var(--error-text)';
      style.backgroundColor = 'var(--error-bg)';
      text = 'Supervisor Rejected';
      break;
    case 'DELIVERED_STAMPED':
    case 'CUSTOMER_CONFIRMED':
      style.color = 'var(--success-text)';
      style.backgroundColor = 'var(--success-bg)';
      text = 'Delivered & Stamped';
      break;
    case 'DELIVERED_FAILED':
    case 'CUSTOMER_DEVIATION':
      style.color = 'var(--error-text)';
      style.backgroundColor = 'var(--error-bg)';
      text = 'Delivery Failed';
      break;
    case 'EN_ROUTE':
      style.color = 'var(--teal-text)';
      style.backgroundColor = 'var(--teal-bg)';
      text = 'En Route';
      break;

    // POD Statuses
    case 'PENDING_POD':
    case 'AWAITING_INVOICE_SUBMISSION':
      style.color = 'var(--neutral-secondary)';
      style.backgroundColor = '#E5E7EB';
      break;
    case 'SUBMITTED_AWAITING_APPROVAL':
      style.color = 'var(--warning-text)';
      style.backgroundColor = 'var(--warning-bg)';
      break;
    case 'APPROVED':
    case 'APPROVED_INVOICE_PENDING':
      style.color = 'var(--success-text)';
      style.backgroundColor = 'var(--success-bg)';
      text = 'Approved';
      break;
    case 'APPROVED_MISMATCH_OVERRIDE':
      style.color = 'var(--success-text)';
      style.backgroundColor = 'var(--success-bg)';
      icon = <AlertTriangle size={12} />;
      text = 'Approved (Override)';
      break;
    case 'REJECTED':
      style.color = 'var(--error-text)';
      style.backgroundColor = 'var(--error-bg)';
      break;
    case 'LOW_CONFIDENCE':
      style.color = 'var(--warning-text)';
      style.backgroundColor = 'var(--warning-bg)';
      icon = <AlertCircle size={12} />;
      text = 'Low Confidence';
      break;

    // Invoice Statuses
    case 'PARKED':
      style.color = 'var(--info-text)';
      style.backgroundColor = 'var(--info-bg)';
      text = 'Parked (MIRO)';
      break;
    case 'POSTED':
      style.color = 'var(--teal-text)';
      style.backgroundColor = 'var(--teal-bg)';
      break;
    case 'PAID':
      style.color = 'var(--success-text)';
      style.backgroundColor = 'var(--success-bg)';
      icon = <CheckCircle2 size={12} />;
      break;

    // OCR Matches
    case 'MATCH':
      style.color = 'var(--success-text)';
      style.backgroundColor = 'var(--success-bg)';
      icon = <CheckCircle2 size={12} />;
      break;
    case 'MISMATCH':
      style.color = 'var(--error-text)';
      style.backgroundColor = 'var(--error-bg)';
      icon = <AlertTriangle size={12} />;
      break;

    default:
      style.color = 'var(--neutral-secondary)';
      style.backgroundColor = '#E5E7EB';
  }

  return (
    <span style={style}>
      {icon}
      {text}
    </span>
  );
};
