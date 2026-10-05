# PODZO Joule Assistant & Capability

This folder contains the complete SAP Joule custom capability and assistant definitions for **PODZO** (Transporter Proof-of-Delivery & Automated Invoicing System).

---

## 🏗️ Architecture

```
joule/
├── podzo.da.sapdas.yaml                  # Standalone PODZO assistant manifest
├── sap_digital_assistant.da.sapdas.yaml  # Default tenant assistant mount
├── Readme.md
└── podzo_capability/
    ├── capability.sapdas.yaml            # Capability declaration & system aliases
    ├── functions/                        # 14 REST API Functions
    │   ├── get_contracts.yaml
    │   ├── get_purchase_orders.yaml
    │   ├── get_single_po.yaml
    │   ├── get_transporters.yaml
    │   ├── distribute_po.yaml
    │   ├── get_review_queue.yaml
    │   ├── resolve_review_queue.yaml
    │   ├── get_invoices.yaml
    │   ├── post_miro.yaml
    │   ├── get_assignments.yaml
    │   ├── create_assignment.yaml
    │   ├── get_drivers.yaml
    │   ├── get_vehicles.yaml
    │   └── submit_invoice.yaml
    ├── scenarios/                        # 13 Persona Scenarios + 1 Global Guard
    │   ├── guard.yaml
    │   ├── ca_view_contracts.yaml
    │   ├── ca_distribute_po.yaml
    │   ├── ca_review_queue.yaml
    │   ├── ca_approve_exception.yaml
    │   ├── ca_view_invoices.yaml
    │   ├── ca_post_miro.yaml
    │   ├── ca_dashboard.yaml
    │   ├── ta_view_pos.yaml
    │   ├── ta_assign_driver.yaml
    │   ├── ta_submit_invoice.yaml
    │   ├── cr_incoming.yaml
    │   ├── cr_weight_status.yaml
    │   └── cr_pod_summary.yaml
    └── tests/features/                   # Gherkin Test Suites
        ├── ca_skills.feature
        ├── ta_skills.feature
        └── cr_skills.feature
```

---

## 🌐 BTP Destination Configuration

Before deploying, ensure the BTP Destination is created in your subaccount (`sap-btp-ais`):

| Property | Value |
| :--- | :--- |
| **Destination Name** | `podzone_destination` |
| **System Alias** | `PodzoneService` |
| **URL** | `https://podzone-srv-sleepy-baboon-kp.cfapps.eu30.hana.ondemand.com` |
| **Proxy Type** | `Internet` |
| **Authentication** | `NoAuthentication` *(JWT token passed via header)* |

---

## 🚀 CLI Commands

### 1. Install Joule Studio CLI
```bash
npm install @sap/joule-studio-cli -g
```

### 2. Login to Tenant
```bash
joule login --sso
joule status
```

### 3. Deploy PODZO Skills (Compile & Deploy)
```bash
# Navigate to the joule folder
cd C:\Users\Varad\Documents\GitHub\POD\joule

# Deploy standalone assistant
joule deploy ./podzo.da.sapdas.yaml -c

# (Optional) Mount into tenant's default Joule assistant
joule deploy ./sap_digital_assistant.da.sapdas.yaml -c
```

### 4. Verify & Launch Test
```bash
joule list
joule get podzo
joule launch podzo
```
