/**
 * Ikwezi Transporter Portal — API Client V3
 */

export const API_HOST = (import.meta as any).env?.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://podzone-srv-sleepy-baboon-kp.cfapps.eu30.hana.ondemand.com'
    : 'http://localhost:3001');

export const API_BASE = `${API_HOST}/api/v3`;

function getToken(): string | null {
  return localStorage.getItem('podzo_token_v3');
}

export function setToken(token: string) {
  localStorage.setItem('podzo_token_v3', token);
}

export function clearToken() {
  localStorage.removeItem('podzo_token_v3');
  localStorage.removeItem('podzo_user_v3');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const contentType = res.headers.get('content-type') || '';
  let data: any = {};

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      console.warn('[API Client JSON Parse Error]', e);
    }
  } else {
    const rawText = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — ${res.statusText || 'Server Endpoint Error'}`);
    }
    data = { text: rawText };
  }

  if (res.status === 401) {
    clearToken();
    if (!path.startsWith('/auth/login') && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error(data.error || data.message || 'Unauthorized');
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data as T;
}

// ─── DEMO RESET ──────────────────────────────────────────────
export const demoApi = {
  resetData: () => request<{ status: string; message: string }>('/demo/reset', { method: 'POST' }),
};

// ─── SEARCH ──────────────────────────────────────────────────
export const searchApi = {
  globalSearch: (q: string) =>
    request<{
      query: string;
      contracts: any[];
      purchaseOrders: any[];
      assignments: any[];
      drivers: any[];
      vehicles: any[];
    }>(`/search?q=${encodeURIComponent(q)}`),
};

// ─── AUTH ────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: UserV3 }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password })
    }),
  me: () => request<UserV3>('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

// ─── CA ENDPOINTS ────────────────────────────────────────────
export const caApi = {
  getContracts: () => request<ContractV3[]>('/contracts'),
  getPurchaseOrders: () => request<PurchaseOrderV3[]>('/purchase-orders'),
  getContractDetails: (id: number) => request<ContractV3>(`/contracts/${id}`),
  getContractPdf: (id: number) => request<{ pdf_url: string }>(`/contracts/${id}/pdf`),
  syncS21: (contractsData?: any[]) =>
    request<{ success: boolean; total_contracts: number; total_pos: number; message: string }>('/sync/s21', {
      method: 'POST', body: JSON.stringify({ contracts: contractsData || [] })
    }),
  distributePo: (poId: number, data: { transporter_id: number; po_ids?: number[]; availability_window?: string; timebound?: string }) =>

    request<{ id: number; po_ids?: number[]; message: string }>(`/po/${poId}/distribute`, { method: 'POST', body: JSON.stringify(data) }),
  getPoDetails: (poId: number) =>
    request<PurchaseOrderV3>(`/purchase-orders/${poId}`),

  getReviewQueue: (status: 'OPEN' | 'RESOLVED' = 'OPEN') =>
    request<ReviewQueueItemV3[]>(`/review-queue?status=${status}`),
  clearReviewQueue: () =>
    request<{ success: boolean; cleared: number; remaining: number; message: string }>('/review-queue', { method: 'DELETE' }),
  resolveReview: (id: number, notes: string, action: 'APPROVE' | 'REJECT' = 'APPROVE') =>
    request<{ success?: boolean; message: string }>(`/review-queue/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolution_notes: notes, action }) }),
  verifyCA: (assignmentId: number, verified_bool: boolean, notes?: string) =>
    request<{ message: string }>(`/ca-verification/${assignmentId}`, { method: 'POST', body: JSON.stringify({ verified_bool, notes }) }),
  getDeliveryInvoices: (status: 'DRAFT' | 'SENT_TO_CA' = 'SENT_TO_CA') =>
    request<DeliveryInvoiceV3[]>(`/delivery-invoices?status=${status}`),
  postMiro: (mainInvoiceId: number) =>
    request<{ message: string; sap_invoice_no: string; sap_ref: string }>(`/miro/${mainInvoiceId}/post`, { method: 'POST' }),
};

// ─── TA ENDPOINTS ────────────────────────────────────────────
export const taApi = {
  getJobConfigs: (status: 'PENDING' | 'ASSIGNED' = 'PENDING') =>
    request<JobConfigV3[]>(`/job-configs?status=${status}`),
  assignJob: (id: number, data: MultiTruckAssignPayload | SingleAssignPayload) =>
    request<{ id?: number; ids?: number[]; truck_count: number; message: string }>(`/job-configs/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  createDeliveryInvoice: (data: { assignment_id: number; invoice_no: string; file_url: string }) =>
    request<{ id: number; message: string }>('/delivery-invoices', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── TRANSPORTERS ENDPOINTS ───────────────────────────────────
export const transportersApi = {
  list: () => request<Transporter[]>('/transporters'),
  drivers: (transporterId: number) => request<Driver[]>(`/transporters/${transporterId}/drivers`),
  vehicles: (transporterId: number) => request<Vehicle[]>(`/transporters/${transporterId}/vehicles`),
  compatibleVehicles: (transporterId: number, qty: number, material: string) =>
    request<VehicleCompatibility>(`/vehicles/compatible?transporter_id=${transporterId}&qty=${qty}&material=${encodeURIComponent(material)}`),
};

// ─── SR ENDPOINTS ────────────────────────────────────────────
export const srApi = {
  scheduleArrival: (id: number, data: { arrival_date: string; arrival_time: string }) =>
    request<{ message: string }>(`/assignments/${id}/arrival-schedule`, { method: 'POST', body: JSON.stringify(data) }),
  supervisorCheck: (id: number, data: { arrival_date: string; arrival_time: string; weight_check_bool: boolean; bilty_check_bool: boolean; material_check_bool: boolean; license_check_bool: boolean }) =>
    request<{ message: string }>(`/assignments/${id}/supervisor-check`, { method: 'POST', body: JSON.stringify(data) }),
  gateCheck: (id: number, data: { license_valid: boolean; prdp_valid: boolean; bilty_valid: boolean; material_match: boolean; reason?: string }) =>
    request<{ status: string; message: string }>(`/assignments/${id}/gate-check`, { method: 'POST', body: JSON.stringify(data) }),
  biltyUpload: (id: number, data: { bilty_no: string; bilty_date: string; upload_url: string }) =>
    request<{ message: string }>(`/assignments/${id}/bilty-upload`, { method: 'POST', body: JSON.stringify(data) }),
  authorizeJourney: (id: number) =>
    request<{ message: string; queue_time_mins: number; penalty_amount: number }>(`/assignments/${id}/authorize-journey`, { method: 'POST' }),
  stampAssignment: (id: number, data: { gps_lat: number; gps_lng: number }) =>
    request<{ message: string }>(`/assignments/${id}/stamp`, { method: 'POST', body: JSON.stringify(data) }),
};

// ─── DR ENDPOINTS ────────────────────────────────────────────
export const drApi = {
  getMineAssignments: () => request<TransportAssignmentV3[]>('/assignments/mine'),
  otpGenerate: (id: number, stage: 'PICKUP' | 'DELIVERY') =>
    request<{ otp_code: string; message: string }>(`/assignments/${id}/otp/generate`, { method: 'POST', body: JSON.stringify({ stage }) }),
  otpVerify: (id: number, stage: 'PICKUP' | 'DELIVERY', code: string) =>
    request<{ message: string }>(`/assignments/${id}/otp/verify`, { method: 'POST', body: JSON.stringify({ stage, otp_code: code }) }),
  logWeight: (id: number, data: { stage: 'MINE_TARE' | 'MINE_GROSS' | 'DEST_GROSS' | 'DEST_TARE'; weight_kg: number; truck_detail?: string }) =>
    request<{ message: string }>(`/assignments/${id}/weight-log`, { method: 'POST', body: JSON.stringify(data) }),
  logTransitEvent: (id: number, data: { status: 'DISPATCHED' | 'EN_ROUTE' | 'GEOFENCE_ALERT' | 'ARRIVED'; gps_lat: number; gps_lng: number }) =>
    request<{ message: string }>(`/assignments/${id}/transit-event`, { method: 'POST', body: JSON.stringify(data) }),
  confirmArrival: (id: number, gps: { gps_lat: number; gps_lng: number }) =>
    request<{ message: string; ip_captured: string; outside_geofence: boolean }>(`/assignments/${id}/arrived`, { method: 'POST', body: JSON.stringify(gps) }),
  uploadPod: (id: number, data: { pod_file_url?: string; mock_scenario?: 'MATCH' | 'MISMATCH' | 'BLURRY'; file?: File } | FormData) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return request<{ message: string; ocr: any; variance: any; under_review: boolean; extracted_invoice?: any }>(`/assignments/${id}/pod-upload`, { method: 'POST', body: data });
    }
    if ('file' in data && data.file) {
      const fd = new FormData();
      fd.append('file', data.file);
      if (data.mock_scenario) fd.append('mock_scenario', data.mock_scenario);
      if (data.pod_file_url) fd.append('pod_file_url', data.pod_file_url);
      return request<{ message: string; ocr: any; variance: any; under_review: boolean; extracted_invoice?: any }>(`/assignments/${id}/pod-upload`, { method: 'POST', body: fd });
    }
    return request<{ message: string; ocr: any; variance: any; under_review: boolean; extracted_invoice?: any }>(`/assignments/${id}/pod-upload`, { method: 'POST', body: JSON.stringify(data) });
  },
};

// ─── ASSIGNMENTS ENDPOINTS ───────────────────────────────────
export const assignmentsApi = {
  list: (status?: string) => request<TransportAssignmentV3[]>(`/assignments${status ? '?status=' + status : ''}`),
};

// ─── CR ENDPOINTS ────────────────────────────────────────────
export const crApi = {
  getIncomingAssignments: () => request<TransportAssignmentV3[]>('/assignments/incoming'),
  captureDelivery: (id: number, data: { truck_data: any; issues?: string; weight_log_ref?: number; unit_calc?: string }) =>
    request<{ message: string }>(`/assignments/${id}/capture-delivery`, { method: 'POST', body: JSON.stringify(data) }),
  stampConfirm: (id: number) =>
    request<{ message: string }>(`/assignments/${id}/stamp-confirm`, { method: 'POST' }),
};

// ─── INVOICES ENDPOINTS ───────────────────────────────────────
export const invoicesApi = {
  listMiro: () => request<MiroInvoice[]>('/miro'),
  createMiro: (data: { freight_invoice_id: number; waybill_no?: string }) =>
    request<{ id: number; sap_invoice_no: string; status: string }>('/miro', { method: 'POST', body: JSON.stringify(data) }),
  postMiro: (id: number) =>
    request<{ message: string }>((`/miro/${id}/post`), { method: 'POST' }),
  clearMiro: (id: number, payment_ref?: string, payment_type?: 'FULL' | 'PARTIAL', percent?: number) =>
    request<{ message: string }>((`/miro/${id}/clear`), { method: 'POST', body: JSON.stringify({ payment_ref, payment_type, percent }) }),
};

// ─── TYPES ───────────────────────────────────────────────────
export interface UserV3 {
  id: number;
  username: string;
  role: 'CA' | 'TA' | 'DR' | 'CR' | 'SR' | 'SA';
  displayName: string;
  email?: string;
  entityId?: number;
}

export interface ContractV3 {
  id: number;
  sap_contract_no: string;
  customer_id: number;
  customer_name?: string;
  start_date: string;
  end_date: string;
  pdf_url?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  purchase_orders?: PurchaseOrderV3[];
}

export interface PurchaseOrderV3 {
  id: number;
  contract_id: number;
  sap_po_no: string;
  po_item_no: number;
  material: string;
  uom: string;
  target_qty: number;
  rate: number;
  tolerance_pct: number;
  cost_center?: string;
  allowed_queue_time_mins?: number;
  detention_rate_per_hour?: number;
  sap_contract_no?: string;
  customer_name?: string;
  status: string;
}

/** A single PO item within a job config (from job_config_pos) */
export interface PoItemV3 {
  po_id: number;
  sap_po_no: string;
  po_item_no: number;
  material: string;
  planned_qty: number;
  uom: string;
  rate: number;
  body_type: string;
  body_icon: string;
}

export interface JobConfigV3 {
  id: number;
  po_id: number;
  transporter_id: number;
  availability_window: string;
  timebound: string;
  status: 'PENDING' | 'ASSIGNED' | 'EXPIRED';
  // Primary PO (backward compat)
  sap_po_no?: string;
  po_item_no?: number;
  material?: string;
  target_qty?: number;
  rate?: number;
  customer_name?: string;
  // Multi-item aggregation (new)
  po_items?: PoItemV3[];
  item_count?: number;
  total_planned_qty?: number;
}

/** One truck slot in a multi-truck assignment */
export interface AssignSlot {
  driver_id: number;
  vehicle_id: number;
  license_no: string;
  gstin: string;
  assigned_qty: number;
}

/** Multi-truck dispatch payload */
export interface MultiTruckAssignPayload {
  assignments: AssignSlot[];
  scheduled_date: string;
  location?: string;
}

/** Single-truck dispatch payload (legacy) */
export interface SingleAssignPayload {
  driver_id: number;
  vehicle_id: number;
  license_no: string;
  gstin: string;
  scheduled_date: string;
  location?: string;
}

/** Response from GET /vehicles/compatible */
export interface VehicleCompatibility {
  can_single_truck: boolean;
  min_trucks_needed: number;
  recommended_body_type: string;
  required_qty: number;
  vehicles: VehicleEnriched[];
}

export interface VehicleEnriched extends Vehicle {
  body_type: string;
  body_icon: string;
  material_match: boolean;
  can_handle_alone: boolean;
  is_busy: boolean;
  status: 'AVAILABLE' | 'BUSY';
  capacity_vs_required: string | null;
  transporter_name?: string;
}


export interface TransportAssignmentV3 {
  id: number;
  job_config_id: number;
  driver_id: number;
  vehicle_id: number;
  location?: string;
  license_no: string;
  gstin: string;
  scheduled_date: string;
  status: string;
  sap_po_no?: string;
  po_item_no?: number;
  material?: string;
  material_codes?: string;
  from_location?: string;
  to_location?: string;
  sap_delivery_no?: string;
  deliveries_summary?: string;
  assigned_qty?: number;
  driver_name?: string;
  vehicle_reg?: string;
  supervisor_stamped_count?: number;
  mine_tare_kg?: number;
  mine_gross_kg?: number;
  dest_gross_kg?: number;
  dest_tare_kg?: number;
  bilty_no?: string;
  bilty_date?: string;
  bilty_url?: string;
  loading_status?: string;
  requested_pickup_datetime?: string;
  queue_entry_time?: string;
  journey_authorized?: number;
  po_target_qty?: number;
  po_uom?: string;
  tolerance_pct?: number;
  rejection_reason?: string;
  vehicle_capacity?: number;
}

export interface ReviewQueueItemV3 {
  id: number;
  assignment_id: number;
  flag_reason: 'OCR_MISMATCH' | 'TOLERANCE_EXCEEDED' | 'AWAITING_CA_VERIFY' | string;
  status: 'OPEN' | 'RESOLVED';
  resolved_by_role?: string;
  resolution_notes?: string;
  blocks_miro_bool: number;
  created_at: string;
  sap_po_no?: string;
  sap_so_no?: string;
  po_item_no?: number;
  material?: string;
  driver_name?: string;
  vehicle_reg?: string;
  scheduled_date?: string;
  transporter_name?: string;
  mine_tare_kg?: number;
  mine_gross_kg?: number;
  dest_gross_kg?: number;
  dest_tare_kg?: number;
  po_target_qty?: number;
  scanned_pod_url?: string;
  pod_file_url?: string;
  ocr_waybill_extracted?: string;
  ocr_weight_extracted?: number;
  ocr_confidence_pct?: number;
  ocr_match_status?: string;
  ocr_invoice_no?: string;
  ocr_vendor_name?: string;
  ocr_po_no?: string;
  ocr_material?: string;
  ocr_total_amount?: number;
  ocr_tax_amount?: number;
  ocr_line_items_json?: string;
  ocr_provider?: string;
  ocr_processing_status?: string;
  ocr_stamped_bool?: number;
  ocr_stamp_text?: string;
}

export interface DeliveryInvoiceV3 {
  id: number;
  assignment_id: number;
  accepted_payload: number;
  rate: number;
  total_value: number;
  status: 'DRAFT' | 'SENT_TO_CA';
  sap_po_no?: string;
  po_item_no?: number;
  material?: string;
  driver_name?: string;
  scheduled_date?: string;
}

export interface MiroInvoice {
  id: number;
  main_invoice_id: number;
  sap_invoice_no?: string;
  status: 'PARKED' | 'POSTED' | 'CLEARED';
  posted_date?: string;
  sap_ref?: string;
  total_value?: number;
  paid_amount?: number;
  accepted_payload_kg?: number;
  sap_po_no?: string;
  po_item_no?: number;
  material?: string;
  transporter_name?: string;
}

export interface Transporter {
  id: number;
  name: string;
  gstin: string;
}

export interface Driver {
  id: number;
  transporter_id: number;
  name: string;
  license_no: string;
  license_expiry: string;
  prdp_expiry: string;
  phone?: string;
}

export interface Vehicle {
  id: number;
  transporter_id: number;
  reg_no: string;
  capacity: number;
}

// ─── NEW SALES ORDER & OVERHAUL TYPES ─────────────────────────
export interface SalesOrderItemV3 {
  id: number;
  so_id: number;
  sap_so_no: string;
  item_no: string;
  material: string;
  material_desc?: string;
  order_qty: number;
  uom: string;
  net_price?: number;
  plant?: string;
  storage_location?: string;
}

export interface OutboundDeliveryItemV3 {
  item_no: string;
  material: string;
  material_desc: string;
  deliv_qty: number;
  uom: string;
  plant?: string;
  storage_location?: string;
}

export interface OutboundDeliveryV3 {
  id: number;
  so_id: number;
  sap_so_no: string;
  sap_delivery_no: string;
  delivery_type: 'COMPLETE' | 'PARTIAL';
  status: string;
  delivered_qty?: number;
  ship_to_party?: string;
  ship_to_name?: string;
  ship_to_address?: string;
  document_date?: string;
  planned_gi_date?: string;
  actual_gi_date?: string;
  total_weight_kg?: number;
  net_weight_kg?: number;
  volume_cd3?: number;
  no_packages?: number;
  items_json?: string;
  items?: OutboundDeliveryItemV3[];
}

export interface SalesOrderV3 {
  id: number;
  sap_so_no: string;
  customer_id: number;
  customer_name?: string;
  customer_address?: string;
  sap_customer_no: string;
  created_date: string;
  delivery_date?: string;
  overall_status: string;
  total_net_amount?: number;
  currency?: string;
  portal_status: 'OPEN' | 'DISTRIBUTED' | 'IN_PROGRESS' | 'IN_TRANSIT' | 'POD_VERIFICATION' | 'APPROVED' | 'COMPLETED' | 'DELIVERED' | 'INVOICED' | 'PAID' | string;
  fetched_at?: string;
  item_count?: number;
  total_qty?: number;
  materials_summary?: string;
  materials_codes?: string;
  deliveries_summary?: string;
  items?: SalesOrderItemV3[];
  deliveries?: OutboundDeliveryV3[];
}

export interface TransportAssignmentSummaryV3 {
  id: number;
  driver_id: number;
  driver_name: string;
  driver_phone?: string;
  license_no?: string;
  vehicle_id: number;
  vehicle_reg: string;
  vehicle_capacity?: number;
  assigned_qty?: number;
  status: string;
  scheduled_date?: string;
}

export interface FleetAllocationInput {
  driver_id: number;
  vehicle_id: number;
  assigned_qty?: number;
  scheduled_date?: string;
}

export interface SoDistributionV3 {
  id: number;
  so_id: number;
  transporter_id: number;
  distributed_by: number;
  distributed_at: string;
  status: 'PENDING' | 'ASSIGNED' | 'COMPLETED';
  sap_so_no?: string;
  sap_customer_no?: string;
  customer_name?: string;
  delivery_date?: string;
  transporter_name?: string;
  item_count?: number;
  total_qty?: number;
  materials_summary?: string;
  deliveries_summary?: string;
  active_assignment_id?: number;
  assignment_status?: string;
  driver_name?: string;
  vehicle_reg?: string;
  assignments?: TransportAssignmentSummaryV3[];
  assigned_trips_count?: number;
  total_allocated_qty?: number;
}

export interface StagingQueueItemV3 {
  assignment_id: number;
  assignment_status: string;
  scheduled_date: string;
  so_id: number;
  sap_so_no: string;
  sap_customer_no: string;
  customer_name: string;
  driver_name: string;
  driver_phone?: string;
  license_no: string;
  vehicle_reg: string;
  vehicle_capacity: number;
  mine_tare_kg?: number;
  mine_gross_kg?: number;
  last_staging_notes?: string;
  line_items: SalesOrderItemV3[];
}

export interface PaymentEventV3 {
  id: number;
  invoice_id: number;
  payment_type: 'FULL' | 'PARTIAL';
  amount_paid: number;
  balance_before: number;
  balance_after: number;
  paid_by: number;
  paid_at: string;
  ref_no?: string;
}

export interface InvoiceEventV3 {
  id: number;
  assignment_id: number;
  invoice_no: string;
  total_value: number;
  accepted_payload: number;
  rate: number;
  status: 'DRAFT' | 'PARKED' | 'PAID_PARTIAL' | 'PAID_FULL';
  posted_at?: string;
  scheduled_date?: string;
  sap_so_no?: string;
  customer_name?: string;
  driver_name?: string;
  vehicle_reg?: string;
  total_paid?: number;
  balance?: number;
  payments?: PaymentEventV3[];
}

// ─── NEW API CLIENT MODULES ───────────────────────────────────
export const salesOrdersApi = {
  list: () => request<SalesOrderV3[]>('/sales-orders'),
  get: (id: number | string) => request<SalesOrderV3>(`/sales-orders/${id}`),
  refresh: () => request<{ success: boolean; count: number; fromCache: boolean; lastFetchedAt?: string; note?: string; message: string }>('/sales-orders/refresh', { method: 'POST' }),
  distribute: (soIds: number[], transporterId: number) =>
    request<{ success: boolean; distributed_count: number; message: string }>('/sales-orders/distribute', {
      method: 'POST',
      body: JSON.stringify({ so_ids: soIds, transporter_id: transporterId }),
    }),
  getDistributions: () => request<SoDistributionV3[]>('/so-distributions'),
  getDeliveries: () => request<OutboundDeliveryV3[]>('/outbound-deliveries'),
  assignDriver: (
    distId: number,
    driverIdOrAllocations: number | FleetAllocationInput[],
    vehicleId?: number,
    scheduledDate?: string,
    assignedQty?: number
  ) => {
    const payload = Array.isArray(driverIdOrAllocations)
      ? { allocations: driverIdOrAllocations }
      : { driver_id: driverIdOrAllocations, vehicle_id: vehicleId, scheduled_date: scheduledDate, assigned_qty: assignedQty };

    return request<{ success: boolean; assignment_id: number; assignment_ids?: number[]; message: string }>(
      `/so-distributions/${distId}/assign`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },
};

export const stagingApi = {
  getQueue: () => request<StagingQueueItemV3[]>('/staging/queue'),
  check: (assignmentId: number, result: 'MATCH' | 'MISMATCH', mismatchNotes?: string) =>
    request<{ success: boolean; status: string; result: string; waybill_no?: string; message: string }>(`/assignments/${assignmentId}/staging-check`, {
      method: 'POST',
      body: JSON.stringify({ result, mismatch_notes: mismatchNotes }),
    }),
};

export const targetInvoicesApi = {
  postInvoice: (assignmentId: number) =>
    request<{ success: boolean; invoice_no: string; total_value: number; status: string; message: string }>('/invoices/post', {
      method: 'POST',
      body: JSON.stringify({ assignment_id: assignmentId }),
    }),
  getPosted: () => request<InvoiceEventV3[]>('/invoices/posted'),
  getMyInvoices: () => request<InvoiceEventV3[]>('/invoices/my'),
  pay: (invoiceId: number, paymentType: 'FULL' | 'PARTIAL', amount?: number, refNo?: string) =>
    request<{ success: boolean; is_fully_paid: boolean; status: string; amount_paid: number; balance_remaining: number; message: string }>(`/invoices/${invoiceId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payment_type: paymentType, amount, ref_no: refNo }),
    }),
};

