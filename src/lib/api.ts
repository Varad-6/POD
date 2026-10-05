/**
 * Ikwezi Portal — API Client v2
 * Centralized Fetch wrapper with JWT injection
 */

import { API_HOST } from './api_v3';
const API_BASE = `${API_HOST}/api/v2`;

function getToken(): string | null {
  return localStorage.getItem('ikwezi_token');
}

export function setToken(token: string) {
  localStorage.setItem('ikwezi_token', token);
}

export function clearToken() {
  localStorage.removeItem('ikwezi_token');
  localStorage.removeItem('ikwezi_user');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

// ── AUTH ──────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password })
    }),
  me: () => request<User>('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

// ── DASHBOARD ─────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => request<DashboardStats>('/dashboard/stats'),
  auditLog: (params?: { entity_type?: string; entity_id?: number; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<AuditLog[]>(`/dashboard/audit-log${q ? '?' + q : ''}`);
  },
  sapSync: () => request<SapSyncLog[]>('/dashboard/sap-sync'),
};

// ── CONTRACTS ─────────────────────────────────────────────────
export const contractsApi = {
  list: () => request<Contract[]>('/contracts'),
  get: (id: number) => request<Contract>(`/contracts/${id}`),
  create: (data: Partial<Contract>) => request('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  setStatus: (id: number, status: string) =>
    request(`/contracts/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ── PURCHASE ORDERS ───────────────────────────────────────────
export const posApi = {
  list: (params?: { status?: string; contract_id?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<PurchaseOrder[]>(`/pos${q ? '?' + q : ''}`);
  },
  get: (id: number) => request<PurchaseOrder>(`/pos/${id}`),
  create: (data: Partial<PurchaseOrder>) => request('/pos', { method: 'POST', body: JSON.stringify(data) }),
};

// ── DISPATCHES ────────────────────────────────────────────────
export const dispatchesApi = {
  list: (params?: { status?: string; transporter_id?: number; po_id?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<DispatchSummary[]>(`/dispatches${q ? '?' + q : ''}`);
  },
  get: (id: number) => request<DispatchDetail>(`/dispatches/${id}`),
  create: (data: { po_id: number; transporter_id?: number; scheduled_date?: string }) =>
    request('/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  assign: (id: number, data: { driver_id: number; vehicle_id: number; availability_window?: { start: string; end: string } }) =>
    request(`/dispatches/${id}/assign`, { method: 'PATCH', body: JSON.stringify(data) }),
  gateCheck: (id: number, data: GateCheckData) =>
    request(`/dispatches/${id}/gate-check`, { method: 'PATCH', body: JSON.stringify(data) }),
  weigh: (id: number, data: { checkpoint: string; weight_kg: number }) =>
    request(`/dispatches/${id}/weigh`, { method: 'POST', body: JSON.stringify(data) }),
  dispatch: (id: number) =>
    request(`/dispatches/${id}/dispatch`, { method: 'PATCH' }),
  transit: (id: number, gps?: { gps_lat: number; gps_lng: number }) =>
    request(`/dispatches/${id}/transit`, { method: 'PATCH', body: JSON.stringify(gps ?? {}) }),
  arrive: (id: number, gps?: { gps_lat: number; gps_lng: number; gps_accuracy_m?: number }) =>
    request(`/dispatches/${id}/arrive`, { method: 'POST', body: JSON.stringify(gps ?? {}) }),
  releaseHeld: (id: number, reason?: string) =>
    request(`/dispatches/${id}/release-held`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  cancel: (id: number, reason: string) =>
    request(`/dispatches/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

// ── POD ───────────────────────────────────────────────────────
export const podApi = {
  submit: (data: { dispatch_id: number; scanned_pod_url: string; waybill_no?: string }) =>
    request('/pod/submit', { method: 'POST', body: JSON.stringify(data) }),
  reviewQueue: () => request<ReviewQueueItem[]>('/pod/review-queue'),
  resolveReview: (id: number, data: { resolution_notes?: string; override_reason?: string }) =>
    request(`/pod/review-queue/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(data) }),
  byDispatch: (dispatchId: number) => request<PodDocument[]>(`/pod/dispatch/${dispatchId}`),
};

// ── INVOICES ──────────────────────────────────────────────────
export const invoicesApi = {
  submitFreight: (data: { dispatch_id: number; accepted_payload_kg: number; tax_invoice_no?: string }) =>
    request('/invoices/freight', { method: 'POST', body: JSON.stringify(data) }),
  listFreight: () => request<FreightInvoice[]>('/invoices/freight'),
  approveFreight: (id: number) => request(`/invoices/freight/${id}/approve`, { method: 'PATCH' }),
  rejectFreight: (id: number, reason: string) =>
    request(`/invoices/freight/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ rejection_reason: reason }) }),
  createMiro: (data: { freight_invoice_id: number; waybill_no?: string }) =>
    request('/invoices/miro', { method: 'POST', body: JSON.stringify(data) }),
  listMiro: () => request<MiroInvoice[]>('/invoices/miro'),
  postMiro: (id: number) => request(`/invoices/miro/${id}/post`, { method: 'PATCH' }),
  clearMiro: (id: number, payment_ref?: string) =>
    request(`/invoices/miro/${id}/clear`, { method: 'PATCH', body: JSON.stringify({ payment_ref }) }),
};

// ── TRANSPORTERS ──────────────────────────────────────────────
export const transportersApi = {
  list: () => request<Transporter[]>('/transporters'),
  create: (data: Partial<Transporter>) => request('/transporters', { method: 'POST', body: JSON.stringify(data) }),
  drivers: (transporterId: number) => request<Driver[]>(`/transporters/${transporterId}/drivers`),
  allDrivers: () => request<Driver[]>('/transporters/drivers/all'),
  createDriver: (transporterId: number, data: Partial<Driver>) =>
    request(`/transporters/${transporterId}/drivers`, { method: 'POST', body: JSON.stringify(data) }),
  vehicles: (transporterId: number) => request<Vehicle[]>(`/transporters/${transporterId}/vehicles`),
  createVehicle: (transporterId: number, data: Partial<Vehicle>) =>
    request(`/transporters/${transporterId}/vehicles`, { method: 'POST', body: JSON.stringify(data) }),
};

// ── TYPE DEFINITIONS ──────────────────────────────────────────
export interface User {
  id: number;
  username: string;
  role: 'COMPANY_ADMIN' | 'TRANSPORTER_ADMIN' | 'DRIVER' | 'CUSTOMER' | 'SUPERVISOR';
  displayName: string;
  email?: string;
  entityId?: number;
}

export interface Contract {
  id: number;
  sap_contract_no: string;
  customer_id: number;
  customer_name?: string;
  start_date: string;
  end_date: string;
  material: string;
  uom: string;
  terms?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  created_at: string;
  purchase_orders?: PurchaseOrder[];
}

export interface PurchaseOrder {
  id: number;
  contract_id: number;
  sap_po_no: string;
  material: string;
  uom: string;
  target_qty: number;
  rate: number;
  tolerance_pct: number;
  cost_center?: string;
  from_location: string;
  to_location: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  sap_contract_no?: string;
  customer_name?: string;
  dispatches?: DispatchSummary[];
}

export interface DispatchSummary {
  id: number;
  status: string;
  scheduled_date?: string;
  sap_po_no?: string;
  material?: string;
  from_location?: string;
  to_location?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_reg?: string;
  transporter_name?: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
}

export interface DispatchDetail extends DispatchSummary {
  po_id: number;
  transporter_id?: number;
  driver_id?: number;
  vehicle_id?: number;
  target_qty?: number;
  rate?: number;
  tolerance_pct?: number;
  dest_lat?: number;
  dest_lng?: number;
  geofence_radius_m?: number;
  weighbridge_logs: WeighbridgeLog[];
  gate_check?: GateCheck;
  bilty?: BiltyRecord;
  transit_events: TransitEvent[];
  arrival_confirmation?: ArrivalConfirmation;
  delivery_metadata?: DeliveryMetadata;
  pod_document?: PodDocument;
  review_queue?: ReviewQueueItem;
  freight_invoice?: FreightInvoice;
  miro_invoice?: MiroInvoice;
  computed: {
    mine_gross_kg: number | null;
    mine_tare_kg: number | null;
    mine_net_kg: number | null;
    mine_net_tonnes: number | null;
    dest_gross_kg: number | null;
    dest_tare_kg: number | null;
    dest_net_kg: number | null;
    dest_net_tonnes: number | null;
    variance_kg: number | null;
    variance_pct: number | null;
    within_tolerance: boolean | null;
  };
}

export interface WeighbridgeLog {
  id: number;
  dispatch_id: number;
  checkpoint: 'MINE_TARE' | 'MINE_GROSS' | 'DEST_GROSS' | 'DEST_TARE';
  weight_kg: number;
  recorded_by_role: string;
  timestamp: string;
}

export interface GateCheck {
  id: number;
  license_valid: number;
  prdp_valid: number;
  bilty_valid: number;
  material_match: number;
  result: 'PASS' | 'FAIL';
  reason?: string;
  checked_at: string;
}

export interface GateCheckData {
  license_valid: boolean;
  prdp_valid: boolean;
  bilty_valid: boolean;
  material_match: boolean;
  reason?: string;
}

export interface BiltyRecord {
  id: number;
  bilty_no?: string;
  bilty_date?: string;
  lr_no?: string;
  verified_by_sr: number;
}

export interface TransitEvent {
  id: number;
  status: string;
  gps_lat?: number;
  gps_lng?: number;
  timestamp: string;
}

export interface ArrivalConfirmation {
  id: number;
  gps_lat?: number;
  gps_lng?: number;
  ip_address: string;
  driver_confirmed_at: string;
}

export interface DeliveryMetadata {
  id: number;
  iso_timestamp_utc: string;
  client_ip: string;
  gps_lat?: number;
  gps_lng?: number;
  status: string;
}

export interface PodDocument {
  id: number;
  dispatch_id: number;
  scanned_pod_url: string;
  ocr_extracted_waybill?: string;
  ocr_extracted_weight?: number;
  ocr_confidence_pct?: number;
  match_status: 'MATCH' | 'MISMATCH' | 'PENDING_REVIEW';
  created_at: string;
}

export interface ReviewQueueItem {
  id: number;
  pod_id: number;
  dispatch_id: number;
  flag_reason: string;
  status: 'OPEN' | 'RESOLVED';
  blocks_miro_bool: number;
  sap_po_no?: string;
  material?: string;
  driver_name?: string;
  transporter_name?: string;
  customer_name?: string;
  created_at: string;
}

export interface FreightInvoice {
  id: number;
  dispatch_id: number;
  accepted_payload_kg: number;
  rate_per_uom: number;
  total_value: number;
  tax_invoice_no?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  sap_po_no?: string;
  transporter_name?: string;
  customer_name?: string;
  created_at: string;
}

export interface MiroInvoice {
  id: number;
  dispatch_id: number;
  freight_invoice_id: number;
  sap_invoice_no?: string;
  waybill_no?: string;
  status: 'PARKED' | 'POSTED' | 'CLEARED';
  posted_date?: string;
  cleared_date?: string;
  sap_bapi_ref?: string;
  payment_ref?: string;
  total_value?: number;
  transporter_name?: string;
  created_at: string;
}

export interface Transporter {
  id: number;
  name: string;
  gstin: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

export interface Driver {
  id: number;
  transporter_id: number;
  name: string;
  license_no: string;
  license_expiry: string;
  prdp_no: string;
  prdp_expiry: string;
  phone?: string;
  transporter_name?: string;
  license_expired?: number;
  prdp_expired?: number;
}

export interface Vehicle {
  id: number;
  transporter_id: number;
  reg_no: string;
  trailer1_reg?: string;
  trailer2_reg?: string;
  capacity_tonnes?: number;
}

export interface DashboardStats {
  totalDispatches?: number;
  activeDispatches?: number;
  pendingReview?: number;
  pendingInvoices?: number;
  miroParked?: number;
  totalPayloadTonnes?: number;
  totalRevenue?: number;
  statusBreakdown?: { status: string; count: number }[];
  recentDispatches?: DispatchSummary[];
  pendingAssignment?: number;
  active?: number;
  expiringLicenses?: Driver[];
  currentDispatch?: DispatchSummary;
  incomingTrucks?: number;
  totalReceivedKg?: number;
  pendingGateCheck?: number;
  heldDispatches?: number;
  todayDispatched?: number;
}

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  from_status?: string;
  to_status?: string;
  performed_by_name?: string;
  performed_by_role?: string;
  metadata_json?: string;
  ip_address?: string;
  created_at: string;
}

export interface SapSyncLog {
  id: number;
  entity_type: string;
  sap_ref?: string;
  direction: 'IN' | 'OUT';
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  synced_at: string;
}
