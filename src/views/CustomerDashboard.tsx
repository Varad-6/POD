import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { crApi, drApi, TransportAssignmentV3 } from '../lib/api_v3';
import {
  PackageCheck, ShieldCheck, CheckCircle2, Scale, ArrowLeft, Check,
  Truck, MapPin, RefreshCw, ArrowRight, AlertTriangle, Lock
} from 'lucide-react';

// ─── Info section ─────────────────────────────────────────────────────────────
const InfoBit: React.FC<{ label: string; value: string | number; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div className={mono ? 'mono' : ''} style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-heading)', marginTop: '2px' }}>{value}</div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export const CustomerDashboard: React.FC = () => {
  const [incoming, setIncoming] = useState<TransportAssignmentV3[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TransportAssignmentV3 | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [destGross, setDestGross] = useState('49850');
  const [destTare, setDestTare] = useState('15120');
  const [issues, setIssues] = useState('No damages detected');
  const [unitCalc, setUnitCalc] = useState('Convert 34730 kg to 34.73 TON');
  const [weighSaved, setWeighSaved] = useState(false);
  const [successDone, setSuccessDone] = useState(false);

  const loadIncoming = async () => {
    setLoading(true);
    setWeighSaved(false);
    setSuccessDone(false);
    try {
      const data = await crApi.getIncomingAssignments();
      setIncoming(data);
    } catch (err) {
      console.error('Failed to load incoming trucks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadIncoming(); }, []);

  useEffect(() => {
    if (selectedAssignment) {
      const tare = selectedAssignment.mine_tare_kg || 10000;
      const targetQtyTons = selectedAssignment.po_target_qty || 34.0;
      const targetQtyKg = targetQtyTons * 1000;
      setDestTare(String(tare));
      setDestGross(String(tare + targetQtyKg));
      setUnitCalc(`Convert ${targetQtyKg} kg to ${targetQtyTons} Tons`);
    }
  }, [selectedAssignment]);

  const handleBack = () => {
    setSelectedAssignment(null);
    setWeighSaved(false);
    setSuccessDone(false);
    loadIncoming();
  };

  const handleCaptureWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await drApi.logWeight(selectedAssignment.id, { stage: 'DEST_GROSS', weight_kg: parseFloat(destGross) });
      await drApi.logWeight(selectedAssignment.id, { stage: 'DEST_TARE', weight_kg: parseFloat(destTare) });
      await crApi.captureDelivery(selectedAssignment.id, {
        truck_data: { gross: destGross, tare: destTare },
        issues, unit_calc: unitCalc
      });
      setWeighSaved(true);
    } catch (err) {
      console.error('Failed to capture delivery:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStampConfirm = async () => {
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await crApi.stampConfirm(selectedAssignment.id);
      setSuccessDone(true);
    } catch (err) {
      console.error('Stamp confirm failed:', err);
      alert('Could not confirm. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const netWeight = parseFloat(destGross) - parseFloat(destTare);
  const netTons = (netWeight / 1000).toFixed(2);

  // ─── DETAIL VIEW ─────────────────────────────────────────────────────────
  if (selectedAssignment) {
    const a = selectedAssignment;
    const dispatchNet = a.mine_gross_kg && a.mine_tare_kg ? (a.mine_gross_kg - a.mine_tare_kg) : ((a.po_target_qty || 34.0) * 1000);
    const tolerancePct = a.tolerance_pct ?? 0.5;
    const isVarianceExceeded = Math.abs(((netWeight - dispatchNet) / dispatchNet) * 100) > tolerancePct;

    if (successDone) {
      return (
        <div style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '40px', backgroundColor: 'var(--color-success-bg)', borderRadius: '16px', border: '1.5px solid var(--color-success-light)', boxShadow: 'var(--shadow-card)' }}>
          <CheckCircle2 size={56} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success-text)', margin: '0 0 8px' }}>Truck Unloaded Successfully!</h2>
          <p style={{ fontSize: '14.5px', color: 'var(--color-success-text)', margin: '0 0 8px', fontWeight: 600 }}>
            PO #{a.sap_po_no} — Net Weight: {netTons} Tons
          </p>
          <p style={{ fontSize: '13.5px', color: 'var(--color-success-text)', opacity: 0.9, margin: '0 0 28px' }}>
            The delivery receipt has been stamped. The driver can now upload the POD document.
          </p>
          <button
            onClick={handleBack}
            className="btn btn-primary"
            style={{ minHeight: '44px', padding: '12px 28px' }}
          >
            Back to Trucks Queue
          </button>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBack}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={14} /> All Trucks
          </button>
          <span style={{ color: 'var(--color-border)' }}>›</span>
          <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-heading)' }}>PO #{a.sap_po_no}</span>
          <span style={{ marginLeft: 'auto' }}><StatusBadge status={a.status} /></span>
        </div>

        {/* Header Banner: White card with a light blue tinted header strip */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '16px',
          border: '1.5px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ backgroundColor: 'var(--color-brand-blue-50)', padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-brand-blue-700)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Incoming Delivery — Unloading Yard
            </h3>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <InfoBit label="PO Number" value={`PO #${a.sap_po_no}`} mono />
              <InfoBit label="Driver" value={a.driver_name || '—'} />
              <InfoBit label="Truck" value={a.vehicle_reg || '—'} mono />
              <InfoBit label="Cargo" value={a.material || '—'} />
            </div>
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg-page)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--color-border)' }}>
              <MapPin size={14} color="var(--color-brand-blue-600)" />
              <span style={{ fontSize: '12.5px', color: 'var(--color-text-body)' }}>
                <strong>From:</strong> {a.from_location || 'MON1 Plant / Siding'} &nbsp;→&nbsp; <strong>To:</strong> {a.to_location || 'Emoyeni Siding'}
              </span>
            </div>
          </div>
        </div>

        {/* ── ORIGIN WEIGHBRIDGE CERTIFICATE — READ ONLY LOCK ── */}
        <div style={{
          backgroundColor: 'var(--color-bg-page)', borderRadius: '16px', border: '1.5px solid var(--color-border)',
          padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-heading)', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={14} color="var(--color-text-muted)" />
              <span>ORIGIN WEIGHBRIDGE CERTIFICATE</span>
              <span className="badge badge-neutral" style={{ padding: '2px 8px', fontSize: '10px' }}>READ ONLY</span>
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Source: Supervisor Gate</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', fontSize: '13px', backgroundColor: 'var(--color-bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Bilty Reference</span>
              <strong className="mono" style={{ color: 'var(--color-text-heading)', fontSize: '14px' }}>{(a as any).bilty_no || 'BLT-778899'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Origin Tare</span>
              <strong className="mono" style={{ color: 'var(--color-text-heading)', fontSize: '14px' }}>{(a as any).mine_tare_kg ? `${(a as any).mine_tare_kg.toLocaleString()} kg` : '10,000 kg'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Origin Gross</span>
              <strong className="mono" style={{ color: 'var(--color-text-heading)', fontSize: '14px' }}>{(a as any).mine_gross_kg ? `${(a as any).mine_gross_kg.toLocaleString()} kg` : '44,000 kg'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>Net Dispatch</span>
              <strong className="mono" style={{ color: 'var(--color-brand-blue-600)', fontSize: '15px' }}>
                {(a as any).mine_gross_kg && (a as any).mine_tare_kg
                  ? `${(((a as any).mine_gross_kg - (a as any).mine_tare_kg) / 1000).toFixed(2)} Tons`
                  : '34.00 Tons'}
              </strong>
            </div>
          </div>
        </div>

        {/* ── Step 1: Record Destination Scale Weights (Gross & Tare) ── */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: weighSaved ? '1.5px solid var(--color-border)' : '2.5px solid var(--color-brand-blue-600)', overflow: 'hidden', boxShadow: weighSaved ? 'var(--shadow-card)' : 'var(--shadow-card-hover)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
            backgroundColor: weighSaved ? 'var(--color-bg-card)' : 'var(--color-brand-blue-50)'
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: weighSaved ? 'var(--color-brand-blue-600)' : 'var(--color-brand-blue-600)', color: '#fff', fontWeight: 800, fontSize: '13px'
            }}>
              {weighSaved ? <Check size={16} /> : <Scale size={16} />}
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                Step 1: Record Destination Scale Measurements (Yard Scale)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Enter the receiving gross and tare readings captured on your destination scale
              </div>
            </div>
            {weighSaved && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Saved ✓</span>}
          </div>

          <div style={{ padding: '22px' }}>
            <form onSubmit={handleCaptureWeights} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Destination Gross Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={destGross}
                    onChange={e => setDestGross(e.target.value)}
                    placeholder="e.g. 43900"
                    style={{ width: '100%', padding: '14px 16px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '18px', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                    disabled={weighSaved}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Destination Tare Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={destTare}
                    onChange={e => setDestTare(e.target.value)}
                    placeholder="e.g. 9950"
                    style={{ width: '100%', padding: '14px 16px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '18px', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                    disabled={weighSaved}
                  />
                </div>
              </div>

              {/* Weight Reconciliation & Variance */}
              {destGross && destTare && (
                <div style={{ 
                  backgroundColor: isVarianceExceeded ? 'var(--color-error-bg)' : 'var(--color-success-bg)', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  border: isVarianceExceeded ? '1px solid var(--color-error-light)' : '1px solid var(--color-success-light)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isVarianceExceeded ? 'var(--color-error-text)' : 'var(--color-success-text)', textTransform: 'uppercase' }}>⚖️ WEIGHT RECONCILIATION & VARIANCE</span>
                    <span className={isVarianceExceeded ? 'badge badge-red' : 'badge badge-green'}>
                      {isVarianceExceeded ? `🔴 OUTSIDE TOLERANCE (±${tolerancePct}%)` : '✓ WITHIN TOLERANCE'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: isVarianceExceeded ? 'var(--color-error-text)' : 'var(--color-success-text)', opacity: 0.8, display: 'block' }}>Dispatch Net</span>
                      <strong style={{ color: isVarianceExceeded ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>{dispatchNet.toLocaleString()} kg</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: isVarianceExceeded ? 'var(--color-error-text)' : 'var(--color-success-text)', opacity: 0.8, display: 'block' }}>Received Net</span>
                      <strong style={{ color: isVarianceExceeded ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>{isNaN(netWeight) ? '0' : netWeight.toLocaleString()} kg</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: isVarianceExceeded ? 'var(--color-error-text)' : 'var(--color-success-text)', opacity: 0.8, display: 'block' }}>Difference</span>
                      <strong style={{ color: isVarianceExceeded ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>
                        {isNaN(netWeight) ? '0' : (netWeight - dispatchNet).toLocaleString()} kg
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: isVarianceExceeded ? 'var(--color-error-text)' : 'var(--color-success-text)', opacity: 0.8, display: 'block' }}>Variance %</span>
                      <strong style={{ color: isVarianceExceeded ? 'var(--color-error-text)' : 'var(--color-success-text)' }}>
                        {isNaN(netWeight) ? '0%' : `${(((netWeight - dispatchNet) / dispatchNet) * 100).toFixed(2)}%`}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Any Damage, Variance or Issues? (Notes)</label>
                <input
                  type="text"
                  value={issues}
                  onChange={e => setIssues(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontSize: '13px', backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
                  disabled={weighSaved}
                />
              </div>

              {!weighSaved && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ minHeight: '48px', padding: '14px', width: '100%', justifyContent: 'center' }}
                >
                  {isSubmitting ? 'Saving Receiving Scale Data...' : 'Save Destination Scale & Reconcile'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* ── Step 2: Confirm Unloading & Close ── */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)', borderRadius: '16px',
          border: '1.5px solid var(--color-border)', overflow: 'hidden',
          opacity: !weighSaved ? 0.5 : 1,
          pointerEvents: !weighSaved ? 'none' : 'auto',
          transition: 'all 0.3s'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
            backgroundColor: weighSaved ? 'var(--color-bg-card)' : 'var(--color-bg-card)'
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: weighSaved ? 'var(--color-brand-blue-600)' : 'var(--color-border)',
              color: weighSaved ? '#fff' : 'var(--color-text-muted)', fontWeight: 800
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text-heading)' }}>
                Step 2: Confirm Unloading & Stamp Receipt
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2.5px' }}>
                Stamp the delivery. Received Net Weight: <strong>{netTons} Tons</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '22px' }}>
            <button
              onClick={handleStampConfirm}
              disabled={isSubmitting || !weighSaved}
              className="btn btn-primary"
              style={{
                width: '100%', minHeight: '48px', padding: '16px', fontSize: '15px', fontWeight: 800,
                backgroundColor: 'var(--color-brand-blue-600)',
                color: '#fff',
                justifyContent: 'center',
                boxShadow: weighSaved ? 'var(--shadow-card-hover)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? 'Processing...' : <><CheckCircle2 size={18} /> Save Stamp & Close Truck Unloading</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Yard Receiving Gate</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            Trucks arriving at your yard. Click any truck to record weights and confirm unloading.
          </p>
        </div>
        <button
          onClick={loadIncoming}
          disabled={loading}
          className="btn btn-ghost btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading incoming trucks...</div>
      ) : incoming.length === 0 ? (
        <EmptyState
          icon={<PackageCheck size={48} />}
          title="No Trucks Incoming"
          description="No trucks are currently on their way to your yard. Check back later."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {incoming.map(a => (
            <div
              key={a.id}
              onClick={() => setSelectedAssignment(a)}
              style={{
                backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: '1px solid var(--color-border)',
                padding: '18px 22px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '18px',
                boxShadow: 'var(--shadow-card)', transition: 'all var(--transition-normal)'
              }}
              onMouseEnter={e => { 
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)'; 
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; 
              }}
              onMouseLeave={e => { 
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'; 
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; 
              }}
            >
              {/* Left blue accent indicator */}
              <div style={{ width: '4px', height: '54px', borderRadius: '2px', backgroundColor: 'var(--color-brand-blue-600)', flexShrink: 0 }} />

              {/* PO */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO</div>
                <div className="mono" style={{ fontSize: '17px', fontWeight: 900, color: 'var(--color-text-primary)' }}>#{a.sap_po_no}</div>
              </div>

              <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--color-border)' }} />

              {/* Driver + Truck */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{a.driver_name || 'Driver'}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Truck size={11} /> <span className="mono">{a.vehicle_reg}</span>
                </div>
              </div>

              {/* Material */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Product</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{a.material}</div>
              </div>

              {/* From → To */}
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{a.from_location || 'MON1 Siding'}</span>
                <ArrowRight size={12} color="var(--color-border)" />
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{a.to_location || 'Emoyeni Siding'}</span>
              </div>

              <StatusBadge status={a.status} />

              <div 
                className="btn btn-secondary btn-sm"
                style={{
                  backgroundColor: 'var(--color-brand-blue-50)', color: 'var(--color-brand-blue-600)',
                  border: 'none', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap'
                }}
              >
                Process Unload →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
