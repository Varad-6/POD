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
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [weighSaved, setWeighSaved] = useState(false);
  const [successDone, setSuccessDone] = useState(false);

  const loadIncoming = async () => {
    setLoading(true);
    setOtpVerified(false);
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

  const handleBack = () => {
    setSelectedAssignment(null);
    setOtpCode('');
    setOtpVerified(false);
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

  const handleVerifyOTP = async () => {
    if (!selectedAssignment || !otpCode) return;
    setIsSubmitting(true);
    try {
      await drApi.otpVerify(selectedAssignment.id, 'DELIVERY', otpCode);
      setOtpVerified(true);
    } catch (err) {
      alert('Wrong code. Ask the driver for the correct code on their phone.');
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

        {/* Source Siding Weights & Bilty Comparison */}
        {((a as any).mine_gross_kg || (a as any).bilty_no) && (
          <div style={{
            backgroundColor: '#FFFBEB', borderRadius: '12px', border: '1px solid #FEF3C7',
            padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏭 Source Siding Dispatch Verification</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '13px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#B45309', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Bilty Number</span>
                <strong className="mono" style={{ color: '#78350F' }}>{(a as any).bilty_no || '—'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#B45309', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Bilty Date</span>
                <strong style={{ color: '#78350F' }}>{(a as any).bilty_date || '—'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#B45309', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Mine Tare Weight</span>
                <strong className="mono" style={{ color: '#78350F' }}>{(a as any).mine_tare_kg ? `${(a as any).mine_tare_kg.toLocaleString()} kg` : '—'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#B45309', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Mine Gross Weight</span>
                <strong className="mono" style={{ color: '#78350F' }}>{(a as any).mine_gross_kg ? `${(a as any).mine_gross_kg.toLocaleString()} kg` : '—'}</strong>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Record Unload Weights ── */}
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
                Step 1: Record Unloaded Weights (Gross & Tare)
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                Read both weights from your yard scale and enter them here
              </div>
            </div>
            {weighSaved && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#059669', backgroundColor: '#D1FAE5', padding: '3px 10px', borderRadius: '20px' }}>Saved ✓</span>}
          </div>

          <div style={{ padding: '22px' }}>
            <form onSubmit={handleCaptureWeights} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    🚛📦 Loaded Truck Weight (Gross kg)
                  </label>
                  <input
                    type="number"
                    value={destGross}
                    onChange={e => setDestGross(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '18px', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}
                    disabled={weighSaved}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    🚛 Empty Truck Weight (Tare kg)
                  </label>
                  <input
                    type="number"
                    value={destTare}
                    onChange={e => setDestTare(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '18px', fontWeight: 700, textAlign: 'right', fontFamily: 'monospace' }}
                    disabled={weighSaved}
                  />
                </div>
              </div>

              {/* Net Weight Preview */}
              {!weighSaved && (
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Net Payload (Gross − Tare)</span>
                  <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>
                    {netWeight.toLocaleString()} kg = {netTons} Tons
                  </span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Any Damage or Issues? (Notes)</label>
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
                  {isSubmitting ? 'Saving...' : 'Save Offload Scale Value'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* ── Step 2: Verify Driver Delivery Code ── */}
        <div style={{
          backgroundColor: '#fff', borderRadius: '14px',
          border: otpVerified ? '1px solid #D1FAE5' : weighSaved ? '2px solid #8B5CF6' : '1px solid #E2E8F0',
          overflow: 'hidden', opacity: !weighSaved ? 0.5 : 1,
          pointerEvents: !weighSaved ? 'none' : 'auto',
          transition: 'all 0.3s'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
            backgroundColor: otpVerified ? '#F0FDF4' : weighSaved ? '#F5F3FF' : '#F8FAFC'
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: otpVerified ? '#10B981' : weighSaved ? '#8B5CF6' : '#E2E8F0',
              color: otpVerified || weighSaved ? '#fff' : '#94A3B8', fontWeight: 800
            }}>
              {otpVerified ? <CheckCircle2 size={18} /> : '🔑'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: otpVerified ? '#065F46' : weighSaved ? '#5B21B6' : '#94A3B8' }}>
                Step 2: Check Driver's Secret Delivery Code
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                Ask the driver for the 4-digit code on their phone
              </div>
            </div>
            {otpVerified && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#059669', backgroundColor: '#D1FAE5', padding: '3px 10px', borderRadius: '20px' }}>Verified ✓</span>}
            {!weighSaved && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#CBD5E1' }}>Complete Step 1 first</span>}
          </div>

          <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="Enter 4-digit code"
                className="mono"
                style={{
                  flex: 1, padding: '14px 16px', border: '1px solid #E2E8F0',
                  borderRadius: '10px', fontSize: '24px', fontWeight: 800, letterSpacing: '0.15em', textAlign: 'center',
                  backgroundColor: otpVerified ? '#D1FAE5' : '#F8FAFC'
                }}
                disabled={otpVerified}
              />
              {!otpVerified && (
                <button
                  onClick={handleVerifyOTP}
                  disabled={isSubmitting || !otpCode || !weighSaved}
                  style={{
                    padding: '14px 20px', backgroundColor: '#8B5CF6', color: '#fff', border: 'none',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Check Secret Code
                </button>
              )}
            </div>
            {otpVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '13px', fontWeight: 600 }}>
                <CheckCircle2 size={16} /> Code verified! Driver is confirmed.
              </div>
            )}
          </div>
        </div>

        {/* ── Step 3: Confirm & Close ── */}
        <div style={{
          backgroundColor: '#fff', borderRadius: '14px',
          border: '1px solid #E2E8F0', overflow: 'hidden',
          opacity: !otpVerified ? 0.5 : 1,
          pointerEvents: !otpVerified ? 'none' : 'auto',
          transition: 'all 0.3s'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9',
            backgroundColor: otpVerified ? '#ECFDF5' : '#F8FAFC'
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: otpVerified ? '#059669' : '#E2E8F0',
              color: otpVerified ? '#fff' : '#94A3B8', fontWeight: 800
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: otpVerified ? '#065F46' : '#94A3B8' }}>
                Step 3: Confirm Unloading & Close
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                Stamp the delivery. Net weight: <strong>{netTons} Tons</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '22px' }}>
            <button
              onClick={handleStampConfirm}
              disabled={isSubmitting || !otpVerified}
              style={{
                width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800,
                backgroundColor: otpVerified ? '#059669' : '#E2E8F0',
                color: otpVerified ? '#fff' : '#94A3B8',
                border: 'none', borderRadius: '10px',
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: otpVerified ? '0 4px 16px rgba(5,150,105,0.3)' : 'none',
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
