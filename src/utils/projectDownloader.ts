import JSZip from 'jszip';

export type ProjectDownloadProgress = (percent: number, file: string) => void;

export async function downloadProjectZip(onProgress?: ProjectDownloadProgress): Promise<void> {
  const zip = new JSZip();

  const fileEntries = [
    {
      path: 'README.txt',
      content: [
        'PT PLN Nusantara Power UP Sengkang - Sistem Manajemen Aset & Hardware IT',
        '',
        'Aplikasi ini dapat dijalankan melalui XAMPP atau Node.js sesuai panduan README.',
        'Untuk penggunaan kantor, tempatkan hasil build di folder htdocs dan akses via localhost.',
        '',
        'File ini dibuat secara otomatis dari aplikasi inventaris untuk memudahkan distribusi.',
      ].join('\n')
    },
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'inventaris-pln',
        private: true,
        version: '1.0.0',
        scripts: {
          dev: 'vite --port=3000 --host=0.0.0.0',
          build: 'vite build',
          preview: 'vite preview'
        }
      }, null, 2)
    },
    {
      path: 'panduan.txt',
      content: [
        'Cara instalasi:',
        '1. Jalankan npm install',
        '2. Jalankan npm run build',
        '3. Copy isi folder dist ke C:\\xampp\\htdocs\\inventaris-pln',
        '4. Aktifkan Apache di XAMPP',
        '5. Akses http://localhost/inventaris-pln/'
      ].join('\n')
    }
  ];

  for (let index = 0; index < fileEntries.length; index += 1) {
    const entry = fileEntries[index];
    zip.file(entry.path, entry.content);
    onProgress?.(Math.round(((index + 1) / fileEntries.length) * 100), entry.path);
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'inventaris-pln-paket.zip';
  anchor.click();
  URL.revokeObjectURL(url);

  onProgress?.(100, 'inventaris-pln-paket.zip');
}
