import subprocess
import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  body { background: #FFFFFF; width: 2200px; height: 1250px; padding: 30px 40px; display: flex; flex-direction: column; justify-content: space-between; }
  
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #E2E8F0; padding-bottom: 12px; margin-bottom: 20px; }
  .title-group h1 { font-size: 34px; font-weight: 800; color: #0B3954; letter-spacing: -0.5px; }
  .title-group h1 span.highlight { color: #0854A0; }
  .title-group h1 span.joule-badge { background: linear-gradient(135deg, #0854A0 0%, #6366F1 100%); color: #FFF; font-size: 20px; padding: 4px 12px; border-radius: 6px; margin-left: 10px; vertical-align: middle; }
  .title-group p { font-size: 14px; color: #64748B; font-weight: 500; margin-top: 4px; }
  .doc-meta { text-align: right; font-size: 13px; color: #64748B; }
  .doc-meta strong { color: #0B3954; font-size: 14px; }

  /* Main Layout: Left Main Diagram (76%), Right Workflow (24%) */
  .content-row { display: flex; gap: 24px; flex: 1; }
  .left-container { flex: 0 0 1620px; display: flex; flex-direction: column; gap: 16px; }
  .right-container { flex: 0 0 476px; background: #FAFBFD; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 18px 16px; display: flex; flex-direction: column; justify-content: space-between; }

  /* Operational Users Bar */
  .users-bar { display: flex; gap: 12px; }
  .user-card { flex: 1; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; }
  .user-card.joule-card { flex: 1.3; background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border: 1.5px solid #6366F1; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15); }
  .user-icon { width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; }
  .icon-blue { background: #E0F2FE; color: #0369A1; }
  .icon-orange { background: #FFEDD5; color: #C2410C; }
  .icon-green { background: #DCFCE7; color: #15803D; }
  .icon-purple { background: #F3E8FF; color: #7E22CE; }
  .icon-joule { background: #4F46E5; color: #FFF; }
  .user-info h4 { font-size: 13px; font-weight: 700; color: #0F172A; }
  .user-info p { font-size: 11px; color: #64748B; font-weight: 500; }
  .joule-info h4 { font-size: 13px; font-weight: 800; color: #3730A3; display: flex; align-items: center; gap: 6px; }
  .joule-info p { font-size: 10.5px; color: #4338CA; font-weight: 600; }

  /* PODZO Operational Core (Center Box) */
  .podzo-core-box { background: #FFFFFF; border: 2px solid #818CF8; border-radius: 12px; padding: 16px 18px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.08); display: flex; flex-direction: column; gap: 12px; }
  .core-header { display: flex; align-items: center; gap: 12px; }
  .core-header h2 { font-size: 20px; font-weight: 800; color: #0B3954; }
  .core-header span.tag { background: #EEF2FF; color: #4F46E5; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; border: 1px solid #C7D2FE; }

  .core-columns { display: flex; gap: 14px; }
  .core-col { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .core-col.ai-col { background: #FAFAFE; border: 1.5px solid #C7D2FE; }
  .col-title { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; color: #0B3954; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; }
  
  .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grid-item { background: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: #1E293B; font-weight: 600; }
  .grid-item.highlight-item { background: #EEF2FF; border: 1px solid #A5B4FC; color: #312E81; }
  .grid-item span.emoji { font-size: 14px; }

  /* SAP System of Record Box */
  .sap-box { background: #F0F9FF; border: 1.5px solid #38BDF8; border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 16px; }
  .sap-logo-badge { background: #0284C7; color: #FFF; font-weight: 900; font-size: 16px; padding: 8px 14px; border-radius: 6px; }
  .sap-title { font-size: 13.5px; font-weight: 800; color: #0369A1; }
  .sap-subtitle { font-size: 11px; color: #0284C7; }
  .sap-pills { display: flex; gap: 10px; flex: 1; justify-content: flex-end; }
  .sap-pill { background: #FFFFFF; border: 1px solid #BAE6FD; border-radius: 6px; padding: 6px 12px; font-size: 11px; color: #0C4A6E; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .sap-pill strong { color: #0369A1; }

  /* Right-Side Workflow (Steps 1 to 8) */
  .wf-header { font-size: 14px; font-weight: 800; color: #0B3954; border-bottom: 1.5px solid #CBD5E1; padding-bottom: 6px; margin-bottom: 8px; }
  .wf-step { display: flex; gap: 10px; align-items: flex-start; position: relative; }
  .step-num { width: 26px; height: 26px; border-radius: 50%; background: #0854A0; color: #FFF; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-num.joule-step { background: linear-gradient(135deg, #E66C37 0%, #D946EF 100%); box-shadow: 0 2px 6px rgba(230, 108, 55, 0.4); }
  .step-content { flex: 1; }
  .step-title { font-size: 11.5px; font-weight: 700; color: #0F172A; display: flex; align-items: center; justify-content: space-between; }
  .step-desc { font-size: 10px; color: #64748B; margin-top: 1px; line-height: 1.3; }
  .joule-tag { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-size: 8.5px; font-weight: 800; padding: 1px 5px; border-radius: 4px; text-transform: uppercase; }

  /* Bottom Technology Foundation */
  .tech-foundation { display: flex; gap: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; align-items: center; }
  .tech-label { font-size: 11px; font-weight: 800; color: #0B3954; text-transform: uppercase; letter-spacing: 0.5px; border-right: 2px solid #CBD5E1; padding-right: 12px; flex-shrink: 0; }
  .tech-grid { display: flex; gap: 14px; flex: 1; }
  .tech-item { flex: 1; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 8px; }
  .tech-item.tech-joule { background: #EEF2FF; border: 1px solid #C7D2FE; }
  .tech-item h5 { font-size: 9.5px; font-weight: 800; color: #0854A0; text-transform: uppercase; }
  .tech-item p { font-size: 9px; color: #475569; font-weight: 500; margin-top: 1px; }

  /* Connecting Arrows */
  .arrow-connector { text-align: center; color: #6366F1; font-weight: 800; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 6px; }
</style>
</head>
<body>

  <!-- Top Header -->
  <div class="header">
    <div class="title-group">
      <h1>PODZO — SAP-Connected Transport Execution & <span class="highlight">Joule AI Agent</span> <span class="joule-badge">⚡ Autonomous POST / Action Engine</span></h1>
      <p>Closed-Loop Natural Language Logistics Orchestration • 4-Point Weighbridge Validation • Automated S/4HANA MIRO Invoicing</p>
    </div>
    <div class="doc-meta">
      <strong>ENTERPRISE SOLUTION ARCHITECTURE</strong><br>
      Production Version 2.0 • SAP BTP Cloud Foundry
    </div>
  </div>

  <!-- Content Row -->
  <div class="content-row">
    
    <!-- Left Main Diagram -->
    <div class="left-container">
      
      <!-- Operational Personas & Joule Co-Pilot -->
      <div class="users-bar">
        <div class="user-card">
          <div class="user-icon icon-blue">👤</div>
          <div class="user-info">
            <h4>Company Admin</h4>
            <p>Control Tower & Approvals</p>
          </div>
        </div>
        <div class="user-card">
          <div class="user-icon icon-orange">🚚</div>
          <div class="user-info">
            <h4>Transporter Admin</h4>
            <p>POs & Fleet Scheduling</p>
          </div>
        </div>
        <div class="user-card">
          <div class="user-icon icon-green">⚖️</div>
          <div class="user-info">
            <h4>Weighbridge Operator</h4>
            <p>4-Point Siding Scale</p>
          </div>
        </div>
        <div class="user-card">
          <div class="user-icon icon-blue">📱</div>
          <div class="user-info">
            <h4>Driver Web App</h4>
            <p>GPS & POD Cam Upload</p>
          </div>
        </div>
        <div class="user-card">
          <div class="user-icon icon-purple">🏭</div>
          <div class="user-info">
            <h4>Receiving Customer</h4>
            <p>Yard Acceptance & Tare</p>
          </div>
        </div>
        <!-- SAP Joule Co-Pilot Card -->
        <div class="user-card joule-card">
          <div class="user-icon icon-joule">⚡</div>
          <div class="joule-info">
            <h4>SAP Joule AI Co-Pilot <span style="font-size: 10px; background:#4338CA; color:#FFF; padding:1px 5px; border-radius:3px;">ACTION PROJECT</span></h4>
            <p>Conversational Natural Language POST Actions (Work Zone)</p>
          </div>
        </div>
      </div>

      <!-- Arrow -->
      <div class="arrow-connector">
        <span>▲ ▼ Bi-Directional REST / JSON API Gateway & JWT Bearer Token Context Exchange (Dual-Role CA / TA) ▲ ▼</span>
      </div>

      <!-- PODZO Operational Core Box -->
      <div class="podzo-core-box">
        <div class="core-header">
          <h2>PODZO</h2>
          <span style="font-size:15px; font-weight:700; color:#475569;">|</span>
          <span style="font-size:14px; font-weight:700; color:#0B3954;">SAP-Connected Operational Execution & Joule Action Platform</span>
          <span class="tag">SAP BTP Cloud Foundry Runtime</span>
        </div>

        <div class="core-columns">
          
          <!-- Col 1: Integration & Joule Action Gateway -->
          <div class="core-col ai-col">
            <div class="col-title">
              <span>🔌</span> SAP & Joule Integration Layer
            </div>
            <div class="grid-2col">
              <div class="grid-item highlight-item">
                <span class="emoji">⚡</span>
                <div>
                  <div style="font-size:11px; font-weight:800; color:#3730A3;">Joule Action Gateway</div>
                  <div style="font-size:9.5px; color:#4338CA;">OpenAPI 3.0 POST Specs</div>
                </div>
              </div>
              <div class="grid-item">
                <span class="emoji">🌐</span>
                <div>
                  <div>OData / REST APIs</div>
                  <div style="font-size:9.5px; color:#64748B;">S/4HANA Core Ingestion</div>
                </div>
              </div>
              <div class="grid-item">
                <span class="emoji">🔄</span>
                <div>
                  <div>RFC / BAPI Proxy</div>
                  <div style="font-size:9.5px; color:#64748B;">Direct SAP Function Calls</div>
                </div>
              </div>
              <div class="grid-item highlight-item">
                <span class="emoji">📜</span>
                <div>
                  <div style="font-size:11px; font-weight:800; color:#3730A3;">sap_sync_log</div>
                  <div style="font-size:9.5px; color:#4338CA;">Immutable Audit Logger</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 2: Operational Core & AI Resolver -->
          <div class="core-col">
            <div class="col-title">
              <span>⚙️</span> PODZO Operational Core & AI Engine
            </div>
            <div class="grid-2col">
              <div class="grid-item highlight-item">
                <span class="emoji">🧠</span>
                <div>
                  <div style="font-size:11px; font-weight:800; color:#0F766E;">Fuzzy Entity Resolver</div>
                  <div style="font-size:9.5px; color:#115E59;">Auto-Maps Names/POs</div>
                </div>
              </div>
              <div class="grid-item">
                <span class="emoji">⚖️</span>
                <div>
                  <div>4-Point Weighbridge</div>
                  <div style="font-size:9.5px; color:#64748B;">Origin & Dest Net Weights</div>
                </div>
              </div>
              <div class="grid-item">
                <span class="emoji">📷</span>
                <div>
                  <div>OCR Doc Matching</div>
                  <div style="font-size:9.5px; color:#64748B;">Vision Waybill Extraction</div>
                </div>
              </div>
              <div class="grid-item">
                <span class="emoji">📊</span>
                <div>
                  <div>Tolerance Engine</div>
                  <div style="font-size:9.5px; color:#64748B;">Shrinkage & Variance Check</div>
                </div>
              </div>
              <div class="grid-item highlight-item">
                <span class="emoji">⚠️</span>
                <div>
                  <div style="font-size:11px; font-weight:800; color:#C2410C;">Exception Review Queue</div>
                  <div style="font-size:9.5px; color:#9A3412;">Joule Release & Approve</div>
                </div>
              </div>
              <div class="grid-item">
                <span class="emoji">🔒</span>
                <div>
                  <div>Document Vault</div>
                  <div style="font-size:9.5px; color:#64748B;">SHA-256 State Signatures</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 3: Role-Governed Access -->
          <div class="core-col">
            <div class="col-title">
              <span>🛡️</span> Role-Governed Access & Security
            </div>
            <div class="grid-2col">
              <div class="grid-item highlight-item">
                <span class="emoji">🔑</span>
                <div>
                  <div style="font-size:11px; font-weight:800; color:#1E3A8A;">Dual-Role Evaluator</div>
                  <div style="font-size:9.5px; color:#1E40AF;">CA / TA Dynamic Scopes</div>
                </div>
              </div>
              <div class="grid-item">
                <span class="emoji">🛡️</span>
                <div>
                  <div>JWT / XSUAA Auth</div>
                  <div style="font-size:9.5px; color:#64748B;">Zero-Trust Token Propagation</div>
                </div>
              </div>
              <div class="grid-item">
                <span class="emoji">👥</span>
                <div>
                  <div>Role-Based Access</div>
                  <div style="font-size:9.5px; color:#64748B;">Granular User Permissions</div>
                </div>
              </div>
              <div class="grid-item">
                <span class="emoji">💻</span>
                <div>
                  <div>SAP Fiori Design</div>
                  <div style="font-size:9.5px; color:#64748B;">Horizon Theme Styling</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Arrow -->
      <div class="arrow-connector">
        <span>▲ ▼ Secure SAP S/4HANA Destination & Cloud Connector Gateway (OData v4 / RFC Proxy / BAPI) ▲ ▼</span>
      </div>

      <!-- SAP System of Record Box -->
      <div class="sap-box">
        <div class="sap-logo-badge">SAP</div>
        <div>
          <div class="sap-title">SAP System of Record</div>
          <div class="sap-subtitle">SAP S/4HANA Cloud • SAP ECC 6.0 • SAP S/21 Mining Solution</div>
        </div>
        <div class="sap-pills">
          <div class="sap-pill">📑 Outline Contracts <strong>(ME33K)</strong></div>
          <div class="sap-pill">🛒 Purchase Orders <strong>(ME23N)</strong></div>
          <div class="sap-pill">📝 Service Entry Sheets <strong>(ML81N)</strong></div>
          <div class="sap-pill" style="border-color:#10B981; background:#ECFDF5;">💰 Supplier Invoices <strong>(MIRO Posted)</strong></div>
          <div class="sap-pill">🗄️ ArchiveLink / DMS</div>
        </div>
      </div>

    </div>

    <!-- Right Side Workflow (Steps 1 to 8) -->
    <div class="right-container">
      <div class="wf-header">End-to-End Operational & Joule Execution</div>

      <!-- Step 1 -->
      <div class="wf-step">
        <div class="step-num">1</div>
        <div class="step-content">
          <div class="step-title"><span>SAP Contracts & POs</span></div>
          <div class="step-desc">Ingest active agreements (ME33K) & released POs (ME23N) via real-time OData.</div>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="wf-step">
        <div class="step-num">2</div>
        <div class="step-content">
          <div class="step-title"><span>Secure SAP Sync</span></div>
          <div class="step-desc">Establish BTP destination connectivity & sync operational master data.</div>
        </div>
      </div>

      <!-- Step 3 (Joule POST) -->
      <div class="wf-step">
        <div class="step-num joule-step">3</div>
        <div class="step-content">
          <div class="step-title">
            <span>PO Alloc & Driver Assign</span>
            <span class="joule-tag">⚡ Joule POST</span>
          </div>
          <div class="step-desc"><b>POST /joule/distribute-po</b> & <b>POST /joule/assign-driver</b> allocate fleet & ready weighbridge.</div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="wf-step">
        <div class="step-num">4</div>
        <div class="step-content">
          <div class="step-title"><span>Transport Execution</span></div>
          <div class="step-desc">Driver web app logs GPS telemetry, gate check-in, and bilty acceptance.</div>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="wf-step">
        <div class="step-num">5</div>
        <div class="step-content">
          <div class="step-title"><span>4-Point Weighbridge</span></div>
          <div class="step-desc">Capture siding tare/gross and yard tare/gross to verify exact net payload.</div>
        </div>
      </div>

      <!-- Step 6 (Joule POST) -->
      <div class="wf-step">
        <div class="step-num joule-step">6</div>
        <div class="step-content">
          <div class="step-title">
            <span>OCR Review & Approvals</span>
            <span class="joule-tag">⚡ Joule POST</span>
          </div>
          <div class="step-desc"><b>POST /joule/approve-review</b> approves flagged variance & releases SAP MIRO locks.</div>
        </div>
      </div>

      <!-- Step 7 (Joule POST) -->
      <div class="wf-step">
        <div class="step-num joule-step">7</div>
        <div class="step-content">
          <div class="step-title">
            <span>SES & MIRO Posting</span>
            <span class="joule-tag">⚡ Joule POST</span>
          </div>
          <div class="step-desc"><b>POST /joule/post-miro</b> triggers automated BAPI MIRO invoice posting to S/4HANA.</div>
        </div>
      </div>

      <!-- Step 8 -->
      <div class="wf-step">
        <div class="step-num">8</div>
        <div class="step-content">
          <div class="step-title"><span>Settlement & Audit Trail</span></div>
          <div class="step-desc">Immutable audit record logged in sap_sync_log; readies AP bank payment.</div>
        </div>
      </div>

    </div>

  </div>

  <!-- Bottom Technology Foundation -->
  <div class="tech-foundation">
    <div class="tech-label">Technology<br>Foundation</div>
    <div class="tech-grid">
      <div class="tech-item">
        <h5>⚛️ Frontend UI</h5>
        <p>React 19 • Vite • TypeScript • React Router 7</p>
      </div>
      <div class="tech-item">
        <h5>🟢 Backend Services</h5>
        <p>Node.js 22 • Express 5 • SAP CAP RESTful Architecture</p>
      </div>
      <div class="tech-item tech-joule">
        <h5 style="color:#4338CA;">⚡ AI Co-Pilot Layer</h5>
        <p>SAP Joule Studio • OpenAPI 3.0 Action Projects • Build Work Zone</p>
      </div>
      <div class="tech-item">
        <h5>☁️ SAP Integration</h5>
        <p>S/4HANA OData / REST • RFC/BAPI Proxy • sap_sync_log</p>
      </div>
      <div class="tech-item">
        <h5>🗄️ Data Store</h5>
        <p>SQLite WAL Mode (HANA Cloud option via CAP)</p>
      </div>
      <div class="tech-item">
        <h5>🎨 Design System</h5>
        <p>SAP Fiori Horizon Design • Responsive Web & Mobile</p>
      </div>
    </div>
  </div>

</body>
</html>
"""

# Write HTML file
html_path = r"C:\Users\Varad\Documents\GitHub\POD\arch_diagram.html"
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

target_image = r"C:\Users\Varad\Downloads\PODZO SAP Transport Execution Architecture.png"

# Run headless Edge to capture 2200x1250 screenshot
edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
cmd = [
    edge_exe,
    "--headless",
    "--disable-gpu",
    "--window-size=2200,1250",
    f"--screenshot={target_image}",
    html_path
]

print("Rendering architecture image via Edge...")
subprocess.run(cmd, check=True)
print(f"Successfully generated updated architecture diagram at: {target_image}")
