import subprocess
import os

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  body {
    background: #FFFFFF;
    width: 2400px;
    height: 1350px;
    padding: 30px 48px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }

  /* SVG OVERLAY */
  svg.flow-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 2400px;
    height: 1350px;
    pointer-events: none;
    z-index: 5;
  }

  /* TITLE */
  .title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .title-bar h1 {
    font-size: 37px;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -0.5px;
  }
  .title-bar h1 span.highlight {
    color: #0256B4;
  }

  /* MAIN GRID */
  .main-grid {
    display: flex;
    gap: 36px;
    height: 860px;
    position: relative;
  }

  /* LEFT SIDE DIAGRAM (1780px) */
  .left-diagram {
    flex: 0 0 1780px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }

  /* STEP 1 CALLOUT */
  .step1-container {
    position: absolute;
    left: -12px;
    top: 280px;
    width: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    z-index: 10;
  }
  .step1-badge {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #0256B4;
    color: #FFF;
    font-size: 22px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(2, 86, 180, 0.3);
    margin-bottom: 6px;
  }
  .step1-title {
    font-size: 13.5px;
    font-weight: 800;
    color: #0F172A;
    line-height: 1.2;
  }
  .step1-icon {
    font-size: 30px;
    margin: 4px 0;
    color: #0256B4;
  }
  .step1-desc {
    font-size: 11px;
    color: #64748B;
    line-height: 1.25;
  }

  /* 1. OPERATIONAL USERS BAR */
  .users-box {
    background: #F0F6FF;
    border: 1.5px solid #D6E4FF;
    border-radius: 12px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: 130px;
    position: relative;
    z-index: 6;
  }
  .users-title {
    font-size: 14px;
    font-weight: 800;
    color: #0F172A;
    line-height: 1.2;
    width: 130px;
    flex-shrink: 0;
  }
  .users-title span {
    font-size: 11px;
    font-weight: 600;
    color: #64748B;
    display: block;
  }
  .users-grid {
    display: flex;
    gap: 12px;
    flex: 1;
  }
  .user-card {
    flex: 1;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .user-card.admin { border-left: 4.5px solid #0284C7; }
  .user-card.transporter { border-left: 4.5px solid #F59E0B; background: #FFFDF9; }
  .user-card.weighbridge { border-left: 4.5px solid #10B981; }
  .user-card.driver { border-left: 4.5px solid #3B82F6; }
  .user-card.customer { border-left: 4.5px solid #8B5CF6; }
  .user-card.joule {
    flex: 1.25;
    background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
    border: 1.5px solid #6366F1;
    border-left: 5px solid #4F46E5;
    box-shadow: 0 3px 10px rgba(99, 102, 241, 0.15);
  }
  
  .u-icon {
    font-size: 22px;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    flex-shrink: 0;
  }
  .user-card.admin .u-icon { background: #E0F2FE; color: #0369A1; }
  .user-card.transporter .u-icon { background: #FEF3C7; color: #D97706; }
  .user-card.weighbridge .u-icon { background: #D1FAE5; color: #059669; }
  .user-card.driver .u-icon { background: #DBEAFE; color: #2563EB; }
  .user-card.customer .u-icon { background: #EDE9FE; color: #7C3AED; }
  .user-card.joule .u-icon { background: #4F46E5; color: #FFFFFF; font-size: 20px; }

  .u-info h4 { font-size: 13.5px; font-weight: 700; color: #0F172A; }
  .u-info p { font-size: 11px; color: #64748B; font-weight: 500; margin-top: 1px; }
  .user-card.joule .u-info h4 { color: #3730A3; font-weight: 800; display: flex; align-items: center; gap: 6px; }
  .user-card.joule .u-info p { color: #4338CA; font-weight: 600; }
  .action-tag { background: #4F46E5; color: #FFF; font-size: 9.5px; padding: 1px 5px; border-radius: 3px; font-weight: 800; }

  /* 2. PODZO OPERATIONAL CORE */
  .podzo-box {
    border: 2px solid #8B5CF6;
    background: #FFFFFF;
    border-radius: 16px;
    padding: 18px 22px;
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.08);
    margin-left: 130px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    z-index: 6;
  }
  .podzo-head-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .podzo-brand {
    font-size: 28px;
    font-weight: 900;
    color: #0B3954;
    letter-spacing: -0.5px;
  }
  .podzo-subline {
    font-size: 17.5px;
    font-weight: 700;
    color: #1E293B;
  }
  .podzo-badge-rt {
    background: #F3E8FF;
    color: #7C3AED;
    border: 1px solid #D8B4FE;
    font-size: 11.5px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 6px;
    margin-left: auto;
  }

  /* 3 COLUMNS */
  .podzo-cols {
    display: flex;
    gap: 16px;
  }
  .p-col {
    flex: 1;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .p-col.integration { background: #F8FAFD; border: 1.5px solid #C7D2FE; }
  .p-col-head {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13.5px;
    font-weight: 800;
    color: #0F172A;
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 6px;
  }
  .p-col-head .head-ico {
    font-size: 16px;
    color: #0284C7;
  }
  .p-col-head span.sub {
    font-size: 11px;
    font-weight: 600;
    color: #64748B;
  }

  /* CARDS GRID */
  .c-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .c-card {
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
  .c-card.wide {
    grid-column: span 2;
  }
  .c-card.feat-joule {
    background: #EEF2FF;
    border: 1.5px solid #818CF8;
  }
  .c-card.feat-green {
    background: #F0FDF4;
    border: 1.5px solid #86EFAC;
  }
  .c-card.feat-amber {
    background: #FFFBEB;
    border: 1.5px solid #FCD34D;
  }
  
  .card-icon {
    font-size: 18px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: #F1F5F9;
    flex-shrink: 0;
  }
  .c-card.feat-joule .card-icon { background: #E0E7FF; color: #4338CA; }
  .c-card.feat-green .card-icon { background: #DCFCE7; color: #15803D; }
  .c-card.feat-amber .card-icon { background: #FEF3C7; color: #B45309; }

  .card-meta h5 { font-size: 11.5px; font-weight: 700; color: #0F172A; }
  .card-meta p { font-size: 9.5px; color: #64748B; font-weight: 500; margin-top: 1px; }
  .c-card.feat-joule .card-meta h5 { color: #312E81; font-weight: 800; }
  .c-card.feat-joule .card-meta p { color: #4338CA; font-weight: 600; }

  /* 3. STEP 2 CONNECTOR */
  .step2-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-left: 130px;
    position: relative;
    z-index: 6;
  }
  .step2-badge {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #6366F1;
    color: #FFF;
    font-size: 18px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 8px rgba(99, 102, 241, 0.3);
  }
  .step2-text {
    font-size: 13.5px;
    font-weight: 800;
    color: #4338CA;
    background: #EEF2FF;
    border: 1px solid #C7D2FE;
    padding: 5px 18px;
    border-radius: 20px;
  }

  /* 4. SAP SYSTEM OF RECORD BOX */
  .sap-box-container {
    background: #F0F9FF;
    border: 2px solid #38BDF8;
    border-radius: 14px;
    padding: 14px 20px;
    margin-left: 130px;
    display: flex;
    align-items: center;
    gap: 18px;
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.12);
    position: relative;
    z-index: 6;
  }
  .sap-badge-logo {
    background: #0284C7;
    color: #FFFFFF;
    font-size: 20px;
    font-weight: 900;
    padding: 8px 16px;
    border-radius: 8px;
    letter-spacing: 0.5px;
  }
  .sap-info-title h3 { font-size: 15px; font-weight: 800; color: #0369A1; }
  .sap-info-title p { font-size: 11px; color: #0284C7; font-weight: 600; }
  .sap-pills-list {
    display: flex;
    gap: 10px;
    flex: 1;
    justify-content: flex-end;
  }
  .s-pill {
    background: #FFFFFF;
    border: 1.5px solid #BAE6FD;
    border-radius: 8px;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 700;
    color: #0369A1;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .s-pill.posted {
    border-color: #10B981;
    background: #ECFDF5;
    color: #065F46;
  }
  .s-pill span.code-tag {
    background: #E0F2FE;
    color: #0284C7;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
  }
  .s-pill.posted span.code-tag {
    background: #D1FAE5;
    color: #047857;
  }

  /* RIGHT SIDE TIMELINE (STEPS 3 TO 8) */
  .timeline-panel {
    flex: 0 0 540px;
    background: #FAFBFD;
    border: 1.5px solid #E2E8F0;
    border-radius: 16px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    z-index: 6;
  }
  .tp-head {
    font-size: 15px;
    font-weight: 900;
    color: #0F172A;
    border-bottom: 2px solid #CBD5E1;
    padding-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .step-row {
    display: flex;
    gap: 12px;
    align-items: center;
    position: relative;
  }
  .badge-circle {
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
  .badge-circle.b-orange { background: #EA580C; }
  .badge-circle.b-green { background: #16A34A; }
  .badge-circle.b-purple { background: #7C3AED; }
  .badge-circle.b-blue { background: #0284C7; }
  .badge-circle.b-joule {
    background: linear-gradient(135deg, #4F46E5 0%, #D946EF 100%);
    box-shadow: 0 4px 12px rgba(217, 70, 239, 0.4);
  }

  .step-box {
    flex: 1;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
  .step-box.highlight {
    border: 1.5px solid #818CF8;
    background: #F8FAFF;
  }
  .sb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2px;
  }
  .sb-title {
    font-size: 12.5px;
    font-weight: 800;
    color: #0F172A;
  }
  .joule-tag-pill {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    color: #92400E;
    border: 1px solid #F59E0B;
    font-size: 9px;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .sb-desc {
    font-size: 10.5px;
    color: #475569;
    font-weight: 500;
    line-height: 1.25;
  }
  .sb-desc code {
    font-family: monospace;
    font-size: 9.5px;
    background: #E0E7FF;
    color: #3730A3;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: bold;
  }

  /* BOTTOM TECHNOLOGY FOUNDATION BAR */
  .tech-bar {
    display: flex;
    gap: 16px;
    background: #F8FAFC;
    border: 1.5px solid #E2E8F0;
    border-radius: 12px;
    padding: 12px 18px;
    align-items: center;
    position: relative;
    z-index: 6;
  }
  .tb-title {
    font-size: 13px;
    font-weight: 900;
    color: #0F172A;
    line-height: 1.2;
    border-right: 2px solid #CBD5E1;
    padding-right: 16px;
    flex-shrink: 0;
  }
  .tb-title span {
    font-size: 10.5px;
    font-weight: 600;
    color: #64748B;
    display: block;
  }
  .tb-grid {
    display: flex;
    gap: 14px;
    flex: 1;
  }
  .tb-card {
    flex: 1;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 7px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .tb-card.ai-focus {
    background: #EEF2FF;
    border: 1.5px solid #A5B4FC;
  }
  .tb-icon {
    font-size: 18px;
  }
  .tb-meta h6 {
    font-size: 10.5px;
    font-weight: 800;
    color: #0284C7;
    text-transform: uppercase;
  }
  .tb-card.ai-focus .tb-meta h6 {
    color: #4338CA;
  }
  .tb-meta p {
    font-size: 9.5px;
    color: #475569;
    font-weight: 500;
    margin-top: 1px;
  }
</style>
</head>
<body>

  <!-- SVG CONNECTOR LINES -->
  <svg class="flow-overlay" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="arr-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 8 5 L 0 9 z" fill="#0256B4" />
      </marker>
      <marker id="arr-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 8 5 L 0 9 z" fill="#8B5CF6" />
      </marker>
      <marker id="arr-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 8 5 L 0 9 z" fill="#EA580C" />
      </marker>
    </defs>

    <!-- STEP 1 -> PODZO Box (Dotted Blue Line) -->
    <path d="M 130 350 L 175 350" stroke="#0256B4" stroke-width="2.5" stroke-dasharray="6,4" marker-end="url(#arr-blue)" fill="none" />
    <path d="M 60 410 L 60 840 L 175 840" stroke="#0256B4" stroke-width="2" stroke-dasharray="5,4" marker-end="url(#arr-blue)" fill="none" />

    <!-- Operational Users -> PODZO Double-Headed Arrows -->
    <path d="M 370 135 L 370 185" stroke="#0284C7" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />
    <path d="M 370 185 L 370 135" stroke="#0284C7" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />

    <path d="M 660 135 L 660 185" stroke="#F59E0B" stroke-width="2" marker-end="url(#arr-orange)" fill="none" />
    <path d="M 660 185 L 660 135" stroke="#F59E0B" stroke-width="2" marker-end="url(#arr-orange)" fill="none" />

    <path d="M 940 135 L 940 185" stroke="#10B981" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />
    <path d="M 940 185 L 940 135" stroke="#10B981" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />

    <path d="M 1220 135 L 1220 185" stroke="#3B82F6" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />
    <path d="M 1220 185 L 1220 135" stroke="#3B82F6" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />

    <path d="M 1500 135 L 1500 185" stroke="#8B5CF6" stroke-width="2" marker-end="url(#arr-purple)" fill="none" />
    <path d="M 1500 185 L 1500 135" stroke="#8B5CF6" stroke-width="2" marker-end="url(#arr-purple)" fill="none" />

    <path d="M 1740 135 L 1740 185" stroke="#4F46E5" stroke-width="2.5" marker-end="url(#arr-purple)" fill="none" />
    <path d="M 1740 185 L 1740 135" stroke="#4F46E5" stroke-width="2.5" marker-end="url(#arr-purple)" fill="none" />

    <!-- PODZO -> SAP System Connector 2 Arrows -->
    <path d="M 1000 680 L 1000 710" stroke="#6366F1" stroke-width="2.5" marker-end="url(#arr-purple)" fill="none" />
    <path d="M 1000 760 L 1000 790" stroke="#6366F1" stroke-width="2.5" marker-end="url(#arr-purple)" fill="none" />

    <!-- PODZO Right Side -> Steps 3 to 8 Bracket Connection -->
    <path d="M 1830 350 L 1845 350 L 1845 155 L 1860 155" stroke="#0256B4" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />
    <path d="M 1845 285 L 1860 285" stroke="#0256B4" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />
    <path d="M 1845 425 L 1860 425" stroke="#0256B4" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />
    <path d="M 1845 565 L 1860 565" stroke="#0256B4" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />
    <path d="M 1845 700 L 1860 700" stroke="#0256B4" stroke-width="2" marker-end="url(#arr-blue)" fill="none" />

    <!-- Right-side vertical connecting line between steps 3 to 8 -->
    <line x1="1878" y1="175" x2="1878" y2="820" stroke="#0256B4" stroke-width="2" />

    <!-- Step 8 -> Dotted back to SAP System of Record -->
    <path d="M 1860 840 L 1840 840 L 1840 920 L 175 920 L 175 870" stroke="#0256B4" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#arr-blue)" fill="none" />
  </svg>

  <!-- TOP HEADER -->
  <div class="title-bar">
    <h1>
      High-Level Solution Architecture for <span class="highlight">SAP-Connected Transport & Delivery Execution</span>
    </h1>
    <div style="text-align: right; font-size: 13px; color: #64748B;">
      <strong style="color: #0F172A; font-size: 15px;">ENTERPRISE SOLUTION ARCHITECTURE</strong><br>
      Production Version 2.0 • SAP BTP Cloud Foundry
    </div>
  </div>

  <!-- MAIN GRID -->
  <div class="main-grid">

    <!-- STEP 1 CALLOUT -->
    <div class="step1-container">
      <div class="step1-badge">1</div>
      <div class="step1-title">SAP Contracts & POs</div>
      <div class="step1-icon">📄</div>
      <div class="step1-desc">Contract data, PO details, master data</div>
    </div>

    <!-- LEFT DIAGRAM CORE -->
    <div class="left-diagram">

      <!-- 1. OPERATIONAL USERS BAR -->
      <div class="users-box">
        <div class="users-title">
          Operational Users
          <span>(Role-Tailored Experience)</span>
        </div>
        <div class="users-grid">
          
          <div class="user-card admin">
            <div class="u-icon">👤</div>
            <div class="u-info">
              <h4>Admin</h4>
              <p>Control Tower & Approvals</p>
            </div>
          </div>

          <div class="user-card transporter">
            <div class="u-icon">🚚</div>
            <div class="u-info">
              <h4>Transporter</h4>
              <p>POs & Fleet Operations</p>
            </div>
          </div>

          <div class="user-card weighbridge">
            <div class="u-icon">⚖️</div>
            <div class="u-info">
              <h4>Weighbridge Operator</h4>
              <p>Siding Console</p>
            </div>
          </div>

          <div class="user-card driver">
            <div class="u-icon">📱</div>
            <div class="u-info">
              <h4>Driver</h4>
              <p>Journey Web App</p>
            </div>
          </div>

          <div class="user-card customer">
            <div class="u-icon">🏭</div>
            <div class="u-info">
              <h4>Customer</h4>
              <p>Receiving Yard</p>
            </div>
          </div>

          <!-- JOULE CO-PILOT CARD -->
          <div class="user-card joule">
            <div class="u-icon">⚡</div>
            <div class="u-info">
              <h4>SAP Joule AI Co-Pilot <span class="action-tag">ACTION PROJECT</span></h4>
              <p>Conversational POST Actions (Work Zone)</p>
            </div>
          </div>

        </div>
      </div>

      <!-- 2. PODZO OPERATIONAL CORE BOX -->
      <div class="podzo-box">
        
        <div class="podzo-head-row">
          <div class="podzo-brand">PODZO</div>
          <div style="font-size:24px; color:#94A3B8;">|</div>
          <div class="podzo-subline">SAP-Connected Operational Execution Platform</div>
          <div class="podzo-badge-rt">⚡ SAP BTP Cloud Foundry Runtime</div>
        </div>

        <div class="podzo-cols">
          
          <!-- Col 1: SAP & Joule Integration Layer -->
          <div class="p-col integration">
            <div class="p-col-head">
              <span class="head-ico">🔌</span>
              <div>SAP & Joule Integration Layer <span class="sub">(Secure & Governed)</span></div>
            </div>
            <div class="c-grid">
              <div class="c-card feat-joule wide">
                <div class="card-icon">⚡</div>
                <div class="card-meta">
                  <h5>Joule Action Gateway</h5>
                  <p>OpenAPI 3.0 POST Specs (Autonomous Execution)</p>
                </div>
              </div>
              <div class="c-card">
                <div class="card-icon">🌐</div>
                <div class="card-meta">
                  <h5>OData / REST APIs</h5>
                  <p>Real-Time SAP Sync</p>
                </div>
              </div>
              <div class="c-card">
                <div class="card-icon">🔄</div>
                <div class="card-meta">
                  <h5>RFC Proxy</h5>
                  <p>ABAP BAPI Remote Calls</p>
                </div>
              </div>
              <div class="c-card feat-joule wide">
                <div class="card-icon">📜</div>
                <div class="card-meta">
                  <h5>Sync Logs & Monitoring</h5>
                  <p>sap_sync_log (Immutable SOX Audit)</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 2: PODZO Operational Core -->
          <div class="p-col">
            <div class="p-col-head">
              <span class="head-ico">⚙️</span>
              <div>PODZO Operational Core <span class="sub">(Execution & Verification)</span></div>
            </div>
            <div class="c-grid">
              <div class="c-card feat-green wide">
                <div class="card-icon">🧠</div>
                <div class="card-meta">
                  <h5>Fuzzy Entity Resolver</h5>
                  <p>Auto-Maps Natural Language Names/Trucks/POs to UUIDs</p>
                </div>
              </div>
              <div class="c-card">
                <div class="card-icon">⚖️</div>
                <div class="card-meta">
                  <h5>4-Point Weighbridge</h5>
                  <p>Origin & Dest Net Weights</p>
                </div>
              </div>
              <div class="c-card">
                <div class="card-icon">📷</div>
                <div class="card-meta">
                  <h5>OCR Doc Matching</h5>
                  <p>Vision Waybill Extraction</p>
                </div>
              </div>
              <div class="c-card">
                <div class="card-icon">📊</div>
                <div class="card-meta">
                  <h5>Tolerance Engine</h5>
                  <p>Shrinkage Variance Check</p>
                </div>
              </div>
              <div class="c-card feat-amber">
                <div class="card-icon">⚠️</div>
                <div class="card-meta">
                  <h5>Exception Review Queue</h5>
                  <p>Joule Release & Approve</p>
                </div>
              </div>
              <div class="c-card">
                <div class="card-icon">🔒</div>
                <div class="card-meta">
                  <h5>Secure Document Vault</h5>
                  <p>SHA-256 Signatures</p>
                </div>
              </div>
              <div class="c-card">
                <div class="card-icon">📋</div>
                <div class="card-meta">
                  <h5>Audit & Transit Logger</h5>
                  <p>Immutable Event Telemetry</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 3: Role-Governed Access -->
          <div class="p-col">
            <div class="p-col-head">
              <span class="head-ico">🛡️</span>
              <div>Role-Governed Access <span class="sub">(Security & Experience)</span></div>
            </div>
            <div class="c-grid">
              <div class="c-card feat-joule wide">
                <div class="card-icon">🔑</div>
                <div class="card-meta">
                  <h5>Dual-Role Evaluator</h5>
                  <p>CA / TA Dynamic Scopes for Joule Agent</p>
                </div>
              </div>
              <div class="c-card wide">
                <div class="card-icon">🛡️</div>
                <div class="card-meta">
                  <h5>JWT Authentication</h5>
                  <p>Zero-Trust Token Context & Destination Binding</p>
                </div>
              </div>
              <div class="c-card wide">
                <div class="card-icon">👥</div>
                <div class="card-meta">
                  <h5>Role-Based Access Control (RBAC)</h5>
                  <p>Granular User Entitlements</p>
                </div>
              </div>
              <div class="c-card wide">
                <div class="card-icon">💻</div>
                <div class="card-meta">
                  <h5>SAP Fiori-Inspired UX</h5>
                  <p>Responsive (Desktop & Mobile)</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- 3. STEP 2 CONNECTOR -->
      <div class="step2-row">
        <div class="step2-badge">2</div>
        <div class="step2-text">Secure SAP Integration (OData / REST APIs / RFC Proxy)</div>
      </div>

      <!-- 4. SAP SYSTEM OF RECORD BOX -->
      <div class="sap-box-container">
        <div class="sap-badge-logo">SAP</div>
        <div class="sap-info-title">
          <h3>SAP System of Record</h3>
          <p>(SAP S/21 / SAP ECC / S/4HANA)</p>
        </div>
        <div class="sap-pills-list">
          <div class="s-pill">📑 Outline Contracts <span class="code-tag">(ME33K)</span></div>
          <div class="s-pill">🛒 Purchase Orders <span class="code-tag">(ME23N)</span></div>
          <div class="s-pill">📝 Service Entry Sheets <span class="code-tag">(ML81N)</span></div>
          <div class="s-pill posted">💰 Supplier Invoices <span class="code-tag">(MIRO)</span></div>
          <div class="s-pill">🗄️ ArchiveLink / DMS</div>
        </div>
      </div>

    </div>

    <!-- RIGHT SIDE TIMELINE (STEPS 3 TO 8) -->
    <div class="timeline-panel">
      <div class="tp-head">
        <span>🔄</span> End-to-End Operational & Joule Execution
      </div>

      <!-- Step 3 (JOULE POST) -->
      <div class="step-row">
        <div class="badge-circle b-orange">3</div>
        <div class="step-box highlight">
          <div class="sb-header">
            <span class="sb-title">PO Allocation & Digital Acceptance</span>
            <span class="joule-tag-pill">⚡ JOULE POST</span>
          </div>
          <div class="sb-desc">
            Allocate POs, digital gate-in, driver assignment. <code>POST /joule/distribute-po</code> & <code>/assign-driver</code>.
          </div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="step-row">
        <div class="badge-circle b-green">4</div>
        <div class="step-box">
          <div class="sb-header">
            <span class="sb-title">Transport Execution & Driver Telemetry</span>
          </div>
          <div class="sb-desc">
            Route execution, GPS telemetry, arrival timestamps, and driver updates.
          </div>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="step-row">
        <div class="badge-circle b-purple">5</div>
        <div class="step-box">
          <div class="sb-header">
            <span class="sb-title">4-Point Weighbridge Validation</span>
          </div>
          <div class="sb-desc">
            Capture dispatch tare/gross (loading) and destination tare/gross (receiving) to validate quantities.
          </div>
        </div>
      </div>

      <!-- Step 6 (JOULE POST) -->
      <div class="step-row">
        <div class="badge-circle b-blue">6</div>
        <div class="step-box highlight">
          <div class="sb-header">
            <span class="sb-title">OCR POD Verification & Exception Handling</span>
            <span class="joule-tag-pill">⚡ JOULE POST</span>
          </div>
          <div class="sb-desc">
            POD scan, document matching, handle exceptions. <code>POST /joule/approve-review</code> clears locks.
          </div>
        </div>
      </div>

      <!-- Step 7 (JOULE POST) -->
      <div class="step-row">
        <div class="badge-circle b-blue">7</div>
        <div class="step-box highlight">
          <div class="sb-header">
            <span class="sb-title">Verified Delivery to SES / MIRO</span>
            <span class="joule-tag-pill">⚡ JOULE POST</span>
          </div>
          <div class="sb-desc">
            Post SES, transmit invoices to SAP. <code>POST /joule/post-miro</code> triggers automated BAPI MIRO invoice.
          </div>
        </div>
      </div>

      <!-- Step 8 -->
      <div class="step-row">
        <div class="badge-circle b-purple">8</div>
        <div class="step-box">
          <div class="sb-header">
            <span class="sb-title">Financial Settlement & Audit Trail</span>
          </div>
          <div class="sb-desc">
            Final posting, compliance, 3-way match, and immutable <code>sap_sync_log</code> audit records.
          </div>
        </div>
      </div>

    </div>

  </div>

  <!-- BOTTOM TECHNOLOGY FOUNDATION -->
  <div class="tech-bar">
    <div class="tb-title">
      Technology Foundation
      <span>(Modern, Scalable & Secure)</span>
    </div>
    <div class="tb-grid">
      
      <div class="tb-card">
        <div class="tb-icon">⚛️</div>
        <div class="tb-meta">
          <h6>Frontend</h6>
          <p>React 19 + Vite • TypeScript, React Router 7</p>
        </div>
      </div>

      <div class="tb-card">
        <div class="tb-icon">🟢</div>
        <div class="tb-meta">
          <h6>Backend Services</h6>
          <p>Node.js + Express 5 • RESTful API Architecture</p>
        </div>
      </div>

      <div class="tb-card ai-focus">
        <div class="tb-icon">⚡</div>
        <div class="tb-meta">
          <h6>AI Co-Pilot Layer</h6>
          <p>SAP Joule Studio • OpenAPI 3.0 Action Projects</p>
        </div>
      </div>

      <div class="tb-card">
        <div class="tb-icon">☁️</div>
        <div class="tb-meta">
          <h6>SAP Integration</h6>
          <p>OData / REST • RFC Proxy, Sync Logs</p>
        </div>
      </div>

      <div class="tb-card">
        <div class="tb-icon">🗄️</div>
        <div class="tb-meta">
          <h6>Data Store</h6>
          <p>SQLite (WAL Mode) • Full Transactional Durability</p>
        </div>
      </div>

      <div class="tb-card">
        <div class="tb-icon">💻</div>
        <div class="tb-meta">
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
html_path = r"C:\Users\Varad\Documents\GitHub\POD\arch_diagram_v4.html"
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_template)

target_image = r"C:\Users\Varad\Downloads\PODZO SAP Transport Execution Architecture.png"

# Run headless Edge to render image
edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
cmd = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--window-size=2400,1350",
    f"--screenshot={target_image}",
    html_path
]

print("Rendering pixel-perfect architecture diagram matching user reference image...")
subprocess.run(cmd, check=True)
print(f"Successfully generated architecture diagram at: {target_image}")
