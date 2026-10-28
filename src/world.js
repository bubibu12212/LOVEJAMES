import * as THREE from 'three'
import { stations, gallery } from './data'

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

// ===================== TATA KOTA =====================
export const AVENUE_HALF = 4.5        // setengah lebar boulevard pejalan kaki
export const FACADE_X = 8             // garis depan gedung project
export const CROSS_Z = -21            // jalan raya yang memotong boulevard
export const ROAD_W = 7
export const SIDE_AVENUE_X = 21.5     // jalan raya di belakang gedung project
export const GALLERY = { z: -55, front: -46.5, ring: [0, -43.4] }
export const PLAYER_START = [0, 0, -6.5]
export const CITY_BOUNDS = { minX: -7.3, maxX: 7.3, minZ: -44.8, maxZ: 8 }

const ACCENTS = ['#ff3b2f', '#ff8a3d', '#ff4f8b', '#ffd25e', '#5fe0ff', '#c58bff']
export const stationSpots = stations.map((s, i) => ({
  accent: ACCENTS[i % ACCENTS.length],
  ...s,
  center: [s.side * 13, s.z],
  ring: [s.side * 6.2, s.z],
}))

// gedung latar (bukan gedung project)
const rand = rng(5)
export const towers = []
function addTower(x, z, w, d, h) {
  towers.push({ x, z, w, d, h, tint: rand(), seed: rand() })
}
function blocked(x, z, w, d) {
  const hit = (cx, cz, hw, hd) => Math.abs(x - cx) < w / 2 + hw && Math.abs(z - cz) < d / 2 + hd
  if (hit(0, CROSS_Z, 200, ROAD_W / 2 + 0.5)) return true
  if (hit(0, -64, 200, ROAD_W / 2)) return true
  if (hit(SIDE_AVENUE_X, 0, ROAD_W / 2 + 0.5, 300) || hit(-SIDE_AVENUE_X, 0, ROAD_W / 2 + 0.5, 300)) return true
  if (hit(0, 0, 60, 1.5)) return true // tembok kota
  if (hit(0, GALLERY.z, 10, 9.5)) return true
  return stationSpots.some((s) => hit(s.center[0], s.center[1], 5.5, 5))
}
// barisan di samping gedung project
for (const side of [-1, 1]) {
  for (let z = -3; z > -60; z -= 7) {
    const w = 8 + rand() * 2
    const d = 5.5 + rand() * 1.5
    const x = side * (FACADE_X + 0.5 + w / 2)
    if (z > -2 || blocked(x, z, w, d)) continue
    addTower(x, z, w, d, 9 + rand() * 18)
  }
}
// blok-blok kota di sekelilingnya
for (let gx = -90; gx <= 90; gx += 11) {
  for (let gz = 40; gz >= -150; gz -= 11) {
    if (Math.abs(gx) < 25 && gz > -66) continue
    const w = 6 + rand() * 4
    const d = 6 + rand() * 4
    const x = gx + (rand() - 0.5) * 2
    const z = gz + (rand() - 0.5) * 2
    if (blocked(x, z, w, d)) continue
    const far = Math.hypot(x, z + 30) / 90
    addTower(x, z, w, d, 12 + rand() * 30 + far * 40 * rand())
  }
}

// lampu jalan & pot pohon di boulevard
export const lamps = []
export const planters = []
for (let z = -4; z > -44; z -= 8) {
  if (Math.abs(z - CROSS_Z) < 5) continue
  lamps.push([-AVENUE_HALF + 0.3, z], [AVENUE_HALF - 0.3, z])
}
for (let z = -8; z > -42; z -= 10) {
  if (Math.abs(z - CROSS_Z) < 6) continue
  planters.push([-2.2, z - 4], [2.2, z - 4])
}

// lingkaran tabrakan {x, z, r, h} (h = tinggi, dipakai kamera)
export const cityObstacles = []
lamps.forEach(([x, z]) => cityObstacles.push({ x, z, r: 0.2, h: 5 }))
planters.forEach(([x, z]) => cityObstacles.push({ x, z, r: 0.95, h: 1 }))
for (const side of [-1, 1]) {
  cityObstacles.push({ x: side * 4.05, z: 0, r: 0.8, h: 9.5 }) // pilar torii
  for (let x = 5.2; x <= 9; x += 0.6) cityObstacles.push({ x: side * x, z: 0, r: 0.45, h: 2.4 }) // pagar
}

// ===================== RUANG GALERI =====================
// Ruangan diletakkan jauh dari kota (z = 200) supaya tidak saling tabrak.
export const ROOM = { cx: 0, cz: 200, halfW: 8, halfD: 10, height: 5 }
export const ROOM_BOUNDS = { minX: -7.3, maxX: 7.3, minZ: ROOM.cz - 9.3, maxZ: ROOM.cz + 9.3 }
export const ROOM_SPAWN = [0, 0, ROOM.cz + 6]
export const ROOM_EXIT = [0, ROOM.cz + 8.6]
export const CITY_RETURN = [0, 0, GALLERY.ring[1] + 3.5]
export const roomObstacles = [{ x: 0, z: ROOM.cz - 1, r: 1.35, h: 1 }] // bangku di tengah

// posisi foto di dinding: kiri (depan→belakang), belakang, kanan (belakang→depan)
const slots = [
  ...[5, 1, -3, -7].map((dz) => ({ x: -ROOM.halfW + 0.06, z: ROOM.cz + dz, rot: Math.PI / 2, nx: 1, nz: 0 })),
  ...[-4.6, 0, 4.6].map((x) => ({ x, z: ROOM.cz - ROOM.halfD + 0.06, rot: 0, nx: 0, nz: 1 })),
  ...[-7, -3, 1, 5].map((dz) => ({ x: ROOM.halfW - 0.06, z: ROOM.cz + dz, rot: -Math.PI / 2, nx: -1, nz: 0 })),
]
export const photoSpots = gallery.slice(0, slots.length).map((g, i) => ({ ...g, index: i, ...slots[i] }))

// placeholder kalau src foto kosong
const placeholderCache = new Map()
export function photoSrc(item) {
  if (item.src) return item.src
  if (placeholderCache.has(item.index)) return placeholderCache.get(item.index)
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 440
  const g = c.getContext('2d')
  const hue = (item.index * 47 + 190) % 360
  const grad = g.createLinearGradient(0, 0, 640, 440)
  grad.addColorStop(0, `hsl(${hue}, 45%, 62%)`)
  grad.addColorStop(1, `hsl(${(hue + 40) % 360}, 50%, 32%)`)
  g.fillStyle = grad
  g.fillRect(0, 0, 640, 440)
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.font = '600 34px Inter, sans-serif'
  g.textAlign = 'center'
  g.fillText(`Foto ${item.index + 1}`, 320, 210)
  g.font = '400 20px Inter, sans-serif'
  g.fillText('ganti di src/data.js', 320, 250)
  const url = c.toDataURL('image/jpeg', 0.85)
  placeholderCache.set(item.index, url)
  return url
}
