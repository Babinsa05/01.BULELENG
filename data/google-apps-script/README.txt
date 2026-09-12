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
  Tahun/
    Bulan/
      Desa atau Kelurahan/
        Nama wilayah/
          file.zip

Skrip ini tidak menggunakan folder Drive lama. Pastikan akun pemilik
deployment memiliki akses Editor ke folder Drive baru.
