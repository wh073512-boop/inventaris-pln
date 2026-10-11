import React, { useState } from 'react';
import { 
  Download, 
  X, 
  CheckCircle2, 
  FileCode2, 
  Terminal, 
  FolderArchive, 
  ExternalLink,
  Laptop,
  FileSpreadsheet,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Server,
  Globe,
  Wifi,
  HardDrive,
  FileText
} from 'lucide-react';
import { downloadProjectZip } from '../../utils/projectDownloader';
import { useInventory } from '../../context/InventoryContext';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { exportCSV, exportJSON } = useInventory();
  const [activeTab, setActiveTab] = useState<'xampp' | 'nodejs' | 'data'>('xampp');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      setDownloadSuccess(false);
      setDownloadProgress(0);

      await downloadProjectZip((percent, file) => {
        setDownloadProgress(Math.round(percent));
        setCurrentFile(file);
      });

      setDownloadSuccess(true);
    } catch (err) {
      console.error('Failed to download project zip:', err);
      alert('Gagal mengunduh berkas ZIP. Silakan coba kembali.');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = (text: string, cmdKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(cmdKey);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <FolderArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Export & Pasang Aplikasi (XAMPP / Lokal)</h2>
              <p className="text-xs text-slate-300">PT PLN Nusantara Power UP Sengkang • Manajemen Aset & Hardware IT</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('xampp')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-t border-x cursor-pointer ${
              activeTab === 'xampp'
                ? 'bg-white text-blue-700 border-slate-200 border-b-transparent shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Server className="w-4 h-4 text-amber-500" />
            <span>Pasang di XAMPP htdocs</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-semibold">Bisa 100%</span>
          </button>
          
          <button
            onClick={() => setActiveTab('nodejs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-t border-x cursor-pointer ${
              activeTab === 'nodejs'
                ? 'bg-white text-blue-700 border-slate-200 border-b-transparent shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-4 h-4 text-slate-500" />
            <span>Jalankan via Node.js</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-t border-x cursor-pointer ${
              activeTab === 'data'
                ? 'bg-white text-blue-700 border-slate-200 border-b-transparent shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Data Excel / JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Main Action Box: Direct ZIP Download */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold text-blue-700 bg-blue-100 rounded-full mb-1">
                  Paket Lengkap Berkas ZIP
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Unduh Berkas Proyek & Script Otomatis XAMPP
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Termasuk seluruh kode sumber, konfigurasi Vite, file <code className="bg-blue-100/70 px-1 py-0.5 rounded text-blue-900 font-mono text-[11px]">.htaccess</code>, dan script otomatis <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono text-[11px]">salin-ke-xampp.bat</code>.
                </p>
              </div>
              <FolderArchive className="w-8 h-8 text-blue-600 shrink-0 hidden sm:block" />
            </div>

            {/* Download Button */}
            <div>
              <button
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengompresi Berkas ZIP... ({downloadProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Paket Aplikasi Lengkap (.ZIP)</span>
                  </>
                )}
              </button>

              {/* Progress bar during zipping */}
              {isDownloading && (
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-150"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-mono">
                    {currentFile || 'Menyiapkan berkas proyek...'}
                  </p>
                </div>
              )}

              {/* Success Notification */}
              {downloadSuccess && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>File ZIP berhasil diunduh!</strong> Silakan periksa folder <em>Downloads</em> di laptop/komputer Anda.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: XAMPP HTDOCS GUIDE */}
          {activeTab === 'xampp' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Jawaban: YA, 100% SANGAT BISA DIBUKA LEWAT XAMPP HTDOCS!</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Aplikasi ini sudah dikonfigurasi dengan path relatif (<code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 text-amber-800 text-[11px]">base: './'</code>) dan dilengkapi file <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 text-amber-800 text-[11px]">.htaccess</code>. Anda bisa langsung menaruh folder hasil build ke dalam <strong>htdocs</strong> di XAMPP, dan aplikasi langsung jalan tanpa perlu install Node.js di komputer pengguna!
                </p>
              </div>

              {/* Step by step instructions for XAMPP */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Langkah Memasang ke Folder C:\xampp\htdocs:
                  </h4>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 divide-y divide-slate-200 text-xs">
                  
                  {/* Step 1 */}
                  <div className="pb-3 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">1</span>
                      <span>Ekstrak File ZIP Proyek</span>
                    </div>
                    <p className="text-slate-600 pl-7 text-[11px]">
                      Klik kanan berkas <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">.zip</code> yang telah diunduh &rarr; pilih <strong>Extract All (Ekstrak Semua)</strong>.
                    </p>
                  </div>

                  {/* Step 2 (Automated vs Manual) */}
                  <div className="py-3 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">2</span>
                      <span>Opsi A: Jalankan Script Otomatis (1-Klik di Windows)</span>
                    </div>
                    <div className="pl-7 space-y-1">
                      <p className="text-slate-600 text-[11px]">
                        Cukup klik 2x file <strong><code className="font-mono bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">salin-ke-xampp.bat</code></strong> di folder hasil ekstrak. File ini akan otomatis mem-build dan menyalin ke folder XAMPP:
                      </p>
                      <div className="bg-slate-900 text-amber-300 font-mono text-[11px] p-2 rounded-md flex items-center justify-between">
                        <span>C:\xampp\htdocs\inventaris-pln</span>
                        <button 
                          onClick={() => copyToClipboard('C:\\xampp\\htdocs\\inventaris-pln', 'path')}
                          className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded hover:bg-slate-700"
                        >
                          {copiedCmd === 'path' ? 'Tersalin' : 'Salin Jalur'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 pl-7 border-t border-slate-200/60">
                      <span className="text-[11px] font-semibold text-slate-700">Opsi B: Cara Manual (via Terminal):</span>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        Ketik <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">npm run build</code>, lalu copy seluruh isi folder <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">dist</code> ke folder <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">C:\xampp\htdocs\inventaris-pln\</code>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="py-3 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">3</span>
                      <span>Nyalakan Apache di XAMPP Control Panel</span>
                    </div>
                    <p className="text-slate-600 pl-7 text-[11px]">
                      Buka aplikasi <strong>XAMPP Control Panel</strong> di komputer Anda, lalu klik tombol <strong>Start</strong> di sebelah tulisan <strong>Apache</strong>.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="pt-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">4</span>
                        <span>Buka Aplikasi di Browser</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard('http://localhost/inventaris-pln/', 'url')}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded cursor-pointer"
                      >
                        {copiedCmd === 'url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCmd === 'url' ? 'Tersalin' : 'Salin Link'}</span>
                      </button>
                    </div>
                    <div className="pl-7 space-y-1">
                      <p className="text-slate-600 text-[11px]">
                        Buka browser (Google Chrome / Edge), lalu buka link berikut:
                      </p>
                      <div className="bg-blue-50 border border-blue-200 p-2 rounded text-blue-800 font-mono text-xs font-bold">
                        http://localhost/inventaris-pln/
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* LAN / Wi-Fi Access Guide */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Wifi className="w-4 h-4 text-amber-400" />
                  <span>Akses Bersama oleh Rekan Kantor di UP Sengkang (Jaringan LAN / Wi-Fi)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Jika komputer Anda yang menjalankan XAMPP terhubung ke Wi-Fi / kabel LAN kantor PLN UP Sengkang, staf lain bisa langsung membuka aplikasi ini dari laptop mereka tanpa perlu install apapun:
                </p>
                <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-xs space-y-1 font-mono">
                  <p className="text-slate-400 text-[11px]">1. Buka cmd di PC Anda, ketik <span className="text-emerald-400">ipconfig</span> &rarr; cari IPv4 (misal: 192.168.1.50)</p>
                  <p className="text-slate-200 text-[11px]">2. Rekan kerja membuka di browser mereka: <span className="text-amber-300 font-bold">http://192.168.1.50/inventaris-pln/</span></p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NODE.JS DEV GUIDE */}
          {activeTab === 'nodejs' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cara Menjalankan Menggunakan Node.js (Mode Pengembangan)
                </h4>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 divide-y divide-slate-200 text-xs">
                
                {/* Step 1 */}
                <div className="pb-3 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px]">1</span>
                    <span>Install Node.js di Komputer (Jika Belum Ada)</span>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    Unduh gratis Node.js versi 18+ di:{' '}
                    <a 
                      href="https://nodejs.org/" 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                    >
                      nodejs.org <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>

                {/* Step 2 */}
                <div className="py-3 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px]">2</span>
                    <span>Ekstrak Berkas ZIP</span>
                  </div>
                  <p className="text-slate-600 pl-7 text-[11px]">
                    Ekstrak ke folder pilihan Anda (misalnya di <code className="font-mono">D:\inventra-it</code>).
                  </p>
                </div>

                {/* Step 3 */}
                <div className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px]">3</span>
                      <span>Install Dependencies</span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard('npm install', 'install')}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-2 py-0.5 bg-white border border-slate-200 rounded cursor-pointer"
                    >
                      {copiedCmd === 'install' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'install' ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <div className="pl-7">
                    <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-2.5 rounded-md">
                      npm install
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="pt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px]">4</span>
                      <span>Jalankan Server Lokal</span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard('npm run dev', 'run')}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-2 py-0.5 bg-white border border-slate-200 rounded cursor-pointer"
                    >
                      {copiedCmd === 'run' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'run' ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <div className="pl-7 space-y-1.5">
                    <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-2.5 rounded-md">
                      npm run dev
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Buka browser, lalu akses: <span className="font-mono font-bold text-blue-700">http://localhost:3000</span>
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: DATA EXPORT */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor Data ke Format Excel / CSV</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jika Anda hanya memerlukan berkas rekap data untuk dibuka di Microsoft Excel atau Google Sheets:
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    onClick={() => exportCSV('it')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download CSV Aset IT (Laptop, PC, AP, Switch)</span>
                  </button>
                  <button
                    onClick={() => exportCSV('custody')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>Download CSV BAST Pegawai</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>Cadangan Lengkap Database JSON</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Simpan seluruh isi database inventaris (Aset IT, data servis, BAST digital, riwayat transaksi) ke satu file JSON untuk dipindahkan ke komputer lain kapan saja.
                </p>
                <button
                  onClick={() => exportJSON()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download File Backup (.json)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            PT PLN Nusantara Power UP Sengkang • Siap untuk XAMPP Apache
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
