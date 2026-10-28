import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// noise halus sederhana, supaya bentuk daun tidak bulat sempurna
function noise(x, y, z) {
  return (
    Math.sin(x * 2.1 + y * 1.3) * Math.sin(y * 2.7 + z * 1.9) * 0.6 +
    Math.sin(x * 5.3 - z * 4.1 + y * 0.7) * 0.4
  )
}

// gabung beberapa bentuk, lalu buat permukaannya bergelombang dan bergradasi (bawah lebih gelap)
function organic(parts, amount, top) {
  let g = mergeGeometries(parts)
  g.deleteAttribute('uv')
  g.deleteAttribute('normal')
  g = mergeVertices(g)
  const pos = g.attributes.position
  const cols = []
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = noise(v.x, v.y, v.z)
    const r = Math.hypot(v.x, v.z) || 1
    v.x += (v.x / r) * n * amount
    v.z += (v.z / r) * n * amount
    v.y += n * amount * 0.4
    pos.setXYZ(i, v.x, v.y, v.z)
    const shade = THREE.MathUtils.clamp(0.45 + (v.y / top) * 0.55 + n * 0.12, 0.3, 1.1)
    cols.push(shade, shade, shade)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  g.computeVertexNormals()
  return g
}

// batu taman: bulatan pipih yang permukaannya tidak rata
export function rockGeometry(seed = 1) {
  const g = new THREE.IcosahedronGeometry(1, 2).scale(1, 0.55, 0.8).translate(seed * 0.01, 0.2, 0)
  return organic([g], 0.16, 0.8)
}

// semak azalea yang dipangkas bulat (khas taman Jepang)
export function bushGeometry() {
  const parts = [new THREE.IcosahedronGeometry(1, 3).scale(1.2, 0.7, 1).translate(0, 0.5, 0)]
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    parts.push(new THREE.IcosahedronGeometry(0.55, 2).translate(Math.cos(a) * 0.8, 0.45, Math.sin(a) * 0.7))
  }
  return organic(parts, 0.08, 1.2)
}

// atap Jepang: melengkung cekung dari bubungan ke tepi, ujung-ujungnya sedikit naik
// len = panjang sepanjang x, depth = lebar dari depan ke belakang, rise = tinggi bubungan
export function curvedRoof(len, depth, rise, upturn = 0.35, sag = 1.7) {
  const g = new THREE.PlaneGeometry(len, depth, 32, 16)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const t = Math.abs(pos.getZ(i)) / (depth / 2)
    const u = Math.abs(pos.getX(i)) / (len / 2)
    pos.setY(i, rise * Math.pow(1 - t, sag) + upturn * Math.pow(u, 3) * (0.4 + t))
  }
  g.computeVertexNormals()
  return g
}

// balok yang kedua ujungnya melengkung ke atas
export function curvedBeam(len, h, d, lift) {
  const g = new THREE.BoxGeometry(len, h, d, 24, 1, 1)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / (len / 2)
    pos.setY(i, pos.getY(i) + Math.pow(Math.abs(x), 2.4) * lift)
  }
  g.computeVertexNormals()
  return g
}

// tekstur genteng: alur vertikal (arah turun atap) + garis baris
export function tileTexture(repeatX, repeatY) {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 64, 0)
  grad.addColorStop(0, '#3a3e45')
  grad.addColorStop(0.45, '#5a5f68')
  grad.addColorStop(0.55, '#4a4e56')
  grad.addColorStop(1, '#25282d')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  g.fillStyle = 'rgba(0,0,0,0.35)'
  g.fillRect(0, 60, 64, 4)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeatX, repeatY)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
