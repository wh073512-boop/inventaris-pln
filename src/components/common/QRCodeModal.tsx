import React, { useEffect, useState } from 'react';
import { X, Printer, Copy, Check, QrCode as QrIcon } from 'lucide-react';
import { ITAsset } from '../../types/inventory';
import { generateQRCodeDataUrl } from '../../utils/formatters';

interface QRCodeModalProps {
  asset: ITAsset | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ asset, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (asset) {
      // Encode structured asset payload
      const qrPayload = JSON.stringify({
        id: asset.id,
        code: asset.assetCode,
        name: asset.name,
        sn: asset.serialNumber,
        category: asset.category
      });
      generateQRCodeDataUrl(qrPayload).then(setQrDataUrl);
    }
  }, [asset]);

  if (!asset) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(asset.assetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintLabel = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <QrIcon className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Label QR Aset Fisik</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Physical Sticker Tag Preview */}
        <div className="p-6 flex flex-col items-center">
          <div 
            id="printable-label"
            className="w-full max-w-sm p-4 bg-white border-2 border-slate-900 rounded-lg shadow-sm flex flex-col items-center text-center space-y-3"
          >
            {/* Top Brand Tag */}
            <div className="w-full flex items-center justify-between border-b border-slate-300 pb-2 text-[10px] font-bold text-slate-600 tracking-wider uppercase">
              <span>INVENTRA ASSET TAG</span>
              <span>DIVISI IT & SDM</span>
            </div>

            {/* QR Code Graphic */}
            <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-center">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`QR Code ${asset.assetCode}`} 
                  className="w-44 h-44 object-contain"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                  Membuat QR Code...
                </div>
              )}
            </div>

            {/* Asset Code Title */}
            <div>
              <div className="text-base font-black tracking-wider text-slate-900 font-mono">
                {asset.assetCode}
              </div>
              <div className="text-xs font-semibold text-slate-800 line-clamp-1 mt-0.5">
                {asset.name}
              </div>
            </div>

            {/* Meta details */}
            <div className="w-full bg-slate-50 p-2.5 rounded text-[11px] text-slate-600 text-left space-y-1 border border-slate-200 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Serial Number:</span>
                <span className="font-semibold text-slate-900">{asset.serialNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Kategori:</span>
                <span className="text-slate-800">{asset.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Lokasi:</span>
                <span className="text-slate-800 truncate max-w-[170px]">{asset.location}</span>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 uppercase tracking-widest pt-1">
              Property of PT Nusantara Digital Korpora
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="no-print px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintLabel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Label Stiker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
