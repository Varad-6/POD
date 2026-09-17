import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  accentColor?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  icon,
  accentColor,
  onClick,
  style,
  className = '',
}) => {
  const hasZeroPadding = style && (style.padding === 0 || style.padding === '0' || style.padding === '0px');

  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card, 6px)',
        boxShadow: 'var(--shadow-card)',
        padding: hasZeroPadding ? 0 : '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {accentColor && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: accentColor,
          }}
        />
      )}

      {(title || subtitle || action || icon) && (
        <div 
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: hasZeroPadding ? '14px 20px' : '0 0 14px 0',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: hasZeroPadding ? 0 : '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && <div style={{ color: 'var(--color-brand-blue-600)', display: 'flex' }}>{icon}</div>}
            <div>
              {title && (
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-heading)', margin: 0, letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
              )}
              {subtitle && <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className="card-body" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
};
