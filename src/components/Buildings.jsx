import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { curvedRoof, tileTexture } from '../geometry'
import { B } from './Props'
import { buildingSpots, makeFacadeMaterial } from '../world'

// Semua gedung digambar dengan bagian depan menghadap +z (lokal), lalu diputar menghadap jalan.
// Lebar 9 (sepanjang jalan), dalam 7.
const W = 9
const D = 7
const WARM = '#ffcf94'
const dummy = new THREE.Object3D()

function Glow({ p, s, c = WARM, i = 1.2 }) {
  return (
    <mesh position={p}>
      <planeGeometry args={s} />
      <meshStandardMaterial color="#1a1612" emissive={c} emissiveIntensity={i} roughness={0.3} />
    </mesh>
  )
}

// jendela shoji: kisi kayu di depan kertas yang menyala
function shojiTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#fff'
  g.fillRect(0, 0, 256, 256)
  g.fillStyle = '#000'
  for (let i = 0; i <= 4; i++) g.fillRect(i * 63, 0, 5, 256)
  for (let i = 0; i <= 6; i++) g.fillRect(0, i * 42, 256, 5)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Slats({ x0, x1, y, h, z, step = 0.2 }) {
  const ref = useRef()
  const n = Math.floor((x1 - x0) / step)
  useLayoutEffect(() => {
    for (let i = 0; i < n; i++) {
      dummy.position.set(x0 + i * step, y, z)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [n, x0, y, z, step])
  return (
    <instancedMesh ref={ref} args={[null, null, n]} castShadow>
      <boxGeometry args={[0.07, h, 0.08]} />
      <meshStandardMaterial color="#6e4f35" roughness={0.75} />
    </instancedMesh>
  )
}

function House() {
  const shoji = useMemo(() => shojiTexture(), [])
  const roof = useMemo(() => curvedRoof(9.6, 7.6, 1.5, 0.2, 1.4), [])
  const tiles = useMemo(() => tileTexture(9.6 / 0.26, 14), [])
  return (
    <group>
      <B p={[0, 1.6, 0]} s={[W, 3.2, D]} c="#e8e1d4" r={0.95} />
      <B p={[0, 4.65, -0.3]} s={[7.8, 2.9, 6.2]} c="#2a2420" r={0.85} />
      <Slats x0={-3.8} x1={3.85} y={4.65} h={2.9} z={2.86} />
      <Glow p={[0, 4.75, 2.82]} s={[3.2, 1.1]} i={0.9} />
      <mesh geometry={roof} position={[0, 6.1, -0.3]} castShadow>
        <meshStandardMaterial map={tiles} roughness={0.5} metalness={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* atap kecil di atas teras */}
      <B p={[0, 3.32, 4.05]} s={[9.6, 0.12, 1.3]} c="#26282c" r={0.5} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 2.75, 1.45, D / 2 + 0.02]}>
            <planeGeometry args={[2.7, 2.1]} />
            <meshStandardMaterial color="#2b2118" emissive={WARM} emissiveMap={shoji} emissiveIntensity={1.1} map={shoji} />
          </mesh>
          <B p={[s * 4.55, 1.7, 4.55]} s={[0.16, 3.3, 0.16]} c="#3a2a1d" />
        </group>
      ))}
      {/* engawa (teras kayu) */}
      <B p={[0, 0.22, 4.15]} s={[9.4, 0.16, 1.3]} c="#7a5a3c" r={0.65} />
    </group>
  )
}

function Office({ mat }) {
  return (
    <group>
      <mesh material={mat} position={[0, 3.6 + 7.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, 15.4, D]} />
      </mesh>
      <B p={[0, 1.8, -0.4]} s={[W - 0.6, 3.6, D - 0.8]} c="#20262c" r={0.6} />
      <mesh position={[0, 1.8, D / 2 - 0.39]}>
        <planeGeometry args={[W - 0.8, 3.4]} />
        <meshStandardMaterial color="#1c2630" emissive="#ffd7a3" emissiveIntensity={0.45} roughness={0.08} metalness={0.6} />
      </mesh>
      {[-1, 1].map((s) => <B key={s} p={[s * (W / 2 - 0.25), 1.8, D / 2 - 0.25]} s={[0.4, 3.6, 0.4]} c="#2b3036" m={0.4} r={0.5} />)}
      <B p={[0, 3.55, D / 2 + 0.5]} s={[4.2, 0.14, 1.6]} c="#1b1e22" m={0.5} r={0.4} />
      <B p={[0, 19.3, 0]} s={[W + 0.2, 0.6, D + 0.2]} c="#1b1e22" m={0.5} r={0.4} />
    </group>
  )
}

function Apartment({ mat }) {
  const floors = []
  for (let f = 1; f < 8; f++) floors.push(3.6 + f * 3.2 - 3.2)
  return (
    <group>
      <mesh material={mat} position={[0, 3.6 + 10.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, 20.4, D]} />
      </mesh>
      <B p={[0, 1.8, -0.3]} s={[W - 0.4, 3.6, D - 0.6]} c="#3a3a3c" r={0.8} />
      <Glow p={[0, 1.6, D / 2 - 0.29]} s={[W - 1.2, 2.8]} i={0.5} />
      {floors.map((y) => (
        <group key={y}>
          <B p={[0, y, D / 2 + 0.55]} s={[W - 0.8, 0.14, 1.1]} c="#a9a49b" r={0.9} />
          <mesh position={[0, y + 0.5, D / 2 + 1.08]}>
            <boxGeometry args={[W - 0.8, 0.9, 0.03]} />
            <meshStandardMaterial color="#9fc6d6" transparent opacity={0.28} roughness={0.05} metalness={0.4} />
          </mesh>
        </group>
      ))}
      <B p={[0, 24.2, 0]} s={[W + 0.2, 0.4, D + 0.2]} c="#55565a" />
    </group>
  )
}

function Dorm() {
  const doorsCols = ['#c8553d', '#3d6fc8', '#3da67a']
  return (
    <group>
      <B p={[0, 4.8, -0.5]} s={[W, 9.6, 6]} c="#e1d3ba" r={0.95} />
      {[3.2, 6.4].map((y) => (
        <group key={y}>
          <B p={[0, y, 3.2]} s={[W, 0.16, 1.4]} c="#b9ad98" />
          <B p={[0, y + 1, 3.85]} s={[W, 0.07, 0.06]} c="#2c2e33" m={0.5} />
          <B p={[0, y + 0.55, 3.86]} s={[W, 0.03, 0.03]} c="#2c2e33" m={0.5} />
          {[-4.4, -2.2, 0, 2.2, 4.4].map((x) => <B key={x} p={[x, y + 0.5, 3.85]} s={[0.06, 1, 0.06]} c="#2c2e33" m={0.5} />)}
          {[-3, 0, 3].map((x, i) => (
            <group key={x}>
              <B p={[x, y + 1.15, 2.53]} s={[1, 2.1, 0.06]} c={doorsCols[i]} r={0.5} />
              <Glow p={[x + 1.25, y + 1.55, 2.53]} s={[0.8, 0.7]} i={i === 1 ? 0.3 : 1.1} />
            </group>
          ))}
        </group>
      ))}
      {[-3, 3].map((x) => <Glow key={x} p={[x, 1.5, 2.53]} s={[1.6, 1.2]} i={0.9} />)}
      {/* tangga luar */}
      <mesh position={[W / 2 + 0.7, 1.6, 0.6]} rotation-x={-0.62} castShadow>
        <boxGeometry args={[1.2, 0.2, 5.6]} />
        <meshStandardMaterial color="#6d6a64" roughness={0.9} />
      </mesh>
      <B p={[0, 9.75, -0.5]} s={[W + 0.3, 0.3, 6.3]} c="#4a4038" />
    </group>
  )
}

function Lab() {
  return (
    <group>
      <B p={[0, 6, 0]} s={[W, 12, D]} c="#3a3f46" r={0.55} m={0.3} />
      {[3, 6, 9].map((y) => (
        <group key={y}>
          <B p={[0, y, D / 2 + 0.02]} s={[W, 0.08, 0.04]} c="#0a0a0a" e="#5fe0ff" ei={3} cast={false} />
          <Glow p={[0, y + 1.3, D / 2 + 0.01]} s={[W - 1.4, 1.4]} c="#b6e9ff" i={0.35} />
        </group>
      ))}
      <mesh position={[0, 1.4, D / 2 + 0.01]}>
        <planeGeometry args={[W - 1, 2.6]} />
        <meshStandardMaterial color="#14202a" emissive="#9fdcff" emissiveIntensity={0.4} roughness={0.1} metalness={0.6} />
      </mesh>
      {/* parabola & antena di atap */}
      <mesh position={[2, 13.2, -1]} rotation={[-0.7, 0.4, 0]} castShadow>
        <sphereGeometry args={[1.4, 24, 12, 0, Math.PI * 2, 0, 0.9]} />
        <meshStandardMaterial color="#d9dcdf" roughness={0.5} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <B p={[2, 12.4, -1]} s={[0.3, 0.8, 0.3]} c="#555" />
      <B p={[-2.6, 14, -1.5]} s={[0.08, 4, 0.08]} c="#ccc" m={0.7} />
      <mesh position={[-2.6, 16.1, -1.5]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshBasicMaterial color="#ff3b2f" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Studio() {
  return (
    <group>
      <B p={[0, 2.5, 0]} s={[W, 5, D]} c="#6e3b2c" r={0.95} />
      {/* atap gergaji dengan kaca yang menyala */}
      {[-3, 0, 3].map((x) => (
        <group key={x}>
          <mesh position={[x, 5.65, 0]} rotation-z={0.42} castShadow>
            <boxGeometry args={[3.3, 0.14, D + 0.3]} />
            <meshStandardMaterial color="#2c2e33" roughness={0.6} />
          </mesh>
          <mesh position={[x + 1.48, 5.65, 0]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[D, 1.25]} />
            <meshStandardMaterial color="#1a1612" emissive={WARM} emissiveIntensity={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {/* kaca depan besar dengan kusen */}
      <Glow p={[0, 2.4, D / 2 + 0.02]} s={[7.6, 3.6]} i={0.8} />
      {[-3.8, -1.9, 1.9, 3.8].map((x) => <B key={x} p={[x, 2.4, D / 2 + 0.06]} s={[0.1, 3.7, 0.08]} c="#1b1c1f" />)}
      <B p={[0, 4.25, D / 2 + 0.06]} s={[7.7, 0.1, 0.08]} c="#1b1c1f" />
      <B p={[0, 0.58, D / 2 + 0.06]} s={[7.7, 0.1, 0.08]} c="#1b1c1f" />
    </group>
  )
}

const FRONT = { house: D / 2, office: D / 2, apartment: D / 2, dorm: 2.5, lab: D / 2, studio: D / 2 }

function Building({ b, nearRef }) {
  const mat = useMemo(() => {
    const m = makeFacadeMaterial({ lit: 0.45, glow: 1.3, seed: b.index * 3 + 1 })
    m.color.set(b.interior === 'office' ? '#2f343c' : '#7d7a74')
    return m
  }, [b.index, b.interior])
  const ring = useRef()
  const arrow = useRef()
  const front = FRONT[b.interior] ?? D / 2
  const number = String(b.index + 1).padStart(2, '0')
  const rot = b.side < 0 ? Math.PI / 2 : -Math.PI / 2

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const near = nearRef.current === b.id
    ring.current.opacity = near ? 0.95 : 0.45 + Math.sin(t * 2.5 + b.index) * 0.15
    arrow.current.visible = near
    arrow.current.position.y = 1.6 + Math.sin(t * 3) * 0.12
    arrow.current.rotation.y = t * 1.5
  })

  const Style = { house: House, office: Office, apartment: Apartment, dorm: Dorm, lab: Lab, studio: Studio }[b.interior] ?? House

  return (
    <group>
      <group position={[b.center[0], 0, b.z]} rotation-y={rot}>
        <Style mat={mat} />
        {/* pintu masuk (sama untuk semua gedung) */}
        <group position={[0, 0, front + 0.03]}>
          <B p={[0, 1.3, 0]} s={[2, 2.6, 0.1]} c="#141518" m={0.4} r={0.4} />
          <mesh position={[0, 1.2, 0.06]}>
            <planeGeometry args={[1.6, 2.3]} />
            <meshStandardMaterial color="#1a1612" emissive="#ffe2b8" emissiveIntensity={1.3} />
          </mesh>
          <B p={[0, 2.66, 0.08]} s={[2, 0.05, 0.05]} c="#000" e={b.accent} ei={3} cast={false} />
        </group>
      </group>

      {/* papan nama berdiri di samping pintu */}
      <group position={[b.side * 7.6, 0, b.z + 2.4]} rotation-y={rot}>
        <B p={[0, 1.2, 0]} s={[1.3, 2.4, 0.14]} c="#1b1714" r={0.5} />
        <B p={[0, 2.38, 0.08]} s={[1.3, 0.04, 0.02]} c="#000" e={b.accent} ei={3} cast={false} />
        <Text position={[-0.52, 2.0, 0.08]} fontSize={0.36} color={b.accent} anchorX="left" anchorY="middle" fontWeight={700}>{number}</Text>
        <Text position={[-0.52, 1.66, 0.08]} fontSize={0.075} letterSpacing={0.2} color="#cfc7bb" anchorX="left" anchorY="middle">
          {b.category.toUpperCase()}
        </Text>
        <Text position={[-0.52, 1.48, 0.08]} fontSize={0.15} maxWidth={1.05} lineHeight={1.15} color="#ffffff" anchorX="left" anchorY="top" fontWeight={700}>
          {b.title}
        </Text>
        <Text position={[-0.52, 0.42, 0.08]} fontSize={0.07} letterSpacing={0.2} color={b.accent} anchorX="left" anchorY="middle">
          STEP IN TO ENTER →
        </Text>
      </group>

      {/* lingkaran masuk di depan pintu */}
      <mesh position={[b.door[0], 0.06, b.door[1]]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.8, 1.0, 48]} />
        <meshBasicMaterial ref={ring} color={b.accent} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={arrow} position={[b.door[0], 1.6, b.door[1]]} rotation-x={Math.PI}>
        <coneGeometry args={[0.18, 0.35, 4]} />
        <meshBasicMaterial color={b.accent} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function Buildings({ nearRef }) {
  return buildingSpots.map((b) => <Building key={b.id} b={b} nearRef={nearRef} />)
}
