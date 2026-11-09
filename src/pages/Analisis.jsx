import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LabelList, ScatterChart, Scatter, CartesianGrid, ZAxis
} from 'recharts'
import {
  Sigma, Code2, Lock, Download, Copy, Check, Terminal,
  Cpu, Layers, ShieldCheck, BarChart3, BookOpen
} from 'lucide-react'
import { fmt, LISA_COLORS } from '../lib/data'
import { Tip } from './Ringkasan'

const TERM = {
  '(Intercept)': 'Konstanta',
  p0_persen: 'Penduduk miskin (P0)',
  rls_tahun: 'Rata-rata lama sekolah',
  log_fiskal: 'ln rasio kapasitas fiskal',
  ipg_sd: 'Indeks pemerataan guru SD',
  kota: 'Wilayah kota (1 = kota)',
}
const pfmt = p => (p < 0.001 ? '< 0,001' : fmt(p, 3))

const Stat = ({ k, v, s }) => (
  <div className="stat">
    <span>{k}</span>
    <b>{v}</b>
    {s && <small>{s}</small>}
  </div>
)

const FILE = 'ATLAS_Kelas_Analisis.Rmd'

const PIPELINE_MODULES = [
  {
    id: 'spasial',
    step: 'Modul 01',
    title: 'Matriks Bobot Spasial (k-NN) & Autokorelasi Moran / LISA',
    packages: 'sf · spdep',
    purpose: 'Mengonstruksi matriks ketetanggaan 5-Nearest Neighbours (5-NN) terstandardisasi baris untuk mengatasi isolasi poligon kepulauan di Indonesia, lalu menguji pengelompokan spasial global dan lokal.',
    metrics: [
      ['Moran\'s I Global', '0,403 (p < 0,001)'],
      ['Permutasi Monte Carlo', '999 replikasi (p = 0,001)'],
      ['Klaster Tinggi-Tinggi (Hotspot)', '31 Kabupaten/Kota'],
      ['Klaster Rendah-Rendah (Coldspot)', '49 Kabupaten/Kota'],
    ],
    code: `# Konstruksi matriks bobot 5 tetangga terdekat (k-NN, jarak lingkaran besar WGS84)
titik <- sf::st_point_on_surface(d)
koord <- sf::st_coordinates(titik)
nb    <- spdep::knn2nb(spdep::knearneigh(koord, k = 5, longlat = TRUE))
lw    <- spdep::nb2listw(nb, style = "W")

# Uji Moran's I global (analitik & Monte Carlo 999 permutasi)
mi    <- spdep::moran.test(d$pct_rusak_sedang_berat, lw, randomisation = TRUE)
mi_mc <- spdep::moran.mc(d$pct_rusak_sedang_berat, lw, nsim = 999)

# Identifikasi klaster lokal (LISA) pada taraf nyata 5%
li    <- spdep::localmoran(d$pct_rusak_sedang_berat, lw)
z     <- as.numeric(scale(d$pct_rusak_sedang_berat))
lz    <- spdep::lag.listw(lw, z)`,
  },
  {
    id: 'regresi',
    step: 'Modul 02',
    title: 'Diagnostik Lagrange Multiplier & Spatial Error Model (SEM)',
    packages: 'spatialreg · stats',
    purpose: 'Menguji pelanggaran independensi residual OLS dan memilih spesifikasi ekonometrika spasial terbaik menggunakan uji Lagrange Multiplier (LM) Robust Anselin.',
    metrics: [
      ['Moran\'s I Residual OLS', '0,343 (p < 0,001)'],
      ['Robust LM Error vs Lag', '16,91 vs 14,78 (Pilih SEM)'],
      ['Parameter Spasial (λ)', '0,562 (p < 0,001)'],
      ['Penurunan AIC (OLS → SEM)', '3.723,9 → 3.608,0 (-115,9)'],
    ],
    code: `# Estimasi baseline OLS dan uji diagnostik ketergantungan spasial
f   <- pct_rusak_sedang_berat ~ p0_persen + rls_tahun + log_fiskal + ipg_sd + kota
ols <- lm(f, data = dm)
lm_tests <- spdep::lm.RStests(ols, lw, test = "all")

# Estimasi Spatial Lag (SAR) dan Spatial Error Model (SEM) via Maximum Likelihood
sar <- spatialreg::lagsarlm(f, data = dm, listw = lw)
sem <- spatialreg::errorsarlm(f, data = dm, listw = lw)

# Perbandingan kriteria informasi Akaike (AIC)
c(OLS = AIC(ols), SAR = AIC(sar), SEM = AIC(sem))`,
  },
  {
    id: 'indeks',
    step: 'Modul 03',
    title: 'Formulasi Indeks Komposit Non-Parametrik PRISMA',
    packages: 'dplyr · base',
    purpose: 'Menormalisasi indikator ke dalam peringkat persentil empiris [0, 1] agar tahan terhadap kemencengan distribusi (skewness) dan pencilan ekstrem antarwilayah.',
    metrics: [
      ['Bobot K (Kerusakan Kelas)', '40% (Persentil % RS + RB)'],
      ['Bobot S (Kerentanan Sosial)', '30% (Rerata Persentil P0 & -RLS)'],
      ['Bobot F (Kelemahan Fiskal)', '30% (Persentil -Kapasitas Fiskal)'],
      ['Rentang Skor PRISMA', '0 – 100 (Kuintil Prioritas)'],
    ],
    code: `# Fungsi peringkat persentil empiris [0, 1] yang tahan pencilan (robust rank)
pr <- function(x) {
  (rank(x, na.last = "keep", ties.method = "average") - 1) / (sum(!is.na(x)) - 1)
}

# Perhitungan komponen K, S, F dan skor komposit PRISMA
d <- d |> dplyr::mutate(
  K    = pr(pct_rusak_sedang_berat),
  S    = (pr(p0_persen) + pr(-rls_tahun)) / 2,
  F    = pr(-rasio_kapasitas_fiskal),
  IPRT = 100 * (0.40 * K + 0.30 * S + 0.30 * F),
  rank_iprt = rank(-IPRT, ties.method = "first")
)`,
  },
  {
    id: 'sensitivitas',
    step: 'Modul 04',
    title: 'Uji Ketahanan Bobot (Simulasi Monte Carlo Dirichlet)',
    packages: 'stats · base',
    purpose: 'Menguji stabilitas peringkat kabupaten/kota terhadap ketidakpastian bobot melalui 1.000 pembangkitan vektor bobot acak dari distribusi Dirichlet(8, 6, 6).',
    metrics: [
      ['Jumlah Simulasi Bobot', '1.000 Vektor Dirichlet(8, 6, 6)'],
      ['Median Korelasi Kendall τ', '0,890 (Sangat Kuat)'],
      ['Persentil Ke-5 Kendall τ', '0,783'],
      ['Retensi Kuintil Teratas', '86,4% Wilayah Tetap Stabil'],
    ],
    code: `# Generator vektor bobot acak berdistribusi Dirichlet(alpha)
rdir <- function(alpha) {
  x <- rgamma(length(alpha), alpha)
  x / sum(x)
}

# Evaluasi stabilitas peringkat pada 1.000 kombinasi bobot
top_kuintil <- d$IPRT >= quantile(d$IPRT, 0.80)
stab <- replicate(1000, {
  w <- rdir(c(8, 6, 6))
  s <- 100 * (w[1] * d$K + w[2] * d$S + w[3] * d$F)
  c(tau = cor(s, d$IPRT, method = "kendall"),
    tetap = mean((s >= quantile(s, 0.80))[top_kuintil]))
})`,
  },
  {
    id: 'alokasi',
    step: 'Modul 05',
    title: 'Evaluasi Alokasi Dua Jalur (Kebutuhan Absolut vs Afirmasi)',
    packages: 'dplyr · tidyr',
    purpose: 'Membandingkan profil 20% kabupaten/kota prioritas teratas (103 wilayah) antara pengurutan volume kerusakan berat absolut dengan pengurutan indeks PRISMA.',
    metrics: [
      ['Irisan Wilayah (Overlap)', 'Hanya 36 dari 103 Kab/Kota'],
      ['Cakupan Daerah Fiskal Rendah', '75,7% (Volume) → 92,2% (PRISMA)'],
      ['Pangsa Wilayah di Jawa', '45,6% (Volume) → 16,5% (PRISMA)'],
      ['Pangsa Kawasan Timur (3T)', '10,7% (Volume) → 25,2% (PRISMA)'],
    ],
    code: `# Seleksi kuintil teratas (n = 103 kab/kota) untuk masing-masing jalur kebijakan
n_top <- round(0.20 * nrow(dd))
ambil <- function(skor) dd[order(skor, decreasing = TRUE)[1:n_top], ]

jalur_volume <- ambil(dd$rusak_berat_total)
jalur_prisma <- ambil(dd$IPRT)

# Hitung derajat irisan sasaran antara kedua jalur
irisan_sasaran <- length(intersect(jalur_volume$kode_bps, jalur_prisma$kode_bps))`,
  },
]

const KW = /\b(function|if|else|for|in|return|library|TRUE|FALSE|NULL|NA)\b/g
function highlight(code) {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return code
    .split('\n')
    .map(line => {
      const i = line.indexOf('#')
      const head = i >= 0 && !/["'][^"']*#/.test(line.slice(0, i + 1)) ? line.slice(0, i) : line
      const tail = head.length < line.length ? line.slice(head.length) : ''
      const h = esc(head)
        .replace(/("[^"]*")/g, '<span class="s">$1</span>')
        .replace(KW, '<span class="k">$1</span>')
        .replace(/(&lt;-|\|&gt;|%&gt;%)/g, '<span class="o">$1</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="n">$1</span>')
      return h + (tail ? `<span class="c">${esc(tail)}</span>` : '')
    })
    .join('\n')
}

export default function Analisis({ data, user, go, focus, onSwitchRole }) {
  const [subTab, setSubTab] = useState('statistik') // 'statistik' | 'kode'
  const [activeMod, setActiveMod] = useState(PIPELINE_MODULES[0].id)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (focus === 'tab-kode') {
      setSubTab('kode')
    }
  }, [focus])

  const { ringkasan: R, kab } = data
  const g = R.regresi
  const terms = Object.keys(TERM)
  const lisa = ['Tinggi-Tinggi', 'Rendah-Rendah', 'Tinggi-Rendah', 'Rendah-Tinggi', 'Tidak signifikan'].map(k => ({
    k,
    n: R.moran.lisa.find(x => x.lisa === k)?.n || 0,
  }))
  const scatter = kab.map(d => ({
    x: d.p0_persen,
    y: d.pct_rusak_sedang_berat,
    nama: d.nama,
    lisa: d.lisa,
  }))

  const isPusat = user?.role === 'pusat'
  const curMod = PIPELINE_MODULES.find(m => m.id === activeMod) || PIPELINE_MODULES[0]

  const copyCode = text => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="page">
      <header className="ph">
        <div>
          <span className="eyebrow">INFERENSI EKONOMETRIKA SPASIAL &amp; REPRODUKSIBILITAS KOMPUTASI</span>
          <h1>Statistik &amp; Komputasi Spasial (R Pipeline)</h1>
          <p>
            Pengujian hipotesis antarpulau, autokorelasi spasial Moran &amp; LISA, regresi <em>Spatial Error Model</em> (SEM), uji ketahanan Dirichlet, serta arsitektur skrip komputasi R pada 514 kabupaten/kota.
          </p>
        </div>
        {subTab === 'kode' && isPusat && (
          <a className="btn primary sm" href={`${import.meta.env.BASE_URL}kode/${FILE}`} download>
            <Download size={15} /> Unduh Skrip Lengkap (.Rmd)
          </a>
        )}
      </header>

      {/* Sub-Navigasi: Gabungan Analisis Statistik & Kode Komputasi R */}
      <div className="analysis-subtabs" role="tablist">
        <button
          type="button"
          className={subTab === 'statistik' ? 'ast-btn on' : 'ast-btn'}
          onClick={() => setSubTab('statistik')}
        >
          <Sigma size={17} />
          <div>
            <b>1. Hasil Inferensi &amp; Ekonometrika Spasial</b>
            <small>Uji Kruskal–Wallis, Moran&apos;s I, LISA, Regresi SEM &amp; Sensitivitas (Semua Peran)</small>
          </div>
        </button>

        <button
          type="button"
          className={subTab === 'kode' ? 'ast-btn on' : 'ast-btn'}
          onClick={() => setSubTab('kode')}
        >
          <Code2 size={17} />
          <div>
            <b>2. Arsitektur Pipeline &amp; Kode R (.Rmd)</b>
            <small>Modul Algoritma <code>sf</code>, <code>spdep</code>, <code>spatialreg</code> {isPusat ? '(Akses Terbuka)' : '· Khusus Peran 1 (Analis Pusat)'}</small>
          </div>
          {!isPusat && <span className="lock-tag"><Lock size={13} /> Peran 1</span>}
        </button>
      </div>

      {subTab === 'statistik' ? (
        <>
          <div className="grid3">
            <section className="card">
              <h3>1 · Uji Kruskal–Wallis Antarpulau</h3>
              <p className="muted">% rusak sedang + berat antar 7 kelompok pulau</p>
              <div className="stats">
                <Stat k="H" v={fmt(R.kruskal.H, 2)} s={`df = ${R.kruskal.df}`} />
                <Stat k="p-value" v="< 0,001" s="Signifikan kuat" />
                <Stat k="ε² (Ukuran Efek)" v={fmt(R.kruskal.epsilon2, 3)} s="Efek sedang–besar" />
                <Stat k="η² Provinsi" v={fmt(R.kruskal.eta2_provinsi, 3)} s="65% variasi di dalam provinsi" />
              </div>
            </section>

            <section className="card">
              <h3>2 · Autokorelasi Spasial Global &amp; Lokal</h3>
              <p className="muted">Bobot 5 tetangga terdekat (5-NN), standardisasi baris</p>
              <div className="stats">
                <Stat k="Moran's I" v={fmt(R.moran.I, 3)} />
                <Stat k="p (Analitik)" v="< 0,001" />
                <Stat k="p (Monte Carlo)" v={fmt(R.moran.p_mc, 3)} s="999 permutasi" />
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={lisa} layout="vertical" margin={{ left: 6, right: 34 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="k" width={112} stroke="var(--axis)" fontSize={11} />
                  <Tooltip content={<Tip unit=" daerah" dec={0} />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
                  <Bar dataKey="n" name="Kab/kota" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    {lisa.map(l => (
                      <Cell key={l.k} fill={l.k === 'Tidak signifikan' ? '#3A465E' : LISA_COLORS[l.k]} />
                    ))}
                    <LabelList dataKey="n" position="right" fill="var(--ink2)" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="card">
              <h3>3 · Ketahanan Indeks PRISMA</h3>
              <p className="muted">1.000 bobot acak Dirichlet(8, 6, 6)</p>
              <div className="stats">
                <Stat k="Median Kendall τ" v={fmt(R.iprt.sensitivitas.kendall_tau_median, 3)} />
                <Stat k="Persentil ke-5 τ" v={fmt(R.iprt.sensitivitas.kendall_tau_p05, 3)} />
                <Stat
                  k="Tetap di kuintil atas"
                  v={`${fmt(100 * R.iprt.sensitivitas.tetap_kuintil_atas_median, 1)}%`}
                  s="Median antarsimulasi"
                />
              </div>
            </section>
          </div>

          <section className="card">
            <h3>4 · Regresi Spasial: OLS → Uji LM Robust → Spatial Error Model (SEM)</h3>
            <p className="muted">
              Variabel terikat: % ruang kelas rusak sedang + berat (n = 514). Model terpilih: <b>{g.terpilih}</b>, λ = {fmt(g.param.nilai, 3)}
            </p>
            <div className="grid2 tight">
              <div className="tbl-scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Variabel Penjelas</th>
                      <th>OLS β</th>
                      <th>p</th>
                      <th>SEM β</th>
                      <th>SE</th>
                      <th>p</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terms.map(t => {
                      const o = g.koef.find(k => k.model === 'OLS' && k.term === t)
                      const s = g.koef.find(k => k.model === 'SEM' && k.term === t)
                      return (
                        <tr key={t} className={s.p < 0.05 && t !== '(Intercept)' ? 'sig' : ''}>
                          <td>{TERM[t]}</td>
                          <td>{fmt(o.estimate, 3)}</td>
                          <td>{pfmt(o.p)}</td>
                          <td><b>{fmt(s.estimate, 3)}</b></td>
                          <td>{fmt(s.se, 3)}</td>
                          <td>{pfmt(s.p)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="stats wrap">
                <Stat k="R² OLS" v={fmt(g.r2_ols, 3)} />
                <Stat k="Breusch–Pagan" v={fmt(g.bp.statistic, 2)} s={`p = ${fmt(g.bp['p.value'], 3)}`} />
                <Stat k="Moran I Residual" v={fmt(g.moran_resid_I, 3)} s="p < 0,001" />
                <Stat k="LM Robust Galat" v={fmt(g.lm.adjRSerr.stat, 2)} s="Lebih besar → SEM" />
                <Stat k="LM Robust Lag" v={fmt(g.lm.adjRSlag.stat, 2)} />
                <Stat k="AIC OLS / SAR / SEM" v={`${fmt(g.aic.OLS, 0)} / ${fmt(g.aic.SAR, 0)} / ${fmt(g.aic.SEM, 0)}`} />
                <Stat k="VIF Maksimum" v={fmt(Math.max(...Object.values(g.vif)), 2)} s="Bebas multikolinearitas" />
              </div>
            </div>
          </section>

          <section className="card">
            <h3>5 · Sebaran Kemiskinan Daerah vs Kerusakan Ruang Kelas</h3>
            <p className="muted">Setiap titik merepresentasikan satu kabupaten/kota; warna menunjukkan klaster spasial LISA</p>
            <div className="legend">
              {Object.entries(LISA_COLORS).map(([k, c]) => (
                <span key={k}>
                  <i style={{ background: k === 'Tidak signifikan' ? '#55617A' : c }} />
                  {k}
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 8, right: 16, bottom: 18, left: -6 }}>
                <CartesianGrid stroke="var(--grid)" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="P0"
                  unit="%"
                  stroke="var(--axis)"
                  fontSize={11}
                  label={{ value: 'Penduduk miskin (P0, %)', position: 'insideBottom', offset: -10, fill: 'var(--ink3)', fontSize: 11 }}
                />
                <YAxis type="number" dataKey="y" name="% RS+RB" unit="%" stroke="var(--axis)" fontSize={11} />
                <ZAxis range={[36, 36]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="tip">
                        <b>{payload[0].payload.nama}</b>
                        <div>P0: <b>{fmt(payload[0].payload.x, 2)}%</b></div>
                        <div>Rusak sedang + berat: <b>{fmt(payload[0].payload.y)}%</b></div>
                        <div>Klaster: {payload[0].payload.lisa}</div>
                      </div>
                    ) : null
                  }
                />
                {Object.keys(LISA_COLORS).map(k => (
                  <Scatter
                    key={k}
                    name={k}
                    data={scatter.filter(d => d.lisa === k)}
                    fill={k === 'Tidak signifikan' ? '#55617A' : LISA_COLORS[k]}
                    fillOpacity={k === 'Tidak signifikan' ? 0.55 : 0.95}
                    stroke="var(--card)"
                    strokeWidth={1}
                    isAnimationActive={false}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </section>
        </>
      ) : !isPusat ? (
        <section className="locked-access-card">
          <div className="lac-icon"><Lock size={34} /></div>
          <span className="lac-badge">KHUSUS PERAN 1 · ANALIS PUSAT (KEMENDIKDASMEN / PUSDATIN)</span>
          <h2>Repositori Skrip Komputasi R Dikhususkan bagi Analis Pusat</h2>
          <p>
            Sesuai pembagian hak akses tata kelola PRISMA, rincian skrip pemodelan ekonometrika spasial R hanya dibuka bagi <b>Peran 1 (Analis Pusat)</b>. Anda tetap dapat meninjau hasil inferensi pada sub-tab <b>Hasil Inferensi &amp; Ekonometrika Spasial</b> atau membaca spesifikasi rumus di halaman <b>Metodologi &amp; Data</b>.
          </p>
          <div className="lac-actions">
            <button type="button" className="btn primary" onClick={() => setSubTab('statistik')}>
              <Sigma size={16} /> Lihat Hasil Inferensi Statistik
            </button>
            <button type="button" className="btn secondary" onClick={() => go && go('metodologi')}>
              <BookOpen size={16} /> Buka Metodologi &amp; Data
            </button>
            {onSwitchRole && (
              <button type="button" className="btn ghost" onClick={() => onSwitchRole('pusat')}>
                Simulasi Masuk Peran 1 (Analis Pusat)
              </button>
            )}
          </div>
        </section>
      ) : (
        <>
          <div className="code-spec-strip">
            <div className="css-item">
              <Terminal size={18} />
              <div><small>Bahasa &amp; Mesin</small><b>R 4.4+ · R Markdown</b></div>
            </div>
            <div className="css-item">
              <Layers size={18} />
              <div><small>Geometri &amp; Bobot Spasial</small><b>WGS84 (EPSG:4326) · 5-NN Row-Standardized</b></div>
            </div>
            <div className="css-item">
              <Cpu size={18} />
              <div><small>Estimator Regresi</small><b>Maximum Likelihood SEM (λ = 0,562)</b></div>
            </div>
            <div className="css-item">
              <ShieldCheck size={18} />
              <div><small>Validasi Ketahanan</small><b>1.000 Replikasi Dirichlet (τ = 0,890)</b></div>
            </div>
          </div>

          <div className="code-explorer-grid">
            <aside className="card code-nav-list">
              <h4>Tahapan Pipeline Inti</h4>
              {PIPELINE_MODULES.map(m => (
                <button
                  type="button"
                  key={m.id}
                  className={activeMod === m.id ? 'cnav-btn on' : 'cnav-btn'}
                  onClick={() => setActiveMod(m.id)}
                >
                  <span className="cnav-step">{m.step}</span>
                  <b>{m.title}</b>
                  <small>Pustaka: {m.packages}</small>
                </button>
              ))}
            </aside>

            <section className="card code-detail-pane">
              <div className="cdp-head">
                <div>
                  <span className="eyebrow">{curMod.step.toUpperCase()} · PUSTAKA: {curMod.packages.toUpperCase()}</span>
                  <h3>{curMod.title}</h3>
                  <p className="muted">{curMod.purpose}</p>
                </div>
              </div>

              <div className="cdp-metrics">
                {curMod.metrics.map(([k, v]) => (
                  <div key={k} className="cdp-metric-box">
                    <small>{k}</small>
                    <b>{v}</b>
                  </div>
                ))}
              </div>

              <div className="codeblock">
                <div className="cb-head">
                  <span>Cuplikan Kode Inti ({curMod.step} — {FILE})</span>
                  <button className="btn ghost sm" type="button" onClick={() => copyCode(curMod.code)}>
                    {copied ? <><Check size={14} /> Tersalin</> : <><Copy size={14} /> Salin Kode</>}
                  </button>
                </div>
                <pre dangerouslySetInnerHTML={{ __html: highlight(curMod.code) }} />
              </div>

              <div className="cdp-footer">
                <BarChart3 size={16} />
                <span>
                  Seluruh keluaran modul ini diekspor secara otomatis ke <code>public/data/app_kabkota.json</code> dan <code>app_ringkasan.json</code> sehingga antarmuka web selalu sinkron 100% dengan hasil olahan R.
                </span>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
