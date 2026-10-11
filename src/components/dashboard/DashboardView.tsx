import React from 'react';
import { 
  Laptop, 
  Building2, 
  Users, 
  QrCode, 
  ClipboardCheck, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  Layers, 
  AlertTriangle,
  Calendar,
  Wrench,
  Printer,
  Wifi,
  Server
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatDateIndo, getLeaseExpiryStatus } from '../../utils/formatters';

interface DashboardViewProps {
  onOpenAddAssetModal: () => void;
  onOpenQRCodeModal: (asset: any) => void;
  onOpenServiceModal?: (asset: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddAssetModal,
  onOpenQRCodeModal,
  onOpenServiceModal
}) => {
  const { 
    itAssets, 
    employees, 
    custodyRecords, 
    opnameSessions,
    setActiveTab,
    resolveAssetService,
    user,
    canOperateIT,
    canEditInventory
  } = useInventory();

  // Metrics
  const rentalITAssets = itAssets.filter(a => a.ownershipType === 'SEWA');
  const ownedITAssets = itAssets.filter(a => a.ownershipType === 'BELI');
  const assignedITCount = itAssets.filter(a => a.assignedToEmployeeId !== null).length;
  const poolITCount = itAssets.filter(a => a.assignedToEmployeeId === null && a.condition === 'Baik').length;

  // Broken or In Service assets
  const brokenOrInServiceAssets = itAssets.filter(a => a.condition !== 'Baik');

  // Sorted rental assets by nearest lease end date
  const sortedRentalAssets = [...rentalITAssets].sort((a, b) => {
    const timeA = a.rentalEndDate ? new Date(a.rentalEndDate).getTime() : 9999999999999;
    const timeB = b.rentalEndDate ? new Date(b.rentalEndDate).getTime() : 9999999999999;
    return timeA - timeB;
  });

  const urgentLeases = rentalITAssets.filter(a => getLeaseExpiryStatus(a.rentalEndDate).isUrgent);
  const upcomingLeases = rentalITAssets.filter(a => getLeaseExpiryStatus(a.rentalEndDate).isUpcoming);

  const activeOpname = opnameSessions.find(s => s.status === 'IN_PROGRESS');
  const opnameDiscrepancies = activeOpname 
    ? activeOpname.items.filter(i => i.difference !== 0 && !i.reconciled) 
    : [];

  // Group assets by department
  const deptDistribution: Record<string, number> = {};
  itAssets.forEach(a => {
    if (a.assignedToEmployeeId) {
      const emp = employees.find(e => e.id === a.assignedToEmployeeId);
      const dept = emp ? emp.department : 'Lainnya';
      deptDistribution[dept] = (deptDistribution[dept] || 0) + 1;
    }
  });

  if (user.role === 'VIEWER') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ringkasan Inventaris</h2>
          <p className="mt-1 text-sm text-slate-500">Ringkasan data aset dan dokumen serah terima.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Aset IT', value: itAssets.length },
            { label: 'Aset Laptop Sewa', value: rentalITAssets.length },
            { label: 'Aset Dipegang Pegawai', value: assignedITCount },
            { label: 'Dokumen BAST', value: custodyRecords.length },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="font-bold text-blue-950">Pemeriksaan BAST</h3>
          <p className="mt-1 text-sm text-blue-800">Buka arsip untuk memeriksa kelengkapan dokumen dan tanda tangan.</p>
          <button
            onClick={() => setActiveTab('custody')}
            className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Buka arsip BAST
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total IT Assets */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Aset IT & Hardware</span>
            <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {itAssets.length} <span className="text-xs font-sans font-medium text-slate-500">Unit</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Laptop, Monitor, Switch Jaringan, Printer
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Dipegang: <strong className="font-mono tabular-nums text-slate-900">{assignedITCount}</strong></span>
            <span>Pool Gudang: <strong className="font-mono tabular-nums text-emerald-700">{poolITCount}</strong></span>
          </div>
        </div>

        {/* Card 2: Rental Assets + Waktu Akhir Sewa Status */}
        <div className="bg-white p-5 rounded-lg border border-blue-200 bg-blue-50/20 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Laptop Sewa (Rental IT)</span>
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
              Mayoritas ({rentalITAssets.length} Unit)
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums">
              {rentalITAssets.length} <span className="text-xs font-sans font-medium text-slate-600">Unit Sewa</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {upcomingLeases.length > 0 ? (
                <span className="text-amber-700 font-medium">
                  {upcomingLeases.length} unit mendekati waktu akhir sewa
                </span>
              ) : (
                <span>Semua kontrak sewa vendor berjalan aman</span>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Dibeli CapEx: <strong className="text-slate-800 font-semibold">{ownedITAssets.length} unit</strong></span>
            {canOperateIT && (
              <button
                onClick={() => setActiveTab('it-assets')}
                className="text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
              >
                Lihat Akhir Sewa →
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Employee Custody */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventaris Pegawai</span>
            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {employees.length} <span className="text-xs font-sans font-medium text-slate-500">Pegawai Aktif</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              BAST Terbit: <strong className="font-semibold text-slate-700 font-mono tabular-nums">{custodyRecords.length}</strong> dokumen sah
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Pelacakan: <strong className="text-emerald-600 font-medium">BAST Digital</strong></span>
            <button
              onClick={() => setActiveTab('custody')}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
            >
              Buka Matriks →
            </button>
          </div>
        </div>

        {/* Card 4: Status Pemeliharaan & Servis */}
        <div className={`p-5 rounded-lg border shadow-2xs space-y-3 ${
          brokenOrInServiceAssets.length > 0 
            ? 'bg-rose-50/30 border-rose-200' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-rose-600" />
              <span>Unit Rusak & Servis</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              brokenOrInServiceAssets.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {brokenOrInServiceAssets.length > 0 ? `${brokenOrInServiceAssets.length} Butuh Servis` : 'Normal 100%'}
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {brokenOrInServiceAssets.length} <span className="text-xs font-sans font-medium text-slate-500">Perangkat</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {brokenOrInServiceAssets.length > 0 ? (
                <span>Termasuk printer & unit laptop klaim servis</span>
              ) : (
                <span>Semua perangkat berfungsi prima</span>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Lab IT Servis</span>
            {canOperateIT && (
              <button
                onClick={() => setActiveTab('it-assets')}
                className="text-rose-600 hover:text-rose-800 font-semibold hover:underline cursor-pointer"
              >
                Daftar Servis →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NEW SECTION: Perangkat Rusak & Butuh Service Alert Widget (Printer & Laptop Klaim) */}
      {brokenOrInServiceAssets.length > 0 && (
        <div className="bg-white rounded-lg border border-rose-200 p-5 shadow-2xs space-y-3 bg-gradient-to-r from-rose-50/40 via-white to-amber-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Perhatian IT: Perangkat Rusak & Butuh Servis ({brokenOrInServiceAssets.length} Unit)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Perangkat dalam status penanganan perbaikan teknisi atau proses klaim garansi vendor rental
                </p>
              </div>
            </div>

            {canOperateIT && (
              <button
                onClick={() => setActiveTab('it-assets')}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer self-start sm:self-auto"
              >
                Buka Inventaris Servis →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {brokenOrInServiceAssets.map((asset) => (
              <div 
                key={asset.id} 
                className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-blue-700">{asset.assetCode}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-semibold text-slate-900 truncate">{asset.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {asset.category} · {asset.ownershipType === 'SEWA' ? `Unit Sewa (${asset.rentalVendor})` : 'Aset Dibeli'}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    asset.condition === 'Rusak' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {asset.condition}
                  </span>
                </div>

                {asset.damageNotes && (
                  <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
                    <strong>Gejala:</strong> {asset.damageNotes}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="truncate max-w-[200px]">
                    Vendor: {asset.serviceVendor || 'Lab IT Internal'}
                  </span>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {canOperateIT && (
                      <button
                        onClick={() => resolveAssetService(asset.id, 'Perbaikan unit diverifikasi selesai melalui dashboard.')}
                        className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        title="Tandai unit telah selesai diperbaiki & kembali normal"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Selesai Servis</span>
                      </button>
                    )}

                    {canOperateIT && onOpenServiceModal && (
                      <button
                        onClick={() => onOpenServiceModal(asset)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Wrench className="w-3 h-3 text-amber-400" />
                        <span>Kelola Servis</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Interactive Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-lg p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-bold tracking-tight">Pusat Operasional Aset IT & Fasilitas Pegawai</h2>
          <p className="text-xs text-slate-300">
            Daftarkan unit laptop sewa baru, monitor waktu jatuh tempo sewa, dan catat servis perangkat rusak.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {canEditInventory && (
            <button
              onClick={onOpenAddAssetModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Aset IT Baru</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('custody')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-medium rounded-md transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Matriks Pegawai & BAST</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Rental Expiration Schedule & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Rental Contracts & Lease Expiration Schedule */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Monitoring Waktu Akhir Sewa Laptop & Vendor</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Urutan berdasarkan tanggal jatuh tempo kontrak sewa terdekat untuk renewal atau return unit
              </p>
            </div>
            <button
              onClick={() => setActiveTab('it-assets')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Lihat Semua ({rentalITAssets.length} Sewa)
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {sortedRentalAssets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada data laptop sewa tercatat.
              </div>
            ) : (
              sortedRentalAssets.map((asset) => {
                const holder = employees.find(e => e.id === asset.assignedToEmployeeId);
                const leaseStatus = getLeaseExpiryStatus(asset.rentalEndDate);

                return (
                  <div key={asset.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700">
                          {asset.assetCode}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {asset.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">Vendor: {asset.rentalVendor || 'Vendor Rental IT'}</span>
                        <span>·</span>
                        <span className="font-mono text-[10px]">{asset.rentalContractNo || '-'}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
                        <span>Pemegang:</span>
                        {holder ? (
                          <strong className="text-slate-800 font-semibold">{holder.name} ({holder.department})</strong>
                        ) : (
                          <span className="text-emerald-700 font-medium">Tersedia di Gudang IT (Siap Alokasi)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right space-y-0.5">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Waktu Akhir Sewa:</div>
                        <div className="font-mono text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                          <Calendar className="w-3 h-3 text-blue-600" />
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

                      <div className="flex items-center gap-1">
                        {canOperateIT && (
                          <button
                            onClick={() => onOpenQRCodeModal(asset)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded transition-colors cursor-pointer"
                            title="Lihat Label QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Department Distribution & Recent BAST Logs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Widget 1: Distribution by Department */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Distribusi Aset per Departemen</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {assignedITCount} Terdistribusi
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {Object.entries(deptDistribution).map(([dept, count]) => {
                const percent = Math.round((count / (assignedITCount || 1)) * 100);

                return (
                  <div key={dept} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium truncate max-w-[200px]">{dept}</span>
                      <span className="font-mono font-bold text-slate-900">{count} Unit ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Widget 2: Recent BAST Handover Records */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Dokumen BAST Serah Terima Terkini</span>
              </h3>
              <button
                onClick={() => setActiveTab('custody')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
              >
                Semua BAST →
              </button>
            </div>

            <div className="space-y-2">
              {custodyRecords.slice(0, 3).map((rec) => (
                <div key={rec.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700 text-[11px]">{rec.bastNumber}</span>
                    <span className="font-mono text-[10px] text-slate-400">{formatDateIndo(rec.date)}</span>
                  </div>
                  <div className="font-semibold text-slate-800">
                    {rec.assetName} → <span className="text-slate-900">{rec.employeeName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                    <span>{rec.employeeDept}</span>
                    <span className="text-emerald-700 font-medium">Sah Ditandatangani</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
