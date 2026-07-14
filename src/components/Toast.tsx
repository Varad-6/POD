import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ToastMessage } from '../context/DemoContext';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  let borderLeft = '4px solid var(--success-text)';
  let icon = <CheckCircle2 size={18} style={{ color: 'var(--success-text)' }} />;
  
  if (toast.type === 'error') {
    borderLeft = '4px solid var(--error-text)';
    icon = <AlertCircle size={18} style={{ color: 'var(--error-text)' }} />;
  } else if (toast.type === 'warning') {
    borderLeft = '4px solid var(--warning-text)';
    icon = <AlertCircle size={18} style={{ color: 'var(--warning-text)' }} />;
  }

  const toastStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderRadius: '6px',
    borderLeft: borderLeft,
    width: '320px',
    pointerEvents: 'auto',
    justifyContent: 'space-between',
  };

  return (
    <div style={toastStyle} className="animate-slide-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        {icon}
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-primary)', whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {toast.message}
        </p>
      </div>
      <button 
        onClick={() => onClose(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--neutral-secondary)',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          marginLeft: '8px'
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; onClose: (id: string) => void }> = ({ toasts, onClose }) => {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '24px',
    right: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    zIndex: 2000,
    pointerEvents: 'none',
  };

  return (
    <div style={containerStyle}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};
