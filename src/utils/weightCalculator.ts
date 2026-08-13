// ============================================================
// POD — 4-Point Weighbridge & Unit Mismatch Calculator
// Enterprise business rules for net weight, variance percentage,
// unit conversion (Kg <-> Metric Tons), and exception thresholds.
// ============================================================

export interface WeightVarianceResult {
  dispatchTareKg: number;
  dispatchGrossKg: number;
  dispatchNetKg: number;
  dispatchNetTons: number;

  arrivalTareKg: number;
  arrivalGrossKg: number;
  arrivalNetKg: number;
  arrivalNetTons: number;

  weightDiffKg: number;
  weightDiffTons: number;
  variancePercentage: number; // e.g. -0.42% or +1.20%

  damagedWeightKg: number;
  acceptedNetKg: number;
  acceptedNetTons: number;

  status: 'WITHIN_TOLERANCE' | 'EXCEEDS_TOLERANCE_WARNING' | 'CRITICAL_MISMATCH';
  statusLabel: string;
  statusColor: string;
  warningMessage?: string;
}

export interface UnitMismatchCheck {
  poUnit: string;        // e.g. "TON"
  waybillUnit: string;   // e.g. "KG" or "TON"
  invoiceUnit?: string;  // e.g. "TON"
  isMismatch: boolean;
  convertedQuantityTons: number;
  note: string;
}

/**
 * 4-Point Weighbridge Variance & Net Weight Calculation
 */
export function calculateWeightVariance(
  dispatchGrossKg: number,
  dispatchTareKg: number,
  arrivalGrossKg: number,
  arrivalTareKg: number,
  damagedWeightKg: number = 0
): WeightVarianceResult {
  const dispatchNet = Math.max(0, dispatchGrossKg - dispatchTareKg);
  const arrivalNet = Math.max(0, arrivalGrossKg - arrivalTareKg);

  const weightDiffKg = arrivalNet - dispatchNet;
  const variancePercentage = dispatchNet > 0 ? (weightDiffKg / dispatchNet) * 100 : 0;
  const acceptedNet = Math.max(0, arrivalNet - damagedWeightKg);

  const absDiffKg = Math.abs(weightDiffKg);
  const absDiffPct = Math.abs(variancePercentage);

  let status: WeightVarianceResult['status'] = 'WITHIN_TOLERANCE';
  let statusLabel = 'Clean / Within Tolerance';
  let statusColor = 'var(--accent-green)'; // CSS variable
  let warningMessage: string | undefined;

  if (absDiffPct > 1.5 || absDiffKg > 300) {
    status = 'CRITICAL_MISMATCH';
    statusLabel = 'Critical Weight Mismatch';
    statusColor = 'var(--accent-red)';
    warningMessage = `Weight discrepancy of ${weightDiffKg > 0 ? '+' : ''}${weightDiffKg.toLocaleString()} kg (${variancePercentage.toFixed(2)}%) exceeds the 1.5% maximum allowable limit!`;
  } else if (absDiffPct > 0.5 || absDiffKg > 100) {
    status = 'EXCEEDS_TOLERANCE_WARNING';
    statusLabel = 'Variance Tolerance Warning';
    statusColor = 'var(--accent-amber)';
    warningMessage = `Weight difference of ${weightDiffKg > 0 ? '+' : ''}${weightDiffKg.toLocaleString()} kg (${variancePercentage.toFixed(2)}%) requires supervisor / admin verification.`;
  }

  return {
    dispatchTareKg,
    dispatchGrossKg,
    dispatchNetKg: dispatchNet,
    dispatchNetTons: dispatchNet / 1000,

    arrivalTareKg,
    arrivalGrossKg,
    arrivalNetKg: arrivalNet,
    arrivalNetTons: arrivalNet / 1000,

    weightDiffKg,
    weightDiffTons: weightDiffKg / 1000,
    variancePercentage,

    damagedWeightKg,
    acceptedNetKg: acceptedNet,
    acceptedNetTons: acceptedNet / 1000,

    status,
    statusLabel,
    statusColor,
    warningMessage,
  };
}

/**
 * Convert Kilograms to Metric Tons
 */
export function kgToTons(kg: number): number {
  return Number((kg / 1000).toFixed(3));
}

/**
 * Convert Metric Tons to Kilograms
 */
export function tonsToKg(tons: number): number {
  return Math.round(tons * 1000);
}

/**
 * Check Unit Consistency across PO, Waybill, and Invoices
 */
export function validateUnitConsistency(
  poQuantity: number,
  poUnit: string = 'TON',
  rawWaybillQty: number,
  rawWaybillUnit: string = 'KG'
): UnitMismatchCheck {
  const normPoUnit = poUnit.toUpperCase();
  const normWaybillUnit = rawWaybillUnit.toUpperCase();

  let waybillQtyTons = rawWaybillQty;

  // Auto detect if user entered Kg in a Tons field (e.g. 30000 entered instead of 30)
  if (normWaybillUnit.includes('KG') || rawWaybillQty > 500) {
    waybillQtyTons = rawWaybillQty / 1000;
  }

  const isMismatch = Math.abs(waybillQtyTons - poQuantity) > (poQuantity * 0.1); // >10% variance

  return {
    poUnit: normPoUnit,
    waybillUnit: normWaybillUnit,
    isMismatch,
    convertedQuantityTons: Number(waybillQtyTons.toFixed(2)),
    note: isMismatch
      ? `Unit / Quantity Alert: PO specifies ${poQuantity} ${normPoUnit}, while Waybill records ${rawWaybillQty} ${rawWaybillUnit} (${waybillQtyTons.toFixed(2)} Tons).`
      : `Units aligned: ${waybillQtyTons.toFixed(2)} Tons matches PO allocation.`,
  };
}
