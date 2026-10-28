// ===================== PROFIL =====================
// Ganti dengan data kamu. Kontak yang link-nya '#' tidak akan ditampilkan.
export const profile = {
  name: 'Salsa Ica Indriani',
  short: 'SALSA',
  role: 'Informatics Graduate — Software Developer',
  tagline: "Hi, I'm Salsa — a recent Informatics graduate passionate about software development, technology, and creating innovative digital solutions.",
  aboutTitle: 'Building digital things that matter',
  about: [
    "I'm Salsa, a recent Informatics graduate passionate about software development and technology. I love turning ideas into clean, useful digital products — from the logic behind the scenes to the interface people actually touch.",
  ],
  facts: [
    { label: 'Education', value: 'S1 Informatics' },
    { label: 'Focus', value: 'Software Development' },
    { label: 'Based in', value: 'Indonesia' },
  ],
  skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Figma', 'Three.js'],
  // Foto untuk bagian About: taruh file di public/photo.jpg (kosongkan '' kalau belum ada)
  photo: '/photo.jpg',
  // true = tampilkan animasi Three.js buatanmu (src/components/About3D.jsx) di bagian About, menggantikan foto
  useAbout3D: false,
  contacts: [
    { label: 'Email', text: 'your.email@gmail.com', href: '#' },       // contoh: 'mailto:nama@email.com'
    { label: 'LinkedIn', text: 'linkedin.com/in/username', href: '#' },
    { label: 'GitHub', text: 'github.com/username', href: '#' },
  ],
}

// ===================== PROJECT (kartu + gedung di kota 3D) =====================
// category = label kecil di kartu, building = gaya ilustrasi gedung di kartu:
//   'glass' | 'apartment' | 'villa' | 'shop' | 'green' | 'wooden'
// side: -1 = kiri boulevard, 1 = kanan. z = posisi sepanjang jalan di kota 3D.
// Posisi yang tersedia: kiri z -9, -30, -41 dan kanan z -11, -30, -41 (z sekitar -21 itu jalan raya).
// floors = jumlah lantai gedung 3D, link = tombol "View project" (kosongkan kalau belum ada)
export const stations = [
  { id: 'p1', type: 'project', category: 'Web App', building: 'glass', title: 'Web App Project',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    tech: ['React', 'Node.js'], link: '', side: -1, z: -9, floors: 7 },
  { id: 'p2', type: 'project', category: 'Mobile App', building: 'apartment', title: 'Mobile App Project',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    tech: ['Flutter', 'Firebase'], link: '', side: 1, z: -11, floors: 6 },
  { id: 'p3', type: 'project', category: 'UI/UX Design', building: 'villa', title: 'UI/UX Case Study',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    tech: ['Figma'], link: '', side: -1, z: -30, floors: 4 },
  { id: 'p4', type: 'project', category: 'Database', building: 'shop', title: 'Database System',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    tech: ['SQL', 'PostgreSQL'], link: '', side: 1, z: -30, floors: 5 },
  { id: 'p5', type: 'project', category: 'Machine Learning', building: 'green', title: 'ML / Data Project',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    tech: ['Python', 'Pandas'], link: '', side: -1, z: -41, floors: 8 },
  { id: 'p6', type: 'project', category: 'Final Thesis', building: 'wooden', title: 'Thesis Project',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    tech: ['Research'], link: '', side: 1, z: -41, floors: 3 },
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
