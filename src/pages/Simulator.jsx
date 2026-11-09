import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Download, Lock, ArrowUpRight, Landmark, Building2, SlidersHorizontal } from 'lucide-react'
import { PULAU, simulate, fmt, downloadCSV } from '../lib/data'

const DEF = { K: 40, S: 30, F: 30 }

const Compare = ({ label, a, b, unit = '%', dec = 1, better }) => {
  const max = Math.max(a, b, 1)
  return (
    <div className="cmp">
      <span>{label}</span>
      <div className="cmp-bars">
        <div><i className="vol" style={{ width: `${(100 * a) / max}%` }} /><b>{fmt(a, dec)}{unit}</b></div>
        <div><i className="ipr" style={{ width: `${(100 * b) / max}%` }} /><b>{fmt(b, dec)}{unit}</b></div>
      </div>
      {better && <small>{better}</small>}
    </div>
  )
}

export default function Simulator({ data, user, go, onSwitchRole }) {
  const { kab } = data
  const [w, setW] = useState(DEF)
  const [n, setN] = useState(103)
  const [pulau, setPulau] = useState('Semua')
  const [show, setShow] = useState(25)

  const sim = useMemo(() => simulate(kab, w, n), [kab, w, n])
  const tot = w.K + w.S + w.F
  const list = sim.ranking.filter(d => pulau === 'Semua' || d.pulau === pulau)

  // Menu Simulasi hanya dapat diakses oleh Peran 1 (pusat) dan Peran 2 (daerah)
  if (user.role === 'publik') {
    return (
      <div className="page">
        <header className="ph">
          <div>
            <span className="eyebrow">SIMULASI KEBIJAKAN ALOKASI ANGGARAN</span>
            <h1>Simulasi Alokasi Dua Jalur</h1>
            <p>Instrumen pengambilan keputusan bagi pemangku kebijakan pusat dan daerah.</p>
          </div>
        </header>

        <section className="locked-access-card">
          <div className="lac-icon"><Lock size={36} /></div>
          <span className="lac-badge">MENU TERKUNCI · DIKHUSUSKAN UNTUK PERAN 1 &amp; PERAN 2</span>
          <h2>Fitur Simulasi Kebijakan &amp; Penetapan Kuota Daerah Terkunci</h2>
          <p>
            Anda saat ini masuk sebagai <b>Peran 3 (Masyarakat &amp; Warga Sekolah / Publik)</b>. Sesuai tata kelola berjenjang PRISMA, fitur <b>Simulasi Bobot Komponen Indeks (K, S, F), Penetapan Kuota Sasaran Nasional, dan Ekspor Daftar Prioritas</b> hanya dapat diakses oleh:
          </p>
          <div className="lac-roles-grid">
            <div className="lac-role-box">
              <Landmark size={20} />
              <div>
                <b>Peran 1 · Analis Pusat (Kemendikdasmen / Pusdatin)</b>
                <small>Perumus kebijakan alokasi nasional, penetapan bobot afirmasi &amp; kuota DAK Fisik Pendidikan.</small>
              </div>
            </div>
            <div className="lac-role-box">
              <Building2 size={20} />
              <div>
                <b>Peran 2 · Dinas Terkait Daerah &amp; Pihak Sekolah</b>
                <small>Dinas Pendidikan Provinsi/Kab/Kota, Bappeda, serta manajemen satuan pendidikan untuk perencanaan daerah.</small>
              </div>
            </div>
          </div>
          <div className="lac-actions">
            <button type="button" className="btn primary" onClick={() => go('peta')}>
              Buka Peta Interaktif Publik
            </button>
            <button type="button" className="btn secondary" onClick={() => go('pelaporan')}>
              Ajukan Laporan Sekolah (Before)
            </button>
            {onSwitchRole && (
              <>
                <button type="button" className="btn ghost" onClick={() => onSwitchRole('pusat')}>
                  Beralih ke Peran 1 (Analis Pusat)
                </button>
                <button type="button" className="btn ghost" onClick={() => onSwitchRole('daerah')}>
                  Beralih ke Peran 2 (Dinas / Sekolah)
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    )
  }

  const slider = (k, label, color) => (
    <div className="slider">
      <div><span><i style={{ background: color }} />{label}</span><b>{Math.round((100 * w[k]) / tot)}%</b></div>
      <input
        type="range"
        min={w.K + w.S + w.F === w[k] ? 1 : 0}
        max={100}
        value={w[k]}
        onChange={e => setW({ ...w, [k]: +e.target.value })}
        style={{ '--c': color }}
        aria-label={label}
      />
    </div>
  )

  return (
    <div className="page">
      <header className="ph">
        <div>
          <span className="eyebrow">SIMULATOR KEBIJAKAN · AKSES PERAN 1 (PUSAT) &amp; PERAN 2 (DAERAH/SEKOLAH)</span>
          <h1>Simulasi Alokasi Dua Jalur</h1>
          <p>Bandingkan pendekatan kebutuhan absolut (volume) dengan afirmasi spasial PRISMA. Ubah bobot komponen dan jumlah sasaran; peringkat 514 kabupaten/kota dihitung ulang seketika.</p>
        </div>
      </header>

      <div className="grid-sim">
        <section className="card">
          <h3><SlidersHorizontal size={17} /> Bobot Komponen Indeks PRISMA</h3>
          <p className="muted">Bobot dinormalisasi otomatis sehingga totalnya selalu 100%</p>
          {slider('K', 'K · Kerusakan ruang kelas (% RS + RB)', '#EF4444')}
          {slider('S', 'S · Kerentanan sosial (P0 & kebalikan RLS)', '#F59E0B')}
          {slider('F', 'F · Kelemahan kapasitas fiskal daerah', '#0284C7')}
          <div className="formula">PRISMA = 100 × ({fmt(w.K / tot, 2)}·K + {fmt(w.S / tot, 2)}·S + {fmt(w.F / tot, 2)}·F)</div>
          <div className="slider">
            <div><span>Jumlah daerah sasaran prioritas (Top-N)</span><b>{n} kab/kota ({fmt((100 * n) / 514, 1)}%)</b></div>
            <input type="range" min={20} max={257} value={n} onChange={e => setN(+e.target.value)} style={{ '--c': '#0284C7' }} />
          </div>
          <button className="btn ghost sm" onClick={() => { setW(DEF); setN(103) }}>
            <RotateCcw size={14} /> Kembalikan ke Bobot Baku Esai (40 / 30 / 30 · 103 daerah)
          </button>
        </section>

        <section className="card">
          <h3>Komparasi Dampak: Jalur Volume vs Jalur Afirmasi PRISMA</h3>
          <div className="legend">
            <span><i className="vol" />Jalur 1: Volume (Jumlah absolut rusak berat)</span>
            <span><i className="ipr" />Jalur 2: Indeks Spasial PRISMA</span>
          </div>
          <Compare label="Cakupan ruang rusak berat nasional" a={sim.sVol.cakupan} b={sim.sIPRT.cakupan} />
          <Compare label="Median % rusak sedang + berat daerah terpilih" a={sim.sVol.medRSB} b={sim.sIPRT.medRSB} />
          <Compare label="Pangsa daerah berfiskal rendah / sangat rendah" a={sim.sVol.fiskalRendah} b={sim.sIPRT.fiskalRendah} />
          <Compare label="Median tingkat kemiskinan (P0)" a={sim.sVol.medP0} b={sim.sIPRT.medP0} dec={2} />
          <Compare label="Proporsi daerah sasaran di Pulau Jawa" a={sim.sVol.jawa} b={sim.sIPRT.jawa} />
          <Compare label="Proporsi sasaran di Papua, Maluku, Bali-Nusa Tenggara" a={sim.sVol.timur} b={sim.sIPRT.timur} />
          <motion.div className="overlap" key={sim.irisan} initial={{ scale: 0.96, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}>
            Hanya <b>{sim.irisan}</b> dari <b>{n}</b> kabupaten/kota yang beririsan di kedua pendekatan. Oleh sebab itu, PRISMA merekomendasikan <b>Kebijakan Alokasi Dua Jalur</b>: menggabungkan penanganan beban absolut dengan afirmasi keadilan spasial.
          </motion.div>
        </section>
      </div>

      <section className="card">
        <div className="tbl-head">
          <div>
            <h3>Daftar Peringkat Kabupaten/Kota Hasil Simulasi</h3>
            <p className="muted">Baris berpenanda biru/merah termasuk dalam {n} daerah sasaran prioritas dari 514 wilayah</p>
          </div>
          <div className="tbl-tools">
            <select value={pulau} onChange={e => setPulau(e.target.value)}>
              <option>Semua</option>
              {PULAU.map(p => <option key={p}>{p}</option>)}
            </select>
            <button
              className="btn primary sm"
              title="Unduh hasil simulasi CSV"
              onClick={() =>
                downloadCSV(
                  sim.ranking.map(d => ({ ...d, skor: d.skor.toFixed(2) })),
                  ['rank', 'kode_bps', 'nama', 'provinsi', 'pulau', 'skor', 'K', 'S', 'F', 'pct_rusak_sedang_berat', 'rusak_berat_total', 'p0_persen', 'rls_tahun', 'rasio_kapasitas_fiskal'],
                  'simulasi_prioritas_prisma.csv'
                )
              }
            >
              <Download size={14} /> Unduh CSV
            </button>
          </div>
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Peringkat</th>
                <th>Kabupaten/Kota</th>
                <th>Provinsi</th>
                <th>Skor PRISMA</th>
                <th>% RS+RB</th>
                <th>P0 (%)</th>
                <th>RLS (Thn)</th>
                <th>Rasio Fiskal</th>
                <th>Peta</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, show).map(d => (
                <tr key={d.kode_bps} className={d.rank <= n ? 'hit' : ''}>
                  <td><b>#{d.rank}</b></td>
                  <td><b>{d.nama.replace('Kabupaten ', 'Kab. ')}</b></td>
                  <td>{d.provinsi}</td>
                  <td><div className="cellbar"><i style={{ width: `${d.skor}%` }} /><span>{fmt(d.skor)}</span></div></td>
                  <td>{fmt(d.pct_rusak_sedang_berat)}%</td>
                  <td>{fmt(d.p0_persen, 2)}%</td>
                  <td>{fmt(d.rls_tahun, 2)}</td>
                  <td>{fmt(d.rasio_kapasitas_fiskal, 3)}</td>
                  <td>
                    <button className="icon" title="Lihat di peta" onClick={() => go('peta', d.kode_bps)}>
                      <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {show < list.length && (
          <button className="btn ghost sm more" onClick={() => setShow(s => s + 50)}>
            Tampilkan lebih banyak ({list.length - show} wilayah lagi)
          </button>
        )}
      </section>
    </div>
  )
}
