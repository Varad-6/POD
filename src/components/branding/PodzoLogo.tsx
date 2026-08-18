import React from 'react';

export interface PodzoLogoProps {
  variant?: 'full' | 'compact' | 'mark';
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const PodzoLogo: React.FC<PodzoLogoProps> = ({
  variant = 'compact',
  height,
  className = '',
  style = {},
  onClick,
}) => {
  let src = '/branding/podzo-logo-compact.png';
  let defaultHeight = 36;
  let alt = 'PODZO';

  if (variant === 'full') {
    src = '/branding/podzo-logo-full.png';
    defaultHeight = 64;
    alt = "PODZO — Let's make delivery simple.";
  } else if (variant === 'mark') {
    src = '/branding/podzo-mark.png';
    defaultHeight = 32;
    alt = 'PODZO Mark';
  } else {
    src = '/branding/podzo-logo-compact.png';
    defaultHeight = 36;
    alt = 'PODZO Portal';
  }

  const finalHeight = height ?? defaultHeight;

  return (
    <img
      src={src}
      alt={alt}
      className={`podzo-logo podzo-logo-${variant} ${className}`}
      onClick={onClick}
      style={{
        height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
        objectFit: 'contain',
        display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
        maxWidth: '100%',
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
};
