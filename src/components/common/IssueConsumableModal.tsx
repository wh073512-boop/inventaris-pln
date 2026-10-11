import React, { useState } from 'react';
import { X, ArrowDownRight, AlertCircle, Package } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

interface IssueConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedConsumableId?: string;
}

export const IssueConsumableModal: React.FC<IssueConsumableModalProps> = ({
  isOpen,
  onClose,
  preselectedConsumableId
}) => {
  const { consumables, employees, issueConsumableStock } = useInventory();

  const [selectedItemId, setSelectedItemId] = useState(preselectedConsumableId || consumables[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [customRequester, setCustomRequester] = useState('');
  const [department, setDepartment] = useState('Logistik & Umum');
  const [referenceNo, setReferenceNo] = useState(`REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentItem = consumables.find(c => c.id === selectedItemId);

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmpId(empId);
    if (empId) {
      const emp = employees.find(e => e.id === empId);
      if (emp) {
        setCustomRequester(emp.name);
        setDepartment(emp.department);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedItemId) {
      setErrorMessage('Pilih barang ATK terlebih dahulu.');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('Jumlah pengambilan minimal 1.');
      return;
    }

    const requester = customRequester || 'Staf Internal';
    const result = issueConsumableStock(
      selectedItemId,
      Number(quantity),
      selectedEmpId || null,
      requester,
      department,
      referenceNo,
      notes
    );

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.error || 'Gagal memproses pengeluaran stok.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-500 text-white">
          <div className="flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-sm font-bold">Keluarkan Barang ATK (Habis Pakai)</h3>
              <p className="text-[11px] text-amber-100">Stok fisik langsung terpotong secara instan dari gudang</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white p-1 rounded hover:bg-amber-600/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pilih Barang ATK */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Barang ATK (Kertas, Pena, Gunting, Staples, dll.) <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              {consumables.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.itemCode}] {item.name} — Tersedia: {item.currentStock} {item.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Info Status Stok Terpilih */}
          {currentItem && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500">Stok Tersedia Saat Ini:</span>
                <div className="font-mono text-sm font-bold text-slate-800">
                  {currentItem.currentStock} {currentItem.unit}
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[11px] text-slate-500">Lokasi Rak:</span>
                <div className="text-slate-700 font-medium">{currentItem.location}</div>
              </div>
            </div>
          )}

          {/* Jumlah & Nomor Bon */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jumlah Pengambilan ({currentItem?.unit || 'Unit'}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={currentItem ? currentItem.currentStock : 999}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Referensi / Bon
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Pemohon (Pilih Karyawan atau Input Manual) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Karyawan Pemohon
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Pilih dari Karyawan Terdaftar --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Pemohon / Pengambil <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customRequester}
                onChange={(e) => setCustomRequester(e.target.value)}
                placeholder="Contoh: Wahyu Hidayat"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          {/* Departemen Pemohon */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Departemen Pengguna <span className="text-rose-500">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            >
              <option value="UP Sengkang (Management)">UP Sengkang (Management)</option>
              <option value="Operasi & Pemeliharaan">Operasi & Pemeliharaan</option>
              <option value="K3 & Keamanan">K3 & Keamanan</option>
              <option value="Pemeliharaan">Pemeliharaan</option>
              <option value="Operasi">Operasi</option>
              <option value="Logistik & Umum">Logistik & Umum</option>
              <option value="Keuangan & Administrasi">Keuangan & Administrasi</option>
              <option value="IT & Sistem Informasi">IT & Sistem Informasi</option>
            </select>
          </div>

          {/* Keperluan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Keperluan / Catatan Pengambilan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kebutuhan cetak draft kontrak audit dan operasional rapat"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Potong & Keluarkan Stok</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
