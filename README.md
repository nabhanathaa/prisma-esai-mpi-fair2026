# PRISMA · Sistem Prioritas & Pemantauan Revitalisasi Sekolah

**PRISMA — Prioritas Revitalisasi Infrastruktur Sekolah melalui Model Analisis Spasial untuk mewujudkan infrastruktur pendidikan yang adil, tangguh, inklusif, dan berkelanjutan di Indonesia.**

Aplikasi pendamping esai **MPI FAIR 2026** (Sub-tema: *Inklusi Sosial dan Kesetaraan dalam Pendidikan*) yang memadukan **pemodelan ekonometrika spasial 514 kabupaten/kota (Top-Down)** dengan **pelaporan geotagging partisipatif & pemantauan siklus penuh Before–On-Progress–After (Bottom-Up)**.

## Fitur Utama

| Halaman / Modul | Deskripsi & Hak Akses Berjenjang (RBAC) |
|---|---|
| **Portal Login & Tema** | Mendukung **Light Mode (Clear Royal Blue & White)** dan **Dark Mode (Deep Sapphire Navy)**, terintegrasi dengan identitas visual **Logo PRISMA**. |
| **Ringkasan Nasional** | KPI nasional (2,03 juta ruang kelas), komposisi kondisi per jenjang, ketimpangan antarpulau (Kruskal–Wallis), 10 besar PRISMA, dan sintesis Alokasi Dua Jalur. |
| **Peta Interaktif** | Peta tematik 514 kab/kota (Leaflet). Pilih 13 variabel (Skor PRISMA, % rusak, P0, RLS, kapasitas fiskal, IPG, klaster LISA), filter pulau/provinsi, dan tombol cepat lapor sekolah. |
| **Pelaporan & Progres (Baru)** | **1. Ajukan Laporan (Before):** Kamera Foto/Video langsung + Upload Galeri (maks. 5 file), Geotagging GPS Realtime, Verifikasi Akun Anti-Bot/Spam, animasi proses pengiriman, dan E-Tiket Tanda Terima Resmi ke Pusdatin Kemendikdasmen & Dinas Pendidikan.<br>**2. Foto Progres (On-Progress):** Update fisik & serapan anggaran *(Khusus Peran 1 & 2; Terkunci bagi Peran 3)*.<br>**3. Selesai Revitalisasi (After):** Dokumentasi Before–After, BAST, dan audit fasilitas inklusif ramah disabilitas *(Khusus Peran 1 & 2; Terkunci bagi Peran 3)*. |
| **Simulasi Dua Jalur** | Geser bobot K/S/F dan kuota sasaran; bandingkan Jalur Kebutuhan Absolut vs Jalur Afirmasi PRISMA; ekspor CSV *(Khusus Peran 1 & 2; Terkunci bagi Peran 3)*. |
| **Analisis Statistik** | Hasil inferensial: Kruskal–Wallis, Moran's I global + LISA, regresi OLS → uji LM robust → Spatial Error Model (SEM, $\lambda = 0,562$), dan simulasi ketahanan bobot Dirichlet. |
| **Kode Analisis** | Explorer 5 modul inti pipeline ekonometrika spasial R beserta unduhan `.Rmd` lengkap *(Dikhususkan hanya untuk Peran 1 — Analis Pusat)*. |
| **Metodologi & Data** | Formulasi matematis indeks PRISMA, arsitektur tata kelola kolaboratif 3 peran, dan 8 sumber data resmi nasional tahun 2025. |

## Tiga Peran Tata Kelola (Akun Demo)

| No | Peran | Pengguna | Sandi | Cakupan Hak Akses |
|---|---|---|---|---|
| **1** | **Analis Pusat** *(Kemendikdasmen / Pusdatin)* | `pusdatin` | `atlas2025` | Akses penuh seluruh modul (termasuk **Kode Analisis**, **Simulasi Dua Jalur**, serta manajemen **On-Progress** & **After**). |
| **2** | **Dinas Terkait & Pihak Sekolah** *(Pemda, Dinas Pendidikan, Bappeda, Kepala Sekolah, Guru, Admin)* | `dinas` | `atlas2025` | Akses operasional daerah & sekolah: Laporan **Before**, Update **On-Progress**, Pengesahan **After**, **Simulasi Dua Jalur**, dan **Metodologi & Data**. |
| **3** | **Masyarakat & Warga Sekolah** *(Siswa/Murid, Orang Tua/Wali, Komite, Publik)* | `publik` | `publik` | Akses pantauan terbuka Peta & Ringkasan (tanpa verifikasi), serta pengajuan **Laporan Before Ber-Geotagging** (wajib verifikasi akun anti-bot/spam). Menu Simulasi, On-Progress, dan After dikunci secara berjenjang. |

## Menjalankan Aplikasi

```bash
npm install
npm run dev        # jalankan server pengembangan lokal
npm run build      # bangun bundel produksi di folder dist/
npm run preview    # pratinjau hasil build
```
