import React, { useState } from 'react';
import { X, Plus, Laptop, Building2, Wallet, AlertTriangle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { ITAssetCategory, AssetCondition, OwnershipType } from '../../types/inventory';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose }) => {
  const { addITAsset, employees } = useInventory();

  const [assetCode, setAssetCode] = useState(`AST-IT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ITAssetCategory>('Laptop');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [macOrIp, setMacOrIp] = useState('');
  const [specs, setSpecs] = useState('');
  const [assignedToEmployeeId, setAssignedToEmployeeId] = useState<string>('');
  const [condition, setCondition] = useState<AssetCondition>('Baik');

  // Ownership Type (Default to 'SEWA' for laptops as requested by user)
  const [ownershipType, setOwnershipType] = useState<OwnershipType>('SEWA');
  
  // Rental Fields
  const [rentalVendor, setRentalVendor] = useState('PT Mitra Rental Infotama');
  const [rentalContractNo, setRentalContractNo] = useState(`KNT/RENT-IT/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`);
  const [rentalStartDate, setRentalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [rentalEndDate, setRentalEndDate] = useState(`${new Date().getFullYear() + 2}-12-31`);
  const [monthlyRentalPrice, setMonthlyRentalPrice] = useState(850000);

  // Purchase Fields
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState(15000000);
  const [warrantyUntil, setWarrantyUntil] = useState(`${new Date().getFullYear() + 3}-12-31`);

  const [location, setLocation] = useState('Gudang IT Server Room (Pool Siap Pakai)');
  const [notes, setNotes] = useState('');

  // Damage / Service fields if registering broken unit
  const [damageNotes, setDamageNotes] = useState('');
  const [serviceVendorInput, setServiceVendorInput] = useState('');
  const [serviceTicketNoInput, setServiceTicketNoInput] = useState('');

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: ITAssetCategory) => {
    setCategory(newCat);
    // For laptops, auto-suggest 'SEWA' (rental), while non-laptop hardware defaults to 'BELI'
    if (newCat === 'Laptop') {
      setOwnershipType('SEWA');
    } else {
      setOwnershipType('BELI');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !serialNumber) {
      alert('Nama perangkat dan Serial Number wajib diisi.');
      return;
    }

    addITAsset({
      assetCode,
      name,
      category,
      brand,
      model,
      serialNumber,
      macOrIp: macOrIp || undefined,
      specs,
      assignedToEmployeeId: assignedToEmployeeId ? assignedToEmployeeId : null,
      assignedDate: assignedToEmployeeId ? new Date().toISOString().split('T')[0] : undefined,
      condition,
      ownershipType,
      // Rental or Purchase fields
      rentalVendor: ownershipType === 'SEWA' ? rentalVendor : undefined,
      rentalContractNo: ownershipType === 'SEWA' ? rentalContractNo : undefined,
      rentalStartDate: ownershipType === 'SEWA' ? rentalStartDate : undefined,
      rentalEndDate: ownershipType === 'SEWA' ? rentalEndDate : undefined,
      monthlyRentalPrice: ownershipType === 'SEWA' ? Number(monthlyRentalPrice) : undefined,
      purchaseDate: ownershipType === 'BELI' ? purchaseDate : undefined,
      purchasePrice: ownershipType === 'BELI' ? Number(purchasePrice) : undefined,
      warrantyUntil: ownershipType === 'BELI' ? warrantyUntil : undefined,
      location: condition === 'Rusak' ? 'Lab IT Perbaikan & Servis Lt.1' : location,
      notes: notes || (ownershipType === 'SEWA' ? `Unit sewa dari ${rentalVendor}.` : 'Aset dinas PT PLN Nusantara Power UP Sengkang.'),
      // Kerusakan & Servis
      damageNotes: condition !== 'Baik' ? damageNotes : undefined,
      serviceVendor: condition !== 'Baik' ? (serviceVendorInput || (ownershipType === 'SEWA' ? rentalVendor : 'Pusat Servis Resmi')) : undefined,
      serviceTicketNo: condition !== 'Baik' ? (serviceTicketNoInput || `SRV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`) : undefined,
      serviceStartDate: condition !== 'Baik' ? new Date().toISOString().split('T')[0] : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-blue-600 text-white">
          <div className="flex items-center gap-2">
            <Laptop className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-sm font-bold">Registrasi Aset IT Baru</h3>
              <p className="text-[11px] text-blue-100">Pencatatan perangkat laptop sewa (rental) atau aset beli</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Status Kepemilikan (Sewa vs Beli) Highlighted */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800">
              Status Pengadaan & Kepemilikan:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-all ${
                ownershipType === 'SEWA' 
                  ? 'bg-blue-50/80 border-blue-500 shadow-2xs' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="ownershipType"
                  value="SEWA"
                  checked={ownershipType === 'SEWA'}
                  onChange={() => setOwnershipType('SEWA')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Disewa / Rental IT (Mayoritas Laptop)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Unit disediakan oleh vendor rental dengan kontrak berkala & garansi penggantian.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition-all ${
                ownershipType === 'BELI' 
                  ? 'bg-blue-50/80 border-blue-500 shadow-2xs' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="ownershipType"
                  value="BELI"
                  checked={ownershipType === 'BELI'}
                  onChange={() => setOwnershipType('BELI')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-slate-600" />
                    <span>Dibeli (Milik Perusahaan / CapEx)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Aset permanen inventaris kantor (switch jaringan, server, printer, atau laptop beli khusus).
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kode Aset <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori Perangkat <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ITAssetCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Laptop">Laptop (Umumnya Sewa / Dinas)</option>
                <option value="Desktop PC">Desktop PC (Komputer Kerja)</option>
                <option value="Access Point">Access Point (AP Wi-Fi)</option>
                <option value="Switch">Switch (Perangkat Jaringan)</option>
                <option value="Perangkat Jaringan">Perangkat Jaringan Lainnya (Router/Modem)</option>
                <option value="Monitor">Monitor</option>
                <option value="Printer & Scanner">Printer & Scanner</option>
                <option value="Aksesori & Periferal">Aksesori & Periferal</option>
                <option value="Server & Storage">Server & Storage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap Perangkat <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Lenovo ThinkPad T14 Gen 4"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Merk / Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Lenovo, Dell, Asus"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Model / Varian</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ThinkPad T14"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Serial Number (SN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="PF3X1998K2"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800"
                required
              />
            </div>
          </div>

          {/* Conditional Fields based on SEWA vs BELI */}
          {ownershipType === 'SEWA' ? (
            <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-200 space-y-3">
              <span className="font-bold text-blue-900 block text-xs">
                Rincian Kontrak Sewa Vendor Rental IT:
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Vendor Rental</label>
                  <input
                    type="text"
                    value={rentalVendor}
                    onChange={(e) => setRentalVendor(e.target.value)}
                    placeholder="PT Mitra Rental Infotama"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Kontrak Sewa</label>
                  <input
                    type="text"
                    value={rentalContractNo}
                    onChange={(e) => setRentalContractNo(e.target.value)}
                    placeholder="KNT/RENT-IT/2026/04-09"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya Sewa / Bulan (IDR)</label>
                  <input
                    type="number"
                    value={monthlyRentalPrice}
                    onChange={(e) => setMonthlyRentalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai Sewa</label>
                  <input
                    type="date"
                    value={rentalStartDate}
                    onChange={(e) => setRentalStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Waktu Akhir Sewa (Jatuh Tempo) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={rentalEndDate}
                    onChange={(e) => setRentalEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                    <span className="text-slate-400">Set Masa:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 1);
                        setRentalEndDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      +1 Thn
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 2);
                        setRentalEndDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      +2 Thn
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 3);
                        setRentalEndDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      +3 Thn
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block text-xs">
                Rincian Pembelian Aset Milik Perusahaan (CapEx):
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Beli Satuan (IDR)</label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembelian</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Garansi Hingga</label>
                  <input
                    type="date"
                    value={warrantyUntil}
                    onChange={(e) => setWarrantyUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MAC Address / IP Jaringan</label>
              <input
                type="text"
                value={macOrIp}
                onChange={(e) => setMacOrIp(e.target.value)}
                placeholder="FC:34:97:11:0A:88"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kondisi Fisik</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as AssetCondition)}
                className={`w-full px-3 py-2 border rounded-md font-medium text-xs ${
                  condition === 'Rusak' 
                    ? 'bg-rose-50 text-rose-800 border-rose-400 font-bold' 
                    : condition === 'Dalam Pemeliharaan'
                    ? 'bg-amber-50 text-amber-800 border-amber-400 font-bold'
                    : 'bg-white text-slate-800 border-slate-300'
                }`}
              >
                <option value="Baik">Baik (Normal Siap Pakai)</option>
                <option value="Rusak">🚨 Rusak (Butuh Servis / Klaim)</option>
                <option value="Dalam Pemeliharaan">🔧 Dalam Pemeliharaan / Servis</option>
                <option value="Perlu Perbaikan">⚠️ Perlu Perbaikan (Degraded)</option>
              </select>
            </div>
          </div>

          {/* If condition is broken or in maintenance, show damage symptoms input */}
          {condition !== 'Baik' && (
            <div className="p-3.5 bg-rose-50/70 rounded-lg border border-rose-300 space-y-3">
              <span className="font-bold text-rose-900 block text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Rincian Kerusakan & Rencana Servis Perangkat:</span>
              </span>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gejala / Kerusakan yang Dialami <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder={category === 'Printer & Scanner' ? "Contoh: Roller printer aus & kertas macet terus menerus, butuh pergantian drum" : "Contoh: Layar laptop blank hitam, motherboard mati kena cipratan air"}
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-md text-slate-800 text-xs"
                  required={condition === 'Rusak'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pusat Servis / Vendor Penanganan</label>
                  <input
                    type="text"
                    value={serviceVendorInput}
                    onChange={(e) => setServiceVendorInput(e.target.value)}
                    placeholder={ownershipType === 'SEWA' ? `${rentalVendor} (Klaim Swap Sewa)` : "Service Center Resmi"}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Tiket / SPK (Opsional)</label>
                  <input
                    type="text"
                    value={serviceTicketNoInput}
                    onChange={(e) => setServiceTicketNoInput(e.target.value)}
                    placeholder="SRV-2026-081"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Spesifikasi Detail Hardware</label>
            <textarea
              rows={2}
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              placeholder="Contoh: Core i7-1355U, 16GB RAM DDR4, 512GB NVMe SSD, Layar 14 Inch IPS FHD"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alokasikan Langsung ke Karyawan?</label>
              <select
                value={assignedToEmployeeId}
                onChange={(e) => setAssignedToEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
              >
                <option value="">Belum Dialokasikan (Simpan di Pool Gudang)</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lokasi Fisik Unit</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Gudang IT Server Room Rak L-1"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800"
              />
            </div>
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
              <Plus className="w-4 h-4" />
              <span>Simpan Aset IT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
