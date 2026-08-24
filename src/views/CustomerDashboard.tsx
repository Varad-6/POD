import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { crApi, drApi, TransportAssignmentV3 } from '../lib/api_v3';
import {
  PackageCheck, ShieldCheck, CheckCircle2, Scale, ArrowLeft,
  Truck, MapPin, Clock, RefreshCw, ArrowRight, AlertTriangle
} from 'lucide-react';

// ─── Info section ─────────────────────────────────────────────────────────────
const InfoBit: React.FC<{ label: string; value: string | number; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    <div className={mono ? 'mono' : ''} style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{value}</div>
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
      setUnitCalc(`Convert ${targetQtyKg} kg to ${targetQtyTons} ${selectedAssignment.po_uom === 'TO' ? 'Tons' : (selectedAssignment.po_uom || 'Tons')}`);
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

    if (successDone) {
      return (
        <div style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center', padding: '40px', backgroundColor: '#F0FDF4', borderRadius: '20px', border: '2px solid #10B981' }}>
          <CheckCircle2 size={56} color="#10B981" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#065F46', margin: '0 0 8px' }}>Truck Unloaded Successfully!</h2>
          <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 8px' }}>
            PO #{a.sap_po_no} — Net Weight: {netTons} Tons
          </p>
          <p style={{ fontSize: '13px', color: '#059669', margin: '0 0 28px' }}>
            The delivery receipt has been stamped. The driver can now upload the POD document.
          </p>
          <button
            onClick={handleBack}
            style={{ padding: '12px 28px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            Back to Trucks Queue
          </button>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBack}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#fff', fontSize: '13px', fontWeight: 600, color: '#64748B', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} /> All Trucks
          </button>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>PO #{a.sap_po_no}</span>
          <span style={{ marginLeft: 'auto' }}><StatusBadge status={a.status} /></span>
        </div>

        {/* Header Banner — shows siding info from supervisor/driver */}
        <div style={{
          background: 'linear-gradient(135deg, #0F4C81 0%, #1565C0 100%)',
          borderRadius: '14px', padding: '22px 26px', color: '#fff',
          boxShadow: '0 6px 24px rgba(21,101,192,0.25)'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
            Incoming Delivery — Unloading Yard
          </div>
          <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
            <InfoBit label="PO Number" value={`PO #${a.sap_po_no}`} mono />
            <InfoBit label="Driver" value={a.driver_name || '—'} />
            <InfoBit label="Truck" value={a.vehicle_reg || '—'} mono />
            <InfoBit label="Cargo" value={a.material || '—'} />
          </div>
          <div style={{ marginTop: '16px', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin size={14} color="rgba(255,255,255,0.7)" />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
              <strong>From:</strong> {a.from_location || 'MON1 Plant / Siding'} &nbsp;→&nbsp; <strong>To:</strong> {a.to_location || 'PODZO Mining – Emoyeni Siding'}
            </span>
          </div>
        </div>

        {/* ── ORIGIN WEIGHBRIDGE CERTIFICATE — READ ONLY LOCK ── */}
        <div style={{
          backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #CBD5E1',
          padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)', position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔒 ORIGIN WEIGHBRIDGE CERTIFICATE</span>
              <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#E2E8F0', color: '#475569', padding: '2px 8px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>READ ONLY • IMMUTABLE</span>
            </h4>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Source: Supervisor Weighbridge</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '13px', backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Bilty Reference</span>
              <strong className="mono" style={{ color: '#0F172A', fontSize: '14px' }}>{(a as any).bilty_no || 'BLT-778899'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Origin Tare Weight 🔒</span>
              <strong className="mono" style={{ color: '#0F172A', fontSize: '14px' }}>{(a as any).mine_tare_kg ? `${(a as any).mine_tare_kg.toLocaleString()} kg` : '10,000 kg'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Origin Gross Weight 🔒</span>
              <strong className="mono" style={{ color: '#0F172A', fontSize: '14px' }}>{(a as any).mine_gross_kg ? `${(a as any).mine_gross_kg.toLocaleString()} kg` : '44,000 kg'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#1E293B', fontWeight: 800, display: 'block', textTransform: 'uppercase' }}>Net Dispatch Tonnage 🔒</span>
              <strong className="mono" style={{ color: '#2563EB', fontSize: '16px' }}>
                {(a as any).mine_gross_kg && (a as any).mine_tare_kg
                  ? `${(((a as any).mine_gross_kg - (a as any).mine_tare_kg) / 1000).toFixed(2)} Tons`
                  : '34.00 Tons'}
              </strong>
            </div>
          </div>
        </div>

        {/* ── Step 1: Record Destination Scale Weights (Gross & Tare) ── */}
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: weighSaved ? '1px solid #D1FAE5' : '2px solid #3B82F6', overflow: 'hidden', boxShadow: weighSaved ? 'none' : '0 4px 20px rgba(59,130,246,0.1)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
            backgroundColor: weighSaved ? '#F0FDF4' : '#EFF6FF'
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: weighSaved ? '#10B981' : '#3B82F6', color: '#fff', fontWeight: 800, fontSize: '13px'
            }}>
              {weighSaved ? <CheckCircle2 size={18} /> : <Scale size={16} />}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: weighSaved ? '#065F46' : '#1D4ED8' }}>
                Step 1: Record Destination Scale Measurements (Yard Scale)
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                Enter the receiving gross and tare readings captured on your destination scale
              </div>
            </div>
            {weighSaved && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#059669', backgroundColor: '#D1FAE5', padding: '3px 10px', borderRadius: '20px' }}>Saved ✓</span>}
          </div>

          <div style={{ padding: '22px' }}>
            <form onSubmit={handleCaptureWeights} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    🚛📦 Destination Gross Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={destGross}
                    onChange={e => setDestGross(e.target.value)}
                    placeholder="e.g. 43900"
                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '18px', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}
                    disabled={weighSaved}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    🚛 Destination Tare Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={destTare}
                    onChange={e => setDestTare(e.target.value)}
                    placeholder="e.g. 9950"
                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '18px', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}
                    disabled={weighSaved}
                  />
                </div>
              </div>

              {/* Weight Reconciliation Preview */}
              {destGross && destTare && (
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>⚖️ WEIGHT RECONCILIATION & VARIANCE</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px',
                      backgroundColor: Math.abs(((netWeight - dispatchNet) / dispatchNet) * 100) > tolerancePct ? '#FEE2E2' : '#D1FAE5',
                      color: Math.abs(((netWeight - dispatchNet) / dispatchNet) * 100) > tolerancePct ? '#991B1B' : '#065F46'
                    }}>
                      {Math.abs(((netWeight - dispatchNet) / dispatchNet) * 100) > tolerancePct ? `🔴 OUTSIDE TOLERANCE (±${tolerancePct}%)` : '✓ WITHIN TOLERANCE'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>Dispatch Net</span>
                      <strong>{dispatchNet.toLocaleString()} kg</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>Received Net</span>
                      <strong>{isNaN(netWeight) ? '0' : netWeight.toLocaleString()} kg</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>Variance Difference</span>
                      <strong style={{ color: (netWeight - dispatchNet) < 0 ? '#DC2626' : '#059669' }}>
                        {isNaN(netWeight) ? '0' : (netWeight - dispatchNet).toLocaleString()} kg
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748B', display: 'block' }}>Variance %</span>
                      <strong style={{ color: Math.abs(((netWeight - dispatchNet) / dispatchNet) * 100) > tolerancePct ? '#DC2626' : '#059669' }}>
                        {isNaN(netWeight) ? '0%' : `${(((netWeight - dispatchNet) / dispatchNet) * 100).toFixed(2)}%`}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Any Damage, Variance or Issues? (Notes)</label>
                <input
                  type="text"
                  value={issues}
                  onChange={e => setIssues(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px' }}
                  disabled={weighSaved}
                />
              </div>

              {!weighSaved && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '14px', backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer' }}
                >
                  {isSubmitting ? 'Saving Receiving Scale Data...' : 'Save Destination Scale & Reconcile'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* ── Step 2: Confirm Unloading & Close ── */}
        <div style={{
          backgroundColor: '#fff', borderRadius: '14px',
          border: '1px solid #E2E8F0', overflow: 'hidden',
          opacity: !weighSaved ? 0.5 : 1,
          pointerEvents: !weighSaved ? 'none' : 'auto',
          transition: 'all 0.3s'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
            backgroundColor: weighSaved ? '#ECFDF5' : '#F8FAFC'
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: weighSaved ? '#059669' : '#E2E8F0',
              color: weighSaved ? '#fff' : '#94A3B8', fontWeight: 800
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: weighSaved ? '#065F46' : '#94A3B8' }}>
                Step 2: Confirm Unloading & Close
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                Stamp the delivery. Net weight: <strong>{netTons} Tons</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '22px' }}>
            <button
              onClick={handleStampConfirm}
              disabled={isSubmitting || !weighSaved}
              style={{
                width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800,
                backgroundColor: weighSaved ? '#059669' : '#E2E8F0',
                color: weighSaved ? '#fff' : '#94A3B8',
                border: 'none', borderRadius: '10px',
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: weighSaved ? '0 4px 16px rgba(5,150,105,0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? 'Processing...' : <><CheckCircle2 size={18} /> Save Stamp & Finish Truck Unloading</>}
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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Unloading Yard</h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
            Trucks arriving at your yard. Click any truck to record weights and confirm unloading.
          </p>
        </div>
        <button
          onClick={loadIncoming}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#64748B' }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Loading incoming trucks...</div>
      ) : incoming.length === 0 ? (
        <EmptyState
          icon={<PackageCheck size={48} />}
          title="No Trucks Incoming"
          description="No trucks are currently on their way to your yard. Check back later."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {incoming.map(a => (
            <div
              key={a.id}
              onClick={() => setSelectedAssignment(a)}
              style={{
                backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0',
                padding: '18px 22px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
            >
              {/* Blue left accent */}
              <div style={{ width: '4px', height: '54px', borderRadius: '2px', backgroundColor: '#3B82F6', flexShrink: 0 }} />

              {/* PO */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PO</div>
                <div className="mono" style={{ fontSize: '17px', fontWeight: 900, color: '#0F172A' }}>#{a.sap_po_no}</div>
              </div>

              <div style={{ width: '1px', height: '40px', backgroundColor: '#F1F5F9' }} />

              {/* Driver + Truck */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{a.driver_name || 'Driver'}</div>
                <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <Truck size={11} /> <span className="mono">{a.vehicle_reg}</span>
                </div>
              </div>

              {/* Material */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Product</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{a.material}</div>
              </div>

              {/* From → To */}
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{a.from_location || 'MON1 Siding'}</span>
                <ArrowRight size={12} color="#CBD5E1" />
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{a.to_location || 'Emoyeni Siding'}</span>
              </div>

              <StatusBadge status={a.status} />

              <div style={{
                padding: '8px 14px', backgroundColor: '#EFF6FF', color: '#1D4ED8',
                borderRadius: '8px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap'
              }}>
                Process Unload →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
