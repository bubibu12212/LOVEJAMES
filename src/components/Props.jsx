import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { curvedRoof, tileTexture } from '../geometry'
import { rng } from '../world'

const dummy = new THREE.Object3D()

// kotak sederhana: p = posisi, s = ukuran, c = warna, e = warna menyala
export function B({ p, s, c, r = 0.7, m = 0, e, ei = 1, cast = true, ...rest }) {
  return (
    <mesh position={p} castShadow={cast} receiveShadow {...rest}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={r} metalness={m} emissive={e ?? '#000000'} emissiveIntensity={e ? ei : 0} />
    </mesh>
  )
}

// ---------- lentera batu (tōrō) ----------
// dua geometri: batu & kotak api (menyala)
function lanternGeometries() {
  const stone = mergeGeometries([
    new THREE.CylinderGeometry(0.42, 0.5, 0.18, 6).translate(0, 0.09, 0),
    new THREE.CylinderGeometry(0.12, 0.15, 0.75, 8).translate(0, 0.55, 0),
    new THREE.CylinderGeometry(0.34, 0.2, 0.16, 6).translate(0, 1.0, 0),
    new THREE.CylinderGeometry(0.06, 0.62, 0.3, 6).translate(0, 1.58, 0),
    new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8).translate(0, 1.78, 0),
    new THREE.SphereGeometry(0.1, 10, 8).translate(0, 1.9, 0),
  ].map((g) => g.toNonIndexed()))
  const glow = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 6).translate(0, 1.24, 0)
  return { stone, glow }
}

export function StoneLanterns({ positions, scale = 1 }) {
  const { stone, glow } = useMemo(() => lanternGeometries(), [])
  const a = useRef()
  const b = useRef()
  useLayoutEffect(() => {
    positions.forEach(([x, z], i) => {
      dummy.position.set(x, 0, z)
      dummy.rotation.set(0, i * 0.7, 0)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      a.current.setMatrixAt(i, dummy.matrix)
      b.current.setMatrixAt(i, dummy.matrix)
    })
    a.current.instanceMatrix.needsUpdate = true
    b.current.instanceMatrix.needsUpdate = true
    a.current.computeBoundingSphere()
    b.current.computeBoundingSphere()
  }, [positions, scale])
  return (
    <group>
      <instancedMesh ref={a} args={[stone, null, positions.length]} castShadow receiveShadow>
        <meshStandardMaterial color="#8b8780" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={b} args={[glow, null, positions.length]}>
        <meshStandardMaterial color="#ffe2b0" emissive="#ffae5c" emissiveIntensity={2.2} roughness={0.8} />
      </instancedMesh>
    </group>
  )
}

// ---------- lentera kertas (chōchin) ----------
// on = ref angka 0..1 (seberapa terang), atau kosong = selalu menyala
export function PaperLantern({ position, onRef, color = '#e8382c', light = false }) {
  const mat = useRef()
  const pl = useRef()
  useFrame((state) => {
    const on = onRef ? onRef.current : 1
    const f = 0.93 + Math.sin(state.clock.elapsedTime * 8 + position[0]) * 0.05
    mat.current.emissiveIntensity = 0.12 + on * 1.6 * f
    if (pl.current) pl.current.intensity = on * 6 * f
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 4]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh scale={[1, 1.35, 1]}>
        <sphereGeometry args={[0.32, 20, 14]} />
        <meshStandardMaterial ref={mat} color={color} emissive="#ff7a3a" emissiveIntensity={0.12} roughness={0.9} />
      </mesh>
      {[-0.4, 0.4].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.07, 14]} />
          <meshStandardMaterial color="#141210" />
        </mesh>
      ))}
      {light && <pointLight ref={pl} position={[0, -0.2, 0.5]} distance={9} decay={1.6} color="#ff9a5a" intensity={0} />}
    </group>
  )
}

// ---------- tembok taman (tsuiji-bei): dasar batu, plester putih, atap genteng kecil ----------
function plasterTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#e9e3d7'
  g.fillRect(0, 0, 256, 128)
  const r = rng(9)
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(120,100,80,${r() * 0.05})`
    g.fillRect(r() * 256, r() * 128, 2, 2)
  }
  g.fillStyle = '#3a2b20' // tiang kayu
  g.fillRect(0, 0, 10, 128)
  g.fillStyle = 'rgba(80,60,40,0.18)' // noda air di bawah
  g.fillRect(0, 112, 256, 16)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// dinding dari titik a ke b (x, z)
export function Wall({ a, b, height = 2.6 }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const rot = -Math.atan2(b[1] - a[1], b[0] - a[0])
  const plaster = useMemo(() => {
    const t = plasterTexture()
    t.repeat.set(len / 3.2, 1)
    return t
  }, [len])
  const roof = useMemo(() => curvedRoof(len + 0.4, 1.5, 0.32, 0, 1.3), [len])
  const tiles = useMemo(() => tileTexture((len + 0.4) / 0.26, 4), [len])
  return (
    <group position={[(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]} rotation-y={rot}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 0.6, 0.95]} />
        <meshStandardMaterial color="#5f5d59" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.6 + height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, height, 0.7]} />
        <meshStandardMaterial map={plaster} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.6 + height - 0.12, 0]}>
        <boxGeometry args={[len + 0.02, 0.14, 0.74]} />
        <meshStandardMaterial color="#2c2119" roughness={0.7} />
      </mesh>
      <mesh geometry={roof} position={[0, 0.6 + height, 0]} castShadow>
        <meshStandardMaterial map={tiles} roughness={0.55} metalness={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.6 + height + 0.36, 0]}>
        <boxGeometry args={[len + 0.4, 0.14, 0.2]} />
        <meshStandardMaterial color="#25282d" roughness={0.5} />
      </mesh>
    </group>
  )
}
