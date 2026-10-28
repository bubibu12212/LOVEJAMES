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

// tajuk pohon sakura: banyak gumpalan kecil di permukaan elips supaya terlihat rimbun, bukan bulat polos
export function canopyGeometry() {
  const parts = [new THREE.IcosahedronGeometry(0.95, 2).scale(1.25, 0.8, 1.25).translate(0, 3.15, 0)]
  let seed = 7
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 26; i++) {
    const t = r() * Math.PI * 2
    const u = r() * 0.9 - 0.25
    const rad = 1.35 * Math.sqrt(1 - u * u)
    const x = Math.cos(t) * rad
    const z = Math.sin(t) * rad
    const y = 3.15 + u * 1.05
    parts.push(new THREE.IcosahedronGeometry(0.28 + r() * 0.3, 1).translate(x, y, z))
  }
  return organic(parts, 0.1, 4.2)
}
