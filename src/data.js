// ===================== PROFIL =====================
// Ganti dengan data kamu. Kontak yang link-nya '#' tetap tampil, tapi tidak bisa diklik.
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
    { label: 'Education', value: 'B.Sc. Informatics' },
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

// ===================== CERITA PERJALANAN (di taman) =====================
// Foto-foto yang muncul (pop-up) di sepanjang jalan taman, urut dari depan ke belakang. Maksimal 8.
// Taruh foto di public/gallery/, lalu isi src seperti '/gallery/foto1.jpg'. Kalau kosong, muncul gambar contoh.
export const journey = [
  { year: '2020', title: 'First line of code', text: 'Started my Informatics degree and wrote my very first program.', src: '' },
  { year: '2021', title: 'Campus organization', text: 'Joined a student tech community and learned to work in a team.', src: '' },
  { year: '2021', title: 'First web project', text: 'Built and shipped my first website for a real client.', src: '' },
  { year: '2022', title: 'Hackathon', text: 'Spent 24 hours building a prototype with friends.', src: '' },
  { year: '2023', title: 'Internship', text: 'Worked with a product team on a production app.', src: '' },
  { year: '2023', title: 'Teaching assistant', text: 'Helped juniors learn programming fundamentals.', src: '' },
  { year: '2024', title: 'Final thesis', text: 'Researched and built my final thesis project.', src: '' },
  { year: '2025', title: 'Graduation day', text: 'Graduated — and ready for what comes next.', src: '' },
]

// ===================== PROJECT (gedung yang bisa dimasuki) =====================
// interior = tema ruangan di dalam gedung (juga menentukan bentuk gedungnya):
//   'house' | 'office' | 'apartment' | 'dorm' | 'lab' | 'studio'
// tools = isi bingkai di dinding ruangan (tools yang kamu pakai di project itu)
// details = teks panjang di jendela project (muncul saat layar/TV di dalam ruangan diklik)
// images = foto/screenshot project, contoh ['/projects/web1.jpg'] (taruh di public/projects/)
// link = tombol "Open project" (kosongkan kalau belum ada)
// Urutan = urutan gedung di taman: kiri-kanan bergantian dari depan ke belakang.
export const stations = [
  { id: 'p1', interior: 'house', category: 'Web App', title: 'Web App Project',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    details: 'Describe the project here: what problem it solves, what you built, your role, and what you learned along the way.',
    tech: ['React', 'Node.js', 'MongoDB'], tools: ['VS Code', 'React', 'Node.js', 'Figma', 'Git', 'Postman'], images: [], link: '' },
  { id: 'p2', interior: 'office', category: 'Mobile App', title: 'Mobile App Project',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    details: 'Describe the project here: what problem it solves, what you built, your role, and what you learned along the way.',
    tech: ['Flutter', 'Firebase'], tools: ['Flutter', 'Dart', 'Firebase', 'Android Studio', 'Figma', 'Git'], images: [], link: '' },
  { id: 'p3', interior: 'apartment', category: 'UI/UX Design', title: 'UI/UX Case Study',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    details: 'Describe the project here: what problem it solves, what you built, your role, and what you learned along the way.',
    tech: ['Figma'], tools: ['Figma', 'FigJam', 'Notion', 'Maze'], images: [], link: '' },
  { id: 'p4', interior: 'dorm', category: 'Database', title: 'Database System',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    details: 'Describe the project here: what problem it solves, what you built, your role, and what you learned along the way.',
    tech: ['SQL', 'PostgreSQL'], tools: ['PostgreSQL', 'MySQL', 'DBeaver', 'Laravel'], images: [], link: '' },
  { id: 'p5', interior: 'lab', category: 'Machine Learning', title: 'ML / Data Project',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    details: 'Describe the project here: what problem it solves, what you built, your role, and what you learned along the way.',
    tech: ['Python', 'Pandas'], tools: ['Python', 'Pandas', 'scikit-learn', 'Jupyter', 'TensorFlow', 'Colab'], images: [], link: '' },
  { id: 'p6', interior: 'studio', category: 'Final Thesis', title: 'Thesis Project',
    desc: 'Replace with one line: the problem, your solution, and the tech stack.',
    details: 'Describe the project here: what problem it solves, what you built, your role, and what you learned along the way.',
    tech: ['Research'], tools: ['Python', 'LaTeX', 'Mendeley', 'Excel'], images: [], link: '' },
]
