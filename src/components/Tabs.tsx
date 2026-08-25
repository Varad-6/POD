// ============================================================
// POD — Reusable Tabs Component (Blue Theme v3)
// ============================================================

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div
      className={`tabs-nav ${className}`}
      style={{
        display: 'flex',
        gap: '24px',
        borderBottom: '2.5px solid var(--color-border)',
        paddingBottom: '0px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 4px 12px 4px',
              fontSize: '13.5px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--color-brand-blue-600)' : 'var(--color-text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '3px solid var(--color-brand-blue-600)' : '3px solid transparent',
              marginBottom: '-2.5px',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
            }}
          >
            {tab.icon}
            <span style={{ letterSpacing: '0.01em' }}>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isActive ? 'var(--color-brand-blue-50)' : '#F1F5F9',
                  color: isActive ? 'var(--color-brand-blue-600)' : 'var(--color-text-muted)',
                  marginLeft: '4px'
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
