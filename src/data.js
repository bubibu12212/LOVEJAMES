// ===================== PROFIL =====================
// Ganti dengan data kamu. Kontak yang link-nya '#' tidak akan ditampilkan.
export const profile = {
  name: 'Salsa Ica Indriani',
  role: 'Developer & Problem Solver',
  contacts: [
    { label: 'Email', href: '#' },        // contoh: 'mailto:nama@email.com'
    { label: 'GitHub', href: '#' },       // contoh: 'https://github.com/username'
    { label: 'LinkedIn', href: '#' },
  ],
}

// ===================== CERITA =====================
// Ditampilkan satu per satu sebelum gerbang dibuka.
export const storyIntro = [
  {
    kicker: 'Prolog',
    text: 'Di balik gerbang tua ini ada hutan sunyi. Di sana tersimpan berkas-berkas yang belum pernah dibuka siapa pun.',
  },
  {
    kicker: 'Sang Detektif',
    text: 'Aku detektif yang tidak memburu penjahat. Yang kuburu adalah masalah, lalu kupecahkan satu per satu lewat kode.',
  },
  {
    kicker: 'Misimu',
    text: 'Setiap rumah di hutan menyimpan satu kasus. Datangi semuanya, baca berkasnya, dan temukan siapa aku sebenarnya.',
  },
]

// Muncul sebentar saat mulai menjelajah
export const exploreHint = 'Ikuti jalan setapak. Berdiri di lingkaran bercahaya depan rumah untuk membuka berkas kasus.'

// Muncul setelah semua rumah dikunjungi
export const storyEnding = {
  title: 'Semua kasus terpecahkan.',
  text: 'Sekarang kamu tahu jejak perjalananku. Kasus berikutnya mungkin milikmu. Ayo bekerja sama!',
}

// ===================== RUMAH / KASUS =====================
// pos = [x, 0, z]. Rumah menghadap ke +z (ke arah pemain datang).
// Tambah rumah baru? Cukup tambah entri baru. Jalan setapak otomatis menyambung.
// Jaga supaya x antara -11 sampai 11, dan z antara -4 sampai -34.
// story = satu kalimat narasi di papan, link = tombol "Buka" (kosongkan kalau tidak ada)
export const stations = [
  { id: 'p1', type: 'project', title: 'Project 1',
    story: 'Kasus pertama: semuanya berawal dari rasa penasaran.',
    desc: 'Deskripsi singkat project kamu: masalah apa yang diselesaikan, dan bagaimana caranya.',
    tech: ['React', 'Node.js'], link: '',
    pos: [-6.5, 0, -8], rot: 0.2 },
  { id: 'e1', type: 'experience', title: 'Pengalaman 1',
    story: 'Tempat aku belajar bahwa kerja tim mengalahkan kerja sendiri.',
    desc: 'Posisi, tempat, dan tahun. Tulis 1–2 pencapaian utama di sini.',
    tech: [], link: '',
    pos: [7, 0, -13], rot: -0.25 },
  { id: 'p2', type: 'project', title: 'Project 2',
    story: 'Petunjuknya tersembunyi di dalam data.',
    desc: 'Deskripsi project kedua: tujuan, peranmu, dan hasilnya.',
    tech: ['Python', 'LLM'], link: '',
    pos: [-8, 0, -22], rot: -0.15 },
  { id: 'e2', type: 'experience', title: 'Pengalaman 2',
    story: 'Kasus paling menantang sejauh ini.',
    desc: 'Posisi, tempat, dan tahun. Tulis 1–2 pencapaian utama di sini.',
    tech: [], link: '',
    pos: [6, 0, -28], rot: 0.3 },
]
