import React from 'react';

export interface KPIItem {
  id: string;
  value: number | string;
  label: string;
  subtitle?: string;
  active?: boolean;
  onClick?: () => void;
  accentColor?: string;
}

interface KPISummaryBarProps {
  items: KPIItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const KPISummaryBar: React.FC<KPISummaryBarProps> = ({
  items,
  activeId,
  onSelect,
  className = '',
  style,
}) => {
  return (
    <div
      className={`sap-kpi-bar ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {items.map((item, idx) => {
        const isActive = activeId !== undefined ? item.id === activeId : !!item.active;
        const isLast = idx === items.length - 1;

        const handleClick = () => {
          if (item.onClick) item.onClick();
          if (onSelect) onSelect(item.id);
        };

        return (
          <div
            key={item.id}
            onClick={handleClick}
            style={{
              padding: '20px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRight: isLast ? 'none' : '1px solid var(--color-border)',
              borderBottom: isActive ? '3px solid var(--color-brand-blue-600)' : '3px solid transparent',
              backgroundColor: isActive ? 'rgba(10, 110, 209, 0.02)' : '#FFFFFF',
              transition: 'all 0.15s ease',
              userSelect: 'none',
              minWidth: '140px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-bg-page)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            {/* Big Metric Number */}
            <div
              style={{
                fontSize: '32px',
                fontWeight: 300,
                lineHeight: 1.1,
                color: item.accentColor || 'var(--color-text-heading)',
                letterSpacing: '-0.02em',
                marginBottom: '6px',
              }}
            >
              {item.value}
            </div>

            {/* Label */}
            <div
              style={{
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-brand-blue-600)' : 'var(--color-text-body)',
                marginBottom: '4px',
              }}
            >
              {item.label}
            </div>

            {/* Period / Subtitle */}
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
              }}
            >
              {item.subtitle || 'Last 31 days'}
            </div>
          </div>
        );
      })}
    </div>
  );
};
