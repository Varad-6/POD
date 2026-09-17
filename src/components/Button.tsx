import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'tertiary';
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
  else if (variant === 'ghost' || variant === 'tertiary') btnClass += ' btn-ghost';

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
        borderRadius: 'var(--radius-button, 4px)',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};
