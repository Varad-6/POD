import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, title, onClick, hoverEffect = false, style }) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    boxShadow: 'var(--card-shadow)',
    padding: '24px',
    border: '1px solid var(--border-grey)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    ...style
  };

  const hoverClass = hoverEffect && onClick ? 'card-hover' : '';

  return (
    <div 
      style={cardStyle} 
      onClick={onClick}
      className={`custom-card ${hoverClass}`}
      onMouseEnter={(e) => {
        if (hoverEffect && onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverEffect && onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--card-shadow)';
        }
      }}
    >
      {title && <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>{title}</h3>}
      {children}
    </div>
  );
};
