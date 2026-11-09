import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Landmark, Users, ArrowRight, Lock, User, Info, Sun, Moon, ShieldCheck, MapPin, Camera, Sparkles } from 'lucide-react'
import { ROLES_CONFIG, LOGO_URL } from '../lib/data'

const ROLE_ICONS = {
  pusat: Landmark,
  daerah: Building2,
  publik: Users,
}

export default function Login({ onLogin, theme, toggleTheme }) {
  const [role, setRole] = useState(ROLES_CONFIG[0])
  const [u, setU] = useState(ROLES_CONFIG[0].user)
  const [p, setP] = useState(ROLES_CONFIG[0].pass)
  const [err, setErr] = useState('')

  const handleSelectRole = r => {
    setRole(r)
    setU(r.user)
    setP(r.pass)
    setErr('')
  }

  const submit = e => {
    e.preventDefault()
    if (u.trim() === role.user && p === role.pass) {
      onLogin({
        nama: role.shortLabel,
        labelLengkap: role.label,
        peran: role.sub,
        badge: role.badge,
        role: role.id,
        roleNo: role.no,
      })
    } else {
      setErr('Nama pengguna atau kata sandi tidak cocok untuk peran yang dipilih.')
    }
  }

  return (
    <div className="login">
      <div className="login-bg" aria-hidden>
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
        <svg className="grid" width="100%" height="100%">
          <defs>
            <pattern id="gp" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0V44" fill="none" stroke="currentColor" strokeOpacity="0.06" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gp)" />
        </svg>
      </div>

      <div className="login-topbar">
        <div className="login-badge-pill">
          <Sparkles size={14} />
          <span>MPI FAIR 2026 · Inklusi Sosial &amp; Kesetaraan dalam Pendidikan</span>
        </div>
        <button type="button" className="theme-toggle-btn" onClick={toggleTheme} title="Ubah Mode Terang / Gelap">
          {theme === 'light' ? <><Moon size={15} /><span>Dark Mode</span></> : <><Sun size={15} /><span>Light Mode</span></>}
        </button>
      </div>

      <motion.section className="login-hero" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}>
        <div className="login-logo-showcase">
          <img src={LOGO_URL} alt="Logo PRISMA" className="prisma-logo-hero" />
        </div>
        <div className="tag">Sistem Pendukung Keputusan Spasial &amp; Pelaporan Partisipatif · Data 2025</div>
        <h1>PRISMA</h1>
        <p className="acronym">Prioritas Revitalisasi Infrastruktur Sekolah melalui Model Analisis Spasial</p>
        <p className="lead">
          Platform tata kelola restorasi infrastruktur pendidikan yang memadukan <b>ekonometrika spasial 514 kabupaten/kota</b> (Top-Down) dengan <b>pelaporan geotagging partisipatif &amp; pemantauan siklus penuh Before–Progress–After</b> (Bottom-Up).
        </p>

        <div className="hero-features-row">
          <div className="hf-item"><MapPin size={15} /><span>Pemetaan 514 Kab/Kota &amp; LISA</span></div>
          <div className="hf-item"><Camera size={15} /><span>Pelaporan Kamera &amp; GPS Realtime</span></div>
          <div className="hf-item"><ShieldCheck size={15} /><span>Akuntabilitas 3 Peran Berjenjang</span></div>
        </div>

        <div className="hero-stats">
          {[
            ['2,03 Juta', 'Ruang kelas dianalisis (Dapodik)'],
            ['514', 'Kabupaten/Kota se-Indonesia'],
            ['29,8%', 'Kondisi rusak sedang & berat'],
            ['3 Peran', 'Pusat · Daerah/Sekolah · Publik'],
          ].map(([a, b], i) => (
            <motion.div key={b} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
              <b>{a}</b><span>{b}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.form className="login-card" onSubmit={submit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }}>
        <div className="login-card-head">
          <div>
            <h2>Masuk ke Portal PRISMA</h2>
            <p className="muted">Pilih salah satu dari 3 peran tata kelola di bawah ini</p>
          </div>
          <img src={LOGO_URL} alt="PRISMA" className="login-card-mini-logo" />
        </div>

        <div className="roles">
          {ROLES_CONFIG.map(r => {
            const Icon = ROLE_ICONS[r.id] || Users
            const active = role.id === r.id
            return (
              <button
                type="button"
                key={r.id}
                className={active ? 'role on' : 'role'}
                onClick={() => handleSelectRole(r)}
              >
                <div className="role-top">
                  <span className="role-num">Peran {r.no}</span>
                  <Icon size={17} />
                </div>
                <b>{r.shortLabel}</b>
                <span>{r.sub}</span>
              </button>
            )
          })}
        </div>

        <div className="role-access-preview">
          <b>Hak Akses {role.badge}:</b>
          <p>{role.desc}</p>
        </div>

        <div className="login-fields">
          <label className="field">
            <User size={16} />
            <input value={u} onChange={e => setU(e.target.value)} placeholder="Nama pengguna" autoComplete="username" />
          </label>
          <label className="field">
            <Lock size={16} />
            <input type="password" value={p} onChange={e => setP(e.target.value)} placeholder="Kata sandi" autoComplete="current-password" />
          </label>
        </div>

        {err && <div className="err">{err}</div>}

        <button className="btn primary" type="submit">
          Masuk sebagai {role.shortLabel} <ArrowRight size={16} />
        </button>

        <div className="demo">
          <Info size={14} />
          <span>
            Akun otomatis terisi sesuai pilihan peran: <code>pusdatin</code> / <code>dinas</code> (sandi <code>atlas2025</code>), atau <code>publik</code> (sandi <code>publik</code>).
          </span>
        </div>
      </motion.form>
    </div>
  )
}
