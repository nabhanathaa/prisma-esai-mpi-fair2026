import React, { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, X, Sparkles, ArrowUpRight, Bot, User, Minimize2, Maximize2, Trash2
} from 'lucide-react'
import { fmt, fmtInt, LOGO_URL } from '../lib/data'

const QUICK_PROMPTS = [
  '10 daerah prioritas tertinggi PRISMA',
  'Bagaimana cara lapor sekolah rusak & geotagging?',
  'Cek profil Kabupaten Banggai Laut',
  'Apa rumus indeks PRISMA & simulasi dua jalur?',
  'Hasil regresi spasial SEM & Moran\'s I',
  'Apa perbedaan hak akses 3 peran pengguna?',
]

// Normalisasi teks pencarian agar pintar mengenali nama kab/kota & provinsi
function norm(str) {
  return (str || '')
    .toLowerCase()
    .replace(/kabupaten|kab\.|kab|kota|adm\.|administrasi/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function Chatbot({ data, user, go, onSwitchRole }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      time: 'Baru saja',
      title: 'Asisten Analitik PRISMA',
      text: `Selamat datang, **${user?.nama || 'Pengguna'}** (${user?.badge || 'Portal PRISMA'}). Asisten ini terhubung langsung dengan basis data **514 Kabupaten/Kota (2,03 juta ruang kelas Dapodik 2025)**, hasil ekonometrika spasial, dan modul pelaporan geotagging.\n\nSilakan tanyakan **profil kabupaten/kota mana pun di Indonesia**, **komparasi antarwilayah**, **metodologi & statistik PRISMA**, atau **prosedur pelaporan sekolah rusak**.`,
      actions: [
        { label: 'Buka Form Lapor & Geotag', page: 'pelaporan' },
        { label: 'Eksplorasi Peta 514 Kab/Kota', page: 'peta' },
      ],
    },
  ])

  const endRef = useRef(null)
  const dragMovedRef = useRef(false)

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, isTyping])

  // Indeks pencarian cepat untuk 514 Kabupaten/Kota dan 38 Provinsi
  const searchIndex = useMemo(() => {
    if (!data?.kab) return { kabList: [], provList: [] }
    const kabList = data.kab.map(d => ({
      ...d,
      cleanName: norm(d.nama),
      fullLower: d.nama.toLowerCase(),
    }))
    const provList = [...new Set(data.kab.map(d => d.provinsi))].map(p => ({
      name: p,
      lower: p.toLowerCase(),
    }))
    return { kabList, provList }
  }, [data])

  // Mesin Penalaran & Jawaban Cerdas Berbasis Data Aplikasi PRISMA
  const generateSmartReply = rawQuery => {
    const q = rawQuery.toLowerCase().trim()
    const qClean = norm(rawQuery)
    const { kab, ringkasan: R } = data

    // 1. Cek apakah pengguna menanyakan Kabupaten/Kota tertentu (bisa 1 atau 2 wilayah untuk komparasi)
    const matchedKabs = searchIndex.kabList
      .filter(d => {
        if (!d.cleanName || d.cleanName.length < 3) return false
        return q.includes(d.fullLower) || (qClean.includes(d.cleanName) && d.cleanName.length >= 4)
      })
      .sort((a, b) => b.cleanName.length - a.cleanName.length)

    // Hilangkan duplikat substring (mis. "Banggai" vs "Banggai Laut")
    const uniqueKabs = []
    for (const item of matchedKabs) {
      if (!uniqueKabs.some(u => u.kode_bps === item.kode_bps || u.cleanName.includes(item.cleanName))) {
        uniqueKabs.push(item)
      }
      if (uniqueKabs.length >= 2) break
    }

    if (uniqueKabs.length === 2) {
      const [a, b] = uniqueKabs
      return {
        title: `Komparasi Spasial: ${a.nama} vs ${b.nama}`,
        text:
          `Berikut perbandingan langsung dari dataset PRISMA 2025:\n\n` +
          `• **Skor PRISMA & Peringkat:**\n  - **${a.nama}** (${a.provinsi}): Skor **${fmt(a.IPRT, 1)}** (Peringkat **#${a.rank_iprt}**/514 · Kelas *${a.kelas_iprt}*)\n  - **${b.nama}** (${b.provinsi}): Skor **${fmt(b.IPRT, 1)}** (Peringkat **#${b.rank_iprt}**/514 · Kelas *${b.kelas_iprt}*)\n` +
          `• **Kondisi Ruang Kelas:**\n  - **${a.nama}**: **${fmt(a.pct_rusak_sedang_berat, 1)}%** rusak sedang+berat (**${fmtInt(a.rusak_berat_total)}** ruang rusak berat dari ${fmtInt(a.jumlah_total)} ruang)\n  - **${b.nama}**: **${fmt(b.pct_rusak_sedang_berat, 1)}%** rusak sedang+berat (**${fmtInt(b.rusak_berat_total)}** ruang rusak berat dari ${fmtInt(b.jumlah_total)} ruang)\n` +
          `• **Kerentanan Sosial & Fiskal:**\n  - **${a.nama}**: Kemiskinan P0 **${fmt(a.p0_persen, 2)}%**, RLS **${fmt(a.rls_tahun, 2)} thn**, Fiskal **${fmt(a.rasio_kapasitas_fiskal, 3)}** (${a.kategori_kapasitas_fiskal})\n  - **${b.nama}**: Kemiskinan P0 **${fmt(b.p0_persen, 2)}%**, RLS **${fmt(b.rls_tahun, 2)} thn**, Fiskal **${fmt(b.rasio_kapasitas_fiskal, 3)}** (${b.kategori_kapasitas_fiskal})`,
        actions: [
          { label: `Peta ${a.nama.replace('Kabupaten ', 'Kab. ')}`, page: 'peta', kode: a.kode_bps },
          { label: `Peta ${b.nama.replace('Kabupaten ', 'Kab. ')}`, page: 'peta', kode: b.kode_bps },
        ],
      }
    }

    if (uniqueKabs.length === 1) {
      const d = uniqueKabs[0]
      const isTopPriority = d.rank_iprt <= 103
      return {
        title: `Profil Spasial: ${d.nama} (${d.provinsi})`,
        text:
          `Berdasarkan analisis 514 wilayah di PRISMA, berikut rincian lengkap **${d.nama}** (Kode BPS: \`${d.kode_bps}\`):\n\n` +
          `• **Skor Prioritas PRISMA:** **${fmt(d.IPRT, 1)}** — Peringkat **#${d.rank_iprt} dari 514** kab/kota (Kategori: **${d.kelas_iprt}**)\n` +
          `• **Komponen Persentil:** Kerusakan (K) = **${Math.round(d.K * 100)}**, Sosial (S) = **${Math.round(d.S * 100)}**, Fiskal (F) = **${Math.round(d.F * 100)}**\n` +
          `• **Total Ruang Kelas:** **${fmtInt(d.jumlah_total)} ruang** (Rusak sedang+berat: **${fmt(d.pct_rusak_sedang_berat, 1)}%**; Rusak berat: **${fmtInt(d.rusak_berat_total)} ruang** atau **${fmt(d.pct_rusak_berat, 1)}%**)\n` +
          `• **Rincian Rusak Berat per Jenjang:** SD **${fmt(d.pct_rb_sd, 1)}%**, SMP **${fmt(d.pct_rb_smp, 1)}%**, SMA **${fmt(d.pct_rb_sma, 1)}%**, SMK **${fmt(d.pct_rb_smk, 1)}%**\n` +
          `• **Sosial-Fiskal & Spasial:** Kemiskinan (P0) **${fmt(d.p0_persen, 2)}%**, Rata-rata Lama Sekolah **${fmt(d.rls_tahun, 2)} tahun**, Rasio Fiskal **${fmt(d.rasio_kapasitas_fiskal, 3)}** (${d.kategori_kapasitas_fiskal}), Klaster LISA: **${d.lisa}**.\n\n` +
          `**Rekomendasi Kebijakan:** ${isTopPriority ? `Wilayah ini masuk dalam **Kuintil Teratas (Top 20% Prioritas Nasional)** sehingga diprioritaskan pada **Jalur Afirmasi PRISMA**.` : `Wilayah ini berada di luar kuintil teratas nasional, sehingga penanganan dapat difokuskan secara selektif pada satuan pendidikan yang dilaporkan rusak berat melalui modul Geotagging.`}`,
        actions: [
          { label: `Lihat ${d.nama.replace('Kabupaten ', 'Kab. ')} di Peta`, page: 'peta', kode: d.kode_bps },
          { label: 'Laporkan Sekolah di Wilayah Ini', page: 'pelaporan' },
        ],
      }
    }

    // 2. Cek apakah menanyakan Provinsi tertentu
    const matchedProv = searchIndex.provList.find(p => q.includes(p.lower))
    if (matchedProv) {
      const inProv = kab.filter(d => d.provinsi === matchedProv.name).sort((a, b) => a.rank_iprt - b.rank_iprt)
      const topProv = inProv.slice(0, 5)
      const totalRB = inProv.reduce((s, d) => s + d.rusak_berat_total, 0)
      const avgRSB = inProv.reduce((s, d) => s + d.pct_rusak_sedang_berat, 0) / inProv.length
      return {
        title: `Ringkasan Provinsi ${matchedProv.name} (${inProv.length} Kab/Kota)`,
        text:
          `Provinsi **${matchedProv.name}** memiliki rata-rata kerusakan ruang kelas (sedang+berat) sebesar **${fmt(avgRSB, 1)}%** dengan total **${fmtInt(totalRB)} ruang rusak berat**.\n\n` +
          `**5 Wilayah Prioritas Tertinggi di ${matchedProv.name}:**\n` +
          topProv.map((d, i) => `${i + 1}. **${d.nama}** — Skor PRISMA **${fmt(d.IPRT, 1)}** (Rank Nasional #${d.rank_iprt} · RS+RB: ${fmt(d.pct_rusak_sedang_berat, 1)}%)`).join('\n'),
        actions: [
          { label: `Lihat ${topProv[0].nama.replace('Kabupaten ', 'Kab. ')} di Peta`, page: 'peta', kode: topProv[0].kode_bps },
          { label: 'Simulasikan Alokasi', page: 'simulator' },
        ],
      }
    }

    // 3. Pertanyaan tentang Cara Lapor, Kamera, Geotagging, Verifikasi Akun, Before-Progress-After
    if (/lapor|geotag|kamera|camera|foto|video|verifikasi|bot|spam|before|progress|after|progres|tiket/.test(q)) {
      return {
        title: 'Panduan Pelaporan Geotagging & Siklus Before–Progress–After',
        text:
          `Fitur **Pelaporan & Pemantauan Progres** di PRISMA dirancang dalam 3 tahapan terintegrasi:\n\n` +
          `1. **Verifikasi Akun Anti-Bot & Anti-Spam:** Untuk melihat peta dan daftar pantauan publik, Anda **tidak perlu verifikasi**. Namun sebelum mengirim laporan baru, klik tombol **Verifikasi Akun Pelapor** (isi Nama, Gmail, No. HP, dan verifikasi anti-bot/OTP).\n` +
          `2. **Ajukan Laporan Kondisi (Before):**\n   • Pilih **Provinsi** & **Kabupaten/Kota** (peta otomatis mengarah ke wilayah tersebut).\n   • Isi **Nama Sekolah**, **NPSN**, jenis fasilitas, dan tingkat kerusakan.\n   • **Geser pin biru di peta** atau klik **Ambil GPS Realtime** untuk mengunci titik koordinat.\n   • Ambil **Foto/Video Kamera Langsung** atau **Upload Galeri (maks. 5 file)** lalu klik **Kirim Laporan**. Anda akan mendapat **E-Tiket Resmi** yang diteruskan ke **Pusdatin Kemendikdasmen & Dinas Pendidikan**.\n` +
          `3. **Progres (On-Progress) & Selesai (After):** Dikhususkan bagi **Peran 1 (Analis Pusat)** dan **Peran 2 (Dinas/Sekolah)** untuk memperbarui persentase fisik konstruksi dan pengesahan BAST ramah disabilitas.`,
        actions: [
          { label: 'Buka Menu Pelaporan & Geotag', page: 'pelaporan' },
        ],
      }
    }

    // 4. Pertanyaan tentang 3 Peran Pengguna / Hak Akses / Menu Terkunci
    if (/peran|role|login|akun|terkunci|kunci|akses|publik|dinas|pusdatin|masyarakat/.test(q)) {
      return {
        title: 'Arsitektur Hak Akses 3 Peran Tata Kelola PRISMA',
        text:
          `PRISMA menerapkan kontrol akses berjenjang (*Role-Based Access Control*) untuk menjaga transparansi sekaligus keamanan data negara:\n\n` +
          `• **Peran 1 — Analis Pusat (Kemendikdasmen / Pusdatin):** Akses penuh ke seluruh menu, termasuk **Kode Analisis R**, **Simulasi Dua Jalur**, serta manajemen **On-Progress** & **After**.\n` +
          `• **Peran 2 — Dinas Terkait & Pihak Sekolah (Pemda, Disdik, Bappeda, Kepsek, Guru, Admin):** Mengakses pelaporan **Before**, memperbarui foto **On-Progress**, mengesahkan **After (BAST)**, **Simulasi Dua Jalur**, dan **Metodologi & Data**.\n` +
          `• **Peran 3 — Masyarakat & Warga Sekolah (Siswa, Orang Tua, Komite, Publik):** Bebas memantau Peta & Ringkasan tanpa verifikasi, serta mengajukan laporan **Before** setelah verifikasi akun. Menu *Simulasi*, *On-Progress*, dan *After* dikunci bagi Peran 3.`,
        actions: [
          { label: 'Beralih ke Peran 1 (Analis Pusat)', switchRole: 'pusat' },
          { label: 'Beralih ke Peran 2 (Dinas/Sekolah)', switchRole: 'daerah' },
          { label: 'Beralih ke Peran 3 (Publik)', switchRole: 'publik' },
        ],
      }
    }

    // 5. Pertanyaan tentang Top 10 / Peringkat Tertinggi / Daerah Terparah Nasional
    if (/top|tertinggi|terparah|prioritas|peringkat|ranking|10 besar|daftar/.test(q)) {
      const top10 = R.iprt.top20.slice(0, 10)
      return {
        title: '10 Kabupaten/Kota Prioritas Tertinggi Nasional (Indeks PRISMA 2025)',
        text:
          `Berikut 10 kabupaten/kota dengan skor urgensi PRISMA tertinggi dari 514 wilayah di Indonesia:\n\n` +
          top10.map(d => `${d.rank_iprt}. **${d.nama}** (${d.provinsi}) — Skor **${fmt(d.IPRT, 1)}** | RS+RB: **${fmt(d.pct_rusak_sedang_berat, 1)}%** | P0: **${fmt(d.p0_persen, 1)}%** | Fiskal: **${fmt(d.rasio_kapasitas_fiskal, 3)}**`).join('\n') +
          `\n\nSebanyak **92,2%** wilayah kuintil teratas PRISMA merupakan daerah berkapasitas fiskal rendah/sangat rendah yang membutuhkan afirmasi pemerintah pusat.`,
        actions: [
          { label: 'Lihat #1 Kab. Banggai Laut di Peta', page: 'peta', kode: '7211' },
          { label: 'Buka Simulasi Dua Jalur', page: 'simulator' },
        ],
      }
    }

    // 6. Pertanyaan tentang Rumus PRISMA, Metodologi, & Simulasi Dua Jalur
    if (/rumus|formula|metodologi|komponen|bobot|dua jalur|simulasi|volume|afirmasi|dirichlet/.test(q)) {
      return {
        title: 'Rumus Indeks PRISMA & Kebijakan Alokasi Dua Jalur',
        text:
          `**1. Formulasi Indeks Komposit PRISMA:**\n` +
          `\`PRISMA = 100 × (0,40·K + 0,30·S + 0,30·F)\`\n` +
          `• **K (40% — Kerusakan):** Peringkat persentil % ruang kelas rusak sedang + berat (SD–SMK).\n` +
          `• **S (30% — Kerentanan Sosial):** Rerata persentil kemiskinan ($P_0$) dan kebalikan Rata-rata Lama Sekolah ($-\\text{RLS}$).\n` +
          `• **F (30% — Kelemahan Fiskal):** Persentil kebalikan rasio kapasitas fiskal daerah (PMK 97/2025).\n\n` +
          `**2. Mengapa Harus Alokasi Dua Jalur?**\n` +
          `Pendekatan volume semata memilih **45,6%** sasaran di Pulau Jawa, sedangkan PRISMA mengalihkan prioritas ke wilayah timur (**25,2%**) dan daerah berfiskal lemah (**92,2%**). Karena hanya **36 dari 103 daerah** yang beririsan, PRISMA memadukan **Jalur 1 (Kebutuhan Absolut)** dan **Jalur 2 (Afirmasi Spasial)**.`,
        actions: [
          { label: 'Coba Simulator Dua Jalur', page: 'simulator' },
          { label: 'Baca Metodologi & Sumber Data', page: 'metodologi' },
        ],
      }
    }

    // 7. Pertanyaan tentang Statistik, Moran's I, LISA, Regresi Spasial SEM, Kruskal-Wallis
    if (/statistik|regresi|sem|ols|sar|moran|lisa|kruskal|spasial|autokorelasi|lambda|hipotesis/.test(q)) {
      return {
        title: 'Temuan Ekonometrika Spasial & Inferensi Statistik (n = 514)',
        text:
          `Berikut hasil pengujian statistik pada 514 kabupaten/kota:\n\n` +
          `• **Uji Kruskal–Wallis Antarpulau:** $H = 90,22$ ($df = 6, p < 0,001, \\varepsilon^2 = 0,176$). Median kerusakan tertinggi berada di **Maluku (43,5%)**, **Sulawesi (37,7%)**, dan **Papua (36,4%)**, berbanding kontras dengan **Jawa (27,9%)**.\n` +
          `• **Autokorelasi Spasial (Moran's I & LISA):** Moran's $I = 0,403$ ($p < 0,001$, bobot 5 tetangga terdekat). Ditemukan **31 kab/kota klaster Tinggi-Tinggi (Hotspot)** dan **49 kab/kota Rendah-Rendah (Coldspot)**.\n` +
          `• **Regresi Spasial (Spatial Error Model — SEM):** Uji *Robust LM Error* ($16,91$) mengungguli *Lag* ($14,78$) dengan $\\lambda = 0,562$ ($p < 0,001$) dan penurunan AIC dari $3.723,9$ (OLS) menjadi **$3.608,0$ (SEM)**. Kemiskinan ($P_0$, $\\beta = +0,364$), RLS ($\\beta = -1,423$), $\\ln(\\text{Fiskal})$ ($\\beta = -1,589$), dan status Kota ($\\beta = -5,794$) signifikan pada $p < 0,001$.`,
        actions: [
          { label: 'Buka Halaman Analisis Statistik', page: 'analisis' },
          ...(user?.role === 'pusat' ? [{ label: 'Buka Kode Analisis R', page: 'kode' }] : []),
        ],
      }
    }

    // 8. Jawaban Default Komprehensif (Ringkasan Nasional + Panduan Pintar)
    const tot = R.nasional.find(d => d.jenjang === 'Total')
    return {
      title: 'Ringkasan Data Nasional PRISMA & Bantuan Cepat',
      text:
        `Secara nasional pada tahun 2025 terdapat **${fmtInt(tot.jumlah)} ruang kelas** (SD, SMP, SMA, SMK), di mana **${fmt(tot.pct_sedang_berat, 1)}% (${fmtInt(tot.rusak_sedang + tot.rusak_berat)} ruang)** berada dalam kondisi rusak sedang hingga rusak berat, termasuk **${fmtInt(tot.rusak_berat)} ruang rusak berat (${fmt(tot.pct_berat, 1)}%)**.\n\n` +
        `**Panduan Pencarian Cepat:**\n` +
        `• Ketik nama **Kabupaten/Kota** mana saja (contoh: *"Banggai Laut"*, *"Lembata"*, *"Bangkalan"*, *"Sleman"*, *"Nias"*) untuk melihat profil lengkapnya.\n` +
        `• Ketik **2 nama wilayah** (contoh: *"Bandingkan Lembata dan Kota Medan"*) untuk komparasi langsung.\n` +
        `• Ketik nama **Provinsi** (contoh: *"Jawa Timur"*, *"Nusa Tenggara Timur"*, *"Papua"*) untuk melihat 5 daerah prioritas teratas di provinsi tersebut.`,
      actions: [
        { label: 'Ringkasan Nasional', page: 'ringkasan' },
        { label: 'Peta Interaktif', page: 'peta' },
        { label: 'Lapor & Geotagging', page: 'pelaporan' },
      ],
    }
  }

  const sendQuery = textToSend => {
    const q = (textToSend ?? input).trim()
    if (!q) return

    const userMsg = {
      id: 'u-' + Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      text: q,
    }
    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const reply = generateSmartReply(q)
      setMessages(prev => [
        ...prev,
        {
          id: 'b-' + Date.now(),
          sender: 'bot',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          ...reply,
        },
      ])
      setIsTyping(false)
    }, 380)
  }

  // Render teks dengan dukungan cetak tebal (**teks**) dan kode (`kode`)
  const formatRichText = text => {
    return text.split('\n').map((line, i) => {
      const html = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
      return <p key={i} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
    })
  }

  return (
    <>
      {/* Tombol Mengambang (Floating Action Button) Chatbot PRISMA yang Dapat Digeser (Draggable) */}
      <motion.button
        type="button"
        drag
        dragMomentum={false}
        onDragStart={() => {
          dragMovedRef.current = false
        }}
        onDrag={(_, info) => {
          if (Math.abs(info.offset.x) > 5 || Math.abs(info.offset.y) > 5) {
            dragMovedRef.current = true
          }
        }}
        className={`chatbot-fab ${open ? 'is-open' : ''}`}
        onClick={() => {
          if (dragMovedRef.current) {
            dragMovedRef.current = false
            return
          }
          setOpen(o => !o)
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        title="Klik untuk membuka atau seret untuk memindahkan posisi tombol PRISMA AI"
      >
        {open ? (
          <X size={18} />
        ) : (
          <>
            <div className="fab-icon-pulse">
              <Bot size={16} />
            </div>
            <div className="fab-text">
              <b>Tanya PRISMA AI</b>
              <small>Chatbot 514 kab/kota</small>
            </div>
          </>
        )}
      </motion.button>

      {/* Jendela Interaktif Chatbot */}
      <AnimatePresence>
        {open && (
          <motion.aside
            className={`chatbot-window ${expanded ? 'is-expanded' : ''}`}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22 }}
          >
            <header className="cbw-header">
              <div className="cbw-brand">
                <img src={LOGO_URL} alt="PRISMA" className="cbw-logo" />
                <div>
                  <b>PRISMA AI Copilot</b>
                  <span><span className="online-dot" /> Terhubung 514 Kab/Kota &amp; E-Lapor</span>
                </div>
              </div>
              <div className="cbw-tools">
                <button
                  type="button"
                  className="icon"
                  onClick={() => setMessages(messages.slice(0, 1))}
                  title="Bersihkan riwayat chat"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  className="icon"
                  onClick={() => setExpanded(e => !e)}
                  title={expanded ? 'Perkecil jendela' : 'Perbesar jendela'}
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button type="button" className="icon" onClick={() => setOpen(false)} title="Tutup">
                  <X size={15} />
                </button>
              </div>
            </header>

            <div className="cbw-messages">
              {messages.map(m => (
                <div key={m.id} className={`cbw-msg ${m.sender}`}>
                  <div className="cbw-avatar">
                    {m.sender === 'bot' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className="cbw-bubble">
                    {m.title && <div className="cbw-msg-title">{m.title}</div>}
                    <div className="cbw-msg-body">{formatRichText(m.text)}</div>
                    {m.actions && m.actions.length > 0 && (
                      <div className="cbw-actions">
                        {m.actions.map((act, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="cbw-act-btn"
                            onClick={() => {
                              if (act.switchRole && onSwitchRole) {
                                onSwitchRole(act.switchRole)
                              } else if (act.page && go) {
                                go(act.page, act.kode)
                              }
                            }}
                          >
                            <span>{act.label}</span>
                            <ArrowUpRight size={13} />
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="cbw-time">{m.time}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="cbw-msg bot">
                  <div className="cbw-avatar"><Bot size={16} /></div>
                  <div className="cbw-bubble typing">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                    <small>Menganalisis basis data spasial PRISMA...</small>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Pertanyaan Cepat (Quick Prompts) */}
            <div className="cbw-prompts">
              {QUICK_PROMPTS.map(qp => (
                <button key={qp} type="button" className="cbw-prompt-chip" onClick={() => sendQuery(qp)}>
                  <Sparkles size={11} /> {qp}
                </button>
              ))}
            </div>

            <form
              className="cbw-input-bar"
              onSubmit={e => {
                e.preventDefault()
                sendQuery()
              }}
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ketik nama kab/kota, provinsi, rumus, atau cara lapor..."
              />
              <button type="submit" className="btn primary sm" disabled={!input.trim()}>
                <Send size={15} />
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
