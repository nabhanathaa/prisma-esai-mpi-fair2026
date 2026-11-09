import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Landmark, Users, ArrowRight, Lock, User, Info,
  Sun, Moon, Mail, UserPlus, LogIn, CheckCircle2, Building
} from 'lucide-react'
import { ROLES_CONFIG, LOGO_URL } from '../lib/data'

const ROLE_ICONS = {
  pusat: Landmark,
  daerah: Building2,
  publik: Users,
}

function loadRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem('prisma_registered_users') || '[]')
  } catch {
    return []
  }
}

export default function Login({ onLogin, theme, toggleTheme }) {
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [role, setRole] = useState(ROLES_CONFIG[0])
  const [u, setU] = useState(ROLES_CONFIG[0].user)
  const [p, setP] = useState(ROLES_CONFIG[0].pass)
  const [err, setErr] = useState('')

  // State untuk menu Register singkat
  const [regNama, setRegNama] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regInstansi, setRegInstansi] = useState('')

  const handleSelectRole = r => {
    setRole(r)
    if (authMode === 'login') {
      setU(r.user)
      setP(r.pass)
    }
    setErr('')
  }

  const handleSwitchMode = mode => {
    setAuthMode(mode)
    setErr('')
    if (mode === 'login') {
      setU(role.user)
      setP(role.pass)
    }
  }

  const submitLogin = e => {
    e.preventDefault()
    setErr('')
    const cleanU = u.trim().toLowerCase()
    const registered = loadRegisteredUsers()
    const matchedReg = registered.find(
      acc => (acc.user.toLowerCase() === cleanU || acc.email.toLowerCase() === cleanU) && acc.pass === p
    )

    if (matchedReg) {
      const targetRole = ROLES_CONFIG.find(r => r.id === matchedReg.roleId) || role
      onLogin({
        nama: matchedReg.nama,
        labelLengkap: targetRole.label,
        peran: matchedReg.instansi ? `${ matchedReg.instansi } · ${ targetRole.sub }` : targetRole.sub,
        badge: targetRole.badge,
        role: targetRole.id,
        roleNo: targetRole.no,
        email: matchedReg.email,
      })
      return
    }

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

  const submitRegister = e => {
    e.preventDefault()
    setErr('')
    if (!regNama.trim()) {
      setErr('Harap isi Nama Lengkap terlebih dahulu.')
      return
    }
    if (!regEmail.trim()) {
      setErr('Harap isi Email atau Nama Pengguna terlebih dahulu.')
      return
    }
    if (!regPass || regPass.length < 4) {
      setErr('Kata sandi minimal terdiri dari 4 karakter.')
      return
    }

    const newAcc = {
      nama: regNama.trim(),
      email: regEmail.trim(),
      user: regEmail.trim().split('@')[0],
      pass: regPass,
      instansi: regInstansi.trim(),
      roleId: role.id,
      createdAt: new Date().toISOString(),
    }

    try {
      const prev = loadRegisteredUsers()
      localStorage.setItem('prisma_registered_users', JSON.stringify([newAcc, ...prev]))
    } catch {}

    onLogin({
      nama: newAcc.nama,
      labelLengkap: role.label,
      peran: newAcc.instansi ? `${newAcc.instansi} · ${role.sub}` : role.sub,
      badge: role.badge,
      role: role.id,
      roleNo: role.no,
      email: newAcc.email,
    })
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

      <div className="login-container">
        {/* KOLOM KIRI (50%): LOGO SEJAJAR DARK MODE + TEKS RATA TENGAH */}
        <motion.section
          className="login-hero"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-hero-topbar">
            <img src={LOGO_URL} alt="Logo PRISMA" className="prisma-logo-hero" />
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title="Ubah Mode Terang / Gelap"
            >
              {theme === 'light' ? (
                <><Moon size={15} /><span>Dark Mode</span></>
              ) : (
                <><Sun size={15} /><span>Light Mode</span></>
              )}
            </button>
          </div>

          <div className="login-hero-center">
            <h1>PRISMA</h1>
            <p className="acronym">
              Prioritas Revitalisasi Infrastruktur Sekolah melalui Model Analisis Spasial
            </p>
            <div className="login-hero-divider" />
            <p className="lead">
              Platform tata kelola restorasi infrastruktur pendidikan yang memadukan{' '}
              <b>ekonometrika spasial 514 kabupaten/kota</b> (Top-Down) dengan{' '}
              <b>pelaporan geotagging partisipatif &amp; pemantauan siklus penuh Before–Progress–After</b> (Bottom-Up).
            </p>
          </div>
        </motion.section>

        {/* KOLOM KANAN (50%): KARTU MASUK & DAFTAR AKUN PORTAL PRISMA */}
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
        >
          <div className="login-card-head">
            <div>
              <h2>{authMode === 'login' ? 'Masuk ke Portal PRISMA' : 'Daftar Akun Portal PRISMA'}</h2>
              <p className="muted">
                {authMode === 'login'
                  ? 'Pilih salah satu dari 3 peran tata kelola di bawah ini'
                  : 'Pendaftaran singkat akses portal sesuai peran pengguna'}
              </p>
            </div>
            <img src={LOGO_URL} alt="PRISMA" className="login-card-mini-logo" />
          </div>

          {/* Tab Switcher: Masuk Portal vs Daftar Akun */}
          <div className="auth-mode-tabs" role="tablist">
            <button
              type="button"
              className={authMode === 'login' ? 'amt-btn on' : 'amt-btn'}
              onClick={() => handleSwitchMode('login')}
            >
              <LogIn size={15} />
              <span>Masuk Portal</span>
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'amt-btn on' : 'amt-btn'}
              onClick={() => handleSwitchMode('register')}
            >
              <UserPlus size={15} />
              <span>Daftar Akun Baru</span>
            </button>
          </div>

          {/* Pilihan 3 Peran */}
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

          {authMode === 'login' ? (
            <form className="login-form-inner" onSubmit={submitLogin}>
              <div className="login-fields">
                <label className="field">
                  <User size={16} />
                  <input
                    value={u}
                    onChange={e => setU(e.target.value)}
                    placeholder="Nama pengguna / email"
                    autoComplete="username"
                  />
                </label>
                <label className="field">
                  <Lock size={16} />
                  <input
                    type="password"
                    value={p}
                    onChange={e => setP(e.target.value)}
                    placeholder="Kata sandi"
                    autoComplete="current-password"
                  />
                </label>
              </div>

              {err && <div className="err">{err}</div>}

              <button className="btn primary" type="submit">
                Masuk sebagai {role.shortLabel} <ArrowRight size={16} />
              </button>

              <div className="demo">
                <Info size={14} />
                <span>
                  Akun demonstrasi terisi otomatis sesuai pilihan peran: <code>pusdatin</code> / <code>dinas</code> (sandi <code>atlas2025</code>), atau <code>publik</code> (sandi <code>publik</code>).
                </span>
              </div>
            </form>
          ) : (
            <form className="login-form-inner" onSubmit={submitRegister}>
              <div className="login-fields">
                <label className="field">
                  <User size={16} />
                  <input
                    value={regNama}
                    onChange={e => setRegNama(e.target.value)}
                    placeholder="Nama lengkap Anda *"
                    autoComplete="name"
                  />
                </label>
                <label className="field">
                  <Mail size={16} />
                  <input
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="Email / username *"
                    autoComplete="email"
                  />
                </label>
              </div>

              <div className="login-fields">
                <label className="field">
                  <Lock size={16} />
                  <input
                    type="password"
                    value={regPass}
                    onChange={e => setRegPass(e.target.value)}
                    placeholder="Buat kata sandi *"
                    autoComplete="new-password"
                  />
                </label>
                <label className="field">
                  <Building size={16} />
                  <input
                    value={regInstansi}
                    onChange={e => setRegInstansi(e.target.value)}
                    placeholder="Sekolah / Instansi (Opsional)"
                  />
                </label>
              </div>

              {err && <div className="err">{err}</div>}

              <button className="btn primary" type="submit">
                <CheckCircle2 size={16} /> Daftar &amp; Masuk sebagai {role.shortLabel}
              </button>

              <div className="demo">
                <Info size={14} />
                <span>
                  Pendaftaran ini bersifat ringkas untuk akses portal. Verifikasi identitas lengkap (OTP &amp; Anti-Bot) dilakukan saat mengajukan laporan di menu <b>Pelaporan &amp; Progres</b>.
                </span>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
