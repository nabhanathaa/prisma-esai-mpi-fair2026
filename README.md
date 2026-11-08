# PRISMA

**PRISMA — Indeks Prioritas Revitalisasi Sekolah Berbasis Analisis Spasial untuk mewujudkan infrastruktur pendidikan yang adil, tangguh, inklusif, dan berkelanjutan di Indonesia.**

Kepanjangan PRISMA: **Prioritas Revitalisasi Infrastruktur Sekolah melalui Model Analisis Spasial**. Aplikasi pendamping esai MPI FAIR 2026 ini memetakan kebutuhan 514 kabupaten/kota dengan menggabungkan kondisi ruang kelas, kerentanan sosial, dan kapasitas fiskal.

## Fitur

| Halaman | Isi |
|---|---|
| Login | Tiga peran: Analis Pusat (Kemendikdasmen/Pusdatin), Dinas/Bappeda, Publik |
| Ringkasan | KPI nasional, komposisi kondisi ruang kelas per jenjang, median per pulau, 10 besar PRISMA, revitalisasi 2025, dan alokasi dua jalur |
| Peta Interaktif | Peta 514 kab/kota (Leaflet). Pilih variabel (PRISMA, % rusak, P0, RLS, fiskal, IPG, klaster LISA), filter pulau/provinsi, cari kab/kota, panel profil |
| Prioritas & Simulator | Geser bobot K/S/F dan jumlah sasaran; bandingkan jalur kebutuhan absolut dengan jalur afirmasi PRISMA; ekspor CSV (bukan untuk akun Publik) |
| Analisis Statistik | Kruskal–Wallis, Moran's I + LISA, OLS → uji LM robust → SEM, uji sensitivitas indeks |
| Kode Analisis | Seluruh berkas R Markdown, dibagi per tahap, bisa disalin dan diunduh |
| Metodologi & Data | Rumus, sumber data resmi, alur penerapan, keterbatasan |

## Akun demo

| Peran | Pengguna | Sandi |
|---|---|---|
| Analis Pusat | `pusdatin` | `atlas2025` |
| Dinas / Bappeda | `dinas` | `atlas2025` |
| Publik | `publik` | `publik` |

> Login ini **hanya demo sisi klien** (tanpa server) untuk memperlihatkan konsep peran pengguna.
> Sandi terlihat di kode sumber. Versi produksi perlu autentikasi server, misalnya SSO Kemendikdasmen.

## Menjalankan di komputer

Butuh Node.js 18 atau lebih baru.

```bash
npm install
npm run dev        # buka http://localhost:5173
npm run build      # hasil statis di folder dist/
npm run preview    # uji hasil build
```

## Deploy ke GitHub Pages

1. Buat repositori baru di GitHub, lalu unggah seluruh isi folder ini (termasuk folder `.github`).
2. Di repositori: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push ke cabang `main`. Workflow `.github/workflows/deploy.yml` akan membangun dan menerbitkan situs.
4. Alamatnya: `https://<username>.github.io/<nama-repo>/`.

Karena `base: './'` di `vite.config.js`, folder `dist/` juga bisa langsung diunggah ke Netlify, Vercel, atau hosting statis lain.

## Data

Semua data di `public/data/` dihasilkan oleh R Markdown analisis (berkas sumber masih memakai nama historis `ATLAS_Kelas_Analisis.Rmd`), dari dataset 2025:

- `app_kabkota.json`: 514 baris, satu per kab/kota (kondisi ruang kelas, P0, RLS, kapasitas fiskal, IPG, K/S/F, IPRT, LISA)
- `app_ringkasan.json`: hasil statistik (nasional, Kruskal–Wallis, Moran, regresi, IPRT, simulasi, revitalisasi)
- `kabkota.geojson`: batas 514 kab/kota, disederhanakan dengan mapshaper (18%)

Nama kolom `IPRT` dipertahankan pada berkas data sebagai skema internal dari analisis awal; antarmuka aplikasi menampilkannya sebagai skor PRISMA.

Untuk memperbarui: jalankan ulang Rmd, salin dua file JSON dari `output/` ke `public/data/`, lalu build ulang.

Sumber: Dapodik 2025 (Kemendikdasmen), BPS 2025, PMK 97/2025 (Kemenkeu), Indeks Pemerataan Guru 2025, Pusdatin Revitalisasi 2025.
Peta dasar menggunakan tile publik OpenStreetMap, tanpa API key (memerlukan internet; batas wilayah dan data tematik tetap tersedia saat peta dasar dimatikan).

## Teknologi

React 18, Vite 5, Leaflet + react-leaflet, Recharts, Framer Motion, Lucide.
