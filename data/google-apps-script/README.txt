GOOGLE APPS SCRIPT BARU
========================

1. Buat folder Drive baru khusus aplikasi.
2. Buka folder tersebut dan salin ID dari URL:
   https://drive.google.com/drive/folders/ID_FOLDER
3. Buka script.google.com, buat project baru, lalu salin isi Code.gs.
4. Ganti ROOT_FOLDER_ID di Code.gs dengan ID folder Drive baru.
5. Deploy > New deployment > Web app.
   - Execute as: Me
   - Who has access: Anyone
6. Salin URL /exec hasil deployment ke data/webhook.json.

Struktur folder otomatis:
Folder Drive Baru/
  ID Akun (Desa/Kelurahan)/
    counter.json
    Tahun/
      Bulan/
        file.zip

Setiap upload mengirim nama Desa/Kelurahan terpilih sebagai `accountId`.
Counter total dan jumlah per tanggal disimpan di `counter.json` per akun,
serta disalin ke localStorage browser. Saat pertama kali akun dipilih,
counter diinisialisasi ke 0 jika belum ada ZIP di folder akun. ZIP yang sudah
ada dihitung saat counter Drive dibuat pertama kali.

Apps Script melayani action `uploadDrive` untuk upload dan `getCounter` untuk
mengirim counter Drive ke aplikasi. Deploy ulang script setelah Code.gs
diperbarui agar kedua action tersedia.

Skrip ini tidak menggunakan folder Drive lama. Pastikan akun pemilik
deployment memiliki akses Editor ke folder Drive baru.
