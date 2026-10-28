import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { applyWind, rng } from '../world'

const MODEL = '/models/sakura_tree.glb'
const TREE_H = 7.2 // tinggi pohon (skala 1)
const SKIP = /Box002|Sandals/ // properti kecil bawaan model yang tidak dipakai
const dummy = new THREE.Object3D()

// Model aslinya terdiri dari ratusan mesh kecil. Digabung per material supaya
// semua pohon cukup digambar dengan 2 draw call (instancing).
function useMergedTree() {
  const { scene } = useGLTF(MODEL)
  return useMemo(() => {
    scene.updateMatrixWorld(true)
    const groups = new Map()
    scene.traverse((o) => {
      if (!o.isMesh || SKIP.test(o.name)) return
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld)
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k)
      if (!g.attributes.normal) g.computeVertexNormals()
      const list = groups.get(o.material) ?? []
      list.push(g.index ? g.toNonIndexed() : g)
      groups.set(o.material, list)
    })
    const parts = [...groups].map(([material, list]) => ({ material, geometry: mergeGeometries(list) }))

    // normalisasi: dasar batang di y = 0, tinggi = TREE_H
    const box = new THREE.Box3()
    parts.forEach((p) => { p.geometry.computeBoundingBox(); box.union(p.geometry.boundingBox) })
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const s = TREE_H / size.y
    parts.forEach((p) => {
      p.geometry.translate(-center.x, -box.min.y, -center.z).scale(s, s, s)
      p.geometry.computeBoundingSphere()
      const leaves = p.material.transparent || /Leaves/i.test(p.material.name)
      const m = new THREE.MeshStandardMaterial({
        map: p.material.map,
        roughness: 0.85,
        side: leaves ? THREE.DoubleSide : THREE.FrontSide,
        alphaTest: leaves ? 0.45 : 0,
      })
      if (leaves) {
        // bunga sedikit berpendar supaya tetap pink di malam hari
        m.emissive.set('#ff9fc4')
        m.emissiveMap = p.material.map
        m.emissiveIntensity = 0.28
        applyWind(m, 0.006)
      }
      p.material = m
      p.leaves = leaves
    })
    return parts
  }, [scene])
}

// trees = [{x, z, s, r}]
export function SakuraTrees({ trees }) {
  const parts = useMergedTree()
  const refs = useRef([])

  useLayoutEffect(() => {
    refs.current.forEach((mesh) => {
      if (!mesh) return
      trees.forEach((t, i) => {
        dummy.position.set(t.x, 0, t.z)
        dummy.rotation.set(0, t.r, 0)
        dummy.scale.setScalar(t.s)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    })
  }, [trees, parts])

  return parts.map((p, i) => (
    <instancedMesh
      key={i}
      ref={(m) => { refs.current[i] = m }}
      args={[p.geometry, p.material, trees.length]}
      castShadow
      receiveShadow={!p.leaves}
      frustumCulled={false}
    />
  ))
}

// kelopak sakura yang berjatuhan di sekitar pemain
const PETALS = 420
export function Petals({ followRef }) {
  const ref = useRef()
  const data = useMemo(() => {
    const r = rng(3)
    return Array.from({ length: PETALS }, () => ({
      x: (r() - 0.5) * 36, y: r() * 9, z: (r() - 0.5) * 36,
      sp: 0.35 + r() * 0.4, ph: r() * 6.28, spin: 1 + r() * 2,
    }))
  }, [])
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.09, 0.07)
    g.translate(0, 0, 0)
    return g
  }, [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const c = followRef.current?.position ?? { x: 0, z: 0 }
    const mesh = ref.current
    data.forEach((p, i) => {
      p.y -= p.sp * Math.min(dt, 0.05)
      if (p.y < 0) p.y += 9
      // posisi dibungkus di sekitar pemain supaya kelopak selalu terlihat
      let x = ((p.x - c.x + 18) % 36 + 36) % 36 - 18 + c.x
      let z = ((p.z - c.z + 18) % 36 + 36) % 36 - 18 + c.z
      x += Math.sin(t * 0.8 + p.ph) * 0.6
      z += Math.cos(t * 0.6 + p.ph) * 0.3
      dummy.position.set(x, p.y, z)
      dummy.rotation.set(t * p.spin + p.ph, t * p.spin * 0.7, p.ph)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, null, PETALS]} frustumCulled={false}>
      <meshStandardMaterial color="#ffc2d6" emissive="#ff8fb5" emissiveIntensity={0.35} side={THREE.DoubleSide} roughness={0.8} />
    </instancedMesh>
  )
}

useGLTF.preload(MODEL)
