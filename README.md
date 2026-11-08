# ATLAS-Kelas

Dasbor web **Indeks Prioritas Revitalisasi Tangguh (IPRT)** untuk 514 kabupaten/kota di Indonesia, data tahun 2025.
Purwarupa pendamping esai *ATLAS-Kelas* (Lomba Esai Nasional MPI FAIR 2026).

## Fitur

| Halaman | Isi |
|---|---|
| Login | Tiga peran: Analis Pusat (Kemendikdasmen/Pusdatin), Dinas/Bappeda, Publik |
| Ringkasan | KPI nasional, komposisi kondisi ruang kelas per jenjang, median per pulau, 10 besar IPRT, revitalisasi 2025 |
| Peta Interaktif | Peta 514 kab/kota (Leaflet). Pilih variabel (IPRT, % rusak, P0, RLS, fiskal, IPG, klaster LISA), filter pulau/provinsi, cari kab/kota, panel profil |
| Prioritas & Simulator | Geser bobot K/S/F dan jumlah sasaran; peringkat dan perbandingan dengan pendekatan volume dihitung ulang langsung; ekspor CSV (bukan untuk akun Publik) |
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

Semua data di `public/data/` dihasilkan oleh `ATLAS_Kelas_Analisis.Rmd` (tahap 9), dari `ATLAS_Kelas_Dataset_2025.xlsx`:

- `app_kabkota.json`: 514 baris, satu per kab/kota (kondisi ruang kelas, P0, RLS, kapasitas fiskal, IPG, K/S/F, IPRT, LISA)
- `app_ringkasan.json`: hasil statistik (nasional, Kruskal–Wallis, Moran, regresi, IPRT, simulasi, revitalisasi)
- `kabkota.geojson`: batas 514 kab/kota, disederhanakan dengan mapshaper (18%)

Untuk memperbarui: jalankan ulang Rmd, salin dua file JSON dari `output/` ke `public/data/`, lalu build ulang.

Sumber: Dapodik 2025 (Kemendikdasmen), BPS 2025, PMK 97/2025 (Kemenkeu), Indeks Pemerataan Guru 2025, Pusdatin Revitalisasi 2025.
Peta dasar: © OpenStreetMap, © CARTO (perlu internet; peta tetap tampil tanpa peta dasar).

## Teknologi

React 18, Vite 5, Leaflet + react-leaflet, Recharts, Framer Motion, Lucide.
