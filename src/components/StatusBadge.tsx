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
      break;
    case 'ACCEPTED_SIGNED':
      style.color = 'var(--success-text)';
      style.backgroundColor = 'var(--success-bg)';
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
