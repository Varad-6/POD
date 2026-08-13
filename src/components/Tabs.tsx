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
        display: 'inline-flex',
        gap: '4px',
        background: 'var(--neutral-100)',
        padding: '4px',
        borderRadius: '10px',
        border: '1px solid var(--neutral-200)',
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
              padding: '7px 14px',
              fontSize: '12px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#FFFFFF' : 'var(--neutral-600)',
              background: isActive ? 'var(--brand-navy)' : 'transparent',
              border: 'none',
              borderRadius: '7px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 2px 6px rgba(11, 19, 43, 0.15)' : 'none',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--neutral-200)',
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
