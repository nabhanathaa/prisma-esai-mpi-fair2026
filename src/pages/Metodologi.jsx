import React from 'react'
import { Database, ShieldAlert, Workflow, ExternalLink, Users } from 'lucide-react'

const SUMBER = [
  ['Jumlah Ruang Kelas Menurut Kondisi 2025 (SD, SMP, SMA, SMK)', 'Kemendikdasmen, Portal Data (Dapodik)', 'https://data.kemendikdasmen.go.id/dataset/dataset-statistik', 'Kab/kota'],
  ['Indeks Pemerataan Guru 2025', 'Kemendikdasmen, Dataset Prioritas', 'https://data.kemendikdasmen.go.id/dataset/prioritas', 'Kab/kota'],
  ['Persentase penduduk miskin (P0) 2025', 'Badan Pusat Statistik', 'https://www.bps.go.id', 'Kab/kota'],
  ['Rata-rata lama sekolah (metode baru) 2025', 'Badan Pusat Statistik', 'https://www.bps.go.id', 'Kab/kota'],
  ['PMK 97/2025 tentang Peta Kapasitas Fiskal Daerah', 'Kementerian Keuangan', 'https://jdih.kemenkeu.go.id/dok/pmk-97-tahun-2025', 'Kab/kota (508 + proksi 6 wilayah DKI)'],
  ['Revitalisasi Satuan Pendidikan 2025', 'Pusdatin Kemendikdasmen', 'https://referensi.data.kemendikdasmen.go.id/program_pembangunan/program/revit', 'Nasional'],
  ['Dashboard Sekolah Terdampak Bencana', 'Kemendikdasmen', 'https://spab.kemendikdasmen.go.id/web/dashboard/', 'Konteks'],
  ['Neraca Pendidikan Daerah 2025', 'Kemendikdasmen', 'https://npd.kemendikdasmen.go.id/', 'Konteks'],
]

const LANGKAH = [
  ['Data', 'Pusdatin memadukan Dapodik, BPS, dan PMK setiap tahun dalam satu basis data.'],
  ['Skoring', 'Sistem menghitung IPRT dan menerbitkan daftar prioritas secara otomatis.'],
  ['Verifikasi', 'Dinas memverifikasi 10% sampel sekolah prioritas bersama perguruan tinggi dan mahasiswa KKN.'],
  ['Penetapan', 'Direktorat teknis menetapkan sasaran dan porsi dua jalur dalam petunjuk teknis.'],
  ['Pengawasan', 'Dasbor publik menampilkan progres pembangunan agar masyarakat dan komite sekolah dapat mengawasi.'],
]

export default function Metodologi() {
  return (
    <div className="page">
      <header className="ph"><div><h1>Metodologi &amp; Data</h1><p>Rumus indeks, sumber data resmi, alur penerapan, dan keterbatasan.</p></div></header>

      <section className="card">
        <h3><Workflow size={18} /> Rumus IPRT</h3>
        <div className="formula big">IPRT = 100 × (0,40·K + 0,30·S + 0,30·F)</div>
        <div className="grid3 tight">
          <div className="comp"><i style={{ background: '#E5484D' }} /><b>K · Kerusakan</b><p>Peringkat persentil % ruang kelas rusak sedang + berat (SD–SMK).</p></div>
          <div className="comp"><i style={{ background: '#E08A35' }} /><b>S · Kerentanan sosial</b><p>Rerata peringkat persentil P0 dan kebalikan rata-rata lama sekolah.</p></div>
          <div className="comp"><i style={{ background: '#38AFC8' }} /><b>F · Kelemahan fiskal</b><p>Peringkat persentil kebalikan rasio kapasitas fiskal daerah.</p></div>
        </div>
      </section>

      <section className="card">
        <h3><Database size={18} /> Sumber data (semua data resmi, tahun 2025)</h3>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead><tr><th>Dataset</th><th>Penerbit</th><th>Tingkat</th><th></th></tr></thead>
            <tbody>{SUMBER.map(s => <tr key={s[0]}><td>{s[0]}</td><td>{s[1]}</td><td>{s[3]}</td><td><a href={s[2]} target="_blank" rel="noreferrer" className="icon" title="Buka sumber"><ExternalLink size={14} /></a></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <div className="grid2">
        <section className="card">
          <h3><Users size={18} /> Alur penerapan</h3>
          <ol className="steps">{LANGKAH.map(([a, b], i) => <li key={a}><span>{i + 1}</span><div><b>{a}</b><p>{b}</p></div></li>)}</ol>
        </section>
        <section className="card">
          <h3><ShieldAlert size={18} /> Keterbatasan</h3>
          <ul className="bul">
            <li>Data alokasi revitalisasi per kabupaten/kota belum tersedia secara terbuka, sehingga ketepatan sasaran 2025 belum dapat dinilai langsung.</li>
            <li>Status kondisi ruang kelas di Dapodik merupakan isian sekolah dan perlu diverifikasi lapangan.</li>
            <li>Enam wilayah administrasi DKI Jakarta tidak tercantum di PMK 97/2025 sehingga memakai rasio provinsi (0,271) sebagai proksi.</li>
            <li>Hasil regresi bersifat asosiatif, bukan kausal.</li>
            <li>Lapisan risiko iklim (Google Earth Engine) disiapkan sebagai tahap pengembangan berikutnya.</li>
            <li>Login aplikasi ini adalah demo purwarupa tanpa server; versi produksi memerlukan autentikasi resmi.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
