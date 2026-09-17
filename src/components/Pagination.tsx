import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (newSize: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers to display with smart sliding window
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div 
      className={`sap-pagination ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '16px 20px',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: '#FFFFFF',
        fontSize: '13px',
        color: 'var(--color-text-body)',
        flexWrap: 'wrap',
      }}
    >
      {/* Page Size Selector (Screenshot 2: "20 ∨ Items") */}
      {onPageSizeChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                padding: '4px 24px 4px 10px',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-heading)',
                cursor: 'pointer',
                minHeight: '28px',
                outline: 'none',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Items</span>
          <span style={{ color: 'var(--color-border)', margin: '0 8px' }}>|</span>
        </div>
      )}

      {/* Page Navigation (< 1 2 3 4 >) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            border: 'none',
            background: 'transparent',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            color: currentPage <= 1 ? 'var(--color-border)' : 'var(--color-brand-blue-600)',
            borderRadius: '4px',
            transition: 'background-color 0.15s',
          }}
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              style={{
                minWidth: '28px',
                height: '28px',
                padding: '0 6px',
                border: isActive ? '1px solid var(--color-brand-blue-600)' : '1px solid transparent',
                borderRadius: '4px',
                backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                color: isActive ? 'var(--color-brand-blue-600)' : 'var(--color-text-body)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-bg-page)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            border: 'none',
            background: 'transparent',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            color: currentPage >= totalPages ? 'var(--color-border)' : 'var(--color-brand-blue-600)',
            borderRadius: '4px',
            transition: 'background-color 0.15s',
          }}
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Item summary */}
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '12px' }}>
        Showing {startItem}–{endItem} of {totalItems}
      </span>
    </div>
  );
};
