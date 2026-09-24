import os
import sys
import base64
from pathlib import Path
from playwright.sync_api import sync_playwright
import fitz # PyMuPDF
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

BASE_DIR = Path("C:/projects/POD")
HTML_FILE = BASE_DIR / "scripts/clean_overview.html"
PDF_FILE = BASE_DIR / "PODZO_Solution_Overview_v1.0.pdf"
DOCX_FILE = BASE_DIR / "PODZO_Solution_Overview_v1.0.docx"
LOGO_FILE = BASE_DIR / "public/branding/podzo-logo-compact.png"

# Encode Logo
logo_base64 = ""
if LOGO_FILE.exists():
    with open(LOGO_FILE, "rb") as f:
        logo_base64 = "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")

def create_html():
    content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PODZO — Solution Overview</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 0;
    }}
    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }}
    html, body {{
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1D2D3E;
      background-color: #FFFFFF;
    }}
    .page {{
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      box-sizing: border-box;
      padding: 9.5mm 14mm 8.5mm 14mm;
      background: #FFFFFF;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }}
    .page:last-child {{
      page-break-after: avoid;
    }}

    /* Typography & Hierarchy */
    h1, h2, h3, h4, p {{
      margin: 0;
      padding: 0;
    }}
    .header-wrap {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0A6ED1;
      padding-bottom: 5px;
      margin-bottom: 7px;
    }}
    .brand-title {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .brand-title img {{
      height: 32px;
      object-fit: contain;
    }}
    .doc-meta {{
      text-align: right;
    }}
    .meta-badge {{
      display: inline-block;
      background: #EAF3FC;
      color: #0854A0;
      font-size: 8pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid #D4E7FA;
      letter-spacing: 0.03em;
    }}
    .meta-sub {{
      font-size: 7.2pt;
      color: #5B738B;
      margin-top: 2px;
      font-weight: 600;
    }}
    .main-title {{
      font-size: 16pt;
      font-weight: 800;
      color: #0F2744;
      line-height: 1.1;
      letter-spacing: -0.02em;
    }}
    .main-subtitle {{
      font-size: 9pt;
      font-weight: 600;
      color: #0A6ED1;
      margin-top: 1px;
    }}
    .lead-description {{
      font-size: 8.1pt;
      color: #1E293B;
      line-height: 1.35;
      margin-bottom: 7px;
      background: #F8FAFC;
      border-left: 3.5px solid #0A6ED1;
      padding: 6px 10px;
      border-radius: 0 4px 4px 0;
      border-top: 1px solid #E2E8F0;
      border-right: 1px solid #E2E8F0;
      border-bottom: 1px solid #E2E8F0;
    }}

    /* Section Styling */
    .section-title {{
      font-size: 8.8pt;
      font-weight: 800;
      color: #0854A0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 2px;
      margin-bottom: 5px;
    }}
    .section-title::after {{
      content: "";
      flex: 1;
      height: 1px;
      background: #E2E8F0;
    }}
    .section-icon {{
      color: #FF5B00;
      font-weight: bold;
    }}

    /* Glance Box */
    .glance-box {{
      background: #FFFFFF;
      border: 1px solid #D9E1E8;
      border-radius: 5px;
      padding: 7px 10px;
      margin-bottom: 5px;
      font-size: 7.9pt;
      line-height: 1.35;
      color: #243B53;
      box-shadow: 0 1px 2px rgba(10, 110, 209, 0.03);
    }}
    .glance-highlights {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 7px;
    }}
    .gh-card {{
      background: #F8FAFC;
      border: 1px solid #D9E1E8;
      border-radius: 4px;
      padding: 4px 7px;
      font-size: 7.1pt;
      color: #334E68;
      line-height: 1.25;
    }}
    .gh-card strong {{
      color: #0F2744;
      display: block;
      font-size: 7.3pt;
      margin-bottom: 1px;
    }}

    /* Capability Cards - 2 Columns x 3 Rows */
    .capability-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      margin-bottom: 7px;
    }}
    .cap-card {{
      background: #FFFFFF;
      border: 1px solid #D9E1E8;
      border-top: 2.5px solid #0A6ED1;
      border-radius: 4px;
      padding: 6px 9px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }}
    .cap-title {{
      font-size: 8pt;
      font-weight: 700;
      color: #0F2744;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }}
    .cap-desc {{
      font-size: 7.2pt;
      color: #486581;
      line-height: 1.3;
    }}

    /* Role Cards */
    .roles-container {{
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      margin-bottom: 7px;
    }}
    .role-card {{
      background: #F8FAFC;
      border: 1px solid #D9E1E8;
      border-radius: 4px;
      padding: 5px 6px;
      text-align: center;
    }}
    .role-badge {{
      display: inline-block;
      font-size: 6.6pt;
      font-weight: 800;
      padding: 1px 4.5px;
      border-radius: 3px;
      background: #0A6ED1;
      color: #FFFFFF;
      margin-bottom: 2px;
    }}
    .role-name {{
      font-size: 7.3pt;
      font-weight: 700;
      color: #0F2744;
      margin-bottom: 2px;
    }}
    .role-desc {{
      font-size: 6.6pt;
      color: #486581;
      line-height: 1.25;
    }}

    /* Workflow Diagram & Legend */
    .workflow-wrap {{
      margin-bottom: 2px;
    }}
    .workflow-strip {{
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      gap: 3px;
      background: #F0F4F8;
      border: 1px solid #CBD5E1;
      border-radius: 5px;
      padding: 6px 5px;
      margin-bottom: 4px;
    }}
    .wf-step {{
      flex: 1;
      background: #FFFFFF;
      border: 1px solid #D9E1E8;
      border-radius: 4px;
      padding: 5px 3px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }}
    .wf-step.sap {{
      border-color: #0A6ED1;
      background: #EAF3FC;
    }}
    .wf-step.action {{
      border-color: #CBD5E1;
    }}
    .wf-num {{
      font-size: 6pt;
      font-weight: 800;
      color: #0A6ED1;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .wf-title {{
      font-size: 6.9pt;
      font-weight: 700;
      color: #0F2744;
      margin-top: 1px;
    }}
    .wf-actor {{
      font-size: 6pt;
      color: #627D98;
      margin-top: 1px;
      font-weight: 600;
    }}
    .wf-arrow {{
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0A6ED1;
      font-weight: bold;
      font-size: 7.5pt;
      padding: 0 1px;
    }}
    .workflow-legend {{
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 6.7pt;
      color: #334E68;
      line-height: 1.3;
    }}
    .workflow-legend strong {{
      color: #0F2744;
    }}

    /* Page Footer */
    .page-footer {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #D9E1E8;
      padding-top: 4px;
      font-size: 7pt;
      color: #627D98;
    }}
    .page-footer strong {{
      color: #0F2744;
    }}

    /* PAGE 2 SPECIFIC STYLES */
    .page2-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #0A6ED1;
      padding-bottom: 4px;
      margin-bottom: 7px;
    }}
    .page2-header .title {{
      font-size: 11pt;
      font-weight: 800;
      color: #0F2744;
    }}
    .page2-header .sub {{
      font-size: 7.8pt;
      color: #0A6ED1;
      font-weight: 600;
    }}

    /* SAP Integration Table */
    .integration-box {{
      border: 1px solid #D9E1E8;
      border-radius: 5px;
      overflow: hidden;
      margin-bottom: 7px;
    }}
    .integration-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 7.1pt;
    }}
    .integration-table th {{
      background: #0854A0;
      color: #FFFFFF;
      padding: 4.5px 7px;
      text-align: left;
      font-weight: 700;
      font-size: 7pt;
      letter-spacing: 0.03em;
    }}
    .integration-table td {{
      padding: 4.5px 7px;
      border-bottom: 1px solid #E5E7EB;
      vertical-align: top;
      line-height: 1.25;
    }}
    .integration-table tr:nth-child(even) td {{
      background: #F8FAFC;
    }}
    .tag-sap {{
      display: inline-block;
      font-size: 6pt;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      background: #EAF3FC;
      color: #0854A0;
      border: 1px solid #D4E7FA;
    }}
    .tag-pod {{
      display: inline-block;
      font-size: 6pt;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      background: #FFF4E5;
      color: #C05621;
      border: 1px solid #FBD38D;
    }}

    /* Architecture Block */
    .arch-container {{
      border: 1px solid #D9E1E8;
      border-radius: 5px;
      background: #F8FAFC;
      padding: 6px 8px;
      margin-bottom: 7px;
    }}
    .arch-layer {{
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      padding: 5px 8px;
      margin-bottom: 4px;
    }}
    .arch-layer:last-child {{
      margin-bottom: 0;
    }}
    .arch-layer-head {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }}
    .arch-layer-name {{
      font-size: 7.5pt;
      font-weight: 800;
      color: #0F2744;
    }}
    .arch-layer-badge {{
      font-size: 6.2pt;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 3px;
      background: #EAF3FC;
      color: #0A6ED1;
    }}
    .arch-layer-items {{
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }}
    .arch-chip {{
      font-size: 6.5pt;
      padding: 2px 5px;
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      border-radius: 3px;
      color: #334E68;
      font-weight: 600;
    }}
    .arch-arrow {{
      text-align: center;
      color: #0A6ED1;
      font-weight: bold;
      font-size: 7pt;
      line-height: 1;
      margin: 1.5px 0;
    }}

    /* Technology Strip */
    .tech-strip {{
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      background: #FFFFFF;
      border: 1px solid #D9E1E8;
      border-radius: 5px;
      padding: 5px 7px;
      margin-bottom: 7px;
    }}
    .tech-item {{
      border-right: 1px solid #E2E8F0;
      padding-right: 5px;
    }}
    .tech-item:last-child {{
      border-right: none;
      padding-right: 0;
    }}
    .tech-cat {{
      font-size: 6pt;
      font-weight: 800;
      color: #0A6ED1;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .tech-val {{
      font-size: 7.1pt;
      font-weight: 700;
      color: #0F2744;
      margin-top: 1px;
    }}
    .tech-sub {{
      font-size: 6pt;
      color: #627D98;
    }}

    /* Business Value Cards */
    .value-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px;
      margin-bottom: 7px;
    }}
    .val-card {{
      background: #FFFFFF;
      border: 1px solid #D9E1E8;
      border-left: 3px solid #107E3E;
      border-radius: 4px;
      padding: 5px 7px;
    }}
    .val-title {{
      font-size: 7.5pt;
      font-weight: 700;
      color: #0F2744;
      margin-bottom: 1px;
    }}
    .val-desc {{
      font-size: 6.7pt;
      color: #486581;
      line-height: 1.25;
    }}

    /* Approach Box */
    .approach-box {{
      background: #EAF3FC;
      border: 1px solid #B8D8F8;
      border-radius: 4px;
      padding: 5px 8px;
      margin-bottom: 4px;
    }}
    .approach-title {{
      font-size: 7.2pt;
      font-weight: 800;
      color: #0854A0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 1.5px;
    }}
    .approach-desc {{
      font-size: 6.9pt;
      color: #102A43;
      line-height: 1.25;
    }}
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header-wrap">
        <div class="brand-title">
          <img src="{logo_base64}" alt="PODZO Logo" />
          <div>
            <div class="main-title">PODZO — Solution Overview</div>
            <div class="main-subtitle">SAP-Connected Delivery &amp; Transport Management Platform</div>
          </div>
        </div>
        <div class="doc-meta">
          <div class="meta-badge">CLIENT SOLUTION OVERVIEW</div>
          <div class="meta-sub">Version 1.0 &bull; September 2026</div>
        </div>
      </div>

      <!-- Description -->
      <div class="lead-description">
        <strong>Executive Summary:</strong> PODZO provides a centralized operational interface for managing SAP-connected contracts and purchase orders, transport allocation, delivery execution, proof-of-delivery (POD) verification, and freight invoicing through to SAP MIRO supplier invoice parking and payment clearing.
      </div>

      <!-- Section 1: At a Glance -->
      <div class="section-title"><span class="section-icon">&block;</span> Section 1 — PODZO at a Glance</div>
      <div class="glance-box">
        PODZO is an enterprise operational execution platform designed to bridge SAP S/21 with day-to-day transport logistics and bulk haulage fulfillment. Used by industrial shippers, commercial hauliers, siding supervisors, drivers, and receiving customers, PODZO manages the physical realization of transport purchase orders. By retrieving active contracts and released POs directly from SAP S/21, PODZO governs vehicle allocation, 4-point weighbridge validation, digital journey tracking, and OCR-assisted POD verification—delivering end-to-end operational visibility while preserving SAP as the single authoritative financial core.
      </div>
      <div class="glance-highlights">
        <div class="gh-card">
          <strong>&#10003; Direct SAP S/21 Alignment</strong>
          Live ingestion of active contracts &amp; transport POs via real-time OData / REST services.
        </div>
        <div class="gh-card">
          <strong>&#10003; 4-Point Weight Governance</strong>
          Tare &amp; gross weighing at siding &amp; receiving yard eliminates payload disputes.
        </div>
        <div class="gh-card">
          <strong>&#10003; Automated Settlement &amp; MIRO</strong>
          OCR verification feeds verified tonnage directly into SAP MIRO invoice parking.
        </div>
      </div>

      <!-- Section 2: Key Capabilities (2 Columns x 3 Rows) -->
      <div class="section-title"><span class="section-icon">&block;</span> Section 2 — Key Capabilities</div>
      <div class="capability-grid">
        <div class="cap-card">
          <div class="cap-title">&#9670; SAP S/21 Synchronization</div>
          <div class="cap-desc">Direct ingestion of active outline agreements (ME33K) and transport purchase orders (ME23N) with materials, target tonnage, agreed rates, and validity windows.</div>
        </div>
        <div class="cap-card">
          <div class="cap-title">&#9670; Transport Allocation &amp; E-Sign</div>
          <div class="cap-desc">Timebound PO allocation to certified transporters with mandatory digital signature acknowledgment and electronic carrier waybill (bilty) assignment.</div>
        </div>
        <div class="cap-card">
          <div class="cap-title">&#9670; 4-Point Weighbridge Control</div>
          <div class="cap-desc">Captures dispatch tare/gross (loading siding) and destination tare/gross (receiving yard) to guarantee net payload accuracy and detect transit weight loss.</div>
        </div>
        <div class="cap-card">
          <div class="cap-title">&#9670; Driver Mobile Execution</div>
          <div class="cap-desc">Mobile-first driver web console for route navigation, arrival timestamp logging, gate check-in, and instant camera capture of stamped physical POD slips.</div>
        </div>
        <div class="cap-card">
          <div class="cap-title">&#9670; OCR POD Verification Desk</div>
          <div class="cap-desc">Automated document data extraction matching waybill numbers, truck registrations, and delivered weights against SAP records with confidence scoring and exception review.</div>
        </div>
        <div class="cap-card">
          <div class="cap-title">&#9670; Invoicing &amp; SAP MIRO Posting</div>
          <div class="cap-desc">Consolidation of verified delivered tonnage into freight invoices, staging audit-ready data for SAP MIRO supplier invoice parking, posting, and AP settlement.</div>
        </div>
      </div>

      <!-- Section 3: Role-Based Operations -->
      <div class="section-title"><span class="section-icon">&block;</span> Section 3 — Role-Based Operations</div>
      <div class="roles-container">
        <div class="role-card">
          <span class="role-badge">CA</span>
          <div class="role-name">Company Admin</div>
          <div class="role-desc">Manages contracts, PO quotas, variance review queues, and final MIRO invoice approvals.</div>
        </div>
        <div class="role-card">
          <span class="role-badge">TA</span>
          <div class="role-name">Transporter Admin</div>
          <div class="role-desc">Accepts allocated POs via digital signature, schedules fleet/drivers, and submits freight invoices.</div>
        </div>
        <div class="role-card">
          <span class="role-badge">SR</span>
          <div class="role-name">Supervisor</div>
          <div class="role-desc">Conducts siding inspections, logs weighbridge weights, and authorizes gate dispatch release.</div>
        </div>
        <div class="role-card">
          <span class="role-badge">DR</span>
          <div class="role-name">Driver</div>
          <div class="role-desc">Executes assignments via mobile web, verifies loading, and uploads stamped physical POD slips.</div>
        </div>
        <div class="role-card">
          <span class="role-badge">CR</span>
          <div class="role-name">Customer</div>
          <div class="role-desc">Captures receiving weighbridge readings, records transit deviations, and confirms delivery acceptance.</div>
        </div>
      </div>

      <!-- Section 4: End-to-End Workflow -->
      <div class="section-title"><span class="section-icon">&block;</span> Section 4 — End-to-End Operational Workflow</div>
      <div class="workflow-wrap">
        <div class="workflow-strip">
          <div class="wf-step sap">
            <div class="wf-num">Step 1</div>
            <div class="wf-title">SAP S/21 Sync</div>
            <div class="wf-actor">Contracts &amp; POs</div>
          </div>
          <div class="wf-arrow">&rarr;</div>
          <div class="wf-step action">
            <div class="wf-num">Step 2</div>
            <div class="wf-title">PO E-Acceptance</div>
            <div class="wf-actor">Transporter (TA)</div>
          </div>
          <div class="wf-arrow">&rarr;</div>
          <div class="wf-step action">
            <div class="wf-num">Step 3</div>
            <div class="wf-title">Siding Dispatch</div>
            <div class="wf-actor">Supervisor (SR)</div>
          </div>
          <div class="wf-arrow">&rarr;</div>
          <div class="wf-step action">
            <div class="wf-num">Step 4</div>
            <div class="wf-title">Transit Execution</div>
            <div class="wf-actor">Driver (DR)</div>
          </div>
          <div class="wf-arrow">&rarr;</div>
          <div class="wf-step action">
            <div class="wf-num">Step 5</div>
            <div class="wf-title">Yard Receiving</div>
            <div class="wf-actor">Customer (CR)</div>
          </div>
          <div class="wf-arrow">&rarr;</div>
          <div class="wf-step action">
            <div class="wf-num">Step 6</div>
            <div class="wf-title">OCR POD Review</div>
            <div class="wf-actor">Company Admin (CA)</div>
          </div>
          <div class="wf-arrow">&rarr;</div>
          <div class="wf-step sap">
            <div class="wf-num">Step 7</div>
            <div class="wf-title">SAP MIRO Clear</div>
            <div class="wf-actor">Park &amp; Post Invoice</div>
          </div>
        </div>
        <div class="workflow-legend">
          <strong>Operational Data Continuity:</strong> SAP S/21 Contracts &amp; POs &bull; Transporter Digital E-Acceptance &amp; Bilty &bull; Siding Weighbridge Dispatch Clearance &bull; Driver Mobile Telemetry &bull; Yard Weighbridge Receiving &bull; OCR 3-Way Match Verification &bull; SAP MIRO Supplier Invoicing &amp; Payment Clearing.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div><strong>PODZO</strong> &bull; SAP-Connected Delivery &amp; Transport Management Platform</div>
      <div>Page 1 of 2</div>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <div>
      <!-- Page 2 Header -->
      <div class="page2-header">
        <div>
          <div class="title">PODZO &mdash; Integration &amp; Technical Architecture</div>
          <div class="sub">SAP S/21 Integration, Architectural Blueprint &amp; Enterprise Value</div>
        </div>
        <div class="doc-meta">
          <div class="meta-badge">ENTERPRISE BLUEPRINT</div>
          <div class="meta-sub">Page 2 of 2</div>
        </div>
      </div>

      <!-- Section 5: SAP S/21 Integration -->
      <div class="section-title"><span class="section-icon">&block;</span> Section 5 — SAP S/21 Integration</div>
      <div class="integration-box">
        <table class="integration-table">
          <thead>
            <tr>
              <th style="width: 25%;">Integration Dimension</th>
              <th style="width: 45%;">Data Scope &amp; Functional Mapping</th>
              <th style="width: 30%;">Data Governance &amp; Storage Boundary</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Inbound from SAP S/21</strong><br/><span class="tag-sap">OData / REST APIs</span></td>
              <td>Outline Contracts (ME33K), Transport POs (ME23N), Line Items, Target Tonnage, Unit Rates, Cost Centers, Delivery Sites, Vendor Master (LFA1).</td>
              <td><em>Retrieved from SAP.</em> Master records remain governed exclusively in SAP S/21; cached for operational display.</td>
            </tr>
            <tr>
              <td><strong>Operational Processing</strong><br/><span class="tag-pod">PODZO Core Layer</span></td>
              <td>Digital PO acceptance signature hashes, carrier waybills (bilties), 4-point weighbridge tickets, OTP verifications, driver stamps, uploaded POD scans.</td>
              <td><em>Stored in PODZO.</em> Field execution logs and audit telemetry are persisted locally in PODZO's transactional database.</td>
            </tr>
            <tr>
              <td><strong>Outbound to SAP S/21</strong><br/><span class="tag-sap">ABAP RFC / MIRO API</span></td>
              <td>Verified delivered quantities, Service Entry Sheet (SES / ML81N) triggers, MIRO supplier invoice parking/posting, ArchiveLink POD attachments.</td>
              <td><em>Posted to SAP.</em> Final financial and compliance artifacts are transmitted back to SAP for settlement.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 6: High-Level Solution Architecture -->
      <div class="section-title"><span class="section-icon">&block;</span> Section 6 — High-Level Solution Architecture</div>
      <div class="arch-container">
        <!-- Top Tier -->
        <div class="arch-layer">
          <div class="arch-layer-head">
            <span class="arch-layer-name">1. Enterprise ERP Layer (SAP S/21 System of Record)</span>
            <span class="arch-layer-badge">SAP ECC / S/4HANA</span>
          </div>
          <div class="arch-layer-items">
            <span class="arch-chip">Outline Agreements (ME33K)</span>
            <span class="arch-chip">Purchase Orders (ME23N)</span>
            <span class="arch-chip">Service Entry Sheets (ML81N)</span>
            <span class="arch-chip">Supplier Invoices (MIRO)</span>
            <span class="arch-chip">ArchiveLink / DMS</span>
          </div>
        </div>

        <div class="arch-arrow">&#8645; Secure SAP Integration Layer (REST &bull; OData &bull; RFC Proxy &bull; Sync Logs) &#8645;</div>

        <!-- Middle Tier -->
        <div class="arch-layer">
          <div class="arch-layer-head">
            <span class="arch-layer-name">2. PODZO Operational Core Platform (Execution &amp; Verification Layer)</span>
            <span class="arch-layer-badge">Express &bull; Node.js &bull; SQLite WAL</span>
          </div>
          <div class="arch-layer-items">
            <span class="arch-chip">4-Point Weighbridge Engine</span>
            <span class="arch-chip">OCR Document Matching Desk</span>
            <span class="arch-chip">Tolerance &amp; Variance Engine</span>
            <span class="arch-chip">Exception Review Queue</span>
            <span class="arch-chip">Secure Document Vault</span>
            <span class="arch-chip">Audit &amp; Transit Event Logger</span>
          </div>
        </div>

        <div class="arch-arrow">&#8645; Role-Governed Secure Web Endpoints (JWT Authentication &bull; RBAC) &#8645;</div>

        <!-- Bottom Tier -->
        <div class="arch-layer">
          <div class="arch-layer-head">
            <span class="arch-layer-name">3. Role-Tailored Operational Consoles (SAP Fiori-Inspired UX)</span>
            <span class="arch-layer-badge">React 19 &bull; Desktop &bull; Mobile</span>
          </div>
          <div class="arch-layer-items">
            <span class="arch-chip">CA: Admin Control Tower &amp; Approvals</span>
            <span class="arch-chip">TA: Transporter POs &amp; Fleet Operations</span>
            <span class="arch-chip">SR: Siding Weighbridge Console</span>
            <span class="arch-chip">DR: Driver Journey Web App</span>
            <span class="arch-chip">CR: Customer Receiving Yard</span>
          </div>
        </div>
      </div>

      <!-- Section 7: Technology Overview -->
      <div class="section-title"><span class="section-icon">&block;</span> Section 7 — Technology Overview</div>
      <div class="tech-strip">
        <div class="tech-item">
          <div class="tech-cat">Frontend</div>
          <div class="tech-val">React 19 &bull; Vite</div>
          <div class="tech-sub">TypeScript, React Router 7</div>
        </div>
        <div class="tech-item">
          <div class="tech-cat">Backend Services</div>
          <div class="tech-val">Node.js &bull; Express 5</div>
          <div class="tech-sub">RESTful API Architecture</div>
        </div>
        <div class="tech-item">
          <div class="tech-cat">SAP Integration</div>
          <div class="tech-val">S21 OData / REST</div>
          <div class="tech-sub">OData, RFC Proxy, Sync Logs</div>
        </div>
        <div class="tech-item">
          <div class="tech-cat">Data Store</div>
          <div class="tech-val">SQLite (WAL Mode)</div>
          <div class="tech-sub">Full Transactional Durability</div>
        </div>
        <div class="tech-item">
          <div class="tech-cat">Design System</div>
          <div class="tech-val">SAP Fiori Inspired</div>
          <div class="tech-sub">Responsive Desktop &amp; Mobile</div>
        </div>
      </div>

      <!-- Section 8: Business Value -->
      <div class="section-title"><span class="section-icon">&block;</span> Section 8 — Business Value</div>
      <div class="value-grid">
        <div class="val-card">
          <div class="val-title">Unified Operational Truth</div>
          <div class="val-desc">Bridges SAP S/21 with field transporters and receiving yards without requiring third-party hauliers to hold full enterprise SAP user licenses.</div>
        </div>
        <div class="val-card">
          <div class="val-title">Dispute-Free Weight Verification</div>
          <div class="val-desc">Mandatory 4-point weighbridge logging captures tare and gross weights at both origin and destination, eliminating payload discrepancies and transit loss disputes.</div>
        </div>
        <div class="val-card">
          <div class="val-title">Compressed Invoicing Cycles</div>
          <div class="val-desc">Immediate digital POD capture paired with OCR verification replaces multi-week physical paper transit, collapsing billing and MIRO clearing to hours.</div>
        </div>
        <div class="val-card">
          <div class="val-title">Complete Audit Governance</div>
          <div class="val-desc">Every vehicle dispatch, weighbridge entry, tolerance override, and MIRO posting is immutably timestamped with user credentials and audit logs.</div>
        </div>
      </div>

      <!-- Section 9: Current Solution Position -->
      <div class="approach-box">
        <div class="approach-title">Solution Approach &amp; Positioning</div>
        <div class="approach-desc">
          PODZO provides a purpose-built operational execution and verification layer around SAP-connected contract and purchase order workflows. It enables business users, logistics providers, and drivers to collaborate through a modern, role-based interface while preserving strict alignment, security, and traceability with SAP S/21 business data.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div><strong>PODZO</strong> &bull; Solution Overview v1.0 &bull; Confidential Client Document</div>
      <div>Page 2 of 2</div>
    </div>
  </div>

</body>
</html>
"""
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Wrote clean HTML to {HTML_FILE}")

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_border(cell, **kwargs):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = 'w:{}'.format(edge)
            element = OxmlElement(tag)
            element.set(qn('w:val'), edge_data.get('val', 'single'))
            element.set(qn('w:sz'), str(edge_data.get('sz', 4)))
            element.set(qn('w:space'), '0')
            element.set(qn('w:color'), edge_data.get('color', 'D9E1E8'))
            tcBorders.append(element)
    tcPr.append(tcBorders)

def generate_pdf():
    print("Generating PDF via Playwright Chromium...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(HTML_FILE.as_uri(), wait_until="networkidle")
        page.pdf(
            path=str(PDF_FILE),
            format="A4",
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}
        )
        browser.close()
    
    # Check page count
    doc = fitz.open(PDF_FILE)
    page_count = len(doc)
    doc.close()
    print(f"Generated PDF: {PDF_FILE} | Page count: {page_count}")
    return page_count

def generate_docx():
    print("Generating DOCX via python-docx...")
    doc = Document()
    
    # Page setup - A4, margins
    for section in doc.sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(0.38)
        section.bottom_margin = Inches(0.35)
        section.left_margin = Inches(0.48)
        section.right_margin = Inches(0.48)
    
    COLOR_SAP_BLUE = RGBColor(10, 110, 209)      # #0A6ED1
    COLOR_DARK_BLUE = RGBColor(15, 39, 68)       # #0F2744
    COLOR_NAVY = RGBColor(8, 84, 160)            # #0854A0
    COLOR_TEXT_BODY = RGBColor(29, 45, 62)       # #1D2D3E
    COLOR_TEXT_MUTED = RGBColor(91, 115, 139)    # #5B738B
    
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Segoe UI'
    normal_style.font.size = Pt(8)
    normal_style.font.color.rgb = COLOR_TEXT_BODY
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(2)
    normal_style.paragraph_format.space_before = Pt(0)

    # ── PAGE 1 ──
    header_table = doc.add_table(rows=1, cols=2)
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.autofit = False
    header_table.columns[0].width = Inches(5.3)
    header_table.columns[1].width = Inches(2.01)
    
    cell_l = header_table.cell(0, 0)
    cell_r = header_table.cell(0, 1)
    
    p_title = cell_l.paragraphs[0]
    p_title.paragraph_format.space_after = Pt(1)
    r_main = p_title.add_run("PODZO — Solution Overview\n")
    r_main.font.size = Pt(15)
    r_main.font.bold = True
    r_main.font.color.rgb = COLOR_DARK_BLUE
    
    r_sub = p_title.add_run("SAP-Connected Delivery & Transport Management Platform")
    r_sub.font.size = Pt(9)
    r_sub.font.bold = True
    r_sub.font.color.rgb = COLOR_SAP_BLUE
    
    p_meta = cell_r.paragraphs[0]
    p_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_meta.paragraph_format.space_after = Pt(0)
    r_badge = p_meta.add_run("CLIENT SOLUTION OVERVIEW\n")
    r_badge.font.size = Pt(8)
    r_badge.font.bold = True
    r_badge.font.color.rgb = COLOR_NAVY
    
    r_meta_sub = p_meta.add_run("Version 1.0 • September 2026")
    r_meta_sub.font.size = Pt(7.5)
    r_meta_sub.font.color.rgb = COLOR_TEXT_MUTED

    # Top divider
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(2)
    p_div.paragraph_format.space_after = Pt(3)
    run_div = p_div.add_run("―" * 64)
    run_div.font.color.rgb = COLOR_SAP_BLUE
    run_div.font.size = Pt(7)

    # Lead summary callout
    lead_tbl = doc.add_table(rows=1, cols=1)
    lead_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    lead_tbl.columns[0].width = Inches(7.31)
    c_lead = lead_tbl.cell(0, 0)
    set_cell_background(c_lead, "F8FAFC")
    set_cell_border(c_lead, left={'sz': 20, 'val': 'single', 'color': '0A6ED1'},
                           top={'sz': 4, 'val': 'single', 'color': 'E2E8F0'},
                           bottom={'sz': 4, 'val': 'single', 'color': 'E2E8F0'},
                           right={'sz': 4, 'val': 'single', 'color': 'E2E8F0'})
    set_cell_margins(c_lead, top=55, bottom=55, left=90, right=90)
    p_lead = c_lead.paragraphs[0]
    p_lead.paragraph_format.space_after = Pt(0)
    r_lead_b = p_lead.add_run("Executive Summary: ")
    r_lead_b.font.bold = True
    r_lead_b.font.size = Pt(8.1)
    r_lead_b.font.color.rgb = COLOR_DARK_BLUE
    r_lead_t = p_lead.add_run("PODZO provides a centralized operational interface for managing SAP-connected contracts and purchase orders, transport allocation, delivery execution, proof-of-delivery (POD) verification, and freight invoicing through to SAP MIRO supplier invoice parking and payment clearing.")
    r_lead_t.font.size = Pt(8.1)

    # Section 1: At a Glance
    p_s1 = doc.add_paragraph()
    p_s1.paragraph_format.space_before = Pt(5)
    p_s1.paragraph_format.space_after = Pt(2)
    r_s1_t = p_s1.add_run("SECTION 1 — PODZO AT A GLANCE")
    r_s1_t.font.bold = True
    r_s1_t.font.size = Pt(8.5)
    r_s1_t.font.color.rgb = COLOR_NAVY

    glance_tbl = doc.add_table(rows=2, cols=1)
    glance_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    glance_tbl.columns[0].width = Inches(7.31)
    c_g = glance_tbl.cell(0, 0)
    set_cell_background(c_g, "FFFFFF")
    set_cell_border(c_g, top={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                         bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                         left={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                         right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
    set_cell_margins(c_g, top=55, bottom=55, left=90, right=90)
    p_g = c_g.paragraphs[0]
    p_g.paragraph_format.space_after = Pt(0)
    r_g = p_g.add_run("PODZO is an enterprise operational execution platform designed to bridge SAP S/21 with day-to-day transport logistics and bulk haulage fulfillment. Used by industrial shippers, commercial hauliers, siding supervisors, drivers, and receiving customers, PODZO manages the physical realization of transport purchase orders. By retrieving active contracts and released POs directly from SAP S/21, PODZO governs vehicle allocation, 4-point weighbridge validation, digital journey tracking, and OCR-assisted POD verification—delivering end-to-end operational visibility while preserving SAP as the single authoritative financial core.")
    r_g.font.size = Pt(7.8)

    # Highlights sub-strip
    c_gh = glance_tbl.cell(1, 0)
    set_cell_background(c_gh, "F8FAFC")
    set_cell_border(c_gh, bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                          left={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                          right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
    set_cell_margins(c_gh, top=45, bottom=45, left=90, right=90)
    p_gh = c_gh.paragraphs[0]
    p_gh.paragraph_format.space_after = Pt(0)
    r_gh = p_gh.add_run("✓ Direct SAP S/21 Alignment: OData/REST live integration  •  ✓ 4-Point Weight Governance: Origin & destination verification  •  ✓ Automated Settlement: Direct SAP MIRO parking")
    r_gh.font.size = Pt(7.1)
    r_gh.font.color.rgb = COLOR_NAVY

    # Section 2: Key Capabilities (2 Columns x 3 Rows)
    p_s2 = doc.add_paragraph()
    p_s2.paragraph_format.space_before = Pt(5)
    p_s2.paragraph_format.space_after = Pt(2)
    r_s2_t = p_s2.add_run("SECTION 2 — KEY CAPABILITIES")
    r_s2_t.font.bold = True
    r_s2_t.font.size = Pt(8.5)
    r_s2_t.font.color.rgb = COLOR_NAVY

    caps = [
        ("SAP S/21 Synchronization", "Direct ingestion of active outline agreements (ME33K) and transport purchase orders (ME23N) with materials, target tonnage, agreed rates, and validity windows."),
        ("Transport Allocation & E-Sign", "Timebound PO allocation to certified transporters with mandatory digital signature acknowledgment and electronic carrier waybill (bilty) assignment."),
        ("4-Point Weighbridge Control", "Captures dispatch tare/gross (loading siding) and destination tare/gross (receiving yard) to guarantee net payload accuracy and detect transit weight loss."),
        ("Driver Mobile Execution", "Mobile-first driver web console for route navigation, arrival timestamp logging, gate check-in, and instant camera capture of stamped physical POD slips."),
        ("OCR POD Verification Desk", "Automated document data extraction matching waybill numbers, truck registrations, and delivered weights against SAP records with confidence scoring and exception review."),
        ("Invoicing & SAP MIRO Posting", "Consolidation of verified delivered tonnage into freight invoices, staging audit-ready data for SAP MIRO supplier invoice parking, posting, and AP settlement.")
    ]

    cap_tbl = doc.add_table(rows=3, cols=2)
    cap_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in cap_tbl.columns:
        col.width = Inches(3.65)
    
    idx = 0
    for r in range(3):
        for c in range(2):
            cell = cap_tbl.cell(r, c)
            set_cell_background(cell, "FFFFFF")
            set_cell_border(cell, top={'sz': 16, 'val': 'single', 'color': '0A6ED1'},
                                 bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                                 left={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                                 right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            title, desc = caps[idx]
            r_t = p.add_run(f"◆ {title}\n")
            r_t.font.bold = True
            r_t.font.size = Pt(7.6)
            r_t.font.color.rgb = COLOR_DARK_BLUE
            r_d = p.add_run(desc)
            r_d.font.size = Pt(6.9)
            r_d.font.color.rgb = RGBColor(72, 101, 129)
            idx += 1

    # Section 3: Role-Based Operations
    p_s3 = doc.add_paragraph()
    p_s3.paragraph_format.space_before = Pt(5)
    p_s3.paragraph_format.space_after = Pt(2)
    r_s3_t = p_s3.add_run("SECTION 3 — ROLE-BASED OPERATIONS")
    r_s3_t.font.bold = True
    r_s3_t.font.size = Pt(8.5)
    r_s3_t.font.color.rgb = COLOR_NAVY

    roles = [
        ("CA", "Company Admin", "Manages contracts, PO quotas, variance review queues, and final MIRO invoice approvals."),
        ("TA", "Transporter Admin", "Accepts allocated POs via digital signature, schedules fleet/drivers, and submits freight invoices."),
        ("SR", "Supervisor", "Conducts siding inspections, logs weighbridge weights, and authorizes gate dispatch release."),
        ("DR", "Driver", "Executes assignments via mobile web, verifies loading, and uploads stamped physical POD slips."),
        ("CR", "Customer", "Captures receiving weighbridge readings, records transit deviations, and confirms delivery acceptance.")
    ]

    roles_tbl = doc.add_table(rows=1, cols=5)
    roles_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in roles_tbl.columns:
        col.width = Inches(1.46)
    for c, (code, name, desc) in enumerate(roles):
        cell = roles_tbl.cell(0, c)
        set_cell_background(cell, "F8FAFC")
        set_cell_border(cell, top={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             left={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
        set_cell_margins(cell, top=45, bottom=45, left=50, right=50)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r_c = p.add_run(f"[{code}] {name}\n")
        r_c.font.bold = True
        r_c.font.size = Pt(7.2)
        r_c.font.color.rgb = COLOR_SAP_BLUE
        r_d = p.add_run(desc)
        r_d.font.size = Pt(6.4)
        r_d.font.color.rgb = RGBColor(72, 101, 129)

    # Section 4: End-to-End Workflow & Legend
    p_s4 = doc.add_paragraph()
    p_s4.paragraph_format.space_before = Pt(5)
    p_s4.paragraph_format.space_after = Pt(2)
    r_s4_t = p_s4.add_run("SECTION 4 — END-TO-END OPERATIONAL WORKFLOW")
    r_s4_t.font.bold = True
    r_s4_t.font.size = Pt(8.5)
    r_s4_t.font.color.rgb = COLOR_NAVY

    wf_steps = [
        ("Step 1", "SAP S/21 Sync", "Contracts & POs", "EAF3FC"),
        ("Step 2", "PO E-Acceptance", "Transporter (TA)", "FFFFFF"),
        ("Step 3", "Siding Dispatch", "Supervisor (SR)", "FFFFFF"),
        ("Step 4", "Transit Execution", "Driver (DR)", "FFFFFF"),
        ("Step 5", "Yard Receiving", "Customer (CR)", "FFFFFF"),
        ("Step 6", "OCR POD Review", "Company Admin (CA)", "FFFFFF"),
        ("Step 7", "SAP MIRO Clear", "Park & Post Invoice", "EAF3FC"),
    ]

    wf_tbl = doc.add_table(rows=1, cols=7)
    wf_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in wf_tbl.columns:
        col.width = Inches(1.04)
    for c, (s_num, s_title, s_actor, bg_hex) in enumerate(wf_steps):
        cell = wf_tbl.cell(0, c)
        set_cell_background(cell, bg_hex)
        set_cell_border(cell, top={'sz': 4, 'val': 'single', 'color': '0A6ED1' if bg_hex != 'FFFFFF' else 'CBD5E1'},
                             bottom={'sz': 4, 'val': 'single', 'color': '0A6ED1' if bg_hex != 'FFFFFF' else 'CBD5E1'},
                             left={'sz': 4, 'val': 'single', 'color': '0A6ED1' if bg_hex != 'FFFFFF' else 'CBD5E1'},
                             right={'sz': 4, 'val': 'single', 'color': '0A6ED1' if bg_hex != 'FFFFFF' else 'CBD5E1'})
        set_cell_margins(cell, top=40, bottom=40, left=30, right=30)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r_num = p.add_run(f"{s_num}\n")
        r_num.font.bold = True
        r_num.font.size = Pt(6.2)
        r_num.font.color.rgb = COLOR_SAP_BLUE
        r_tit = p.add_run(f"{s_title}\n")
        r_tit.font.bold = True
        r_tit.font.size = Pt(6.8)
        r_tit.font.color.rgb = COLOR_DARK_BLUE
        r_act = p.add_run(s_actor)
        r_act.font.size = Pt(6.0)
        r_act.font.color.rgb = COLOR_TEXT_MUTED

    p_wfl = doc.add_paragraph()
    p_wfl.paragraph_format.space_before = Pt(3)
    p_wfl.paragraph_format.space_after = Pt(0)
    r_wfl_b = p_wfl.add_run("Operational Data Continuity: ")
    r_wfl_b.font.bold = True
    r_wfl_b.font.size = Pt(6.8)
    r_wfl_b.font.color.rgb = COLOR_NAVY
    r_wfl_t = p_wfl.add_run("SAP S/21 Contracts & POs • Transporter E-Acceptance & Bilty • Siding Weighbridge Clearance • Driver Mobile Telemetry • Yard Stamping • OCR 3-Way Verification • SAP MIRO Invoicing & Clearing.")
    r_wfl_t.font.size = Pt(6.8)
    r_wfl_t.font.color.rgb = COLOR_TEXT_MUTED

    # Page 1 Footer
    p_f1 = doc.add_paragraph()
    p_f1.paragraph_format.space_before = Pt(4)
    p_f1.paragraph_format.space_after = Pt(0)
    r_f1 = p_f1.add_run("PODZO — SAP-Connected Delivery & Transport Management Platform  |  Page 1 of 2")
    r_f1.font.size = Pt(7)
    r_f1.font.color.rgb = COLOR_TEXT_MUTED

    # ── PAGE 2 ──
    doc.add_page_break()

    h2_table = doc.add_table(rows=1, cols=2)
    h2_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    h2_table.columns[0].width = Inches(5.3)
    h2_table.columns[1].width = Inches(2.01)
    
    c2_l = h2_table.cell(0, 0)
    c2_r = h2_table.cell(0, 1)
    
    p2_t = c2_l.paragraphs[0]
    p2_t.paragraph_format.space_after = Pt(1)
    r2_m = p2_t.add_run("PODZO — Integration & Technical Architecture\n")
    r2_m.font.size = Pt(11)
    r2_m.font.bold = True
    r2_m.font.color.rgb = COLOR_DARK_BLUE
    r2_s = p2_t.add_run("SAP S/21 Integration, Architectural Blueprint & Enterprise Value")
    r2_s.font.size = Pt(8)
    r2_s.font.bold = True
    r2_s.font.color.rgb = COLOR_SAP_BLUE
    
    p2_meta = c2_r.paragraphs[0]
    p2_meta.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p2_meta.paragraph_format.space_after = Pt(0)
    r2_b = p2_meta.add_run("ENTERPRISE BLUEPRINT\n")
    r2_b.font.size = Pt(8)
    r2_b.font.bold = True
    r2_b.font.color.rgb = COLOR_NAVY
    r2_sub = p2_meta.add_run("Page 2 of 2")
    r2_sub.font.size = Pt(7.5)
    r2_sub.font.color.rgb = COLOR_TEXT_MUTED

    p2_div = doc.add_paragraph()
    p2_div.paragraph_format.space_before = Pt(2)
    p2_div.paragraph_format.space_after = Pt(3)
    run2_div = p2_div.add_run("―" * 64)
    run2_div.font.color.rgb = COLOR_SAP_BLUE
    run2_div.font.size = Pt(7)

    # Section 5: SAP S/21 Integration
    p_s5 = doc.add_paragraph()
    p_s5.paragraph_format.space_before = Pt(4)
    p_s5.paragraph_format.space_after = Pt(2)
    r_s5_t = p_s5.add_run("SECTION 5 — SAP S/21 INTEGRATION")
    r_s5_t.font.bold = True
    r_s5_t.font.size = Pt(8.5)
    r_s5_t.font.color.rgb = COLOR_NAVY

    integ_tbl = doc.add_table(rows=4, cols=3)
    integ_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    integ_tbl.columns[0].width = Inches(1.8)
    integ_tbl.columns[1].width = Inches(3.31)
    integ_tbl.columns[2].width = Inches(2.2)

    headers = ["Integration Dimension", "Data Scope & Functional Mapping", "Data Governance & Storage Boundary"]
    for c, h in enumerate(headers):
        cell = integ_tbl.cell(0, c)
        set_cell_background(cell, "0854A0")
        set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(7.1)
        r.font.color.rgb = RGBColor(255, 255, 255)

    rows_data = [
        ("Inbound from SAP S/21\n[OData / REST APIs]",
         "Outline Contracts (ME33K), Transport POs (ME23N), Line Items, Target Tonnage, Unit Rates, Cost Centers, Delivery Sites, Vendor Master (LFA1).",
         "Retrieved from SAP. Master records remain governed exclusively in SAP S/21; cached for operational display."),
        ("Operational Processing\n[PODZO Core Layer]",
         "Digital PO acceptance signature hashes, carrier waybills (bilties), 4-point weighbridge tickets, OTP verifications, driver stamps, uploaded POD scans.",
         "Stored in PODZO. Field execution logs and audit telemetry are persisted locally in PODZO's transactional database."),
        ("Outbound to SAP S/21\n[ABAP RFC / MIRO API]",
         "Verified delivered quantities, Service Entry Sheet (SES / ML81N) triggers, MIRO supplier invoice parking/posting, ArchiveLink POD attachments.",
         "Posted to SAP. Final financial and compliance artifacts are transmitted back to SAP for settlement.")
    ]

    for r_idx, (d1, d2, d3) in enumerate(rows_data, start=1):
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([d1, d2, d3]):
            cell = integ_tbl.cell(r_idx, c_idx)
            set_cell_background(cell, bg)
            set_cell_border(cell, bottom={'sz': 4, 'val': 'single', 'color': 'E2E8F0'})
            set_cell_margins(cell, top=45, bottom=45, left=70, right=70)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(val)
            r.font.size = Pt(6.8)
            r.font.color.rgb = COLOR_TEXT_BODY

    # Section 6: High-Level Solution Architecture
    p_s6 = doc.add_paragraph()
    p_s6.paragraph_format.space_before = Pt(5)
    p_s6.paragraph_format.space_after = Pt(2)
    r_s6_t = p_s6.add_run("SECTION 6 — HIGH-LEVEL SOLUTION ARCHITECTURE")
    r_s6_t.font.bold = True
    r_s6_t.font.size = Pt(8.5)
    r_s6_t.font.color.rgb = COLOR_NAVY

    arch_tbl = doc.add_table(rows=3, cols=1)
    arch_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    arch_tbl.columns[0].width = Inches(7.31)

    layers = [
        ("1. Enterprise ERP Layer (SAP S/21 System of Record)",
         "SAP ECC / S/4HANA Core  •  Contracts (ME33K)  •  Purchase Orders (ME23N)  •  Service Entry Sheets (ML81N)  •  Supplier Invoicing (MIRO)  •  ArchiveLink / DMS"),
        ("2. PODZO Operational Core Platform (Execution & Verification Layer)",
         "S21 REST/OData Client  •  4-Point Weighbridge Engine  •  OCR Document Matching Desk  •  Variance Checking  •  Review Queue  •  Secure Storage  •  Audit Logs"),
        ("3. Role-Tailored Operational Consoles (SAP Fiori-Inspired UX)",
         "Company Admin Control Tower  •  Transporter POs & Fleet Portal  •  Supervisor Siding Console  •  Driver Mobile Web App  •  Customer Receiving Yard")
    ]

    for i, (l_title, l_desc) in enumerate(layers):
        cell = arch_tbl.cell(i, 0)
        set_cell_background(cell, "F8FAFC" if i != 1 else "FFFFFF")
        set_cell_border(cell, top={'sz': 4, 'val': 'single', 'color': '0A6ED1' if i == 1 else 'CBD5E1'},
                             bottom={'sz': 4, 'val': 'single', 'color': '0A6ED1' if i == 1 else 'CBD5E1'},
                             left={'sz': 4, 'val': 'single', 'color': '0A6ED1' if i == 1 else 'CBD5E1'},
                             right={'sz': 4, 'val': 'single', 'color': '0A6ED1' if i == 1 else 'CBD5E1'})
        set_cell_margins(cell, top=45, bottom=45, left=90, right=90)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r1 = p.add_run(f"{l_title}\n")
        r1.font.bold = True
        r1.font.size = Pt(7.4)
        r1.font.color.rgb = COLOR_DARK_BLUE
        r2 = p.add_run(l_desc)
        r2.font.size = Pt(6.6)
        r2.font.color.rgb = RGBColor(72, 101, 129)

    # Section 7: Technology Overview
    p_s7 = doc.add_paragraph()
    p_s7.paragraph_format.space_before = Pt(5)
    p_s7.paragraph_format.space_after = Pt(2)
    r_s7_t = p_s7.add_run("SECTION 7 — TECHNOLOGY OVERVIEW")
    r_s7_t.font.bold = True
    r_s7_t.font.size = Pt(8.5)
    r_s7_t.font.color.rgb = COLOR_NAVY

    tech_items = [
        ("Frontend", "React 19 • Vite", "TypeScript, React Router 7"),
        ("Backend Services", "Node.js • Express 5", "RESTful API Architecture"),
        ("SAP Integration", "S21 OData / REST", "OData, RFC Proxy, Sync Logs"),
        ("Data Store", "SQLite (WAL Mode)", "Full Transactional Durability"),
        ("Design System", "SAP Fiori Inspired", "Responsive Desktop & Mobile")
    ]

    tech_tbl = doc.add_table(rows=1, cols=5)
    tech_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in tech_tbl.columns:
        col.width = Inches(1.46)
    for c, (cat, val, sub) in enumerate(tech_items):
        cell = tech_tbl.cell(0, c)
        set_cell_background(cell, "FFFFFF")
        set_cell_border(cell, top={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             left={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                             right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
        set_cell_margins(cell, top=45, bottom=45, left=50, right=50)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r_c = p.add_run(f"{cat.upper()}\n")
        r_c.font.bold = True
        r_c.font.size = Pt(6.2)
        r_c.font.color.rgb = COLOR_SAP_BLUE
        r_v = p.add_run(f"{val}\n")
        r_v.font.bold = True
        r_v.font.size = Pt(6.8)
        r_v.font.color.rgb = COLOR_DARK_BLUE
        r_s = p.add_run(sub)
        r_s.font.size = Pt(6.0)
        r_s.font.color.rgb = COLOR_TEXT_MUTED

    # Section 8: Business Value
    p_s8 = doc.add_paragraph()
    p_s8.paragraph_format.space_before = Pt(5)
    p_s8.paragraph_format.space_after = Pt(2)
    r_s8_t = p_s8.add_run("SECTION 8 — BUSINESS VALUE")
    r_s8_t.font.bold = True
    r_s8_t.font.size = Pt(8.5)
    r_s8_t.font.color.rgb = COLOR_NAVY

    values = [
        ("Unified Operational Truth", "Bridges SAP S/21 with field transporters and receiving yards without requiring third-party hauliers to hold full enterprise SAP user licenses."),
        ("Dispute-Free Weight Verification", "Mandatory 4-point weighbridge logging captures tare and gross weights at both origin and destination, eliminating payload discrepancies and transit loss disputes."),
        ("Compressed Invoicing Cycles", "Immediate digital POD capture paired with OCR verification replaces multi-week physical paper transit, collapsing billing and MIRO clearing to hours."),
        ("Complete Audit Governance", "Every vehicle dispatch, weighbridge entry, tolerance override, and MIRO posting is immutably timestamped with user credentials and audit logs.")
    ]

    val_tbl = doc.add_table(rows=2, cols=2)
    val_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col in val_tbl.columns:
        col.width = Inches(3.65)
    v_idx = 0
    for r in range(2):
        for c in range(2):
            cell = val_tbl.cell(r, c)
            set_cell_background(cell, "FFFFFF")
            set_cell_border(cell, left={'sz': 16, 'val': 'single', 'color': '107E3E'},
                                 top={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                                 bottom={'sz': 4, 'val': 'single', 'color': 'D9E1E8'},
                                 right={'sz': 4, 'val': 'single', 'color': 'D9E1E8'})
            set_cell_margins(cell, top=45, bottom=45, left=70, right=70)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            v_t, v_d = values[v_idx]
            r_vt = p.add_run(f"{v_t}\n")
            r_vt.font.bold = True
            r_vt.font.size = Pt(7.3)
            r_vt.font.color.rgb = COLOR_DARK_BLUE
            r_vd = p.add_run(v_d)
            r_vd.font.size = Pt(6.6)
            r_vd.font.color.rgb = RGBColor(72, 101, 129)
            v_idx += 1

    # Section 9: Current Solution Position
    appr_tbl = doc.add_table(rows=1, cols=1)
    appr_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    appr_tbl.columns[0].width = Inches(7.31)
    c_ap = appr_tbl.cell(0, 0)
    set_cell_background(c_ap, "EAF3FC")
    set_cell_border(c_ap, top={'sz': 4, 'val': 'single', 'color': 'B8D8F8'},
                          bottom={'sz': 4, 'val': 'single', 'color': 'B8D8F8'},
                          left={'sz': 4, 'val': 'single', 'color': 'B8D8F8'},
                          right={'sz': 4, 'val': 'single', 'color': 'B8D8F8'})
    set_cell_margins(c_ap, top=50, bottom=50, left=90, right=90)
    p_ap = c_ap.paragraphs[0]
    p_ap.paragraph_format.space_after = Pt(0)
    r_apt = p_ap.add_run("SOLUTION APPROACH & POSITIONING\n")
    r_apt.font.bold = True
    r_apt.font.size = Pt(7.1)
    r_apt.font.color.rgb = COLOR_NAVY
    r_apd = p_ap.add_run("PODZO provides a purpose-built operational execution and verification layer around SAP-connected contract and purchase order workflows. It enables business users, logistics providers, and drivers to collaborate through a modern, role-based interface while preserving strict alignment, security, and traceability with SAP S/21 business data.")
    r_apd.font.size = Pt(6.8)
    r_apd.font.color.rgb = COLOR_DARK_BLUE

    # Page 2 Footer
    p_f2 = doc.add_paragraph()
    p_f2.paragraph_format.space_before = Pt(5)
    p_f2.paragraph_format.space_after = Pt(0)
    r_f2 = p_f2.add_run("PODZO — Solution Overview v1.0  •  Confidential Client Document  |  Page 2 of 2")
    r_f2.font.size = Pt(7)
    r_f2.font.color.rgb = COLOR_TEXT_MUTED

    doc.save(str(DOCX_FILE))
    print(f"Generated DOCX: {DOCX_FILE}")

if __name__ == "__main__":
    create_html()
    pdf_pages = generate_pdf()
    generate_docx()
    print(f"All files generated successfully! PDF Pages: {pdf_pages}")
