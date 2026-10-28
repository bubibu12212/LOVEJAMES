// ===================== PROFIL =====================
// Ganti dengan data kamu. Kontak yang link-nya '#' tidak akan ditampilkan.
export const profile = {
  name: 'Salsa Ica Indriani',
  role: 'Developer & Creative Technologist',
  tagline: 'Membangun pengalaman digital yang interaktif, rapi, dan berguna.',
  about: [
    'Tulis perkenalan singkat tentang dirimu di sini: siapa kamu, apa yang kamu kerjakan, dan apa yang membuatmu bersemangat.',
    'Paragraf kedua bisa berisi fokus keahlian, nilai kerja, atau hal yang sedang kamu pelajari.',
  ],
  skills: ['React', 'Three.js', 'Node.js', 'Python', 'UI/UX'],
  contacts: [
    { label: 'Email', href: '#' },        // contoh: 'mailto:nama@email.com'
    { label: 'GitHub', href: '#' },       // contoh: 'https://github.com/username'
    { label: 'LinkedIn', href: '#' },
    { label: 'Instagram', href: '#' },
  ],
}

// ===================== GEDUNG PROJECT DI KOTA =====================
// side: -1 = kiri boulevard, 1 = kanan. z: posisi sepanjang jalan (0 = gerbang, makin minus makin jauh).
// Jaga z antara -6 sampai -36, dan jangan taruh dua gedung di sisi yang sama kurang dari 12 jarak z-nya.
// Hindari z sekitar -21 (itu jalan raya yang memotong).
// floors = jumlah lantai, accent = warna lampu LED gedung, link = tombol "Buka" (kosongkan kalau tidak ada)
export const stations = [
  { id: 'p1', type: 'project', title: 'Project 1',
    desc: 'Deskripsi singkat project kamu: masalah apa yang diselesaikan, dan bagaimana caranya.',
    tech: ['React', 'Node.js'], link: '',
    side: -1, z: -9, floors: 5, accent: '#ffb259' },
  { id: 'e1', type: 'experience', title: 'Pengalaman 1',
    desc: 'Posisi, tempat, dan tahun. Tulis 1–2 pencapaian utama di sini.',
    tech: [], link: '',
    side: 1, z: -11, floors: 7, accent: '#5fd3f3' },
  { id: 'p2', type: 'project', title: 'Project 2',
    desc: 'Deskripsi project kedua: tujuan, peranmu, dan hasilnya.',
    tech: ['Python', 'LLM'], link: '',
    side: -1, z: -30, floors: 6, accent: '#ff7a8a' },
  { id: 'e2', type: 'experience', title: 'Pengalaman 2',
    desc: 'Posisi, tempat, dan tahun. Tulis 1–2 pencapaian utama di sini.',
    tech: [], link: '',
    side: 1, z: -32, floors: 4, accent: '#9b8cff' },
]

// ===================== GALERI KEGIATAN =====================
// Taruh foto di folder public/gallery/, lalu isi src seperti '/gallery/foto1.jpg'.
// Kalau src kosong, akan muncul gambar contoh. Maksimal 11 foto.
export const gallery = [
  { src: '', caption: 'Kegiatan 1 — tulis keterangan foto di sini' },
  { src: '', caption: 'Kegiatan 2' },
  { src: '', caption: 'Kegiatan 3' },
  { src: '', caption: 'Kegiatan 4' },
  { src: '', caption: 'Kegiatan 5' },
  { src: '', caption: 'Kegiatan 6' },
  { src: '', caption: 'Kegiatan 7' },
  { src: '', caption: 'Kegiatan 8' },
]
