import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, Map, SlidersHorizontal, Sigma, BookOpen,
  LogOut, Loader2, Camera, Sun, Moon, Lock
} from 'lucide-react'
import { loadAll, LOGO_URL, ROLES_CONFIG } from './lib/data'
import Login from './pages/Login'
import Ringkasan from './pages/Ringkasan'
import Peta from './pages/Peta'
import Pelaporan from './pages/Pelaporan'
import Simulator from './pages/Simulator'
import Analisis from './pages/Analisis'
import Metodologi from './pages/Metodologi'
import Chatbot from './components/Chatbot'

const ALL_NAV = [
  { id: 'ringkasan', label: 'Ringkasan', mobileLabel: 'Ringkasan', icon: LayoutDashboard, el: Ringkasan },
  { id: 'peta', label: 'Peta Interaktif', mobileLabel: 'Peta', icon: Map, el: Peta },
  { id: 'pelaporan', label: 'Pelaporan & Progres', mobileLabel: 'Lapor', icon: Camera, el: Pelaporan, badge: 'Baru' },
  { id: 'simulator', label: 'Simulasi Dua Jalur', mobileLabel: 'Simulasi', icon: SlidersHorizontal, el: Simulator, lockForPublic: true },
  { id: 'analisis', label: 'Statistik & Komputasi', mobileLabel: 'Statistik', icon: Sigma, el: Analisis },
  { id: 'metodologi', label: 'Metodologi & Data', mobileLabel: 'Metodologi', icon: BookOpen, el: Metodologi },
]

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem('prisma_user') || sessionStorage.getItem('atlas_user') || 'null')
  } catch {
    return null
  }
}

function readTheme() {
  try {
    return localStorage.getItem('prisma_theme') || 'light'
  } catch {
    return 'light'
  }
}

export default function App() {
  const [user, setUser] = useState(readSession)
  const [theme, setTheme] = useState(readTheme)
  const [page, setPage] = useState('ringkasan')
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [focus, setFocus] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('prisma_theme', theme) } catch {}
  }, [theme])

  useEffect(() => {
    if (user && !data) {
      loadAll().then(setData).catch(e => setErr(String(e)))
    }
  }, [user, data])

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))

  const login = u => {
    try {
      sessionStorage.setItem('prisma_user', JSON.stringify(u))
      sessionStorage.removeItem('atlas_user')
    } catch {}
    setUser(u)
  }

  const switchRole = roleId => {
    const r = ROLES_CONFIG.find(x => x.id === roleId)
    if (!r) return
    const nextUser = {
      nama: r.shortLabel,
      labelLengkap: r.label,
      peran: r.sub,
      badge: r.badge,
      role: r.id,
      roleNo: r.no,
    }
    login(nextUser)
  }

  const logout = () => {
    try {
      sessionStorage.removeItem('prisma_user')
      sessionStorage.removeItem('atlas_user')
    } catch {}
    setUser(null)
  }

  const go = (id, kode) => {
    if (id === 'kode') {
      setFocus('tab-kode')
      setPage('analisis')
    } else {
      setFocus(kode || null)
      setPage(id)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) return <Login onLogin={login} theme={theme} toggleTheme={toggleTheme} />

  const activeNav = ALL_NAV.find(n => n.id === page) || ALL_NAV[0]
  const Cur = activeNav.el

  return (
    <div className="shell">
      {/* Header Atas Modern & Elegan untuk Layar Mobile / Tablet */}
      <header className="mobile-topbar">
        <div className="mt-brand" onClick={() => go('ringkasan')}>
          <img src={LOGO_URL} alt="Logo PRISMA" />
          <div className="mt-brand-copy">
            <b>PRISMA</b>
            <span>{user.badge || `Peran · ${user.nama}`}</span>
          </div>
        </div>
        <div className="mt-actions">
          <div className="mt-role-pills" title="Ganti Peran Cepat">
            {ROLES_CONFIG.map(r => (
              <button
                type="button"
                key={r.id}
                className={user.role === r.id ? 'on' : ''}
                onClick={() => switchRole(r.id)}
              >
                P{r.no}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-action-btn theme"
            onClick={toggleTheme}
            title="Mode Terang / Gelap"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button
            type="button"
            className="mt-action-btn exit"
            onClick={logout}
            title="Keluar dari Portal"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <aside className="side">
        <div className="brand" onClick={() => go('ringkasan')} style={{ cursor: 'pointer' }}>
          <div className="brand-logo-wrap">
            <img src={LOGO_URL} alt="Logo PRISMA" />
          </div>
          <div>
            <b>PRISMA</b>
            <span className="brand-sub">Spasial &amp; Inklusi - 2025</span>
          </div>
        </div>

        <div className="side-theme-row">
          <button type="button" className="theme-switch-wide" onClick={toggleTheme}>
            {theme === 'light' ? (
              <><Sun size={15} /><span>Mode Terang (Clear Blue)</span><small>Ubah</small></>
            ) : (
              <><Moon size={15} /><span>Mode Gelap (Deep Navy)</span><small>Ubah</small></>
            )}
          </button>
        </div>

        <nav>
          {ALL_NAV.map(n => {
            const isLocked = n.lockForPublic && user.role === 'publik'
            return (
              <button
                key={n.id}
                className={page === n.id ? 'on' : ''}
                onClick={() => go(n.id)}
                title={n.label}
              >
                <n.icon size={18} />
                <span className="nav-lbl">{n.label}</span>
                <span className="nav-lbl-mob">{n.mobileLabel}</span>
                {n.badge && <em className="nav-badge">{n.badge}</em>}
                {isLocked && <Lock size={13} className="nav-lock" />}
                {page === n.id && <motion.i layoutId="navpill" className="pill" />}
              </button>
            )
          })}
        </nav>

        {/* Pengalih Peran Cepat untuk Kemudahan Demonstrasi & Penjurian */}
        <div className="role-switcher-mini">
          <small>Peran Aktif (Klik untuk ganti):</small>
          <div className="rsm-pills">
            {ROLES_CONFIG.map(r => (
              <button
                type="button"
                key={r.id}
                className={user.role === r.id ? 'on' : ''}
                onClick={() => switchRole(r.id)}
                title={r.label}
              >
                P{r.no}
              </button>
            ))}
          </div>
        </div>

        <div className="me">
          <div className="avatar">{user.nama.slice(0, 1)}</div>
          <div className="who">
            <b>{user.nama}</b>
            <span>{user.peran}</span>
          </div>
          <button className="icon" onClick={logout} title="Keluar dari akun"><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="main">
        {err && <div className="card error">Gagal memuat data: {err}</div>}
        {!data && !err && <div className="loading"><Loader2 className="spin" /> Memuat 514 kabupaten/kota…</div>}
        {data && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${page}-${user.role}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24 }}
              >
                <Cur data={data} user={user} go={go} focus={focus} onSwitchRole={switchRole} />
              </motion.div>
            </AnimatePresence>

            <footer className="app-footer">
              <div className="af-left">
                <img src={LOGO_URL} alt="PRISMA" className="af-logo" />
                <div>
                  <b>PRISMA · Prioritas Revitalisasi Infrastruktur Sekolah melalui Model Analisis Spasial</b>
                  <span>
                    Karya Inovasi Tim PRISMA Politeknik Statistika STIS (Nabhan Athallah, Henny Syahrani, Reva Auliya Q. A.) · MPI FAIR 2026
                  </span>
                </div>
              </div>
              <div className="af-right">
                <button type="button" className="link" onClick={() => go('metodologi')}>Metodologi &amp; Tim</button>
                <span>·</span>
                <button type="button" className="link" onClick={() => go('pelaporan')}>E-Lapor Geotagging</button>
                <span>·</span>
                <button type="button" className="link" onClick={() => go('analisis')}>Statistik &amp; Kode R</button>
              </div>
            </footer>

            <Chatbot data={data} user={user} go={go} onSwitchRole={switchRole} />
          </>
        )}
      </main>
    </div>
  )
}
