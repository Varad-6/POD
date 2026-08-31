import React from 'react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
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
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>;
  }

  if (data.length === 0) {
    return <>{emptyState || <EmptyState title="No Data Found" description="There are no items to display." />}</>;
  }

  return (
    <div style={style} className={className}>
      {/* Desktop Table View */}
      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={col.className}
                  style={{ 
                    textAlign: col.align || 'left', 
                    padding: '12px 16px',
                    fontWeight: 700,
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1.5px solid var(--color-border)',
                    ...col.style
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIdx) => (
              <tr 
                key={rowIdx} 
                className="table-row-hover"
                onClick={onRowClick ? () => onRowClick(item, rowIdx) : undefined}
                style={{ 
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background-color var(--transition-normal)',
                  cursor: onRowClick ? 'pointer' : 'default',
                  ...(getRowStyle ? getRowStyle(item, rowIdx) : {})
                }}
              >
                {columns.map((col, colIdx) => (
                  <td 
                    key={colIdx} 
                    className={col.className}
                    style={{ 
                      textAlign: col.align || 'left', 
                      padding: '16px',
                      fontSize: '13.5px',
                      ...col.style 
                    }}
                  >
                    {col.render(item, rowIdx)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      {renderMobileCard && (
        <div className="card-list">
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
