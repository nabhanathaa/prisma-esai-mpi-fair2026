import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts'
import { School, AlertTriangle, MapPinned, Network, Target, ArrowUpRight, Camera } from 'lucide-react'
import { fmt, fmtInt } from '../lib/data'

export const KONDISI = [
  { key: 'pct_baik', label: 'Baik', color: '#0284C7' },
  { key: 'pct_ringan', label: 'Rusak ringan', color: '#38BDF8' },
  { key: 'pct_sedang', label: 'Rusak sedang', color: '#F59E0B' },
  { key: 'pct_berat', label: 'Rusak berat', color: '#EF4444' },
]

export function Tip({ active, payload, label, unit = '%', dec = 1 }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tip">
      {label && <b>{label}</b>}
      {payload.map(p => (
        <div key={p.dataKey}><i style={{ background: p.color || p.payload?.fill }} />{p.name}: <b>{fmt(p.value, dec)}{unit}</b></div>
      ))}
    </div>
  )
}

const Kpi = ({ icon: Icon, label, value, sub, tone, i }) => (
  <motion.div className={`kpi ${tone || ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
    <div className="kpi-ic"><Icon size={18} /></div>
    <span>{label}</span><b>{value}</b><small>{sub}</small>
  </motion.div>
)

export default function Ringkasan({ data, go }) {
  const { ringkasan: R, kab } = data
  const tot = R.nasional.find(d => d.jenjang === 'Total')
  const jenjang = R.nasional.filter(d => d.jenjang !== 'Total')
  const pulau = [...R.kruskal.median_pulau].sort((a, b) => b.median - a.median)
  const top = R.iprt.top20.slice(0, 10)
  const revit = useMemo(() => [...R.revitalisasi].sort((a, b) => b.jumlah_sekolah - a.jumlah_sekolah).slice(0, 8), [R])
  const prioritas = kab.filter(d => d.rank_iprt <= 103).length

  return (
    <div className="page">
      <header className="ph">
        <div>
          <span className="eyebrow">DASBOR EKSEKUTIF NASIONAL · DATA RESMI 2025</span>
          <h1>Ringkasan Prioritas Revitalisasi Sekolah</h1>
          <p>Sintesis 2,03 juta ruang kelas di 514 kabupaten/kota untuk mewujudkan infrastruktur pendidikan yang adil, inklusif, dan berkelanjutan.</p>
        </div>
        <div className="ph-actions">
          <button className="btn secondary sm" onClick={() => go('pelaporan')}>
            <Camera size={15} /> Lapor &amp; Pantau Progres
          </button>
          <button className="btn primary sm" onClick={() => go('peta')}>
            Buka Peta Spasial <ArrowUpRight size={15} />
          </button>
        </div>
      </header>

      <section className="prisma-hero">
        <div className="prisma-hero-copy">
          <span className="eyebrow">KEPUTUSAN BERBASIS BUKTI SPASIAL &amp; PARTISIPASI PUBLIK · 514 KABUPATEN/KOTA</span>
          <h2>Pemerataan pendidikan bukan sekadar membagi rata.</h2>
          <p>
            PRISMA mengintegrasikan <b>analisis spasial Top-Down</b> (kondisi ruang kelas, kerentanan sosial, dan kapasitas fiskal) dengan <b>pelaporan geotagging Bottom-Up</b> (Before – On-Progress – After) agar setiap rupiah revitalisasi tepat sasaran dan bebas penyimpangan.
          </p>
        </div>
        <div className="allocation-paths">
          <div onClick={() => go('simulator')} style={{ cursor: 'pointer' }}>
            <span className="path-mark volume">01</span>
            <div><b>Jalur 1 · Kebutuhan Absolut</b><small>Menjangkau volume ruang rusak berat terbanyak.</small></div>
          </div>
          <div onClick={() => go('simulator')} style={{ cursor: 'pointer' }}>
            <span className="path-mark prisma">02</span>
            <div><b>Jalur 2 · Afirmasi Spasial PRISMA</b><small>Mengutamakan keparahan relatif, kemiskinan &amp; fiskal lemah.</small></div>
          </div>
          <div onClick={() => go('pelaporan')} style={{ cursor: 'pointer' }}>
            <span className="path-mark report">03</span>
            <div><b>Verifikasi Geotagging Siklus Penuh</b><small>Validasi foto kamera &amp; progres lapangan 3 peran.</small></div>
          </div>
        </div>
      </section>

      <div className="kpis">
        <Kpi i={0} icon={School} label="Total ruang kelas" value={fmtInt(tot.jumlah)} sub="Dapodik 2025 (SD, SMP, SMA, SMK)" />
        <Kpi i={1} icon={AlertTriangle} tone="warn" label="Rusak sedang + berat" value={`${fmt(tot.pct_sedang_berat)}%`} sub={`${fmtInt(tot.rusak_sedang + tot.rusak_berat)} ruang kelas`} />
        <Kpi i={2} icon={AlertTriangle} tone="crit" label="Rusak berat" value={fmtInt(tot.rusak_berat)} sub={`${fmt(tot.pct_berat)}% dari total nasional`} />
        <Kpi i={3} icon={Network} label="Indeks Moran's I" value={fmt(R.moran.I, 3)} sub="Autokorelasi spasial signifikan (p < 0,001)" />
        <Kpi i={4} icon={Target} tone="accent" label="Sasaran prioritas utama" value={`${prioritas} Kab/Kota`} sub="Kuintil teratas (Top 20% PRISMA)" />
      </div>

      <div className="grid2">
        <section className="card">
          <h3>Komposisi Kondisi Ruang Kelas per Jenjang</h3>
          <p className="muted">Proporsi terhadap total ruang kelas pada masing-masing jenjang pendidikan</p>
          <div className="legend">{KONDISI.map(k => <span key={k.key}><i style={{ background: k.color }} />{k.label}</span>)}</div>
          <ResponsiveContainer width="100%" height={235}>
            <BarChart data={jenjang} layout="vertical" margin={{ left: 4, right: 12 }} barCategoryGap={10}>
              <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `${Math.round(v)}%`} stroke="var(--axis)" fontSize={11} />
              <YAxis type="category" dataKey="jenjang" width={42} stroke="var(--axis)" fontSize={12} />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(2, 132, 199, 0.06)' }} />
              {KONDISI.map((k, i) => (
                <Bar
                  key={k.key}
                  dataKey={k.key}
                  name={k.label}
                  stackId="a"
                  fill={k.color}
                  stroke="var(--card)"
                  strokeWidth={2}
                  radius={i === 3 ? [0, 4, 4, 0] : i === 0 ? [4, 0, 0, 4] : 0}
                  isAnimationActive={false}
                >
                  {i === 3 && <LabelList dataKey={k.key} position="insideRight" formatter={v => `${fmt(v)}%`} fill="#fff" fontSize={11} />}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card">
          <h3>Median % Rusak Sedang + Berat Menurut Kelompok Pulau</h3>
          <p className="muted">Uji Kruskal–Wallis H = {fmt(R.kruskal.H, 2)}, p &lt; 0,001, ε² = {fmt(R.kruskal.epsilon2, 2)} (ketimpangan antarpulau nyata)</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pulau} margin={{ top: 18, right: 8, left: -14 }}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="pulau" stroke="var(--axis)" fontSize={11} interval={0} angle={-25} textAnchor="end" height={52} tickFormatter={v => v.replace('Bali-Nusa Tenggara', 'Bali-NT')} />
              <YAxis stroke="var(--axis)" fontSize={11} tickFormatter={v => `${v}%`} />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(2, 132, 199, 0.06)' }} />
              <Bar dataKey="median" name="Median" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {pulau.map((p, i) => <Cell key={p.pulau} fill={i < 2 ? '#EF4444' : i < 4 ? '#F59E0B' : '#0284C7'} />)}
                <LabelList dataKey="median" position="top" formatter={v => `${fmt(v)}%`} fill="var(--ink2)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid2">
        <section className="card">
          <h3>10 Kabupaten/Kota dengan Skor Prioritas PRISMA Tertinggi</h3>
          <p className="muted">Klik baris wilayah untuk membuka lokasi dan profil detail di Peta Interaktif</p>
          <ol className="rank">
            {top.map((d, i) => {
              const k = kab.find(x => x.nama === d.nama && x.provinsi === d.provinsi)
              return (
                <motion.li key={d.nama} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }} onClick={() => go('peta', k?.kode_bps)}>
                  <span className="no">{d.rank_iprt}</span>
                  <div><b>{d.nama.replace('Kabupaten ', 'Kab. ')}</b><small>{d.provinsi}</small></div>
                  <div className="bar"><i style={{ width: `${d.IPRT}%` }} /></div>
                  <b className="val">{fmt(d.IPRT)}</b>
                </motion.li>
              )
            })}
          </ol>
        </section>

        <section className="card">
          <h3>Program Revitalisasi Sekolah 2025 Menurut Kategori Bantuan</h3>
          <p className="muted">Jumlah sekolah penerima pada 8 kategori prioritas terbesar (Pusdatin Kemendikdasmen)</p>
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={revit} layout="vertical" margin={{ left: 0, right: 48 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="kategori_bantuan" width={175} stroke="var(--axis)" fontSize={11} />
              <Tooltip content={<Tip unit=" sekolah" dec={0} />} cursor={{ fill: 'rgba(2, 132, 199, 0.06)' }} />
              <Bar dataKey="jumlah_sekolah" name="Sekolah" fill="#0284C7" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                <LabelList dataKey="jumlah_sekolah" position="right" formatter={v => fmtInt(v)} fill="var(--ink2)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="card insight">
        <MapPinned size={22} />
        <div>
          <b>Sintesis Kebijakan Utama.</b> Pengurutan berbasis volume kerusakan semata memusatkan <b>45,6%</b> sasaran di Pulau Jawa. Sebaliknya, Indeks PRISMA menggeser afirmasi ke daerah dengan proporsi kerusakan ekstrem dan menjangkau <b>92,2%</b> daerah berkapasitas fiskal rendah/sangat rendah. Karena hanya <b>{R.simulasi.irisan}</b> dari {R.simulasi.n_top} daerah yang beririsan, PRISMA mengusulkan <b>Alokasi Dua Jalur</b> yang dikawal melalui <b>Pelaporan Geotagging 3 Peran</b>.
          <button className="link" onClick={() => go('simulator')}>Simulasikan Alokasi Dua Jalur →</button>
        </div>
      </section>
    </div>
  )
}
