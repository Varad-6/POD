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
  accentColor = '#D92626',
  onClick,
  hoverEffect = true,
  style,
  className = '',
}) => {
  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--neutral-200)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        background: '#FFFFFF',
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
            height: '4px',
            background: accentColor,
          }}
        />
      )}

      {(title || subtitle || action || icon) && (
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--neutral-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {icon && <div style={{ color: 'var(--brand-orange)' }}>{icon}</div>}
            <div>
              {title && <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--neutral-900)', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>{title}</h3>}
              {subtitle && <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '2px', margin: 0 }}>{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className="card-body" style={{ padding: title || subtitle || action || icon ? '20px' : '24px' }}>
        {children}
      </div>
    </div>
  );
};
