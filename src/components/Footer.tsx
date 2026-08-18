import React from 'react';
import { PodzoLogo } from './branding/PodzoLogo';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#0A192F',
        color: '#FFFFFF',
        padding: '48px 32px 24px 32px',
        marginTop: '60px',
        borderTop: '4px solid #FF5B00',
        fontSize: '13px',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--content-max-width)',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '32px',
          paddingBottom: '40px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Brand Column */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 16px', borderRadius: '10px', display: 'inline-block', marginBottom: '14px' }}>
            <PodzoLogo variant="full" height={44} />
          </div>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: 1.6, margin: 0, maxWidth: '340px' }}>
            Enterprise Transport Execution & Proof-of-Delivery Platform. Integrated directly with SAP S/4HANA for automated MIRO invoice clearing.
          </p>
        </div>

        {/* Column 1: Transport */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Transport
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><a href="#/admin/dashboard" style={{ color: '#CCCCCC', textDecoration: 'none' }}>Fleet Control Tower</a></li>
            <li><a href="#/admin/contracts" style={{ color: '#CCCCCC', textDecoration: 'none' }}>Outline Contracts</a></li>
            <li><a href="#/transporter/purchase-orders" style={{ color: '#CCCCCC', textDecoration: 'none' }}>Purchase Orders</a></li>
            <li><a href="#/transporter/dashboard" style={{ color: '#CCCCCC', textDecoration: 'none' }}>Carrier Console</a></li>
          </ul>
        </div>

        {/* Column 2: POD & Execution */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            POD
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><a href="#/transporter/pods" style={{ color: '#CCCCCC', textDecoration: 'none' }}>POD Document Upload</a></li>
            <li><a href="#/admin/approvals" style={{ color: '#CCCCCC', textDecoration: 'none' }}>OCR Verification Desk</a></li>
            <li><a href="#/supervisor/dashboard" style={{ color: '#CCCCCC', textDecoration: 'none' }}>Weighbridge Siding Gate</a></li>
            <li><a href="#/customer/dashboard" style={{ color: '#CCCCCC', textDecoration: 'none' }}>Yard Receiving Gate</a></li>
          </ul>
        </div>

        {/* Column 3: Documents & MIRO */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Documents
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><a href="#/admin/invoices" style={{ color: '#CCCCCC', textDecoration: 'none' }}>SAP MIRO Invoices</a></li>
            <li><a href="#/transporter/invoices" style={{ color: '#CCCCCC', textDecoration: 'none' }}>Tax Invoices & Ledger</a></li>
            <li><a href="#/supervisor/dashboard" style={{ color: '#CCCCCC', textDecoration: 'none' }}>Lorry Receipts / Bilty</a></li>
            <li><a href="#/admin/approvals" style={{ color: '#CCCCCC', textDecoration: 'none' }}>Audit Event Log</a></li>
          </ul>
        </div>

        {/* Column 4: Integration & Security */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Security & Integration
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><span style={{ color: '#CCCCCC' }}>SAP S/4HANA OData v2</span></li>
            <li><span style={{ color: '#CCCCCC' }}>Role-Based Access (RBAC)</span></li>
            <li><span style={{ color: '#CCCCCC' }}>JWT Auth Protection</span></li>
            <li><span style={{ color: '#CCCCCC' }}>25 Active Seed POs</span></li>
          </ul>
        </div>
      </div>

      {/* Copyright & Language Bar */}
      <div
        style={{
          maxWidth: 'var(--content-max-width)',
          margin: '20px auto 0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#666666',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          © {new Date().getFullYear()} PODZO Limited • POD Control Desk. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>Global Enterprise Edition</span>
          <span>•</span>
          <span>SAP S/4HANA Ready</span>
        </div>
      </div>
    </footer>
  );
};
