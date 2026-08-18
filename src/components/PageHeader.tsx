// ============================================================
// POD — Standardized PageHeader Component (AutoRepair Style)
// Title + Subtitle + Right Actions Pattern across all views
// ============================================================

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--neutral-200)',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '24px', backgroundColor: 'var(--brand-orange)', borderRadius: '2px' }} />
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--neutral-900)',
              letterSpacing: '-0.03em',
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--neutral-600)',
              marginTop: '6px',
              marginLeft: '16px',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {actions}
        </div>
      )}
    </div>
  );
};
