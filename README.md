# DUKOPS BABINSA

## Struktur proyek

```text
index.html              Halaman utama dan struktur komponen UI
config/
  app-config.json       Satu-satunya tempat mengganti nama aplikasi/unit
style.css               Entry point CSS
css/
  base.css              Style dasar dan layout utama
  components.css        Style tombol, modal, dan komponen tambahan
js/
  services.js           Webhook dan upload Google Drive
data/
  webhook.json          URL publish Google Apps Script backend
  desa/                 Daftar desa dan data koordinat
  google-apps-script/   Backend Google Apps Script untuk upload file
header/                 Gambar header aplikasi
logo/                   Logo dan lisensi aset
icons/                  Ikon PWA dan favicon
tools/                  Script bantuan pengembangan lokal
```

## Konfigurasi upload ke Google Drive

1. Buka file `data/webhook.json`.
2. Isi `webhookUrl` dengan URL deployment Google Apps Script hasil publish.
3. Pastikan backend Apps Script memiliki `ROOT_FOLDER_ID` yang menunjuk ke folder Google Drive tujuan.
4. Folder target saat ini sudah diatur ke:
   `101GdXpFdZtKMnQKZJE-VkIkIdEAkzGHG`

## Konfigurasi aplikasi

Semua identitas aplikasi dikelola dari satu file:
`config/app-config.json`. Ubah `appName` untuk memperbarui judul aplikasi,
header, judul browser, dan nama PWA. Ubah `shortName` untuk nama singkat ikon
PWA, serta `headerUnit` untuk nama Koramil/unit.
