// pos = [x, 0, z]. Rumah menghadap ke +z (ke arah pemain datang).
// Tambah rumah baru? Cukup tambah entri baru. Jalan setapak otomatis menyambung.
// Jaga supaya x antara -11 sampai 11, dan z antara -4 sampai -34.
export const stations = [
  { id: 'p1', type: 'project', title: 'Project 1',
    desc: 'Deskripsi singkat project kamu.', tech: ['React', 'Node.js'],
    pos: [-6.5, 0, -8], rot: 0.2 },
  { id: 'e1', type: 'experience', title: 'Pengalaman 1',
    desc: 'Posisi, tempat, dan tahun.', tech: [],
    pos: [7, 0, -13], rot: -0.25 },
  { id: 'p2', type: 'project', title: 'Project 2',
    desc: 'Deskripsi project kedua.', tech: ['Python', 'LLM'],
    pos: [-8, 0, -22], rot: -0.15 },
  { id: 'e2', type: 'experience', title: 'Pengalaman 2',
    desc: 'Posisi, tempat, dan tahun.', tech: [],
    pos: [6, 0, -28], rot: 0.3 },
]