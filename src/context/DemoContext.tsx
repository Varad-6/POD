import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  USERS,
  PURCHASE_ORDERS,
  OFFLOAD_RECORDS,
  OCR_RESULTS,
  ADMIN_APPROVAL_QUEUE,
  INVOICES,
  DASHBOARD_SUMMARY
} from '../data/mockData';

// Types
export interface User {
  username: string;
  role: 'TRANSPORTER' | 'IKWEZI_ADMIN';
  companyName?: string;
  displayName?: string;
}

export interface PurchaseOrder {
  poNumber: string;
  transporter: string;
  material: string;
  rate: number;
  unit: string;
  estimatedQuantity: number;
  costCenter: string;
  route: string;
  paymentTerms: string;
  poDate: string;
  status: 'PENDING_SIGNATURE' | 'ACCEPTED_SIGNED';
  signedBy?: string;
  signedDate?: string;
}

export interface OffloadRecord {
  waybillNo: string;
  poRef: string;
  truckNo: string;
  driver: string;
  sapWeight: number;
  material: string;
  offloadDate: string;
  podStatus: 'PENDING_POD' | 'SUBMITTED_AWAITING_APPROVAL' | 'APPROVED' | 'APPROVED_MISMATCH_OVERRIDE' | 'REJECTED' | 'LOW_CONFIDENCE' | 'APPROVED_INVOICE_PENDING';
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
  acceptPO: (poNumber: string, signatureDataUrl: string) => Promise<void>;
  uploadPOD: (waybillNo: string, fileName: string) => Promise<void>;
  approvePOD: (waybillNo: string, override?: boolean) => Promise<void>;
  rejectPOD: (waybillNo: string, reason: string) => Promise<void>;
  submitInvoice: (waybillNo: string, invoiceNo: string, fileName: string) => Promise<void>;
  postInvoice: (invoiceNo: string) => Promise<void>;
  payInvoice: (invoiceNo: string, paymentRef: string) => Promise<void>;
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
    localStorage.setItem('demo_notifications', JSON.stringify(notifications));
  }, [notifications]);

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
        role: matched.role === 'IKWEZI_ADMIN' ? 'IKWEZI_ADMIN' : 'TRANSPORTER',
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
  const acceptPO = async (poNumber: string, signatureDataUrl: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate processing delay
    
    setPurchaseOrders((prev) =>
      prev.map((po) =>
        po.poNumber === poNumber
          ? {
              ...po,
              status: 'ACCEPTED_SIGNED',
              signedBy: currentUser?.role === 'TRANSPORTER' ? currentUser.companyName : 'Sipho Transport Services',
              signedDate: new Date().toISOString()
            }
          : po
      )
    );
    showToast(`PO #${poNumber} signed and accepted`, 'success');
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
      const associatedPO = purchaseOrders.find((po) => po.poNumber === record?.poRef);
      const rate = associatedPO?.rate || 245.50;
      const weight = record?.sapWeight || 30.00;

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
    localStorage.removeItem('demo_notifications');
    
    setCurrentUser(null);
    setPurchaseOrders(PURCHASE_ORDERS as PurchaseOrder[]);
    setOffloadRecords(OFFLOAD_RECORDS as OffloadRecord[]);
    setInvoices(INVOICES as Invoice[]);
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
