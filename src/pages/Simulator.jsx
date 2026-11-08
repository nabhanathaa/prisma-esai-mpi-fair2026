import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Download, Lock, ArrowUpRight } from 'lucide-react'
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

export default function Simulator({ data, user, go }) {
  const { kab } = data
  const [w, setW] = useState(DEF)
  const [n, setN] = useState(103)
  const [pulau, setPulau] = useState('Semua')
  const [show, setShow] = useState(25)

  const sim = useMemo(() => simulate(kab, w, n), [kab, w, n])
  const tot = w.K + w.S + w.F || 1
  const list = sim.iprt.filter(d => pulau === 'Semua' || d.pulau === pulau)
  const canExport = user.role !== 'publik'

  const slider = (k, label, color) => (
    <div className="slider">
      <div><span><i style={{ background: color }} />{label}</span><b>{Math.round((100 * w[k]) / tot)}%</b></div>
      <input type="range" min={0} max={100} value={w[k]} onChange={e => setW({ ...w, [k]: +e.target.value })} style={{ '--c': color }} />
    </div>
  )

  return (
    <div className="page">
      <header className="ph">
        <div><h1>Prioritas &amp; Simulator Alokasi</h1><p>Ubah bobot komponen dan jumlah daerah sasaran. Peringkat dan perbandingan dihitung ulang langsung di peramban.</p></div>
      </header>

      <div className="grid-sim">
        <section className="card">
          <h3>Bobot komponen IPRT</h3>
          <p className="muted">Bobot dinormalisasi otomatis sehingga totalnya 100%</p>
          {slider('K', 'K · Kerusakan ruang kelas', '#E5484D')}
          {slider('S', 'S · Kerentanan sosial (P0, RLS)', '#E08A35')}
          {slider('F', 'F · Kelemahan fiskal', '#38AFC8')}
          <div className="formula">IPRT = 100 × ({fmt(w.K / tot, 2)}·K + {fmt(w.S / tot, 2)}·S + {fmt(w.F / tot, 2)}·F)</div>
          <div className="slider">
            <div><span>Jumlah daerah sasaran</span><b>{n}</b></div>
            <input type="range" min={20} max={257} value={n} onChange={e => setN(+e.target.value)} style={{ '--c': '#9AA6BF' }} />
          </div>
          <button className="btn ghost sm" onClick={() => { setW(DEF); setN(103) }}><RotateCcw size={14} /> Kembali ke bobot esai (40/30/30, 103 daerah)</button>
        </section>

        <section className="card">
          <h3>Pendekatan volume vs IPRT</h3>
          <div className="legend"><span><i className="vol" />Volume (jumlah ruang rusak berat)</span><span><i className="ipr" />IPRT</span></div>
          <Compare label="Cakupan ruang rusak berat nasional" a={sim.sVol.cakupan} b={sim.sIPRT.cakupan} />
          <Compare label="Median % rusak sedang + berat" a={sim.sVol.medRSB} b={sim.sIPRT.medRSB} />
          <Compare label="Daerah berfiskal rendah/sangat rendah" a={sim.sVol.fiskalRendah} b={sim.sIPRT.fiskalRendah} />
          <Compare label="Median penduduk miskin (P0)" a={sim.sVol.medP0} b={sim.sIPRT.medP0} dec={2} />
          <Compare label="Sasaran di Jawa" a={sim.sVol.jawa} b={sim.sIPRT.jawa} />
          <Compare label="Sasaran di Papua, Maluku, Bali-NT" a={sim.sVol.timur} b={sim.sIPRT.timur} />
          <motion.div className="overlap" key={sim.irisan} initial={{ scale: .96, opacity: .6 }} animate={{ scale: 1, opacity: 1 }}>
            Hanya <b>{sim.irisan}</b> dari {n} daerah muncul di kedua daftar. Karena itu, usulan esai adalah alokasi <b>dua jalur</b>: kebutuhan absolut + afirmasi IPRT.
          </motion.div>
        </section>
      </div>

      <section className="card">
        <div className="tbl-head">
          <div><h3>Peringkat IPRT (bobot saat ini)</h3><p className="muted">Baris berwarna = termasuk {n} daerah sasaran</p></div>
          <div className="tbl-tools">
            <select value={pulau} onChange={e => setPulau(e.target.value)}><option>Semua</option>{PULAU.map(p => <option key={p}>{p}</option>)}</select>
            <button className="btn ghost sm" disabled={!canExport} title={canExport ? 'Unduh CSV' : 'Hanya untuk akun analis/dinas'}
              onClick={() => downloadCSV(sim.iprt.map(d => ({ ...d, skor: d.skor.toFixed(2) })), ['rank', 'kode_bps', 'nama', 'provinsi', 'pulau', 'skor', 'K', 'S', 'F', 'pct_rusak_sedang_berat', 'rusak_berat_total', 'p0_persen', 'rls_tahun', 'rasio_kapasitas_fiskal'], 'peringkat_iprt.csv')}>
              {canExport ? <Download size={14} /> : <Lock size={14} />} CSV
            </button>
          </div>
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead><tr><th>#</th><th>Kabupaten/Kota</th><th>Provinsi</th><th>Skor</th><th>% RS+RB</th><th>P0</th><th>RLS</th><th>Fiskal</th><th></th></tr></thead>
            <tbody>
              {list.slice(0, show).map(d => (
                <tr key={d.kode_bps} className={d.rank <= n ? 'hit' : ''}>
                  <td>{d.rank}</td><td><b>{d.nama.replace('Kabupaten ', 'Kab. ')}</b></td><td>{d.provinsi}</td>
                  <td><div className="cellbar"><i style={{ width: `${d.skor}%` }} />{fmt(d.skor)}</div></td>
                  <td>{fmt(d.pct_rusak_sedang_berat)}</td><td>{fmt(d.p0_persen, 2)}</td><td>{fmt(d.rls_tahun, 2)}</td><td>{fmt(d.rasio_kapasitas_fiskal, 3)}</td>
                  <td><button className="icon" title="Lihat di peta" onClick={() => go('peta', d.kode_bps)}><ArrowUpRight size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {show < list.length && <button className="btn ghost sm more" onClick={() => setShow(s => s + 50)}>Tampilkan lebih banyak ({list.length - show} lagi)</button>}
      </section>
    </div>
  )
}
