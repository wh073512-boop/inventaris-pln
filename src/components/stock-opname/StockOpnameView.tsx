import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  FileSpreadsheet, 
  Check, 
  Search,
  Filter,
  Printer,
  Trash2
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { StockOpnameSession, StockOpnameItem, DifferenceStatus } from '../../types/inventory';
import { formatDateIndo } from '../../utils/formatters';

export const StockOpnameView: React.FC = () => {
  const { 
    opnameSessions, 
    createOpnameSession, 
    updateOpnameCount, 
    reconcileOpnameItem, 
    completeOpnameSession,
    deleteOpnameSession 
  } = useInventory();

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    opnameSessions[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DISCREPANCY' | 'MATCH'>('ALL');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  // New session form
  const [newTitle, setNewTitle] = useState(`Audit Stock Opname Aset IT ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`);
  const [newScope, setNewScope] = useState<'SEMUA' | 'HANYA_ATK' | 'HANYA_IT'>('HANYA_IT');
  const [newAuditor, setNewAuditor] = useState('Ahmad Rifai & Tim IT UP Sengkang');
  const [newNotes, setNewNotes] = useState('Pemeriksaan fisik berkala unit laptop sewa, cadangan gudang, dan perangkat IT.');

  const currentSession = opnameSessions.find(s => s.id === selectedSessionId) || opnameSessions[0];

  if (!currentSession) {
    return (
      <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
        <ClipboardCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Belum Ada Sesi Stock Opname</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Mulai sesi pemeriksaan fisik untuk mencocokkan stok fisik di lapangan dengan catatan sistem.
        </p>
        <button
          onClick={() => setShowNewSessionModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold cursor-pointer"
        >
          Mulai Sesi Audit Baru
        </button>
      </div>
    );
  }

  // Calculate metrics for current session
  const totalItems = currentSession.items.length;
  const matchCount = currentSession.items.filter(i => i.difference === 0).length;
  const deficitCount = currentSession.items.filter(i => i.difference < 0).length;
  const surplusCount = currentSession.items.filter(i => i.difference > 0).length;
  const accuracyRate = totalItems > 0 ? Math.round((matchCount / totalItems) * 100) : 100;
  const pendingReconcileCount = currentSession.items.filter(i => i.difference !== 0 && !i.reconciled).length;

  const filteredItems = currentSession.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'DISCREPANCY') matchesStatus = item.difference !== 0;
    else if (statusFilter === 'MATCH') matchesStatus = item.difference === 0;

    return matchesSearch && matchesStatus;
  });

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newId = createOpnameSession(newTitle, newScope, newAuditor, newNotes);
    setSelectedSessionId(newId);
    setShowNewSessionModal(false);
  };

  const handlePrintAudit = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Laporan Audit Fisik Stock Opname Aset IT & Deteksi Selisih Real-Time
          </h2>
          <p className="text-xs text-slate-500">
            Pemeriksaan fisik unit laptop sewa, monitor, dan perangkat IT di lapangan vs sistem secara langsung, deteksi selisih (discrepancy), dan rekonsiliasi satu klik
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Session Selector */}
          <select
            value={currentSession.id}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {opnameSessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.sessionTitle} ({s.status === 'COMPLETED' ? 'Selesai' : 'Aktif'})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewSessionModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Sesi Audit Baru</span>
          </button>
        </div>
      </div>

      {/* Discrepancy KPI Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Accuracy */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Akurasi Fisik vs Sistem</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{accuracyRate}%</span>
            <span className="text-xs text-slate-500 font-mono">({matchCount}/{totalItems} Cocok)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
              style={{ width: `${accuracyRate}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Deficit (Kurang) */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Fisik Kurang (Defisit)</span>
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600">
            {deficitCount} <span className="text-xs font-sans font-medium text-slate-500">Item</span>
          </div>
          <p className="text-[11px] text-slate-500">Fisik di gudang lebih sedikit dari sistem</p>
        </div>

        {/* Metric 3: Surplus (Lebih) */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Fisik Lebih (Surplus)</span>
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {surplusCount} <span className="text-xs font-sans font-medium text-slate-500">Item</span>
          </div>
          <p className="text-[11px] text-slate-500">Fisik di gudang melebihi catatan sistem</p>
        </div>

        {/* Metric 4: Pending Reconciliation */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Perlu Rekonsiliasi</span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {pendingReconcileCount} <span className="text-xs font-sans font-medium text-slate-500">Selisih</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {currentSession.status === 'COMPLETED' ? 'Sesi Audit Telah Ditutup' : 'Dapat direkonsiliasi otomatis'}
          </p>
        </div>
      </div>

      {/* Session Header Details Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">{currentSession.sessionTitle}</h3>
            <span className="text-slate-300">·</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
              currentSession.status === 'COMPLETED' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {currentSession.status === 'COMPLETED' ? 'SELESAI DITUTUP' : 'SEDANG BERJALAN'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
            <span>Tanggal: <strong className="text-slate-700">{formatDateIndo(currentSession.date)}</strong></span>
            <span>·</span>
            <span>Auditor: <strong className="text-slate-700">{currentSession.auditorName}</strong></span>
            <span>·</span>
            <span>Cakupan: <strong className="text-slate-700">{currentSession.categoryScope}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintAudit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Lembar Audit</span>
          </button>

          {currentSession.status === 'IN_PROGRESS' ? (
            <button
              onClick={() => {
                if (window.confirm('Tutup sesi audit ini? Setelah ditutup, status akan menjadi COMPLETED.')) {
                  completeOpnameSession(currentSession.id);
                }
              }}
              className="px-3.5 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            >
              Selesaikan Sesi Audit
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('Hapus sesi audit ini dari histori?')) {
                  deleteOpnameSession(currentSession.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
              title="Hapus sesi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar for Opname Table */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode atau nama barang dalam audit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-1 rounded cursor-pointer ${statusFilter === 'ALL' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Semua Item ({currentSession.items.length})
            </button>
            <button
              onClick={() => setStatusFilter('DISCREPANCY')}
              className={`px-2 py-1 rounded cursor-pointer ${statusFilter === 'DISCREPANCY' ? 'bg-rose-100 text-rose-800 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Ada Selisih ({deficitCount + surplusCount})
            </button>
            <button
              onClick={() => setStatusFilter('MATCH')}
              className={`px-2 py-1 rounded cursor-pointer ${statusFilter === 'MATCH' ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Cocok ({matchCount})
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Ubah angka di kolom <strong className="text-slate-800">Fisik Nyata</strong> untuk mendeteksi selisih seketika
        </div>
      </div>

      {/* Main Opname Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="px-4 py-3">Kode & Nama Barang</th>
                <th className="px-4 py-3">Tipe / Kategori</th>
                <th className="px-4 py-3 text-right">Stok Sistem</th>
                <th className="px-4 py-3 text-center">Penghitungan Fisik Lapangan</th>
                <th className="px-4 py-3 text-right">Selisih (+/-)</th>
                <th className="px-4 py-3">Status Evaluasi</th>
                <th className="px-4 py-3">Keterangan / Investigasi</th>
                <th className="px-4 py-3 text-center">Rekonsiliasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada item opname yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const hasDifference = item.difference !== 0;

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors ${
                        item.difference < 0 
                          ? 'bg-rose-50/30 hover:bg-rose-50/60' 
                          : item.difference > 0 
                          ? 'bg-amber-50/30 hover:bg-amber-50/60' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono text-[11px] font-semibold text-slate-600">
                          {item.code}
                        </div>
                        <div className="font-semibold text-slate-900 mt-0.5">
                          {item.name}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-slate-500 font-semibold uppercase">
                          [{item.itemType}]
                        </span>{' '}
                        {item.category}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 text-xs tabular-nums">
                        {item.systemStock} <span className="text-[11px] font-normal text-slate-500">{item.unit}</span>
                      </td>

                      {/* Interactive Physical Counter */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              const newCount = Math.max(0, item.physicalStock - 1);
                              updateOpnameCount(currentSession.id, item.id, newCount);
                            }}
                            className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors shadow-2xs cursor-pointer text-xs"
                          >
                            -
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            value={item.physicalStock}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              updateOpnameCount(currentSession.id, item.id, val);
                            }}
                            className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const newCount = item.physicalStock + 1;
                              updateOpnameCount(currentSession.id, item.id, newCount);
                            }}
                            className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors shadow-2xs cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Real-Time Difference */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-xs whitespace-nowrap tabular-nums">
                        {item.difference === 0 ? (
                          <span className="text-emerald-600">0</span>
                        ) : item.difference > 0 ? (
                          <span className="text-amber-600">+{item.difference}</span>
                        ) : (
                          <span className="text-rose-600">{item.difference}</span>
                        )}
                      </td>

                      {/* Status indicator */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.difference === 0 ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Sesuai (Match)
                          </span>
                        ) : item.difference < 0 ? (
                          <span className="text-rose-700 font-semibold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Defisit ({Math.abs(item.difference)} {item.unit})
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Surplus (+{item.difference} {item.unit})
                          </span>
                        )}
                      </td>

                      {/* Investigation Notes input */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Catat penyebab selisih..."
                          value={item.notes || ''}
                          onChange={(e) => updateOpnameCount(currentSession.id, item.id, item.physicalStock, e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* One Click Reconciliation */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {item.reconciled ? (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Terekonsiliasi
                          </span>
                        ) : hasDifference ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Sesuaikan stok sistem untuk ${item.name} menjadi ${item.physicalStock} ${item.unit} sesuai fisik?`)) {
                                reconcileOpnameItem(currentSession.id, item.id);
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-2xs cursor-pointer"
                            title="Sesuaikan stok sistem dengan fisik nyata"
                          >
                            Sesuaikan Sistem
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            -
                          </span>
                        )}
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
            Total <strong className="text-slate-800">{currentSession.items.length}</strong> jenis item dalam sesi audit ini
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700">Cocok: <strong className="font-mono">{matchCount}</strong></span>
            <span className="text-rose-700">Kurang: <strong className="font-mono">{deficitCount}</strong></span>
            <span className="text-amber-700">Lebih: <strong className="font-mono">{surplusCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Modal Sesi Opname Baru */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Mulai Sesi Audit Stock Opname Baru</h3>
              </div>
              <button onClick={() => setShowNewSessionModal(false)} className="text-white/80 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul / Nama Sesi Audit</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cakupan Audit Inventaris</label>
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                >
                  <option value="HANYA_IT">Khusus Aset IT & Hardware (Laptop Sewa/Beli, Monitor, Switch)</option>
                  <option value="SEMUA">Semua Aset Terdaftar</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Auditor / Tim Pemeriksa</label>
                <input
                  type="text"
                  value={newAuditor}
                  onChange={(e) => setNewAuditor(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Pelaksanaan Audit</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Keterangan audit stock opname berkala"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                >
                  Mulai Audit Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
