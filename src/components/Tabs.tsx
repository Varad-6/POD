// ============================================================
// POD — Reusable Tabs Component
// Consistent active/inactive tab styling with count pills
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
        borderBottom: '2px solid var(--neutral-200)',
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
              gap: '6px',
              padding: '10px 4px 12px 4px',
              fontSize: '13px',
              fontWeight: isActive ? 800 : 600,
              color: isActive ? 'var(--brand-purple)' : 'var(--neutral-600)',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '3px solid var(--brand-purple)' : '3px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon}
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isActive ? 'var(--brand-purple)' : 'var(--neutral-200)',
                  color: isActive ? '#FFFFFF' : 'var(--neutral-700)',
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
