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
  photo: '/gallery/ica.jpeg',
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
  { year: '2023', title: 'First line of code', text: 'Started my Informatics degree and wrote my very first program .', src: '/gallery/preuni.jpeg' },
  { year: '2021', title: 'Campus organization', text: 'Joined the Informatics Student Association, contributing to the External Relations Division and collaborating with fellow members.', src: '/gallery/puma1.jpeg' },
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
//   logonya diambil dari public/logos/ (daftar nama → file ada di LOGOS, src/screens.js); tanpa logo = inisial huruf
// details = teks panjang di jendela project (muncul saat layar/TV di dalam ruangan diklik)
// images = foto/screenshot project, contoh ['/projects/web1.jpg'] (taruh di public/projects/)
// link = tombol "Open project" (kosongkan kalau belum ada)
// Urutan = urutan gedung di taman: kiri-kanan bergantian dari depan ke belakang.
const shots = (dir, n, pad = 1) => Array.from({ length: n }, (_, i) => `/projects/${dir}/${String(i + 1).padStart(pad, '0')}.jpg`)

export const stations = [
  { id: 'hscode', interior: 'studio', category: 'Final Thesis · AI', title: 'DYX — HS Code AI Chatbot',
    desc: 'AI chatbot that classifies goods into Indonesian HS Codes (BTKI 2022) with tariffs, licenses and a confidence score.',
    details: 'DYX is an AI-powered web app that helps import/export teams classify goods into Indonesian HS Codes (BTKI 2022). Users can type a product name, use voice input, or upload an Excel file for batch processing. For each item, the app returns the HS Code, tariffs, import-license info, a confidence score, a risk level, and alternative codes. Classification runs as a layered pipeline: internal database lookup first, then BTKI keyword mapping, then validation by an LLM (Llama 3.3 70B via Groq). Security follows ISO 27001 practices, including OTP email verification, JWT auth, rate limiting, prompt-injection detection, and an admin dashboard with user logs, anomaly detection and an HS Code manager. The UI supports dark/light mode and English, Indonesian and Japanese. The pictures below are pages from the user guide.',
    tech: ['Python', 'FastAPI', 'SQLAlchemy', 'Pydantic', 'MySQL (Aiven)', 'Groq · Llama 3.3 70B', 'Sentence-Transformers', 'RapidFuzz', 'openpyxl', 'JWT', 'HTML', 'CSS', 'JavaScript', 'Web Speech API'],
    tools: ['Python', 'FastAPI', 'MySQL', 'Meta Llama', 'Hugging Face', 'SQLAlchemy', 'Pydantic', 'JavaScript'],
    images: shots('hscode', 14, 2), link: '' },
  { id: 'wifi', interior: 'lab', category: 'Networking · Own Project', title: 'Wi-Fi Network Device Scanner',
    desc: 'Command-line scanner that finds every device on a Wi-Fi network and guesses what each one is.',
    details: 'A Python command-line tool that scans the local Wi-Fi subnet (e.g. 253 addresses in a /24) using ping, TCP probes and the ARP cache, then identifies each device it finds: phones (including randomised MAC addresses), laptops/PCs and other devices, together with their IP, MAC address and hostname. It shows live progress, reports which method found each device, and saves the results to a JSON file. In the screenshot, MAC addresses and hostnames are blurred for privacy.',
    tech: ['Python', 'ICMP Ping', 'TCP Probe', 'ARP', 'JSON'],
    tools: ['Python', 'PowerShell', 'VS Code', 'JSON'],
    images: shots('wifi', 1), link: '' },
  { id: 'metadata', interior: 'dorm', category: 'Privacy · Web App', title: 'Metadata Cleaner',
    desc: 'Pixel-art web app that reveals the hidden EXIF data in a photo, including GPS, and strips it in one click.',
    details: 'A web application that helps users protect their privacy by detecting and removing hidden metadata from photos. Users upload an image, view the EXIF data it contains (camera info, timestamps, and GPS location), and download a clean copy with all metadata stripped. Key features: EXIF metadata extraction converted into a readable format; GPS location detection with a direct Google Maps link to show what the photo reveals; one-click metadata removal and download of the cleaned image; a REST API backend with unique IDs for each analysis result; and containerized deployment using Docker Compose (separate frontend and backend services).',
    tech: ['Python', 'Flask', 'Pillow', 'piexif', 'HTML', 'CSS', 'JavaScript', 'Nginx', 'Docker'],
    tools: ['Python', 'Flask', 'Docker', 'Nginx', 'JavaScript', 'HTML5', 'CSS'],
    images: shots('metadata', 4), link: '' },
  { id: 'po', interior: 'office', category: 'Internship · Web App', title: 'Purchase Order System',
    desc: 'Web system that digitizes Purchase Order creation, approval, printing and archiving.',
    details: 'A web-based system that digitizes Purchase Order creation, approval assignment, printing, and archiving, replacing a manual process. Built with vanilla JavaScript and a lightweight Python backend with a JSON-based REST API. Key features: multi-company support with tax ID and invoice address filled in automatically; auto-generated PO numbers using a monthly prefix and a running sequence that resets each month; amount-based approver assignment across 4 approval tiers; a dynamic item table with real-time total calculation; a print-ready PO document with an automatic print-to-archive workflow; and PO history and archive with search.',
    tech: ['HTML', 'CSS', 'JavaScript', 'Python', 'JSON REST API'],
    tools: ['HTML5', 'CSS', 'JavaScript', 'Python', 'JSON'],
    images: shots('po', 5), link: '' },
  { id: 'powerapps', interior: 'apartment', category: 'Internship · Low-code', title: 'Purchase Request Approval System',
    desc: 'Power Apps + Power Automate system for DENSO Indonesia that routes purchase requests for approval by email.',
    details: 'Purchase Request Approval System for DENSO Indonesia (Purchasing Dept). Built a digital Purchase Request (PR) system that replaced a manual, paper-based process. Users submit PRs through a Power Apps interface, and approvals are routed automatically by email through Power Automate, with SharePoint as the database. Key features: auto-generated PR numbers in sequence (e.g. PR-202608037 = year, month, running number); multi-item input with automatic total calculation; sequential email approval, where each approver is notified only after the previous one approves; amount-based approval routing, where low-value PRs stop at General Manager level while high-value PRs escalate further; and request tracking with status filters (Approval, Accepted, Completed, Rejected) and search.',
    tech: ['Power Apps', 'Power Automate', 'SharePoint List', 'Outlook'],
    tools: ['Power Apps', 'Power Automate', 'SharePoint', 'Outlook'],
    images: shots('powerapps', 2), link: '' },
]
