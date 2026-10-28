import * as THREE from 'three'
import { stations } from './data'

export const GATE_SCALE = 0.65

function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// jalan setapak: dari gerbang lewat depan tiap rumah
const front = stations.map((s) => new THREE.Vector3(s.pos[0], 0, s.pos[2] + 3.2))
export const pathCurve = new THREE.CatmullRomCurve3(
  [new THREE.Vector3(0, 0, 3.5), new THREE.Vector3(0.4, 0, -3.5), ...front],
  false,
  'centripetal'
)
export const pathPoints = pathCurve.getSpacedPoints(220)

function distToPath(x, z) {
  let m = Infinity
  for (const p of pathPoints) m = Math.min(m, Math.hypot(p.x - x, p.z - z))
  return m
}

// pohon acak (selalu sama tiap reload karena pakai seed)
const rand = rng(11)
export const trees = []
let tries = 0
while (trees.length < 520 && tries++ < 8000) {
  const x = (rand() - 0.5) * 90
  const z = 12 - rand() * 80
  if (z > 0 && Math.abs(x) < 9) continue          // halaman depan gerbang
  if (Math.abs(z) < 1.5) continue                  // jalur tembok
  if (z > -4 && Math.abs(x) < 5) continue          // area gerbang
  if (
    stations.some(
      (s) =>
        Math.hypot(x - s.pos[0], z - s.pos[2]) < 4.2 ||
        Math.hypot(x - s.pos[0], z - (s.pos[2] + 3.2)) < 3
    )
  ) continue
  if (distToPath(x, z) < 2.3) continue
  trees.push({ x, z, s: 0.8 + rand() * 0.9, type: rand() < 0.6 ? 0 : 1, shade: rand() })
}

// lingkaran tabrakan {x, z, r}
export const obstacles = []
stations.forEach((s) => obstacles.push({ x: s.pos[0], z: s.pos[2], r: 1.7 }))
for (const side of [-1, 1]) {
  obstacles.push({ x: side * 2.34, z: 0, r: 0.55 }) // pilar gerbang
  for (let x = 3.1; x <= 14; x += 0.7) obstacles.push({ x: side * x, z: 0, r: 0.4 }) // tembok
}
trees.forEach((t) => {
  if (Math.abs(t.x) < 16 && t.z > -41) obstacles.push({ x: t.x, z: t.z, r: 0.35 * t.s })
})