import subprocess
import os

html_code = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  body {
    background: #FFFFFF;
    width: 2400px;
    height: 1350px;
    padding: 36px 48px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  /* TOP HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .header h1 {
    font-size: 38px;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -0.5px;
  }
  .header h1 span.sap-blue {
    color: #0256B4;
  }
  .header h1 span.joule-purple {
    background: linear-gradient(135deg, #0256B4 0%, #6366F1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* MAIN GRID CONTAINER */
  .main-layout {
    display: flex;
    gap: 32px;
    flex: 1;
    position: relative;
  }

  /* LEFT SIDE (Diagram Core) - 1820px */
  .diagram-core {
    flex: 0 0 1820px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: relative;
  }

  /* STEP 1 CALLOUT ON FAR LEFT */
  .step-1-callout {
    position: absolute;
    left: -18px;
    top: 310px;
    width: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    z-index: 10;
  }
  .circle-badge-1 {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #0256B4;
    color: #FFF;
    font-size: 20px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(2, 86, 180, 0.3);
    margin-bottom: 8px;
  }
  .step-1-title {
    font-size: 13px;
    font-weight: 800;
    color: #0F172A;
    line-height: 1.2;
  }
  .step-1-icon {
    font-size: 28px;
    margin: 4px 0;
  }
  .step-1-desc {
    font-size: 11px;
    color: #64748B;
    line-height: 1.2;
  }

  /* 1. OPERATIONAL USERS BAR */
  .users-wrapper {
    background: #F0F6FF;
    border: 1px solid #D6E4FF;
    border-radius: 12px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: 130px;
  }
  .users-label {
    font-size: 14px;
    font-weight: 800;
    color: #0F172A;
    line-height: 1.2;
    width: 130px;
    flex-shrink: 0;
  }
  .users-label span {
    font-size: 11px;
    font-weight: 600;
    color: #64748B;
    display: block;
  }
  .users-list {
    display: flex;
    gap: 12px;
    flex: 1;
  }
  .u-card {
    flex: 1;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .u-card.admin { border-left: 4px solid #0284C7; }
  .u-card.transporter { border-left: 4px solid #F59E0B; background: #FFFDF9; }
  .u-card.weighbridge { border-left: 4px solid #10B981; }
  .u-card.driver { border-left: 4px solid #3B82F6; }
  .u-card.customer { border-left: 4px solid #8B5CF6; }
  .u-card.joule {
    flex: 1.25;
    background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
    border: 1.5px solid #6366F1;
    border-left: 5px solid #4F46E5;
    box-shadow: 0 3px 10px rgba(99, 102, 241, 0.15);
  }
  .u-icon {
    font-size: 24px;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F5F9;
    border-radius: 8px;
    flex-shrink: 0;
  }
  .u-card.admin .u-icon { background: #E0F2FE; color: #0369A1; }
  .u-card.transporter .u-icon { background: #FEF3C7; color: #D97706; }
  .u-card.weighbridge .u-icon { background: #D1FAE5; color: #059669; }
  .u-card.driver .u-icon { background: #DBEAFE; color: #2563EB; }
  .u-card.customer .u-icon { background: #EDE9FE; color: #7C3AED; }
  .u-card.joule .u-icon { background: #4F46E5; color: #FFFFFF; font-size: 20px; }
  
  .u-meta h4 { font-size: 13.5px; font-weight: 700; color: #0F172A; }
  .u-meta p { font-size: 11px; color: #64748B; font-weight: 500; margin-top: 1px; }
  .u-card.joule .u-meta h4 { color: #3730A3; font-weight: 800; display: flex; align-items: center; gap: 6px; }
  .u-card.joule .u-meta p { color: #4338CA; font-weight: 600; }
  .badge-action { background: #4F46E5; color: #FFF; font-size: 9.5px; padding: 1px 5px; border-radius: 3px; font-weight: 800; }

  /* 2. CENTER PODZO OPERATIONAL CORE BOX */
  .podzo-main-box {
    border: 2.5px solid #818CF8;
    background: #FFFFFF;
    border-radius: 16px;
    padding: 22px 26px;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.08);
    margin-left: 130px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .podzo-brand-row {
    display: flex;
    align-items: baseline;
    gap: 14px;
    border-bottom: 1.5px solid #E2E8F0;
    padding-bottom: 12px;
  }
  .podzo-logo-text {
    font-size: 28px;
    font-weight: 900;
    color: #0B3954;
    letter-spacing: -0.5px;
  }
  .podzo-tagline {
    font-size: 18px;
    font-weight: 700;
    color: #1E293B;
  }
  .podzo-runtime-badge {
    background: #EEF2FF;
    color: #4F46E5;
    border: 1px solid #C7D2FE;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 6px;
    margin-left: auto;
  }

  /* 3 COLUMNS INSIDE PODZO */
  .three-columns {
    display: flex;
    gap: 18px;
  }
  .col-box {
    flex: 1;
    background: #F8FAFC;
    border: 1.5px solid #E2E8F0;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .col-box.ai-active {
    background: #FAFBFD;
    border: 1.5px solid #C7D2FE;
  }
  .col-head {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 800;
    color: #0F172A;
    border-bottom: 1.5px solid #E2E8F0;
    padding-bottom: 8px;
  }
  .col-head span.head-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #E0F2FE;
    color: #0284C7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  .col-head span.sub {
    font-size: 11px;
    font-weight: 600;
    color: #64748B;
    margin-left: 4px;
  }

  /* INNER GRID CARDS */
  .grid-2x {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .card-item {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
  .card-item.featured {
    background: #EEF2FF;
    border: 1.5px solid #818CF8;
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.12);
  }
  .card-item.featured-green {
    background: #F0FDF4;
    border: 1.5px solid #86EFAC;
  }
  .card-item.featured-amber {
    background: #FFFBEB;
    border: 1.5px solid #FCD34D;
  }
  .c-ico {
    font-size: 18px;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: #F1F5F9;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .card-item.featured .c-ico { background: #E0E7FF; color: #4338CA; }
  .card-item.featured-green .c-ico { background: #DCFCE7; color: #15803D; }
  .card-item.featured-amber .c-ico { background: #FEF3C7; color: #B45309; }

  .c-txt h5 { font-size: 12px; font-weight: 700; color: #0F172A; }
  .c-txt p { font-size: 10px; color: #64748B; font-weight: 500; margin-top: 1px; }
  .card-item.featured .c-txt h5 { color: #312E81; font-weight: 800; }
  .card-item.featured .c-txt p { color: #4338CA; font-weight: 600; }

  /* 3. CONNECTOR BADGE 2 */
  .badge-2-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-left: 130px;
  }
  .badge-2-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #6366F1;
    color: #FFF;
    font-size: 17px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 8px rgba(99, 102, 241, 0.3);
  }
  .badge-2-text {
    font-size: 13.5px;
    font-weight: 800;
    color: #4338CA;
    background: #EEF2FF;
    border: 1px solid #C7D2FE;
    padding: 6px 16px;
    border-radius: 20px;
  }

  /* 4. SAP SYSTEM OF RECORD BOX */
  .sap-core-box {
    background: #F0F9FF;
    border: 2px solid #38BDF8;
    border-radius: 14px;
    padding: 16px 22px;
    margin-left: 130px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.12);
  }
  .sap-emblem {
    background: #0284C7;
    color: #FFFFFF;
    font-size: 22px;
    font-weight: 900;
    padding: 10px 18px;
    border-radius: 8px;
    letter-spacing: 0.5px;
  }
  .sap-header-info h3 {
    font-size: 16px;
    font-weight: 800;
    color: #0369A1;
  }
  .sap-header-info p {
    font-size: 11.5px;
    color: #0284C7;
    font-weight: 600;
  }
  .sap-entity-pills {
    display: flex;
    gap: 12px;
    flex: 1;
    justify-content: flex-end;
  }
  .entity-pill {
    background: #FFFFFF;
    border: 1.5px solid #BAE6FD;
    border-radius: 8px;
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: #0369A1;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .entity-pill.miro-posted {
    border-color: #10B981;
    background: #ECFDF5;
    color: #065F46;
  }
  .entity-pill span.code {
    background: #E0F2FE;
    color: #0284C7;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10.5px;
    font-weight: 800;
  }
  .entity-pill.miro-posted span.code {
    background: #D1FAE5;
    color: #047857;
  }

  /* RIGHT SIDE TIMELINE (STEPS 3 TO 8) - 520px */
  .timeline-container {
    flex: 0 0 520px;
    background: #FAFBFD;
    border: 2px solid #E2E8F0;
    border-radius: 16px;
    padding: 22px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }
  .timeline-head {
    font-size: 16px;
    font-weight: 900;
    color: #0F172A;
    border-bottom: 2px solid #CBD5E1;
    padding-bottom: 10px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .tl-step {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    position: relative;
    padding: 4px 0;
  }
  .tl-step:not(:last-child)::after {
    content: "";
    position: absolute;
    left: 17px;
    top: 38px;
    bottom: -8px;
    width: 2px;
    background: #CBD5E1;
  }

  .step-badge {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: #FFF;
    font-size: 15px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 2;
    box-shadow: 0 3px 8px rgba(0,0,0,0.15);
  }
  .step-badge.b-orange { background: #EA580C; }
  .step-badge.b-green { background: #16A34A; }
  .step-badge.b-blue { background: #0284C7; }
  .step-badge.b-purple { background: #7C3AED; }
  .step-badge.b-joule {
    background: linear-gradient(135deg, #4F46E5 0%, #D946EF 100%);
    box-shadow: 0 4px 12px rgba(217, 70, 239, 0.4);
  }

  .step-details {
    flex: 1;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
  .step-details.highlight-step {
    border: 1.5px solid #818CF8;
    background: #F8FAFF;
  }
  .sd-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }
  .sd-title {
    font-size: 13px;
    font-weight: 800;
    color: #0F172A;
  }
  .joule-pill-tag {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    color: #92400E;
    border: 1px solid #F59E0B;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .sd-desc {
    font-size: 11px;
    color: #475569;
    font-weight: 500;
    line-height: 1.3;
  }
  .sd-desc strong {
    color: #1E293B;
  }
  .sd-desc code {
    font-family: monospace;
    font-size: 10px;
    background: #E0E7FF;
    color: #3730A3;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: bold;
  }

  /* BOTTOM TECHNOLOGY FOUNDATION */
  .tech-footer {
    display: flex;
    gap: 16px;
    background: #F8FAFC;
    border: 1.5px solid #E2E8F0;
    border-radius: 12px;
    padding: 14px 20px;
    align-items: center;
    margin-top: 14px;
  }
  .tf-label {
    font-size: 13px;
    font-weight: 900;
    color: #0F172A;
    line-height: 1.2;
    border-right: 2px solid #CBD5E1;
    padding-right: 18px;
    flex-shrink: 0;
  }
  .tf-label span {
    font-size: 11px;
    font-weight: 600;
    color: #64748B;
    display: block;
  }
  .tf-grid {
    display: flex;
    gap: 16px;
    flex: 1;
  }
  .tf-card {
    flex: 1;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .tf-card.ai-focus {
    background: #EEF2FF;
    border: 1.5px solid #A5B4FC;
  }
  .tf-icon {
    font-size: 20px;
  }
  .tf-txt h6 {
    font-size: 11px;
    font-weight: 800;
    color: #0284C7;
    text-transform: uppercase;
  }
  .tf-card.ai-focus .tf-txt h6 {
    color: #4338CA;
  }
  .tf-txt p {
    font-size: 10px;
    color: #475569;
    font-weight: 500;
    margin-top: 1px;
  }
</style>
</head>
<body>

  <!-- TOP HEADER -->
  <div class="header">
    <h1>
      High-Level Solution Architecture for <span class="sap-blue">SAP-Connected Transport</span> & <span class="joule-purple">Joule AI Execution</span>
    </h1>
    <div style="text-align: right; font-size: 13px; color: #64748B;">
      <strong style="color: #0F172A; font-size: 15px;">ENTERPRISE ARCHITECTURAL SPECIFICATION</strong><br>
      Production Version 2.0 • SAP BTP Cloud Foundry
    </div>
  </div>

  <!-- MAIN DIAGRAM & WORKFLOW ROW -->
  <div class="main-layout">

    <!-- STEP 1 CALLOUT ON FAR LEFT -->
    <div class="step-1-callout">
      <div class="circle-badge-1">1</div>
      <div class="step-1-title">SAP Contracts & POs</div>
      <div class="step-1-icon">📄</div>
      <div class="step-1-desc">Contract data, PO details, master data</div>
    </div>

    <!-- LEFT DIAGRAM CORE -->
    <div class="diagram-core">

      <!-- 1. OPERATIONAL USERS BAR -->
      <div class="users-wrapper">
        <div class="users-label">
          Operational Users
          <span>(Role-Tailored UX)</span>
        </div>
        <div class="users-list">
          
          <div class="u-card admin">
            <div class="u-icon">👤</div>
            <div class="u-meta">
              <h4>Company Admin</h4>
              <p>Control Tower & Approvals</p>
            </div>
          </div>

          <div class="u-card transporter">
            <div class="u-icon">🚚</div>
            <div class="u-meta">
              <h4>Transporter Admin</h4>
              <p>POs & Fleet Scheduling</p>
            </div>
          </div>

          <div class="u-card weighbridge">
            <div class="u-icon">⚖️</div>
            <div class="u-meta">
              <h4>Weighbridge Operator</h4>
              <p>4-Point Siding Console</p>
            </div>
          </div>

          <div class="u-card driver">
            <div class="u-icon">📱</div>
            <div class="u-meta">
              <h4>Driver Web App</h4>
              <p>GPS & Stamped POD Cam</p>
            </div>
          </div>

          <div class="u-card customer">
            <div class="u-icon">🏭</div>
            <div class="u-meta">
              <h4>Receiving Customer</h4>
              <p>Yard Acceptance & Tare</p>
            </div>
          </div>

          <!-- JOULE CO-PILOT CARD -->
          <div class="u-card joule">
            <div class="u-icon">⚡</div>
            <div class="u-meta">
              <h4>SAP Joule Co-Pilot <span class="badge-action">ACTION PROJECT</span></h4>
              <p>Natural Language POST Actions (Work Zone)</p>
            </div>
          </div>

        </div>
      </div>

      <!-- 2. PODZO OPERATIONAL CORE BOX -->
      <div class="podzo-main-box">
        
        <div class="podzo-brand-row">
          <div class="podzo-logo-text">PODZO</div>
          <div style="font-size:24px; color:#94A3B8;">|</div>
          <div class="podzo-tagline">SAP-Connected Operational Execution & Joule Action Platform</div>
          <div class="podzo-runtime-badge">⚡ SAP BTP Cloud Foundry Runtime</div>
        </div>

        <div class="three-columns">
          
          <!-- Col 1: SAP & Joule Integration Layer -->
          <div class="col-box ai-active">
            <div class="col-head">
              <span class="head-icon">🔌</span>
              <div>SAP & Joule Integration Layer <span class="sub">(Secure & Governed)</span></div>
            </div>
            <div class="grid-2x">
              <div class="card-item featured">
                <div class="c-ico">⚡</div>
                <div class="c-txt">
                  <h5>Joule Action Gateway</h5>
                  <p>OpenAPI 3.0 POST Specs</p>
                </div>
              </div>
              <div class="card-item">
                <div class="c-ico">🌐</div>
                <div class="c-txt">
                  <h5>OData / REST APIs</h5>
                  <p>Real-Time SAP Ingestion</p>
                </div>
              </div>
              <div class="card-item">
                <div class="c-ico">🔄</div>
                <div class="c-txt">
                  <h5>RFC Proxy</h5>
                  <p>ABAP BAPI Remote Calls</p>
                </div>
              </div>
              <div class="card-item featured">
                <div class="c-ico">📜</div>
                <div class="c-txt">
                  <h5>sap_sync_log</h5>
                  <p>Immutable Audit Logger</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 2: PODZO Operational Core -->
          <div class="col-box">
            <div class="col-head">
              <span class="head-icon">⚙️</span>
              <div>PODZO Operational Core <span class="sub">(Execution & Verification)</span></div>
            </div>
            <div class="grid-2x">
              <div class="card-item featured-green">
                <div class="c-ico">🧠</div>
                <div class="c-txt">
                  <h5>Fuzzy Entity Resolver</h5>
                  <p>Auto-Maps Names/POs</p>
                </div>
              </div>
              <div class="card-item">
                <div class="c-ico">⚖️</div>
                <div class="c-txt">
                  <h5>4-Point Weighbridge</h5>
                  <p>Origin & Dest Net Weights</p>
                </div>
              </div>
              <div class="card-item">
                <div class="c-ico">📷</div>
                <div class="c-txt">
                  <h5>OCR Doc Matching</h5>
                  <p>Vision Waybill Extraction</p>
                </div>
              </div>
              <div class="card-item">
                <div class="c-ico">📊</div>
                <div class="c-txt">
                  <h5>Tolerance Engine</h5>
                  <p>Shrinkage Variance Guard</p>
                </div>
              </div>
              <div class="card-item featured-amber">
                <div class="c-ico">⚠️</div>
                <div class="c-txt">
                  <h5>Exception Review Queue</h5>
                  <p>Joule Release & Approve</p>
                </div>
              </div>
              <div class="card-item">
                <div class="c-ico">🔒</div>
                <div class="c-txt">
                  <h5>Document Vault</h5>
                  <p>SHA-256 State Signatures</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 3: Role-Governed Access -->
          <div class="col-box">
            <div class="col-head">
              <span class="head-icon">🛡️</span>
              <div>Role-Governed Access <span class="sub">(Security & Experience)</span></div>
            </div>
            <div class="grid-2x">
              <div class="card-item featured">
                <div class="c-ico">🔑</div>
                <div class="c-txt">
                  <h5>Dual-Role Evaluator</h5>
                  <p>CA / TA Dynamic Scopes</p>
                </div>
              </div>
              <div class="card-item">
                <div class="c-ico">🛡️</div>
                <div class="c-txt">
                  <h5>JWT / XSUAA Auth</h5>
                  <p>Zero-Trust Token Context</p>
                </div>
              </div>
              <div class="card-item">
                <div class="c-ico">👥</div>
                <div class="c-txt">
                  <h5>RBAC Security</h5>
                  <p>Granular Entitlements</p>
                </div>
              </div>
              <div class="card-item">
                <div class="c-ico">💻</div>
                <div class="c-txt">
                  <h5>SAP Fiori Design</h5>
                  <p>Horizon Design Language</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- 3. CONNECTOR BADGE 2 -->
      <div class="badge-2-row">
        <div class="badge-2-circle">2</div>
        <div class="badge-2-text">Secure SAP Integration (OData v4 / REST APIs / RFC Proxy / BAPI Destination)</div>
      </div>

      <!-- 4. SAP SYSTEM OF RECORD BOX -->
      <div class="sap-core-box">
        <div class="sap-emblem">SAP</div>
        <div class="sap-header-info">
          <h3>SAP System of Record</h3>
          <p>SAP S/4HANA Cloud • SAP ECC 6.0 • SAP S/21 Mining Solution</p>
        </div>
        <div class="sap-entity-pills">
          <div class="entity-pill">📑 Outline Contracts <span class="code">ME33K</span></div>
          <div class="entity-pill">🛒 Purchase Orders <span class="code">ME23N</span></div>
          <div class="entity-pill">📝 Service Entry Sheets <span class="code">ML81N</span></div>
          <div class="entity-pill miro-posted">💰 Supplier Invoices <span class="code">MIRO (POSTED)</span></div>
          <div class="entity-pill">🗄️ ArchiveLink / DMS</div>
        </div>
      </div>

    </div>

    <!-- RIGHT SIDE WORKFLOW (STEPS 3 TO 8) -->
    <div class="timeline-container">
      <div class="timeline-head">
        <span>🔄</span> End-to-End Operational & Joule Execution
      </div>

      <!-- Step 3 (JOULE POST) -->
      <div class="tl-step">
        <div class="step-badge b-joule">3</div>
        <div class="step-details highlight-step">
          <div class="sd-top">
            <span class="sd-title">PO Alloc & Driver Assign</span>
            <span class="joule-pill-tag">⚡ JOULE POST</span>
          </div>
          <div class="sd-desc">
            <code>POST /joule/distribute-po</code> & <code>/assign-driver</code> allocate PO quota, schedule driver & ready weighbridge.
          </div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="tl-step">
        <div class="step-badge b-green">4</div>
        <div class="step-details">
          <div class="sd-top">
            <span class="sd-title">Transport Execution</span>
          </div>
          <div class="sd-desc">
            Driver web console logs GPS telemetry, arrival timestamp, and carrier bilty digital acceptance.
          </div>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="tl-step">
        <div class="step-badge b-blue">5</div>
        <div class="step-details">
          <div class="sd-top">
            <span class="sd-title">4-Point Weighbridge</span>
          </div>
          <div class="sd-desc">
            Capture dispatch tare/gross (loading) and receiving tare/gross (yard) to guarantee net payload.
          </div>
        </div>
      </div>

      <!-- Step 6 (JOULE POST) -->
      <div class="tl-step">
        <div class="step-badge b-joule">6</div>
        <div class="step-details highlight-step">
          <div class="sd-top">
            <span class="sd-title">OCR Review & Approvals</span>
            <span class="joule-pill-tag">⚡ JOULE POST</span>
          </div>
          <div class="sd-desc">
            <code>POST /joule/approve-review</code> clears OCR variance flags, logs notes, and releases MIRO locks.
          </div>
        </div>
      </div>

      <!-- Step 7 (JOULE POST) -->
      <div class="tl-step">
        <div class="step-badge b-joule">7</div>
        <div class="step-details highlight-step">
          <div class="sd-top">
            <span class="sd-title">Verified Delivery & MIRO</span>
            <span class="joule-pill-tag">⚡ JOULE POST</span>
          </div>
          <div class="sd-desc">
            <code>POST /joule/post-miro</code> triggers automated BAPI MIRO invoice posting to S/4HANA financial ledger.
          </div>
        </div>
      </div>

      <!-- Step 8 -->
      <div class="tl-step">
        <div class="step-badge b-purple">8</div>
        <div class="step-details">
          <div class="sd-top">
            <span class="sd-title">Financial Settlement</span>
          </div>
          <div class="sd-desc">
            Final S/4HANA financial clearing, automated 3-way match, and immutable <code>sap_sync_log</code> compliance.
          </div>
        </div>
      </div>

    </div>

  </div>

  <!-- BOTTOM TECHNOLOGY FOUNDATION -->
  <div class="tech-footer">
    <div class="tf-label">
      Technology Foundation
      <span>(Modern, Scalable & Secure)</span>
    </div>
    <div class="tf-grid">
      
      <div class="tf-card">
        <div class="tf-icon">⚛️</div>
        <div class="tf-txt">
          <h6>Frontend UI</h6>
          <p>React 19 • Vite • TypeScript • React Router 7</p>
        </div>
      </div>

      <div class="tf-card">
        <div class="tf-icon">🟢</div>
        <div class="tf-txt">
          <h6>Backend Services</h6>
          <p>Node.js 22 • Express 5 • RESTful API Architecture</p>
        </div>
      </div>

      <div class="tf-card ai-focus">
        <div class="tf-icon">⚡</div>
        <div class="tf-txt">
          <h6>AI Co-Pilot Layer</h6>
          <p>SAP Joule Studio • OpenAPI 3.0 Action Projects • Work Zone</p>
        </div>
      </div>

      <div class="tf-card">
        <div class="tf-icon">☁️</div>
        <div class="tf-txt">
          <h6>SAP Integration</h6>
          <p>S/4HANA OData / REST • RFC Proxy • sap_sync_log</p>
        </div>
      </div>

      <div class="tf-card">
        <div class="tf-icon">🗄️</div>
        <div class="tf-txt">
          <h6>Data Store</h6>
          <p>SQLite WAL Mode (SAP HANA Cloud via CAP)</p>
        </div>
      </div>

      <div class="tf-card">
        <div class="tf-icon">💻</div>
        <div class="tf-txt">
          <h6>Design System</h6>
          <p>SAP Fiori Inspired • Responsive Desktop & Mobile</p>
        </div>
      </div>

    </div>
  </div>

</body>
</html>
"""

# Write HTML file
html_path = r"C:\Users\Varad\Documents\GitHub\POD\arch_diagram_v2.html"
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_code)

target_image = r"C:\Users\Varad\Downloads\PODZO SAP Transport Execution Architecture.png"

# Run headless Edge to capture high-res 2400x1350 image
edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
cmd = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--window-size=2400,1350",
    f"--screenshot={target_image}",
    html_path
]

print("Rendering high-res architecture diagram via Edge...")
subprocess.run(cmd, check=True)
print(f"Successfully generated full architecture diagram at: {target_image}")
