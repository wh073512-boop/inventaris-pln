import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Clock, 
  Calendar, 
  Check, 
  Printer, 
  Laptop, 
  History,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { ITAsset, AssetCondition } from '../../types/inventory';
import { formatDateIndo } from '../../utils/formatters';

interface ServiceRepairModalProps {
  asset: ITAsset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceRepairModal: React.FC<ServiceRepairModalProps> = ({
  asset,
  isOpen,
  onClose
}) => {
  const { reportAssetDamage, resolveAssetService, serviceRecords } = useInventory();

  if (!isOpen || !asset) return null;

  const isCurrentlyBrokenOrInService = asset.condition === 'Rusak' || asset.condition === 'Dalam Pemeliharaan' || asset.condition === 'Perlu Perbaikan';

  // Form states
  const [selectedCondition, setSelectedCondition] = useState<AssetCondition>(
    asset.condition === 'Baik' ? 'Rusak' : asset.condition
  );
  const [damageNotes, setDamageNotes] = useState(asset.damageNotes || '');
  const [serviceVendor, setServiceVendor] = useState(
    asset.serviceVendor || (asset.ownershipType === 'SEWA' 
      ? `${asset.rentalVendor || 'Vendor Rental'} (Klaim Swap/Perbaikan)` 
      : (asset.category === 'Printer & Scanner' ? 'Brother Service Center Resmi' : 'Service Center Resmi'))
  );
  const [ticketNo, setTicketNo] = useState(
    asset.serviceTicketNo || `SRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState(
    asset.estimatedServiceEndDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isRentalClaim, setIsRentalClaim] = useState(asset.ownershipType === 'SEWA');
  const [pullToServiceLab, setPullToServiceLab] = useState(asset.assignedToEmployeeId !== null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // History of this asset
  const assetServiceHistory = serviceRecords.filter(sr => sr.assetId === asset.id);

  // Quick symptom presets based on category
  const symptomPresets = asset.category === 'Printer & Scanner' ? [
    'Paper feed roller aus & sering macet (paper jam)',
    'Hasil cetak bergaris hitam pekat & drum kotor',
    'Hasil cetak buram / toner tidak melekat sempurna',
    'Koneksi Wi-Fi / kabel LAN printer offline tidak terdeteksi'
  ] : [
    'Layar berkedip (flicker) / dead pixel / blank',
    'Baterai drop cepat / tidak mengisi daya (charging error)',
    'Keyboard beberapa tombol macet / tidak merespons',
    'Kipas pendingin bersuara keras & laptop overheat tiba-tiba mati',
    'Operating system boot loop / SSD tidak terdeteksi'
  ];

  const handleReportDamage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!damageNotes.trim()) {
      alert('Mohon isi penjelasan gejala kerusakan.');
      return;
    }

    reportAssetDamage(
      asset.id,
      selectedCondition,
      damageNotes,
      serviceVendor,
      ticketNo,
      estimatedCompletionDate,
      isRentalClaim,
      pullToServiceLab
    );

    onClose();
  };

  const handleResolve = () => {
    const notes = resolutionNotes.trim() || 'Perbaikan selesai diverifikasi tim IT Support. Unit berfungsi normal 100%.';
    resolveAssetService(asset.id, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 text-white ${
          asset.condition === 'Rusak' 
            ? 'bg-rose-700' 
            : asset.condition === 'Dalam Pemeliharaan'
            ? 'bg-amber-600'
            : 'bg-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              {asset.category === 'Printer & Scanner' ? (
                <Printer className="w-4 h-4" />
              ) : (
                <Laptop className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Kelola Status Kerusakan & Servis Perangkat</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20">
                  {asset.assetCode}
                </span>
              </h3>
              <p className="text-[11px] text-white/80">
                {asset.name} · Kondisi Saat Ini: <strong>{asset.condition}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Active Service Status Notice if Broken */}
          {isCurrentlyBrokenOrInService && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Status Aktif: {asset.condition === 'Rusak' ? 'Sedang Rusak / Menunggu Servis' : 'Dalam Proses Pemeliharaan & Perbaikan'}
                    </h4>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                      {asset.damageNotes || 'Belum ada rincian gejala kerusakan.'}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 font-mono text-[10px] font-bold rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  {asset.serviceTicketNo || 'TIKET AKTIF'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-200/70 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Tempat/Vendor Servis:</span>
                  <span className="font-semibold text-slate-800">{asset.serviceVendor || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimasi Selesai:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatDateIndo(asset.estimatedServiceEndDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Lokasi Fisik Unit:</span>
                  <span className="font-medium text-slate-800">{asset.location}</span>
                </div>
              </div>

              {/* One-Click Resolution Button */}
              <div className="pt-2 border-t border-amber-200/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <input
                  type="text"
                  placeholder="Catatan resolusi perbaikan (misal: Roller diganti baru, cetak normal)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-[11px]"
                />
                <button
                  type="button"
                  onClick={handleResolve}
                  className="px-4 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-2xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tandai Selesai Servis (Kondisi Baik)</span>
                </button>
              </div>
            </div>
          )}

          {/* Form: Laporkan Kerusakan Baru atau Perbarui Status Servis */}
          <form onSubmit={handleReportDamage} className="space-y-4">
            <div className="font-bold text-slate-900 flex items-center justify-between pb-1 border-b border-slate-200">
              <span>{isCurrentlyBrokenOrInService ? 'Perbarui Rincian Kerusakan / Servis:' : 'Laporkan Kerusakan & Ajukan Servis:'}</span>
              {asset.ownershipType === 'SEWA' && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Unit Sewa Vendor: {asset.rentalVendor || 'Vendor Rental'}
                </span>
              )}
            </div>

            {/* Condition selector cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <label className={`p-2.5 rounded-lg border cursor-pointer text-center transition-all ${
                selectedCondition === 'Rusak'
                  ? 'bg-rose-50 border-rose-500 shadow-2xs text-rose-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}>
                <input 
                  type="radio" 
                  name="condition" 
                  value="Rusak" 
                  checked={selectedCondition === 'Rusak'} 
                  onChange={() => setSelectedCondition('Rusak')} 
                  className="hidden" 
                />
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">Rusak</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">Tidak dapat beroperasi</div>
              </label>

              <label className={`p-2.5 rounded-lg border cursor-pointer text-center transition-all ${
                selectedCondition === 'Dalam Pemeliharaan'
                  ? 'bg-amber-50 border-amber-500 shadow-2xs text-amber-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}>
                <input 
                  type="radio" 
                  name="condition" 
                  value="Dalam Pemeliharaan" 
                  checked={selectedCondition === 'Dalam Pemeliharaan'} 
                  onChange={() => setSelectedCondition('Dalam Pemeliharaan')} 
                  className="hidden" 
                />
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">Dalam Pemeliharaan</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">Sedang dikerjakan servis</div>
              </label>

              <label className={`p-2.5 rounded-lg border cursor-pointer text-center transition-all ${
                selectedCondition === 'Perlu Perbaikan'
                  ? 'bg-yellow-50 border-yellow-500 shadow-2xs text-yellow-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}>
                <input 
                  type="radio" 
                  name="condition" 
                  value="Perlu Perbaikan" 
                  checked={selectedCondition === 'Perlu Perbaikan'} 
                  onChange={() => setSelectedCondition('Perlu Perbaikan')} 
                  className="hidden" 
                />
                <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-1">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">Perlu Perbaikan</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">Kendala minor / degraded</div>
              </label>
            </div>

            {/* Gejala Kerusakan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Gejala / Deskripsi Kerusakan <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="Jelaskan masalah kerusakan yang terjadi..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                required
              />
              
              {/* Quick Preset Buttons */}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-400 self-center">Pilihan Cepat:</span>
                {symptomPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDamageNotes(preset)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded transition-colors cursor-pointer truncate max-w-[280px]"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Rental Claim Notification */}
            {asset.ownershipType === 'SEWA' && (
              <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 flex items-start gap-2 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-blue-900 block text-xs">
                    Perlindungan Kontrak Unit Sewa (Vendor Rental IT)
                  </span>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    Sesuai kontrak sewa nomor <strong>{asset.rentalContractNo || 'Aktif'}</strong>, kerusakan hardware ditanggung oleh <strong>{asset.rentalVendor}</strong>. Tim IT dapat mengajukan klaim perbaikan atau swap unit pengganti gratis tanpa biaya perbaikan kantor.
                  </p>
                  <label className="flex items-center gap-2 mt-1 cursor-pointer font-semibold text-blue-900 text-xs">
                    <input
                      type="checkbox"
                      checked={isRentalClaim}
                      onChange={(e) => setIsRentalClaim(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Klaimkan ke Vendor Sewa ({asset.rentalVendor})</span>
                  </label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tempat / Vendor Servis
                </label>
                <input
                  type="text"
                  value={serviceVendor}
                  onChange={(e) => setServiceVendor(e.target.value)}
                  placeholder="Nama service center resmi atau teknisi IT"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Tiket / SPK Servis
                </label>
                <input
                  type="text"
                  value={ticketNo}
                  onChange={(e) => setTicketNo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estimasi Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={estimatedCompletionDate}
                  onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-800 font-mono"
                  required
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pullToServiceLab}
                    onChange={(e) => setPullToServiceLab(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Tarik unit dari pegawai ke Lab IT Servis</span>
                </label>
              </div>
            </div>

            {/* Submit & Cancel */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Simpan Status Kerusakan / Servis</span>
              </button>
            </div>
          </form>

          {/* History of Services for this Asset */}
          {assetServiceHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Riwayat Servis & Perbaikan Perangkat Ini ({assetServiceHistory.length})</span>
              </h4>
              <div className="space-y-1.5">
                {assetServiceHistory.map((rec) => (
                  <div key={rec.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-900">{rec.ticketNo}</span>
                      <span className={`px-1.5 py-0.2 rounded font-sans font-semibold text-[10px] ${
                        rec.status === 'SELESAI' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.status === 'SELESAI' ? 'Selesai Diperbaiki' : 'Sedang Dalam Servis'}
                      </span>
                    </div>
                    <div className="text-slate-700">{rec.damageDescription}</div>
                    <div className="flex items-center justify-between text-slate-400 text-[10px] pt-0.5">
                      <span>Vendor: {rec.serviceVendor}</span>
                      <span>Lapor: {formatDateIndo(rec.reportedDate)} {rec.completedDate ? `· Selesai: ${formatDateIndo(rec.completedDate)}` : ''}</span>
                    </div>
                    {rec.resolutionNotes && (
                      <div className="text-[10px] text-emerald-700 bg-emerald-50/50 p-1 rounded font-medium">
                        Hasil: {rec.resolutionNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
