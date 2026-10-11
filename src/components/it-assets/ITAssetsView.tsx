import React, { useState } from 'react';
import { 
  Laptop, 
  Search, 
  Plus, 
  QrCode, 
  UserCheck, 
  RotateCcw, 
  Trash2, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  AlertTriangle,
  Calendar,
  Filter,
  Wrench,
  FileSpreadsheet
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { ITAsset, ITAssetCategory, AssetCondition, OwnershipType } from '../../types/inventory';
import { formatDateIndo, getLeaseExpiryStatus } from '../../utils/formatters';
import { BulkImportAssetModal } from '../common/BulkImportAssetModal';

interface ITAssetsViewProps {
  onOpenAddModal: () => void;
  onOpenQRCodeModal: (asset: ITAsset) => void;
  onOpenAssignModal: (asset: ITAsset) => void;
  onOpenServiceModal: (asset: ITAsset) => void;
}

export const ITAssetsView: React.FC<ITAssetsViewProps> = ({
  onOpenAddModal,
  onOpenQRCodeModal,
  onOpenAssignModal,
  onOpenServiceModal
}) => {
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const { 
    itAssets, 
    employees, 
    deleteITAsset, 
    returnITAsset, 
    resolveAssetService,
    updateAssetCondition,
    canEditInventory,
    canOperateIT
  } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'POOL' | 'RUSAK' | 'MAINTENANCE' | 'ALL_ISSUES'>('ALL');
  const [ownershipFilter, setOwnershipFilter] = useState<'ALL' | 'SEWA' | 'EXPIRING_SOON' | 'BELI'>('ALL');

  const categories: ITAssetCategory[] = [
    'Laptop',
    'Desktop PC',
    'Access Point',
    'Switch',
    'Monitor',
    'Perangkat Jaringan',
    'Printer & Scanner',
    'Aksesori & Periferal',
    'Server & Storage'
  ];

  // Rental Metrics & Lease Expiration Calculations
  const rentalAssets = itAssets.filter(a => a.ownershipType === 'SEWA');
  const ownedAssets = itAssets.filter(a => a.ownershipType === 'BELI');
  
  // Units with lease expiring within 90 days or expired
  const expiringSoonAssets = rentalAssets.filter(a => {
    const status = getLeaseExpiryStatus(a.rentalEndDate);
    return status.isUpcoming || status.isExpired;
  });

  // Urgent units (<= 30 days)
  const urgentAssets = rentalAssets.filter(a => {
    const status = getLeaseExpiryStatus(a.rentalEndDate);
    return status.isUrgent;
  });

  // Sort rentals by nearest end date
  const sortedRentalsByEndDate = [...rentalAssets].sort((a, b) => {
    const dateA = a.rentalEndDate ? new Date(a.rentalEndDate).getTime() : 9999999999999;
    const dateB = b.rentalEndDate ? new Date(b.rentalEndDate).getTime() : 9999999999999;
    return dateA - dateB;
  });
  const nearestExpiringAsset = sortedRentalsByEndDate[0];

  // Damage & Maintenance Metrics
  const brokenAssets = itAssets.filter(a => a.condition === 'Rusak');
  const inMaintenanceAssets = itAssets.filter(a => a.condition === 'Dalam Pemeliharaan' || a.condition === 'Perlu Perbaikan');
  const totalIssueAssets = itAssets.filter(a => a.condition !== 'Baik');

  const assignedCount = itAssets.filter(a => a.assignedToEmployeeId !== null).length;
  const poolCount = itAssets.filter(a => a.assignedToEmployeeId === null && a.condition === 'Baik').length;

  const filteredAssets = itAssets.filter(asset => {
    const assignedEmp = employees.find(e => e.id === asset.assignedToEmployeeId);
    const empName = assignedEmp ? assignedEmp.name : '';
    const vendor = asset.rentalVendor || '';
    const damage = asset.damageNotes || '';
    const ticket = asset.serviceTicketNo || '';
    
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          damage.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          empName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'ASSIGNED') matchesStatus = asset.assignedToEmployeeId !== null;
    else if (statusFilter === 'POOL') matchesStatus = asset.assignedToEmployeeId === null && asset.condition === 'Baik';
    else if (statusFilter === 'RUSAK') matchesStatus = asset.condition === 'Rusak';
    else if (statusFilter === 'MAINTENANCE') matchesStatus = asset.condition === 'Dalam Pemeliharaan' || asset.condition === 'Perlu Perbaikan';
    else if (statusFilter === 'ALL_ISSUES') matchesStatus = asset.condition !== 'Baik';

    let matchesOwnership = true;
    if (ownershipFilter === 'SEWA') matchesOwnership = asset.ownershipType === 'SEWA';
    else if (ownershipFilter === 'EXPIRING_SOON') {
      const leaseStat = getLeaseExpiryStatus(asset.rentalEndDate);
      matchesOwnership = asset.ownershipType === 'SEWA' && (leaseStat.isUpcoming || leaseStat.isExpired);
    }
    else if (ownershipFilter === 'BELI') matchesOwnership = asset.ownershipType === 'BELI';

    return matchesSearch && matchesCategory && matchesStatus && matchesOwnership;
  });

  const handleReturnAsset = (asset: ITAsset) => {
    const reason = window.prompt('Masukkan catatan pengembalian (misal: Selesai masa sewa / Mutasi divisi / Penukaran unit vendor):');
    if (reason !== null) {
      returnITAsset(
        asset.id,
        'Ahmad Rifai (IT Support UP Sengkang)',
        reason || 'Pengembalian reguler unit kerja.',
        'Unit dicek kembali dalam keadaan baik.'
      );
    }
  };

  const handleQuickStatusChange = (asset: ITAsset, newCondition: AssetCondition) => {
    if (newCondition === 'Baik') {
      resolveAssetService(asset.id, 'Kondisi ditandai normal kembali oleh admin.');
    } else {
      updateAssetCondition(asset.id, newCondition);
      onOpenServiceModal(asset);
    }
  };

  const handleQuickResolve = (asset: ITAsset) => {
    resolveAssetService(asset.id, 'Perbaikan unit diverifikasi selesai oleh IT Support, kondisi berfungsi normal 100%.');
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Inventaris Laptop & Perangkat IT
          </h2>
          <p className="text-xs text-slate-500">
            Mayoritas laptop berstatus <strong>Sewa (Rental IT)</strong> dengan pemantauan waktu akhir sewa, klaim garansi kerusakan, dan tracking servis
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEditInventory && <button
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer shrink-0"
            title="Tempel tabel Excel, impor Laptop, PC, AP, Switch, atau kosongkan data lama"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Kelola / Impor & Kosongkan Data</span>
          </button>}

          {canEditInventory && <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrasi Aset IT Baru</span>
          </button>}
        </div>
      </div>

      {/* KPI Cards: 4 Cards (Rental, Waktu Akhir Sewa, Unit Rusak & Servis, Distribusi Gudang) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rental / Sewa (Dominant) */}
        <div className="bg-white p-4 rounded-lg border border-blue-200 bg-blue-50/20 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Unit Disewa (Rental IT)</span>
            </span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              {rentalAssets.length} Unit
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {rentalAssets.length} <span className="text-xs font-sans font-normal text-slate-500">Sewa Aktif</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Laptop vendor rental ({ownedAssets.length} unit dibeli permanen).
          </p>
        </div>

        {/* Card 2: Waktu Akhir Sewa Terdekat */}
        <div className={`bg-white p-4 rounded-lg border shadow-2xs space-y-1.5 ${
          urgentAssets.length > 0 
            ? 'border-rose-300 bg-rose-50/30' 
            : expiringSoonAssets.length > 0 
            ? 'border-amber-300 bg-amber-50/20' 
            : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              urgentAssets.length > 0 ? 'text-rose-700' : 'text-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Akhir Sewa Terdekat</span>
            </span>
            <button
              onClick={() => setOwnershipFilter('EXPIRING_SOON')}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                urgentAssets.length > 0 
                  ? 'bg-rose-100 text-rose-800' 
                  : expiringSoonAssets.length > 0 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {expiringSoonAssets.length} Segera Berakhir
            </button>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 tabular-nums truncate">
            {nearestExpiringAsset?.rentalEndDate ? formatDateIndo(nearestExpiringAsset.rentalEndDate) : 'Semua Aman'}
          </div>
          <p className="text-[11px] text-slate-600 truncate">
            {nearestExpiringAsset ? nearestExpiringAsset.name : 'Tidak ada kontrak yang mendekati jatuh tempo.'}
          </p>
        </div>

        {/* Card 3: Unit Rusak & Butuh Servis */}
        <div className={`bg-white p-4 rounded-lg border shadow-2xs space-y-1.5 ${
          brokenAssets.length > 0 
            ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200' 
            : totalIssueAssets.length > 0 
            ? 'border-amber-300 bg-amber-50/20' 
            : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Unit Rusak & Servis</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStatusFilter('RUSAK')}
                className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  brokenAssets.length > 0 ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-100 text-slate-600'
                }`}
                title="Filter hanya unit rusak butuh perbaikan"
              >
                {brokenAssets.length} Rusak
              </button>
              {inMaintenanceAssets.length > 0 && (
                <button
                  onClick={() => setStatusFilter('MAINTENANCE')}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                  title="Filter unit dalam pemeliharaan"
                >
                  {inMaintenanceAssets.length} Servis
                </button>
              )}
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {brokenAssets.length} <span className="text-xs font-sans font-normal text-slate-500">Unit Rusak Berat</span>
          </div>
          <p className="text-[11px] text-slate-600">
            {brokenAssets.length > 0 
              ? `${brokenAssets.map(a => `${a.category} (${a.brand})`).join(', ')}.`
              : 'Semua printer & laptop saat ini beroperasi prima.'}
          </p>
        </div>

        {/* Card 4: Distribusi Perangkat */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" />
              <span>Siap Pakai Gudang</span>
            </span>
            <span className="text-xs font-mono font-bold text-slate-700">
              {assignedCount} Dipegang
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            {poolCount} <span className="text-xs font-sans font-normal text-slate-500">Unit Normal Ready</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Cadangan kondisi prima siap alokasi onboarding.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode (AST-IT-...), nama, SN, status rusak, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Ownership & Lease Expiry Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md text-xs font-medium">
            <button
              onClick={() => setOwnershipFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                ownershipFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({itAssets.length})
            </button>
            <button
              onClick={() => setOwnershipFilter('SEWA')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                ownershipFilter === 'SEWA' ? 'bg-blue-600 text-white shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disewa ({rentalAssets.length})
            </button>
            <button
              onClick={() => setOwnershipFilter('EXPIRING_SOON')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                ownershipFilter === 'EXPIRING_SOON' 
                  ? 'bg-amber-600 text-white shadow-2xs font-semibold' 
                  : 'text-amber-700 hover:bg-amber-100/50'
              }`}
              title="Unit sewa yang jatuh tempo dalam 90 hari"
            >
              <Clock className="w-3 h-3" />
              <span>Jatuh Tempo ({expiringSoonAssets.length})</span>
            </button>
            <button
              onClick={() => setOwnershipFilter('BELI')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                ownershipFilter === 'BELI' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dibeli ({ownedAssets.length})
            </button>
          </div>

          {/* Category dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Kategori IT ({itAssets.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status selector with dedicated Rusak & Servis option */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-1 rounded cursor-pointer ${statusFilter === 'ALL' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('ASSIGNED')}
              className={`px-2 py-1 rounded cursor-pointer ${statusFilter === 'ASSIGNED' ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Dipegang ({assignedCount})
            </button>
            <button
              onClick={() => setStatusFilter('POOL')}
              className={`px-2 py-1 rounded cursor-pointer ${statusFilter === 'POOL' ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Ready Gudang ({poolCount})
            </button>
            <button
              onClick={() => setStatusFilter('RUSAK')}
              className={`px-2 py-1 rounded cursor-pointer flex items-center gap-1 ${
                statusFilter === 'RUSAK' 
                  ? 'bg-rose-600 text-white font-bold shadow-2xs' 
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold'
              }`}
              title="Tampilkan hanya unit rusak berat yang membutuhkan servis perbaikan"
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              <span>Rusak ({brokenAssets.length})</span>
            </button>
            <button
              onClick={() => setStatusFilter('MAINTENANCE')}
              className={`px-2 py-1 rounded cursor-pointer flex items-center gap-1 ${
                statusFilter === 'MAINTENANCE' 
                  ? 'bg-amber-600 text-white font-bold shadow-2xs' 
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 font-medium'
              }`}
              title="Unit dalam proses pemeliharaan / perbaikan teknisi"
            >
              <Wrench className="w-3 h-3 text-amber-500" />
              <span>Servis ({inMaintenanceAssets.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Highlight Alert Banner for Broken Equipment (e.g. Printer & Laptop) */}
      {brokenAssets.length > 0 && statusFilter !== 'RUSAK' && (
        <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50/30 border border-rose-300 rounded-lg p-3.5 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Perhatian IT: {brokenAssets.length} Perangkat Sedang Rusak & Butuh Servis Segera</span>
                </h4>
                <p className="text-[11px] text-slate-600">
                  Unit tidak dapat digunakan normal (roller printer aus, layar laptop mati). Kelola tiket servis atau klaim swap unit vendor.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStatusFilter('RUSAK')}
              className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              Filter {brokenAssets.length} Unit Rusak →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-rose-100">
            {brokenAssets.map(bAsset => (
              <div key={bAsset.id} className="bg-white p-2.5 rounded border border-rose-200 flex items-start justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                    <span className="font-mono text-rose-700 font-bold">{bAsset.assetCode}</span>
                    <span>·</span>
                    <span className="truncate">{bAsset.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {bAsset.category} · {bAsset.ownershipType === 'SEWA' ? `Unit Sewa (${bAsset.rentalVendor})` : 'Aset Beli'}
                  </div>
                  <div className="text-[11px] text-rose-800 mt-1 line-clamp-1 italic">
                    "{bAsset.damageNotes || 'Butuh perbaikan teknisi'}"
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  {canOperateIT && <button
                    onClick={() => onOpenServiceModal(bAsset)}
                    className="px-2 py-1 text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Wrench className="w-3 h-3 text-amber-400" />
                    <span>SPK Servis</span>
                  </button>}
                  {canOperateIT && <button
                    onClick={() => handleQuickResolve(bAsset)}
                    className="px-2 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
                    title="Tandai telah selesai diservis & berfungsi baik"
                  >
                    Selesai
                  </button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Density Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="px-4 py-3">Kode & Perangkat</th>
                <th className="px-4 py-3">Status Kepemilikan</th>
                <th className="px-4 py-3">Kondisi & Status Servis</th>
                <th className="px-4 py-3">Waktu Akhir Sewa</th>
                <th className="px-4 py-3">Serial Number (SN)</th>
                <th className="px-4 py-3">Pemegang / Lokasi Fisik</th>
                <th className="px-4 py-3 text-center">Kelola Servis & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ditemukan aset IT yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const assignedEmp = employees.find(e => e.id === asset.assignedToEmployeeId);
                  const isRental = asset.ownershipType === 'SEWA';
                  const leaseStatus = getLeaseExpiryStatus(asset.rentalEndDate);
                  const isIssue = asset.condition !== 'Baik';

                  return (
                    <tr 
                      key={asset.id} 
                      className={`transition-colors ${
                        asset.condition === 'Rusak' 
                          ? 'bg-rose-50/40 hover:bg-rose-50/70' 
                          : asset.condition === 'Dalam Pemeliharaan'
                          ? 'bg-amber-50/40 hover:bg-amber-50/70'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-semibold text-blue-600">
                            {asset.assetCode}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            asset.category === 'Laptop' ? 'bg-blue-100 text-blue-700' :
                            asset.category === 'Desktop PC' ? 'bg-indigo-100 text-indigo-700' :
                            asset.category === 'Access Point' ? 'bg-amber-100 text-amber-800' :
                            asset.category === 'Switch' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {asset.category}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 text-xs mt-1">
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-slate-500 max-w-xs truncate mt-0.5">
                          {asset.specs}
                        </div>
                      </td>

                      {/* Status Kepemilikan (Sewa vs Beli) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isRental ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <Building2 className="w-3 h-3 text-blue-600" />
                              Disewa (Rental)
                            </span>
                            <div className="text-[10px] text-slate-600 font-medium mt-1 truncate max-w-[140px]" title={asset.rentalVendor}>
                              {asset.rentalVendor || 'Vendor Rental IT'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              Milik Perusahaan
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Aset Dibeli
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Kondisi & Status Servis (HIGHLIGHTED) */}
                      <td className="px-4 py-3">
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              asset.condition === 'Rusak'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : asset.condition === 'Dalam Pemeliharaan'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : asset.condition === 'Perlu Perbaikan'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {asset.condition === 'Rusak' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              {asset.condition === 'Dalam Pemeliharaan' && <Wrench className="w-3 h-3 text-amber-600" />}
                              {asset.condition === 'Perlu Perbaikan' && <Clock className="w-3 h-3 text-yellow-600" />}
                              {asset.condition === 'Baik' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              <span>{asset.condition}</span>
                            </span>

                            {isIssue && canOperateIT && (
                              <button
                                onClick={() => onOpenServiceModal(asset)}
                                className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                Detail Servis →
                              </button>
                            )}
                          </div>

                          {asset.damageNotes && (
                            <p className="text-[11px] text-slate-700 leading-tight line-clamp-2">
                              {asset.damageNotes}
                            </p>
                          )}

                          {asset.serviceVendor && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Vendor Servis: {asset.serviceVendor} ({asset.serviceTicketNo || '-'})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Waktu Akhir Sewa */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isRental ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 font-mono text-xs">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              <span>{formatDateIndo(asset.rentalEndDate)}</span>
                            </div>
                            <div>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                leaseStatus.badgeTone === 'rose'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : leaseStatus.badgeTone === 'amber'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-100'
                              }`}>
                                <Clock className="w-2.5 h-2.5" />
                                <span>{leaseStatus.label}</span>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-mono text-xs text-slate-600">
                              {asset.warrantyUntil ? formatDateIndo(asset.warrantyUntil) : 'Permanen'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Garansi Resmi
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {asset.serialNumber}
                        </span>
                        {asset.ipAddress ? (
                          <div className="font-mono text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{asset.ipAddress}</span>
                            {asset.switchPort && (
                              <span className="text-slate-400 font-normal">({asset.switchPort})</span>
                            )}
                          </div>
                        ) : asset.macOrIp ? (
                          <div className="font-mono text-[10px] text-slate-400 mt-1">
                            {asset.macOrIp}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {assignedEmp ? (
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: assignedEmp.avatarColor }}
                              />
                              <span>{assignedEmp.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {assignedEmp.department}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                              asset.condition === 'Rusak' || asset.condition === 'Dalam Pemeliharaan'
                                ? 'text-amber-800 bg-amber-50 border border-amber-200'
                                : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            }`}>
                              {asset.location}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick status selector */}
                          {canOperateIT && <select
                            value={asset.condition}
                            onChange={(e) => handleQuickStatusChange(asset, e.target.value as AssetCondition)}
                            className={`text-[10px] font-bold px-1.5 py-1 rounded border transition-colors cursor-pointer ${
                              asset.condition === 'Rusak' 
                                ? 'bg-rose-100 text-rose-800 border-rose-300' 
                                : asset.condition === 'Dalam Pemeliharaan'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : asset.condition === 'Perlu Perbaikan'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                            }`}
                            title="Ubah status kondisi unit secara langsung"
                          >
                            <option value="Baik">Normal (Baik)</option>
                            <option value="Rusak">🚨 Rusak (Butuh Servis)</option>
                            <option value="Dalam Pemeliharaan">🔧 Servis (Pemeliharaan)</option>
                            <option value="Perlu Perbaikan">⚠️ Perlu Perbaikan</option>
                          </select>}

                          {/* Quick Resolve Button if broken or in service */}
                          {isIssue && canOperateIT && (
                            <button
                              onClick={() => handleQuickResolve(asset)}
                              className="px-2 py-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded transition-colors cursor-pointer flex items-center gap-1"
                              title="Tandai telah selesai diservis & kembali kondisi baik"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Pulihkan</span>
                            </button>
                          )}

                          {/* Button to open detailed service & damage modal */}
                          {canOperateIT && <button
                            onClick={() => onOpenServiceModal(asset)}
                            className={`p-1.5 rounded transition-colors cursor-pointer border ${
                              isIssue 
                                ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300' 
                                : 'text-slate-600 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border-slate-200'
                            }`}
                            title={isIssue ? "Kelola SPK & tiket servis" : "Laporkan rusak / kirim servis"}
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>}

                          {canOperateIT && <button
                            onClick={() => onOpenQRCodeModal(asset)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                            title="Lihat Label QR Code & Cetak Stiker"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>}

                          {canOperateIT && (asset.assignedToEmployeeId ? (
                            <button
                              onClick={() => handleReturnAsset(asset)}
                              className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors cursor-pointer"
                              title="Tarik kembali unit ke gudang IT"
                            >
                              Tarik Unit
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenAssignModal(asset)}
                              disabled={asset.condition === 'Rusak'}
                              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                                asset.condition === 'Rusak'
                                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed border border-slate-200'
                                  : 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer'
                              }`}
                              title={asset.condition === 'Rusak' ? "Unit sedang rusak, perbaiki dahulu sebelum diserahkan" : "Serah terima ke karyawan & terbitkan BAST"}
                            >
                              Serah Terima
                            </button>
                          ))}
                          {canEditInventory && <button
                            onClick={() => {
                              if (window.confirm(`Hapus aset ${asset.name} (${asset.assetCode}) dari database?`)) {
                                deleteITAsset(asset.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Hapus aset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan <strong className="text-slate-800">{filteredAssets.length}</strong> unit ({rentalAssets.length} Sewa, {ownedAssets.length} Beli)
          </div>
          <div className="flex items-center gap-4">
            <span className="text-rose-700">Rusak/Servis: <strong className="font-mono">{totalIssueAssets.length}</strong></span>
            <span className="text-amber-700">Segera Habis Sewa: <strong className="font-mono">{expiringSoonAssets.length}</strong></span>
            <span>Ready Gudang: <strong className="font-mono text-emerald-700">{poolCount}</strong></span>
          </div>
        </div>
      </div>
      {/* Modal Kelola & Impor Aset IT */}
      <BulkImportAssetModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
