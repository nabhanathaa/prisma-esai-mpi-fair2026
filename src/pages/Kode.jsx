import React, { useState } from 'react'
import { Download, Copy, Check, Terminal, Cpu, Layers, ShieldCheck, BarChart3, Lock, BookOpen } from 'lucide-react'

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

export default function Kode({ user, go, onSwitchRole }) {
  const [activeMod, setActiveMod] = useState(PIPELINE_MODULES[0].id)
  const [copied, setCopied] = useState(false)

  // Menu Kode Analisis dikhususkan hanya untuk Peran 1 (Analis Pusat)
  if (user && user.role !== 'pusat') {
    return (
      <div className="page">
        <header className="ph">
          <div>
            <span className="eyebrow">ARSITEKTUR KOMPUTASI SPASIAL</span>
            <h1>Kode Analisis &amp; Pipeline Ekonometrika</h1>
          </div>
        </header>
        <section className="locked-access-card">
          <div className="lac-icon"><Lock size={34} /></div>
          <span className="lac-badge">KHUSUS PERAN 1 · ANALIS PUSAT (KEMENDIKDASMEN / PUSDATIN)</span>
          <h2>Repositori Skrip Komputasi Dikhususkan bagi Analis Pusat</h2>
          <p>
            Sesuai pembagian peran sistem PRISMA, skrip pemodelan ekonometrika spasial R hanya ditampilkan untuk <b>Peran 1 (Analis Pusat)</b>. Untuk memahami rumus indeks, sumber data, dan alur tata kelola, silakan buka halaman <b>Metodologi &amp; Data</b>.
          </p>
          <div className="lac-actions">
            <button type="button" className="btn primary" onClick={() => go('metodologi')}>
              <BookOpen size={16} /> Buka Metodologi &amp; Data
            </button>
            {onSwitchRole && (
              <button type="button" className="btn ghost" onClick={() => onSwitchRole('pusat')}>
                Beralih ke Peran 1 (Analis Pusat)
              </button>
            )}
          </div>
        </section>
      </div>
    )
  }

  const cur = PIPELINE_MODULES.find(m => m.id === activeMod) || PIPELINE_MODULES[0]

  const copyCode = text => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="page">
      <header className="ph">
        <div>
          <span className="eyebrow">REPRODUKSIBILITAS KOMPUTASI STATISTIKA · KHUSUS ANALIS PUSAT (PERAN 1)</span>
          <h1>Arsitektur Pipeline &amp; Kode Ekonometrika Spasial</h1>
          <p>
            Ringkasan eksekutif modul komputasi R (<code>sf</code>, <code>spdep</code>, <code>spatialreg</code>) yang memproses 514 kabupaten/kota. Pilih modul di bawah untuk meninjau inti algoritma atau unduh berkas <code>.Rmd</code> lengkap.
          </p>
        </div>
        <a className="btn primary sm" href={`${import.meta.env.BASE_URL}kode/${FILE}`} download>
          <Download size={15} /> Unduh Skrip Lengkap (.Rmd)
        </a>
      </header>

      {/* Ringkasan Spesifikasi Lingkungan Komputasi */}
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

      {/* Navigasi Tab 5 Modul Inti */}
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
              <span className="eyebrow">{cur.step.toUpperCase()} · PUSTAKA: {cur.packages.toUpperCase()}</span>
              <h3>{cur.title}</h3>
              <p className="muted">{cur.purpose}</p>
            </div>
          </div>

          <div className="cdp-metrics">
            {cur.metrics.map(([k, v]) => (
              <div key={k} className="cdp-metric-box">
                <small>{k}</small>
                <b>{v}</b>
              </div>
            ))}
          </div>

          <div className="codeblock">
            <div className="cb-head">
              <span>Cuplikan Kode Inti ({cur.step} — {FILE})</span>
              <button className="btn ghost sm" type="button" onClick={() => copyCode(cur.code)}>
                {copied ? <><Check size={14} /> Tersalin</> : <><Copy size={14} /> Salin Kode</>}
              </button>
            </div>
            <pre dangerouslySetInnerHTML={{ __html: highlight(cur.code) }} />
          </div>

          <div className="cdp-footer">
            <BarChart3 size={16} />
            <span>
              Seluruh keluaran modul ini diekspor secara otomatis ke <code>public/data/app_kabkota.json</code> dan <code>app_ringkasan.json</code> sehingga antarmuka web selalu sinkron 100% dengan hasil olahan R.
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
