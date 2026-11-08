import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, ScatterChart, Scatter, CartesianGrid, ZAxis } from 'recharts'
import { fmt, LISA_COLORS } from '../lib/data'
import { Tip } from './Ringkasan'

const TERM = { '(Intercept)': 'Konstanta', p0_persen: 'Penduduk miskin (P0)', rls_tahun: 'Rata-rata lama sekolah', log_fiskal: 'ln rasio kapasitas fiskal', ipg_sd: 'Indeks pemerataan guru SD', kota: 'Wilayah kota (1 = kota)' }
const pfmt = p => (p < 0.001 ? '< 0,001' : fmt(p, 3))

const Stat = ({ k, v, s }) => <div className="stat"><span>{k}</span><b>{v}</b>{s && <small>{s}</small>}</div>

export default function Analisis({ data }) {
  const { ringkasan: R, kab } = data
  const g = R.regresi
  const terms = Object.keys(TERM)
  const lisa = ['Tinggi-Tinggi', 'Rendah-Rendah', 'Tinggi-Rendah', 'Rendah-Tinggi', 'Tidak signifikan'].map(k => ({ k, n: R.moran.lisa.find(x => x.lisa === k)?.n || 0 }))
  const scatter = kab.map(d => ({ x: d.p0_persen, y: d.pct_rusak_sedang_berat, nama: d.nama, lisa: d.lisa }))

  return (
    <div className="page">
      <header className="ph"><div><h1>Analisis Statistik</h1><p>Hasil inferensial dari kode R Markdown: uji beda antarpulau, autokorelasi spasial, regresi spasial, dan uji ketahanan indeks.</p></div></header>

      <div className="grid3">
        <section className="card">
          <h3>1 · Uji Kruskal–Wallis</h3>
          <p className="muted">% rusak sedang + berat antar 7 kelompok pulau</p>
          <div className="stats">
            <Stat k="H" v={fmt(R.kruskal.H, 2)} s={`df = ${R.kruskal.df}`} />
            <Stat k="p" v="< 0,001" />
            <Stat k="ε²" v={fmt(R.kruskal.epsilon2, 3)} s="efek sedang–besar" />
            <Stat k="η² provinsi" v={fmt(R.kruskal.eta2_provinsi, 3)} s="65% variasi di dalam provinsi" />
          </div>
        </section>
        <section className="card">
          <h3>2 · Autokorelasi spasial</h3>
          <p className="muted">Bobot 5 tetangga terdekat, standardisasi baris</p>
          <div className="stats">
            <Stat k="Moran's I" v={fmt(R.moran.I, 3)} />
            <Stat k="p (analitik)" v="< 0,001" />
            <Stat k="p (Monte Carlo)" v={fmt(R.moran.p_mc, 3)} s="999 permutasi" />
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={lisa} layout="vertical" margin={{ left: 6, right: 34 }}>
              <XAxis type="number" hide /><YAxis type="category" dataKey="k" width={112} stroke="var(--axis)" fontSize={11} />
              <Tooltip content={<Tip unit=" daerah" dec={0} />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
              <Bar dataKey="n" name="Kab/kota" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {lisa.map(l => <Cell key={l.k} fill={l.k === 'Tidak signifikan' ? '#3A465E' : LISA_COLORS[l.k]} />)}
                <LabelList dataKey="n" position="right" fill="var(--ink2)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="card">
          <h3>3 · Ketahanan indeks PRISMA</h3>
          <p className="muted">1.000 bobot acak Dirichlet(8, 6, 6)</p>
          <div className="stats">
            <Stat k="Median Kendall τ" v={fmt(R.iprt.sensitivitas.kendall_tau_median, 3)} />
            <Stat k="Persentil ke-5 τ" v={fmt(R.iprt.sensitivitas.kendall_tau_p05, 3)} />
            <Stat k="Tetap di kuintil atas" v={`${fmt(100 * R.iprt.sensitivitas.tetap_kuintil_atas_median, 1)}%`} s="median antarsimulasi" />
          </div>
        </section>
      </div>

      <section className="card">
        <h3>4 · Regresi: OLS → uji LM robust → model galat spasial (SEM)</h3>
        <p className="muted">Variabel terikat: % ruang kelas rusak sedang + berat (n = 514). Model terpilih: <b>{g.terpilih}</b>, λ = {fmt(g.param.nilai, 3)}</p>
        <div className="grid2 tight">
          <div className="tbl-scroll">
            <table className="tbl">
              <thead><tr><th>Variabel</th><th>OLS β</th><th>p</th><th>SEM β</th><th>SE</th><th>p</th></tr></thead>
              <tbody>
                {terms.map(t => {
                  const o = g.koef.find(k => k.model === 'OLS' && k.term === t)
                  const s = g.koef.find(k => k.model === 'SEM' && k.term === t)
                  return (
                    <tr key={t} className={s.p < 0.05 && t !== '(Intercept)' ? 'sig' : ''}>
                      <td>{TERM[t]}</td><td>{fmt(o.estimate, 3)}</td><td>{pfmt(o.p)}</td><td><b>{fmt(s.estimate, 3)}</b></td><td>{fmt(s.se, 3)}</td><td>{pfmt(s.p)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="stats wrap">
            <Stat k="R² OLS" v={fmt(g.r2_ols, 3)} />
            <Stat k="Breusch–Pagan" v={fmt(g.bp.statistic, 2)} s={`p = ${fmt(g.bp['p.value'], 3)}`} />
            <Stat k="Moran I residual" v={fmt(g.moran_resid_I, 3)} s="p < 0,001" />
            <Stat k="LM robust galat" v={fmt(g.lm.adjRSerr.stat, 2)} s="lebih besar → SEM" />
            <Stat k="LM robust lag" v={fmt(g.lm.adjRSlag.stat, 2)} />
            <Stat k="AIC OLS / SAR / SEM" v={`${fmt(g.aic.OLS, 0)} / ${fmt(g.aic.SAR, 0)} / ${fmt(g.aic.SEM, 0)}`} />
            <Stat k="VIF maksimum" v={fmt(Math.max(...Object.values(g.vif)), 2)} s="tidak ada multikolinearitas" />
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Kemiskinan vs kerusakan ruang kelas</h3>
        <p className="muted">Setiap titik = satu kabupaten/kota; warna = klaster LISA</p>
        <div className="legend">{Object.entries(LISA_COLORS).map(([k, c]) => <span key={k}><i style={{ background: k === 'Tidak signifikan' ? '#55617A' : c }} />{k}</span>)}</div>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 18, left: -6 }}>
            <CartesianGrid stroke="var(--grid)" />
            <XAxis type="number" dataKey="x" name="P0" unit="%" stroke="var(--axis)" fontSize={11} label={{ value: 'Penduduk miskin (P0, %)', position: 'insideBottom', offset: -10, fill: 'var(--ink3)', fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name="% RS+RB" unit="%" stroke="var(--axis)" fontSize={11} />
            <ZAxis range={[36, 36]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => active && payload?.length ? (
              <div className="tip"><b>{payload[0].payload.nama}</b><div>P0: <b>{fmt(payload[0].payload.x, 2)}%</b></div><div>Rusak sedang + berat: <b>{fmt(payload[0].payload.y)}%</b></div><div>{payload[0].payload.lisa}</div></div>) : null} />
            {Object.keys(LISA_COLORS).map(k => (
              <Scatter key={k} name={k} data={scatter.filter(d => d.lisa === k)} fill={k === 'Tidak signifikan' ? '#55617A' : LISA_COLORS[k]} fillOpacity={k === 'Tidak signifikan' ? 0.55 : 0.95} stroke="var(--card)" strokeWidth={1} isAnimationActive={false} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}
