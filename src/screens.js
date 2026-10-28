import * as THREE from 'three'

// Tekstur kanvas untuk layar & bingkai di dalam gedung.

const TOOL_COLORS = {
  react: '#61dafb', 'node.js': '#68a063', figma: '#f24e1e', figjam: '#9747ff', python: '#3776ab', git: '#f05032',
  'vs code': '#007acc', flutter: '#02569b', dart: '#0175c2', firebase: '#ffca28', postgresql: '#336791',
  mysql: '#00758f', laravel: '#ff2d20', tensorflow: '#ff6f00', jupyter: '#f37626', pandas: '#150458',
  mongodb: '#47a248', postman: '#ff6c37', notion: '#e6e6e6', 'android studio': '#3ddc84', colab: '#f9ab00',
  'scikit-learn': '#f7931e', latex: '#008080', excel: '#217346', mendeley: '#9d1620', dbeaver: '#382923', maze: '#2f6bff',
  javascript: '#f7df1e', 'three.js': '#ffffff', sql: '#4479a1',
}

export function toolColor(name) {
  const c = TOOL_COLORS[name.toLowerCase()]
  if (c) return c
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360
  return `hsl(${h}, 65%, 55%)`
}

function initials(name) {
  const words = name.replace(/[.\-_]/g, ' ').split(/\s+/).filter(Boolean)
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).replace(/^./, (c) => c.toUpperCase())
}

function wrap(g, text, x, y, maxW, lh, maxLines = 4) {
  const words = text.split(' ')
  let line = ''
  let n = 0
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y + n * lh)
      line = w
      if (++n >= maxLines) return
    } else line = test
  }
  if (line) g.fillText(line, x, y + n * lh)
}

function finish(c) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// isi bingkai: lambang huruf + nama tool
// style: 'light' (kertas putih), 'dark' (hologram), 'poster' (warna-warni)
export function toolTexture(name, style = 'light') {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 512
  const g = c.getContext('2d')
  const col = toolColor(name)
  if (style === 'dark') {
    g.fillStyle = '#06111a'
    g.fillRect(0, 0, 512, 512)
    g.strokeStyle = col
    g.globalAlpha = 0.25
    for (let i = 0; i < 512; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke() }
    g.globalAlpha = 1
  } else if (style === 'poster') {
    g.fillStyle = col
    g.fillRect(0, 0, 512, 512)
    g.fillStyle = 'rgba(0,0,0,0.18)'
    g.fillRect(0, 380, 512, 132)
  } else {
    g.fillStyle = '#f5f1ea'
    g.fillRect(0, 0, 512, 512)
  }
  // lingkaran lambang
  g.beginPath()
  g.arc(256, 210, 120, 0, Math.PI * 2)
  g.fillStyle = style === 'poster' ? 'rgba(255,255,255,0.92)' : col
  g.fill()
  if (style === 'dark') { g.lineWidth = 6; g.strokeStyle = '#ffffff'; g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1 }
  g.fillStyle = style === 'poster' ? col : '#ffffff'
  if (style !== 'poster' && ['#ffca28', '#f7df1e', '#e6e6e6', '#ffffff', '#61dafb', '#3ddc84', '#f9ab00'].includes(col)) g.fillStyle = '#16181c'
  g.font = '700 110px Inter, Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(initials(name), 256, 214)
  g.fillStyle = style === 'light' ? '#1b1d21' : '#ffffff'
  g.font = '700 52px Inter, Arial, sans-serif'
  g.fillText(name, 256, 400, 470)
  g.font = '500 22px "JetBrains Mono", monospace'
  g.fillStyle = style === 'light' ? '#8a847a' : 'rgba(255,255,255,0.7)'
  g.fillText('TOOLS I USE', 256, 455)
  return finish(c)
}

// layar utama project
export function projectTexture(p, accent, transparent = false) {
  const c = document.createElement('canvas')
  c.width = 1280
  c.height = 720
  const g = c.getContext('2d')
  if (transparent) {
    g.fillStyle = 'rgba(4, 20, 32, 0.55)'
    g.fillRect(0, 0, 1280, 720)
  } else {
    const grad = g.createLinearGradient(0, 0, 1280, 720)
    grad.addColorStop(0, '#0c0f14')
    grad.addColorStop(1, '#151a22')
    g.fillStyle = grad
    g.fillRect(0, 0, 1280, 720)
  }
  // kisi tipis
  g.strokeStyle = 'rgba(255,255,255,0.05)'
  for (let x = 0; x < 1280; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 720); g.stroke() }
  for (let y = 0; y < 720; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.stroke() }
  g.fillStyle = accent
  g.fillRect(80, 92, 70, 6)
  g.font = '500 28px "JetBrains Mono", monospace'
  g.fillText(`${String(p.index + 1).padStart(2, '0')}  ·  ${p.category.toUpperCase()}`, 170, 104)
  g.fillStyle = '#ffffff'
  g.font = '800 92px Inter, Arial, sans-serif'
  wrap(g, p.title, 80, 220, 1100, 96, 2)
  g.fillStyle = '#b8c2cc'
  g.font = '400 34px Inter, Arial, sans-serif'
  wrap(g, p.desc, 80, 390, 1050, 48, 3)
  // chip teknologi
  let x = 80
  g.font = '600 26px "JetBrains Mono", monospace'
  for (const t of p.tech) {
    const w = g.measureText(t).width + 40
    g.strokeStyle = accent
    g.lineWidth = 2
    g.strokeRect(x, 540, w, 50)
    g.fillStyle = '#e9eef3'
    g.fillText(t, x + 20, 575)
    x += w + 14
  }
  g.fillStyle = accent
  g.font = '700 28px "JetBrains Mono", monospace'
  g.fillText('▶  CLICK TO OPEN PROJECT', 80, 660)
  return finish(c)
}

// panel UI hologram tambahan (grafik, cincin, baris data)
export function holoTexture(kind, color = '#7fe8ff', seed = 1) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 340
  const g = c.getContext('2d')
  g.fillStyle = 'rgba(6, 26, 40, 0.6)'
  g.fillRect(0, 0, 512, 340)
  g.strokeStyle = color
  g.fillStyle = color
  g.lineWidth = 3
  g.strokeRect(6, 6, 500, 328)
  let s = seed
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  if (kind === 'ring') {
    for (let i = 0; i < 3; i++) {
      g.beginPath()
      g.arc(256, 170, 110 - i * 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (0.4 + r() * 0.55))
      g.lineWidth = 12 - i * 3
      g.stroke()
    }
    g.font = '700 46px Inter, Arial'
    g.textAlign = 'center'
    g.fillText(`${Math.round(60 + r() * 39)}%`, 256, 186)
  } else if (kind === 'chart') {
    g.beginPath()
    for (let x = 30; x < 490; x += 10) {
      const y = 200 + Math.sin(x * 0.03 + seed) * 60 + (r() - 0.5) * 30
      if (x === 30) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
    g.globalAlpha = 0.5
    for (let x = 40; x < 480; x += 36) g.fillRect(x, 300 - r() * 90, 20, 90)
    g.globalAlpha = 1
  } else {
    g.font = '500 20px "JetBrains Mono", monospace'
    for (let i = 0; i < 9; i++) {
      g.globalAlpha = 0.4 + r() * 0.6
      g.fillRect(30, 40 + i * 32, 120 + r() * 300, 12)
    }
    g.globalAlpha = 1
  }
  return finish(c)
}

// pemandangan kota malam untuk jendela apartemen
export function cityViewTexture() {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 512
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 512)
  grad.addColorStop(0, '#0a0d24')
  grad.addColorStop(0.7, '#3a1d3e')
  grad.addColorStop(1, '#6a2b3c')
  g.fillStyle = grad
  g.fillRect(0, 0, 1024, 512)
  let s = 5
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 40; i++) {
    const w = 30 + r() * 60
    const h = 80 + r() * 300
    const x = r() * 1024
    g.fillStyle = `hsl(240, 20%, ${6 + r() * 8}%)`
    g.fillRect(x, 512 - h, w, h)
    for (let y = 512 - h + 8; y < 500; y += 14) {
      for (let wx = x + 5; wx < x + w - 6; wx += 10) {
        if (r() > 0.6) { g.fillStyle = r() > 0.3 ? '#ffd59a' : '#9fd8ff'; g.fillRect(wx, y, 4, 6) }
      }
    }
  }
  // Tokyo Tower kecil
  g.strokeStyle = '#ff5a2a'
  g.lineWidth = 3
  g.beginPath(); g.moveTo(700, 512); g.lineTo(740, 160); g.lineTo(780, 512); g.stroke()
  g.beginPath(); g.moveTo(740, 160); g.lineTo(740, 90); g.stroke()
  return finish(c)
}
