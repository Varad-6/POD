import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Clock, MapPin, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let text = status ? status.replace(/_/g, ' ') : '';
  let variant: 'green' | 'amber' | 'red' | 'blue' | 'neutral' = 'neutral';
  let icon: React.ReactNode = null;

  const s = (status || '').toUpperCase();

  switch (s) {
    // SUCCESS (Green)
    case 'ACTIVE':
    case 'COMPLETED':
    case 'ACCEPTED_SIGNED':
    case 'SUPERVISOR_APPROVED':
    case 'DELIVERED_STAMPED':
    case 'CUSTOMER_CONFIRMED':
    case 'APPROVED':
    case 'PAID':
    case 'MATCH':
    case 'CLEARED':
    case 'DELIVERED':
    case 'RESOLVED':
    case 'ARRIVED':
    case 'WITHIN_TOLERANCE':
    case 'MINE_GROSS_LOGGED':
      variant = 'green';
      if (s === 'ACCEPTED_SIGNED') text = 'Driver Assigned';
      else if (s === 'MINE_GROSS_LOGGED') text = 'Gross Captured';
      else if (s === 'SUPERVISOR_APPROVED') text = 'Supervisor Approved';
      else if (s === 'DELIVERED_STAMPED' || s === 'CUSTOMER_CONFIRMED') text = 'Delivered & Stamped';
      else if (s === 'ACTIVE') text = 'Active';
      else if (s === 'PAID') text = 'Paid';
      else if (s === 'COMPLETED') text = 'Completed';
      break;

    // WARNING (Amber / Orange)
    case 'PENDING':
    case 'PENDING_SIGNATURE':
    case 'DRIVER_ARRIVED':
    case 'MINE_TARE_LOGGED':
    case 'SUBMITTED_AWAITING_APPROVAL':
    case 'AWAITING_CUSTOMER':
    case 'AWAITING_SUPERVISOR':
    case 'AWAITING_MIRO':
    case 'PARKED':
    case 'PARTIALLY_INVOICED':
    case 'PARTIALLY INVOICED':
    case 'IN_TRANSIT':
    case 'EN_ROUTE':
    case 'DISPATCHED':
      variant = 'amber';
      if (s === 'PENDING_SIGNATURE') text = 'Ready for Driver';
      else if (s === 'DRIVER_ARRIVED') text = 'Driver Arrived';
      else if (s === 'MINE_TARE_LOGGED') text = 'Tare Captured';
      else if (s === 'PARKED') text = 'Parked (MIRO)';
      else if (s === 'PARTIALLY_INVOICED' || s === 'PARTIALLY INVOICED') text = 'Partially Invoiced';
      else if (s === 'PENDING') text = 'Pending';
      break;

    // ERROR (Red)
    case 'FAILED':
    case 'REJECTED':
    case 'BLOCKED':
    case 'FLAGGED':
    case 'MISMATCH':
    case 'TOLERANCE_EXCEEDED':
    case 'EXPIRED':
    case 'ERROR':
      variant = 'red';
      if (s === 'TOLERANCE_EXCEEDED') text = 'Tolerance Exceeded';
      else if (s === 'MISMATCH') text = 'Mismatch';
      else if (s === 'FAILED') text = 'Failed';
      break;

    // INFO / BLUE
    case 'NEW':
    case 'OPEN':
    case 'RELEASED':
    case 'ASSIGNED':
    case 'CONFIRMED':
    case 'OCR_PROCESSED':
    case 'POSTED':
      variant = 'blue';
      if (s === 'NEW') text = 'New';
      else if (s === 'OPEN') text = 'Open';
      else if (s === 'RELEASED') text = 'Released';
      break;

    default:
      variant = 'neutral';
      break;
  }

  const styles: Record<string, React.CSSProperties> = {
    green: {
      backgroundColor: '#F1F8F4',
      color: '#107E3E',
      border: '1px solid #C6E7D2',
    },
    amber: {
      backgroundColor: '#FEF7F1',
      color: '#E9730C',
      border: '1px solid #FAD8B7',
    },
    red: {
      backgroundColor: '#FDF2F2',
      color: '#BB0000',
      border: '1px solid #F8C8C8',
    },
    blue: {
      backgroundColor: '#EAF3FC',
      color: '#0A6ED1',
      border: '1px solid #B8D8F8',
    },
    neutral: {
      backgroundColor: '#F5F6F7',
      color: '#5B738B',
      border: '1px solid #D9E1E8',
    },
  };

  return (
    <span
      className={`sap-badge sap-badge--${variant}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...styles[variant],
      }}
    >
      {icon}
      {text}
    </span>
  );
};
