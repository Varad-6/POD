import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  statusTexts?: string[];
  intervalMs?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  statusTexts = ["Uploading document...", "Simulating OCR Extraction...", "Comparing with SAP weighbridge record..."],
  intervalMs = 700
}) => {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % statusTexts.length);
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [statusTexts, intervalMs]);

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center'
      }}
    >
      <Loader2 
        size={36} 
        className="animate-spin" 
        style={{ color: 'var(--primary-color)', marginBottom: '16px' }}
      />
      <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--primary-color)', minHeight: '20px' }}>
        {statusTexts[textIndex]}
      </p>
    </div>
  );
};
