import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  ariaLabel,
  id,
  className = '',
  style
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  const isCheckedOrIndeterminate = checked || indeterminate;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        ...style
      }}
      onClick={handleClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fiori-checkbox-container ${className}`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-checked={indeterminate ? 'mixed' : checked}
        onChange={(e) => {
          e.stopPropagation();
          if (!disabled) onChange(e.target.checked);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          position: 'absolute',
          opacity: 0,
          width: '1px',
          height: '1px',
          pointerEvents: 'none'
        }}
      />

      <div
        tabIndex={disabled ? -1 : 0}
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '3.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease-in-out',
          boxSizing: 'border-box',
          backgroundColor: disabled
            ? '#F1F5F9'
            : isCheckedOrIndeterminate
            ? 'var(--color-brand-blue-600, #2F5FE0)'
            : isHovered
            ? '#F0F7FF'
            : '#FFFFFF',
          border: disabled
            ? '1.5px solid #CBD5E1'
            : isCheckedOrIndeterminate
            ? '2px solid var(--color-brand-blue-600, #2F5FE0)'
            : isHovered
            ? '2px solid var(--color-brand-blue-600, #2F5FE0)'
            : '2px solid #475569',
          boxShadow: isFocused
            ? '0 0 0 3px rgba(47, 95, 224, 0.25)'
            : isHovered && !disabled
            ? '0 0 0 2px rgba(47, 95, 224, 0.15)'
            : '0 1px 2px rgba(0, 0, 0, 0.05)',
          outline: 'none'
        }}
      >
        {checked && !indeterminate && (
          <Check size={13} strokeWidth={3} color="#FFFFFF" />
        )}
        {indeterminate && (
          <Minus size={13} strokeWidth={3} color="#FFFFFF" />
        )}
      </div>
    </div>
  );
};
