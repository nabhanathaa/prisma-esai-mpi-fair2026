import React, { useState, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import {
  Camera, Upload, MapPin, ShieldCheck, CheckCircle2, AlertTriangle,
  Lock, FileCheck2, Send, Trash2, Video, Image as ImageIcon, RefreshCw,
  Building2, Landmark, UserCheck, Sparkles, Clock, ArrowUpRight,
  Check, X, Eye, Hammer, Award, Phone, Mail, User, Move
} from 'lucide-react'
import {
  INITIAL_REPORTS, createFieldPhotoPlaceholder, fmt, LOGO_URL,
  SAMPLE_IMG_BEFORE,
  SAMPLE_IMG_BEFORE_ONLINE, SAMPLE_IMG_PROGRESS_ONLINE, SAMPLE_IMG_AFTER_ONLINE
} from '../lib/data'

// Custom Pin Icon untuk Leaflet yang mendukung Drag & Drop
const pinIcon = L.divIcon({
  className: 'custom-gps-pin',
  html: `<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#0B3B75,#0284C7);border:3px solid #fff;box-shadow:0 4px 16px rgba(2,132,199,0.75);display:grid;place-items:center;color:#fff;font-weight:bold;font-size:16px;cursor:grab;">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

function MapController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center && Array.isArray(center) && !Number.isNaN(center[0]) && !Number.isNaN(center[1])) {
      map.flyTo(center, zoom || 17, { duration: 0.8 })
    }
  }, [center, zoom, map])
  return null
}

function DraggableLocationPicker({ position, onPick }) {
  const markerRef = useRef(null)
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng, 'Titik koordinat diperbarui melalui klik pada peta.')
    },
  })

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const ll = marker.getLatLng()
          onPick(ll.lat, ll.lng, 'Titik koordinat berhasil digeser (drag & drop) secara presisi.')
        }
      },
    }),
    [onPick]
  )

  return position ? (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={pinIcon}
    />
  ) : null
}

const FASILITAS_OPTIONS = [
  { id: 'kelas', label: 'Ruang Kelas Utama & Rangka Atap', icon: '🏫' },
  { id: 'toilet', label: 'Sanitasi / Toilet / Kamar Mandi Siswa', icon: '🚻' },
  { id: 'uks', label: 'Ruang UKS (Kesehatan Sekolah)', icon: '🏥' },
  { id: 'perpus', label: 'Perpustakaan & Ruang Literasi', icon: '📚' },
  { id: 'mushala', label: 'Mushala / Ruang Ibadah', icon: '🕌' },
  { id: 'kantin', label: 'Kantin & Area Makan Sehat', icon: '🍽️' },
  { id: 'lab', label: 'Laboratorium Sains / Komputer', icon: '🔬' },
  { id: 'ramp', label: 'Aksesibilitas / Ramp Kursi Roda Disabilitas', icon: '♿' },
]

const TINGKAT_KERUSAKAN = [
  { id: 'Rusak Berat', label: 'Rusak Berat (> 45% Struktur Utama)', tone: 'crit' },
  { id: 'Rusak Sedang', label: 'Rusak Sedang (30% – 45% Komponen)', tone: 'warn' },
  { id: 'Kritis Darurat', label: 'Kritis Darurat (Membahayakan Keselamatan Siswa)', tone: 'crit' },
  { id: 'Belum Inklusif', label: 'Belum Ramah Disabilitas / Akses Inklusi Minim', tone: 'info' },
]

const INKLUSI_FLAGS = [
  'Membahayakan keselamatan siswa saat hujan/angin kencang',
  'Belum memiliki jalur kursi roda (ramp) & akses disabilitas',
  'Toilet rusak berat / tidak terpisah / belum inklusif',
  'Kegiatan belajar terpaksa digabung / bergantian shift',
  'Berada di wilayah 3T / kepulauan / rawan bencana iklim',
]

function loadStoredReports() {
  try {
    const raw = localStorage.getItem('prisma_reports_v2')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return INITIAL_REPORTS
}

export default function Pelaporan({ data, user, onSwitchRole, go }) {
  const { kab, geo } = data
  const [activeTab, setActiveTab] = useState('before') // 'before' | 'progress' | 'after'
  const [reports, setReports] = useState(loadStoredReports)

  // State Verifikasi Akun (Anti-Bot & Anti-Spam)
  const [verifiedInfo, setVerifiedInfo] = useState(() => {
    try {
      const saved = sessionStorage.getItem('prisma_verified_account')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verName, setVerName] = useState(user.role === 'pusat' ? 'Tim Analis Pusdatin' : user.role === 'daerah' ? 'Admin Dinas / Kepala Sekolah' : '')
  const [verEmail, setVerEmail] = useState(user.role === 'pusat' ? 'analis.pusdatin@gmail.com' : user.role === 'daerah' ? 'sarpras.dinas@gmail.com' : '')
  const [verHp, setVerHp] = useState(user.role !== 'publik' ? '0812-8800-2026' : '')
  const [verUnsur, setVerUnsur] = useState(
    user.role === 'pusat' ? 'Analis Pusat (Kemendikdasmen/Pusdatin)' :
    user.role === 'daerah' ? 'Pihak Sekolah (Kepala Sekolah / Guru / Admin) / Dinas' :
    'Orang Tua / Wali Murid'
  )
  const [captchaA] = useState(7)
  const [captchaB] = useState(5)
  const [captchaAns, setCaptchaAns] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpGenerated] = useState('482916')
  const [verAgree, setVerAgree] = useState(false)
  const [verError, setVerError] = useState('')
  const [verLoading, setVerLoading] = useState(false)

  // State Form Pelaporan (Before)
  const [prov, setProv] = useState('Sulawesi Tengah')
  const [kodeBps, setKodeBps] = useState('7211') // Default Kab. Banggai Laut (Rank 1 PRISMA)
  const [namaSekolah, setNamaSekolah] = useState('')
  const [npsn, setNpsn] = useState('')
  const [jenjang, setJenjang] = useState('SD')
  const [alamatSekolah, setAlamatSekolah] = useState('')
  const [selectedFasilitas, setSelectedFasilitas] = useState([
    'Ruang Kelas Utama & Rangka Atap',
    'Sanitasi / Toilet / Kamar Mandi Siswa',
  ])
  const [tingkat, setTingkat] = useState('Rusak Berat')
  const [ruangTerdampak, setRuangTerdampak] = useState(3)
  const [siswaTerdampak, setSiswaTerdampak] = useState(95)
  const [selectedFlags, setSelectedFlags] = useState([INKLUSI_FLAGS[0], INKLUSI_FLAGS[1]])
  const [deskripsi, setDeskripsi] = useState('')

  // State Geotagging Realtime & Deep Zoom
  const [lat, setLat] = useState(-1.6142)
  const [lng, setLng] = useState(123.4985)
  const [mapCenter, setMapCenter] = useState([-1.6142, 123.4985])
  const [mapZoom, setMapZoom] = useState(17) // Zoomed in close to street/building level!
  const [akurasi, setAkurasi] = useState(4.5)
  const [gpsStatus, setGpsStatus] = useState('Peta di-zoom dekat level bangunan sekolah. Geser pin 📍 atau klik GPS realtime.')
  const [gpsLoading, setGpsLoading] = useState(false)

  const toggleFasilitas = (itemLabel) => {
    setSelectedFasilitas(prev =>
      prev.includes(itemLabel)
        ? prev.length > 1 ? prev.filter(f => f !== itemLabel) : prev
        : [...prev, itemLabel]
    )
  }

  // State Foto & Video (Maks 5)
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaError, setMediaError] = useState('')
  const fileInputRef = useRef(null)

  // State Kamera Langsung (Foto / Video)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraMode, setCameraMode] = useState('photo') // 'photo' | 'video'
  const [cameraStreamError, setCameraStreamError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // State Animasi Submit & Pop-up Bukti Terkirim
  const [submitState, setSubmitState] = useState({ active: false, progress: 0, stepText: '' })
  const [submittedTicket, setSubmittedTicket] = useState(null)
  const [formErr, setFormErr] = useState('')

  // State untuk Tab 2 (Update Progres oleh Peran 1 & 2)
  const [progReportId, setProgReportId] = useState(reports[0]?.id || '')
  const [progPersen, setProgPersen] = useState(65)
  const [progKontraktor, setProgKontraktor] = useState('Tim Swakelola P2SP Satuan Pendidikan')
  const [progAnggaran, setProgAnggaran] = useState('Rp 780.000.000 (Termin II)')
  const [progCatatan, setProgCatatan] = useState('')
  const [progSuccess, setProgSuccess] = useState('')

  // State untuk Tab 3 (Dokumentasi Selesai / After oleh Peran 1 & 2)
  const [afterReportId, setAfterReportId] = useState(reports[1]?.id || reports[0]?.id || '')
  const [afterBast, setAfterBast] = useState('BAST/REVIT-DIKDASMEN/XI/2026/104')
  const [afterSkor, setAfterSkor] = useState(97)
  const [afterCatatan, setAfterCatatan] = useState('')
  const [afterSuccess, setAfterSuccess] = useState('')

  // Simpan perubahan laporan ke localStorage
  useEffect(() => {
    try { localStorage.setItem('prisma_reports_v2', JSON.stringify(reports)) } catch {}
  }, [reports])

  const provList = useMemo(() => [...new Set(kab.map(d => d.provinsi))].sort(), [kab])
  const kabList = useMemo(() => kab.filter(d => d.provinsi === prov).sort((a, b) => a.rank_iprt - b.rank_iprt), [kab, prov])
  const selectedKab = useMemo(() => kab.find(d => d.kode_bps === kodeBps) || kabList[0] || kab[0], [kab, kodeBps, kabList])

  // Ketika Kabupaten/Kota berubah, otomatis arahkan peta & pin koordinat ke pusat Kabupaten/Kota tersebut
  const moveMapToKab = (targetKode, targetNama) => {
    if (!geo?.features) return
    const feat = geo.features.find(f => f.properties?.kode_bps === targetKode)
    if (feat) {
      const center = L.geoJSON(feat).getBounds().getCenter()
      const nLat = Number(center.lat.toFixed(5))
      const nLng = Number(center.lng.toFixed(5))
      setLat(nLat)
      setLng(nLng)
      setMapCenter([nLat, nLng])
      setMapZoom(16)
      setGpsStatus(`Peta otomatis diarahkan ke ${targetNama || targetKode} & di-zoom presisi. Geser pin 📍 ke bangunan sekolah.`)
    }
  }

  // Hak akses Tab 2 (On-Progress) dan Tab 3 (After) hanya untuk Peran 1 (pusat) dan Peran 2 (daerah)
  const canAccessInternal = user.role === 'pusat' || user.role === 'daerah'

  // Fungsi Verifikasi Akun
  const handleVerifySubmit = e => {
    e.preventDefault()
    setVerError('')
    if (!verName.trim() || !verEmail.trim() || !verHp.trim()) {
      setVerError('Harap lengkapi Nama Lengkap, alamat Gmail/Email, dan Nomor HP terlebih dahulu.')
      return
    }
    if (!verEmail.includes('@')) {
      setVerError('Format alamat email tidak valid (contoh: nama@gmail.com).')
      return
    }
    if (Number(captchaAns) !== captchaA + captchaB) {
      setVerError(`Jawaban verifikasi anti-bot belum tepat (${captchaA} + ${captchaB} = ${captchaA + captchaB}).`)
      return
    }
    if (otpInput.trim() !== otpGenerated) {
      setVerError(`Kode OTP simulasi tidak sesuai. Masukkan kode ${otpGenerated}.`)
      return
    }
    if (!verAgree) {
      setVerError('Harap centang pakta integritas kebenaran pelaporan.')
      return
    }

    setVerLoading(true)
    setTimeout(() => {
      const payload = {
        nama: verName.trim(),
        email: verEmail.trim(),
        hp: verHp.trim(),
        unsur: verUnsur,
        verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        badgeId: 'VER-' + Math.floor(100000 + Math.random() * 900000),
      }
      setVerifiedInfo(payload)
      try { sessionStorage.setItem('prisma_verified_account', JSON.stringify(payload)) } catch {}
      setVerLoading(false)
      setShowVerifyModal(false)
    }, 650)
  }

  const handleInstantDemoVerify = () => {
    const defaultName = user.role === 'pusat' ? 'Dr. Andi Pratama, M.Stat. (Pusdatin)' : user.role === 'daerah' ? 'Ir. Hendra Wijaya, M.Pd. (Dinas/Sekolah)' : 'Ahmad Fauzi (Wali Murid / Masyarakat)'
    const defaultEmail = user.role === 'pusat' ? 'andi.pusdatin.kemendikdasmen@gmail.com' : user.role === 'daerah' ? 'hendra.disdik.sekolah@gmail.com' : 'ahmad.fauzi.wali@gmail.com'
    const payload = {
      nama: verName.trim() || defaultName,
      email: verEmail.trim() || defaultEmail,
      hp: verHp.trim() || '0812-9482-2026',
      unsur: verUnsur,
      verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      badgeId: 'VER-' + Math.floor(100000 + Math.random() * 900000),
    }
    setVerifiedInfo(payload)
    try { sessionStorage.setItem('prisma_verified_account', JSON.stringify(payload)) } catch {}
    setShowVerifyModal(false)
  }

  // Fungsi Ambil Geotagging GPS Realtime & Auto Deep Zoom
  const handleGetRealtimeGPS = () => {
    setGpsLoading(true)
    setGpsStatus('Mendeteksi sinyal satelit GPS perangkat Anda secara realtime...')
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const newLat = Number(pos.coords.latitude.toFixed(5))
          const newLng = Number(pos.coords.longitude.toFixed(5))
          setLat(newLat)
          setLng(newLng)
          setMapCenter([newLat, newLng])
          setMapZoom(17) // Auto Deep Zoom ke level bangunan/atap sekolah!
          setAkurasi(Number((pos.coords.accuracy || 3.8).toFixed(1)))
          setGpsLoading(false)
          setGpsStatus('GPS berhasil dikunci & peta di-zoom dekat (level bangunan)! Geser pin 📍 tepat pada ruang yang rusak.')
        },
        () => {
          const jitterLat = Number((lat + (Math.random() - 0.5) * 0.002).toFixed(5))
          const jitterLng = Number((lng + (Math.random() - 0.5) * 0.002).toFixed(5))
          setLat(jitterLat)
          setLng(jitterLng)
          setMapCenter([jitterLat, jitterLng])
          setMapZoom(17) // Auto Deep Zoom!
          setAkurasi(3.6)
          setGpsLoading(false)
          setGpsStatus('Koordinat Geotagging dikunci & peta di-zoom dekat level bangunan sekolah.')
        },
        { enableHighAccuracy: true, timeout: 6000 }
      )
    } else {
      setMapZoom(17)
      setGpsLoading(false)
      setGpsStatus('Peta di-zoom dekat level bangunan sekolah.')
    }
  }

  // Fungsi Upload Foto/Video dari Galeri (Maks 5)
  const handleFileUpload = e => {
    setMediaError('')
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (mediaFiles.length + files.length > 5) {
      setMediaError('Maksimal 5 file foto/video yang dapat dilampirkan dalam satu laporan.')
      return
    }
    files.forEach(file => {
      const isVid = file.type.startsWith('video/')
      const reader = new FileReader()
      reader.onload = ev => {
        setMediaFiles(prev => {
          if (prev.length >= 5) return prev
          return [
            ...prev,
            {
              id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
              name: file.name,
              type: isVid ? 'video' : 'photo',
              size: (file.size / 1024).toFixed(0) + ' KB',
              url: ev.target.result,
              coords: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
              timestamp: new Date().toLocaleString('id-ID'),
              source: 'Galeri Perangkat',
            },
          ]
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  // Fungsi Buka & Tutup Kamera Langsung
  const openCameraModal = async (mode = 'photo') => {
    setMediaError('')
    if (mediaFiles.length >= 5) {
      setMediaError('Slot bukti visual sudah penuh (maksimal 5 foto/video). Hapus salah satu untuk mengambil baru.')
      return
    }
    setCameraMode(mode)
    setCameraStreamError('')
    setCameraOpen(true)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } else {
        setCameraStreamError('Kamera fisik tidak terdeteksi pada peramban ini. Gunakan tombol Tangkap Simulasi Kamera Geotagging di bawah.')
      }
    } catch {
      setCameraStreamError('Izin kamera belum diaktifkan atau perangkat tidak memiliki webcam. Anda tetap dapat menangkap foto/video menggunakan mode Simulasi Kamera Geotagging di bawah.')
    }
  }

  const closeCameraModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraOpen(false)
  }

  const captureFromCamera = () => {
    const timestamp = new Date().toLocaleString('id-ID')
    const coordsText = `${lat.toFixed(4)}° LS, ${lng.toFixed(4)}° BT (±${akurasi}m)`

    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0, 640, 400)
      ctx.fillStyle = 'rgba(6, 15, 30, 0.82)'
      ctx.fillRect(0, 315, 640, 85)
      ctx.fillStyle = '#38BDF8'
      ctx.font = 'bold 13px sans-serif'
      ctx.fillText(`PRISMA GEOTAGGED ${cameraMode === 'video' ? 'VIDEO FRAME' : 'CAMERA'} · ${selectedKab?.nama || ''}`, 20, 340)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '12px monospace'
      ctx.fillText(`GPS: ${coordsText} | ${timestamp}`, 20, 364)
      ctx.fillStyle = '#94A3B8'
      ctx.fillText(`Pelapor Terverifikasi: ${verifiedInfo?.nama || user.nama}`, 20, 384)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
      setMediaFiles(prev => [
        ...prev,
        {
          id: 'cam-' + Date.now(),
          name: `${cameraMode === 'video' ? 'Rekaman_Lapangan' : 'Foto_Kamera'}_${prev.length + 1}.jpg`,
          type: cameraMode,
          size: '412 KB',
          url: dataUrl,
          coords: coordsText,
          timestamp,
          source: cameraMode === 'video' ? 'Kamera Video Geotag' : 'Kamera Foto Geotag',
        },
      ])
    } else {
      const placeholderUrl = createFieldPhotoPlaceholder({
        title: `${namaSekolah || 'Satuan Pendidikan'} · ${selectedKab?.nama || ''}`,
        subtitle: `${selectedFasilitas.join(', ')} (${tingkat})`,
        coords: coordsText,
        date: timestamp,
        stage: 'before',
      })
      setMediaFiles(prev => [
        ...prev,
        {
          id: 'simcam-' + Date.now(),
          name: `${cameraMode === 'video' ? 'Video_Geotag' : 'Foto_Geotag'}_${prev.length + 1}.svg`,
          type: cameraMode,
          size: '380 KB',
          url: placeholderUrl,
          coords: coordsText,
          timestamp,
          source: cameraMode === 'video' ? 'Kamera Video Geotag' : 'Kamera Foto Geotag',
        },
      ])
    }
    closeCameraModal()
  }

  const toggleInklusiFlag = flag => {
    setSelectedFlags(prev => (prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]))
  }

  // Submit Laporan Baru dengan Animasi Loading Bar Bertahap
  const handleSubmitReport = e => {
    e.preventDefault()
    setFormErr('')
    if (!verifiedInfo) {
      setShowVerifyModal(true)
      return
    }
    if (!namaSekolah.trim()) {
      setFormErr('Harap isi Nama Sekolah yang dilaporkan terlebih dahulu.')
      return
    }
    if (!deskripsi.trim() || deskripsi.trim().length < 15) {
      setFormErr('Harap tuliskan deskripsi kondisi kerusakan secara jelas (minimal 15 karakter).')
      return
    }

    const steps = [
      { p: 22, t: 'Memvalidasi metadata EXIF foto & titik koordinat Geotagging GPS...' },
      { p: 54, t: `Mengintegrasikan laporan dengan Skor PRISMA ${selectedKab?.nama} (${fmt(selectedKab?.IPRT, 1)})...` },
      { p: 84, t: 'Mengenkripsi & mengirim laporan ke Pusdatin Kemendikdasmen serta Dinas Pendidikan Daerah...' },
      { p: 100, t: 'Laporan berhasil diregistrasi! Menerbitkan Bukti Tanda Terima Resmi...' },
    ]

    setSubmitState({ active: true, progress: 8, stepText: 'Memeriksa tanda tangan digital akun terverifikasi...' })

    steps.forEach((st, idx) => {
      setTimeout(() => {
        setSubmitState({ active: true, progress: st.p, stepText: st.t })
        if (idx === steps.length - 1) {
          setTimeout(() => {
            const ticketId = `PRISMA-2026-${Math.floor(8500 + Math.random() * 1400)}`
            const nowStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
                           new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
            const defaultPhoto = SAMPLE_IMG_BEFORE
            const newReport = {
              id: ticketId,
              tanggal: nowStr,
              pelapor: verifiedInfo.nama,
              peranPelapor: verifiedInfo.unsur,
              email: verifiedInfo.email,
              hp: verifiedInfo.hp,
              verified: true,
              sekolah: namaSekolah.trim(),
              npsn: npsn.trim() || '40209912',
              jenjang,
              alamat: alamatSekolah.trim(),
              kode_bps: selectedKab?.kode_bps || '7211',
              kabkota: selectedKab?.nama || 'Kabupaten Banggai Laut',
              provinsi: selectedKab?.provinsi || prov,
              skorPrisma: selectedKab?.IPRT || 85.0,
              rankPrisma: selectedKab?.rank_iprt || 1,
              lat,
              lng,
              akurasi,
              fasilitas: selectedFasilitas,
              tingkat,
              ruangTerdampak: Number(ruangTerdampak) || 1,
              siswaTerdampak: Number(siswaTerdampak) || 30,
              inklusiFlags: selectedFlags,
              deskripsi: deskripsi.trim(),
              statusTahap: 'before',
              statusLabel: 'Terkirim & Terverifikasi Sistem · Menunggu Verifikasi Lapangan Dinas',
              instansiTujuan: `Pusdatin Kemendikdasmen, Ditjen PAUD Dikdasmen & Dinas Pendidikan ${selectedKab?.nama}`,
              progresPersen: 10,
              fotosBefore: mediaFiles.length > 0 ? mediaFiles.map(m => m.url) : [defaultPhoto],
              fotosProgress: [],
              fotosAfter: [],
              catatanDinas: 'Laporan baru diterima melalui portal Geotagging PRISMA dan masuk antrean verifikasi faktual Dinas Pendidikan & Bappeda.',
            }
            setReports(prev => [newReport, ...prev])
            setSubmitState({ active: false, progress: 0, stepText: '' })
            setSubmittedTicket(newReport)
            setNamaSekolah('')
            setNpsn('')
            setAlamatSekolah('')
            setDeskripsi('')
            setMediaFiles([])
          }, 550)
        }
      }, (idx + 1) * 650)
    })
  }

  // Handler Update Progres (Tab 2 - Khusus Peran 1 & 2)
  const handleUpdateProgress = e => {
    e.preventDefault()
    const target = reports.find(r => r.id === progReportId)
    if (!target) return
    const newPhoto = createFieldPhotoPlaceholder({
      title: `${target.sekolah} · Progres Fisik ${progPersen}%`,
      subtitle: progCatatan || 'Pemasangan struktur utama, rangka atap & akses inklusif',
      coords: `${target.lat.toFixed(4)}° S, ${target.lng.toFixed(4)}° E`,
      date: new Date().toLocaleDateString('id-ID'),
      stage: 'progress',
    })
    setReports(prev =>
      prev.map(r =>
        r.id === progReportId
          ? {
              ...r,
              statusTahap: 'progress',
              progresPersen: Number(progPersen),
              statusLabel: `Sedang Direvitalisasi (Konstruksi ${progPersen}%)`,
              kontraktor: progKontraktor,
              anggaranSerapan: progAnggaran,
              catatanDinas: progCatatan || `Progres pembangunan mencapai ${progPersen}%, diawasi oleh Dinas Pendidikan & Komite Sekolah.`,
              fotosProgress: [newPhoto, ...(r.fotosProgress || [])],
            }
          : r
      )
    )
    setProgSuccess(`Progres pengerjaan ${target.sekolah} berhasil diperbarui ke ${progPersen}%!`)
    setTimeout(() => setProgSuccess(''), 4000)
  }

  // Handler Update Selesai / After (Tab 3 - Khusus Peran 1 & 2)
  const handleFinalizeAfter = e => {
    e.preventDefault()
    const target = reports.find(r => r.id === afterReportId)
    if (!target) return
    const newAfterPhoto = createFieldPhotoPlaceholder({
      title: `${target.sekolah} · SELESAI REVITALISASI (100%)`,
      subtitle: `BAST: ${afterBast} · Skor Kelayakan Inklusif: ${afterSkor}/100`,
      coords: `${target.lat.toFixed(4)}° S, ${target.lng.toFixed(4)}° E`,
      date: new Date().toLocaleDateString('id-ID'),
      stage: 'after',
    })
    setReports(prev =>
      prev.map(r =>
        r.id === afterReportId
          ? {
              ...r,
              statusTahap: 'after',
              progresPersen: 100,
              statusLabel: 'Selesai Revitalisasi 100% · Terverifikasi BAST',
              nomorBast: afterBast,
              skorKelayakanAfter: Number(afterSkor),
              fiturInklusiAfter: [
                'Jalur Kursi Roda (Ramp Landai Standar Inklusi)',
                'Toilet Ramah Disabilitas dengan Pegangan (Handrail)',
                'Struktur Atap & Kolom Tahan Gempa',
                'Ventilasi & Pencahayaan Ruang Kelas Optimal',
              ],
              catatanDinas: afterCatatan || 'Seluruh pekerjaan revitalisasi telah selesai 100%, diaudit bersama Pusdatin & Dinas Pendidikan, dan siap digunakan siswa.',
              fotosAfter: [newAfterPhoto, ...(r.fotosAfter || [])],
            }
          : r
      )
    )
    setAfterSuccess(`Dokumentasi Selesai Revitalisasi (After) untuk ${target.sekolah} berhasil disahkan!`)
    setTimeout(() => setAfterSuccess(''), 4000)
  }

  return (
    <div className="page">
      <header className="ph">
        <div>
          <span className="eyebrow">PARTISIPASI PUBLIK &amp; AKUNTABILITAS SIKLUS PENUH (CLOSED-LOOP GOVERNANCE)</span>
          <h1>Pelaporan Geotagging &amp; Pemantauan Progres Revitalisasi</h1>
          <p>
            Laporkan kondisi infrastruktur sekolah secara <i>real-time</i> disertai bukti foto/video dan titik koordinat GPS, serta pantau tahapan pembangunan dari pengajuan awal (<b>Before</b>), pengerjaan konstruksi (<b>On-Progress</b>), hingga tuntas direvitalisasi (<b>After</b>).
          </p>
        </div>
        <div className="ph-actions">
          {verifiedInfo ? (
            <div className="verified-pill">
              <ShieldCheck size={16} />
              <div>
                <b>Akun Terverifikasi ({verifiedInfo.badgeId})</b>
                <small>{verifiedInfo.nama} · {verifiedInfo.email}</small>
              </div>
            </div>
          ) : (
            <button type="button" className="btn primary sm" onClick={() => setShowVerifyModal(true)}>
              <UserCheck size={16} /> Verifikasi Akun Pelapor
            </button>
          )}
        </div>
      </header>

      {/* Ringkasan Siklus Revitalisasi */}
      <div className="report-summary-strip">
        <div className="rss-card">
          <span className="rss-badge before">TAHAP 1 · BEFORE</span>
          <b>{reports.filter(r => r.statusTahap === 'before').length} Laporan</b>
          <small>Pengajuan &amp; Verifikasi Lapangan</small>
        </div>
        <div className="rss-card">
          <span className="rss-badge progress">TAHAP 2 · ON-PROGRESS</span>
          <b>{reports.filter(r => r.statusTahap === 'progress').length} Sekolah</b>
          <small>Konstruksi &amp; Inspeksi Berjalan</small>
        </div>
        <div className="rss-card">
          <span className="rss-badge after">TAHAP 3 · AFTER (SELESAI)</span>
          <b>{reports.filter(r => r.statusTahap === 'after').length} Sekolah</b>
          <small>Tuntas Revitalisasi &amp; Ramah Inklusi</small>
        </div>
        <div className="rss-card highlight">
          <span className="rss-badge gov">INTEGRASI INSTANSI</span>
          <b>Pusdatin &amp; Dinas</b>
          <small>Tersinkronisasi dengan Skor Spasial PRISMA</small>
        </div>
      </div>

      {/* Navigasi 3 Tab Siklus Revitalisasi */}
      <div className="cycle-tabs" role="tablist">
        <button
          type="button"
          className={activeTab === 'before' ? 'cycle-tab on' : 'cycle-tab'}
          onClick={() => setActiveTab('before')}
        >
          <Camera size={17} />
          <div>
            <b>1. Ajukan Laporan Kondisi (Before)</b>
            <small>Foto/Video Kamera, Geotagging GPS &amp; Pantauan Publik (Semua Peran)</small>
          </div>
        </button>

        <button
          type="button"
          className={activeTab === 'progress' ? 'cycle-tab on' : 'cycle-tab'}
          onClick={() => setActiveTab('progress')}
        >
          <Hammer size={17} />
          <div>
            <b>2. Foto Progres Pengerjaan (On-Progress)</b>
            <small>Update Fisik &amp; Audit Konstruksi {canAccessInternal ? '(Akses Terbuka)' : '· Khusus Peran 1 & 2'}</small>
          </div>
          {!canAccessInternal && <span className="lock-tag"><Lock size={13} /> Terkunci</span>}
        </button>

        <button
          type="button"
          className={activeTab === 'after' ? 'cycle-tab on' : 'cycle-tab'}
          onClick={() => setActiveTab('after')}
        >
          <Award size={17} />
          <div>
            <b>3. Selesai Revitalisasi (After)</b>
            <small>Evaluasi Akhir, BAST &amp; Dokumentasi Before–After {canAccessInternal ? '(Akses Terbuka)' : '· Khusus Peran 1 & 2'}</small>
          </div>
          {!canAccessInternal && <span className="lock-tag"><Lock size={13} /> Terkunci</span>}
        </button>
      </div>

      {/* ==================== TAB 1: AJUKAN PELAPORAN (BEFORE) ==================== */}
      {activeTab === 'before' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cycle-content">
          {/* Banner Verifikasi Akun Anti-Bot / Anti-Spam */}
          <section className={`verify-banner ${verifiedInfo ? 'is-verified' : 'needs-verify'}`}>
            <div className="vb-left">
              <div className="vb-icon">
                {verifiedInfo ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h3>
                  {verifiedInfo
                    ? `Identitas Pelapor Terverifikasi: ${verifiedInfo.nama} (${verifiedInfo.unsur})`
                    : 'Verifikasi Akun Diperlukan Sebelum Mengirim Laporan Baru (Anti-Bot & Anti-Spam)'}
                </h3>
                <p>
                  {verifiedInfo
                    ? `Email: ${verifiedInfo.email} · No. HP: ${verifiedInfo.hp} · Terverifikasi pada ${verifiedInfo.verifiedAt}. Anda dapat langsung mengisi dan mengirim laporan revitalisasi di bawah ini.`
                    : 'Untuk menjaga validitas data nasional dan mencegah laporan palsu/bot/spam, setiap pelapor wajib memverifikasi akun terlebih dahulu. Jika Anda hanya ingin memantau peta atau melihat daftar laporan di bawah, Anda tidak perlu melakukan verifikasi.'}
                </p>
              </div>
            </div>
            <div className="vb-actions">
              {verifiedInfo ? (
                <button type="button" className="btn ghost sm" onClick={() => setShowVerifyModal(true)}>
                  Ubah Data Verifikasi
                </button>
              ) : (
                <>
                  <button type="button" className="btn primary sm" onClick={() => setShowVerifyModal(true)}>
                    <UserCheck size={15} /> Verifikasi Akun Sekarang
                  </button>
                  <button type="button" className="btn ghost sm" onClick={handleInstantDemoVerify}>
                    <Sparkles size={15} /> Verifikasi Instan (Mode Demo)
                  </button>
                </>
              )}
            </div>
          </section>

          <form className="report-form-grid" onSubmit={handleSubmitReport}>
            {/* KOLOM KIRI: KAMERA, UPLOAD MAKS 5 FOTO, & GEOTAGGING REALTIME */}
            <div className="rf-col">
              <section className="card">
                <div className="card-head-row">
                  <div>
                    <h3><Camera size={18} /> 1 · Bukti Visual Kamera &amp; Galeri (Maks. 5 Foto/Video)</h3>
                    <p className="muted">Ambil foto/video langsung dari kamera dengan cap GPS atau unggah dari galeri perangkat Anda ({mediaFiles.length}/5 terisi)</p>
                  </div>
                  <span className="slot-counter">{mediaFiles.length} / 5 File</span>
                </div>

                <div className="media-action-buttons">
                  <button type="button" className="btn primary sm" onClick={() => openCameraModal('photo')}>
                    <Camera size={15} /> Foto Kamera Langsung
                  </button>
                  <button type="button" className="btn secondary sm" onClick={() => openCameraModal('video')}>
                    <Video size={15} /> Rekam Video Kondisi
                  </button>
                  <button type="button" className="btn ghost sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={15} /> Upload Galeri (Maks. 5)
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    hidden
                    onChange={handleFileUpload}
                  />
                </div>

                {mediaError && <div className="err-box">{mediaError}</div>}

                {/* Grid 5 Slot Foto/Video */}
                <div className="media-slots-grid">
                  {mediaFiles.map((m, idx) => (
                    <div key={m.id} className="media-slot filled">
                      <img src={m.url} alt={m.name} />
                      <div className="ms-overlay">
                        <span className="ms-badge">{idx + 1} · {m.source}</span>
                        <button
                          type="button"
                          className="ms-del"
                          onClick={() => setMediaFiles(prev => prev.filter(x => x.id !== m.id))}
                          title="Hapus file"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="ms-meta">
                        <b>{m.name}</b>
                        <small>{m.coords} · {m.size}</small>
                      </div>
                    </div>
                  ))}

                  {Array.from({ length: Math.max(0, 5 - mediaFiles.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="media-slot empty"
                      onClick={() => (i === 0 ? openCameraModal('photo') : fileInputRef.current?.click())}
                    >
                      <ImageIcon size={20} />
                      <span>Slot Foto #{mediaFiles.length + i + 1}</span>
                      <small>{i === 0 ? 'Klik untuk Kamera' : 'Klik untuk Upload'}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <div className="card-head-row">
                  <div>
                    <h3><MapPin size={18} /> 2 · Geotagging Lokasi &amp; Geser Pin Peta Interaktif</h3>
                    <p className="muted">Pilih Provinsi &amp; Kab/Kota atau geser pin 📍 secara langsung untuk mengunci titik koordinat sekolah</p>
                  </div>
                  <button type="button" className="btn secondary sm" onClick={handleGetRealtimeGPS} disabled={gpsLoading}>
                    <RefreshCw size={14} className={gpsLoading ? 'spin' : ''} /> Ambil GPS Realtime
                  </button>
                </div>

                <div className="gps-status-bar">
                  <Move size={15} />
                  <span>{gpsStatus}</span>
                </div>

                <div className="map-zoom-shortcuts">
                  <button
                    type="button"
                    className={`mzs-btn ${mapZoom >= 16 ? 'active' : ''}`}
                    onClick={() => {
                      setMapZoom(17)
                      setMapCenter([lat, lng])
                    }}
                  >
                    🔍 Zoom Dekat (Level Bangunan Sekolah)
                  </button>
                  <button
                    type="button"
                    className={`mzs-btn ${mapZoom < 16 ? 'active' : ''}`}
                    onClick={() => {
                      setMapZoom(12)
                      setMapCenter([lat, lng])
                    }}
                  >
                    🗺️ Zoom Wilayah Kecamatan / Kota
                  </button>
                </div>

                <div className="gps-coords-grid">
                  <label className="rf-field">
                    <span>Latitude (Lintang)</span>
                    <input type="number" step="0.0001" value={lat} onChange={e => {
                      const v = Number(e.target.value)
                      setLat(v)
                      setMapCenter([v, lng])
                    }} />
                  </label>
                  <label className="rf-field">
                    <span>Longitude (Bujur)</span>
                    <input type="number" step="0.0001" value={lng} onChange={e => {
                      const v = Number(e.target.value)
                      setLng(v)
                      setMapCenter([lat, v])
                    }} />
                  </label>
                  <label className="rf-field">
                    <span>Akurasi Sinyal GPS</span>
                    <input type="text" value={`± ${akurasi} meter`} readOnly />
                  </label>
                </div>

                <div className="mini-map-box">
                  <MapContainer center={mapCenter} zoom={mapZoom} className="mini-leaflet-map" scrollWheelZoom={true}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <MapController center={[lat, lng]} zoom={mapZoom} />
                    <DraggableLocationPicker
                      position={[lat, lng]}
                      onPick={(newLat, newLng, msg) => {
                        setLat(Number(newLat.toFixed(5)))
                        setLng(Number(newLng.toFixed(5)))
                        setMapCenter([Number(newLat.toFixed(5)), Number(newLng.toFixed(5))])
                        if (msg) setGpsStatus(msg)
                      }}
                    />
                  </MapContainer>
                  <div className="mini-map-caption">
                    💡 <b>Tips Interaktif:</b> Peta sudah di-zoom presisi. Anda dapat <b>menyeret (drag &amp; drop) pin 📍</b> tepat di atas bangunan kelas yang rusak atau <b>mengklik titik mana pun di peta</b>.
                  </div>
                </div>
              </section>
            </div>

            {/* KOLOM KANAN: FORMULIR LENGKAP IDENTITAS PELAPOR, PROVINSI/KAB-KOTA, NAMA SEKOLAH & KERUSAKAN */}
            <div className="rf-col">
              <section className="card">
                <h3><FileCheck2 size={18} /> 3 · Formulir Lokasi Wilayah, Nama Sekolah &amp; Detail Kerusakan</h3>
                <p className="muted">Pilih Provinsi &amp; Kabupaten/Kota, isi Nama Sekolah beserta kondisinya untuk diintegrasikan dengan Skor Spasial PRISMA</p>

                {/* Kotak Ringkasan Identitas Pelapor */}
                <div className="reporter-id-box">
                  <div className="rib-item">
                    <User size={14} />
                    <div><small>Nama Pelapor</small><b>{verifiedInfo ? verifiedInfo.nama : 'Belum Diverifikasi'}</b></div>
                  </div>
                  <div className="rib-item">
                    <Mail size={14} />
                    <div><small>Gmail / Email</small><b>{verifiedInfo ? verifiedInfo.email : 'Wajib Verifikasi'}</b></div>
                  </div>
                  <div className="rib-item">
                    <Phone size={14} />
                    <div><small>No. HP / WhatsApp</small><b>{verifiedInfo ? verifiedInfo.hp : 'Wajib Verifikasi'}</b></div>
                  </div>
                </div>

                {/* Pemilihan Provinsi dan 514 Kabupaten/Kota */}
                <div className="rf-row2">
                  <label className="rf-field">
                    <span>Pilih Provinsi Lokasi Sekolah *</span>
                    <select
                      value={prov}
                      onChange={e => {
                        const p = e.target.value
                        setProv(p)
                        const firstKab = kab.filter(d => d.provinsi === p).sort((a, b) => a.rank_iprt - b.rank_iprt)[0]
                        if (firstKab) {
                          setKodeBps(firstKab.kode_bps)
                          moveMapToKab(firstKab.kode_bps, firstKab.nama)
                        }
                      }}
                    >
                      {provList.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </label>

                  <label className="rf-field">
                    <span>Pilih Kabupaten / Kota (514 Wilayah) *</span>
                    <select
                      value={kodeBps}
                      onChange={e => {
                        const nextKode = e.target.value
                        setKodeBps(nextKode)
                        const kObj = kab.find(d => d.kode_bps === nextKode)
                        moveMapToKab(nextKode, kObj?.nama)
                      }}
                    >
                      {kabList.map(k => (
                        <option key={k.kode_bps} value={k.kode_bps}>
                          {k.nama} (PRISMA: {fmt(k.IPRT, 1)} · Rank #{k.rank_iprt})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Panel Otomatis Skor Spasial PRISMA Kabupaten/Kota Terpilih */}
                {selectedKab && (
                  <div className="prisma-auto-context">
                    <div className="pac-head">
                      <span>PROFIL SPASIAL WILAYAH TERPILIH ({selectedKab.nama.toUpperCase()})</span>
                      <button type="button" className="link" onClick={() => go('peta', selectedKab.kode_bps)}>
                        Lihat di Peta Utama <ArrowUpRight size={13} />
                      </button>
                    </div>
                    <div className="pac-metrics">
                      <div><small>Skor PRISMA</small><b>{fmt(selectedKab.IPRT, 1)}</b></div>
                      <div><small>Peringkat Nasional</small><b>#{selectedKab.rank_iprt} / 514</b></div>
                      <div><small>% Rusak Sedang+Berat</small><b>{fmt(selectedKab.pct_rusak_sedang_berat, 1)}%</b></div>
                      <div><small>Kapasitas Fiskal</small><b>{selectedKab.kategori_kapasitas_fiskal}</b></div>
                    </div>
                  </div>
                )}

                {/* Input Nama Sekolah, NPSN, Jenjang, dan Alamat */}
                <div className="rf-row3">
                  <label className="rf-field" style={{ gridColumn: 'span 2' }}>
                    <span>Nama Satuan Pendidikan / Sekolah yang Dilaporkan *</span>
                    <input
                      type="text"
                      value={namaSekolah}
                      onChange={e => setNamaSekolah(e.target.value)}
                      placeholder={`Mis. SD Negeri 1 ${selectedKab?.nama?.replace('Kabupaten ', '') || 'Banggai Laut'}`}
                    />
                  </label>
                  <label className="rf-field">
                    <span>NPSN (Opsional / 8 Digit)</span>
                    <input
                      type="text"
                      value={npsn}
                      onChange={e => setNpsn(e.target.value)}
                      placeholder="Mis. 40204118"
                      maxLength={10}
                    />
                  </label>
                </div>

                <label className="rf-field">
                  <span>Alamat / Desa / Kecamatan Sekolah</span>
                  <input
                    type="text"
                    value={alamatSekolah}
                    onChange={e => setAlamatSekolah(e.target.value)}
                    placeholder={`Contoh: Jl. Pendidikan No. 12, Kec. Utama, ${selectedKab?.nama || ''}`}
                  />
                </label>

                <div className="rf-row3">
                  <label className="rf-field">
                    <span>Jenjang Pendidikan</span>
                    <select value={jenjang} onChange={e => setJenjang(e.target.value)}>
                      <option value="SD">SD / MI</option>
                      <option value="SMP">SMP / MTs</option>
                      <option value="SMA">SMA / MA</option>
                      <option value="SMK">SMK</option>
                      <option value="SLB">SLB / Pendidikan Khusus</option>
                    </select>
                  </label>
                  <label className="rf-field">
                    <span>Jumlah Ruang Terdampak</span>
                    <input type="number" min={1} max={50} value={ruangTerdampak} onChange={e => setRuangTerdampak(e.target.value)} />
                  </label>
                  <label className="rf-field">
                    <span>Estimasi Siswa Terdampak</span>
                    <input type="number" min={1} max={2000} value={siswaTerdampak} onChange={e => setSiswaTerdampak(e.target.value)} />
                  </label>
                </div>

                <div className="rf-field full">
                  <div className="rf-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>Komponen Prasarana / Ruang Rusak (Bisa Pilih Lebih Dari 1) *</span>
                    <small className="muted">{selectedFasilitas.length} komponen dipilih</small>
                  </div>
                  <div className="fasilitas-multi-grid">
                    {FASILITAS_OPTIONS.map(opt => {
                      const isSel = selectedFasilitas.includes(opt.label)
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`fasilitas-chip-btn ${isSel ? 'selected' : ''}`}
                          onClick={() => toggleFasilitas(opt.label)}
                        >
                          <span className="fc-icon">{opt.icon}</span>
                          <span className="fc-label">{opt.label}</span>
                          <span className="fc-check">{isSel ? '✓' : '+'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rf-row2">
                  <label className="rf-field">
                    <span>Tingkat Kerusakan / Urgensi Terparah</span>
                    <select value={tingkat} onChange={e => setTingkat(e.target.value)}>
                      {TINGKAT_KERUSAKAN.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </label>
                  <label className="rf-field">
                    <span>Kesiapan Revitalisasi</span>
                    <input type="text" value="Prioritas Tinggi (Sesuai Skor PRISMA)" readOnly />
                  </label>
                </div>

                <div className="rf-field">
                  <span>Indikator Kerentanan &amp; Inklusi Sosial (Pilih yang sesuai kondisi riil)</span>
                  <div className="flags-checklist">
                    {INKLUSI_FLAGS.map(flag => {
                      const active = selectedFlags.includes(flag)
                      return (
                        <button
                          type="button"
                          key={flag}
                          className={active ? 'flag-chip on' : 'flag-chip'}
                          onClick={() => toggleInklusiFlag(flag)}
                        >
                          {active ? <CheckCircle2 size={14} /> : <span className="flag-dot" />}
                          <span>{flag}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="rf-field">
                  <span>Deskripsi Lengkap Kondisi Kerusakan &amp; Dampak bagi Siswa *</span>
                  <textarea
                    rows={3}
                    value={deskripsi}
                    onChange={e => setDeskripsi(e.target.value)}
                    placeholder="Jelaskan secara spesifik kondisi kerusakan (misal: rangka atap kayu lapuk, dinding retak struktural, belum ada akses kursi roda/toilet inklusif) dan dampaknya terhadap proses belajar..."
                  />
                </label>

                {formErr && <div className="err-box">{formErr}</div>}

                {/* Animasi Loading Bar Saat Proses Pengiriman */}
                {submitState.active && (
                  <div className="submit-progress-box">
                    <div className="spb-top">
                      <b>Mengirim &amp; Memvalidasi Laporan Geotagging...</b>
                      <span>{submitState.progress}%</span>
                    </div>
                    <div className="spb-bar">
                      <motion.div
                        className="spb-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${submitState.progress}%` }}
                        transition={{ duration: 0.35 }}
                      />
                    </div>
                    <small>{submitState.stepText}</small>
                  </div>
                )}

                <div className="rf-submit-row">
                  <div className="rf-dest-note">
                    <Landmark size={16} />
                    <span>
                      Laporan otomatis diteruskan ke <b>Pusdatin Kemendikdasmen</b>, <b>Ditjen PAUD Dikdasmen</b>, serta <b>Dinas Pendidikan &amp; Bappeda {selectedKab?.nama}</b>.
                    </span>
                  </div>
                  <button type="submit" className="btn primary" disabled={submitState.active}>
                    <Send size={16} /> {verifiedInfo ? 'Kirim Laporan Revitalisasi' : 'Verifikasi & Kirim Laporan'}
                  </button>
                </div>
              </section>
            </div>
          </form>

          {/* DAFTAR PANTAUAN LAPORAN PUBLIK (Dapat dilihat tanpa verifikasi) */}
          <section className="card">
            <div className="card-head-row">
              <div>
                <h3><Eye size={18} /> Daftar Pantauan Laporan &amp; Status Verifikasi Nasional</h3>
                <p className="muted">Transparansi publik: masyarakat dapat memantau tiket laporan yang telah masuk tanpa harus login/verifikasi ulang</p>
              </div>
            </div>

            {/* Banner Keterangan Data Contoh Prototipe */}
            <div className="prototype-disclaimer-box">
              <div className="pdb-icon"><AlertTriangle size={18} /></div>
              <div>
                <b>Keterangan Data &amp; Foto Simulasi (Prototipe):</b> Informasi satuan pendidikan dan dokumentasi foto di bawah ini merupakan <b>data contoh demonstrasi prototipe PRISMA</b> (bukan data riil kondisi sekolah terkait) yang dihimpun untuk mensimulasikan alur verifikasi siklus <i>Before–Progress–After</i> secara interaktif.
              </div>
            </div>

            <div className="reports-feed">
              {reports.map(r => (
                <article key={r.id} className="report-item-card">
                  <div className="ric-photo">
                    <img
                      src={r.fotosAfter?.[0] || r.fotosProgress?.[0] || r.fotosBefore?.[0]}
                      alt={r.sekolah}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = r.statusTahap === 'after' ? SAMPLE_IMG_AFTER_ONLINE : r.statusTahap === 'progress' ? SAMPLE_IMG_PROGRESS_ONLINE : SAMPLE_IMG_BEFORE_ONLINE
                      }}
                    />
                    <span className={`ric-stage-badge ${r.statusTahap}`}>
                      {r.statusTahap === 'before' ? 'BEFORE · PENGAJUAN' : r.statusTahap === 'progress' ? `ON-PROGRESS · ${r.progresPersen}%` : 'AFTER · SELESAI 100%'}
                    </span>
                    <span className="ric-mock-badge">Contoh Data Prototipe</span>
                  </div>
                  <div className="ric-body">
                    <div className="ric-top">
                      <span className="ric-ticket">{r.id}</span>
                      <span className="ric-date"><Clock size={12} /> {r.tanggal}</span>
                      <span className="ric-prisma-tag">Skor PRISMA Wilayah: <b>{fmt(r.skorPrisma, 1)}</b> (#{r.rankPrisma})</span>
                    </div>
                    <h4>{r.sekolah} <small>({r.jenjang} · NPSN {r.npsn})</small></h4>
                    <p className="ric-loc">
                      <MapPin size={13} /> {r.kabkota}, {r.provinsi} · Koordinat GPS: <code>{r.lat.toFixed(4)}°, {r.lng.toFixed(4)}° (±{r.akurasi}m)</code>
                    </p>
                    <p className="ric-desc">{r.deskripsi}</p>
                    <div className="ric-flags">
                      {Array.isArray(r.fasilitas) ? (
                        r.fasilitas.map(f => <span key={f} className="ric-chip highlight">{f}</span>)
                      ) : (
                        (r.fasilitas || '').split(' + ').map(f => <span key={f} className="ric-chip highlight">{f}</span>)
                      )}
                      <span className="ric-chip warn">{r.tingkat} ({r.ruangTerdampak} ruang · {r.siswaTerdampak} siswa)</span>
                      {r.inklusiFlags?.slice(0, 2).map(f => <span key={f} className="ric-chip">{f}</span>)}
                    </div>
                    <div className="ric-footer">
                      <div>
                        <small>Pelapor Terverifikasi: <b>{r.pelapor}</b> ({r.peranPelapor})</small>
                        <small>Tujuan: <b>{r.instansiTujuan}</b></small>
                      </div>
                      <div className="ric-status-box">
                        <span>{r.statusLabel}</span>
                        <div className="ric-progbar"><i style={{ width: `${r.progresPersen}%` }} /></div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </motion.div>
      )}

      {/* ==================== TAB 2: FOTO PROGRES PENGERJAAN (ON-PROGRESS) ==================== */}
      {activeTab === 'progress' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cycle-content">
          {!canAccessInternal ? (
            <section className="locked-access-card">
              <div className="lac-icon"><Lock size={34} /></div>
              <span className="lac-badge">AKSES TERBATAS · DIKHUSUSKAN UNTUK PERAN 1 &amp; PERAN 2</span>
              <h2>Menu Dokumentasi Foto Progres (On-Progress) Terkunci</h2>
              <p>
                Anda saat ini mengakses portal sebagai <b>Peran 3 (Masyarakat &amp; Warga Sekolah / Publik)</b>. Untuk menjaga akuntabilitas audit konstruksi dan validitas serapan anggaran, fitur <b>Unggah &amp; Manajemen Foto Progres Pengerjaan (On-Progress)</b> dikhususkan bagi:
              </p>
              <div className="lac-roles-grid">
                <div className="lac-role-box">
                  <Landmark size={20} />
                  <div>
                    <b>Peran 1 · Analis Pusat (Kemendikdasmen / Pusdatin)</b>
                    <small>Pemangku kebijakan nasional, evaluator DAK Fisik Pendidikan &amp; auditor pusat.</small>
                  </div>
                </div>
                <div className="lac-role-box">
                  <Building2 size={20} />
                  <div>
                    <b>Peran 2 · Dinas Terkait Daerah &amp; Pihak Sekolah</b>
                    <small>Dinas Pendidikan Pemda, Bappeda, Kepala Sekolah, Guru, Admin &amp; Tim P2SP.</small>
                  </div>
                </div>
              </div>
              <div className="lac-actions">
                <button type="button" className="btn primary" onClick={() => setActiveTab('before')}>
                  Kembali ke Menu Laporan Awal (Before)
                </button>
                {onSwitchRole && (
                  <>
                    <button type="button" className="btn secondary" onClick={() => onSwitchRole('daerah')}>
                      Simulasi Masuk Peran 2 (Dinas / Sekolah)
                    </button>
                    <button type="button" className="btn ghost" onClick={() => onSwitchRole('pusat')}>
                      Simulasi Masuk Peran 1 (Analis Pusat)
                    </button>
                  </>
                )}
              </div>
            </section>
          ) : (
            <div className="report-form-grid">
              <section className="card">
                <h3><Hammer size={18} /> Update Foto Progres Konstruksi (On-Progress)</h3>
                <p className="muted">Khusus Peran 1 (Analis Pusat) &amp; Peran 2 (Dinas Pendidikan / Pihak Sekolah): perbarui persentase fisik lapangan dan dokumentasi pengerjaan</p>

                <form className="rf-stack" onSubmit={handleUpdateProgress}>
                  <label className="rf-field">
                    <span>Pilih Proyek Satuan Pendidikan</span>
                    <select value={progReportId} onChange={e => setProgReportId(e.target.value)}>
                      {reports.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.id} · {r.sekolah} ({r.kabkota} — Progres saat ini: {r.progresPersen}%)
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="slider">
                    <div>
                      <span>Persentase Capaian Konstruksi Fisik</span>
                      <b>{progPersen}%</b>
                    </div>
                    <input type="range" min={15} max={95} value={progPersen} onChange={e => setProgPersen(Number(e.target.value))} />
                  </div>

                  <div className="rf-row2">
                    <label className="rf-field">
                      <span>Pelaksana / Tim P2SP / Kontraktor</span>
                      <input type="text" value={progKontraktor} onChange={e => setProgKontraktor(e.target.value)} />
                    </label>
                    <label className="rf-field">
                      <span>Realisasi Pencairan &amp; Serapan Anggaran</span>
                      <input type="text" value={progAnggaran} onChange={e => setProgAnggaran(e.target.value)} />
                    </label>
                  </div>

                  <label className="rf-field">
                    <span>Catatan Inspeksi Teknis (Struktur, Atap, &amp; Fasilitas Inklusif)</span>
                    <textarea
                      rows={3}
                      value={progCatatan}
                      onChange={e => setProgCatatan(e.target.value)}
                      placeholder="Contoh: Pemasangan kuda-kuda baja ringan dan pengecoran jalur kursi roda (ramp) telah mencapai 75% sesuai spesifikasi teknis..."
                    />
                  </label>

                  {progSuccess && <div className="ok-box"><CheckCircle2 size={16} /> {progSuccess}</div>}

                  <button type="submit" className="btn primary">
                    <Upload size={16} /> Simpan &amp; Publikasikan Foto Progres
                  </button>
                </form>
              </section>

              <section className="card">
                <h3><Eye size={18} /> Galeri Pemantauan Konstruksi Berjalan (On-Progress)</h3>
                <p className="muted">Perbandingan kondisi awal (Before) dengan progres konstruksi terbaru di lapangan</p>

                <div className="progress-cards-list">
                  {reports.filter(r => r.statusTahap === 'progress' || r.progresPersen > 10).map(r => (
                    <div key={r.id} className="prog-compare-card">
                      <div className="pcc-head">
                        <div>
                          <b>{r.sekolah}</b>
                          <small>{r.kabkota}, {r.provinsi} · {r.id}</small>
                        </div>
                        <span className="pcc-pct">{r.progresPersen}% Fisik</span>
                      </div>
                      <div className="pcc-photos">
                        <figure>
                          <img
                            src={r.fotosBefore?.[0]}
                            alt="Before"
                            onError={(e) => { e.target.onerror = null; e.target.src = SAMPLE_IMG_BEFORE_ONLINE; }}
                          />
                          <figcaption>Kondisi Awal (Before)</figcaption>
                        </figure>
                        <figure>
                          <img
                            src={r.fotosProgress?.[0] || r.fotosAfter?.[0] || r.fotosBefore?.[0]}
                            alt="On Progress"
                            onError={(e) => { e.target.onerror = null; e.target.src = SAMPLE_IMG_PROGRESS_ONLINE; }}
                          />
                          <figcaption>Progres Konstruksi ({r.progresPersen}%)</figcaption>
                        </figure>
                      </div>
                      <div className="pcc-meta">
                        <div><small>Pelaksana:</small> <b>{r.kontraktor || 'Tim Swakelola P2SP Sekolah'}</b></div>
                        <div><small>Anggaran:</small> <b>{r.anggaranSerapan || 'Termin I Terverifikasi'}</b></div>
                        <p>{r.catatanDinas}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </motion.div>
      )}

      {/* ==================== TAB 3: SELESAI REVITALISASI (AFTER) ==================== */}
      {activeTab === 'after' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cycle-content">
          {!canAccessInternal ? (
            <section className="locked-access-card">
              <div className="lac-icon"><Lock size={34} /></div>
              <span className="lac-badge">AKSES TERBATAS · DIKHUSUSKAN UNTUK PERAN 1 &amp; PERAN 2</span>
              <h2>Menu Pengesahan Selesai Revitalisasi (After) Terkunci</h2>
              <p>
                Anda saat ini login sebagai <b>Peran 3 (Masyarakat &amp; Warga Sekolah / Publik)</b>. Modul <b>Dokumentasi Akhir Pasca-Revitalisasi (After), Evaluasi Kelayakan Inklusif, dan Berita Acara Serah Terima (BAST)</b> hanya dapat diakses dan diisi oleh:
              </p>
              <div className="lac-roles-grid">
                <div className="lac-role-box">
                  <Landmark size={20} />
                  <div>
                    <b>Peran 1 · Analis Pusat (Kemendikdasmen / Pusdatin)</b>
                    <small>Otoritas validasi akhir capaian nasional &amp; pemutakhiran status kondisi Dapodik.</small>
                  </div>
                </div>
                <div className="lac-role-box">
                  <Building2 size={20} />
                  <div>
                    <b>Peran 2 · Dinas Terkait Daerah &amp; Pihak Sekolah</b>
                    <small>Pejabat Pembuat Komitmen (PPK) Dinas, Kepala Sekolah, Guru &amp; Tim Pemeriksa Hasil Pekerjaan.</small>
                  </div>
                </div>
              </div>
              <div className="lac-actions">
                <button type="button" className="btn primary" onClick={() => setActiveTab('before')}>
                  Kembali ke Menu Laporan Awal (Before)
                </button>
                {onSwitchRole && (
                  <>
                    <button type="button" className="btn secondary" onClick={() => onSwitchRole('daerah')}>
                      Simulasi Masuk Peran 2 (Dinas / Sekolah)
                    </button>
                    <button type="button" className="btn ghost" onClick={() => onSwitchRole('pusat')}>
                      Simulasi Masuk Peran 1 (Analis Pusat)
                    </button>
                  </>
                )}
              </div>
            </section>
          ) : (
            <div className="cycle-content">
              <div className="report-form-grid">
                <section className="card">
                  <h3><Award size={18} /> Pengesahan Selesai Revitalisasi (After) &amp; BAST</h3>
                  <p className="muted">Unggah dokumentasi kondisi akhir bangunan kelas yang telah selesai direvitalisasi beserta audit fasilitas inklusifnya</p>

                  <form className="rf-stack" onSubmit={handleFinalizeAfter}>
                    <label className="rf-field">
                      <span>Pilih Satuan Pendidikan yang Selesai Direvitalisasi</span>
                      <select value={afterReportId} onChange={e => setAfterReportId(e.target.value)}>
                        {reports.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.id} · {r.sekolah} ({r.kabkota} — Status: {r.progresPersen}%)
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="rf-row2">
                      <label className="rf-field">
                        <span>Nomor Berita Acara Serah Terima (BAST)</span>
                        <input type="text" value={afterBast} onChange={e => setAfterBast(e.target.value)} />
                      </label>
                      <label className="rf-field">
                        <span>Skor Audit Kelayakan &amp; Inklusivitas (0–100)</span>
                        <input type="number" min={70} max={100} value={afterSkor} onChange={e => setAfterSkor(e.target.value)} />
                      </label>
                    </div>

                    <label className="rf-field">
                      <span>Evaluasi Kondisi Pasca-Revitalisasi (After)</span>
                      <textarea
                        rows={3}
                        value={afterCatatan}
                        onChange={e => setAfterCatatan(e.target.value)}
                        placeholder="Contoh: Seluruh ruang kelas kini kokoh dengan struktur tahan gempa, dilengkapi ramp kursi roda kemiringan 7 derajat, toilet disabilitas, serta pencahayaan alami yang sangat baik..."
                      />
                    </label>

                    {afterSuccess && <div className="ok-box"><CheckCircle2 size={16} /> {afterSuccess}</div>}

                    <button type="submit" className="btn primary">
                      <CheckCircle2 size={16} /> Sahkan Selesai Revitalisasi (100% After)
                    </button>
                  </form>
                </section>

                <section className="card">
                  <h3><Sparkles size={18} /> Dokumentasi Transformasi Before vs After Revitalisasi</h3>
                  <p className="muted">Bukti nyata restorasi pendidikan yang aman, layak, dan inklusif bagi seluruh peserta didik</p>

                  <div className="after-showcase-list">
                    {reports.filter(r => r.statusTahap === 'after').map(r => (
                      <div key={r.id} className="after-card">
                        <div className="ac-header">
                          <div>
                            <span className="ac-bast">{r.nomorBast || 'BAST TERVERIFIKASI'}</span>
                            <h4>{r.sekolah} · {r.kabkota}</h4>
                          </div>
                          <div className="ac-score">
                            <small>Skor Kelayakan</small>
                            <b>{r.skorKelayakanAfter || 98}/100</b>
                          </div>
                        </div>

                        <div className="ac-comparison">
                          <figure className="ac-fig before">
                            <img
                              src={r.fotosBefore?.[0]}
                              alt="Before"
                              onError={(e) => { e.target.onerror = null; e.target.src = SAMPLE_IMG_BEFORE_ONLINE; }}
                            />
                            <figcaption>SEBELUM (BEFORE): {r.tingkat}</figcaption>
                          </figure>
                          <figure className="ac-fig after">
                            <img
                              src={r.fotosAfter?.[0] || r.fotosBefore?.[0]}
                              alt="After"
                              onError={(e) => { e.target.onerror = null; e.target.src = SAMPLE_IMG_AFTER_ONLINE; }}
                            />
                            <figcaption>SESUDAH (AFTER): 100% Layak &amp; Inklusif</figcaption>
                          </figure>
                        </div>

                        <div className="ac-features">
                          {(r.fiturInklusiAfter || []).map(f => (
                            <span key={f} className="ac-feat-pill"><Check size={13} /> {f}</span>
                          ))}
                        </div>
                        <p className="ac-note">{r.catatanDinas}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ==================== MODAL VERIFIKASI AKUN (ANTI-BOT & ANTI-SPAM) ==================== */}
      <AnimatePresence>
        {showVerifyModal && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-card" initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}>
              <button type="button" className="icon close" onClick={() => setShowVerifyModal(false)}><X size={16} /></button>
              <div className="mc-head">
                <div className="mc-ic"><ShieldCheck size={24} /></div>
                <div>
                  <span className="eyebrow">PROTEKSI KEAMANAN PORTAL PELAPORAN PRISMA</span>
                  <h3>Verifikasi Akun Pelapor (Anti-Bot &amp; Anti-Spam)</h3>
                  <p className="muted">Pastikan identitas Anda terverifikasi agar laporan kerusakan sekolah dapat diproses resmi oleh Pusdatin &amp; Dinas Pendidikan.</p>
                </div>
              </div>

              <form className="rf-stack" onSubmit={handleVerifySubmit}>
                <div className="rf-row2">
                  <label className="rf-field">
                    <span>Nama Lengkap Pelapor *</span>
                    <input type="text" value={verName} onChange={e => setVerName(e.target.value)} placeholder="Mis. Budi Santoso, S.Pd." />
                  </label>
                  <label className="rf-field">
                    <span>Kategori Unsur Pelapor *</span>
                    <select value={verUnsur} onChange={e => setVerUnsur(e.target.value)}>
                      <option>Siswa / Murid</option>
                      <option>Orang Tua / Wali Murid</option>
                      <option>Komite Sekolah / Masyarakat Umum</option>
                      <option>Pihak Sekolah (Kepala Sekolah / Guru / Admin)</option>
                      <option>Dinas Pendidikan Daerah / Bappeda</option>
                      <option>Analis Pusat (Kemendikdasmen / Pusdatin)</option>
                    </select>
                  </label>
                </div>

                <div className="rf-row2">
                  <label className="rf-field">
                    <span>Alamat Email Aktif (Gmail / Institusi) *</span>
                    <input type="email" value={verEmail} onChange={e => setVerEmail(e.target.value)} placeholder="nama.pelapor@gmail.com" />
                  </label>
                  <label className="rf-field">
                    <span>Nomor HP / WhatsApp Aktif *</span>
                    <input type="tel" value={verHp} onChange={e => setVerHp(e.target.value)} placeholder="0812-xxxx-xxxx" />
                  </label>
                </div>

                <div className="antibot-box">
                  <div className="ab-col">
                    <span>1. Verifikasi Anti-Bot: Berapa hasil <b>{captchaA} + {captchaB}</b>?</span>
                    <input
                      type="number"
                      value={captchaAns}
                      onChange={e => setCaptchaAns(e.target.value)}
                      placeholder="Ketik hasil penjumlahan"
                    />
                  </div>
                  <div className="ab-col">
                    <span>2. Kode OTP Verifikasi Sesi: <code>{otpGenerated}</code></span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value)}
                        placeholder={`Ketik ${otpGenerated}`}
                      />
                      <button type="button" className="btn ghost sm" onClick={() => { setCaptchaAns(String(captchaA + captchaB)); setOtpInput(otpGenerated); setVerAgree(true) }}>
                        Isi Otomatis
                      </button>
                    </div>
                  </div>
                </div>

                <label className="checkbox-row">
                  <input type="checkbox" checked={verAgree} onChange={e => setVerAgree(e.target.checked)} />
                  <span>Saya menyatakan bahwa identitas ini benar (bukan bot/spam) dan laporan kondisi sekolah yang diajukan dapat dipertanggungjawabkan.</span>
                </label>

                {verError && <div className="err-box">{verError}</div>}

                <div className="mc-actions">
                  <button type="button" className="btn ghost" onClick={handleInstantDemoVerify}>
                    <Sparkles size={15} /> Verifikasi Instan (1-Klik Demo)
                  </button>
                  <button type="submit" className="btn primary" disabled={verLoading}>
                    <ShieldCheck size={16} /> {verLoading ? 'Memverifikasi...' : 'Selesaikan Verifikasi Akun'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL KAMERA LANGSUNG (FOTO / VIDEO GEOTAGGING) ==================== */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-card camera-modal" initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.94 }}>
              <button type="button" className="icon close" onClick={closeCameraModal}><X size={16} /></button>
              <h3>
                {cameraMode === 'video' ? <Video size={18} /> : <Camera size={18} />}
                <span>Kamera Geotagging PRISMA ({cameraMode === 'video' ? 'Mode Video' : 'Mode Foto'})</span>
              </h3>
              <p className="muted">Koordinat lokasi dan waktu pengambilan otomatis disematkan (watermarked) pada hasil tangkapan</p>

              <div className="camera-viewfinder">
                <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                <div className="camera-hud">
                  <span className="hud-tag">● REC GEOTAG ACTIVE</span>
                  <span className="hud-coords">GPS: {lat.toFixed(4)}° LS, {lng.toFixed(4)}° BT (±{akurasi}m)</span>
                </div>
                {cameraStreamError && (
                  <div className="camera-fallback-msg">
                    <Camera size={28} />
                    <p>{cameraStreamError}</p>
                  </div>
                )}
              </div>

              <div className="mc-actions">
                <button type="button" className="btn ghost" onClick={closeCameraModal}>Batal</button>
                <button type="button" className="btn primary" onClick={captureFromCamera}>
                  <Camera size={16} /> {cameraMode === 'video' ? 'Simpan Cuplikan Video Ber-Geotag' : 'Ambil Foto Ber-Geotag Sekarang'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL POP-UP BUKTI PENGIRIMAN LAPORAN RESMI ==================== */}
      <AnimatePresence>
        {submittedTicket && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-card receipt-modal" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <button type="button" className="icon close" onClick={() => setSubmittedTicket(null)}><X size={16} /></button>

              <div className="receipt-header">
                <img src={LOGO_URL} alt="PRISMA" className="receipt-logo" />
                <div className="receipt-check"><CheckCircle2 size={36} /></div>
                <span className="receipt-tag">LAPORAN BERHASIL TERKIRIM &amp; TEREGISTRASI</span>
                <h2>Bukti Tanda Terima Pelaporan Revitalisasi</h2>
                <p>Laporan Anda telah diverifikasi dan diteruskan secara elektronik ke instansi berwenang.</p>
              </div>

              <div className="receipt-body">
                <div className="receipt-ticket-no">
                  <span>NOMOR TIKET PELACAKAN</span>
                  <b>{submittedTicket.id}</b>
                </div>

                <dl className="receipt-dl">
                  <dt>Satuan Pendidikan</dt>
                  <dd>{submittedTicket.sekolah} ({submittedTicket.jenjang} · NPSN {submittedTicket.npsn})</dd>
                  <dt>Wilayah &amp; Skor PRISMA</dt>
                  <dd>{submittedTicket.kabkota}, {submittedTicket.provinsi} (Skor {fmt(submittedTicket.skorPrisma, 1)} · Peringkat #{submittedTicket.rankPrisma}/514)</dd>
                  <dt>Koordinat Geotagging</dt>
                  <dd>{submittedTicket.lat.toFixed(5)}°, {submittedTicket.lng.toFixed(5)}° (Akurasi ±{submittedTicket.akurasi}m)</dd>
                  <dt>Kondisi Dilaporkan</dt>
                  <dd>{Array.isArray(submittedTicket.fasilitas) ? submittedTicket.fasilitas.join(', ') : submittedTicket.fasilitas} — <b>{submittedTicket.tingkat}</b> ({submittedTicket.ruangTerdampak} ruang)</dd>
                  <dt>Pelapor Terverifikasi</dt>
                  <dd>{submittedTicket.pelapor} ({submittedTicket.email})</dd>
                  <dt>Diteruskan Kepada</dt>
                  <dd className="highlight-dest">
                    1. Pusdatin &amp; Ditjen PAUD Dikdasmen (Kemendikdasmen RI)<br />
                    2. Dinas Pendidikan {submittedTicket.kabkota} / Provinsi {submittedTicket.provinsi}<br />
                    3. Bappeda Daerah &amp; Tim Verifikasi Lapangan
                  </dd>
                </dl>
              </div>

              <div className="mc-actions">
                <button type="button" className="btn ghost" onClick={() => window.print()}>
                  Cetak / Simpan Bukti PDF
                </button>
                <button type="button" className="btn primary" onClick={() => setSubmittedTicket(null)}>
                  Selesai &amp; Pantau Status Laporan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
