import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Landmark, Users, ArrowRight, Lock, User, Info } from 'lucide-react'

// CATATAN: login ini adalah demo sisi klien untuk purwarupa (tanpa server).
// Untuk produksi, ganti dengan autentikasi server (mis. SSO Kemendikdasmen / OAuth).
const ROLES = [
  { id: 'pusat', label: 'Analis Pusat', sub: 'Kemendikdasmen / Pusdatin', icon: Landmark, user: 'pusdatin', pass: 'atlas2025' },
  { id: 'daerah', label: 'Dinas / Bappeda', sub: 'Pemerintah daerah', icon: Building2, user: 'dinas', pass: 'atlas2025' },
  { id: 'publik', label: 'Publik', sub: 'Masyarakat, komite sekolah, media', icon: Users, user: 'publik', pass: 'publik' },
]

export default function Login({ onLogin }) {
  const [role, setRole] = useState(ROLES[0])
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')

  const submit = e => {
    e.preventDefault()
    if (u.trim() === role.user && p === role.pass) {
      onLogin({ nama: role.label, peran: role.sub, role: role.id })
    } else setErr('Nama pengguna atau kata sandi tidak cocok untuk peran ini.')
  }

  return (
    <div className="login">
      <div className="login-bg" aria-hidden>
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
        <svg className="grid" width="100%" height="100%"><defs><pattern id="gp" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="rgba(255,255,255,.05)" /></pattern></defs><rect width="100%" height="100%" fill="url(#gp)" /></svg>
      </div>
      <motion.section className="login-hero" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .6 }}>
        <div className="tag">Revitalisasi Satuan Pendidikan · Data 2025</div>
        <h1>PRISMA</h1>
        <p className="lead">Indeks Prioritas Revitalisasi Sekolah berbasis Analisis Spasial untuk mewujudkan infrastruktur pendidikan yang adil, tangguh, inklusif, dan berkelanjutan di Indonesia.</p>
        <p className="acronym">Prioritas Revitalisasi Infrastruktur Sekolah melalui Model Analisis Spasial</p>
        <div className="hero-promise"><span>Adil</span><i /><span>Tangguh</span><i /><span>Inklusif</span><i /><span>Berkelanjutan</span></div>
        <div className="hero-stats">
          {[['2,03 jt', 'ruang kelas dianalisis'], ['514', 'kabupaten/kota'], ['29,8%', 'rusak sedang + berat']].map(([a, b], i) => (
            <motion.div key={b} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 + i * .12 }}>
              <b>{a}</b><span>{b}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.form className="login-card" onSubmit={submit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .1 }}>
        <h2>Masuk</h2>
        <p className="muted">Pilih peran Anda</p>
        <div className="roles">
          {ROLES.map(r => (
            <button type="button" key={r.id} className={role.id === r.id ? 'role on' : 'role'} onClick={() => { setRole(r); setErr('') }}>
              <r.icon size={18} /><b>{r.label}</b><span>{r.sub}</span>
            </button>
          ))}
        </div>
        <label className="field"><User size={16} /><input value={u} onChange={e => setU(e.target.value)} placeholder="Nama pengguna" autoComplete="username" /></label>
        <label className="field"><Lock size={16} /><input type="password" value={p} onChange={e => setP(e.target.value)} placeholder="Kata sandi" autoComplete="current-password" /></label>
        {err && <div className="err">{err}</div>}
        <button className="btn primary" type="submit">Masuk <ArrowRight size={16} /></button>
        <button className="btn ghost" type="button" onClick={() => { setU(role.user); setP(role.pass) }}>Isi akun demo</button>
        <div className="demo"><Info size={14} /> Akun demo: <code>pusdatin</code> / <code>dinas</code> (sandi <code>atlas2025</code>), <code>publik</code> (sandi <code>publik</code>). Login purwarupa tanpa server.</div>
      </motion.form>
    </div>
  )
}
