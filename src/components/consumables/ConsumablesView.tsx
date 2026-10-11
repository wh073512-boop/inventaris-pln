import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  ArrowDownRight, 
  PlusCircle, 
  AlertTriangle, 
  History,
  Trash2,
  Edit,
  CheckCircle2,
  X
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { ConsumableCategory, ConsumableStock } from '../../types/inventory';
import { formatCurrency, formatDateIndo } from '../../utils/formatters';

interface ConsumablesViewProps {
  onOpenIssueModal: (itemId?: string) => void;
  onOpenRestockModal: (itemId?: string) => void;
}

export const ConsumablesView: React.FC<ConsumablesViewProps> = ({
  onOpenIssueModal,
  onOpenRestockModal
}) => {
  const { consumables, transactions, addConsumable, deleteConsumable } = useInventory();

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'history'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'LOW' | 'EMPTY'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New consumable form state
  const [newItemCode, setNewItemCode] = useState(`ATK-${Math.floor(100 + Math.random() * 900)}`);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ConsumableCategory>('Alat Tulis (Pena/Pensil)');
  const [newItemStock, setNewItemStock] = useState(20);
  const [newItemMinAlert, setNewItemMinAlert] = useState(10);
  const [newItemUnit, setNewItemUnit] = useState<'Rim' | 'Pcs' | 'Box' | 'Pack' | 'Roll' | 'Lusin'>('Pcs');
  const [newItemLocation, setNewItemLocation] = useState('Lemari GA Lt.1');
  const [newItemPrice, setNewItemPrice] = useState(15000);
  const [newItemDesc, setNewItemDesc] = useState('');

  const categories: ConsumableCategory[] = [
    'Kertas & Buku',
    'Alat Tulis (Pena/Pensil)',
    'Alat Pemotong & Gunting',
    'Pengikat & Staples',
    'Lakban & Perekat',
    'Penyimpanan & Binder'
  ];

  // Filtering
  const filteredConsumables = consumables.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    
    let matchesStatus = true;
    if (statusFilter === 'EMPTY') matchesStatus = item.currentStock === 0;
    else if (statusFilter === 'LOW') matchesStatus = item.currentStock > 0 && item.currentStock <= item.minStockAlert;
    else if (statusFilter === 'SAFE') matchesStatus = item.currentStock > item.minStockAlert;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    addConsumable({
      itemCode: newItemCode,
      name: newItemName,
      category: newItemCategory,
      currentStock: Number(newItemStock),
      minStockAlert: Number(newItemMinAlert),
      unit: newItemUnit,
      location: newItemLocation,
      unitPrice: Number(newItemPrice),
      lastRestockedDate: new Date().toISOString().split('T')[0],
      description: newItemDesc
    });

    setShowAddModal(false);
    setNewItemName('');
    setNewItemCode(`ATK-${Math.floor(100 + Math.random() * 900)}`);
  };

  const totalConsumableValue = consumables.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
  const lowCount = consumables.filter(c => c.currentStock <= c.minStockAlert).length;

  return (
    <div className="space-y-5">
      {/* View Header with Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Stok Barang Habis Pakai & ATK (SDM Umum)
          </h2>
          <p className="text-xs text-slate-500">
            Katalog perlengkapan pena, kertas, gunting, staples, dan log pengeluaran otomatis per departemen
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Katalog Stok ({consumables.length})
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Mutasi ({transactions.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'catalog' ? (
        <>
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama barang, kode (ATK-...), lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Category dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Kategori ({consumables.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-1 rounded cursor-pointer ${statusFilter === 'ALL' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('LOW')}
                  className={`px-2 py-1 rounded cursor-pointer ${statusFilter === 'LOW' ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Menipis ({lowCount})
                </button>
                <button
                  onClick={() => setStatusFilter('SAFE')}
                  className={`px-2 py-1 rounded cursor-pointer ${statusFilter === 'SAFE' ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Aman
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenIssueModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors cursor-pointer"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Keluarkan ATK</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Item Baru</span>
              </button>
            </div>
          </div>

          {/* High-Density Data Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="px-4 py-3">Kode & Nama Barang</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-right">Stok Fisik</th>
                    <th className="px-4 py-3 text-right">Batas Minimum</th>
                    <th className="px-4 py-3">Status Persediaan</th>
                    <th className="px-4 py-3">Lokasi Simpan</th>
                    <th className="px-4 py-3 text-right">Harga Satuan</th>
                    <th className="px-4 py-3 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConsumables.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Tidak ada barang ATK yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredConsumables.map((item) => {
                      const isLow = item.currentStock <= item.minStockAlert;
                      const isEmpty = item.currentStock === 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-mono text-[11px] font-semibold text-slate-500">
                              {item.itemCode}
                            </div>
                            <div className="font-medium text-slate-900 text-xs mt-0.5">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {item.category}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-xs tabular-nums text-slate-900">
                            {item.currentStock} <span className="text-[11px] font-sans font-normal text-slate-500">{item.unit}</span>
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-slate-500 tabular-nums">
                            {item.minStockAlert} {item.unit}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {isEmpty ? (
                              <span className="text-rose-600 font-semibold flex items-center gap-1 text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Stok Habis
                              </span>
                            ) : isLow ? (
                              <span className="text-amber-700 font-semibold flex items-center gap-1 text-[11px]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Menipis (Perlu PO)
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                Aman Terpenuhi
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-600 text-[11px]">
                            {item.location}
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums">
                            {formatCurrency(item.unitPrice)}
                          </td>

                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => onOpenIssueModal(item.id)}
                                disabled={item.currentStock === 0}
                                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                                  item.currentStock === 0
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                }`}
                                title="Keluarkan barang & potong stok"
                              >
                                Keluarkan
                              </button>

                              <button
                                onClick={() => onOpenRestockModal(item.id)}
                                className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
                                title="Tambah stok masuk"
                              >
                                Restock
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus item ${item.name} dari katalog?`)) {
                                    deleteConsumable(item.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Hapus item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer with stats */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div>
                Menampilkan <strong className="text-slate-800">{filteredConsumables.length}</strong> dari {consumables.length} item ATK
              </div>
              <div>
                Total Estimasi Nilai Stok Gudang: <strong className="font-mono text-slate-800 font-semibold">{formatCurrency(totalConsumableValue)}</strong>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Riwayat Mutasi Transaksi ATK */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Buku Log Mutasi Pengeluaran & Penerimaan ATK
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Audit trail lengkap setiap kali stok bertambah atau berkurang
              </p>
            </div>
            <button
              onClick={() => onOpenIssueModal()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md cursor-pointer"
            >
              Catat Pengeluaran Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-3">Tanggal & ID</th>
                  <th className="px-4 py-3">Tipe Mutasi</th>
                  <th className="px-4 py-3">Nama Barang ATK</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                  <th className="px-4 py-3">No. Bon / Referensi</th>
                  <th className="px-4 py-3">Pihak Pemohon / Sumber</th>
                  <th className="px-4 py-3">Departemen</th>
                  <th className="px-4 py-3">Catatan / Keperluan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Belum ada transaksi mutasi tercatat.
                    </td>
                  </tr>
                ) : (
                  transactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formatDateIndo(trx.date)}</div>
                        <div className="font-mono text-[10px] text-slate-400">{trx.id}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {trx.type === 'OUT' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <ArrowDownRight className="w-3 h-3" />
                            Keluar (Dipakai)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <PlusCircle className="w-3 h-3" />
                            Masuk (Restock)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {trx.consumableName}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-xs tabular-nums text-slate-900">
                        {trx.type === 'OUT' ? `-${trx.quantity}` : `+${trx.quantity}`}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        {trx.referenceNo}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {trx.requesterName}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {trx.department}
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate">
                        {trx.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah Item ATK Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Tambah Katalog ATK Baru</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Barang</label>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori ATK</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as ConsumableCategory)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Barang Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Gunting Kertas Stainless Steel 7 Inch"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batas Min (Alert)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemMinAlert}
                    onChange={(e) => setNewItemMinAlert(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  >
                    <option value="Rim">Rim</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Box">Box</option>
                    <option value="Pack">Pack</option>
                    <option value="Roll">Roll</option>
                    <option value="Lusin">Lusin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimasi Harga Satuan (IDR)</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lokasi Rak Simpan</label>
                  <input
                    type="text"
                    value={newItemLocation}
                    onChange={(e) => setNewItemLocation(e.target.value)}
                    placeholder="Lemari GA A-1"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi / Spesifikasi Singkat</label>
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Keterangan warna, ukuran, atau kegunaan khusus"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded"
                >
                  Simpan Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
