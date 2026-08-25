import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        padding: '20px 32px',
        marginTop: 'auto',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '13px',
        color: 'var(--color-text-muted)',
        backgroundColor: 'transparent'
      }}
    >
      <span>© 2026 PODZO · SAP S/4HANA Connected</span>
    </footer>
  );
};
