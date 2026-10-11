import React, { useState } from 'react';
import { X, PlusCircle, Package } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedConsumableId?: string;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  preselectedConsumableId
}) => {
  const { consumables, restockConsumable } = useInventory();

  const [selectedItemId, setSelectedItemId] = useState(preselectedConsumableId || consumables[0]?.id || '');
  const [quantity, setQuantity] = useState(10);
  const [referenceNo, setReferenceNo] = useState(`PO-IN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [notes, setNotes] = useState('Penerimaan pasokan restock rutin dari supplier');

  if (!isOpen) return null;

  const currentItem = consumables.find(c => c.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0) return;

    restockConsumable(selectedItemId, Number(quantity), referenceNo, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-sm font-bold">Penerimaan Barang Masuk (Restock ATK)</h3>
              <p className="text-[11px] text-emerald-100">Menambah jumlah stok fisik di gudang</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Barang yang Ditambah Stok <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {consumables.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.itemCode}] {item.name} (Stok Saat Ini: {item.currentStock} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jumlah Masuk ({currentItem?.unit || 'Unit'}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor PO / Bukti Masuk
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Pengadaan / Sumber Supplier
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pembelian via Toko ATK Sejahtera / Tender Pengadaan Q1"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="px-5 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan Stok Masuk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
