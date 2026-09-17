import React from 'react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: React.ReactNode;
  render: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  style?: React.CSSProperties;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onRowClick?: (item: T, index: number) => void;
  getRowStyle?: (item: T, index: number) => React.CSSProperties;
}

export function Table<T>({
  data,
  columns,
  renderMobileCard,
  emptyState,
  loading = false,
  className = '',
  style,
  onRowClick,
  getRowStyle
}: TableProps<T>) {
  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
        Loading data...
      </div>
    );
  }

  if (data.length === 0) {
    return <>{emptyState || <EmptyState title="No Data Found" description="There are no items to display." />}</>;
  }

  return (
    <div style={style} className={className}>
      {/* Desktop & Responsive Table View */}
      <div 
        className={`table-container ${!renderMobileCard ? 'table-container-always' : ''}`}
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA' }}>
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={col.className}
                    style={{ 
                      textAlign: col.align || 'left', 
                      padding: '10px 16px',
                      fontWeight: 600,
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      borderBottom: '1.5px solid var(--color-border)',
                      whiteSpace: 'nowrap',
                      ...col.style
                    }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, rowIdx) => {
                const customStyle = getRowStyle ? getRowStyle(item, rowIdx) : {};
                return (
                  <tr 
                    key={rowIdx} 
                    className="table-row-hover"
                    onClick={onRowClick ? () => onRowClick(item, rowIdx) : undefined}
                    style={{ 
                      borderBottom: '1px solid var(--color-border-subtle, #E5E7EB)',
                      transition: 'background-color 0.15s ease',
                      cursor: onRowClick ? 'pointer' : 'default',
                      ...customStyle,
                    }}
                  >
                    {columns.map((col, colIdx) => (
                      <td 
                        key={colIdx} 
                        className={col.className}
                        style={{ 
                          textAlign: col.align || 'left', 
                          padding: '11px 16px',
                          fontSize: '13px',
                          color: 'var(--color-text-body)',
                          verticalAlign: 'middle',
                          ...col.style 
                        }}
                      >
                        {col.render(item, rowIdx)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      {renderMobileCard && (
        <div className="card-list" style={{ marginTop: '12px' }}>
          {data.map((item, idx) => (
            <div key={idx} className="card-list-item">
              {renderMobileCard(item, idx)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
