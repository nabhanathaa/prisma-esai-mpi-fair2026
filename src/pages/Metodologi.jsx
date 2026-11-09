import React from 'react'
import {
  Database, ShieldAlert, Workflow, ExternalLink, Users,
  Layers, Compass, Camera, Landmark, Award, GraduationCap
} from 'lucide-react'
import { LOGO_URL } from '../lib/data'

const SUMBER = [
  ['Jumlah Ruang Kelas Menurut Kondisi 2025 (SD, SMP, SMA, SMK)', 'Kemendikdasmen · Portal Data Dapodik', 'https://data.kemendikdasmen.go.id/dataset/dataset-statistik', '514 Kab/Kota', '2,03 juta ruang kelas (Baik, Rusak Ringan, Sedang, Berat)'],
  ['Indeks Pemerataan Guru (IPG) 2025', 'Kemendikdasmen · Dataset Prioritas', 'https://data.kemendikdasmen.go.id/dataset/prioritas', '514 Kab/Kota', 'Distribusi guru antarjenjang SD, SMP, SMA, SMK'],
  ['Persentase Penduduk Miskin (P0) 2025', 'Badan Pusat Statistik (BPS)', 'https://www.bps.go.id', '514 Kab/Kota', 'Tingkat kemiskinan makro daerah (%)'],
  ['Rata-rata Lama Sekolah (RLS Metode Baru) 2025', 'Badan Pusat Statistik (BPS)', 'https://www.bps.go.id', '514 Kab/Kota', 'Capaian tahun bersekolah penduduk usia ≥ 25 tahun'],
  ['PMK Nomor 97 Tahun 2025 tentang Peta Kapasitas Fiskal Daerah', 'Kementerian Keuangan RI', 'https://jdih.kemenkeu.go.id/dok/pmk-97-tahun-2025', '508 Kab/Kota + 6 DKI', 'Rasio dan kategori kapasitas fiskal daerah'],
  ['Program Revitalisasi Satuan Pendidikan 2025', 'Pusdatin Kemendikdasmen', 'https://referensi.data.kemendikdasmen.go.id/program_pembangunan/program/revit', 'Nasional (34 Kategori)', '16.167 sekolah penerima bantuan revitalisasi'],
  ['Dashboard Satuan Pendidikan Aman Bencana (SPAB)', 'Kemendikdasmen', 'https://spab.kemendikdasmen.go.id/web/dashboard/', 'Konteks Spasial', 'Kerentanan bencana pada satuan pendidikan'],
  ['Neraca Pendidikan Daerah (NPD) 2025', 'Kemendikdasmen', 'https://npd.kemendikdasmen.go.id/', 'Konteks Anggaran', 'Proporsi belanja fungsi pendidikan APBD'],
]

const LANGKAH = [
  ['Integrasi Satu Data Spasial', 'Pusdatin Kemendikdasmen mengintegrasikan data kondisi ruang kelas Dapodik, indikator sosial BPS (P0, RLS), dan rasio kapasitas fiskal Kemenkeu (PMK 97/2025) bagi 514 kabupaten/kota.'],
  ['Pemodelan & Skoring PRISMA', 'Sistem menghitung autokorelasi spasial (LISA) dan skor komposit PRISMA untuk menetapkan daftar prioritas nasional melalui skema Alokasi Dua Jalur (Jalur Kebutuhan Absolut & Jalur Afirmasi Spasial).'],
  ['Pelaporan Partisipatif Ber-Geotagging (Before)', 'Masyarakat, siswa, orang tua, dan pihak sekolah mengajukan laporan kerusakan riil dilengkapi bukti foto/video dan titik koordinat GPS melalui akun terverifikasi anti-bot/spam.'],
  ['Eksekusi & Pemantauan Konstruksi (On-Progress)', 'Dinas Pendidikan Daerah, Bappeda, dan P2SP Sekolah memperbarui foto progres pembangunan fisik serta serapan anggaran secara berkala yang diawasi oleh Analis Pusat.'],
  ['Audit Kelayakan & Inklusivitas Akhir (After)', 'Setelah revitalisasi selesai 100%, diterbitkan Berita Acara Serah Terima (BAST) beserta dokumentasi Before–After yang menjamin tersedianya fasilitas ramah disabilitas dan ruang belajar aman.'],
]

const TIM_PENYUSUN = [
  {
    nama: 'Nabhan Athallah',
    peran: 'Ketua Tim · Komputasi Spasial & Arsitektur Sistem PRISMA',
    kampus: 'Politeknik Statistika STIS',
  },
  {
    nama: 'Henny Syahrani',
    peran: 'Anggota · Pemodelan Ekonometrika & Analisis Kebijakan Pendidikan',
    kampus: 'Politeknik Statistika STIS',
  },
  {
    nama: 'Reva Auliya Q. A.',
    peran: 'Anggota · Riset Data Inklusi Sosial, Metodologi & Evaluasi Tata Kelola',
    kampus: 'Politeknik Statistika STIS',
  },
]

export default function Metodologi() {
  return (
    <div className="page">
      <header className="ph">
        <div>
          <span className="eyebrow">KERANGKA METODOLOGIS, SUMBER DATA RESMI &amp; ATRIBUSI KARYA</span>
          <h1>Metodologi Indeks Spasial &amp; Sumber Data Resmi</h1>
          <p>
            Formulasi matematis indeks PRISMA, arsitektur integrasi Top-Down &amp; Bottom-Up, sumber data resmi 2025, pengendalian mutu, serta profil tim penyusun.
          </p>
        </div>
      </header>

      {/* Kartu Atribusi Tim Penyusun & Lomba Esai MPI FAIR 2026 */}
      <section className="card team-attribution-card">
        <div className="tac-top">
          <div className="tac-brand">
            <img src={LOGO_URL} alt="Logo PRISMA" className="tac-logo" />
            <div>
              <span className="eyebrow">ATRIBUSI PENGEMBANGAN SOLUSI INOVASI · MPI FAIR 2026</span>
              <h3>Disusun oleh Tim PRISMA — Politeknik Statistika STIS</h3>
              <p className="muted">
                Aplikasi <b>PRISMA (Prioritas Revitalisasi Infrastruktur Sekolah melalui Model Analisis Spasial)</b> ini dirancang dan dikembangkan secara khusus sebagai manifestasi solusi kebijakan berbasis bukti (<em>evidence-based policy</em>) pada <b>Lomba Esai Nasional MPI FAIR 2026</b> dengan tema <em>&ldquo;Restorasi Pendidikan: Manifestasi Pemikiran Kreatif Mahasiswa Menuju Pendidikan Inklusif dan Berkelanjutan&rdquo;</em> (Subtema: <b>Inklusi Sosial dan Kesetaraan dalam Pendidikan</b>).
              </p>
            </div>
          </div>
          <div className="tac-inst-badge">
            <GraduationCap size={18} />
            <div>
              <b>Politeknik Statistika STIS</b>
              <small>Tim PRISMA STIS · 2026</small>
            </div>
          </div>
        </div>

        <div className="tac-members-grid">
          {TIM_PENYUSUN.map((m, idx) => (
            <div key={m.nama} className="tac-member">
              <div className="tac-avatar">{idx + 1}</div>
              <div>
                <b>{m.nama}</b>
                <span>{m.peran}</span>
                <small><Award size={12} /> {m.kampus}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rumus & Komponen Indeks */}
      <section className="card">
        <h3><Workflow size={18} /> Formulasi Matematis Indeks Komposit PRISMA</h3>
        <p className="muted">Setiap variabel ditransformasikan ke dalam peringkat persentil empiris [0, 1] agar kebal terhadap pencilan ekstrem antarwilayah</p>
        <div className="formula big">PRISMA = 100 × (0,40 · K + 0,30 · S + 0,30 · F)</div>
        <div className="grid3 tight">
          <div className="comp">
            <i className="comp-bar" style={{ background: '#EF4444' }} />
            <b>K · Tingkat Kerusakan Fisik (Bobot 40%)</b>
            <p>Peringkat persentil proporsi ruang kelas rusak sedang dan rusak berat gabungan jenjang SD, SMP, SMA, dan SMK di kabupaten/kota tersebut.</p>
          </div>
          <div className="comp">
            <i className="comp-bar" style={{ background: '#F59E0B' }} />
            <b>S · Kerentanan Sosial-Pendidikan (Bobot 30%)</b>
            <p>Rata-rata peringkat persentil persentase penduduk miskin (P0) dan persentil kebalikan Rata-rata Lama Sekolah (−RLS) untuk menangkap deprivasi sosial.</p>
          </div>
          <div className="comp">
            <i className="comp-bar" style={{ background: '#0284C7' }} />
            <b>F · Kelemahan Kapasitas Fiskal (Bobot 30%)</b>
            <p>Peringkat persentil kebalikan Rasio Kapasitas Fiskal Daerah (PMK 97/2025) agar daerah berfiskal rendah mendapat afirmasi anggaran pusat.</p>
          </div>
        </div>
      </section>

      {/* Sinergi 3 Peran & Siklus Before-Progress-After */}
      <section className="card">
        <h3><Compass size={18} /> Arsitektur Tata Kelola Berjenjang 3 Peran (Top-Down × Bottom-Up)</h3>
        <p className="muted">Menggabungkan ketajaman ekonometrika spasial dengan partisipasi publik yang terverifikasi</p>
        <div className="grid3 tight">
          <div className="comp">
            <div className="comp-role-head">
              <Landmark size={17} style={{ color: 'var(--accent)', flex: 'none' }} />
              <b>Peran 1 · Analis Pusat (Kemendikdasmen / Pusdatin)</b>
            </div>
            <p>Mengelola model spasial 514 kab/kota, menyimulasikan kuota Alokasi Dua Jalur, mengaudit kode analisis R, dan memvalidasi capaian nasional.</p>
          </div>
          <div className="comp">
            <div className="comp-role-head">
              <Layers size={17} style={{ color: 'var(--warm)', flex: 'none' }} />
              <b>Peran 2 · Dinas Daerah &amp; Satuan Pendidikan</b>
            </div>
            <p>Memverifikasi laporan lapangan, memperbarui foto progres pengerjaan konstruksi (<em>On-Progress</em>), dan mengunggah dokumen penyelesaian BAST (<em>After</em>).</p>
          </div>
          <div className="comp">
            <div className="comp-role-head">
              <Camera size={17} style={{ color: '#10B981', flex: 'none' }} />
              <b>Peran 3 · Masyarakat &amp; Warga Sekolah</b>
            </div>
            <p>Memantau peta kerentanan secara terbuka dan mengajukan laporan kerusakan sekolah dilengkapi foto/video ber-geotagging GPS melalui akun terverifikasi.</p>
          </div>
        </div>
      </section>

      {/* Tabel Sumber Data Resmi */}
      <section className="card">
        <h3><Database size={18} /> Repositori Sumber Data Resmi Nasional (Tahun 2025)</h3>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Dataset Resmi</th>
                <th>Instansi Penerbit</th>
                <th>Cakupan</th>
                <th>Indikator Utama</th>
                <th>Tautan</th>
              </tr>
            </thead>
            <tbody>
              {SUMBER.map(s => (
                <tr key={s[0]} className="sig">
                  <td><b>{s[0]}</b></td>
                  <td>{s[1]}</td>
                  <td><span className="badge">{s[3]}</span></td>
                  <td>{s[4]}</td>
                  <td>
                    <a href={s[2]} target="_blank" rel="noreferrer" className="icon" title="Buka sumber resmi">
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid2">
        <section className="card">
          <h3><Users size={18} /> Alur Implementasi Siklus Penuh (5 Tahap)</h3>
          <ol className="steps">
            {LANGKAH.map(([a, b], i) => (
              <li key={a}>
                <span>{i + 1}</span>
                <div>
                  <b>{a}</b>
                  <p>{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="card">
          <h3><ShieldAlert size={18} /> Catatan Metodologis &amp; Mitigasi Risiko</h3>
          <ul className="bul">
            <li>
              <b>Validasi Silang Dapodik melalui Geotagging:</b> Karena data kondisi Dapodik bersifat pelaporan mandiri (<em>self-reported</em>) oleh operator sekolah, modul <b>Pelaporan Foto &amp; Geotagging Realtime PRISMA</b> berfungsi sebagai instrumen verifikasi lapangan untuk mencegah <em>under-reporting</em> maupun <em>moral hazard</em>.
            </li>
            <li>
              <b>Proksi Kapasitas Fiskal DKI Jakarta:</b> Enam wilayah administrasi DKI Jakarta tidak memiliki APBD otonom di PMK 97/2025 sehingga menggunakan rasio kapasitas fiskal tingkat provinsi secara konsisten.
            </li>
            <li>
              <b>Inferensi Spasial vs Kausalitas:</b> Koefisien pada <em>Spatial Error Model</em> (SEM, λ = 0,562) merepresentasikan asosiasi spasial terkontrol, bukan efek kausal tunggal.
            </li>
            <li>
              <b>Proteksi Verifikasi Akun Anti-Bot:</b> Pengajuan laporan masyarakat dilengkapi verifikasi identitas dan tantangan anti-bot agar antrean verifikasi Dinas Pendidikan bebas dari spam.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
