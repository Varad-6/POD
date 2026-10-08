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

// POC Fallback Data matching POC_Test case.docx
// 1: single line item (SO 2318)
// 2: multiple material : Partial delivery (SO 2321)
// 3: Multiple Line item : Partial delivery (SO 2320)
// 4: Multiple line item with complete delivery (SO 2322)
export const POC_FALLBACK_SALES_ORDERS: TransformedSalesOrder[] = [
  {
    sap_so_no: '2318',
    customer_no: 'SAP-CUST-1001',
    customer_name: 'PODZO Mining – Emoyeni Siding',
    created_date: new Date().toISOString().slice(0, 10),
    delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    overall_status: 'A', // Open
    items: [
      {
        item_no: '10',
        material: 'SL BIT 20%ASH (40006653)',
        material_desc: 'Washed Bituminous Coal Grade A',
        order_qty: 34.0,
        uom: 'TO',
        net_price: 151.50,
        plant: '1001',
        storage_location: 'SL01',
      },
    ],
    raw_json: JSON.stringify({ note: 'POC Test Case 1: Single line item complete delivery 80001469' }),
  },
  {
    sap_so_no: '2321',
    customer_no: 'SAP-CUST-1002',
    customer_name: 'PODZO Mining – Leeuwpan Yard',
    created_date: new Date().toISOString().slice(0, 10),
    delivery_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    overall_status: 'A',
    items: [
      {
        item_no: '10',
        material: 'FERT_50KG_BAG (40006654)',
        material_desc: 'Agricultural Fertilizer 50kg',
        order_qty: 15.0,
        uom: 'BAG',
        net_price: 450.00,
        plant: '1001',
        storage_location: 'SL02',
      },
      {
        item_no: '20',
        material: 'DEF_ADBLUE_20L (40006660)',
        material_desc: 'Diesel Exhaust Fluid 20L Drum',
        order_qty: 25.0,
        uom: 'BT',
        net_price: 280.00,
        plant: '1001',
        storage_location: 'SL03',
      },
    ],
    raw_json: JSON.stringify({ note: 'POC Test Case 2: Multiple material partial delivery 80001471, 80001472' }),
  },
  {
    sap_so_no: '2320',
    customer_no: 'SAP-CUST-1001',
    customer_name: 'PODZO Mining – Emoyeni Siding',
    created_date: new Date().toISOString().slice(0, 10),
    delivery_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    overall_status: 'A',
    items: [
      {
        item_no: '10',
        material: 'SPARE_PARTS_BOX (40006657)',
        material_desc: 'Heavy Equipment Maintenance Spares',
        order_qty: 20.0,
        uom: 'EA',
        net_price: 1250.00,
        plant: '1002',
        storage_location: 'SL01',
      },
      {
        item_no: '20',
        material: 'CRUSHER_JAW_PLATE (40006658)',
        material_desc: 'Manganese Crusher Jaw Replacement Plate',
        order_qty: 12.0,
        uom: 'PC',
        net_price: 3400.00,
        plant: '1002',
        storage_location: 'SL01',
      },
    ],
    raw_json: JSON.stringify({ note: 'POC Test Case 3: Multiple line item partial delivery 80001470, 80001473' }),
  },
  {
    sap_so_no: '2322',
    customer_no: 'SAP-CUST-1001',
    customer_name: 'PODZO Mining – Emoyeni Siding',
    created_date: new Date().toISOString().slice(0, 10),
    delivery_date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
    overall_status: 'A',
    items: [
      {
        item_no: '10',
        material: 'STEEL PLATE (200100)',
        material_desc: 'Structural Carbon Steel Plate 20mm',
        order_qty: 50.0,
        uom: 'EA',
        net_price: 500.00,
        plant: '1001',
        storage_location: 'SL04',
      },
      {
        item_no: '20',
        material: 'Shaft (200119)',
        material_desc: 'Transmission High-Torque Axle Shaft',
        order_qty: 25.0,
        uom: 'EA',
        net_price: 850.00,
        plant: '1001',
        storage_location: 'SL04',
      },
    ],
    raw_json: JSON.stringify({ note: 'POC Test Case 4: Multiple line item with complete delivery 80001474' }),
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
      // API_SALES_ORDER_SRV/A_SalesOrder?$filter=OverallSDProcessStatus eq 'A' or OverallSDProcessStatus eq 'B'&$expand=to_Item
      const results = await this.client.get<RawSalesOrder[]>('/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder', {
        '$filter': "OverallSDProcessStatus eq 'A' or OverallSDProcessStatus eq 'B'",
        '$expand': 'to_Item',
        '$top': '100',
      });

      const orders: TransformedSalesOrder[] = (results || []).map(so => {
        const rawItems = Array.isArray(so.to_Item)
          ? so.to_Item
          : (so.to_Item?.results || []);

        const items: TransformedSalesOrderItem[] = rawItems.map(item => ({
          item_no: String(item.SalesOrderItem || '10'),
          material: item.Material || 'Unknown Material',
          material_desc: item.SalesOrderItemText || item.Material || '',
          order_qty: Number(item.RequestedQuantity || 0),
          uom: item.RequestedQuantityUnit || 'TO',
          net_price: Number(item.NetAmount || 0),
          plant: item.Plant || '1001',
          storage_location: item.StorageLocation || '',
        }));

        return {
          sap_so_no: String(so.SalesOrder),
          customer_no: String(so.SoldToParty || 'SAP-CUST-1001'),
          customer_name: so.SoldToPartyName || `Customer ${so.SoldToParty}`,
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
