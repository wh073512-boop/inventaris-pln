import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  ITAsset, 
  ConsumableStock, 
  Employee, 
  CustodyRecord, 
  StockTransaction, 
  StockOpnameSession, 
  StockOpnameItem,
  ServiceRecord,
  AssetCondition
} from '../types/inventory';
import { 
  INITIAL_CONSUMABLES, 
  INITIAL_IT_ASSETS, 
  INITIAL_EMPLOYEES, 
  INITIAL_CUSTODY_RECORDS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_OPNAME_SESSIONS,
  INITIAL_SERVICE_RECORDS
} from '../data/initialData';
import { apiBase, AuthUser, useAuth } from './AuthContext';

const STORAGE_KEY_PREFIX = 'pln_sengkang_data_v1_';

interface InventoryContextType {
  user: AuthUser;
  canEditInventory: boolean;
  canOperateIT: boolean;
  canViewAudit: boolean;
  isDatabaseReady: boolean;
  databaseError: string | null;
  retryDatabaseLoad: () => void;
  itAssets: ITAsset[];
  consumables: ConsumableStock[];
  employees: Employee[];
  custodyRecords: CustodyRecord[];
  transactions: StockTransaction[];
  opnameSessions: StockOpnameSession[];
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // IT Asset Operations
  addITAsset: (asset: Omit<ITAsset, 'id'>) => string;
  bulkAddITAssets: (assets: Omit<ITAsset, 'id'>[]) => void;
  replaceAllITAssets: (newAssets: ITAsset[]) => void;
  clearAllITAssets: () => void;
  updateITAsset: (asset: ITAsset) => void;
  deleteITAsset: (id: string) => void;
  assignITAsset: (
    assetId: string, 
    employeeId: string, 
    handoverBy: string, 
    notes: string, 
    conditionNotes: string,
    signatureDataUrl?: string,
    employeeSignatureDataUrl?: string
  ) => CustodyRecord;
  returnITAsset: (
    assetId: string, 
    receivedBy: string, 
    notes: string, 
    conditionNotes: string
  ) => void;
  reportAssetDamage: (
    assetId: string,
    condition: AssetCondition,
    damageNotes: string,
    serviceVendor: string,
    ticketNo: string,
    estimatedCompletionDate: string,
    isRentalClaim: boolean,
    pullToServiceLab: boolean,
    technicianName?: string
  ) => void;
  resolveAssetService: (
    assetId: string,
    resolutionNotes: string,
    newLocation?: string
  ) => void;
  updateAssetCondition: (
    assetId: string,
    condition: AssetCondition,
    damageNotes?: string
  ) => void;
  serviceRecords: ServiceRecord[];

  // Consumables (ATK) Operations
  addConsumable: (item: Omit<ConsumableStock, 'id'>) => string;
  updateConsumable: (item: ConsumableStock) => void;
  deleteConsumable: (id: string) => void;
  issueConsumableStock: (
    consumableId: string,
    quantity: number,
    employeeId: string | null,
    requesterName: string,
    department: string,
    referenceNo: string,
    notes?: string
  ) => { success: boolean; error?: string };
  restockConsumable: (
    consumableId: string,
    quantity: number,
    referenceNo: string,
    notes?: string
  ) => void;

  // Employee Operations
  addEmployee: (employee: Omit<Employee, 'id'>) => string;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;

  // Stock Opname Operations
  createOpnameSession: (
    sessionTitle: string, 
    scope: 'SEMUA' | 'HANYA_ATK' | 'HANYA_IT', 
    auditorName: string, 
    notes?: string
  ) => string;
  updateOpnameCount: (
    sessionId: string, 
    itemId: string, 
    physicalCount: number, 
    notes?: string
  ) => void;
  reconcileOpnameItem: (sessionId: string, itemId: string) => void;
  completeOpnameSession: (sessionId: string) => void;
  deleteOpnameSession: (sessionId: string) => void;

  // Data Management
  resetToSampleData: () => void;
  exportJSON: () => void;
  importJSON: (jsonStr: string) => boolean;
  exportCSV: (dataType: 'it' | 'atk' | 'custody' | 'transactions') => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, request } = useAuth();
  if (!user) {
    throw new Error('InventoryProvider membutuhkan pengguna yang sudah masuk.');
  }
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const revisionRef = useRef(0);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  // Load state from localStorage or initialize with initialData
  const [itAssets, setITAssets] = useState<ITAsset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'it_assets');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure ownershipType and rentalEndDate exist on all items
        return parsed.map((item: any) => {
          const isRental = item.ownershipType === 'SEWA' || (item.category === 'Laptop' && item.id !== 'it-001');
          return {
            ...item,
            ownershipType: isRental ? 'SEWA' : (item.ownershipType || 'BELI'),
            rentalVendor: isRental ? (item.rentalVendor || 'PT Mitra Rental Infotama') : undefined,
            rentalContractNo: isRental ? (item.rentalContractNo || 'KNT/RENT-IT/2024/04-09') : undefined,
            rentalEndDate: isRental ? (item.rentalEndDate || '2026-12-31') : undefined,
            monthlyRentalPrice: isRental ? (item.monthlyRentalPrice || 850000) : undefined
          };
        });
      }
      return INITIAL_IT_ASSETS;
    } catch {
      return INITIAL_IT_ASSETS;
    }
  });

  const [consumables, setConsumables] = useState<ConsumableStock[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'consumables');
      return saved ? JSON.parse(saved) : INITIAL_CONSUMABLES;
    } catch {
      return INITIAL_CONSUMABLES;
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.some((e: any) => e.name === 'Budi Prasetyo' || e.name === 'Siti Rahmawati')) {
          return INITIAL_EMPLOYEES;
        }
        return parsed;
      }
      return INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [custodyRecords, setCustodyRecords] = useState<CustodyRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'custody');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.some((c: any) => c.employeeName === 'Budi Prasetyo' || c.bastNumber?.includes('/IT-GA/'))) {
          return INITIAL_CUSTODY_RECORDS;
        }
        return parsed;
      }
      return INITIAL_CUSTODY_RECORDS;
    } catch {
      return INITIAL_CUSTODY_RECORDS;
    }
  });

  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [opnameSessions, setOpnameSessions] = useState<StockOpnameSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'opname');
      return saved ? JSON.parse(saved) : INITIAL_OPNAME_SESSIONS;
    } catch {
      return INITIAL_OPNAME_SESSIONS;
    }
  });

  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'service_records');
      return saved ? JSON.parse(saved) : INITIAL_SERVICE_RECORDS;
    } catch {
      return INITIAL_SERVICE_RECORDS;
    }
  });

  useEffect(() => {
    let cancelled = false;
    setIsDatabaseReady(false);
    setDatabaseError(null);

    const loadDatabaseState = async () => {
      try {
        const result = await request<{
          state: {
            itAssets: ITAsset[];
            consumables: ConsumableStock[];
            employees: Employee[];
            custodyRecords: CustodyRecord[];
            transactions: StockTransaction[];
            opnameSessions: StockOpnameSession[];
            serviceRecords: ServiceRecord[];
          } | null;
          revision: number;
        }>('state.php');
        if (cancelled) return;
        revisionRef.current = result.revision;

        if (result.state) {
          setITAssets(result.state.itAssets);
          setConsumables(result.state.consumables);
          setEmployees(result.state.employees);
          setCustodyRecords(result.state.custodyRecords);
          setTransactions(result.state.transactions);
          setOpnameSessions(result.state.opnameSessions);
          setServiceRecords(result.state.serviceRecords);
        } else {
          if (user.role !== 'SUPER_ADMIN') {
            throw new Error('Database belum berisi data. Minta Super Admin menyelesaikan inisialisasi.');
          }
          const initialState = {
            itAssets,
            consumables,
            employees,
            custodyRecords,
            transactions,
            opnameSessions,
            serviceRecords,
          };

          setITAssets(initialState.itAssets);
          setConsumables(initialState.consumables);
          setEmployees(initialState.employees);
          setCustodyRecords(initialState.custodyRecords);
          setTransactions(initialState.transactions);
          setOpnameSessions(initialState.opnameSessions);
          setServiceRecords(initialState.serviceRecords);

          const saved = await request<{ revision: number }>('state.php', {
            method: 'PUT',
            body: JSON.stringify({ revision: result.revision, state: initialState }),
          });
          if (cancelled) return;
          revisionRef.current = saved.revision;
        }
        setIsDatabaseReady(true);
      } catch (cause) {
        if (!cancelled) {
          setDatabaseError(cause instanceof Error ? cause.message : 'Gagal memuat data dari MySQL.');
        }
      }
    };

    void loadDatabaseState();
    return () => {
      cancelled = true;
    };
  }, [user.id, loadAttempt]);

  // Purge legacy storage keys from previous iterations
  useEffect(() => {
    try {
      const legacyPrefixes = ['inventra_data_v1_', 'inventra_data_v2_', 'inventra_data_v3_'];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && legacyPrefixes.some(p => key.startsWith(p))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Legacy storage cleanup error:', e);
    }
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'service_records', JSON.stringify(serviceRecords));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [serviceRecords]);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'it_assets', JSON.stringify(itAssets));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [itAssets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'consumables', JSON.stringify(consumables));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [consumables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'employees', JSON.stringify(employees));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'custody', JSON.stringify(custodyRecords));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [custodyRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'opname', JSON.stringify(opnameSessions));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [opnameSessions]);

  useEffect(() => {
    if (!isDatabaseReady || user.role === 'VIEWER') return;
    const snapshot = {
      itAssets,
      consumables,
      employees,
      custodyRecords,
      transactions,
      opnameSessions,
      serviceRecords,
    };
    const timeout = window.setTimeout(() => {
      saveChainRef.current = saveChainRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const result = await request<{ revision: number }>('state.php', {
              method: 'PUT',
              body: JSON.stringify({ revision: revisionRef.current, state: snapshot }),
            });
            revisionRef.current = result.revision;
            setDatabaseError(null);
          } catch (cause) {
            setDatabaseError(cause instanceof Error ? cause.message : 'Gagal menyimpan data ke MySQL.');
          }
        });
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [
    isDatabaseReady,
    itAssets,
    consumables,
    employees,
    custodyRecords,
    transactions,
    opnameSessions,
    serviceRecords,
    request,
    user.role,
  ]);

  // IT Asset Operations
  const addITAsset = (assetData: Omit<ITAsset, 'id'>) => {
    const id = 'it-' + Date.now().toString(36);
    const newAsset: ITAsset = { ...assetData, id };
    setITAssets(prev => [newAsset, ...prev]);
    return id;
  };

  const updateITAsset = (updated: ITAsset) => {
    setITAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const deleteITAsset = (id: string) => {
    setITAssets(prev => prev.filter(a => a.id !== id));
  };

  const bulkAddITAssets = (newAssets: Omit<ITAsset, 'id'>[]) => {
    const created: ITAsset[] = newAssets.map((assetData, index) => ({
      ...assetData,
      id: 'it-' + Date.now().toString(36) + '-' + index
    }));
    setITAssets(prev => [...created, ...prev]);
  };

  const replaceAllITAssets = (newAssets: ITAsset[]) => {
    setITAssets(newAssets);
    const validIds = new Set(newAssets.map(a => a.id));
    setCustodyRecords(prev => prev.filter(c => validIds.has(c.assetId)));
  };

  const clearAllITAssets = () => {
    setITAssets([]);
    setCustodyRecords([]);
  };

  const assignITAsset = (
    assetId: string, 
    employeeId: string, 
    handoverBy: string, 
    notes: string, 
    conditionNotes: string,
    signatureDataUrl?: string,
    employeeSignatureDataUrl?: string
  ) => {
    const asset = itAssets.find(a => a.id === assetId);
    const employee = employees.find(e => e.id === employeeId);
    if (!asset || !employee) {
      throw new Error('Aset atau Karyawan tidak ditemukan');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const bastNumber = `BAST/IT-HR/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: CustodyRecord = {
      id: 'cst-' + Date.now().toString(36),
      bastNumber,
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.assetCode,
      serialNumber: asset.serialNumber,
      ownershipType: asset.ownershipType,
      rentalVendor: asset.rentalVendor,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeNip: employee.nip,
      employeeDept: employee.department,
      actionType: 'ASSIGN',
      date: todayStr,
      handoverBy,
      notes: notes || (asset.ownershipType === 'SEWA' 
        ? `Serah terima fasilitas laptop unit sewa vendor ${asset.rentalVendor || '-'}.` 
        : 'Serah terima resmi perangkat kerja milik perusahaan.'),
      conditionNotes: conditionNotes || 'Unit dalam kondisi baik dan siap digunakan.',
      signatureDataUrl,
      employeeSignatureDataUrl
    };

    // Update asset
    setITAssets(prev => prev.map(a => a.id === assetId ? {
      ...a,
      assignedToEmployeeId: employeeId,
      assignedDate: todayStr
    } : a));

    // Append record
    setCustodyRecords(prev => [newRecord, ...prev]);
    return newRecord;
  };

  const returnITAsset = (
    assetId: string, 
    receivedBy: string, 
    notes: string, 
    conditionNotes: string
  ) => {
    const asset = itAssets.find(a => a.id === assetId);
    if (!asset || !asset.assignedToEmployeeId) return;

    const employee = employees.find(e => e.id === asset.assignedToEmployeeId);
    const todayStr = new Date().toISOString().split('T')[0];
    const bastNumber = `BAST-RTN/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`;

    const returnRecord: CustodyRecord = {
      id: 'cst-rtn-' + Date.now().toString(36),
      bastNumber,
      assetId: asset.id,
      assetName: asset.name,
      assetCode: asset.assetCode,
      serialNumber: asset.serialNumber,
      employeeId: employee ? employee.id : 'unknown',
      employeeName: employee ? employee.name : 'Mantan Pemegang',
      employeeNip: employee ? employee.nip : '-',
      employeeDept: employee ? employee.department : '-',
      actionType: 'RETURN',
      date: todayStr,
      handoverBy: receivedBy,
      notes: notes || 'Pengembalian unit kerja ke pool persediaan IT gudang.',
      conditionNotes: conditionNotes || 'Unit dicek dan diverifikasi oleh tim IT.'
    };

    setITAssets(prev => prev.map(a => a.id === assetId ? {
      ...a,
      assignedToEmployeeId: null,
      assignedDate: undefined,
      location: 'Gudang IT Server Room (Pool Siap Pakai)'
    } : a));

    setCustodyRecords(prev => [returnRecord, ...prev]);
  };

  const reportAssetDamage = (
    assetId: string,
    condition: AssetCondition,
    damageNotes: string,
    serviceVendor: string,
    ticketNo: string,
    estimatedCompletionDate: string,
    isRentalClaim: boolean,
    pullToServiceLab: boolean,
    technicianName = 'Ahmad Rifai (IT Support UP Sengkang)'
  ) => {
    const asset = itAssets.find(a => a.id === assetId);
    if (!asset) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const generatedTicket = ticketNo || `SRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveVendor = serviceVendor || (asset.ownershipType === 'SEWA' 
      ? `${asset.rentalVendor || 'Vendor Rental'} (Klaim Swap Unit Sewa)` 
      : 'Service Center Resmi');

    const newServiceRecord: ServiceRecord = {
      id: 'srv-' + Date.now().toString(36),
      assetId: asset.id,
      assetCode: asset.assetCode,
      assetName: asset.name,
      category: asset.category,
      reportedDate: todayStr,
      damageDescription: damageNotes,
      condition,
      serviceVendor: effectiveVendor,
      ticketNo: generatedTicket,
      status: condition === 'Rusak' ? 'MENUNGGU_SERVIS' : 'SEDANG_SERVIS',
      estimatedCompletionDate,
      technicianName,
      isRentalVendorClaim: isRentalClaim || asset.ownershipType === 'SEWA'
    };

    setITAssets(prev => prev.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        condition,
        damageNotes,
        serviceVendor: effectiveVendor,
        serviceTicketNo: generatedTicket,
        serviceStartDate: todayStr,
        estimatedServiceEndDate: estimatedCompletionDate,
        isRentalVendorClaim: newServiceRecord.isRentalVendorClaim,
        location: pullToServiceLab ? 'Lab IT Perbaikan & Servis Lt.1' : a.location,
        assignedToEmployeeId: pullToServiceLab ? null : a.assignedToEmployeeId
      };
    }));

    setServiceRecords(prev => [newServiceRecord, ...prev]);
  };

  const resolveAssetService = (
    assetId: string,
    resolutionNotes: string,
    newLocation?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const asset = itAssets.find(a => a.id === assetId);

    setITAssets(prev => prev.map(a => {
      if (a.id !== assetId) return a;
      return {
        ...a,
        condition: 'Baik',
        damageNotes: undefined,
        serviceVendor: undefined,
        serviceTicketNo: undefined,
        serviceStartDate: undefined,
        estimatedServiceEndDate: undefined,
        isRentalVendorClaim: undefined,
        location: newLocation || (a.category === 'Laptop' ? 'Gudang IT Server Room (Pool Siap Pakai)' : 'Ruang Operasional Kantor'),
        notes: resolutionNotes ? `${a.notes ? a.notes + ' ' : ''}[Servis Selesai: ${resolutionNotes}]` : a.notes
      };
    }));

    setServiceRecords(prev => prev.map(sr => {
      if (sr.assetId === assetId && sr.status !== 'SELESAI') {
        return {
          ...sr,
          status: 'SELESAI',
          completedDate: todayStr,
          resolutionNotes: resolutionNotes || 'Perbaikan unit selesai diverifikasi, kondisi kembali normal/baik.'
        };
      }
      return sr;
    }));
  };

  const updateAssetCondition = (
    assetId: string,
    condition: AssetCondition,
    damageNotes?: string
  ) => {
    if (condition === 'Baik') {
      resolveAssetService(assetId, damageNotes || 'Kondisi dikembalikan normal / baik.');
      return;
    }

    const asset = itAssets.find(a => a.id === assetId);
    if (!asset) return;

    const defaultNotes = damageNotes || (
      condition === 'Rusak' 
        ? `${asset.category === 'Printer & Scanner' ? 'Printer rusak kendala mekanik/roller, butuh servis resmi.' : 'Perangkat rusak kendala hardware/layar mati, butuh perbaikan teknisi.'}`
        : 'Unit mengalami kendala teknis dan masuk masa pemeliharaan rutin.'
    );

    const defaultVendor = asset.ownershipType === 'SEWA'
      ? `${asset.rentalVendor || 'Vendor Rental'} (Klaim Swap Unit Sewa)`
      : (asset.category === 'Printer & Scanner' ? 'Authorized Printer Service Center' : 'Pusat Servis Resmi');

    const defaultTicket = `SRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const estimatedCompletion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    reportAssetDamage(
      assetId,
      condition,
      defaultNotes,
      defaultVendor,
      defaultTicket,
      estimatedCompletion,
      asset.ownershipType === 'SEWA',
      true // Pull to lab if broken
    );
  };

  // Consumables (ATK) Operations
  const addConsumable = (itemData: Omit<ConsumableStock, 'id'>) => {
    const id = 'atk-' + Date.now().toString(36);
    const newItem: ConsumableStock = { ...itemData, id };
    setConsumables(prev => [newItem, ...prev]);
    return id;
  };

  const updateConsumable = (updated: ConsumableStock) => {
    setConsumables(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteConsumable = (id: string) => {
    setConsumables(prev => prev.filter(c => c.id !== id));
  };

  const issueConsumableStock = (
    consumableId: string,
    quantity: number,
    employeeId: string | null,
    requesterName: string,
    department: string,
    referenceNo: string,
    notes?: string
  ) => {
    const item = consumables.find(c => c.id === consumableId);
    if (!item) return { success: false, error: 'Barang tidak ditemukan' };
    if (quantity <= 0) return { success: false, error: 'Jumlah harus lebih dari 0' };
    if (item.currentStock < quantity) {
      return { 
        success: false, 
        error: `Stok tidak mencukupi! Tersedia hanya ${item.currentStock} ${item.unit}.` 
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newStock = item.currentStock - quantity;

    // Instantly reduce stock
    setConsumables(prev => prev.map(c => c.id === consumableId ? {
      ...c,
      currentStock: newStock
    } : c));

    // Record transaction
    const newTrx: StockTransaction = {
      id: 'trx-' + Date.now().toString(36),
      consumableId: item.id,
      consumableName: item.name,
      type: 'OUT',
      quantity,
      recipientEmployeeId: employeeId || undefined,
      requesterName,
      department,
      date: todayStr,
      referenceNo: referenceNo || `REQ-ATK-${Date.now().toString().slice(-4)}`,
      notes: notes || 'Pengambilan barang ATK operasional'
    };
    setTransactions(prev => [newTrx, ...prev]);

    return { success: true };
  };

  const restockConsumable = (
    consumableId: string,
    quantity: number,
    referenceNo: string,
    notes?: string
  ) => {
    const item = consumables.find(c => c.id === consumableId);
    if (!item || quantity <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const newStock = item.currentStock + quantity;

    setConsumables(prev => prev.map(c => c.id === consumableId ? {
      ...c,
      currentStock: newStock,
      lastRestockedDate: todayStr
    } : c));

    const newTrx: StockTransaction = {
      id: 'trx-' + Date.now().toString(36),
      consumableId: item.id,
      consumableName: item.name,
      type: 'IN',
      quantity,
      requesterName: 'Penerimaan Gudang / Supplier',
      department: 'SDM & GA (Umum)',
      date: todayStr,
      referenceNo: referenceNo || `PO-IN-${Date.now().toString().slice(-4)}`,
      notes: notes || 'Penerimaan pasokan restock barang gudang'
    };
    setTransactions(prev => [newTrx, ...prev]);
  };

  // Employee Operations
  const addEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const id = 'emp-' + Date.now().toString(36);
    const newEmp: Employee = { ...employeeData, id };
    setEmployees(prev => [...prev, newEmp]);
    return id;
  };

  const updateEmployee = (updated: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // Stock Opname Operations
  const createOpnameSession = (
    sessionTitle: string, 
    scope: 'SEMUA' | 'HANYA_ATK' | 'HANYA_IT', 
    auditorName: string, 
    notes?: string
  ) => {
    const sessionId = 'opn-' + Date.now().toString(36);
    const items: StockOpnameItem[] = [];

    // Add ATK items
    if (scope === 'SEMUA' || scope === 'HANYA_ATK') {
      consumables.forEach(c => {
        items.push({
          id: 'opn-item-' + Math.random().toString(36).substring(2, 9),
          itemType: 'ATK',
          targetId: c.id,
          code: c.itemCode,
          name: c.name,
          category: c.category,
          unit: c.unit,
          systemStock: c.currentStock,
          physicalStock: c.currentStock, // Default match, auditor modifies
          difference: 0,
          status: 'MATCH',
          reconciled: false,
          notes: ''
        });
      });
    }

    // Add IT assets (Count available in pool/gudang)
    if (scope === 'SEMUA' || scope === 'HANYA_IT') {
      itAssets.forEach(a => {
        items.push({
          id: 'opn-item-' + Math.random().toString(36).substring(2, 9),
          itemType: 'IT',
          targetId: a.id,
          code: a.assetCode,
          name: `${a.name} (${a.serialNumber})`,
          category: a.category,
          unit: 'Unit',
          systemStock: 1,
          physicalStock: 1,
          difference: 0,
          status: 'MATCH',
          reconciled: false,
          notes: a.assignedToEmployeeId ? 'Status: Dipegang Karyawan' : 'Status: Tersedia di Gudang IT'
        });
      });
    }

    const newSession: StockOpnameSession = {
      id: sessionId,
      sessionTitle,
      date: new Date().toISOString().split('T')[0],
      categoryScope: scope,
      auditorName,
      status: 'IN_PROGRESS',
      items,
      notes: notes || ''
    };

    setOpnameSessions(prev => [newSession, ...prev]);
    return sessionId;
  };

  const updateOpnameCount = (
    sessionId: string, 
    itemId: string, 
    physicalCount: number, 
    notes?: string
  ) => {
    setOpnameSessions(prev => prev.map(session => {
      if (session.id !== sessionId) return session;

      const updatedItems = session.items.map(item => {
        if (item.id !== itemId) return item;

        const difference = physicalCount - item.systemStock;
        let status: 'MATCH' | 'SURPLUS' | 'DEFICIT' = 'MATCH';
        if (difference > 0) status = 'SURPLUS';
        if (difference < 0) status = 'DEFICIT';

        return {
          ...item,
          physicalStock: physicalCount,
          difference,
          status,
          reconciled: difference === 0,
          notes: notes !== undefined ? notes : item.notes
        };
      });

      return {
        ...session,
        items: updatedItems
      };
    }));
  };

  const reconcileOpnameItem = (sessionId: string, itemId: string) => {
    const session = opnameSessions.find(s => s.id === sessionId);
    if (!session) return;
    const item = session.items.find(i => i.id === itemId);
    if (!item) return;

    // Apply reconciliation to live stock if it's an ATK
    if (item.itemType === 'ATK') {
      const consumable = consumables.find(c => c.id === item.targetId);
      if (consumable) {
        setConsumables(prev => prev.map(c => c.id === item.targetId ? {
          ...c,
          currentStock: item.physicalStock
        } : c));

        // Add adjustment transaction
        const adjTrx: StockTransaction = {
          id: 'trx-adj-' + Date.now().toString(36),
          consumableId: consumable.id,
          consumableName: consumable.name,
          type: item.difference > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(item.difference),
          requesterName: `Audit Rekonsiliasi (${session.auditorName})`,
          department: 'SDM & GA (Umum)',
          date: new Date().toISOString().split('T')[0],
          referenceNo: `RECON-${session.id.slice(-6).toUpperCase()}`,
          notes: `Penyesuaian stok fisik hasil audit opname (${item.notes || 'Selisih fisik'})`
        };
        setTransactions(prev => [adjTrx, ...prev]);
      }
    }

    // Mark as reconciled in session
    setOpnameSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        items: s.items.map(i => i.id === itemId ? { ...i, reconciled: true } : i)
      };
    }));
  };

  const completeOpnameSession = (sessionId: string) => {
    setOpnameSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        status: 'COMPLETED',
        completedAt: new Date().toISOString().split('T')[0]
      };
    }));
  };

  const deleteOpnameSession = (sessionId: string) => {
    setOpnameSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // Data management
  const resetToSampleData = () => {
    setITAssets(INITIAL_IT_ASSETS);
    setConsumables(INITIAL_CONSUMABLES);
    setEmployees(INITIAL_EMPLOYEES);
    setCustodyRecords(INITIAL_CUSTODY_RECORDS);
    setTransactions(INITIAL_TRANSACTIONS);
    setOpnameSessions(INITIAL_OPNAME_SESSIONS);
    setServiceRecords(INITIAL_SERVICE_RECORDS);
  };

  const exportJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      itAssets,
      consumables,
      employees,
      custodyRecords,
      transactions,
      opnameSessions,
      serviceRecords
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventra_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.itAssets) setITAssets(parsed.itAssets);
      if (parsed.consumables) setConsumables(parsed.consumables);
      if (parsed.employees) setEmployees(parsed.employees);
      if (parsed.custodyRecords) setCustodyRecords(parsed.custodyRecords);
      if (parsed.transactions) setTransactions(parsed.transactions);
      if (parsed.opnameSessions) setOpnameSessions(parsed.opnameSessions);
      if (parsed.serviceRecords) setServiceRecords(parsed.serviceRecords);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  };

  const exportCSV = (dataType: 'it' | 'atk' | 'custody' | 'transactions') => {
    window.location.assign(`${apiBase}state.php?export=${encodeURIComponent(dataType)}`);
    return;

    /* istanbul ignore next */
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const filename = `inventra_${dataType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (dataType === 'it') {
      headers = ['Kode Aset', 'Nama Perangkat', 'Kategori', 'Status Kepemilikan', 'Vendor Sewa / Kontrak', 'Merk', 'Model', 'Serial Number', 'Kondisi', 'Pemegang (Karyawan)', 'Lokasi', 'Biaya Sewa / Harga Beli', 'Jatuh Tempo Sewa / Garansi'];
      rows = itAssets.map(a => {
        const emp = employees.find(e => e.id === a.assignedToEmployeeId);
        const costStr = a.ownershipType === 'SEWA' 
          ? `Sewa: ${a.monthlyRentalPrice || 0}/bln` 
          : `Beli: ${a.purchasePrice || 0}`;
        const expiryStr = a.ownershipType === 'SEWA' ? (a.rentalEndDate || '-') : (a.warrantyUntil || '-');
        const vendorStr = a.ownershipType === 'SEWA' ? `${a.rentalVendor || '-'} (${a.rentalContractNo || '-'})` : 'Aset Milik Perusahaan';

        return [
          a.assetCode,
          `"${a.name.replace(/"/g, '""')}"`,
          a.category,
          a.ownershipType === 'SEWA' ? 'Sewa (Rental)' : 'Beli (Milik Perusahaan)',
          `"${vendorStr.replace(/"/g, '""')}"`,
          a.brand,
          a.model,
          a.serialNumber,
          a.condition,
          emp ? `"${emp.name} (${emp.nip})"` : 'Gudang IT (Tersedia)',
          `"${a.location}"`,
          `"${costStr}"`,
          expiryStr
        ];
      });
    } else if (dataType === 'atk') {
      headers = ['Kode Barang', 'Nama ATK', 'Kategori', 'Stok Saat Ini', 'Batas Min', 'Satuan', 'Estimasi Harga', 'Lokasi', 'Terakhir Restock'];
      rows = consumables.map(c => [
        c.itemCode,
        `"${c.name.replace(/"/g, '""')}"`,
        c.category,
        c.currentStock,
        c.minStockAlert,
        c.unit,
        c.unitPrice,
        `"${c.location}"`,
        c.lastRestockedDate
      ]);
    } else if (dataType === 'custody') {
      headers = ['Nomor BAST', 'Aksi', 'Tanggal', 'Nama Aset', 'Kode Aset', 'Serial Number', 'Nama Karyawan', 'NIP', 'Departemen', 'Diserahkan Oleh', 'Catatan'];
      rows = custodyRecords.map(r => [
        r.bastNumber,
        r.actionType === 'ASSIGN' ? 'Penyerahan' : 'Pengembalian',
        r.date,
        `"${r.assetName.replace(/"/g, '""')}"`,
        r.assetCode,
        r.serialNumber,
        `"${r.employeeName}"`,
        r.employeeNip,
        `"${r.employeeDept}"`,
        `"${r.handoverBy}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ]);
    } else if (dataType === 'transactions') {
      headers = ['ID Mutasi', 'Tipe', 'Tanggal', 'Nama Barang', 'Jumlah', 'No Bon/PO', 'Pemohon / Pihak', 'Departemen', 'Catatan'];
      rows = transactions.map(t => [
        t.id,
        t.type === 'IN' ? 'Barang Masuk (Restock)' : 'Barang Keluar (Dipakai)',
        t.date,
        `"${t.consumableName.replace(/"/g, '""')}"`,
        t.quantity,
        t.referenceNo,
        `"${t.requesterName}"`,
        `"${t.department}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <InventoryContext.Provider value={{
      user,
      canEditInventory: user.role === 'SUPER_ADMIN',
      canOperateIT: user.role === 'SUPER_ADMIN' || user.role === 'IT_SUPPORT',
      canViewAudit: user.role !== 'VIEWER',
      isDatabaseReady,
      databaseError,
      retryDatabaseLoad: () => setLoadAttempt(value => value + 1),
      itAssets,
      consumables,
      employees,
      custodyRecords,
      transactions,
      opnameSessions,
      serviceRecords,
      activeTab,
      setActiveTab,
      addITAsset,
      bulkAddITAssets,
      replaceAllITAssets,
      clearAllITAssets,
      updateITAsset,
      deleteITAsset,
      assignITAsset,
      returnITAsset,
      reportAssetDamage,
      resolveAssetService,
      updateAssetCondition,
      addConsumable,
      updateConsumable,
      deleteConsumable,
      issueConsumableStock,
      restockConsumable,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      createOpnameSession,
      updateOpnameCount,
      reconcileOpnameItem,
      completeOpnameSession,
      deleteOpnameSession,
      resetToSampleData,
      exportJSON,
      importJSON,
      exportCSV
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
