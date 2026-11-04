// ===================== PROFIL =====================
// Ganti dengan data kamu. Kontak yang link-nya '#' tetap tampil, tapi tidak bisa diklik.
export const profile = {
  name: 'Salsa Ica Indriani',
  short: 'SALSA',
  role: 'Computer Science Graduate — Software Developer',
  tagline: "Hi, I'm Salsa — a recent Computer Science graduate passionate about software development, technology, and creating innovative digital solutions.",
  aboutTitle: 'Building digital things that matter',
  about: [
    "I'm Salsa, a recent Computer Science graduate passionate about software development and technology. I love turning ideas into clean, useful digital products — from the logic behind the scenes to the interface people actually touch.",
  ],
  facts: [
    { label: 'Education', value: 'B.Sc. Computer Science' },
    { label: 'Focus', value: 'Software Development' },
    { label: 'Based in', value: 'Indonesia' },
  ],
  skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Figma', 'Three.js'],
  // Foto untuk bagian About: taruh file di public/photo.jpg (kosongkan '' kalau belum ada)
  photo: '/gallery/ica.jpeg',
  // true = tampilkan animasi Three.js buatanmu (src/components/About3D.jsx) di bagian About, menggantikan foto
  useAbout3D: false,
  contacts: [
    { label: 'Email', text: 'icasalsaindriani13@gmail.com', href: 'mailto:icasalsaindriani13@gmail.com' },   
    { label: 'LinkedIn', text: 'linkedin.com/in/salsa-ica-indriani/', href: 'https://linkedin.com/in/salsa-ica-indriani/' },
    { label: 'GitHub', text: 'github.com/bubibu12212', href: 'https://github.com/bubibu12212' },
  ],
}

// ===================== CERITA PERJALANAN (di taman) =====================
// Foto-foto yang muncul (pop-up) di sepanjang jalan taman, urut dari depan ke belakang. Maksimal 8.
// Taruh foto di public/gallery/journey/ (ukuran 3:2, mis. 1200x800 supaya semua bingkai rapi),
// lalu isi src seperti '/gallery/journey/03-unpad.jpg'. Kalau kosong, muncul kartu "photo coming soon".
// soon = tanggal untuk acara yang belum terjadi (kartu "Coming soon").
// Judul maksimal ±25 huruf supaya muat satu baris di panel.
export const journey = [
  { year: '2023', title: 'Day One at Pre-Uni',
    text: 'New blazer, new friends, new city of code. Pre-University at President University was where my Computer Science story officially began.',
    src: '/gallery/journey/01-preuni.jpg' },
  { year: '2023', title: 'Hello, PUMA Informatics',
    text: 'Joined the Informatics Student Association in External Relations: the bridge between our campus and other organizations and companies.',
    src: '/gallery/journey/02-external.jpg' },
  { year: '2024', title: 'PM · Comparative Study',
    text: 'Led PUMA Informatics\' comparative study visit to Universitas Padjadjaran (UNPAD) as Project Manager, from first plan to the big day.',
    src: '/gallery/journey/03-unpad.jpg' },
  { year: '2024', title: 'Vice Head, Technopreneur',
    text: 'Moved to the Technopreneur Division as Vice Head, keeping the books in order: cash records, receivables and installment tracking.',
    src: '/gallery/journey/04-technopreneur.jpg' },
  { year: '2024', title: 'Event Organizer · Culfest',
    text: 'Part of the organizing team behind Culfest, the BEM campus festival that brought together 1,000+ participants.',
    src: '/gallery/journey/05-culfest.jpg' },
  { year: '2025', title: 'Intern at DENSO Indonesia',
    text: 'A year in the procurement team, turning paper into apps: an E-PO web app, a Power Apps PR system and automation scripts.',
    src: '/gallery/journey/06-denso.jpg' },
  { year: '2026', title: 'Thesis Defended',
    text: 'Built DYX, an AI chatbot that classifies goods into Indonesian HS Codes, then defended it and walked out with flowers in hand.',
    src: '/gallery/journey/07-thesis.jpg' },
  { year: '2026', title: 'Graduation Day', soon: '13 . 12 . 2026',
    text: 'Coming soon on 13 December 2026: the last page of this chapter, and the first page of the next one.',
    src: '' },
]

// ===================== PROJECT (gedung yang bisa dimasuki) =====================
// interior = tema ruangan di dalam gedung (juga menentukan bentuk gedungnya):
//   'house' | 'office' | 'apartment' | 'dorm' | 'lab' | 'studio'
// tools = isi bingkai di dinding ruangan (tools yang kamu pakai di project itu)
//   logonya diambil dari public/logos/ (daftar nama → file ada di LOGOS, src/screens.js); tanpa logo = inisial huruf
// details = paragraf pembuka di jendela project (muncul saat layar/TV di dalam ruangan diklik)
// features = daftar fitur utama (poin-poin di bawah paragraf)
// images = foto/screenshot project, contoh ['/projects/web1.jpg'] (taruh di public/projects/)
// link = tombol "Open project" (kosongkan = tombolnya tidak muncul)
// Urutan = urutan gedung di taman: kiri-kanan bergantian dari depan ke belakang.
const shots = (dir, n, pad = 1) => Array.from({ length: n }, (_, i) => `/projects/${dir}/${String(i + 1).padStart(pad, '0')}.jpg`)

export const stations = [
  { id: 'hscode', interior: 'studio', category: 'Final Thesis · AI', title: 'DYX — HS Code AI Chatbot',
    desc: 'AI chatbot that classifies goods into Indonesian HS Codes (BTKI 2022) with tariffs, licenses and a confidence score.',
    details: 'DYX is an AI-powered web app that helps import/export teams classify goods into Indonesian HS Codes (BTKI 2022). Users type a product name, speak it, or upload an Excel file, and get back the HS Code, tariffs, import-license info, a confidence score, a risk level and alternative codes. The pictures are pages from the user guide.',
    features: [
      'Layered classification: internal database lookup, then BTKI keyword mapping, then validation by an LLM (Llama 3.3 70B via Groq)',
      'Semantic search with Sentence-Transformers and fuzzy matching with RapidFuzz',
      'Voice input and batch classification from an Excel file',
      'Security following ISO 27001 practices: OTP email verification, JWT auth, rate limiting and prompt-injection detection',
      'Admin dashboard with user logs, anomaly detection and an HS Code manager',
      'Dark/light mode and three languages (English, Indonesian, Japanese)',
    ],
    tech: ['Python', 'FastAPI', 'SQLAlchemy', 'Pydantic', 'MySQL (Aiven)', 'Groq · Llama 3.3 70B', 'Sentence-Transformers', 'RapidFuzz', 'openpyxl', 'JWT', 'HTML', 'CSS', 'JavaScript', 'Web Speech API'],
    tools: ['Python', 'FastAPI', 'MySQL', 'Meta Llama', 'Hugging Face', 'SQLAlchemy', 'Pydantic', 'JavaScript'],
    images: shots('hscode', 14, 2), link: '' },
  { id: 'wifi', interior: 'lab', category: 'Networking · Own Project', title: 'Wi-Fi Network Device Scanner',
    desc: 'Command-line scanner that finds every device on a Wi-Fi network and guesses what each one is.',
    details: 'A Python command-line tool that scans the local Wi-Fi subnet and identifies every device it finds. In the screenshot, MAC addresses and hostnames are blurred for privacy.',
    features: [
      'Scans a whole /24 subnet (253 addresses) with ping, TCP probes and the ARP cache',
      'Identifies phones (including randomised MAC addresses), laptops/PCs and other devices',
      'Shows the IP, MAC address and hostname of each device, plus the method that found it',
      'Live progress bar and results saved to a JSON file',
    ],
    tech: ['Python', 'ICMP Ping', 'TCP Probe', 'ARP', 'JSON'],
    tools: ['Python', 'PowerShell', 'VS Code', 'JSON'],
    images: shots('wifi', 1), link: '' },
  { id: 'metadata', interior: 'dorm', category: 'Privacy · Web App', title: 'Metadata Cleaner',
    desc: 'Pixel-art web app that reveals the hidden EXIF data in a photo, including GPS, and strips it in one click.',
    details: 'A web application that helps users protect their privacy by detecting and removing hidden metadata from photos. Users upload an image, see what it reveals (camera info, timestamps and GPS location), and download a clean copy.',
    features: [
      'EXIF metadata extraction converted into a readable format',
      'GPS location detection with a direct Google Maps link to show what the photo reveals',
      'One-click metadata removal and download of the cleaned image',
      'REST API backend with a unique ID for each analysis result',
      'Containerized with Docker Compose (separate frontend and backend services)',
    ],
    tech: ['Python', 'Flask', 'Pillow', 'piexif', 'HTML', 'CSS', 'JavaScript', 'Nginx', 'Docker'],
    tools: ['Python', 'Flask', 'Docker', 'Nginx', 'JavaScript', 'HTML5', 'CSS'],
    images: shots('metadata', 4), link: '' },
  { id: 'po', interior: 'office', category: 'Internship · Web App', title: 'Purchase Order System',
    desc: 'Web system that digitizes Purchase Order creation, approval, printing and archiving.',
    details: 'A web-based system that digitizes Purchase Order creation, approval assignment, printing and archiving, replacing a manual process. Built with vanilla JavaScript and a lightweight Python backend with a JSON-based REST API.',
    features: [
      'Multi-company support with tax ID and invoice address filled in automatically',
      'Auto-generated PO numbers with a monthly prefix and a running sequence that resets each month',
      'Amount-based approver assignment across 4 approval tiers',
      'Dynamic item table with real-time total calculation',
      'Print-ready PO document with an automatic print-to-archive workflow',
      'PO history and archive with search',
    ],
    tech: ['HTML', 'CSS', 'JavaScript', 'Python', 'JSON REST API'],
    tools: ['HTML5', 'CSS', 'JavaScript', 'Python', 'JSON'],
    images: shots('po', 5), link: '' },
  { id: 'powerapps', interior: 'apartment', category: 'Internship · Low-code', title: 'Purchase Request Approval System',
    desc: 'Power Apps + Power Automate system for DENSO Indonesia that routes purchase requests for approval by email.',
    details: 'Built for the Purchasing Dept of DENSO Indonesia to replace a manual, paper-based Purchase Request (PR) process. Users submit PRs through a Power Apps interface, approvals are routed automatically by email through Power Automate, and SharePoint is the database.',
    features: [
      'Auto-generated PR numbers in sequence (e.g. PR-202608037 = year, month, running number)',
      'Multi-item input with automatic total calculation',
      'Sequential email approval: each approver is notified only after the previous one approves',
      'Amount-based routing: low-value PRs stop at General Manager level, high-value PRs escalate further',
      'Request tracking with status filters (Approval, Accepted, Completed, Rejected) and search',
    ],
    tech: ['Power Apps', 'Power Automate', 'SharePoint List', 'Outlook'],
    tools: ['Power Apps', 'Power Automate', 'SharePoint', 'Outlook'],
    images: shots('powerapps', 2), link: '' },
]
