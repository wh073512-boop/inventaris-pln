import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Clipboard, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Laptop, 
  Monitor, 
  Wifi, 
  Network, 
  Plus, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { ITAsset, ITAssetCategory, OwnershipType, AssetCondition } from '../../types/inventory';

interface BulkImportAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkImportAssetModal: React.FC<BulkImportAssetModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    itAssets, 
    employees, 
    bulkAddITAssets, 
    replaceAllITAssets, 
    clearAllITAssets 
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'paste' | 'quick-table' | 'pln-preset' | 'clear'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Omit<ITAsset, 'id'>[]>([]);
  const [replaceOldData, setReplaceOldData] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Quick Table Rows
  const [quickRows, setQuickRows] = useState<Array<{
    category: ITAssetCategory;
    name: string;
    brand: string;
    model: string;
    serialNumber: string;
    location: string;
    assignedToEmployeeId: string;
    ownershipType: OwnershipType;
    condition: AssetCondition;
  }>>([
    {
      category: 'Laptop',
      name: 'Lenovo ThinkPad T14 Gen 4',
      brand: 'Lenovo',
      model: 'T14 Gen 4',
      serialNumber: '',
      location: 'Ruang Kantor UP Sengkang',
      assignedToEmployeeId: employees[0]?.id || '',
      ownershipType: 'SEWA',
      condition: 'Baik'
    },
    {
      category: 'Desktop PC',
      name: 'Dell OptiPlex 7010 Tower Core i7',
      brand: 'Dell',
      model: 'OptiPlex 7010',
      serialNumber: '',
      location: 'Ruang Kontrol Operasi',
      assignedToEmployeeId: employees[1]?.id || '',
      ownershipType: 'BELI',
      condition: 'Baik'
    },
    {
      category: 'Access Point',
      name: 'Ubiquiti UniFi 6 Pro Access Point (AP-01)',
      brand: 'Ubiquiti',
      model: 'U6-Pro',
      serialNumber: '',
      location: 'Lantai 1 Gedung Administrasi UP Sengkang',
      assignedToEmployeeId: '',
      ownershipType: 'BELI',
      condition: 'Baik'
    },
    {
      category: 'Switch',
      name: 'Cisco Catalyst 2960X 24-Port Gigabit Switch',
      brand: 'Cisco',
      model: 'WS-C2960X-24TS-L',
      serialNumber: '',
      location: 'Ruang Server UP Sengkang (Rack Main)',
      assignedToEmployeeId: '',
      ownershipType: 'BELI',
      condition: 'Baik'
    }
  ]);

  if (!isOpen) return null;

  // Preset Data khusus PLN UP Sengkang untuk Laptop, PC, AP, dan Switch
  const PLN_UP_SENGKANG_PRESET: Omit<ITAsset, 'id'>[] = [
    // 1. LAPTOP
    {
      assetCode: 'PLN-SKG-NB-001',
      name: 'Apple MacBook Pro 14" M3 Pro',
      category: 'Laptop',
      brand: 'Apple',
      model: 'MacBook Pro 14 (Late 2023)',
      serialNumber: 'C02G99XYMD6R',
      macOrIp: '192.168.1.110 / F0:18:98:3A:4C:12',
      ipAddress: '192.168.1.110',
      macAddress: 'F0:18:98:3A:4C:12',
      vlan: 'VLAN 30 (Wireless Corp)',
      networkStatus: 'ONLINE',
      specs: 'Apple M3 Pro 11-Core, 18GB RAM, 512GB SSD',
      assignedToEmployeeId: employees.find(e => e.nip === '9214022ZY')?.id || employees[0]?.id || null,
      assignedDate: '2024-03-01',
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2024-02-15',
      purchasePrice: 35999000,
      warrantyUntil: '2027-02-15',
      location: 'Ruang Manager Unit UP Sengkang',
      notes: 'Unit operasional dinas Manager Unit PT PLN Nusantara Power UP Sengkang.'
    },
    {
      assetCode: 'PLN-SKG-NB-002',
      name: 'Lenovo ThinkPad T14 Gen 4',
      category: 'Laptop',
      brand: 'Lenovo',
      model: 'ThinkPad T14 AMD Ryzen 7',
      serialNumber: 'PF3Z8810K9L',
      macOrIp: '192.168.1.111 / E4:A7:C5:11:80:92',
      ipAddress: '192.168.1.111',
      macAddress: 'E4:A7:C5:11:80:92',
      vlan: 'VLAN 30 (Wireless Corp)',
      networkStatus: 'ONLINE',
      specs: 'AMD Ryzen 7 PRO 7840U, 32GB RAM, 1TB NVMe, 14" WUXGA',
      assignedToEmployeeId: employees.find(e => e.nip === '9315045ZY')?.id || employees[1]?.id || null,
      assignedDate: '2024-04-10',
      condition: 'Baik',
      ownershipType: 'SEWA',
      rentalVendor: 'PT Mitra Rental Infotama',
      rentalContractNo: 'KNT/RENT-IT/2024/04-09',
      rentalStartDate: '2024-04-01',
      rentalEndDate: '2026-11-30',
      monthlyRentalPrice: 950000,
      location: 'Ruang Asman Ophar UP Sengkang',
      notes: 'Laptop operasional sewa Asman Operasi & Pemeliharaan UP Sengkang.'
    },
    {
      assetCode: 'PLN-SKG-NB-003',
      name: 'Asus ZenBook 14 OLED UX3405',
      category: 'Laptop',
      brand: 'Asus',
      model: 'ZenBook 14 OLED Core Ultra 7',
      serialNumber: 'R5N0CV18J992',
      macOrIp: '192.168.1.112 / 7C:10:C9:88:E2:01',
      ipAddress: '192.168.1.112',
      macAddress: '7C:10:C9:88:E2:01',
      vlan: 'VLAN 30 (Wireless Corp)',
      networkStatus: 'ONLINE',
      specs: 'Intel Core Ultra 7 155H, 16GB RAM, 1TB SSD, 14" 2.8K OLED',
      assignedToEmployeeId: employees.find(e => e.nip === '9416089ZY')?.id || employees[2]?.id || null,
      assignedDate: '2024-05-02',
      condition: 'Baik',
      ownershipType: 'SEWA',
      rentalVendor: 'PT Metro Data Mandiri Rental',
      rentalContractNo: 'KNT/RENT-IT/2024/05-18',
      rentalStartDate: '2024-05-01',
      rentalEndDate: '2026-12-15',
      monthlyRentalPrice: 880000,
      location: 'Ruang K3 & Keamanan UP Sengkang',
      notes: 'Laptop dinas Team Leader K3 & Keamanan UP Sengkang.'
    },
    {
      assetCode: 'PLN-SKG-NB-004',
      name: 'Lenovo ThinkPad L14 Gen 4',
      category: 'Laptop',
      brand: 'Lenovo',
      model: 'ThinkPad L14 Core i5',
      serialNumber: 'PF4W2099B1A',
      macOrIp: '48:2A:E3:77:20:C1',
      specs: 'Intel Core i5-1345U, 16GB RAM, 512GB SSD, 14" Anti-Glare',
      assignedToEmployeeId: employees.find(e => e.nip === '9517102ZY')?.id || employees[3]?.id || null,
      assignedDate: '2024-06-15',
      condition: 'Baik',
      ownershipType: 'SEWA',
      rentalVendor: 'PT Mitra Rental Infotama',
      rentalContractNo: 'KNT/RENT-IT/2024/06-30',
      rentalStartDate: '2024-06-15',
      rentalEndDate: '2027-06-15',
      monthlyRentalPrice: 720000,
      location: 'Ruang Tim Pemeliharaan UP Sengkang',
      notes: 'Laptop dinas Team Leader Pemeliharaan UP Sengkang.'
    },

    // 2. DESKTOP PC
    {
      assetCode: 'PLN-SKG-PC-001',
      name: 'Dell OptiPlex 7010 Tower Core i7 Workstation',
      category: 'Desktop PC',
      brand: 'Dell',
      model: 'OptiPlex 7010 MT',
      serialNumber: 'DL-7010-SKG-9102',
      macOrIp: '192.168.1.101 / 74:86:7A:B1:00:21',
      ipAddress: '192.168.1.101',
      macAddress: '74:86:7A:B1:00:21',
      switchPort: 'SW-CCR-SCADA Port 01',
      vlan: 'VLAN 10 (CCR / SCADA)',
      networkStatus: 'ONLINE',
      specs: 'Intel Core i7-13700, 32GB DDR5, 1TB NVMe + 2TB HDD, NVIDIA T1000 8GB',
      assignedToEmployeeId: employees.find(e => e.nip === '9416115ZY')?.id || employees[4]?.id || null,
      assignedDate: '2023-08-10',
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2023-08-01',
      purchasePrice: 22500000,
      warrantyUntil: '2026-08-01',
      location: 'Ruang Kontrol Pembangkit (CCR) UP Sengkang',
      notes: 'Workstation monitoring SCADA & DCS Operasi Pembangkit.'
    },
    {
      assetCode: 'PLN-SKG-PC-002',
      name: 'HP Pro Tower 400 G9 Core i5 Desktop',
      category: 'Desktop PC',
      brand: 'HP',
      model: 'Pro Tower 400 G9',
      serialNumber: 'HP-400G9-SKG-3312',
      macOrIp: '192.168.1.102 / 28:D0:EA:67:12:90',
      ipAddress: '192.168.1.102',
      macAddress: '28:D0:EA:67:12:90',
      switchPort: 'SW-DIST-LT1 Port 05',
      vlan: 'VLAN 20 (Office / Administrasi)',
      networkStatus: 'ONLINE',
      specs: 'Intel Core i5-12500, 16GB DDR4, 512GB NVMe SSD, Monitor HP 21.5"',
      assignedToEmployeeId: employees.find(e => e.nip === '9618140ZY')?.id || employees[10]?.id || null,
      assignedDate: '2023-09-15',
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2023-09-01',
      purchasePrice: 14800000,
      warrantyUntil: '2026-09-01',
      location: 'Ruang Administrasi & Keuangan UP Sengkang',
      notes: 'PC kerja staf administrasi keuangan & pelaporan PLN UP Sengkang.'
    },
    {
      assetCode: 'PLN-SKG-PC-003',
      name: 'Lenovo ThinkCentre M70t Gen 4 Tower',
      category: 'Desktop PC',
      brand: 'Lenovo',
      model: 'ThinkCentre M70t',
      serialNumber: 'TC-M70T-SKG-5541',
      macOrIp: '192.168.1.103 / 54:05:DB:88:31:0F',
      ipAddress: '192.168.1.103',
      macAddress: '54:05:DB:88:31:0F',
      switchPort: 'SW-DIST-LT1 Port 08',
      vlan: 'VLAN 1 (Management LAN)',
      networkStatus: 'ONLINE',
      specs: 'Intel Core i5-13400, 16GB DDR4, 512GB SSD, Monitor Lenovo 23.8"',
      assignedToEmployeeId: employees.find(e => e.nip === '9820015ZY')?.id || employees[11]?.id || null,
      assignedDate: '2024-01-10',
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2024-01-05',
      purchasePrice: 15400000,
      warrantyUntil: '2027-01-05',
      location: 'Ruang Kerja IT & Sistem Informasi',
      notes: 'PC operasional staf IT untuk administrasi server & helpdesk.'
    },

    // 3. ACCESS POINT (AP)
    {
      assetCode: 'PLN-SKG-AP-001',
      name: 'Ubiquiti UniFi 6 Pro Access Point (AP-Lt1-Admin)',
      category: 'Access Point',
      brand: 'Ubiquiti',
      model: 'UniFi U6-Pro Wi-Fi 6',
      serialNumber: 'UB-U6P-SKG-001A',
      macOrIp: '192.168.1.201 / 70:A7:41:88:99:01',
      ipAddress: '192.168.1.201',
      macAddress: '70:A7:41:88:99:01',
      switchPort: 'SW-CORE-01 Port Gi1/0/01 (PoE+)',
      vlan: 'VLAN 30 (Wireless Corp & Guest)',
      ssid: 'PLN-NP-SENGKANG / PLN-GUEST',
      networkStatus: 'ONLINE',
      specs: 'Wi-Fi 6 Dual-Band AX5400, Gigabit PoE+ Powered, 4x4 MU-MIMO',
      assignedToEmployeeId: null,
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2023-11-20',
      purchasePrice: 3250000,
      warrantyUntil: '2025-11-20',
      location: 'Lantai 1 Gedung Administrasi & Pelayanan UP Sengkang',
      notes: 'Access Point Wi-Fi utama area kantor dan lobi UP Sengkang.'
    },
    {
      assetCode: 'PLN-SKG-AP-002',
      name: 'Ubiquiti UniFi 6 Pro Access Point (AP-Lt2-Management)',
      category: 'Access Point',
      brand: 'Ubiquiti',
      model: 'UniFi U6-Pro Wi-Fi 6',
      serialNumber: 'UB-U6P-SKG-002B',
      macOrIp: '192.168.1.202 / 70:A7:41:88:99:02',
      ipAddress: '192.168.1.202',
      macAddress: '70:A7:41:88:99:02',
      switchPort: 'SW-CORE-01 Port Gi1/0/02 (PoE+)',
      vlan: 'VLAN 30 (Wireless Corp)',
      ssid: 'PLN-NP-SENGKANG',
      networkStatus: 'ONLINE',
      specs: 'Wi-Fi 6 Dual-Band AX5400, Gigabit PoE+ Powered, 4x4 MU-MIMO',
      assignedToEmployeeId: null,
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2023-11-20',
      purchasePrice: 3250000,
      warrantyUntil: '2025-11-20',
      location: 'Lantai 2 Ruang Rapat & Manajemen UP Sengkang',
      notes: 'Access Point Wi-Fi ruang rapat direksi & manajemen unit.'
    },
    {
      assetCode: 'PLN-SKG-AP-003',
      name: 'Cisco Catalyst 9115AXI Wi-Fi 6 Access Point',
      category: 'Access Point',
      brand: 'Cisco',
      model: 'C9115AXI-E Wi-Fi 6',
      serialNumber: 'FOC2510A921',
      macOrIp: '192.168.1.203 / 00:27:0D:71:34:CC',
      ipAddress: '192.168.1.203',
      macAddress: '00:27:0D:71:34:CC',
      switchPort: 'SW-CORE-01 Port Gi1/0/03 (PoE+)',
      vlan: 'VLAN 10 (Operasi & SCADA Wi-Fi)',
      ssid: 'PLN-NP-CCR-OPS',
      networkStatus: 'ONLINE',
      specs: 'Enterprise Wi-Fi 6, 4x4 + 4x4 Dual Radio, PoE+ 802.3at',
      assignedToEmployeeId: null,
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2024-02-10',
      purchasePrice: 8750000,
      warrantyUntil: '2027-02-10',
      location: 'Gedung Operasi Pembangkit & Ruang Kontrol CCR',
      notes: 'Access Point industrial grade untuk area pembangkitan.'
    },

    // 4. SWITCH
    {
      assetCode: 'PLN-SKG-SW-001',
      name: 'Cisco Catalyst 1000 24-Port Gigabit PoE+ Switch (Core Distribution)',
      category: 'Switch',
      brand: 'Cisco',
      model: 'C1000-24FP-4G-L PoE+ 370W',
      serialNumber: 'FOC2419S028',
      macOrIp: '192.168.1.2 / 00:27:0D:33:A1:00',
      ipAddress: '192.168.1.2',
      macAddress: '00:27:0D:33:A1:00',
      switchPort: 'Uplink Core Trunk',
      vlan: 'VLAN 1 (Management Trunk)',
      networkStatus: 'ONLINE',
      specs: '24 x 10/100/1000 PoE+ (370W budget), 4 x 1G SFP Uplinks, Managed L2',
      assignedToEmployeeId: null,
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2023-05-18',
      purchasePrice: 18700000,
      warrantyUntil: '2028-05-18',
      location: 'Ruang Server UP Sengkang (Rack Cabinet #1)',
      notes: 'Switch distribusi utama jaringan LAN kantor, Access Point, dan IP Phone.'
    },
    {
      assetCode: 'PLN-SKG-SW-002',
      name: 'Ruijie Reyee RG-NBS3100 24-Port Gigabit Managed Switch',
      category: 'Switch',
      brand: 'Ruijie',
      model: 'RG-NBS3100-24GT4SFP',
      serialNumber: 'RJ-24GT-SKG-8821',
      macOrIp: '192.168.1.4 / 14:14:4B:99:22:11',
      ipAddress: '192.168.1.4',
      macAddress: '14:14:4B:99:22:11',
      switchPort: 'Fiber Uplink to SW-CORE-01',
      vlan: 'VLAN 10 (CCR / SCADA)',
      networkStatus: 'ONLINE',
      specs: '24 x Gigabit Ethernet, 4 x SFP Ports, Cloud Managed, VLAN, QoS',
      assignedToEmployeeId: null,
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2023-10-05',
      purchasePrice: 5600000,
      warrantyUntil: '2026-10-05',
      location: 'Rack Wallmount Gedung Operasi Lt.1',
      notes: 'Switch akses distribusi workstation operasi dan SCADA node.'
    },
    {
      assetCode: 'PLN-SKG-SW-003',
      name: 'Ubiquiti UniFi Switch Pro 24 PoE (USW-Pro-24-PoE)',
      category: 'Switch',
      brand: 'Ubiquiti',
      model: 'USW-Pro-24-PoE Gen2',
      serialNumber: 'UB-SW24P-SKG-4091',
      macOrIp: '192.168.1.4 / 70:A7:41:33:11:AA',
      specs: '24 x Gigabit (16 PoE+ & 8 PoE++ 400W), 2 x 10G SFP+ Uplinks, Layer 3',
      assignedToEmployeeId: null,
      condition: 'Baik',
      ownershipType: 'BELI',
      purchaseDate: '2024-03-12',
      purchasePrice: 14200000,
      warrantyUntil: '2027-03-12',
      location: 'Ruang Server UP Sengkang (Rack Cabinet #2)',
      notes: 'Switch PoE daya untuk kamera CCTV dan seluruh unit Access Point UniFi.'
    }
  ];

  // Fungsi Parser Teks yang disalin dari Excel / CSV / TSV
  const handleParsePasteText = () => {
    if (!pasteText.trim()) {
      alert('Silakan tempelkan (paste) teks data terlebih dahulu.');
      return;
    }

    const lines = pasteText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed: Omit<ITAsset, 'id'>[] = [];

    lines.forEach((line, index) => {
      // Split by tab, semicolon, comma, or pipe
      let parts: string[] = [];
      if (line.includes('\t')) parts = line.split('\t');
      else if (line.includes(';')) parts = line.split(';');
      else if (line.includes('|')) parts = line.split('|');
      else if (line.includes(',')) parts = line.split(',');
      else parts = [line];

      parts = parts.map(p => p.trim());

      // Abaikan header jika ada kata "kategori" atau "category" atau "nama"
      if (index === 0 && (
        parts[0]?.toLowerCase().includes('kategori') || 
        parts[0]?.toLowerCase().includes('category') ||
        parts[0]?.toLowerCase().includes('no') ||
        parts[1]?.toLowerCase().includes('nama') ||
        parts[1]?.toLowerCase().includes('serial')
      )) {
        return;
      }

      // Format tebakan: [Category, Name/Model, SerialNumber, Brand, Location, AssignedEmployeeName/NIP]
      // atau jika 1 kolom doang, jadikan nama aset
      const firstCol = parts[0] || '';
      let cat: ITAssetCategory = 'Laptop';
      const lowFirst = firstCol.toLowerCase();

      if (lowFirst.includes('pc') || lowFirst.includes('desktop') || lowFirst.includes('komputer')) {
        cat = 'Desktop PC';
      } else if (lowFirst.includes('point') || lowFirst.includes('ap') || lowFirst.includes('access') || lowFirst.includes('wifi')) {
        cat = 'Access Point';
      } else if (lowFirst.includes('switch') || lowFirst.includes('hub')) {
        cat = 'Switch';
      } else if (lowFirst.includes('laptop') || lowFirst.includes('notebook')) {
        cat = 'Laptop';
      } else if (lowFirst.includes('monitor') || lowFirst.includes('layar')) {
        cat = 'Monitor';
      } else if (lowFirst.includes('printer') || lowFirst.includes('scanner')) {
        cat = 'Printer & Scanner';
      }

      // Name
      const name = parts[1] || parts[0] || `Aset IT ${index + 1}`;
      const sn = parts[2] || `SN-PLN-${Date.now().toString(36)}-${index + 1}`.toUpperCase();
      const brand = parts[3] || (cat === 'Access Point' ? 'Ubiquiti' : cat === 'Switch' ? 'Cisco' : cat === 'Desktop PC' ? 'Dell' : 'Lenovo');
      const location = parts[4] || 'Kantor PT PLN NP UP Sengkang';
      const personStr = parts[5] || '';

      // Match employee if provided
      let matchedEmpId: string | null = null;
      if (personStr) {
        const found = employees.find(e => 
          e.name.toLowerCase().includes(personStr.toLowerCase()) || 
          e.nip.toLowerCase().includes(personStr.toLowerCase())
        );
        if (found) matchedEmpId = found.id;
      }

      parsed.push({
        assetCode: `PLN-SKG-${cat.slice(0, 2).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
        name,
        category: cat,
        brand,
        model: name,
        serialNumber: sn,
        specs: `${cat} operasional dinas PT PLN Nusantara Power UP Sengkang.`,
        assignedToEmployeeId: matchedEmpId,
        condition: 'Baik',
        ownershipType: cat === 'Laptop' ? 'SEWA' : 'BELI',
        location,
        notes: 'Data diimpor dari dokumen inventaris.'
      });
    });

    if (parsed.length === 0) {
      alert('Tidak ada baris data valid yang terdeteksi. Silakan periksa kembali format teks Anda.');
      return;
    }

    setParsedPreview(parsed);
  };

  const handleApplyParsedData = () => {
    if (parsedPreview.length === 0) return;

    if (replaceOldData) {
      const fullAssets: ITAsset[] = parsedPreview.map((p, idx) => ({
        ...p,
        id: `it-${Date.now().toString(36)}-${idx}`
      }));
      replaceAllITAssets(fullAssets);
      setSuccessMessage(`Berhasil mengganti seluruh data! ${parsedPreview.length} perangkat (Laptop, PC, AP, Switch) telah disimpan, data lama telah dibersihkan.`);
    } else {
      bulkAddITAssets(parsedPreview);
      setSuccessMessage(`Berhasil menambahkan ${parsedPreview.length} perangkat ke database aset.`);
    }

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const handleApplyPreset = () => {
    if (window.confirm('Terapkan paket data lengkap Laptop, PC, Access Point, dan Switch standar PT PLN Nusantara Power UP Sengkang? Data aset lama akan digantikan.')) {
      const fullAssets: ITAsset[] = PLN_UP_SENGKANG_PRESET.map((p, idx) => ({
        ...p,
        id: `it-${Date.now().toString(36)}-${idx}`
      }));
      replaceAllITAssets(fullAssets);
      setSuccessMessage('Berhasil menerapkan data standar Laptop, Desktop PC, Access Point, dan Switch PLN UP Sengkang! Data lama telah dibersihkan.');
      setTimeout(() => {
        onClose();
      }, 1800);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA data aset IT yang lama? Tindakan ini akan mengosongkan seluruh tabel inventaris perangkat.')) {
      clearAllITAssets();
      setSuccessMessage('Semua data aset IT lama telah berhasil dihapus. Database inventaris aset sekarang bersih.');
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleAddQuickRow = () => {
    setQuickRows(prev => [
      ...prev,
      {
        category: 'Laptop',
        name: '',
        brand: '',
        model: '',
        serialNumber: '',
        location: 'Kantor UP Sengkang',
        assignedToEmployeeId: '',
        ownershipType: 'SEWA',
        condition: 'Baik'
      }
    ]);
  };

  const handleQuickRowChange = (index: number, field: string, value: any) => {
    setQuickRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveQuickRow = (index: number) => {
    setQuickRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveQuickRows = () => {
    const validRows = quickRows.filter(r => r.name.trim() !== '');
    if (validRows.length === 0) {
      alert('Mohon isi minimal satu nama perangkat.');
      return;
    }

    const created: Omit<ITAsset, 'id'>[] = validRows.map((r, idx) => ({
      assetCode: `PLN-SKG-${r.category.slice(0, 2).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`,
      name: r.name,
      category: r.category,
      brand: r.brand || (r.category === 'Access Point' ? 'Ubiquiti' : r.category === 'Switch' ? 'Cisco' : 'Lenovo'),
      model: r.model || r.name,
      serialNumber: r.serialNumber || `SN-${r.category.slice(0, 2).toUpperCase()}-${Date.now().toString(36)}-${idx + 1}`.toUpperCase(),
      specs: `${r.category} operasional PT PLN Nusantara Power UP Sengkang`,
      assignedToEmployeeId: r.assignedToEmployeeId || null,
      condition: r.condition,
      ownershipType: r.ownershipType,
      location: r.location,
      notes: 'Input cepat manual.'
    }));

    if (replaceOldData) {
      const fullAssets: ITAsset[] = created.map((p, idx) => ({
        ...p,
        id: `it-${Date.now().toString(36)}-${idx}`
      }));
      replaceAllITAssets(fullAssets);
      setSuccessMessage(`Berhasil menyimpan ${validRows.length} perangkat dan menghapus data lama.`);
    } else {
      bulkAddITAssets(created);
      setSuccessMessage(`Berhasil menambahkan ${validRows.length} perangkat.`);
    }

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-amber-300 flex items-center justify-center font-black text-sm shadow-inner">
              PLN
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Kelola & Impor Data Aset IT</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-700 text-white font-medium">
                  Laptop • PC • Access Point • Switch
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                PT PLN Nusantara Power UP Sengkang — Input massal, paste Excel, atau bersihkan data lama
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'paste' 
                ? 'border-blue-600 text-blue-600 font-bold bg-white rounded-t-md' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            <span>Salin & Tempel (Paste Excel / Teks)</span>
          </button>

          <button
            onClick={() => setActiveTab('quick-table')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'quick-table' 
                ? 'border-blue-600 text-blue-600 font-bold bg-white rounded-t-md' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Form Input Cepat Tabel</span>
          </button>

          <button
            onClick={() => setActiveTab('pln-preset')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'pln-preset' 
                ? 'border-blue-600 text-blue-600 font-bold bg-white rounded-t-md' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Template Data PLN UP Sengkang (Siap Pakai)</span>
          </button>

          <button
            onClick={() => setActiveTab('clear')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ml-auto ${
              activeTab === 'clear' 
                ? 'border-rose-600 text-rose-600 font-bold bg-white rounded-t-md' 
                : 'border-transparent text-rose-600 hover:text-rose-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Data Lama</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: PASTE EXCEL / TEKS */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  Format Salin-Tempel dari Spreadsheet (Excel / Google Sheets)
                </p>
                <p className="text-slate-600">
                  Anda dapat menyalin langsung tabel Anda dari Excel dan menempelkannya di bawah ini. Kolom dapat dipisahkan Tab atau Koma:
                </p>
                <div className="mt-2 font-mono text-[11px] bg-white p-2 rounded border border-blue-200 text-slate-700">
                  Kategori [Tab] Nama/Tipe [Tab] SerialNumber [Tab] Merk [Tab] Ruangan/Lokasi [Tab] Pegawai/Pemegang
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  *Contoh baris: <code className="text-blue-700 font-semibold">Laptop [Tab] ThinkPad T14 [Tab] PF3Z8810K [Tab] Lenovo [Tab] Ruang Ophar [Tab] Andi Ashari</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tempelkan (Paste) Teks atau Tabel Anda di Sini:
                </label>
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Contoh tempelkan dari Excel:\nLaptop\tThinkPad T14 Gen 4\tPF3Z8810K9L\tLenovo\tRuang Ophar\tAndi Ashari\nDesktop PC\tDell OptiPlex 7010\tDL-7010-01\tDell\tRuang CCR\tSukriadi\nAccess Point\tUniFi 6 Pro\tUB-U6P-001\tUbiquiti\tLt.1 Gedung Admin\t-\nSwitch\tCisco Catalyst 2960X\tFOC2419S028\tCisco\tRuang Server\t-`}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleParsePasteText}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pratinjau Data yang Ditempel</span>
                </button>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replaceOldData}
                      onChange={(e) => setReplaceOldData(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Hapus data lama & gantikan sepenuhnya</span>
                  </label>
                </div>
              </div>

              {/* Table Preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">
                      Pratinjau Hasil Pembacaan ({parsedPreview.length} Perangkat):
                    </h4>
                    <button
                      type="button"
                      onClick={handleApplyParsedData}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan & Terapkan ke Sistem</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2 border-b">Kode</th>
                          <th className="p-2 border-b">Kategori</th>
                          <th className="p-2 border-b">Nama / Model</th>
                          <th className="p-2 border-b">Serial Number</th>
                          <th className="p-2 border-b">Lokasi</th>
                          <th className="p-2 border-b">Pemegang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {parsedPreview.map((item, idx) => {
                          const emp = employees.find(e => e.id === item.assignedToEmployeeId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-bold text-blue-600">{item.assetCode}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  item.category === 'Laptop' ? 'bg-blue-100 text-blue-700' :
                                  item.category === 'Desktop PC' ? 'bg-indigo-100 text-indigo-700' :
                                  item.category === 'Access Point' ? 'bg-amber-100 text-amber-800' :
                                  item.category === 'Switch' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {item.category}
                                </span>
                              </td>
                              <td className="p-2 font-sans font-medium text-slate-900">{item.name}</td>
                              <td className="p-2 text-slate-600">{item.serialNumber}</td>
                              <td className="p-2 font-sans text-slate-600">{item.location}</td>
                              <td className="p-2 font-sans text-slate-800">
                                {emp ? emp.name : <span className="text-slate-400 italic">Pool / Infrastruktur</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FORM INPUT CEPAT TABEL */}
          {activeTab === 'quick-table' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Input Baris Demi Baris Cepat</h3>
                  <p className="text-[11px] text-slate-500">
                    Ketik langsung data Laptop, PC, Access Point, dan Switch Anda:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuickRow}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2 border-b w-36">Kategori</th>
                      <th className="p-2 border-b">Nama & Model</th>
                      <th className="p-2 border-b w-32">Serial Number</th>
                      <th className="p-2 border-b w-40">Lokasi / Ruang</th>
                      <th className="p-2 border-b w-40">Pegawai Pemegang</th>
                      <th className="p-2 border-b w-10 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quickRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2">
                          <select
                            value={row.category}
                            onChange={(e) => handleQuickRowChange(idx, 'category', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-xs bg-white text-slate-800"
                          >
                            <option value="Laptop">Laptop</option>
                            <option value="Desktop PC">Desktop PC</option>
                            <option value="Access Point">Access Point</option>
                            <option value="Switch">Switch</option>
                            <option value="Monitor">Monitor</option>
                            <option value="Printer & Scanner">Printer</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleQuickRowChange(idx, 'name', e.target.value)}
                            placeholder="Contoh: ThinkPad T14 / UniFi 6 Pro"
                            className="w-full p-1 border border-slate-300 rounded text-xs text-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.serialNumber}
                            onChange={(e) => handleQuickRowChange(idx, 'serialNumber', e.target.value)}
                            placeholder="SN-XXXX"
                            className="w-full p-1 border border-slate-300 rounded text-xs font-mono text-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.location}
                            onChange={(e) => handleQuickRowChange(idx, 'location', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-xs text-slate-800"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.assignedToEmployeeId}
                            onChange={(e) => handleQuickRowChange(idx, 'assignedToEmployeeId', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded text-xs bg-white text-slate-800"
                          >
                            <option value="">(Pool / Belum Ada)</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.nip})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickRow(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceOldData}
                    onChange={(e) => setReplaceOldData(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Hapus data lama sebelum menyimpan baris ini</span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveQuickRows}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Data ke Sistem</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TEMPLATE DATA PLN UP SENGKANG */}
          {activeTab === 'pln-preset' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Template Standar Aset IT PT PLN Nusantara Power UP Sengkang
                </p>
                <p className="text-slate-700">
                  Paket template ini telah dikonfigurasi khusus dengan data realistis PLN UP Sengkang yang mencakup 4 kategori utama Anda:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 font-semibold text-center text-[11px]">
                  <div className="bg-white p-2 rounded border border-blue-200 text-blue-800">
                    <Laptop className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    4x Laptop (Dinas & Sewa)
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-200 text-indigo-800">
                    <Monitor className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    3x Desktop PC Kerja
                  </div>
                  <div className="bg-white p-2 rounded border border-amber-200 text-amber-800">
                    <Wifi className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    3x Access Point (UniFi & Cisco)
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-200 text-emerald-800">
                    <Network className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    3x Switch (Cisco & Ruijie)
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2 border-b">Kode Aset</th>
                      <th className="p-2 border-b">Kategori</th>
                      <th className="p-2 border-b">Perangkat & Model</th>
                      <th className="p-2 border-b">Lokasi / Penempatan</th>
                      <th className="p-2 border-b">Status / Pemegang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {PLN_UP_SENGKANG_PRESET.map((item, idx) => {
                      const emp = employees.find(e => e.id === item.assignedToEmployeeId);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-blue-600">{item.assetCode}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.category === 'Laptop' ? 'bg-blue-100 text-blue-700' :
                              item.category === 'Desktop PC' ? 'bg-indigo-100 text-indigo-700' :
                              item.category === 'Access Point' ? 'bg-amber-100 text-amber-800' :
                              item.category === 'Switch' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="p-2 font-sans font-medium text-slate-900">{item.name}</td>
                          <td className="p-2 font-sans text-slate-600">{item.location}</td>
                          <td className="p-2 font-sans text-slate-800">
                            {emp ? emp.name : <span className="text-slate-400 italic">Ruang Server / Jaringan</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleApplyPreset}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Terapkan Paket Template PLN Ini (Hapus Data Lama)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: HAPUS DATA LAMA */}
          {activeTab === 'clear' && (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-center space-y-3">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-rose-900">
                Kosongkan & Hapus Seluruh Data Aset IT Lama
              </h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                Saat ini terdapat <strong>{itAssets.length} perangkat</strong> di sistem. Jika Anda ingin memulai pencatatan dari nol dan mengisi data asli Anda sendiri, klik tombol di bawah untuk menghapus seluruh data lama.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua Data Aset IT Sekarang</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Jumlah Aset IT Saat Ini: <strong className="text-slate-800">{itAssets.length} unit</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
