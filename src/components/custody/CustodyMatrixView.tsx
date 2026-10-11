import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  FileText, 
  Laptop, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Printer, 
  Eye, 
  RotateCcw,
  UserPlus
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Employee, ITAsset, CustodyRecord } from '../../types/inventory';
import { formatDateIndo, formatCurrency } from '../../utils/formatters';

interface CustodyMatrixViewProps {
  onOpenBASTModal: (record: CustodyRecord) => void;
  onOpenAssignModal: (asset: ITAsset) => void;
}

export const CustodyMatrixView: React.FC<CustodyMatrixViewProps> = ({
  onOpenBASTModal,
  onOpenAssignModal
}) => {
  const { 
    employees, 
    itAssets, 
    custodyRecords, 
    returnITAsset, 
    addEmployee,
    user,
    canOperateIT,
    canEditInventory
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'matrix' | 'bast-log'>(user.role === 'VIEWER' ? 'bast-log' : 'matrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);

  // New employee state
  const [newNip, setNewNip] = useState(`9826${Math.floor(100 + Math.random() * 900)}ZY`);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('0812-');
  const [newDept, setNewDept] = useState<string>('Operasi & Pemeliharaan');
  const [newPosition, setNewPosition] = useState('');

  const departments = [
    'UP Sengkang (Management)',
    'Operasi & Pemeliharaan',
    'K3 & Keamanan',
    'Pemeliharaan',
    'Operasi',
    'Logistik & Umum',
    'Keuangan & Administrasi',
    'IT & Sistem Informasi'
  ];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredRecords = custodyRecords.filter(rec => {
    return rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rec.bastNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rec.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           rec.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    addEmployee({
      nip: newNip,
      name: newName,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '.')}@plnnusantarapower.co.id`,
      phone: newPhone,
      department: newDept,
      position: newPosition || 'Staf Operasional',
      joinedDate: new Date().toISOString().split('T')[0],
      avatarColor: '#2563eb'
    });

    setShowAddEmpModal(false);
    setNewName('');
    setNewNip(`9826${Math.floor(100 + Math.random() * 900)}ZY`);
  };

  const handleQuickReturn = (asset: ITAsset) => {
    if (window.confirm(`Proses pengembalian unit ${asset.name} (${asset.serialNumber}) ke gudang IT UP Sengkang?`)) {
      returnITAsset(
        asset.id,
        'Ahmad Rifai (IT Support UP Sengkang)',
        'Pengembalian unit dinas kerja ke pool IT UP Sengkang.',
        'Unit dicek kondisi prima.'
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Pelacakan Inventaris Karyawan & Berita Acara (BAST)
          </h2>
          <p className="text-xs text-slate-500">
            Pemantauan kepemilikan aset secara real-time, register BAST digital, dan tanda tangan serah-terima
          </p>
        </div>

        {/* Tab Switcher & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            {user.role !== 'VIEWER' && (
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'matrix'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Matriks Karyawan ({employees.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('bast-log')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bast-log'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Arsip BAST Resmi ({custodyRecords.length})</span>
            </button>
          </div>

          {canEditInventory && (
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Pegawai</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Department Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama karyawan, NIP, no BAST, atau SN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'matrix' && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Status Pelacakan: <strong className="text-emerald-700 font-medium">Aktif Sinkron</strong>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        /* Matrix Grid Karyawan & Aset yang Dipegang */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-2 p-10 text-center text-slate-400 bg-white rounded-lg border border-slate-200">
              Tidak ada data pegawai yang cocok dengan filter.
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              // Get all assets held by this employee
              const heldAssets = itAssets.filter(a => a.assignedToEmployeeId === emp.id);
              // Get latest BAST record for this employee
              const empBAST = custodyRecords.find(r => r.employeeId === emp.id);

              return (
                <div 
                  key={emp.id} 
                  className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between"
                >
                  {/* Employee Header Profile */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: emp.avatarColor || '#2563eb' }}
                      >
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{emp.name}</h3>
                        <div className="text-xs text-slate-500 font-medium">{emp.position}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {emp.nip} · {emp.department}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {heldAssets.length} Aset
                      </span>
                    </div>
                  </div>

                  {/* List of IT Assets in Custody */}
                  <div className="space-y-2 flex-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Perangkat yang Dipegang Saat Ini:</span>
                      {empBAST && (
                        <button
                          onClick={() => onOpenBASTModal(empBAST)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-normal cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Lihat Lembar BAST</span>
                        </button>
                      )}
                    </div>

                    {heldAssets.length === 0 ? (
                      <div className="p-3 bg-slate-50 rounded border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                        Belum ada perangkat inventaris IT yang dialokasikan ke karyawan ini.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {heldAssets.map(asset => (
                          <div 
                            key={asset.id} 
                            className="p-2.5 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 truncate flex items-center gap-1.5">
                                <span>{asset.name}</span>
                                {asset.ownershipType === 'SEWA' ? (
                                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                                    Sewa
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                    Beli
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-500 mt-0.5">
                                <span>{asset.assetCode}</span>
                                <span>·</span>
                                <span>SN: {asset.serialNumber}</span>
                                {asset.ownershipType === 'SEWA' && asset.rentalEndDate && (
                                  <>
                                    <span>·</span>
                                    <span className="text-blue-600 font-semibold font-sans">
                                      Akhir Sewa: {formatDateIndo(asset.rentalEndDate)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {canOperateIT && (
                              <button
                                onClick={() => handleQuickReturn(asset)}
                                className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 rounded transition-colors shrink-0 cursor-pointer"
                                title="Tarik kembali unit ke gudang IT"
                              >
                                Kembalikan
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action / Meta */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Kontak: {emp.phone}</span>
                    <span>Bergabung: {formatDateIndo(emp.joinedDate)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Register Arsip BAST Resmi */
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Buku Register Berita Acara Serah Terima (BAST) Digital
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Dokumen legal pertanggungjawaban fasilitas perusahaan yang telah diterbitkan
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Total Arsip: <strong className="text-slate-800">{custodyRecords.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="px-4 py-3">No. Registrasi BAST</th>
                  <th className="px-4 py-3">Tipe Tindakan</th>
                  <th className="px-4 py-3">Tanggal Serah Terima</th>
                  <th className="px-4 py-3">Nama Pegawai (Penerima)</th>
                  <th className="px-4 py-3">Perangkat Aset</th>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Petugas PIC IT</th>
                  <th className="px-4 py-3 text-center">Tanda Tangan</th>
                  <th className="px-4 py-3 text-center">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ditemukan arsip BAST yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {rec.bastNumber}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {rec.actionType === 'ASSIGN' ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Penyerahan Baru
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Pengembalian
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">
                        {formatDateIndo(rec.date)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{rec.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{rec.employeeNip} · {rec.employeeDept}</div>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {rec.assetName}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {rec.serialNumber}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {rec.handoverBy}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {rec.signatureDataUrl || rec.employeeSignatureDataUrl ? (
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Lengkap
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            Pending TT
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => onOpenBASTModal(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Buka Dokumen</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah Pegawai Baru */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">Registrasi Pegawai Baru</h3>
              </div>
              <button onClick={() => setShowAddEmpModal(false)} className="text-white/80 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP Pegawai</label>
                  <input
                    type="text"
                    value={newNip}
                    onChange={(e) => setNewNip(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departemen</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Hendra Wijaya"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan / Posisi</label>
                <input
                  type="text"
                  placeholder="Contoh: Frontend Developer / Staff Keuangan"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Kantor</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nama@plnnusantarapower.co.id"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Simpan Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
