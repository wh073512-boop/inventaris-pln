/**
 * Tipe data domain Sistem Manajemen Aset & Inventaris Terpadu (Inventra)
 */

export type ITAssetCategory = 
  | 'Laptop' 
  | 'Desktop PC' 
  | 'Access Point' 
  | 'Switch' 
  | 'Monitor' 
  | 'Perangkat Jaringan' 
  | 'Printer & Scanner' 
  | 'Aksesori & Periferal' 
  | 'Server & Storage';

export type AssetCondition = 'Baik' | 'Perlu Perbaikan' | 'Rusak' | 'Dalam Pemeliharaan';
export type OwnershipType = 'SEWA' | 'BELI';

export interface ITAsset {
  id: string;
  assetCode: string;          // misal: AST-IT-2024-001
  name: string;               // misal: MacBook Pro M2 14"
  category: ITAssetCategory;
  brand: string;              // misal: Apple, Lenovo, Dell, Asus, Cisco
  model: string;              // misal: ThinkPad T14 Gen 3
  serialNumber: string;       // SN fisik
  macOrIp?: string;           // MAC Address / IP statis jika ada
  ipAddress?: string;         // IP Statis terdaftar (misal: 192.168.1.101)
  macAddress?: string;        // MAC Address fisik (misal: 74:86:7A:B1:00:21)
  switchPort?: string;        // Port Switch terhubung (misal: Gi1/0/05)
  vlan?: string;              // VLAN ID / Nama (misal: VLAN 10 - CCR/SCADA)
  ssid?: string;              // SSID Wi-Fi jika Access Point (misal: PLN-NP-SENGKANG)
  networkStatus?: 'ONLINE' | 'OFFLINE' | 'STANDBY'; // Status konektivitas
  specs: string;              // misal: RAM 16GB, SSD 512GB, Core i7
  assignedToEmployeeId: string | null; // null jika di gudang/pool IT
  assignedDate?: string;
  condition: AssetCondition;
  ownershipType: OwnershipType; // 'SEWA' (Rental) atau 'BELI' (Milik Sendiri)
  // Data Pembelian (jika BELI)
  purchaseDate?: string;
  purchasePrice?: number;      // Dalam IDR
  warrantyUntil?: string;
  // Data Sewa/Rental (jika SEWA)
  rentalVendor?: string;       // Vendor rental (misal: PT Mitra Rentika IT)
  rentalContractNo?: string;   // Nomor kontrak sewa
  rentalStartDate?: string;    // Tanggal mulai sewa
  rentalEndDate?: string;      // Tanggal jatuh tempo sewa
  monthlyRentalPrice?: number; // Biaya sewa bulanan (IDR)
  location: string;           // misal: Rak IT Server Lt.2 / Meja Karyawan
  notes?: string;
  // Informasi Perbaikan / Service
  damageNotes?: string;              // Gejala kerusakan (misal: roller printer macet / layar laptop bergaris)
  serviceVendor?: string;            // Tempat servis / vendor yang menangani (misal: Brother Service Center)
  serviceTicketNo?: string;          // Nomor tiket / SPK Servis
  serviceStartDate?: string;         // Tanggal masuk perbaikan
  estimatedServiceEndDate?: string;  // Estimasi tanggal selesai perbaikan
  isRentalVendorClaim?: boolean;     // Apakah klaim garansi servis ke vendor sewa?
}

export interface ServiceRecord {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  category: ITAssetCategory;
  reportedDate: string;
  damageDescription: string;
  condition: AssetCondition;
  serviceVendor: string;
  ticketNo?: string;
  status: 'MENUNGGU_SERVIS' | 'SEDANG_SERVIS' | 'SELESAI';
  estimatedCompletionDate?: string;
  completedDate?: string;
  isRentalVendorClaim?: boolean;
  resolutionNotes?: string;
  technicianName: string;
}

export type ConsumableCategory = 
  | 'Kertas & Buku' 
  | 'Alat Tulis (Pena/Pensil)' 
  | 'Alat Pemotong & Gunting' 
  | 'Pengikat & Staples' 
  | 'Lakban & Perekat' 
  | 'Penyimpanan & Binder';

export interface ConsumableStock {
  id: string;
  itemCode: string;           // misal: ATK-SDM-001
  name: string;               // misal: Kertas HVS A4 80gr PaperOne
  category: ConsumableCategory;
  currentStock: number;
  minStockAlert: number;       // Ambang batas restock
  unit: 'Rim' | 'Pcs' | 'Box' | 'Pack' | 'Roll' | 'Lusin';
  location: string;           // misal: Lemari ATK GA Lt.1
  unitPrice: number;          // Estimasi harga satuan (IDR)
  lastRestockedDate: string;
  description?: string;
}

export interface StockTransaction {
  id: string;
  consumableId: string;
  consumableName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  recipientEmployeeId?: string;
  requesterName: string;
  department: string;
  date: string;
  referenceNo: string;        // Nomor Bon Pengambilan / PO
  notes?: string;
}

export interface Employee {
  id: string;
  nip: string;                // Nomor Induk Pegawai
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinedDate: string;
  avatarColor: string;
}

export interface CustodyRecord {
  id: string;
  bastNumber: string;         // misal: BAST/IT-HR/2026/04/001
  assetId: string;
  assetName: string;
  assetCode: string;
  serialNumber: string;
  ownershipType?: OwnershipType;
  rentalVendor?: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  employeeDept: string;
  actionType: 'ASSIGN' | 'RETURN';
  date: string;
  handoverBy: string;         // PIC IT yang menyerahkan
  notes: string;
  conditionNotes: string;
  signatureDataUrl?: string;  // Tanda tangan digital
  employeeSignatureDataUrl?: string;
}

export type OpnameStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
export type DifferenceStatus = 'MATCH' | 'SURPLUS' | 'DEFICIT';

export interface StockOpnameItem {
  id: string;
  itemType: 'IT' | 'ATK';
  targetId: string;           // ID dari ITAsset atau ConsumableStock
  code: string;
  name: string;
  category: string;
  unit: string;
  systemStock: number;
  physicalStock: number;
  difference: number;         // physicalStock - systemStock
  status: DifferenceStatus;
  reconciled: boolean;
  notes?: string;
}

export interface StockOpnameSession {
  id: string;
  sessionTitle: string;
  date: string;
  categoryScope: 'SEMUA' | 'HANYA_ATK' | 'HANYA_IT';
  auditorName: string;
  status: OpnameStatus;
  items: StockOpnameItem[];
  completedAt?: string;
  notes?: string;
}
