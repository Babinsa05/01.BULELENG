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
  services.js           Supabase, webhook, dan upload Google Drive
data/
  supabase.json         Konfigurasi absensi Supabase
  supabase/
    schema.sql          Struktur tabel absensi Supabase
  desa/                 Daftar desa dan data koordinat
  google-apps-script/   Backend Google Apps Script
header/                 Gambar header aplikasi
logo/                   Logo dan lisensi aset
icons/                  Ikon PWA dan favicon
tools/                  Script bantuan pengembangan lokal
```

## Konfigurasi tombol Absensi

Isi `data/supabase.json` dengan URL project Supabase dan **anon key**
(jangan gunakan service-role key). Tombol absensi membaca rekap bulan berjalan
berdasarkan `desa`, `bulan`, dan `tahun`.

Jalankan `data/supabase/schema.sql` di SQL Editor Supabase. Tabel `absensi`
menyimpan rekap `desa`, `bulan`, `tahun`, dan `jumlah_laporan`.

Semua identitas aplikasi dikelola dari satu file:
`config/app-config.json`. Ubah `appName` untuk memperbarui judul aplikasi,
header, judul browser, dan nama PWA. Ubah `shortName` untuk nama singkat ikon
PWA, serta `headerUnit` untuk nama Koramil/unit.