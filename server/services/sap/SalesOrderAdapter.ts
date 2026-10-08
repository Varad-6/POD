/**
 * Sales Order Adapter
 * Implements fetching from SAP S/4HANA (API_SALES_ORDER_SRV)
 * with robust local cache fallback and mock fallback for testing POC scenarios.
 */
import { SAPClient } from './SAPClient.js';
import { SAPCache } from './SAPCache.js';

export interface RawSalesOrderItem {
  SalesOrderItem: string;
  Material: string;
  SalesOrderItemText?: string;
  RequestedQuantity: string | number;
  RequestedQuantityUnit: string;
  NetAmount?: string | number;
  Plant?: string;
  StorageLocation?: string;
}

export interface RawSalesOrder {
  SalesOrder: string;
  SoldToParty: string;
  SoldToPartyName?: string;
  CreationDate?: string;
  RequestedDeliveryDate?: string;
  OverallSDProcessStatus?: string;
  to_Item?: {
    results?: RawSalesOrderItem[];
  } | RawSalesOrderItem[];
}

export interface TransformedSalesOrderItem {
  item_no: string;
  material: string;
  material_desc: string;
  order_qty: number;
  uom: string;
  net_price: number;
  plant: string;
  storage_location: string;
}

export interface TransformedSalesOrder {
  sap_so_no: string;
  customer_no: string;
  customer_name: string;
  created_date: string;
  delivery_date: string;
  overall_status: string;
  items: TransformedSalesOrderItem[];
  raw_json: string;
}

// Real SAP POC Data matching Screenshots and POC_Test case.docx
// 1: single line item (SO 2318) - complete delivery 80001469
// 2: multiple material : Partial delivery (SO 2321) - 80001471, 80001472 (DP WORLD PVT LTD)
// 3: Multiple Line item : Partial delivery (SO 2320) - 80001470, 80001473 (Company Atharv Pharma abc)
// 4: Multiple line item with complete delivery (SO 2322) - 80001474 (Company Atharv Pharma abc)
export const POC_FALLBACK_SALES_ORDERS: TransformedSalesOrder[] = [
  {
    sap_so_no: '2318',
    customer_no: '131',
    customer_name: 'Industrial Mining Services',
    created_date: '2026-10-07',
    delivery_date: '2026-10-09',
    overall_status: 'A',
    items: [
      {
        item_no: '10',
        material: '33',
        material_desc: 'Brake Pad',
        order_qty: 1.0,
        uom: 'EA',
        net_price: 99.99,
        plant: '1001',
        storage_location: 'SL01',
      },
    ],
    raw_json: JSON.stringify({ note: 'Single line item complete delivery 80001469' }),
  },
  {
    sap_so_no: '2321',
    customer_no: '122',
    customer_name: 'DP WORLD PVT LTD',
    created_date: '2026-10-07',
    delivery_date: '2026-10-07',
    overall_status: 'A',
    items: [
      {
        item_no: '100',
        material: '99',
        material_desc: 'chair 01',
        order_qty: 10.0,
        uom: 'PC',
        net_price: 12000.00,
        plant: 'RBP1',
        storage_location: 'SL01',
      },
      {
        item_no: '200',
        material: '33',
        material_desc: 'Drilling machine spare part',
        order_qty: 10.0,
        uom: 'EA',
        net_price: 202000.00,
        plant: 'RBP1',
        storage_location: 'SL01',
      },
      {
        item_no: '300',
        material: '41',
        material_desc: 'Battery1',
        order_qty: 10.0,
        uom: 'EA',
        net_price: 54013.20,
        plant: 'RBP1',
        storage_location: 'SL01',
      },
    ],
    raw_json: JSON.stringify({ note: 'Multiple material partial delivery 80001471, 80001472' }),
  },
  {
    sap_so_no: '2320',
    customer_no: '90000501',
    customer_name: 'Company Atharv Pharma abc',
    created_date: '2026-10-07',
    delivery_date: '2026-10-08',
    overall_status: 'A',
    items: [
      {
        item_no: '10',
        material: '1702',
        material_desc: 'pharma product 01',
        order_qty: 10.0,
        uom: 'EA',
        net_price: 1000.00,
        plant: 'DSA1',
        storage_location: 'SL01',
      },
      {
        item_no: '20',
        material: '1727',
        material_desc: 'pharma product 10',
        order_qty: 10.0,
        uom: 'EA',
        net_price: 10000.00,
        plant: 'DSA1',
        storage_location: 'DSA1',
      },
      {
        item_no: '30',
        material: '1728',
        material_desc: 'pharma product 09',
        order_qty: 10.0,
        uom: 'EA',
        net_price: 50000.00,
        plant: 'DSA1',
        storage_location: 'SL01',
      },
    ],
    raw_json: JSON.stringify({ note: 'Multiple line item partial delivery 80001470, 80001473' }),
  },
  {
    sap_so_no: '2322',
    customer_no: '90000501',
    customer_name: 'Company Atharv Pharma abc',
    created_date: '2026-10-07',
    delivery_date: '2026-10-07',
    overall_status: 'A',
    items: [
      {
        item_no: '10',
        material: '1702',
        material_desc: 'pharma product 01',
        order_qty: 5.0,
        uom: 'EA',
        net_price: 500.00,
        plant: 'DSA1',
        storage_location: 'SL01',
      },
      {
        item_no: '20',
        material: '1727',
        material_desc: 'pharma product 10',
        order_qty: 5.0,
        uom: 'EA',
        net_price: 500.00,
        plant: 'DSA1',
        storage_location: 'DSA1',
      },
      {
        item_no: '30',
        material: '1728',
        material_desc: 'pharma product 09',
        order_qty: 5.0,
        uom: 'EA',
        net_price: 25000.00,
        plant: 'DSA1',
        storage_location: 'SL01',
      },
    ],
    raw_json: JSON.stringify({ note: 'Multiple line item complete delivery 80001474' }),
  },
];

export class SalesOrderAdapter {
  private client: SAPClient;
  private cache: SAPCache<TransformedSalesOrder[]>;

  constructor() {
    this.client = new SAPClient();
    this.cache = new SAPCache<TransformedSalesOrder[]>(15); // 15 min TTL
  }

  /**
   * Fetches open Sales Orders with their line items.
   * On failure or timeout, gracefully falls back to cache or POC fallback data.
   */
  async fetchOpenSalesOrders(): Promise<{ orders: TransformedSalesOrder[]; fromCache: boolean; lastFetchedAt?: string; note?: string }> {
    // Check in-memory cache first if still fresh
    const cached = this.cache.get('open_sales_orders');
    if (cached.data && !cached.isStale) {
      return { orders: cached.data, fromCache: true, lastFetchedAt: cached.lastFetchedAt };
    }

    if (!this.client.isConfigured()) {
      // Return POC test data if SAP connection credentials are not yet configured in env
      this.cache.set('open_sales_orders', POC_FALLBACK_SALES_ORDERS);
      return {
        orders: POC_FALLBACK_SALES_ORDERS,
        fromCache: false,
        note: 'Showing POC demonstration test data (SO #2318, 2320, 2321, 2322). Configure SAP_HOST to connect to live S/4HANA.',
      };
    }

    try {
      // Fetch the specific POC sales orders from real SAP S/4HANA
      const results = await this.client.get<RawSalesOrder[]>('/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder', {
        '$filter': "SalesOrder eq '2318' or SalesOrder eq '2320' or SalesOrder eq '2321' or SalesOrder eq '2322' or OverallSDProcessStatus eq 'A' or OverallSDProcessStatus eq 'B'",
        '$expand': 'to_Item',
        '$top': '100',
      });

      const orders: TransformedSalesOrder[] = (results || []).map(so => {
        const rawItems = Array.isArray(so.to_Item)
          ? so.to_Item
          : (so.to_Item?.results || []);

        const items: TransformedSalesOrderItem[] = rawItems.map(item => ({
          item_no: String(item.SalesOrderItem || '10'),
          material: item.Material ? `${item.Material} (${item.SalesOrderItemText || 'General Cargo'})` : (item.SalesOrderItemText || 'General Cargo'),
          material_desc: item.SalesOrderItemText || item.Material || '',
          order_qty: Number(item.RequestedQuantity || 0),
          uom: item.RequestedQuantityUnit || 'EA',
          net_price: Number(item.NetAmount || 0),
          plant: item.Plant || '1001',
          storage_location: item.StorageLocation || 'SL01',
        }));

        return {
          sap_so_no: String(so.SalesOrder),
          customer_no: String(so.SoldToParty || 'SAP-CUST-1001'),
          customer_name: so.SoldToPartyName || `Customer #${so.SoldToParty}`,
          created_date: so.CreationDate || new Date().toISOString().slice(0, 10),
          delivery_date: so.RequestedDeliveryDate || new Date().toISOString().slice(0, 10),
          overall_status: so.OverallSDProcessStatus || 'A',
          items,
          raw_json: JSON.stringify(so),
        };
      });

      this.cache.set('open_sales_orders', orders);
      return { orders, fromCache: false, lastFetchedAt: new Date().toISOString() };
    } catch (err: any) {
      console.warn('[SalesOrderAdapter] Live SAP fetch failed:', err.message);
      // If we have stale cache, serve it
      if (cached.data) {
        return {
          orders: cached.data,
          fromCache: true,
          lastFetchedAt: cached.lastFetchedAt,
          note: `SAP unreachable (${err.message}). Serving cached data.`,
        };
      }

      // Otherwise fall back to POC test data
      this.cache.set('open_sales_orders', POC_FALLBACK_SALES_ORDERS);
      return {
        orders: POC_FALLBACK_SALES_ORDERS,
        fromCache: false,
        note: `SAP unreachable (${err.message}). Serving POC test cases.`,
      };
    }
  }
}

export const salesOrderAdapter = new SalesOrderAdapter();
