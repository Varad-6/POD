import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  USERS,
  PURCHASE_ORDERS,
  OFFLOAD_RECORDS,
  OCR_RESULTS,
  ADMIN_APPROVAL_QUEUE,
  INVOICES,
  DASHBOARD_SUMMARY,
  CONTRACTS
} from '../data/mockData';
import { getSAPAdapter } from '../services';

// Types
export interface User {
  username: string;
  role: 'COMPANY_ADMIN' | 'TRANSPORTER_ADMIN' | 'DRIVER' | 'CUSTOMER' | 'SUPERVISOR' | 'TRANSPORTER' | 'IKWEZI_ADMIN';
  companyName?: string;
  displayName?: string;
  driverLicenseNo?: string;
  licenseExpiryDate?: string;
  prdpPermitNo?: string;
  isLicenseValid?: boolean;
}

export interface PurchaseOrder {
  purchaseOrderNo: string;
  contractRef: string;
  transporter: string;
  productDescription: string;
  rate: number;
  unit: string;
  targetQuantity: number;
  costCenter: string;
  fromLocation: string;
  toLocation: string;
  paymentTerms: string;
  poDate: string;
  status: 'PENDING_SIGNATURE' | 'ACCEPTED_SIGNED' | 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'DRIVER_ASSIGNED' | 'DRIVER_ARRIVED' | 'SUPERVISOR_APPROVED' | 'SUPERVISOR_REJECTED' | 'EN_ROUTE' | 'DELIVERED_STAMPED' | 'DELIVERED_FAILED' | 'POD_SUBMITTED' | 'POD_APPROVED' | 'INVOICE_SUBMITTED' | 'PAID';
  signedBy?: string;
  signedDate?: string;
  biltyNo?: string;
  biltyDate?: string;
  consignorName?: string;
  consigneeName?: string;
  declaredValue?: number;
}

export interface OffloadRecord {
  waybillNo: string;
  poRef: string;
  loadingWaySlipNo: string;
  horseRegNo: string;
  trailer1RegNo: string;
  trailer2RegNo: string;
  driverName: string;
  driverIdNo: string;
  driverLicenseNo?: string;
  licenseExpiryDate?: string;
  isLicenseValid?: boolean;
  // Bilty / Lorry Receipt Details
  biltyNo?: string;
  biltyDate?: string;
  consignorName?: string;
  consigneeName?: string;
  declaredValue?: number;
  // 4-Point Weighbridge Records
  dispatchTareWeightKg: number;
  dispatchGrossWeightKg: number;
  dispatchNetWeightKg: number;
  arrivalGrossWeightKg: number;
  arrivalTareWeightKg: number;
  arrivalNetWeightKg: number;
  // Deprecated legacy fields kept for backward compatibility
  tareWeightKg: number;
  grossWeightKg: number;
  netWeightKg: number;
  // Damaged Goods / Loss Consideration
  totalUnits?: number;
  damagedUnits?: number;
  damagedWeightKg?: number;
  damageReason?: string;
  acceptedNetWeightKg?: number;
  // Operational Weight Exceptions
  weightExceptionReason?: 'NONE' | 'MOISTURE_EVAPORATION' | 'RAIN_ABSORPTION' | 'SCALE_CALIBRATION_OFFSET' | 'UNLOAD_SPILLAGE';
  exceptionNotes?: string;
  loadingKm: number;
  offloadingKm: number;
  operatorName: string;
  site: string;
  productDescription: string;
  offloadDate: string;
  podStatus: 'PENDING_POD' | 'SUBMITTED_AWAITING_APPROVAL' | 'APPROVED' | 'APPROVED_MISMATCH_OVERRIDE' | 'REJECTED' | 'LOW_CONFIDENCE' | 'APPROVED_INVOICE_PENDING' | 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'DRIVER_ASSIGNED' | 'DRIVER_ARRIVED' | 'SUPERVISOR_APPROVED' | 'SUPERVISOR_REJECTED' | 'EN_ROUTE' | 'DELIVERED_STAMPED' | 'DELIVERED_FAILED' | 'POD_SUBMITTED' | 'POD_APPROVED' | 'INVOICE_SUBMITTED' | 'PAID';
  rejectionReason?: string;
  uploadedFileName?: string;
}

export interface DemoNotification {
  id: string;
  text: string;
  read: boolean;
  link: string;
  timestamp: string;
}

export interface Invoice {
  invoiceNo: string | null;
  waybillNo: string;
  quantity: number;
  rate: number;
  amount: number;
  status: 'AWAITING_INVOICE_SUBMISSION' | 'PARKED' | 'POSTED' | 'PAID';
  postingDate: string | null;
  paymentRef: string | null;
  fileName?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface DemoContextType {
  currentUser: User | null;
  purchaseOrders: PurchaseOrder[];
  offloadRecords: OffloadRecord[];
  invoices: Invoice[];
  toasts: ToastMessage[];
  notifications: DemoNotification[];
  login: (username: string) => boolean;
  logout: () => void;
  acceptPO: (purchaseOrderNo: string, signatureDataUrl: string) => Promise<void>;
  uploadPOD: (waybillNo: string, fileName: string) => Promise<void>;
  approvePOD: (waybillNo: string, override?: boolean) => Promise<void>;
  rejectPOD: (waybillNo: string, reason: string) => Promise<void>;
  submitInvoice: (waybillNo: string, invoiceNo: string, fileName: string) => Promise<void>;
  postInvoice: (invoiceNo: string) => Promise<void>;
  payInvoice: (invoiceNo: string, paymentRef: string) => Promise<void>;
  contracts: any[];
  assignPOToTransporter: (purchaseOrderNo: string, transporterName: string) => Promise<void>;
  assignPOToDriver: (
    purchaseOrderNo: string,
    driverName: string,
    horseRegNo: string,
    trailer1RegNo: string,
    trailer2RegNo: string,
    biltyNo?: string,
    driverLicenseNo?: string,
    licenseExpiryDate?: string
  ) => Promise<void>;
  driverConfirmArrival: (purchaseOrderNo: string) => Promise<void>;
  supervisorLogWeights: (
    waybillNo: string,
    dispatchTareWeightKg: number,
    dispatchGrossWeightKg: number,
    isApproved: boolean
  ) => Promise<void>;
  driverDepartSiding: (waybillNo: string) => Promise<void>;
  customerLogWeights: (
    waybillNo: string,
    arrivalGrossWeightKg: number,
    arrivalTareWeightKg: number,
    damagedUnits: number,
    damagedWeightKg: number,
    damageReason: string,
    weightExceptionReason: OffloadRecord['weightExceptionReason'],
    isApproved: boolean
  ) => Promise<void>;
  resetDemo: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
  markNotificationRead: (id: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or mockData
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('demo_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('demo_pos');
    return saved ? JSON.parse(saved) : PURCHASE_ORDERS as PurchaseOrder[];
  });

  const [offloadRecords, setOffloadRecords] = useState<OffloadRecord[]>(() => {
    const saved = localStorage.getItem('demo_offloads');
    return saved ? JSON.parse(saved) : OFFLOAD_RECORDS as OffloadRecord[];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('demo_invoices');
    return saved ? JSON.parse(saved) : INVOICES as Invoice[];
  });

  const [contracts, setContracts] = useState<any[]>(() => {
    const saved = localStorage.getItem('demo_contracts');
    return saved ? JSON.parse(saved) : CONTRACTS;
  });

  const [notifications, setNotifications] = useState<DemoNotification[]>(() => {
    const saved = localStorage.getItem('demo_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('demo_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('demo_pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('demo_offloads', JSON.stringify(offloadRecords));
  }, [offloadRecords]);

  useEffect(() => {
    localStorage.setItem('demo_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('demo_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('demo_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Initial Sync from SAP Adapter (Live S21 or Mock)
  useEffect(() => {
    const adapter = getSAPAdapter();
    adapter.fetchContracts().then((fetchedContracts) => {
      if (fetchedContracts && fetchedContracts.length > 0) {
        setContracts(fetchedContracts);
      }
    }).catch(err => console.warn('Contracts sync warning:', err));

    adapter.fetchPurchaseOrders().then((fetchedPOs) => {
      if (fetchedPOs && fetchedPOs.length > 0) {
        setPurchaseOrders(fetchedPOs as any);
      }
    }).catch(err => console.warn('POs sync warning:', err));
  }, []);

  // Toast Helpers
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Functions
  const login = (username: string): boolean => {
    const matched = USERS.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
    if (matched) {
      const u: User = {
        username: matched.username,
        role: matched.role as any,
        companyName: matched.companyName,
        displayName: matched.displayName
      };
      setCurrentUser(u);
      showToast(`Welcome back, ${matched.displayName || matched.companyName}`, 'success');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Logged out successfully', 'success');
  };

  // Business Action Creators (with Simulated Delays)
  const acceptPO = async (purchaseOrderNo: string, signatureDataUrl: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate processing delay
    
    // Trigger SAP Acknowledgment via SAP Adapter
    const adapter = getSAPAdapter();
    const signerName = currentUser?.role === 'TRANSPORTER' ? currentUser.companyName : 'Sipho Transport Services';
    await adapter.acknowledgePO(purchaseOrderNo, signerName || 'Transporter', 'SIG-HASH', new Date().toISOString());

    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.purchaseOrderNo === purchaseOrderNo
          ? {
              ...po,
              status: 'ACCEPTED_SIGNED',
              signedBy: signerName,
              signedDate: new Date().toISOString()
            }
          : po
      )
    );
    showToast(`PO #${purchaseOrderNo} signed and accepted (Synced to SAP)`, 'success');
  };

  const uploadPOD = async (waybillNo: string, fileName: string) => {
    // Determine target status based on file name
    let targetStatus: OffloadRecord['podStatus'] = 'SUBMITTED_AWAITING_APPROVAL';
    
    if (fileName.includes('blurry')) {
      targetStatus = 'LOW_CONFIDENCE';
    }

    setOffloadRecords((prev) =>
      prev.map((rec) =>
        rec.waybillNo === waybillNo
          ? { ...rec, podStatus: targetStatus, uploadedFileName: fileName }
          : rec
      )
    );
    
    const displayMsg = targetStatus === 'LOW_CONFIDENCE' 
      ? `POD submitted. Flagged for review due to low scan confidence.`
      : `POD submitted for Waybill ${waybillNo}`;
      
    showToast(displayMsg, targetStatus === 'LOW_CONFIDENCE' ? 'warning' : 'success');
  };

  const approvePOD = async (waybillNo: string, override = false) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    let recordToInvoice: OffloadRecord | undefined;

    setOffloadRecords((prev) => {
      return prev.map((rec) => {
        if (rec.waybillNo === waybillNo) {
          const newStatus = override ? 'APPROVED_MISMATCH_OVERRIDE' : 'APPROVED_INVOICE_PENDING';
          recordToInvoice = { ...rec, podStatus: newStatus };
          return recordToInvoice;
        }
        return rec;
      });
    });

    // Create a new invoice template dynamically from the latest state values
    setInvoices((prev) => {
      // Find the record using the latest state of offloadRecords
      const record = recordToInvoice || offloadRecords.find((r) => r.waybillNo === waybillNo);
      const associatedPO = purchaseOrders.find((po) => po.purchaseOrderNo === record?.poRef);
      const rate = associatedPO?.rate || 245.50;
      const weight = record ? (record.netWeightKg / 1000.0) : 30.00;

      const newInvoice: Invoice = {
        invoiceNo: null,
        waybillNo: waybillNo,
        quantity: weight,
        rate: rate,
        amount: parseFloat((weight * rate).toFixed(2)),
        status: 'AWAITING_INVOICE_SUBMISSION',
        postingDate: null,
        paymentRef: null
      };

      // Avoid duplicate templates
      if (prev.some((inv) => inv.waybillNo === waybillNo)) return prev;
      return [...prev, newInvoice];
    });

    // Create Transporter Notification
    const newNotif: DemoNotification = {
      id: Math.random().toString(36).substr(2, 9),
      text: `POD for Waybill ${waybillNo} approved! Click to upload your tax invoice now.`,
      read: false,
      link: '/transporter/invoices',
      timestamp: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(
      override ? `POD approved with manual override` : `POD for Waybill ${waybillNo} approved`,
      'success'
    );
  };

  const rejectPOD = async (waybillNo: string, reason: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    setOffloadRecords((prev) =>
      prev.map((rec) =>
        rec.waybillNo === waybillNo
          ? { ...rec, podStatus: 'REJECTED', rejectionReason: reason }
          : rec
      )
    );

    // Create Transporter Notification for rejection
    const newNotif: DemoNotification = {
      id: Math.random().toString(36).substr(2, 9),
      text: `POD for Waybill ${waybillNo} rejected: ${reason}. Please re-upload.`,
      read: false,
      link: '/transporter/pods',
      timestamp: new Date().toISOString()
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast(`POD for Waybill ${waybillNo} rejected and sent back`, 'error');
  };

  const submitInvoice = async (waybillNo: string, invoiceNo: string, fileName: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.waybillNo === waybillNo
          ? {
              ...inv,
              invoiceNo: invoiceNo,
              status: 'PARKED',
              fileName: fileName
            }
          : inv
      )
    );

    setOffloadRecords((prev) =>
      prev.map((rec) =>
        rec.waybillNo === waybillNo
          ? { ...rec, podStatus: 'APPROVED' } // Full approved / invoiced state
          : rec
      )
    );

    showToast(`Invoice ${invoiceNo} submitted successfully`, 'success');
  };

  const postInvoice = async (invoiceNo: string) => {
    await new Promise((resolve) => setTimeout(resolve, 700));

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.invoiceNo === invoiceNo
          ? {
              ...inv,
              status: 'POSTED',
              postingDate: new Date().toISOString()
            }
          : inv
      )
    );
    showToast(`Invoice ${invoiceNo} posted (MIRO clearing completed)`, 'success');
  };

  const payInvoice = async (invoiceNo: string, paymentRef: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.invoiceNo === invoiceNo
          ? {
              ...inv,
              status: 'PAID',
              paymentRef: paymentRef
            }
          : inv
      )
    );
    showToast(`Invoice ${invoiceNo} marked as PAID`, 'success');
  };

  const assignPOToTransporter = async (purchaseOrderNo: string, transporterName: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.purchaseOrderNo === purchaseOrderNo
          ? { ...po, status: 'PENDING_SIGNATURE', transporter: transporterName }
          : po
      )
    );
    showToast(`PO #${purchaseOrderNo} successfully assigned to ${transporterName}`, 'success');
  };

  const assignPOToDriver = async (
    purchaseOrderNo: string,
    driverName: string,
    horseRegNo: string,
    trailer1RegNo: string,
    trailer2RegNo: string,
    biltyNo?: string,
    driverLicenseNo?: string,
    licenseExpiryDate?: string
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const assignedBilty = biltyNo || `BLT-${Math.floor(100000 + Math.random() * 900000)}`;

    // Update PO status
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.purchaseOrderNo === purchaseOrderNo
          ? {
              ...po,
              status: 'DRIVER_ASSIGNED',
              biltyNo: assignedBilty,
              biltyDate: new Date().toISOString().split('T')[0]
            }
          : po
      )
    );

    // Update or create corresponding offload record
    setOffloadRecords((prev) => {
      const exists = prev.some((r) => r.poRef === purchaseOrderNo);
      if (exists) {
        return prev.map((r) =>
          r.poRef === purchaseOrderNo
            ? {
                ...r,
                driverName,
                horseRegNo,
                trailer1RegNo,
                trailer2RegNo,
                biltyNo: assignedBilty,
                biltyDate: new Date().toISOString().split('T')[0],
                driverLicenseNo: driverLicenseNo || 'DL-908234-EC',
                licenseExpiryDate: licenseExpiryDate || '2028-06-30',
                isLicenseValid: true,
                podStatus: 'DRIVER_ASSIGNED' as any
              }
            : r
        );
      } else {
        const matchingPO = purchaseOrders.find((po) => po.purchaseOrderNo === purchaseOrderNo);
        const newRecord: OffloadRecord = {
          waybillNo: `WB-9988${Math.floor(10 + Math.floor(Math.random() * 89))}`,
          poRef: purchaseOrderNo,
          loadingWaySlipNo: `EL-${Math.floor(100000 + Math.random() * 900000)}`,
          horseRegNo,
          trailer1RegNo,
          trailer2RegNo,
          driverName,
          driverIdNo: '8509125679082',
          driverLicenseNo: driverLicenseNo || 'DL-908234-EC',
          licenseExpiryDate: licenseExpiryDate || '2028-06-30',
          isLicenseValid: true,
          biltyNo: assignedBilty,
          biltyDate: new Date().toISOString().split('T')[0],
          consignorName: matchingPO?.fromLocation || 'Ikwezi Mine Siding',
          consigneeName: matchingPO?.toLocation || 'Power Utility Yard',
          declaredValue: matchingPO ? matchingPO.targetQuantity * matchingPO.rate : 150000,
          dispatchTareWeightKg: 0,
          dispatchGrossWeightKg: 0,
          dispatchNetWeightKg: 0,
          arrivalGrossWeightKg: 0,
          arrivalTareWeightKg: 0,
          arrivalNetWeightKg: 0,
          tareWeightKg: 0,
          grossWeightKg: 0,
          netWeightKg: 0,
          totalUnits: 1000,
          damagedUnits: 0,
          damagedWeightKg: 0,
          damageReason: 'None',
          acceptedNetWeightKg: 0,
          weightExceptionReason: 'NONE',
          loadingKm: 89000,
          offloadingKm: 89200,
          operatorName: 'Lucky',
          site: matchingPO?.fromLocation || 'Ilima Siding',
          productDescription: matchingPO?.productDescription || 'SL BIT 20%ASH',
          offloadDate: new Date().toISOString().split('T')[0],
          podStatus: 'DRIVER_ASSIGNED'
        };
        return [newRecord, ...prev];
      }
    });
    
    showToast(`PO #${purchaseOrderNo} assigned to driver ${driverName} (Bilty: ${assignedBilty})`, 'success');
  };

  const driverConfirmArrival = async (purchaseOrderNo: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.purchaseOrderNo === purchaseOrderNo
          ? { ...po, status: 'DRIVER_ARRIVED' }
          : po
      )
    );

    setOffloadRecords((prev) =>
      prev.map((r) =>
        r.poRef === purchaseOrderNo
          ? { ...r, podStatus: 'DRIVER_ARRIVED' as any }
          : r
      )
    );

    showToast(`Driver confirmed arrival at Siding`, 'success');
  };

  const supervisorLogWeights = async (
    waybillNo: string,
    dispatchTareWeightKg: number,
    dispatchGrossWeightKg: number,
    isApproved: boolean
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const status: any = isApproved ? 'SUPERVISOR_APPROVED' : 'SUPERVISOR_REJECTED';
    const dispatchNetWeightKg = dispatchGrossWeightKg - dispatchTareWeightKg;
    
    setOffloadRecords((prev) =>
      prev.map((r) =>
        r.waybillNo === waybillNo
          ? {
              ...r,
              dispatchTareWeightKg,
              dispatchGrossWeightKg,
              dispatchNetWeightKg,
              tareWeightKg: dispatchTareWeightKg,
              grossWeightKg: dispatchGrossWeightKg,
              netWeightKg: dispatchNetWeightKg,
              podStatus: status
            }
          : r
      )
    );

    showToast(isApproved ? `Pre-dispatch weights approved for Waybill ${waybillNo} (${(dispatchNetWeightKg / 1000).toFixed(2)} Tons)` : `Pre-dispatch weights rejected`, isApproved ? 'success' : 'error');
  };

  const driverDepartSiding = async (waybillNo: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setOffloadRecords((prev) =>
      prev.map((r) =>
        r.waybillNo === waybillNo
          ? { ...r, podStatus: 'EN_ROUTE' as any }
          : r
      )
    );

    showToast(`Truck is now en route to Customer`, 'success');
  };

  const customerLogWeights = async (
    waybillNo: string,
    arrivalGrossWeightKg: number,
    arrivalTareWeightKg: number,
    damagedUnits: number = 0,
    damagedWeightKg: number = 0,
    damageReason: string = 'None',
    weightExceptionReason: OffloadRecord['weightExceptionReason'] = 'NONE',
    isApproved: boolean = true
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const status: any = isApproved ? 'DELIVERED_STAMPED' : 'DELIVERED_FAILED';
    const arrivalNetWeightKg = arrivalGrossWeightKg - arrivalTareWeightKg;
    const acceptedNetWeightKg = Math.max(0, arrivalNetWeightKg - damagedWeightKg);
    
    setOffloadRecords((prev) =>
      prev.map((r) =>
        r.waybillNo === waybillNo
          ? {
              ...r,
              arrivalGrossWeightKg,
              arrivalTareWeightKg,
              arrivalNetWeightKg,
              damagedUnits,
              damagedWeightKg,
              damageReason,
              acceptedNetWeightKg,
              weightExceptionReason,
              podStatus: status
            }
          : r
      )
    );

    showToast(
      isApproved 
        ? `Delivery verified! Arrival Net: ${(arrivalNetWeightKg / 1000).toFixed(2)}T, Accepted Net: ${(acceptedNetWeightKg / 1000).toFixed(2)}T` 
        : `Delivery verification failed`, 
      isApproved ? 'success' : 'error'
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const resetDemo = () => {
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_pos');
    localStorage.removeItem('demo_offloads');
    localStorage.removeItem('demo_invoices');
    localStorage.removeItem('demo_contracts');
    localStorage.removeItem('demo_notifications');
    
    setCurrentUser(null);
    setPurchaseOrders(PURCHASE_ORDERS as PurchaseOrder[]);
    setOffloadRecords(OFFLOAD_RECORDS as OffloadRecord[]);
    setInvoices(INVOICES as Invoice[]);
    setContracts(CONTRACTS);
    setNotifications([]);
    
    setToasts([]);
    showToast('Demo state successfully reset to original defaults', 'success');
  };

  return (
    <DemoContext.Provider
      value={{
        currentUser,
        purchaseOrders,
        offloadRecords,
        invoices,
        toasts,
        notifications,
        login,
        logout,
        acceptPO,
        uploadPOD,
        approvePOD,
        rejectPOD,
        submitInvoice,
        postInvoice,
        payInvoice,
        contracts,
        assignPOToTransporter,
        assignPOToDriver,
        driverConfirmArrival,
        supervisorLogWeights,
        driverDepartSiding,
        customerLogWeights,
        resetDemo,
        showToast,
        removeToast,
        markNotificationRead
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
};
