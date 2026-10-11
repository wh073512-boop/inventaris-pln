import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, Check, RotateCcw, ShieldCheck, PenTool } from 'lucide-react';
import { CustodyRecord } from '../../types/inventory';
import { formatDateIndo } from '../../utils/formatters';

interface BASTModalProps {
  record: CustodyRecord | null;
  onClose: () => void;
  onSaveSignature?: (recordId: string, companySig: string, employeeSig: string) => void;
}

export const BASTModal: React.FC<BASTModalProps> = ({ 
  record, 
  onClose,
  onSaveSignature 
}) => {
  if (!record) return null;

  const canvasEmployeeRef = useRef<HTMLCanvasElement>(null);
  const canvasCompanyRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingEmp, setIsDrawingEmp] = useState(false);
  const [isDrawingComp, setIsDrawingComp] = useState(false);
  const [empHasSigned, setEmpHasSigned] = useState(Boolean(record.employeeSignatureDataUrl));
  const [compHasSigned, setCompHasSigned] = useState(Boolean(record.signatureDataUrl));

  // Initialize canvas
  useEffect(() => {
    if (record.employeeSignatureDataUrl && canvasEmployeeRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasEmployeeRef.current?.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      };
      img.src = record.employeeSignatureDataUrl;
    }
    if (record.signatureDataUrl && canvasCompanyRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasCompanyRef.current?.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      };
      img.src = record.signatureDataUrl;
    }
  }, [record]);

  const startDrawing = (type: 'emp' | 'comp', e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = type === 'emp' ? canvasEmployeeRef.current : canvasCompanyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (type === 'emp') setIsDrawingEmp(true);
    else setIsDrawingComp(true);
  };

  const draw = (type: 'emp' | 'comp', e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const isDrawing = type === 'emp' ? isDrawingEmp : isDrawingComp;
    if (!isDrawing) return;
    const canvas = type === 'emp' ? canvasEmployeeRef.current : canvasCompanyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    if (type === 'emp') setEmpHasSigned(true);
    else setCompHasSigned(true);
  };

  const stopDrawing = (type: 'emp' | 'comp') => {
    if (type === 'emp') setIsDrawingEmp(false);
    else setIsDrawingComp(false);
  };

  const clearCanvas = (type: 'emp' | 'comp') => {
    const canvas = type === 'emp' ? canvasEmployeeRef.current : canvasCompanyRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (type === 'emp') setEmpHasSigned(false);
    else setCompHasSigned(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSignatures = () => {
    if (!onSaveSignature) return;
    const compSig = canvasCompanyRef.current?.toDataURL() || '';
    const empSig = canvasEmployeeRef.current?.toDataURL() || '';
    onSaveSignature(record.id, compSig, empSig);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Dokumen Resmi Berita Acara Serah Terima (BAST)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official BAST Document Content */}
        <div className="p-8 sm:p-10 space-y-6 text-slate-800 bg-white text-xs leading-relaxed" id="printable-bast">
          {/* Header Surat */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900 uppercase">
                PT PLN NUSANTARA POWER
              </div>
              <div className="text-xs font-bold text-blue-900 uppercase">
                UNIT PEMBANGKITAN (UP) SENGKANG
              </div>
              <div className="text-[10px] text-slate-600">
                Jl. Poros Sengkang - Bone Km. 18, Desa Patila, Kec. Pammana, Kab. Wajo, Sulawesi Selatan 90971
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-600">FORM BAST IT-PLN-SKG</span>
              <div className="text-xs font-mono font-bold text-slate-900 mt-1">{record.bastNumber}</div>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div className="text-center space-y-1">
            <h1 className="text-base font-bold uppercase tracking-wider text-slate-900 underline">
              {record.actionType === 'ASSIGN' 
                ? 'BERITA ACARA SERAH TERIMA INVENTARIS PERANGKAT KERJA'
                : 'BERITA ACARA PENGEMBALIAN INVENTARIS PERANGKAT KERJA'}
            </h1>
            <p className="text-[11px] text-slate-600">
              Nomor Registrasi: <span className="font-mono font-semibold">{record.bastNumber}</span>
            </p>
          </div>

          {/* Paragraf Pembuka */}
          <p>
            Pada hari ini, <strong className="font-semibold">{formatDateIndo(record.date)}</strong>, telah dilakukan serah terima barang inventaris operasional kedinasan PT PLN Nusantara Power UP Sengkang antara pihak-pihak sebagai berikut:
          </p>

          {/* Data Pihak */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">PIHAK PERTAMA (Penyerah / IT & TIK):</div>
              <div className="flex"><span className="w-28 text-slate-600">Nama PIC</span>: <strong className="ml-1 text-slate-800">{record.handoverBy}</strong></div>
              <div className="flex"><span className="w-28 text-slate-600">Unit Kerja</span>: <span className="ml-1">PT PLN Nusantara Power UP Sengkang</span></div>
              <div className="flex"><span className="w-28 text-slate-600">Status</span>: <span className="ml-1">Pengelola & Penanggung Jawab Aset IT</span></div>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">PIHAK KEDUA (Penerima / Karyawan):</div>
              <div className="flex"><span className="w-28 text-slate-600">Nama Lengkap</span>: <strong className="ml-1 text-slate-800">{record.employeeName}</strong></div>
              <div className="flex"><span className="w-28 text-slate-600">NIP</span>: <span className="ml-1 font-mono">{record.employeeNip}</span></div>
              <div className="flex"><span className="w-28 text-slate-600">Departemen</span>: <span className="ml-1">{record.employeeDept}</span></div>
            </div>
          </div>

          {/* Rincian Aset */}
          <div className="space-y-2">
            <div className="font-bold text-slate-900">Rincian Perangkat / Barang Inventaris:</div>
            <table className="w-full border-collapse border border-slate-300 text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 px-3 py-2">Kode Aset</th>
                  <th className="border border-slate-300 px-3 py-2">Deskripsi Perangkat</th>
                  <th className="border border-slate-300 px-3 py-2">Status Kepemilikan</th>
                  <th className="border border-slate-300 px-3 py-2">Nomor Seri (SN)</th>
                  <th className="border border-slate-300 px-3 py-2">Kondisi Fisik</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-2 font-mono font-medium">{record.assetCode}</td>
                  <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-900">{record.assetName}</td>
                  <td className="border border-slate-300 px-3 py-2">
                    {record.ownershipType === 'SEWA' ? (
                      <span className="font-medium text-blue-700">
                        Unit Sewa ({record.rentalVendor || 'Vendor Rental'})
                      </span>
                    ) : (
                      <span className="font-medium text-slate-700">
                        Aset Milik Perusahaan
                      </span>
                    )}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 font-mono">{record.serialNumber}</td>
                  <td className="border border-slate-300 px-3 py-2">{record.conditionNotes || 'Baik / Normal'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Catatan & Ketentuan */}
          <div className="space-y-1.5 text-[11px] text-slate-600 bg-amber-50/60 p-3 rounded border border-amber-200/60">
            <strong className="text-amber-900 font-semibold block">Ketentuan Pemegang Fasilitas Kerja:</strong>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Pihak Kedua bertanggung jawab penuh atas pemeliharaan dan keamanan aset selama masa kerja dinas.</li>
              {record.ownershipType === 'SEWA' && (
                <li className="text-blue-900 font-medium">
                  Perangkat ini merupakan <strong>Unit Sewa (Rental IT)</strong>. Dilarang merusak stiker segel vendor atau membongkar komponen hardware tanpa otorisasi IT Support.
                </li>
              )}
              <li>Aset wajib dikembalikan dalam kondisi baik kepada Tim IT/GA apabila terjadi pengunduran diri atau mutasi.</li>
              <li>Catatan Serah Terima: {record.notes || '-'}</li>
            </ol>
          </div>

          {/* Tanda Tangan Elektronik */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>Lembar Pengesahan Tanda Tangan:</span>
              <span className="no-print text-[11px] font-normal text-slate-500 italic">
                (Goreskan tanda tangan digital langsung pada kotak di bawah)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Kolom PIC IT */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 block">PIHAK PERTAMA (IT Support / GA)</span>
                
                <div className="relative w-full h-28 bg-white rounded border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  <canvas
                    ref={canvasCompanyRef}
                    width={320}
                    height={112}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={(e) => startDrawing('comp', e)}
                    onMouseMove={(e) => draw('comp', e)}
                    onMouseUp={() => stopDrawing('comp')}
                    onMouseLeave={() => stopDrawing('comp')}
                    onTouchStart={(e) => startDrawing('comp', e)}
                    onTouchMove={(e) => draw('comp', e)}
                    onTouchEnd={() => stopDrawing('comp')}
                  />
                  {!compHasSigned && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 text-[11px]">
                      <PenTool className="w-4 h-4 mb-1" />
                      <span>Tanda tangan di sini</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-800 text-xs">({record.handoverBy})</span>
                  <button
                    type="button"
                    onClick={() => clearCanvas('comp')}
                    className="no-print text-[10px] text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {/* Kolom Karyawan */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-center space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 block">PIHAK KEDUA (Karyawan Penerima)</span>
                
                <div className="relative w-full h-28 bg-white rounded border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  <canvas
                    ref={canvasEmployeeRef}
                    width={320}
                    height={112}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={(e) => startDrawing('emp', e)}
                    onMouseMove={(e) => draw('emp', e)}
                    onMouseUp={() => stopDrawing('emp')}
                    onMouseLeave={() => stopDrawing('emp')}
                    onTouchStart={(e) => startDrawing('emp', e)}
                    onTouchMove={(e) => draw('emp', e)}
                    onTouchEnd={() => stopDrawing('emp')}
                  />
                  {!empHasSigned && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 text-[11px]">
                      <PenTool className="w-4 h-4 mb-1" />
                      <span>Tanda tangan di sini</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-800 text-xs">({record.employeeName})</span>
                  <button
                    type="button"
                    onClick={() => clearCanvas('emp')}
                    className="no-print text-[10px] text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="no-print px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Tanda tangan digital tersimpan otomatis ke rekam histori penanggung jawab.
          </div>
          <div className="flex items-center gap-2">
            {onSaveSignature && (
              <button
                onClick={handleSaveSignatures}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Tanda Tangan BAST</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
