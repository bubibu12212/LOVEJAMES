import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { trees, pathPoints, distToPath, rng, applyWind } from '../world'
import { stations } from '../data'

const dummy = new THREE.Object3D()
const color = new THREE.Color()

// noise halus sederhana, supaya bentuk daun/batu tidak bulat sempurna
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

function pineGeometry() {
  // [jari-jari, tinggi, posisi y] tiap tingkat daun, dari bawah ke atas
  const tiers = [[1.45, 1.7, 1.45], [1.2, 1.6, 2.2], [0.95, 1.45, 2.9], [0.68, 1.25, 3.5], [0.4, 1, 4.0]]
  const parts = tiers.map(([r, h, y], i) => {
    const c = new THREE.ConeGeometry(r, h, 12, 4)
    c.rotateY(i * 0.8)
    c.translate(0, y, 0)
    return c
  })
  return organic(parts, 0.16, 4.5)
}

function blobGeometry(blobs, top) {
  const parts = blobs.map(([x, y, z, r]) => {
    const s = new THREE.IcosahedronGeometry(r, 3)
    s.translate(x, y, z)
    return s
  })
  return organic(parts, 0.22, top)
}

const leafyBlobs = [
  [0, 2.75, 0, 1.15], [0.75, 2.45, 0.3, 0.85], [-0.7, 2.5, -0.2, 0.9],
  [0.2, 3.35, -0.25, 0.8], [-0.3, 2.2, 0.65, 0.75], [0.45, 2.15, -0.65, 0.7],
]
const bushBlobs = [[0, 0.35, 0, 0.5], [0.45, 0.28, 0.15, 0.38], [-0.4, 0.3, -0.1, 0.4], [0.05, 0.25, 0.45, 0.33]]

function foliageMaterial(wind) {
  return applyWind(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }), wind, 4)
}

function finish(...refs) {
  refs.forEach((r) => {
    r.current.instanceMatrix.needsUpdate = true
    if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true
    r.current.computeBoundingSphere()
  })
}

function nearHouse(x, z, r) {
  return stations.some((s) => Math.hypot(x - s.pos[0], z - s.pos[2]) < r)
}

export function Ground() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(200, 200, 160, 160)
    const pos = g.attributes.position
    const cols = []
    const a = new THREE.Color('#3f6b2a')
    const b = new THREE.Color('#5d8a37')
    const dirt = new THREE.Color('#6e5b3c')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const n = noise(x * 0.15, 0, y * 0.15) * 0.5 + 0.5
      const d = Math.max(0, noise(x * 0.07 + 3, 1, y * 0.07) - 0.55) * 2
      color.copy(a).lerp(b, n).lerp(dirt, Math.min(d, 0.6))
      cols.push(color.r, color.g, color.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    return g
  }, [])

  return (
    <mesh geometry={geo} rotation-x={-Math.PI / 2} position={[0, 0, -30]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  )
}

export function Path() {
  const ref = useRef()
  useLayoutEffect(() => {
    pathPoints.forEach((p, i) => {
      dummy.position.set(p.x + Math.sin(i * 12.9) * 0.25, 0.015, p.z + Math.cos(i * 7.7) * 0.25)
      const s = 0.95 + (Math.sin(i * 3.3) * 0.5 + 0.5) * 0.45
      dummy.scale.set(s, 1, s)
      dummy.rotation.set(0, i, 0)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
      ref.current.setColorAt(i, color.setHSL(0.09, 0.28, 0.36 + Math.sin(i * 5.1) * 0.03))
    })
    finish(ref)
  }, [])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pathPoints.length]} receiveShadow>
      <cylinderGeometry args={[1, 1, 0.02, 18]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  )
}

const GRASS = 18000
export function Grass() {
  const ref = useRef()
  const [geo, mat] = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.07, 0.5, 1, 4)
    g.translate(0, 0.25, 0)
    const pos = g.attributes.position
    const cols = []
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 0.5
      pos.setX(i, pos.getX(i) * (1 - y * 0.85))
      pos.setZ(i, y * y * 0.08) // ujung sedikit melengkung
      const c = 0.35 + y * 0.75
      cols.push(c, c, c)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    g.computeVertexNormals()
    const m = applyWind(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 }), 0.22)
    return [g, m]
  }, [])

  useLayoutEffect(() => {
    const rand = rng(7)
    let n = 0
    for (let tries = 0; n < GRASS && tries < GRASS * 4; tries++) {
      const x = (rand() - 0.5) * 50
      const z = 10 - rand() * 55
      if (Math.abs(z) < 0.45 && Math.abs(x) > 2.6) continue // tembok
      if (nearHouse(x, z, 1.7)) continue
      if (distToPath(x, z) < 1.15) continue
      dummy.position.set(x, 0, z)
      dummy.rotation.set((rand() - 0.5) * 0.3, rand() * Math.PI, (rand() - 0.5) * 0.3)
      const s = 0.55 + rand() * 0.6
      dummy.scale.set(s, s * (0.45 + rand() * 0.55), s)
      dummy.updateMatrix()
      ref.current.setMatrixAt(n, dummy.matrix)
      ref.current.setColorAt(n, color.setHSL(0.21 + rand() * 0.07, 0.45 + rand() * 0.15, 0.3 + rand() * 0.12))
      n++
    }
    ref.current.count = n
    finish(ref)
  }, [])

  return <instancedMesh ref={ref} args={[geo, mat, GRASS]} receiveShadow />
}

export function Rocks() {
  const ref = useRef()
  const geo = useMemo(() => organic([new THREE.DodecahedronGeometry(1, 2)], 0.18, 1), [])
  const count = 70

  useLayoutEffect(() => {
    const rand = rng(23)
    let n = 0
    for (let tries = 0; n < count && tries < 2000; tries++) {
      const x = (rand() - 0.5) * 40
      const z = 8 - rand() * 50
      if (nearHouse(x, z, 3) || distToPath(x, z) < 1.4 || Math.abs(z) < 0.8) continue
      const s = 0.12 + rand() * 0.35
      dummy.position.set(x, s * 0.25, z)
      dummy.rotation.set(rand(), rand() * 6, rand())
      dummy.scale.set(s * (1 + rand() * 0.5), s * 0.6, s)
      dummy.updateMatrix()
      ref.current.setMatrixAt(n, dummy.matrix)
      ref.current.setColorAt(n, color.setHSL(0.1, 0.05, 0.38 + rand() * 0.15))
      n++
    }
    ref.current.count = n
    finish(ref)
  }, [])

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </instancedMesh>
  )
}

export default function Forest() {
  const trunk = useRef()
  const pine = useRef()
  const leafy = useRef()
  const bush = useRef()
  const pines = useMemo(() => trees.filter((t) => t.type === 0), [])
  const leafies = useMemo(() => trees.filter((t) => t.type === 1), [])
  const geos = useMemo(() => ({
    pine: pineGeometry(),
    leafy: blobGeometry(leafyBlobs, 3.8),
    bush: blobGeometry(bushBlobs, 0.8),
    trunk: new THREE.CylinderGeometry(0.12, 0.24, 2.6, 8).translate(0, 1.3, 0),
  }), [])
  const mats = useMemo(() => ({ pine: foliageMaterial(0.012), leafy: foliageMaterial(0.02), bush: foliageMaterial(0.04) }), [])

  const bushes = useMemo(() => {
    const rand = rng(31)
    const out = []
    for (let tries = 0; out.length < 160 && tries < 4000; tries++) {
      const x = (rand() - 0.5) * 44
      const z = 9 - rand() * 52
      if (Math.abs(z) < 1 || (z > -4 && Math.abs(x) < 4)) continue
      if (nearHouse(x, z, 2.6) || distToPath(x, z) < 1.8) continue
      out.push({ x, z, s: 0.6 + rand() * 0.9, r: rand() })
    }
    return out
  }, [])

  useLayoutEffect(() => {
    trees.forEach((t, i) => {
      const leafyTree = t.type === 1
      dummy.position.set(t.x, 0, t.z)
      dummy.rotation.set(0, t.shade * 6, 0)
      dummy.scale.set(t.s * (leafyTree ? 1.25 : 1), t.s * (leafyTree ? 1.15 : 1), t.s * (leafyTree ? 1.25 : 1))
      dummy.updateMatrix()
      trunk.current.setMatrixAt(i, dummy.matrix)
      trunk.current.setColorAt(i, color.setHSL(0.07, 0.3, 0.16 + t.shade * 0.06))
    })
    pines.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z)
      dummy.rotation.set(0, t.shade * 6, 0)
      dummy.scale.set(t.s, t.s * (1.1 + t.shade * 0.3), t.s)
      dummy.updateMatrix()
      pine.current.setMatrixAt(i, dummy.matrix)
      pine.current.setColorAt(i, color.setHSL(0.3 + t.shade * 0.05, 0.4, 0.17 + t.shade * 0.07))
    })
    leafies.forEach((t, i) => {
      dummy.position.set(t.x, 0, t.z)
      dummy.rotation.set(0, t.shade * 6, 0)
      dummy.scale.setScalar(t.s)
      dummy.updateMatrix()
      leafy.current.setMatrixAt(i, dummy.matrix)
      leafy.current.setColorAt(i, color.setHSL(0.2 + t.shade * 0.08, 0.45, 0.24 + t.shade * 0.09))
    })
    bushes.forEach((b, i) => {
      dummy.position.set(b.x, 0, b.z)
      dummy.rotation.set(0, b.r * 6, 0)
      dummy.scale.set(b.s, b.s * 0.85, b.s)
      dummy.updateMatrix()
      bush.current.setMatrixAt(i, dummy.matrix)
      bush.current.setColorAt(i, color.setHSL(0.24 + b.r * 0.06, 0.42, 0.22 + b.r * 0.08))
    })
    finish(trunk, pine, leafy, bush)
  }, [pines, leafies, bushes])

  return (
    <>
      <instancedMesh ref={trunk} args={[geos.trunk, undefined, trees.length]} castShadow receiveShadow>
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={pine} args={[geos.pine, mats.pine, pines.length]} castShadow receiveShadow />
      <instancedMesh ref={leafy} args={[geos.leafy, mats.leafy, leafies.length]} castShadow receiveShadow />
      <instancedMesh ref={bush} args={[geos.bush, mats.bush, bushes.length]} castShadow receiveShadow />
    </>
  )
}
