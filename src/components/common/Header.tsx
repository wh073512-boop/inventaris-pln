import React, { useState } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2,
  X,
  LogOut,
  Users
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { UserManagementModal } from './UserManagementModal';

interface HeaderProps {
  onOpenAddAssetModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenAddAssetModal 
}) => {
  const { 
    activeTab, 
    setActiveTab,
    itAssets, 
    exportJSON, 
    importJSON, 
    resetToSampleData,
    exportCSV,
    canEditInventory,
    user
  } = useInventory();
  const { logout } = useAuth();
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Ringkasan Eksekutif Aset IT';
      case 'it-assets': return 'Inventaris Laptop & Hardware IT';
      case 'custody': return 'Inventaris Pegawai & BAST Digital';
      case 'opname': return 'Audit Fisik Stock Opname IT';
      default: return 'Manajemen Aset IT';
    }
  };

  const rentalCount = itAssets.filter(a => a.ownershipType === 'SEWA').length;
  const assignedITCount = itAssets.filter(a => a.assignedToEmployeeId !== null).length;
  const poolCount = itAssets.filter(a => a.assignedToEmployeeId === null).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importJSON(content);
      if (success) {
        setToastMessage('Data inventaris IT berhasil diimpor!');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert('Gagal mengimpor file. Format JSON tidak sesuai.');
      }
    };
    reader.readAsText(file);
    setShowBackupMenu(false);
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan semua data ke data standar PT PLN Nusantara Power UP Sengkang? Perubahan terbaru akan direset.')) {
      resetToSampleData();
      setToastMessage('Data berhasil direset ke data PT PLN Nusantara Power UP Sengkang.');
      setTimeout(() => setToastMessage(null), 3000);
      setShowBackupMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Brand wordmark & breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <a 
          href="#dashboard" 
          onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <span className="w-7 h-7 rounded bg-blue-600 text-amber-300 flex items-center justify-center font-black text-xs tracking-tighter shadow-xs">
            PLN
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-black uppercase text-blue-900 tracking-wider">PT PLN NUSANTARA POWER</span>
            <span className="text-[11px] font-bold text-slate-600">UP SENGKANG</span>
          </div>
        </a>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
          {getBreadcrumbTitle()}
        </span>
      </div>

      {/* Zone 2: Informational summary text (Strictly unboxed text with middle-dot separators) */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
        <span>Total Aset IT: <strong className="font-semibold text-slate-700 font-mono tabular-nums">{itAssets.length}</strong> unit</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>Laptop Sewa: <strong className="font-semibold text-blue-700 font-mono tabular-nums">{rentalCount}</strong> unit</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>Dipegang Pegawai: <strong className="font-semibold text-slate-700 font-mono tabular-nums">{assignedITCount}</strong> unit</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span>Pool Cadangan: <strong className="font-semibold text-emerald-700 font-mono tabular-nums">{poolCount}</strong> unit</span>
      </div>

      {/* Zone 3: Primary operational actions */}
      <div className="flex items-center gap-2.5 shrink-0 relative">
        {canEditInventory && (
          <button
            onClick={onOpenAddAssetModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            title="Tambah perangkat laptop, PC, monitor, atau alat IT baru"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Aset IT</span>
          </button>
        )}

        {canEditInventory && (
          <button
            onClick={() => setShowUsersModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap"
            title="Kelola akun dan hak akses"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Pengguna</span>
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowBackupMenu(!showBackupMenu)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Cadangan & Ekspor
          </button>

          {showBackupMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-3 py-1 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
                Unduh Laporan CSV
              </div>
              <button
                onClick={() => { exportCSV('it'); setShowBackupMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
              >
                <span>Export CSV Aset IT (Sewa/Beli)</span>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => { exportCSV('custody'); setShowBackupMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
              >
                <span>Export CSV BAST Pegawai</span>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {canEditInventory && (
                <>
              <div className="border-t border-slate-100 my-1"></div>
              <div className="px-3 py-1 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
                Database Backup
              </div>
              <button
                onClick={() => { exportJSON(); setShowBackupMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
              >
                <span>Backup JSON Lengkap</span>
                <Download className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <label className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between cursor-pointer">
                <span>Pulihkan dari JSON</span>
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={handleReset}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center justify-between"
              >
                <span>Reset ke Data Awal</span>
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
          <span className="hidden xl:block max-w-32 truncate text-xs text-slate-500" title={`${user.displayName} • ${user.role}`}>
            {user.displayName}
          </span>
          <button
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            title="Keluar dari aplikasi"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <UserManagementModal isOpen={showUsersModal} onClose={() => setShowUsersModal(false)} />

    </header>
  );
};
