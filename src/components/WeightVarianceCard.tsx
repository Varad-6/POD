// ============================================================
// POD — 4-Point Weighbridge & Weight Variance UI Component
// Renders a high-end comparative breakdown of Dispatch vs Arrival
// net weights, damage deductions, unit conversions, and tolerance status.
// ============================================================

import React from 'react';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Droplets,
  PackageCheck
} from 'lucide-react';
import { calculateWeightVariance, WeightVarianceResult } from '../utils/weightCalculator';

interface WeightVarianceCardProps {
  dispatchGrossKg: number;
  dispatchTareKg: number;
  arrivalGrossKg: number;
  arrivalTareKg: number;
  damagedWeightKg?: number;
  weightExceptionReason?: string;
  exceptionNotes?: string;
  className?: string;
  compact?: boolean;
}

export const WeightVarianceCard: React.FC<WeightVarianceCardProps> = ({
  dispatchGrossKg,
  dispatchTareKg,
  arrivalGrossKg,
  arrivalTareKg,
  damagedWeightKg = 0,
  weightExceptionReason,
  exceptionNotes,
  compact = false,
}) => {
  const result: WeightVarianceResult = calculateWeightVariance(
    dispatchGrossKg,
    dispatchTareKg,
    arrivalGrossKg,
    arrivalTareKg,
    damagedWeightKg
  );

  const getStatusIcon = () => {
    switch (result.status) {
      case 'WITHIN_TOLERANCE':
        return <CheckCircle2 size={16} color="var(--accent-green)" />;
      case 'EXCEEDS_TOLERANCE_WARNING':
        return <AlertTriangle size={16} color="var(--accent-amber)" />;
      case 'CRITICAL_MISMATCH':
        return <AlertOctagon size={16} color="var(--accent-red)" />;
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: compact ? '16px' : '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header & Status Pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Scale size={18} color="var(--accent-blue)" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              4-Point Weighbridge & Net Weight Audit
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Dispatch Siding vs Customer Receiving Site
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            background: `${result.statusColor}15`,
            color: result.statusColor,
            border: `1px solid ${result.statusColor}40`,
          }}
        >
          {getStatusIcon()}
          {result.statusLabel}
        </div>
      </div>

      {/* 4-Point Comparison Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '1fr 1fr 1.2fr',
          gap: '16px',
        }}
      >
        {/* Column 1: Dispatch Side */}
        <div
          style={{
            background: 'var(--bg-hover)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            1. Dispatch (Siding Log)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gross Weight:</span>
              <span style={{ fontWeight: 500 }}>{result.dispatchGrossKg.toLocaleString()} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tare Weight:</span>
              <span style={{ fontWeight: 500 }}>{result.dispatchTareKg.toLocaleString()} kg</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                paddingTop: '4px',
                borderTop: '1px dashed var(--border-color)',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              <span>Dispatch Net:</span>
              <span>{result.dispatchNetKg.toLocaleString()} kg <span style={{ fontSize: '11px', color: 'var(--accent-blue)' }}>({result.dispatchNetTons.toFixed(2)} t)</span></span>
            </div>
          </div>
        </div>

        {/* Column 2: Arrival Side */}
        <div
          style={{
            background: 'var(--bg-hover)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            2. Customer Arrival (Unload Log)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gross Weight:</span>
              <span style={{ fontWeight: 500 }}>{result.arrivalGrossKg.toLocaleString()} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tare Weight:</span>
              <span style={{ fontWeight: 500 }}>{result.arrivalTareKg.toLocaleString()} kg</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                paddingTop: '4px',
                borderTop: '1px dashed var(--border-color)',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              <span>Arrival Net:</span>
              <span>{result.arrivalNetKg.toLocaleString()} kg <span style={{ fontSize: '11px', color: 'var(--accent-blue)' }}>({result.arrivalNetTons.toFixed(2)} t)</span></span>
            </div>
          </div>
        </div>

        {/* Column 3: Variance & Accepted Payable Weight */}
        <div
          style={{
            background: `${result.statusColor}08`,
            padding: '12px 14px',
            borderRadius: '8px',
            border: `1px solid ${result.statusColor}30`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: result.statusColor, marginBottom: '6px' }}>
            3. Net Variance & Payable
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Weight Diff:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '13px', color: result.statusColor }}>
                {result.weightDiffKg > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {result.weightDiffKg > 0 ? '+' : ''}{result.weightDiffKg.toLocaleString()} kg ({result.variancePercentage > 0 ? '+' : ''}{result.variancePercentage.toFixed(2)}%)
              </div>
            </div>

            {damagedWeightKg > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--accent-red)' }}>
                <span>Damaged Deduction:</span>
                <span style={{ fontWeight: 600 }}>- {damagedWeightKg.toLocaleString()} kg</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Accepted Payable Net:</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-green)' }}>
                {result.acceptedNetKg.toLocaleString()} kg ({result.acceptedNetTons.toFixed(2)} t)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exception & Warning Alerts */}
      {result.warningMessage && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: `${result.statusColor}10`,
            borderLeft: `4px solid ${result.statusColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
        >
          {getStatusIcon()}
          <span>{result.warningMessage}</span>
        </div>
      )}

      {weightExceptionReason && weightExceptionReason !== 'NONE' && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(59, 130, 246, 0.06)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
          }}
        >
          <Droplets size={14} color="var(--accent-blue)" />
          <span>
            <strong>Logged Weight Exception:</strong> {weightExceptionReason.replace(/_/g, ' ')}
            {exceptionNotes ? ` — ${exceptionNotes}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};
