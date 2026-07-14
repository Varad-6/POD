import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  submessage?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "No pending items right now", 
  submessage = "Check back later or change your filters."
}) => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: '1px dashed var(--border-grey)',
        borderRadius: '12px',
        width: '100%',
        margin: '16px 0'
      }}
    >
      <div 
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--page-bg)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--neutral-secondary)',
          marginBottom: '16px'
        }}
      >
        <Inbox size={24} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--neutral-primary)', marginBottom: '4px' }}>
        {message}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--neutral-secondary)' }}>
        {submessage}
      </p>
    </div>
  );
};
