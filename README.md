# DUKOPS BABINSA

## Struktur proyek

```text
index.html              Halaman utama dan struktur komponen UI
config/
  app-config.json       Satu-satunya tempat mengganti nama aplikasi/unit
style.css               Entry point CSS
css/
  base.css              Style dasar dan layout utama
js/
  services.js           Webhook dan upload Google Drive
data/
  desa/                 Daftar desa dan data koordinat
  google-apps-script/   Backend Google Apps Script
header/                 Gambar header aplikasi
logo/                   Logo dan lisensi aset
icons/                  Ikon PWA dan favicon
tools/                  Script bantuan pengembangan lokal
```

Semua identitas aplikasi dikelola dari satu file:
`config/app-config.json`. Ubah `appName` untuk memperbarui judul aplikasi,
header, judul browser, dan nama PWA. Ubah `shortName` untuk nama singkat ikon
PWA, serta `headerUnit` untuk nama Koramil/unit.
