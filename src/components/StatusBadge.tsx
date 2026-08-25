import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Clock, MapPin, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let text = status.replace(/_/g, ' ');
  let className = 'badge badge-neutral';
  let icon: React.ReactNode = null;

  switch (status.toUpperCase()) {
    // SUCCESS STATS (Green pills)
    case 'ACCEPTED_SIGNED':
      className = 'badge badge-green';
      text = 'Driver Assigned';
      icon = <Check size={13} />;
      break;
    case 'MINE_GROSS_LOGGED':
      className = 'badge badge-green';
      text = 'Gross Captured';
      icon = <Check size={13} />;
      break;
    case 'SUPERVISOR_APPROVED':
      className = 'badge badge-green';
      text = 'Supervisor Approved';
      icon = <CheckCircle2 size={13} />;
      break;
    case 'DELIVERED_STAMPED':
    case 'CUSTOMER_CONFIRMED':
      className = 'badge badge-green';
      text = 'Delivered & Stamped';
      icon = <CheckCircle2 size={13} />;
      break;
    case 'APPROVED':
    case 'APPROVED_INVOICE_PENDING':
      className = 'badge badge-green';
      text = 'Approved';
      icon = <CheckCircle2 size={13} />;
      break;
    case 'APPROVED_MISMATCH_OVERRIDE':
      className = 'badge badge-green';
      text = 'Approved (Override)';
      icon = <AlertTriangle size={13} />;
      break;
    case 'PAID':
      className = 'badge badge-green';
      text = 'Paid';
      icon = <CheckCircle2 size={13} />;
      break;
    case 'MATCH':
      className = 'badge badge-green';
      text = 'Match';
      icon = <CheckCircle2 size={13} />;
      break;
    case 'CLEARED':
      className = 'badge badge-green';
      text = 'Cleared';
      icon = <CheckCircle2 size={13} />;
      break;
    case 'DELIVERED':
      className = 'badge badge-green';
      text = 'Delivered';
      icon = <CheckCircle2 size={13} />;
      break;
    case 'RESOLVED':
      className = 'badge badge-green';
      text = 'Resolved';
      icon = <CheckCircle2 size={13} />;
      break;
    case 'ARRIVED':
      className = 'badge badge-green';
      text = 'Arrived';
      icon = <MapPin size={13} />;
      break;
    case 'WITHIN_TOLERANCE':
      className = 'badge badge-green';
      text = 'Within Tolerance';
      icon = <CheckCircle2 size={13} />;
      break;

    // WARNING STATS (Orange pills)
    case 'PENDING_SIGNATURE':
      className = 'badge badge-amber';
      text = 'Ready for Driver';
      icon = <Clock size={13} />;
      break;
    case 'DRIVER_ARRIVED':
      className = 'badge badge-amber';
      text = 'Driver Arrived';
      icon = <Clock size={13} />;
      break;
    case 'MINE_TARE_LOGGED':
      className = 'badge badge-amber';
      text = 'Tare Captured';
      icon = <Clock size={13} />;
      break;
    case 'SUBMITTED_AWAITING_APPROVAL':
      className = 'badge badge-amber';
      text = 'Awaiting Approval';
      icon = <Clock size={13} />;
      break;
    case 'LOW_CONFIDENCE':
      className = 'badge badge-amber';
      text = 'Low Confidence';
      icon = <AlertCircle size={13} />;
      break;
    case 'UNDER_REVIEW':
      className = 'badge badge-amber';
      text = 'Under Review';
      icon = <AlertCircle size={13} />;
      break;
    case 'OPEN':
      className = 'badge badge-amber';
      text = 'Open';
      icon = <Clock size={13} />;
      break;

    // ERROR STATS (Red pills)
    case 'SUPERVISOR_REJECTED':
      className = 'badge badge-red';
      text = 'Supervisor Rejected';
      icon = <AlertTriangle size={13} />;
      break;
    case 'DELIVERED_FAILED':
    case 'CUSTOMER_DEVIATION':
      className = 'badge badge-red';
      text = 'Delivery Failed';
      icon = <AlertCircle size={13} />;
      break;
    case 'REJECTED':
      className = 'badge badge-red';
      text = 'Rejected';
      icon = <AlertCircle size={13} />;
      break;
    case 'MISMATCH':
      className = 'badge badge-red';
      text = 'Mismatch';
      icon = <AlertTriangle size={13} />;
      break;
    case 'GATE_DENIED':
      className = 'badge badge-red';
      text = 'Gate Denied';
      icon = <AlertTriangle size={13} />;
      break;
    case 'OUTSIDE_TOLERANCE':
      className = 'badge badge-red';
      text = 'Outside Tolerance';
      icon = <AlertTriangle size={13} />;
      break;

    // INFO STATS (Blue pills)
    case 'ASSIGNED':
    case 'ASSIGNED_TO_TRANSPORTER':
      className = 'badge badge-blue';
      text = 'Assigned to Transporter';
      icon = <Clock size={13} />;
      break;
    case 'DRIVER_ASSIGNED':
    case 'ASSIGNED_TO_DRIVER':
      className = 'badge badge-blue';
      text = 'Assigned to Driver';
      icon = <Clock size={13} />;
      break;
    case 'EN_ROUTE':
      className = 'badge badge-blue';
      text = 'En Route';
      icon = <MapPin size={13} />;
      break;
    case 'PARKED':
    case 'MIRO_PARKED':
      className = 'badge badge-blue';
      text = 'MIRO Parked';
      icon = <Clock size={13} />;
      break;
    case 'POSTED':
    case 'MIRO_POSTED':
      className = 'badge badge-blue';
      text = 'MIRO Posted';
      icon = <Check size={13} />;
      break;
    case 'DISPATCHED':
      className = 'badge badge-blue';
      text = 'Dispatched';
      icon = <Clock size={13} />;
      break;
    case 'INVOICED':
      className = 'badge badge-blue';
      text = 'Invoiced';
      icon = <Check size={13} />;
      break;

    // NEUTRAL / DEFAULT STATS (Gray pills)
    case 'UNASSIGNED':
      className = 'badge badge-neutral';
      text = 'Unassigned';
      break;
    case 'PENDING_POD':
    case 'AWAITING_INVOICE_SUBMISSION':
      className = 'badge badge-neutral';
      text = 'Need POD';
      break;
    default:
      className = 'badge badge-neutral';
  }

  return (
    <span className={className}>
      {icon}
      {text}
    </span>
  );
};
