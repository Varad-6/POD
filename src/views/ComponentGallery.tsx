import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Tabs } from '../components/Tabs';
import { ShieldCheck, Truck, ShoppingBag, ArrowRight } from 'lucide-react';

export const ComponentGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tab-1');
  const mockTabs = [
    { id: 'tab-1', label: 'All Orders', count: 12 },
    { id: 'tab-2', label: 'Needs Action', count: 3 },
    { id: 'tab-3', label: 'Completed', count: 9 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '12px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-h2-desktop)', fontWeight: 800, color: 'var(--color-text-heading)' }}>
          PODZO component gallery (Design system v3)
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '6px' }}>
          This page renders all visual design components matching the Odama/Railpass blue theme reference.
        </p>
      </div>

      {/* ── BUTTON SECTION ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-heading)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          1. Buttons (Section 5)
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Button</button>
          <button className="btn btn-danger">Danger Button</button>
          <button className="btn btn-primary" disabled>Disabled Button</button>
          <button className="btn btn-primary btn-sm">Small Button</button>
          <button className="btn btn-primary btn-lg">Large Button (48px+)</button>
        </div>
      </section>

      {/* ── STATUS PILLS SECTION ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-heading)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          2. Status Pills (StatusBadge)
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 700 }}>SUCCESS STATE (Green)</div>
            <StatusBadge status="CLEARED" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 700 }}>WARNING STATE (Orange)</div>
            <StatusBadge status="UNDER_REVIEW" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 700 }}>ERROR STATE (Red)</div>
            <StatusBadge status="SUPERVISOR_REJECTED" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 700 }}>INFO STATE (Blue)</div>
            <StatusBadge status="EN_ROUTE" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 700 }}>NEUTRAL STATE (Gray)</div>
            <StatusBadge status="UNASSIGNED" />
          </div>
        </div>
      </section>

      {/* ── TABS SECTION ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-heading)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          3. Tabs Strip
        </h2>
        <Tabs tabs={mockTabs} activeTab={activeTab} onChange={setActiveTab} />
      </section>

      {/* ── CARDS SECTION ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-heading)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          4. Cards & Modals Surface
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <Card title="Standard Card Component" subtitle="Clean white card, very soft shadow, 16px border-radius">
            <p style={{ color: 'var(--color-text-body)', fontSize: '14px', lineHeight: '1.6' }}>
              Generous internal padding matching Yoga Satria's reference style. Custom container elements nest safely inside this wrapper.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn-primary btn-sm">Primary action</button>
              <button className="btn btn-secondary btn-sm">Cancel</button>
            </div>
          </Card>
          
          <Card title="Interactive Active Card" accentColor="var(--color-brand-blue-600)" subtitle="Features subtle brand line indicator on top">
            <p style={{ color: 'var(--color-text-body)', fontSize: '14px', lineHeight: '1.6' }}>
              Perfect for indicating currently active runs, highlighted transactions, or user attention targets.
            </p>
          </Card>
        </div>
      </section>

      {/* ── KPI CARD SECTION ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-heading)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          5. KPI Metrics Cards
        </h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Flagged Reviews</div>
              <div className="kpi-value">3</div>
              <div className="kpi-trend kpi-trend--down" style={{ color: 'var(--color-error-text)' }}>Requires Attention</div>
            </div>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Active Shipments</div>
              <div className="kpi-value">12</div>
              <div className="kpi-trend kpi-trend--up" style={{ color: 'var(--color-success-text)' }}>In Transit</div>
            </div>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-brand-blue-50)', color: 'var(--color-brand-blue-600)' }}>
              <Truck size={20} />
            </div>
          </div>
          <div className="kpi-card">
            <div>
              <div className="kpi-label">cleared main invoices</div>
              <div className="kpi-value">₹4.8M</div>
              <div className="kpi-trend kpi-trend--up" style={{ color: 'var(--color-success-text)' }}>SAP Synced</div>
            </div>
            <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
        </div>
      </section>

      {/* ── DETAIL GRID (LABEL / VALUE) ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-heading)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          6. Detail Inspector Grid
        </h2>
        <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', maxWidth: '500px' }}>
          <div className="data-grid-2">
            <div>
              <div className="data-pair__label">PO Number</div>
              <div className="data-pair__value mono">PO-900889</div>
            </div>
            <div>
              <div className="data-pair__label">Transporter</div>
              <div className="data-pair__value">Vuka Logistics</div>
            </div>
            <div>
              <div className="data-pair__label">Allocated Truck</div>
              <div className="data-pair__value mono">KM-40-LP-GP</div>
            </div>
            <div>
              <div className="data-pair__label">Net Weight</div>
              <div className="data-pair__value">34.2 Tons</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATA TABLE ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-heading)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          7. Standard Data Table
        </h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Origin Gate</th>
                <th>Status</th>
                <th className="col-numeric">Amount (ZAR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Run #2991</td>
                <td>Witbank Siding 02</td>
                <td><StatusBadge status="CLEARED" /></td>
                <td className="col-numeric">R 4,500.00</td>
              </tr>
              <tr>
                <td>Run #2992</td>
                <td>Duvha Siding 01</td>
                <td><StatusBadge status="UNDER_REVIEW" /></td>
                <td className="col-numeric">R 12,800.00</td>
              </tr>
              <tr>
                <td>Run #2993</td>
                <td>Witbank Siding 02</td>
                <td><StatusBadge status="EN_ROUTE" /></td>
                <td className="col-numeric">R 8,250.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
