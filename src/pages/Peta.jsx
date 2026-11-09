import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Layers, MapPin, Camera } from 'lucide-react'
import { VARS, PULAU, RAMP_RISK, RAMP_GOOD, LISA_COLORS, quantileBreaks, colorFor, fmt, fmtInt } from '../lib/data'

function FitTo({ bounds, panel }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize()
      const wide = map.getSize().x > 760
      if (bounds?.isValid()) map.fitBounds(bounds, { paddingTopLeft: [16, 16], paddingBottomRight: [panel && wide ? 360 : 16, 16], maxZoom: 8 })
    }, 120)
    return () => clearTimeout(t)
  }, [bounds, panel, map])
  return null
}

const Meter = ({ label, v, color }) => (
  <div className="meter"><span>{label}</span><div><i style={{ width: `${Math.round(v * 100)}%`, background: color }} /></div><b>{Math.round(v * 100)}</b></div>
)

export default function Peta({ data, focus, go }) {
  const { geo, byKode, kab } = data
  const [vk, setVk] = useState('IPRT')
  const [pulau, setPulau] = useState('Semua')
  const [prov, setProv] = useState('Semua')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(focus ? byKode[focus] : null)
  const [basemap, setBasemap] = useState(true)
  const geoRef = useRef()

  const v = VARS.find(x => x.key === vk)
  const provList = useMemo(() => [...new Set(kab.filter(d => pulau === 'Semua' || d.pulau === pulau).map(d => d.provinsi))].sort(), [kab, pulau])
  const inFilter = d => d && (pulau === 'Semua' || d.pulau === pulau) && (prov === 'Semua' || d.provinsi === prov)
  const ramp = v.dir === 'good' ? RAMP_GOOD : RAMP_RISK
  const breaks = useMemo(() => (v.cat ? [] : quantileBreaks(kab.map(d => d[vk]))), [kab, vk, v.cat])

  const bounds = useMemo(() => {
    const feats = geo.features.filter(f => inFilter(byKode[f.properties.kode_bps]))
    if (!feats.length) return null
    return L.geoJSON({ type: 'FeatureCollection', features: feats }).getBounds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, pulau, prov])

  const focusBounds = useMemo(() => {
    if (!sel) return null
    const f = geo.features.find(f => f.properties.kode_bps === sel.kode_bps)
    return f ? L.geoJSON(f).getBounds() : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus])

  const style = f => {
    const d = byKode[f.properties.kode_bps]
    const on = inFilter(d)
    const fill = v.cat ? LISA_COLORS[d?.lisa] || '#64748B' : colorFor(d?.[vk], breaks, ramp)
    const isSel = sel && d && sel.kode_bps === d.kode_bps
    return {
      fillColor: fill,
      fillOpacity: on ? 0.88 : 0.14,
      color: isSel ? '#0B3B75' : 'rgba(15, 23, 42, 0.45)',
      weight: isSel ? 2.6 : 0.6,
    }
  }

  const onEach = (f, layer) => {
    const d = byKode[f.properties.kode_bps]
    if (!d) return
    layer.bindTooltip(() => {
      const val = v.cat ? d.lisa : `${fmt(d[vk], v.dec)}${v.unit}`
      return `<div class="mtip"><b>${d.nama}</b><small>${d.provinsi}</small><div>${v.label}: <b>${val}</b></div><div>Peringkat PRISMA: <b>#${d.rank_iprt}</b> / 514</div></div>`
    }, { sticky: true, direction: 'top', opacity: 1, className: 'mtip-wrap' })
    layer.on({
      mouseover: e => e.target.setStyle({ weight: 2.2, color: '#0284C7' }),
      mouseout: e => geoRef.current?.resetStyle(e.target),
      click: () => setSel(d),
    })
  }

  const hits = q.length > 1 ? kab.filter(d => d.nama.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []
  const gkey = `${vk}-${pulau}-${prov}-${sel?.kode_bps}`

  const legendItems = v.cat
    ? Object.entries(LISA_COLORS).map(([k, c]) => ({ c, t: k }))
    : ramp.map((c, i) => ({ c, t: i === 0 ? `≤ ${fmt(breaks[0], v.dec)}` : i === ramp.length - 1 ? `> ${fmt(breaks[i - 1], v.dec)}` : `${fmt(breaks[i - 1], v.dec)} – ${fmt(breaks[i], v.dec)}` }))

  return (
    <div className="page">
      <header className="ph">
        <div>
          <span className="eyebrow">PEMETAAN TEMATIK SPASIAL · 514 KABUPATEN/KOTA (TERBUKA TANPA VERIFIKASI)</span>
          <h1>Peta Interaktif Kerentanan &amp; Prioritas Sekolah</h1>
          <p>Pilih indikator spasial, pulau, atau provinsi. Arahkan kursor untuk ringkasan cepat dan klik wilayah untuk melihat profil lengkap.</p>
        </div>
      </header>

      <div className="filters">
        <label><span>Variabel Peta</span>
          <select value={vk} onChange={e => setVk(e.target.value)}>{VARS.map(x => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
        </label>
        <label><span>Kelompok Pulau</span>
          <select value={pulau} onChange={e => { setPulau(e.target.value); setProv('Semua') }}><option>Semua</option>{PULAU.map(p => <option key={p}>{p}</option>)}</select>
        </label>
        <label><span>Provinsi</span>
          <select value={prov} onChange={e => setProv(e.target.value)}><option>Semua</option>{provList.map(p => <option key={p}>{p}</option>)}</select>
        </label>
        <label className="search"><span>Cari Kabupaten/Kota</span>
          <div className="sbox"><Search size={15} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Mis. Banggai Laut / Lembata" />
            {hits.length > 0 && <ul>{hits.map(h => <li key={h.kode_bps} onClick={() => { setSel(h); setQ(''); setPulau('Semua'); setProv(h.provinsi) }}>{h.nama}<small>{h.provinsi}</small></li>)}</ul>}
          </div>
        </label>
        <button className={`chip ${basemap ? 'on' : ''}`} onClick={() => setBasemap(b => !b)} title="Peta dasar"><Layers size={15} /> Peta dasar</button>
      </div>

      <div className="mapwrap">
        <MapContainer center={[-2.5, 118]} zoom={5} minZoom={4} maxZoom={11} className="map" zoomSnap={0.25} preferCanvas>
          {basemap && <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />}
          <GeoJSON key={gkey} ref={geoRef} data={geo} style={style} onEachFeature={onEach} />
          <FitTo bounds={focusBounds || bounds} panel={!!sel} />
        </MapContainer>

        <div className="maplegend">
          <b>{v.label}</b><small>{v.desc}{!v.cat && ' · kelas kuantil'}</small>
          <small className="map-source">Peta dasar OpenStreetMap · Akses terbuka</small>
          {legendItems.map(l => <div key={l.t}><i style={{ background: l.c }} />{l.t}</div>)}
          {(pulau !== 'Semua' || prov !== 'Semua') && <div className="muted">Wilayah di luar filter dipudarkan</div>}
        </div>

        <AnimatePresence>
          {sel && (
            <motion.aside className="detail" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}>
              <button className="icon close" onClick={() => setSel(null)} aria-label="Tutup"><X size={16} /></button>
              <div className="d-head"><MapPin size={16} /><div><b>{sel.nama}</b><small>{sel.provinsi} · {sel.pulau}</small></div></div>
              <div className="d-score">
                <div><span>Skor PRISMA</span><b>{fmt(sel.IPRT)}</b></div>
                <div><span>Peringkat</span><b>{sel.rank_iprt}<small>/514</small></b></div>
                <div><span>Kelas</span><b className={`badge k-${sel.kelas_iprt.replace(' ', '-').toLowerCase()}`}>{sel.kelas_iprt}</b></div>
              </div>
              <h4>Komponen indeks (persentil)</h4>
              <Meter label="K · Kerusakan" v={sel.K} color="#EF4444" />
              <Meter label="S · Kerentanan sosial" v={sel.S} color="#F59E0B" />
              <Meter label="F · Kelemahan fiskal" v={sel.F} color="#0284C7" />
              <h4>Kondisi ruang kelas</h4>
              <div className="stack">
                {[['baik_total', '#0284C7'], ['rusak_ringan_total', '#38BDF8'], ['rusak_sedang_total', '#F59E0B'], ['rusak_berat_total', '#EF4444']].map(([k, c]) => (
                  <i key={k} style={{ flex: sel[k], background: c }} title={`${k}: ${sel[k]}`} />
                ))}
              </div>
              <dl>
                <dt>Jumlah ruang kelas</dt><dd>{fmtInt(sel.jumlah_total)}</dd>
                <dt>Rusak sedang + berat</dt><dd>{fmt(sel.pct_rusak_sedang_berat)}%</dd>
                <dt>Rusak berat</dt><dd>{fmtInt(sel.rusak_berat_total)} ({fmt(sel.pct_rusak_berat)}%)</dd>
                <dt>Rusak berat SD / SMP</dt><dd>{fmt(sel.pct_rb_sd)}% / {fmt(sel.pct_rb_smp)}%</dd>
                <dt>Rusak berat SMA / SMK</dt><dd>{fmt(sel.pct_rb_sma)}% / {fmt(sel.pct_rb_smk)}%</dd>
                <dt>Penduduk miskin (P0)</dt><dd>{fmt(sel.p0_persen, 2)}%</dd>
                <dt>Rata-rata lama sekolah</dt><dd>{fmt(sel.rls_tahun, 2)} tahun</dd>
                <dt>Kapasitas fiskal</dt><dd>{fmt(sel.rasio_kapasitas_fiskal, 3)} ({sel.kategori_kapasitas_fiskal})</dd>
                <dt>Pemerataan guru SD</dt><dd>{fmt(sel.ipg_sd, 2)}</dd>
                <dt>Klaster LISA</dt><dd>{sel.lisa}</dd>
              </dl>
              {go && (
                <button
                  type="button"
                  className="btn primary sm"
                  style={{ width: '100%', marginTop: 14 }}
                  onClick={() => go('pelaporan')}
                >
                  <Camera size={14} /> Laporkan Sekolah di Wilayah Ini
                </button>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
