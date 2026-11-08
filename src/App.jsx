import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, Map, SlidersHorizontal, Sigma, BookOpen, Code2, LogOut, Loader2 } from 'lucide-react'
import { loadAll } from './lib/data'
import Login from './pages/Login'
import Ringkasan from './pages/Ringkasan'
import Peta from './pages/Peta'
import Simulator from './pages/Simulator'
import Analisis from './pages/Analisis'
import Metodologi from './pages/Metodologi'
import Kode from './pages/Kode'

const NAV = [
  { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard, el: Ringkasan },
  { id: 'peta', label: 'Peta Interaktif', icon: Map, el: Peta },
  { id: 'simulator', label: 'Simulasi Dua Jalur', icon: SlidersHorizontal, el: Simulator },
  { id: 'analisis', label: 'Analisis Statistik', icon: Sigma, el: Analisis },
  { id: 'kode', label: 'Kode Analisis', icon: Code2, el: Kode },
  { id: 'metodologi', label: 'Metodologi & Data', icon: BookOpen, el: Metodologi },
]

function readSession() {
  try { return JSON.parse(sessionStorage.getItem('prisma_user') || sessionStorage.getItem('atlas_user') || 'null') } catch { return null }
}

export default function App() {
  const [user, setUser] = useState(readSession)
  const [page, setPage] = useState('ringkasan')
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [focus, setFocus] = useState(null) // kode_bps dari halaman lain

  useEffect(() => { if (user && !data) loadAll().then(setData).catch(e => setErr(String(e))) }, [user, data])

  const login = u => { try { sessionStorage.setItem('prisma_user', JSON.stringify(u)); sessionStorage.removeItem('atlas_user') } catch {} setUser(u) }
  const logout = () => { try { sessionStorage.removeItem('prisma_user'); sessionStorage.removeItem('atlas_user') } catch {} setUser(null) }
  const go = (id, kode) => { setFocus(kode || null); setPage(id); window.scrollTo({ top: 0 }) }

  if (!user) return <Login onLogin={login} />
  const Cur = NAV.find(n => n.id === page).el

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
          <div><b>PRISMA</b><span>Analisis spasial · 2025</span></div>
        </div>
        <nav>
          {NAV.map(n => (
            <button key={n.id} className={page === n.id ? 'on' : ''} onClick={() => go(n.id)} title={n.label}>
              <n.icon size={18} /><span>{n.label}</span>
              {page === n.id && <motion.i layoutId="navpill" className="pill" />}
            </button>
          ))}
        </nav>
        <div className="me">
          <div className="avatar">{user.nama.slice(0, 1)}</div>
          <div className="who"><b>{user.nama}</b><span>{user.peran}</span></div>
          <button className="icon" onClick={logout} title="Keluar"><LogOut size={16} /></button>
        </div>
      </aside>
      <main className="main">
        {err && <div className="card error">Gagal memuat data: {err}</div>}
        {!data && !err && <div className="loading"><Loader2 className="spin" /> Memuat 514 kabupaten/kota…</div>}
        {data && (
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
              <Cur data={data} user={user} go={go} focus={focus} />
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}
