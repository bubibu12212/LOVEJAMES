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

// tajuk pohon kota: beberapa gumpalan daun digabung
export function canopyGeometry() {
  const blobs = [
    [0, 3.1, 0, 1.05], [0.65, 2.85, 0.25, 0.75], [-0.6, 2.9, -0.2, 0.8],
    [0.15, 3.65, -0.2, 0.7], [-0.25, 2.65, 0.55, 0.65], [0.4, 2.6, -0.55, 0.6],
  ]
  const parts = blobs.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, 3).translate(x, y, z))
  return organic(parts, 0.2, 4)
}
