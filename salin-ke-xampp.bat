@echo off
title Pasang ke XAMPP htdocs - PT PLN NP UP Sengkang
echo ========================================================================
echo   PASANG INVENTARIS ASET IT KE XAMPP HTDOCS
echo   PT PLN Nusantara Power UP Sengkang
echo ========================================================================
echo.
echo [1/3] Melakukan kompilasi static build (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gagal melakukan build. Pastikan Node.js sudah terpasang di komputer Anda.
    echo Unduh Node.js di: https://nodejs.org/
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Memeriksa folder tujuan XAMPP...
set "TARGET_DIR=C:\xampp\htdocs\inventaris-pln"
if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%"
    echo Membuat folder: %TARGET_DIR%
)

echo.
for %%I in ("%CD%") do set "CURRENT_DIR=%%~fI"
if /I "%CURRENT_DIR%"=="%TARGET_DIR%" (
    echo [3/3] Proyek sudah berada di folder XAMPP.
    echo Hasil build tersedia di folder dist dan disajikan melalui .htaccess.
) else (
    echo [3/3] Menyalin hasil build ke %TARGET_DIR%...
    xcopy /E /I /Y "dist\*" "%TARGET_DIR%\"
    if errorlevel 1 (
        echo.
        echo [ERROR] Gagal menyalin hasil build ke folder XAMPP.
        pause
        exit /b 1
    )
)

echo.
echo ========================================================================
echo   SELESAI! APLIKASI TELAH TERPASANG DI XAMPP
echo ========================================================================
echo.
echo Silakan ikuti langkah berikut:
echo 1. Pastikan modul "Apache" di XAMPP Control Panel sudah AKTIF (Start).
echo 2. Buka browser (Chrome / Edge), kunjungi:
echo    http://localhost/inventaris-pln/
echo.
echo 3. Untuk dibuka oleh rekan sekantor di jaringan Wi-Fi/LAN PLN UP Sengkang:
echo    Cek IP komputer ini dengan mengetik 'ipconfig' di cmd.
echo    Lalu bagikan URL: http://[IP-KOMPUTER-ANDA]/inventaris-pln/
echo.
pause
