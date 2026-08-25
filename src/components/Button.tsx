import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  style,
  ...props
}) => {
  let btnClass = 'btn';
  if (variant === 'primary') btnClass += ' btn-primary';
  else if (variant === 'secondary') btnClass += ' btn-secondary';
  else if (variant === 'danger') btnClass += ' btn-danger';

  if (size === 'sm') btnClass += ' btn-sm';
  else if (size === 'lg') btnClass += ' btn-lg';

  return (
    <button
      className={`${btnClass} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        borderRadius: 'var(--radius-button)',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        transition: 'all var(--transition-normal)',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};
