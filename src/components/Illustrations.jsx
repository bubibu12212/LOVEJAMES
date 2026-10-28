// Ilustrasi SVG ringan: gedung isometrik (kartu project & kaki halaman) dan siluet Tokyo Tower.

const STYLES = {
  glass: { floors: 10, w: 34, d: 30, left: '#5d7ea6', right: '#3c5878', top: '#8fb0d4', win: '#cfe4ff', roof: 'flat', grid: 'glass' },
  apartment: { floors: 8, w: 32, d: 28, left: '#8a8d93', right: '#64676d', top: '#a6a9ae', win: '#ffd59a', roof: 'flat', grid: 'window' },
  villa: { floors: 3, w: 46, d: 40, left: '#e9e6e0', right: '#c9c5bd', top: '#f5f3ef', win: '#2a3440', roof: 'flat', grid: 'wide' },
  shop: { floors: 4, w: 38, d: 32, left: '#d8b9a4', right: '#b8977f', top: '#e6cdbb', win: '#3a3f46', roof: 'flat', grid: 'window' },
  green: { floors: 9, w: 30, d: 28, left: '#c9c2b4', right: '#a59e90', top: '#d9d3c7', win: '#3a3f46', roof: 'flat', grid: 'green' },
  wooden: { floors: 2, w: 44, d: 38, left: '#7a5236', right: '#5c3c27', top: '#3a3a3e', win: '#ffcf8f', roof: 'hip', grid: 'wide' },
}

export function IsoBuilding({ kind = 'glass', height = 120 }) {
  const s = STYLES[kind] ?? STYLES.glass
  const fh = kind === 'villa' || kind === 'wooden' ? 13 : 9
  const H = s.floors * fh
  // titik isometrik: x ke kanan-bawah, z ke kiri-bawah
  const cx = 60
  const base = 112
  const ix = (x, z) => cx + (x - z) * 0.87
  const iy = (x, y, z) => base - y + (x + z) * 0.5
  const P = (pts) => pts.map(([x, y, z]) => `${ix(x, z).toFixed(1)},${iy(x, y, z).toFixed(1)}`).join(' ')
  const { w, d } = s
  const wins = []
  const cols = s.grid === 'wide' ? 2 : s.grid === 'glass' ? 5 : 3
  for (let f = 0; f < s.floors; f++) {
    const y0 = f * fh + fh * 0.28
    const y1 = y0 + fh * (s.grid === 'glass' ? 0.62 : 0.48)
    for (let c = 0; c < cols; c++) {
      // sisi kiri (bidang z = d)
      const x0 = (w / cols) * c + (w / cols) * 0.18
      const x1 = x0 + (w / cols) * 0.64
      wins.push(<polygon key={`l${f}${c}`} points={P([[x0, y0, d], [x1, y0, d], [x1, y1, d], [x0, y1, d]])} fill={s.win} opacity={(f * 7 + c * 3) % 5 === 0 ? 0.45 : 0.9} />)
      // sisi kanan (bidang x = w)
      const z0 = (d / cols) * c + (d / cols) * 0.18
      const z1 = z0 + (d / cols) * 0.64
      wins.push(<polygon key={`r${f}${c}`} points={P([[w, y0, z0], [w, y0, z1], [w, y1, z1], [w, y1, z0]])} fill={s.win} opacity={(f * 5 + c) % 4 === 0 ? 0.35 : 0.75} />)
    }
    if (s.grid === 'green' && f % 2 === 1) {
      wins.push(<polygon key={`g${f}`} points={P([[0, f * fh, d + 2], [w, f * fh, d + 2], [w, f * fh + 4, d + 2], [0, f * fh + 4, d + 2]])} fill="#5f8f4e" />)
      wins.push(<polygon key={`gr${f}`} points={P([[w + 2, f * fh, 0], [w + 2, f * fh, d], [w + 2, f * fh + 4, d], [w + 2, f * fh + 4, 0]])} fill="#4b7a3d" />)
    }
  }
  // kotak pandang mengikuti ukuran gedung supaya tidak terpotong
  const top = base - H - (s.roof === 'hip' ? 22 : 12)
  const bottom = base + (w + d) * 0.5 + 10

  return (
    <svg viewBox={`0 ${top} 120 ${bottom - top}`} height={height} aria-hidden className="iso">
      <ellipse cx={cx + (w - d) * 0.43} cy={base + (w + d) * 0.25 + 4} rx={(w + d) * 0.7} ry={(w + d) * 0.22} fill="#000" opacity="0.35" />
      <polygon points={P([[0, 0, d], [w, 0, d], [w, H, d], [0, H, d]])} fill={s.left} />
      <polygon points={P([[w, 0, 0], [w, 0, d], [w, H, d], [w, H, 0]])} fill={s.right} />
      <polygon points={P([[0, H, 0], [w, H, 0], [w, H, d], [0, H, d]])} fill={s.top} />
      {wins}
      {s.roof === 'hip' && (
        <>
          <polygon points={P([[-4, H, d + 4], [w + 4, H, d + 4], [w * 0.7, H + 16, d / 2], [w * 0.3, H + 16, d / 2]])} fill="#2e2e33" />
          <polygon points={P([[w + 4, H, -4], [w + 4, H, d + 4], [w * 0.7, H + 16, d / 2]])} fill="#232327" />
        </>
      )}
      {s.roof === 'flat' && (
        <polygon points={P([[w * 0.55, H, d * 0.2], [w * 0.85, H, d * 0.2], [w * 0.85, H + 5, d * 0.2], [w * 0.55, H + 5, d * 0.2]])} fill="#55585e" />
      )}
    </svg>
  )
}

// siluet Tokyo Tower dengan lingkaran merah
export function TowerArt() {
  const legs = []
  for (let i = 0; i < 26; i++) {
    const y0 = 380 - i * 13
    const y1 = y0 - 13
    const w = (y) => 6 + 70 * Math.pow((y - 40) / 340, 2.2)
    const c = Math.floor(i / 3) % 2 ? '#f1ebe1' : '#ff4a1c'
    legs.push(<path key={i} d={`M${150 - w(y0)},${y0} L${150 - w(y1)},${y1} M${150 + w(y0)},${y0} L${150 + w(y1)},${y1} M${150 - w(y0)},${y0} L${150 + w(y1)},${y1} M${150 + w(y0)},${y0} L${150 - w(y1)},${y1} M${150 - w(y0)},${y0} L${150 + w(y0)},${y0}`} stroke={c} strokeWidth={i < 6 ? 2.4 : 1.6} />)
  }
  return (
    <svg viewBox="0 0 300 400" className="tower-art" aria-hidden>
      <circle cx="160" cy="190" r="138" fill="#c9231b" />
      <g fill="none">{legs}</g>
      <rect x="112" y="205" width="76" height="16" fill="#e9e3d9" />
      <rect x="114" y="208" width="72" height="5" fill="#ffcf8f" />
      <rect x="132" y="112" width="36" height="10" fill="#e9e3d9" />
      <rect x="133" y="114" width="34" height="3" fill="#ffcf8f" />
      <rect x="148" y="10" width="4" height="40" fill="#f1ebe1" />
      <circle cx="150" cy="9" r="3" fill="#ff3b2f" />
    </svg>
  )
}
