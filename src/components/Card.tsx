import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
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

      {(title || subtitle || action) && (
        <div className="card-header">
          <div>
            {title && <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--neutral-900)' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '2px' }}>{subtitle}</p>}
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
