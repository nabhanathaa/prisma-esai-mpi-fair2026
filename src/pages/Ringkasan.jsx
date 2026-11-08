import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts'
import { School, AlertTriangle, MapPinned, Network, Target, ArrowUpRight } from 'lucide-react'
import { fmt, fmtInt } from '../lib/data'

export const KONDISI = [
  { key: 'pct_baik', label: 'Baik', color: '#3FA6AC' },
  { key: 'pct_ringan', label: 'Rusak ringan', color: '#C9B458' },
  { key: 'pct_sedang', label: 'Rusak sedang', color: '#E08A35' },
  { key: 'pct_berat', label: 'Rusak berat', color: '#E5484D' },
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
  <motion.div className={`kpi ${tone || ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}>
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
        <div><h1>Ringkasan Nasional</h1><p>Potret kebutuhan revitalisasi sekolah Indonesia dari data 2025.</p></div>
        <button className="btn primary sm" onClick={() => go('peta')}>Buka peta <ArrowUpRight size={15} /></button>
      </header>

      <section className="prisma-hero">
        <div className="prisma-hero-copy">
          <span className="eyebrow">KEPUTUSAN BERBASIS BUKTI · 514 KABUPATEN/KOTA</span>
          <h2>Pemerataan bukan sekadar membagi rata.</h2>
          <p>PRISMA memadukan kondisi ruang kelas, kerentanan sosial, dan kapasitas fiskal untuk menunjukkan wilayah yang perlu didahulukan—secara transparan dan dapat ditelusuri.</p>
        </div>
        <div className="allocation-paths">
          <div><span className="path-mark volume">01</span><div><b>Jalur kebutuhan</b><small>Menjangkau kerusakan berat terbanyak.</small></div></div>
          <div><span className="path-mark prisma">02</span><div><b>Jalur afirmasi PRISMA</b><small>Mengutamakan tingkat kerusakan dan kerentanan.</small></div></div>
        </div>
      </section>

      <div className="kpis">
        <Kpi i={0} icon={School} label="Ruang kelas" value={fmtInt(tot.jumlah)} sub="Dapodik 2025, 4 jenjang" />
        <Kpi i={1} icon={AlertTriangle} tone="warn" label="Rusak sedang + berat" value={`${fmt(tot.pct_sedang_berat)}%`} sub={`${fmtInt(tot.rusak_sedang + tot.rusak_berat)} ruang`} />
        <Kpi i={2} icon={AlertTriangle} tone="crit" label="Rusak berat" value={fmtInt(tot.rusak_berat)} sub={`${fmt(tot.pct_berat)}% dari total`} />
        <Kpi i={3} icon={Network} label="Moran's I" value={fmt(R.moran.I, 3)} sub="Kerusakan mengelompok (p < 0,001)" />
        <Kpi i={4} icon={Target} tone="accent" label="Daerah prioritas" value={prioritas} sub="Kuintil teratas PRISMA" />
      </div>

      <div className="grid2">
        <section className="card">
          <h3>Komposisi kondisi ruang kelas per jenjang</h3>
          <p className="muted">Persentase terhadap jumlah ruang kelas jenjang tersebut</p>
          <div className="legend">{KONDISI.map(k => <span key={k.key}><i style={{ background: k.color }} />{k.label}</span>)}</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={jenjang} layout="vertical" margin={{ left: 4, right: 12 }} barCategoryGap={10}>
              <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `${Math.round(v)}%`} stroke="var(--axis)" fontSize={11} />
              <YAxis type="category" dataKey="jenjang" width={42} stroke="var(--axis)" fontSize={12} />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
              {KONDISI.map((k, i) => (
                <Bar key={k.key} dataKey={k.key} name={k.label} stackId="a" fill={k.color} stroke="var(--card)" strokeWidth={2}
                  radius={i === 3 ? [0, 4, 4, 0] : i === 0 ? [4, 0, 0, 4] : 0} isAnimationActive={false}>
                  {i === 3 && <LabelList dataKey={k.key} position="insideRight" formatter={v => `${fmt(v)}%`} fill="#fff" fontSize={11} />}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card">
          <h3>Median % rusak sedang + berat menurut kelompok pulau</h3>
          <p className="muted">Kruskal–Wallis H = {fmt(R.kruskal.H, 2)}, p &lt; 0,001, ε² = {fmt(R.kruskal.epsilon2, 2)}</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pulau} margin={{ top: 18, right: 8, left: -14 }}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="pulau" stroke="var(--axis)" fontSize={11} interval={0} angle={-30} textAnchor="end" height={52} tickFormatter={v => v.replace('Bali-Nusa Tenggara', 'Bali-NT')} />
              <YAxis stroke="var(--axis)" fontSize={11} tickFormatter={v => `${v}%`} />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
              <Bar dataKey="median" name="Median" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {pulau.map((p, i) => <Cell key={p.pulau} fill={i < 2 ? '#E5484D' : '#5B6B8C'} />)}
                <LabelList dataKey="median" position="top" formatter={v => fmt(v)} fill="var(--ink2)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid2">
        <section className="card">
          <h3>10 kabupaten/kota dengan skor PRISMA tertinggi</h3>
          <p className="muted">Klik untuk melihat di peta</p>
          <ol className="rank">
            {top.map((d, i) => {
              const k = kab.find(x => x.nama === d.nama && x.provinsi === d.provinsi)
              return (
                <motion.li key={d.nama} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .05 * i }} onClick={() => go('peta', k?.kode_bps)}>
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
          <h3>Revitalisasi sekolah 2025 menurut kategori bantuan</h3>
          <p className="muted">Jumlah sekolah penerima, 8 kategori terbesar (Pusdatin Kemendikdasmen)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revit} layout="vertical" margin={{ left: 0, right: 44 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="kategori_bantuan" width={170} stroke="var(--axis)" fontSize={11} />
              <Tooltip content={<Tip unit=" sekolah" dec={0} />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
              <Bar dataKey="jumlah_sekolah" name="Sekolah" fill="#38AFC8" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="jumlah_sekolah" position="right" formatter={v => fmtInt(v)} fill="var(--ink2)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="card insight">
        <MapPinned size={20} />
        <div>
          <b>Temuan kunci.</b> Pendekatan volume memilih 45,6% sasaran di Jawa. PRISMA mengalihkan prioritas ke daerah dengan kerusakan relatif lebih parah dan 92,2% berkapasitas fiskal rendah. Hanya {R.simulasi.irisan} dari {R.simulasi.n_top} daerah muncul di kedua daftar, sehingga PRISMA mengusulkan alokasi <b>dua jalur</b>: jalur kebutuhan absolut dan jalur afirmasi berbasis analisis spasial.
          <button className="link" onClick={() => go('simulator')}>Coba simulasi dua jalur →</button>
        </div>
      </section>
    </div>
  )
}
