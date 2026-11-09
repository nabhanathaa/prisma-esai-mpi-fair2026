// Pemuat data, utilitas statistik spasial, dan data simulasi pelaporan PRISMA
const BASE = import.meta.env.BASE_URL

export const LOGO_URL = `${BASE}LOGO%20PRISMA.PNG`

export async function loadAll() {
  const [kab, ringkasan, geo] = await Promise.all([
    fetch(`${BASE}data/app_kabkota.json`).then(readJson),
    fetch(`${BASE}data/app_ringkasan.json`).then(readJson),
    fetch(`${BASE}data/kabkota.geojson`).then(readJson),
  ])
  const byKode = Object.fromEntries(kab.map(d => [d.kode_bps, d]))
  return { kab, ringkasan, geo, byKode }
}

export const PULAU = ['Sumatera', 'Jawa', 'Bali-Nusa Tenggara', 'Kalimantan', 'Sulawesi', 'Maluku', 'Papua']

// Definisi 3 Peran Utama sesuai Arsitektur Tata Kelola PRISMA
export const ROLES_CONFIG = [
  {
    id: 'pusat',
    no: 1,
    label: 'Analis Pusat (Kemendikdasmen / Pusdatin)',
    shortLabel: 'Analis Pusat',
    sub: 'Pemangku & Pengambil Kebijakan Nasional (Kemendikdasmen · Pusdatin)',
    badge: 'Peran 1 · Pusat',
    user: 'pusdatin',
    pass: 'atlas2025',
    desc: 'Akses penuh: Analitik Spasial Nasional, Simulasi Alokasi Dua Jalur, Kode Komputasi R, serta Verifikasi & Audit Progres Revitalisasi (Before, On-Progress, After).',
  },
  {
    id: 'daerah',
    no: 2,
    label: 'Dinas Terkait & Pihak Sekolah',
    shortLabel: 'Dinas & Sekolah',
    sub: 'Pemda · Dinas Pendidikan · Bappeda · Kepala Sekolah, Guru & Admin',
    badge: 'Peran 2 · Daerah & Sekolah',
    user: 'dinas',
    pass: 'atlas2025',
    desc: 'Akses operasional daerah & sekolah: Pengajuan Laporan, Update Foto Progres Pengerjaan (On-Progress), Dokumentasi Selesai (After), Simulasi Sasaran Daerah, dan Metodologi.',
  },
  {
    id: 'publik',
    no: 3,
    label: 'Masyarakat & Warga Sekolah',
    shortLabel: 'Masyarakat Publik',
    sub: 'Siswa/Murid · Orang Tua/Wali Murid · Komite Sekolah · Masyarakat Umum',
    badge: 'Peran 3 · Publik',
    user: 'publik',
    pass: 'publik',
    desc: 'Akses partisipasi publik: Pemantauan Peta & Ringkasan Nasional (tanpa verifikasi), serta Pengajuan Laporan Kerusakan Ber-Geotagging (wajib verifikasi akun anti-bot/spam).',
  },
]

async function readJson(response) {
  if (!response.ok) throw new Error(`Data tidak dapat dimuat (${response.status} ${response.statusText})`)
  return response.json()
}

// Palet sekuensial profesional yang kontras di Light Mode maupun Dark Mode
export const RAMP_RISK = ['#CBD5E1', '#93C5FD', '#FDE047', '#FB923C', '#EF4444', '#991B1B']
export const RAMP_GOOD = ['#E2E8F0', '#BAE6FD', '#38BDF8', '#0284C7', '#0369A1', '#0B3B75']

// Variabel peta. dir: 'risk' (makin tinggi makin prioritas) / 'good'
export const VARS = [
  { key: 'IPRT', label: 'Skor PRISMA', unit: '', dec: 1, dir: 'risk', desc: 'Indeks prioritas revitalisasi sekolah berbasis analisis spasial (0–100)' },
  { key: 'pct_rusak_sedang_berat', label: '% Rusak sedang + berat', unit: '%', dec: 1, dir: 'risk', desc: 'Semua jenjang (SD, SMP, SMA, SMK)' },
  { key: 'pct_rusak_berat', label: '% Rusak berat', unit: '%', dec: 1, dir: 'risk', desc: 'Semua jenjang' },
  { key: 'pct_rb_sd', label: '% Rusak berat SD', unit: '%', dec: 1, dir: 'risk', desc: 'Jenjang SD' },
  { key: 'pct_rb_smp', label: '% Rusak berat SMP', unit: '%', dec: 1, dir: 'risk', desc: 'Jenjang SMP' },
  { key: 'pct_rb_sma', label: '% Rusak berat SMA', unit: '%', dec: 1, dir: 'risk', desc: 'Jenjang SMA' },
  { key: 'pct_rb_smk', label: '% Rusak berat SMK', unit: '%', dec: 1, dir: 'risk', desc: 'Jenjang SMK' },
  { key: 'rusak_berat_total', label: 'Jumlah ruang rusak berat', unit: ' ruang', dec: 0, dir: 'risk', desc: 'Angka absolut, semua jenjang' },
  { key: 'p0_persen', label: 'Penduduk miskin (P0)', unit: '%', dec: 2, dir: 'risk', desc: 'BPS 2025' },
  { key: 'rls_tahun', label: 'Rata-rata lama sekolah', unit: ' th', dec: 2, dir: 'good', desc: 'BPS 2025, metode baru' },
  { key: 'rasio_kapasitas_fiskal', label: 'Rasio kapasitas fiskal', unit: '', dec: 3, dir: 'good', desc: 'PMK 97/2025' },
  { key: 'ipg_sd', label: 'Indeks pemerataan guru SD', unit: '', dec: 2, dir: 'good', desc: 'Kemendikdasmen 2025' },
  { key: 'lisa', label: 'Klaster LISA', cat: true, desc: 'Moran lokal, % rusak sedang + berat' },
]

export const LISA_COLORS = {
  'Tinggi-Tinggi': '#DC2626',
  'Rendah-Rendah': '#0284C7',
  'Tinggi-Rendah': '#F59E0B',
  'Rendah-Tinggi': '#0D9488',
  'Tidak signifikan': '#64748B',
}

export function quantileBreaks(values, k = 6) {
  const v = values.filter(x => x != null && !Number.isNaN(x)).sort((a, b) => a - b)
  const br = []
  for (let i = 1; i < k; i++) br.push(v[Math.floor((i / k) * (v.length - 1))])
  return br
}

export function colorFor(value, breaks, ramp) {
  if (value == null || Number.isNaN(value)) return '#64748B'
  let i = 0
  while (i < breaks.length && value > breaks[i]) i++
  return ramp[i]
}

export const fmt = (x, d = 1) =>
  x == null || Number.isNaN(x) ? '–' : Number(x).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })

export const fmtInt = x => (x == null ? '–' : Number(x).toLocaleString('id-ID'))

export function median(arr) {
  const v = arr.filter(x => x != null).sort((a, b) => a - b)
  if (!v.length) return null
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

// Hitung ulang IPRT dengan bobot pengguna (K,S,F sudah berupa persentil 0-1)
export function recompute(kab, w) {
  const tot = w.K + w.S + w.F
  if (tot <= 0) throw new RangeError('Setidaknya satu bobot komponen PRISMA harus lebih dari nol.')
  const scored = kab.map(d => ({ ...d, skor: 100 * (w.K * d.K + w.S * d.S + w.F * d.F) / tot }))
  scored.sort((a, b) => b.skor - a.skor)
  scored.forEach((d, i) => { d.rank = i + 1 })
  return scored
}

export function simulate(kab, w, n) {
  const ranking = recompute(kab, w)
  const iprt = ranking.slice(0, n)
  const vol = [...kab].sort((a, b) => b.rusak_berat_total - a.rusak_berat_total).slice(0, n)
  const totRB = kab.reduce((s, d) => s + d.rusak_berat_total, 0)
  const stats = arr => ({
    cakupan: (100 * arr.reduce((s, d) => s + d.rusak_berat_total, 0)) / totRB,
    medRSB: median(arr.map(d => d.pct_rusak_sedang_berat)),
    fiskalRendah: (100 * arr.filter(d => ['Rendah', 'Sangat Rendah'].includes(d.kategori_kapasitas_fiskal)).length) / arr.length,
    medP0: median(arr.map(d => d.p0_persen)),
    jawa: (100 * arr.filter(d => d.pulau === 'Jawa').length) / arr.length,
    timur: (100 * arr.filter(d => ['Papua', 'Maluku', 'Bali-Nusa Tenggara'].includes(d.pulau)).length) / arr.length,
  })
  const setV = new Set(vol.map(d => d.kode_bps))
  const irisan = iprt.filter(d => setV.has(d.kode_bps)).length
  return { iprt, ranking, vol, sIPRT: stats(iprt), sVol: stats(vol), irisan }
}

export function downloadCSV(rows, cols, name) {
  const esc = v => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

// Generator SVG dokumentasi lapangan ber-watermark Geotagging untuk data awal simulasi
export function createFieldPhotoPlaceholder({ title, subtitle, coords, date, stage = 'before' }) {
  const palette = {
    before: { bg1: '#7F1D1D', bg2: '#991B1B', accent: '#FCA5A5', badge: 'KONDISI AWAL (BEFORE)' },
    progress: { bg1: '#78350F', bg2: '#B45309', accent: '#FCD34D', badge: 'ON-PROGRESS KONSTRUKSI' },
    after: { bg1: '#064E3B', bg2: '#047857', accent: '#6EE7B7', badge: 'SELESAI REVITALISASI (AFTER)' },
  }[stage] || { bg1: '#0B3B75', bg2: '#0284C7', accent: '#7DD3FC', badge: 'GEOTAGGED PHOTO' }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg1}"/>
        <stop offset="100%" stop-color="${palette.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="640" height="400" fill="url(#bg)"/>
    <g stroke="rgba(255,255,255,0.08)" stroke-width="1">
      <line x1="0" y1="80" x2="640" y2="80"/><line x1="0" y1="160" x2="640" y2="160"/>
      <line x1="0" y1="240" x2="640" y2="240"/><line x1="0" y1="320" x2="640" y2="320"/>
      <line x1="160" y1="0" x2="160" y2="400"/><line x1="320" y1="0" x2="320" y2="400"/><line x1="480" y1="0" x2="480" y2="400"/>
    </g>
    <!-- Ilustrasi Bangunan Sekolah -->
    <g transform="translate(170, 85)" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="3">
      <polygon points="150,10 20,80 280,80" fill="rgba(255,255,255,0.12)"/>
      <rect x="40" y="80" width="220" height="125" fill="rgba(0,0,0,0.2)"/>
      <rect x="70" y="110" width="45" height="45" fill="rgba(255,255,255,0.15)"/>
      <rect x="185" y="110" width="45" height="45" fill="rgba(255,255,255,0.15)"/>
      <rect x="130" y="130" width="40" height="75" fill="rgba(255,255,255,0.2)"/>
      ${stage === 'before' ? '<path d="M90,82 L115,135 L102,165 M200,82 L180,140" stroke="#FCA5A5" stroke-width="3.5" stroke-dasharray="6,3"/>' : ''}
      ${stage === 'progress' ? '<line x1="25" y1="60" x2="25" y2="205" stroke="#FCD34D" stroke-width="3"/><line x1="275" y1="60" x2="275" y2="205" stroke="#FCD34D" stroke-width="3"/><line x1="20" y1="120" x2="280" y2="120" stroke="#FCD34D" stroke-width="2" stroke-dasharray="8,4"/>' : ''}
      ${stage === 'after' ? '<path d="M15,205 L65,185 L65,205 Z" fill="#6EE7B7" stroke="#6EE7B7" stroke-width="2"/><circle cx="250" cy="40" r="18" fill="rgba(110,231,183,0.25)" stroke="#6EE7B7"/>' : ''}
    </g>
    <!-- Top Badge -->
    <rect x="20" y="18" width="250" height="30" rx="8" fill="rgba(0,0,0,0.55)"/>
    <text x="34" y="38" fill="${palette.accent}" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="1">${palette.badge}</text>
    <!-- Bottom Geotag Watermark Bar -->
    <rect x="0" y="305" width="640" height="95" fill="rgba(6, 15, 30, 0.86)"/>
    <text x="24" y="334" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold">${title}</text>
    <text x="24" y="356" fill="#CBD5E1" font-family="sans-serif" font-size="13">${subtitle}</text>
    <text x="24" y="380" fill="${palette.accent}" font-family="monospace" font-size="12">GPS: ${coords}  |  TIMESTAMP: ${date}  |  PRISMA VERIFIED</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const SAMPLE_IMG_BEFORE = `${BASE}contoh-bangunan-sekolah-rusak.jpg`
export const SAMPLE_IMG_PROGRESS = `${BASE}contoh-bangunan-sekolah-sedang-direnovasi.jpg`
export const SAMPLE_IMG_AFTER = `${BASE}contoh-bangunan-sekolah-selesai-direnovasi.jpg`

export const SAMPLE_IMG_BEFORE_ONLINE = 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80'
export const SAMPLE_IMG_PROGRESS_ONLINE = 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?auto=format&fit=crop&w=1200&q=80'
export const SAMPLE_IMG_AFTER_ONLINE = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80'

export const INITIAL_REPORTS = [
  {
    id: 'PRISMA-2026-8401',
    tanggal: '08 Nov 2026, 09:42 WIB',
    pelapor: 'Siti Rahmawati, S.Pd.',
    peranPelapor: 'Guru / Tenaga Kependidikan',
    email: 'siti.rahmawati.sdn2@gmail.com',
    hp: '0812-4589-3310',
    verified: true,
    sekolah: 'SD Negeri 2 Banggai Laut',
    npsn: '40204118',
    jenjang: 'SD',
    kode_bps: '7211',
    kabkota: 'Kabupaten Banggai Laut',
    provinsi: 'Sulawesi Tengah',
    skorPrisma: 87.6,
    rankPrisma: 1,
    lat: -1.6142,
    lng: 123.4985,
    akurasi: 4.2,
    fasilitas: ['Ruang Kelas Utama & Rangka Atap', 'Sanitasi / Toilet Siswa'],
    tingkat: 'Rusak Berat',
    ruangTerdampak: 4,
    siswaTerdampak: 118,
    inklusiFlags: ['Membahayakan keselamatan siswa saat hujan/angin', 'Belum memiliki jalur kursi roda (ramp)', 'Wilayah kepulauan 3T'],
    deskripsi: 'Empat ruang kelas mengalami pelapukan kuda-kuda kayu utama dan kebocoran atap parah. Saat hujan deras siswa terpaksa digabung di perpustakaan. Akses masuk kelas juga masih berupa tangga curam tanpa jalur landai disabilitas.',
    statusTahap: 'before', // before | progress | after
    statusLabel: 'Terverifikasi Pusdatin & Dinas · Menunggu Eksekusi',
    instansiTujuan: 'Pusdatin Kemendikdasmen & Dinas Pendidikan Kab. Banggai Laut',
    progresPersen: 15,
    fotosBefore: [SAMPLE_IMG_BEFORE],
    fotosProgress: [],
    fotosAfter: [],
    catatanDinas: 'Telah diverifikasi oleh Tim Teknis Sarpras Dinas Pendidikan Kab. Banggai Laut. Masuk daftar prioritas utama Jalur Afirmasi PRISMA Kuartal I.',
  },
  {
    id: 'PRISMA-2026-8394',
    tanggal: '05 Nov 2026, 14:15 WIB',
    pelapor: 'Yohanes Bataona',
    peranPelapor: 'Orang Tua / Komite Sekolah',
    email: 'yohanes.komite.lembata@gmail.com',
    hp: '0813-3902-7741',
    verified: true,
    sekolah: 'SMP Negeri 1 Atadei',
    npsn: '50304821',
    jenjang: 'SMP',
    kode_bps: '5313',
    kabkota: 'Kabupaten Lembata',
    provinsi: 'Nusa Tenggara Timur',
    skorPrisma: 86.5,
    rankPrisma: 2,
    lat: -8.4628,
    lng: 123.5419,
    akurasi: 5.0,
    fasilitas: ['Ruang Kelas Utama & Rangka Atap', 'Sanitasi / Toilet Siswa', 'Aksesibilitas / Ramp Kursi Roda'],
    tingkat: 'Rusak Berat',
    ruangTerdampak: 5,
    siswaTerdampak: 164,
    inklusiFlags: ['Membahayakan keselamatan siswa saat hujan/angin', 'Toilet rusak & belum ramah disabilitas', 'Wilayah rawan bencana iklim'],
    deskripsi: 'Retakan struktural pada dinding pemikul di 5 ruang kelas akibat pergeseran tanah serta fasilitas toilet siswa rusak berat tanpa akses air bersih memadai.',
    statusTahap: 'progress',
    statusLabel: 'Sedang Direvitalisasi (Konstruksi 68%)',
    instansiTujuan: 'Direktorat SMP Kemendikdasmen & Dinas Pendidikan Kab. Lembata',
    progresPersen: 68,
    kontraktor: 'Tim Pelaksana Swakelola P2SP & CV Karya Flobamora',
    anggaranSerapan: 'Rp 845.000.000 (Termin II - 70%)',
    targetSelesai: '20 Desember 2026',
    fotosBefore: [SAMPLE_IMG_BEFORE],
    fotosProgress: [SAMPLE_IMG_PROGRESS],
    fotosAfter: [],
    catatanDinas: 'Struktur kolom beton bertulang dan rangka atap baja ringan telah terpasang 100%. Saat ini tahap pengerjaan lantai keramik anti-slip dan toilet ramah disabilitas.',
  },
  {
    id: 'PRISMA-2026-8310',
    tanggal: '29 Okt 2026, 11:20 WIB',
    pelapor: 'Drs. H. Mulyadi, M.Pd.',
    peranPelapor: 'Kepala Sekolah / Admin',
    email: 'kepsek.sdn3bangkalan@gmail.com',
    hp: '0852-3104-9982',
    verified: true,
    sekolah: 'SD Negeri Tanah Merah 1',
    npsn: '20531209',
    jenjang: 'SD',
    kode_bps: '3526',
    kabkota: 'Kabupaten Bangkalan',
    provinsi: 'Jawa Timur',
    skorPrisma: 85.0,
    rankPrisma: 4,
    lat: -7.0865,
    lng: 112.8421,
    akurasi: 3.5,
    fasilitas: ['Ruang Kelas Utama & Rangka Atap', 'Ruang UKS', 'Sanitasi / Toilet Siswa'],
    tingkat: 'Rusak Berat',
    ruangTerdampak: 6,
    siswaTerdampak: 210,
    inklusiFlags: ['Membahayakan keselamatan siswa saat hujan/angin', 'Belum memiliki jalur kursi roda (ramp)', 'Toilet rusak & belum ramah disabilitas'],
    deskripsi: 'Enam ruang kelas dan ruang UKS mengalami kerusakan berat pada struktur atap dan lantai. Telah diajukan melalui PRISMA dan selesai direvitalisasi penuh pada Oktober 2026.',
    statusTahap: 'after',
    statusLabel: 'Selesai Revitalisasi 100% · Terverifikasi BAST',
    instansiTujuan: 'Pusdatin Kemendikdasmen & Dinas Pendidikan Kab. Bangkalan',
    progresPersen: 100,
    kontraktor: 'Panitia Pembangunan Satuan Pendidikan (P2SP) SDN Tanah Merah 1',
    anggaranSerapan: 'Rp 1.120.000.000 (100% Tuntas)',
    nomorBast: 'BAST/REVIT-SD/3526/X/2026/089',
    skorKelayakanAfter: 98,
    fiturInklusiAfter: ['Jalur Kursi Roda (Ramp Landai 7°)', 'Toilet Inklusif Ramah Disabilitas dengan Handrail', 'Ventilasi Silang & Pencahayaan Alami Standar', 'Struktur Atap Baja Ringan Tahan Gempa'],
    fotosBefore: [SAMPLE_IMG_BEFORE],
    fotosProgress: [SAMPLE_IMG_PROGRESS],
    fotosAfter: [SAMPLE_IMG_AFTER],
    catatanDinas: 'Audit akhir selesai. Seluruh 6 ruang kelas, UKS, dan toilet ramah disabilitas telah memenuhi standar bangunan gedung ramah anak dan inklusif.',
  },
]
