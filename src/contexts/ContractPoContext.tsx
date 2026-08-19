import React, { createContext, useContext, useState, useEffect } from 'react';
import { caApi, ContractV3, PurchaseOrderV3 } from '../lib/api_v3';

interface ContractPoContextType {
  contracts: ContractV3[];
  purchaseOrders: PurchaseOrderV3[];
  selectedContractId: number | 'ALL';
  selectedPoId: number | 'ALL';
  setSelectedContractId: (id: number | 'ALL') => void;
  setSelectedPoId: (id: number | 'ALL') => void;
  loading: boolean;
  refreshData: () => Promise<void>;
  filteredPOs: PurchaseOrderV3[];
}

const ContractPoContext = createContext<ContractPoContextType | undefined>(undefined);

export const ContractPoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contracts, setContracts] = useState<ContractV3[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderV3[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<number | 'ALL'>('ALL');
  const [selectedPoId, setSelectedPoId] = useState<number | 'ALL'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    const token = localStorage.getItem('podzo_token_v3');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const c = await caApi.getContracts();
      setContracts(c || []);
      const pos = await caApi.getPurchaseOrders();
      setPurchaseOrders(pos || []);
    } catch (err) {
      console.error('Failed to load global Contracts & POs context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter POs based on selected Contract
  const filteredPOs = selectedContractId === 'ALL'
    ? purchaseOrders
    : purchaseOrders.filter(po => po.contract_id === Number(selectedContractId));

  // Reset selected PO if it's no longer in filtered list
  const handleSetSelectedContractId = (id: number | 'ALL') => {
    setSelectedContractId(id);
    setSelectedPoId('ALL');
  };

  return (
    <ContractPoContext.Provider
      value={{
        contracts,
        purchaseOrders,
        selectedContractId,
        selectedPoId,
        setSelectedContractId: handleSetSelectedContractId,
        setSelectedPoId,
        loading,
        refreshData: loadData,
        filteredPOs,
      }}
    >
      {children}
    </ContractPoContext.Provider>
  );
};

export const useContractPo = () => {
  const context = useContext(ContractPoContext);
  if (!context) {
    throw new Error('useContractPo must be used within a ContractPoProvider');
  }
  return context;
};
