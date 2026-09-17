import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, X, Filter } from 'lucide-react';

export interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface FilterBarProps {
  title?: string;
  count?: number;
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  chips?: FilterChip[];
  onClearAllChips?: () => void;
  children?: React.ReactNode; // Optional custom dropdowns or inputs
  rightAction?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  title,
  count,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search order number or customer...',
  chips = [],
  onClearAllChips,
  children,
  rightAction,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="sap-filter-container"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top Header Line: Title & Filter Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {title && (
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
              {title} {count !== undefined && <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>({count})</span>}
            </h3>
          )}

          {children && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--color-brand-blue-600)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{expanded ? 'Hide filters' : 'Edit filter'}</span>
            </button>
          )}

          {/* Active Filter Chips (Screenshots 1 & 3) */}
          {chips.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--color-border)' }}>|</span>
              {chips.map((chip) => (
                <span
                  key={chip.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--color-bg-page)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11.5px',
                    color: 'var(--color-text-body)',
                    fontWeight: 500,
                  }}
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Remove filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}

              {onClearAllChips && chips.length > 1 && (
                <button
                  type="button"
                  onClick={onClearAllChips}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-brand-blue-600)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '2px 4px',
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Action (e.g. Resend, Refresh, Action button) */}
        {rightAction && <div>{rightAction}</div>}
      </div>

      {/* Main Search Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
            }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text-heading)',
              outline: 'none',
              minHeight: '34px',
              boxSizing: 'border-box',
            }}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Filter Fields */}
      {expanded && children && (
        <div
          style={{
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};
