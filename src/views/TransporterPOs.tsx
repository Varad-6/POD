import React, { useState, useRef, useEffect } from 'react';
import { FileSignature, CheckCircle2, RotateCcw, PenTool } from 'lucide-react';
import { useDemo, PurchaseOrder } from '../context/DemoContext';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/format';

export const TransporterPOs: React.FC = () => {
  const { purchaseOrders, acceptPO } = useDemo();
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED'>('ALL');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  // Signature pad states
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filters POs
  const filteredPOs = purchaseOrders.filter((po) => {
    if (activeFilter === 'PENDING') return po.status === 'PENDING_SIGNATURE';
    if (activeFilter === 'ACCEPTED') return po.status === 'ACCEPTED_SIGNED';
    return true;
  });

  // Canvas drawing handlers
  useEffect(() => {
    if (selectedPO && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1F4E79';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [selectedPO]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsCanvasEmpty(false);

    const pos = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCoordinates(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsCanvasEmpty(true);
  };

  const handleAcceptPO = async () => {
    if (!selectedPO || isCanvasEmpty || !canvasRef.current) return;
    setIsSubmitting(true);
    
    // Capture signature image
    const dataUrl = canvasRef.current.toDataURL();
    
    await acceptPO(selectedPO.poNumber, dataUrl);
    
    setIsSubmitting(false);
    setSelectedPO(null);
    setIsCanvasEmpty(true);
  };

  const filterTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: active ? 'var(--primary-color)' : 'transparent',
    color: active ? '#ffffff' : 'var(--neutral-secondary)',
    border: '1px solid ' + (active ? 'var(--primary-color)' : 'var(--border-grey)'),
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s'
  });

  return (
    <div>
      {/* Tabs Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => setActiveFilter('ALL')} style={filterTabStyle(activeFilter === 'ALL')}>All</button>
        <button onClick={() => setActiveFilter('PENDING')} style={filterTabStyle(activeFilter === 'PENDING')}>Pending Signature</button>
        <button onClick={() => setActiveFilter('ACCEPTED')} style={filterTabStyle(activeFilter === 'ACCEPTED')}>Accepted</button>
      </div>

      {/* PO Cards Grid */}
      {filteredPOs.length === 0 ? (
        <EmptyState 
          message="No Purchase Orders found" 
          submessage="Try toggling your filters or wait for new PO releases."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {filteredPOs.map((po) => (
            <Card key={po.poNumber} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header block with flex to avoid badge collisions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '4px' }}>
                    PO #{po.poNumber}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', fontWeight: 500 }}>
                    Date: {formatDate(po.poDate)}
                  </p>
                </div>
                <StatusBadge status={po.status} />
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Material</p>
                  <p style={{ fontWeight: 600 }}>{po.material}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Rate Agreement</p>
                  <p style={{ fontWeight: 600 }}>{formatCurrency(po.rate)} / {po.unit}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Est. Volume</p>
                  <p style={{ fontWeight: 600 }}>{po.estimatedQuantity} {po.unit}s</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Cost Center</p>
                  <p style={{ fontWeight: 600 }}>{po.costCenter}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Route Details</p>
                  <p style={{ fontWeight: 500, fontSize: '13px' }}>{po.route}</p>
                </div>
              </div>

              {/* Action Button */}
              {po.status === 'PENDING_SIGNATURE' ? (
                <button 
                  onClick={() => setSelectedPO(po)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  <PenTool size={16} />
                  Review & Sign
                </button>
              ) : (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--success-bg)',
                    color: 'var(--success-text)',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginTop: 'auto'
                  }}
                >
                  <CheckCircle2 size={16} />
                  Signed by {po.signedBy} on {formatDate(po.signedDate || '')}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* PO Detail & E-Sign Modal */}
      <Modal
        isOpen={!!selectedPO}
        onClose={() => { if (!isSubmitting) setSelectedPO(null); }}
        title={selectedPO ? `Review PO #${selectedPO.poNumber}` : ''}
        width="680px"
      >
        {selectedPO && (
          <div>
            {/* Details Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>TRANSPORTER COMPANY</p>
                <p style={{ fontWeight: 600, color: 'var(--neutral-primary)' }}>{selectedPO.transporter}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>ESTIMATED TOTAL VALUE</p>
                <p style={{ fontWeight: 700, color: 'var(--success-text)', fontSize: '16px' }}>
                  {formatCurrency(selectedPO.estimatedQuantity * selectedPO.rate)}
                </p>
              </div>
              <div style={{ gridColumn: 'span 2', height: '1px', backgroundColor: 'var(--border-grey)' }}></div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>MATERIAL TYPE</p>
                <p style={{ fontWeight: 500 }}>{selectedPO.material}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>CONTRACT RATE</p>
                <p style={{ fontWeight: 500 }}>{formatCurrency(selectedPO.rate)} / {selectedPO.unit}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>ROUTE DEFINITION</p>
                <p style={{ fontWeight: 500, fontSize: '13px' }}>{selectedPO.route}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--neutral-secondary)', fontWeight: 600 }}>PAYMENT CONTRACT TERMS</p>
                <p style={{ fontWeight: 500 }}>{selectedPO.paymentTerms}</p>
              </div>
            </div>

            {/* Signature Area */}
            <div style={{ borderTop: '1px solid var(--border-grey)', paddingTop: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-color)' }}>DIGITAL SIGNATURE</h4>
                <button 
                  onClick={clearCanvas} 
                  disabled={isCanvasEmpty || isSubmitting}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isCanvasEmpty ? 'var(--neutral-secondary)' : 'var(--error-text)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={12} />
                  Clear Sign
                </button>
              </div>

              {/* Drawing Box */}
              <div style={{ position: 'relative', width: '100%', height: '150px', border: '2px solid var(--border-grey)', borderRadius: '8px', backgroundColor: '#fafafa', overflow: 'hidden' }}>
                {isCanvasEmpty && (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      pointerEvents: 'none',
                      color: 'var(--neutral-secondary)',
                      fontSize: '13px'
                    }}
                  >
                    Draw signature here with mouse or touch
                  </div>
                )}
                <canvas 
                  ref={canvasRef}
                  width={630}
                  height={146}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ display: 'block', cursor: 'crosshair', width: '100%', height: '100%' }}
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--neutral-secondary)', marginTop: '8px', fontWeight: 500 }}>
                Date Stamped: {formatDate(new Date())}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedPO(null)} 
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleAcceptPO} 
                disabled={isCanvasEmpty || isSubmitting}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                {isSubmitting ? 'Accepting...' : 'Accept & Sign PO'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
