import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { ITAsset } from '../../types/inventory';

interface AssignAssetModalProps {
  asset: ITAsset | null;
  onClose: () => void;
  onAssignedSuccess: (recordId: string) => void;
}

export const AssignAssetModal: React.FC<AssignAssetModalProps> = ({
  asset,
  onClose,
  onAssignedSuccess
}) => {
  const { employees, assignITAsset } = useInventory();

  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [handoverBy, setHandoverBy] = useState('Ahmad Rifai (IT Support UP Sengkang)');
  const [conditionNotes, setConditionNotes] = useState('Unit dalam kondisi prima 100%, layar jernih, charger & aksesoris lengkap.');
  const [notes, setNotes] = useState('Penyerahan fasilitas kerja dinas operasional PT PLN Nusantara Power UP Sengkang.');

  if (!asset) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      alert('Pilih karyawan penerima aset.');
      return;
    }

    try {
      const record = assignITAsset(
        asset.id,
        selectedEmpId,
        handoverBy,
        notes,
        conditionNotes
      );
      onAssignedSuccess(record.id);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat serah terima');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-blue-700 text-white">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-sm font-bold">Serah Terima Aset IT ke Karyawan</h3>
              <p className="text-[11px] text-blue-100">Menerbitkan Berita Acara Serah Terima (BAST) resmi</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Info Aset Terpilih */}
          <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Perangkat yang Diserahkan</span>
            <div className="text-sm font-bold text-slate-900">{asset.name}</div>
            <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
              <span>Kode: <strong>{asset.assetCode}</strong></span>
              <span>·</span>
              <span>SN: <strong>{asset.serialNumber}</strong></span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Karyawan Penerima <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.nip}) — Divisi {emp.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Petugas Penyerah (PIC IT / GA) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={handoverBy}
              onChange={(e) => setHandoverBy(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kondisi Fisik Saat Serah Terima <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan / Kelengkapan Aksesoris
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Charger original, kabel power, tas laptop, kartu garansi"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
            />
          </div>

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
              className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Proses & Terbitkan BAST</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
