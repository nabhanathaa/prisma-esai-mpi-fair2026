// Pemuat data dan utilitas bersama
const BASE = import.meta.env.BASE_URL

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

async function readJson(response) {
  if (!response.ok) throw new Error(`Data tidak dapat dimuat (${response.status} ${response.statusText})`)
  return response.json()
}

// Ramp sekuensial (gelap -> terang) untuk latar gelap
export const RAMP_RISK = ['#2A2F45', '#4A3350', '#7A3A52', '#AE4550', '#DB5A45', '#FF8A4C']
export const RAMP_GOOD = ['#1E3046', '#1F4A63', '#22667F', '#2A8597', '#3FA6AC', '#69C9B9']

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
  'Tinggi-Tinggi': '#E5484D',
  'Rendah-Rendah': '#5B8DEF',
  'Tinggi-Rendah': '#E08A35',
  'Rendah-Tinggi': '#38AFC8',
  'Tidak signifikan': '#2B3448',
}

export function quantileBreaks(values, k = 6) {
  const v = values.filter(x => x != null && !Number.isNaN(x)).sort((a, b) => a - b)
  const br = []
  for (let i = 1; i < k; i++) br.push(v[Math.floor((i / k) * (v.length - 1))])
  return br
}

export function colorFor(value, breaks, ramp) {
  if (value == null || Number.isNaN(value)) return '#1A2133'
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
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}
