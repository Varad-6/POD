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
  hoverEffect = false,
  style,
  className = '',
}) => {
  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
      style={{
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
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon && <div>{icon}</div>}
            <div>
              {title && <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--neutral-900)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{title}</h3>}
              {subtitle && <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '2px' }}>{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className="card-body">
        {children}
      </div>
    </div>
  );
};
