# PT PLN Nusantara Power UP Sengkang - Sistem Manajemen Aset & Hardware IT

Aplikasi Sistem Inventaris Aset IT (Laptop Sewa/Beli, Desktop PC, Access Point, Switch, Monitor, Printer), Riwayat Servis & Perbaikan, serta BAST Digital Pegawai PT PLN Nusantara Power UP Sengkang.

---

## 🌐 METODE 1: MENJALANKAN DI XAMPP HTDOCS (SANGAT DIREKOMENDASIKAN UNTUK KANTOR)

Aplikasi ini **100% kompatibel dan siap dibuka melalui XAMPP htdocs** tanpa perlu install Node.js di komputer pengguna akhir!

### Cara 1: Menggunakan Script Otomatis (Windows 1-Klik)
1. Ekstrak file ZIP ini ke komputer Anda.
2. Klik dua kali file **`salin-ke-xampp.bat`**.
3. Script akan mengompilasi aplikasi. Jika proyek sudah berada di `C:\xampp\htdocs\inventaris-pln\`, hasil build di folder `dist` akan disajikan oleh `.htaccess` tanpa menimpa source. Jika tidak, hasil build akan disalin ke folder target XAMPP.
4. Nyalakan modul **Apache** di **XAMPP Control Panel**.
5. Buka browser: **`http://localhost/inventaris-pln/`**.

### Cara 2: Manual (Langkah demi Langkah)
1. Di folder proyek ini, jalankan:
   ```bash
   npm run build
   ```
2. Buka folder instalasi XAMPP Anda: `C:\xampp\htdocs\`.
3. Buat folder baru, misalnya bernama **`inventaris-pln`**.
4. Salin semua isi folder **`dist`** (file `index.html`, folder `assets`, dan file lainnya) ke dalam `C:\xampp\htdocs\inventaris-pln\`. Jangan menyalin ke folder source proyek yang sama karena dapat menimpa `index.html` sumber.
5. Buka **XAMPP Control Panel**, lalu klik **Start** pada modul **Apache**.
6. Buka browser (Google Chrome / Edge) dan buka alamat:
   ```
   http://localhost/inventaris-pln/
   ```

### 📡 Cara Mengakses dari Laptop/PC Rekan Sekantor (LAN / Wi-Fi PLN UP Sengkang):
1. Buka Command Prompt di komputer server XAMPP, ketik `ipconfig`.
2. Catat IPv4 Address (misal: `192.168.1.50`).
3. Rekan sekantor dapat langsung membuka dari browser laptop mereka:
   ```
   http://192.168.1.50/inventaris-pln/
   ```

---

## 🚀 METODE 2: MENJALANKAN DENGAN NODE.JS (MODE PENGEMBANG / DEV)

### Prasyarat:
Pastikan Anda sudah menginstall **Node.js** (versi 18 ke atas) di komputer Anda:
👉 Download Node.js: https://nodejs.org/ (pilih versi LTS)

### Langkah-langkah:
1. Ekstrak file ZIP ini ke salah satu folder di komputer Anda.
2. Buka folder tersebut di terminal (Command Prompt / PowerShell).
3. Jalankan perintah instalasi dependensi:
   ```bash
   npm install
   ```
4. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
5. Buka browser Anda:
   ```
   http://localhost:3000
   ```

---

## 🛠️ Fitur Lengkap Aplikasi:
- **Manajemen Aset IT**: Laptop (Sewa/Beli), Desktop PC, Access Point, Switch, Monitor, Printer & Scanner, Server & Jaringan.
- **Data Pegawai PLN**: Terintegrasi nama & jabatan pegawai PT PLN Nusantara Power UP Sengkang.
- **Pembedaan Kepemilikan**: Aset Beli (Aset Tetap Perusahaan) vs Laptop Sewa Rental (Vendor Infotama/dll).
- **BAST Digital**: Berita Acara Serah Terima format resmi PT PLN Nusantara Power dengan QR Code verifikasi.
- **Riwayat Servis & Vendor**: Tiket perbaikan, biaya servis, pergantian suku cadang, dan catatan teknisi.
- **Label QR Code**: Tampilkan label QR aset untuk kebutuhan identifikasi.
- **Stock Opname IT**: Audit fisik aset berkala, status fisik Baik/Rusak/Perlu Perbaikan.
- **Ekspor & Backup**: Backup lengkap JSON serta Ekspor data ke Excel / CSV.

Dikembangkan dengan React 19, TypeScript, Tailwind CSS, Vite, & Lucide Icons.
