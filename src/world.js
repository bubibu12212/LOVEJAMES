import * as THREE from 'three'
import { stations, journey } from './data'

// kamera orbit: yaw = putaran kiri/kanan, pitch = sudut atas/bawah, dist = jarak (zoom)
export const camState = { yaw: 0, pitch: 0.38, dist: 7 }

// waktu bersama untuk animasi shader (daun bergoyang)
export const windTime = { value: 0 }

export function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// bikin material bergoyang kena angin. strength = seberapa jauh ujungnya bergerak.
// fadeNear = bagian yang lebih dekat dari jarak ini ke kamera dibuat tembus (supaya daun tidak menutupi layar)
export function applyWind(material, strength, fadeNear = 0) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windTime
    shader.vertexShader = 'uniform float uTime;\nvarying float vViewZ;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 ip = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
      #else
        vec2 ip = vec2(0.0);
      #endif
      float sway = sin(uTime * 1.4 + ip.x * 0.35 + ip.y * 0.27) + 0.35 * sin(uTime * 3.3 + ip.x * 1.7);
      float h = max(position.y, 0.0);
      transformed.x += sway * ${strength.toFixed(3)} * h;
      transformed.z += sway * ${(strength * 0.6).toFixed(3)} * h;`
    ).replace('#include <project_vertex>', '#include <project_vertex>\nvViewZ = -mvPosition.z;')
    if (fadeNear > 0) {
      shader.fragmentShader = 'varying float vViewZ;\n' + shader.fragmentShader.replace(
        'void main() {',
        `void main() {
        float fade = clamp((vViewZ - ${(fadeNear - 0.6).toFixed(2)}) / 0.6, 0.0, 1.0);
        float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        if (dither > fade) discard;`
      )
    }
  }
  return material
}

// Material gedung kaca: pola jendela dihitung dari posisi dunia, jadi cocok untuk gedung ukuran apa pun.
// Warna dasar (color / instanceColor) = warna rangka fasad.
// glow = terang lampu jendela (malam: besar), lit = proporsi jendela yang menyala.
export function makeFacadeMaterial({ floorH = 3.2, bayW = 1.7, lit = 0.35, seed = 0, glow = 0.9 } = {}) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.2 })
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 vWPos;\nvarying vec3 vWNorm;\n' + shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      vec4 wp = vec4(transformed, 1.0);
      vec3 wn = objectNormal;
      #ifdef USE_INSTANCING
        wp = instanceMatrix * wp;
        wn = mat3(instanceMatrix) * wn;
      #endif
      vWPos = (modelMatrix * wp).xyz;
      vWNorm = normalize(mat3(modelMatrix) * wn);`
    )
    shader.fragmentShader = 'varying vec3 vWPos;\nvarying vec3 vWNorm;\nfloat fHash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)) + ' + seed.toFixed(1) + ') * 43758.5); }\n' +
      shader.fragmentShader
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float side = 1.0 - step(0.6, abs(vWNorm.y));
          float u = abs(vWNorm.x) > 0.5 ? vWPos.z : vWPos.x;
          vec2 cell = vec2(u / ${bayW.toFixed(2)}, (vWPos.y - 0.6) / ${floorH.toFixed(2)});
          vec2 f = fract(cell);
          float win = step(0.07, f.x) * step(f.x, 0.93) * step(0.2, f.y) * step(f.y, 0.9) * side * step(1.0, cell.y);
          vec2 wid = floor(cell) + floor(vWPos.xz * 0.05);
          float h1 = fHash(wid);
          float h2 = fHash(wid + 17.3);
          float lit = step(${(1 - lit).toFixed(2)}, h1);
          // kaca: gelap di bawah, sedikit memantulkan langit di atas; tirai acak membuat variasi
          vec3 glass = mix(vec3(0.05, 0.08, 0.11), vec3(0.22, 0.3, 0.38), clamp(vWPos.y / 70.0, 0.0, 1.0)) * (0.8 + 0.4 * h2);
          // pita lantai (spandrel) sedikit lebih gelap dari rangka
          float band = side * (1.0 - step(0.2, f.y)) * 0.25;
          diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - band), glass, win);
          // dasar gedung lebih gelap (kesan ambient occlusion)
          diffuseColor.rgb *= mix(0.7, 1.0, clamp(vWPos.y / 6.0, 0.0, 1.0));
          vec3 litCol = mix(vec3(1.0, 0.76, 0.48), vec3(0.75, 0.88, 1.0), step(0.7, h2));
          vec3 winGlow = litCol * win * lit * (0.55 + 0.6 * fract(h2 * 7.0));`
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          totalEmissiveRadiance += winGlow * ${glow.toFixed(2)};`
        )
        .replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, 0.06, win);`
        )
        .replace(
          '#include <metalnessmap_fragment>',
          `#include <metalnessmap_fragment>
          metalnessFactor = mix(metalnessFactor, 0.85, win * (1.0 - lit));`
        )
  }
  return m
}

// ===================== TATA TAMAN =====================
// Gerbang di z = 0, jalan setapak lurus ke arah -z: cerita perjalanan → kolam & jembatan → gedung project → kontak.
export const GARDEN_HALF = 16          // tembok samping di x = ±16
export const GARDEN_END = -112         // tembok belakang
export const PATH_HALF = 1.5
export const PLAYER_START = [0, 0, -5]
export const GARDEN_BOUNDS = { minX: -15.2, maxX: 15.2, minZ: -109.6, maxZ: -1.3 }
export const POND = { z: -47, rx: 9, rz: 4.6 }
export const BRIDGE = { z0: -41.4, z1: -52.6, half: 1.25, rise: 0.85 }
export const CONTACT = { x: 0, z: -101, character: [-2, -104.4], board: [1.8, -104.6] }

// tinggi tanah (hanya jembatan yang melengkung)
export function groundY(x, z) {
  if (Math.abs(x) > BRIDGE.half + 0.2 || z > BRIDGE.z0 || z < BRIDGE.z1) return 0
  const t = (BRIDGE.z0 - z) / (BRIDGE.z0 - BRIDGE.z1)
  return BRIDGE.rise * Math.sin(Math.PI * t)
}

// dorong titik p keluar dari semua penghalang (dipakai pemain & kamera).
// useHeight = abaikan penghalang yang lebih rendah dari p (untuk kamera)
export function pushOut(p, obstacles, pad, useHeight = false) {
  for (const o of obstacles) {
    if (useHeight && p.y > o.h + 0.3) continue
    if (o.hw !== undefined) {
      const dx = p.x - o.x
      const dz = p.z - o.z
      const ox = o.hw + pad - Math.abs(dx)
      const oz = o.hd + pad - Math.abs(dz)
      if (ox > 0 && oz > 0) {
        if (ox < oz) p.x = o.x + Math.sign(dx || 1) * (o.hw + pad)
        else p.z = o.z + Math.sign(dz || 1) * (o.hd + pad)
      }
      continue
    }
    const dx = p.x - o.x
    const dz = p.z - o.z
    const d = Math.hypot(dx, dz)
    const min = o.r + pad
    if (d < min && d > 0.0001) {
      p.x = o.x + (dx / d) * min
      p.z = o.z + (dz / d) * min
    }
  }
}

export const ACCENTS = ['#ff4f6d', '#5fe0ff', '#ffb35e', '#c58bff', '#4fffb0', '#ff8a3d']

// titik cerita: kiri-kanan bergantian di pinggir jalan
export const journeySpots = journey.slice(0, 8).map((j, i) => {
  const side = i % 2 ? 1 : -1
  return { ...j, index: i, side, x: side * 3.4, z: -9 - i * 4.1 }
})

// gedung project: berpasangan kiri-kanan, pintu menghadap jalan
export const buildingSpots = stations.map((s, i) => {
  const side = i % 2 === 0 ? -1 : 1
  const z = -60 - Math.floor(i / 2) * 14
  return {
    ...s,
    index: i,
    side,
    z,
    accent: ACCENTS[i % ACCENTS.length],
    center: [side * 11.6, z],
    door: [side * 6.9, z],
    back: [side * 5.2, 0, z], // titik muncul saat keluar dari gedung
  }
})

const rand = rng(11)
export const sakuraTrees = []
function tree(x, z, s = 1) {
  sakuraTrees.push({ x, z, s: s * (0.85 + rand() * 0.3), r: rand() * Math.PI * 2 })
}
for (let z = -4; z > -39; z -= 7) {
  tree(-8 - rand() * 2, z - rand() * 2)
  tree(8 + rand() * 2, z - 3 - rand() * 2)
  tree(-13 + rand(), z - 4, 1.1)
  tree(13 - rand(), z - 1, 1.1)
}
tree(-12.5, -45, 1.15); tree(12.5, -46, 1.15); tree(-13.2, -53.5); tree(13.4, -53)
tree(-6.2, -67.2, 0.85); tree(6.2, -67, 0.85); tree(-6.2, -81, 0.85); tree(6.2, -81.4, 0.85)
tree(0, -109, 1.5); tree(-7.5, -104, 1.1); tree(7.5, -103.5, 1.1); tree(-12, -97); tree(12, -97.5)
// di luar gerbang
tree(-9, 4.5, 1.1); tree(9.5, 4, 1.1); tree(-15, 3, 1.2); tree(15.5, 3.5, 1.2)

// lentera batu (tōrō)
export const stoneLanterns = [
  [-3.1, -2.6], [3.1, -2.6],
  [-2.3, -40.2], [2.3, -40.2], [-2.3, -53.8], [2.3, -53.8],
  [-2.4, -67], [2.4, -67], [-2.4, -81], [2.4, -81], [-2.4, -94], [2.4, -94],
  [-4.8, -98.5], [4.8, -98.5],
]
export const gateLanterns = [[-4.6, 2.8], [4.6, 2.8]]

// lingkaran tabrakan {x, z, r, h} atau kotak {x, z, hw, hd, h} (h = tinggi, dipakai kamera)
export const gardenObstacles = []
stoneLanterns.forEach(([x, z]) => gardenObstacles.push({ x, z, r: 0.45, h: 1.9 }))
sakuraTrees.forEach((t) => { if (t.z < 0) gardenObstacles.push({ x: t.x, z: t.z, r: 0.45 * t.s, h: 2.2 }) })
journeySpots.forEach((j) => gardenObstacles.push({ x: j.x + j.side * 0.6, z: j.z, r: 0.35, h: 3.6 }))
buildingSpots.forEach((b) => gardenObstacles.push({ x: b.center[0], z: b.z, hw: 3.6, hd: 4.6, h: 40 }))
// tepi kolam (kecuali tempat jembatan) + pagar jembatan
for (let a = 0; a < Math.PI * 2; a += 0.06) {
  const x = Math.cos(a) * POND.rx
  const z = POND.z + Math.sin(a) * POND.rz
  if (Math.abs(x) < BRIDGE.half + 0.4) continue
  gardenObstacles.push({ x, z, r: 0.5, h: 0.6 })
}
for (let z = BRIDGE.z0; z >= BRIDGE.z1; z -= 0.5) {
  gardenObstacles.push({ x: -BRIDGE.half - 0.1, z, r: 0.12, h: 1.8 }, { x: BRIDGE.half + 0.1, z, r: 0.12, h: 1.8 })
}
gardenObstacles.push({ x: CONTACT.character[0], z: CONTACT.character[1], r: 0.6, h: 2 })
gardenObstacles.push({ x: CONTACT.board[0], z: CONTACT.board[1], hw: 2.1, hd: 0.35, h: 3.4 })

// ===================== RUANGAN DI DALAM GEDUNG =====================
// Ruangan diletakkan jauh dari taman (z = 200) supaya tidak saling tabrak.
export const ROOM = { cx: 0, cz: 200, halfW: 7, halfD: 8, height: 4.2 }
export const ROOM_BOUNDS = { minX: -6.4, maxX: 6.4, minZ: ROOM.cz - 7.4, maxZ: ROOM.cz + 7.6 }
export const ROOM_SPAWN = [0, 0, ROOM.cz + 5.8]
export const ROOM_EXIT = [0, ROOM.cz + 7.4]
export const SCREEN_SPOT = [0, ROOM.cz - 3.2] // berdiri di sini untuk melihat layar project

// furnitur per tema (dipakai untuk tabrakan; posisinya sama dengan Interior.jsx)
const R = ROOM.cz
export const roomObstacles = {
  house: [{ x: 0, z: R - 0.6, hw: 1.7, hd: 0.55, h: 1 }, { x: 0, z: R - 2.6, hw: 0.75, hd: 0.45, h: 0.5 }, { x: 0, z: R - 7.4, hw: 2.4, hd: 0.5, h: 1 }, { x: 5.6, z: R + 0.5, r: 0.4, h: 1.6 },
    { x: -6.72, z: R - 1.5, hw: 0.25, hd: 2.2, h: 1.2 }, { x: 4.3, z: R - 2.9, r: 0.6, h: 1 }, { x: 5.3, z: R - 1.6, r: 0.3, h: 0.6 }, { x: 4.6, z: R + 4.8, hw: 1.1, hd: 1.2, h: 1 }, { x: -6.55, z: R + 5, hw: 0.4, hd: 1.3, h: 1 }],
  office: [{ x: 0, z: R - 4.6, hw: 2, hd: 0.85, h: 1 }, { x: -5.9, z: R - 6.9, r: 0.5, h: 1.6 }, { x: 5.9, z: R - 6.9, r: 0.5, h: 1.6 },
    { x: 6.72, z: R + 4.6, hw: 0.25, hd: 1.5, h: 2.6 }, { x: -5.7, z: R + 4.5, hw: 0.55, hd: 1.4, h: 1 }, { x: -4.5, z: R + 4.5, r: 0.3, h: 0.6 }, { x: 6.5, z: R, r: 0.3, h: 1.4 }],
  apartment: [{ x: -4.8, z: R - 1, hw: 1.6, hd: 2.4, h: 0.8 }, { x: 0, z: R - 7, hw: 1.9, hd: 0.7, h: 1 }, { x: -2.85, z: R - 3, r: 0.3, h: 0.9 },
    { x: 4.8, z: R + 6.9, hw: 1.6, hd: 0.4, h: 1 }, { x: -6.72, z: R + 4.6, hw: 0.25, hd: 1.2, h: 2.2 }, { x: 3.4, z: R - 2.6, r: 0.5, h: 0.7 }, { x: 5.9, z: R + 4, r: 0.4, h: 1.2 }],
  dorm: [{ x: -5.4, z: R - 3, hw: 1.1, hd: 2.2, h: 0.8 }, { x: 5.6, z: R - 5.8, hw: 0.8, hd: 1.4, h: 2.4 }, { x: 0, z: R - 7, hw: 1.6, hd: 0.7, h: 1 },
    { x: 2.35, z: R - 7.35, r: 0.4, h: 0.9 }, { x: 3.2, z: R - 0.6, r: 0.5, h: 0.7 }, { x: 6.72, z: R + 0.2, hw: 0.25, hd: 1, h: 1.2 }, { x: -5.6, z: R + 4.6, hw: 0.3, hd: 1, h: 1.6 }, { x: -3.6, z: R + 6, r: 0.3, h: 0.5 }],
  lab: [{ x: -6.1, z: R - 2, hw: 0.6, hd: 4.6, h: 2.6 }, { x: 0, z: R + 1.5, r: 1.3, h: 1 }, { x: 6.2, z: R + 4, hw: 0.6, hd: 1.8, h: 1.6 }],
  studio: [{ x: 0, z: R - 6.6, hw: 2.4, hd: 0.9, h: 1 }, { x: 4.8, z: R - 1.4, r: 0.8, h: 2 }, { x: -5.9, z: R + 3.2, hw: 0.55, hd: 1.2, h: 1 }, { x: -4.6, z: R + 3.2, r: 0.3, h: 0.6 },
    { x: 6.72, z: R + 4.8, hw: 0.25, hd: 1.2, h: 2.4 }, { x: 2.8, z: R + 2, r: 0.35, h: 1.4 }, { x: -5.9, z: R - 6.9, r: 0.5, h: 1.6 }],
}

// placeholder kalau src foto kosong
const placeholderCache = new Map()
export function photoSrc(item) {
  if (item.src) return item.src
  if (placeholderCache.has(item.index)) return placeholderCache.get(item.index)
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 440
  const g = c.getContext('2d')
  const hue = (item.index * 47 + 320) % 360
  const grad = g.createLinearGradient(0, 0, 640, 440)
  grad.addColorStop(0, `hsl(${hue}, 45%, 58%)`)
  grad.addColorStop(1, `hsl(${(hue + 40) % 360}, 50%, 26%)`)
  g.fillStyle = grad
  g.fillRect(0, 0, 640, 440)
  g.fillStyle = 'rgba(255,255,255,0.88)'
  g.font = '600 34px Inter, sans-serif'
  g.textAlign = 'center'
  g.fillText(`Photo ${item.index + 1}`, 320, 210)
  g.font = '400 20px Inter, sans-serif'
  g.fillText('replace it in src/data.js', 320, 250)
  const url = c.toDataURL('image/jpeg', 0.85)
  placeholderCache.set(item.index, url)
  return url
}
