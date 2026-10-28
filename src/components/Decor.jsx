import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { B } from './Props'
import { rng } from '../world'

// Perabot kecil yang dipakai ulang di semua ruangan.
// Semua menghadap +z lokal; atur arah dengan prop rot (radian, putar sumbu y).

const dummy = new THREE.Object3D()
const color = new THREE.Color()
const BOOK_COLS = ['#c8553d', '#3d6fc8', '#e2b04a', '#3da67a', '#f1ece4', '#7a4fb0', '#1f2a36', '#d97a9c']

// deretan buku: satu instancedMesh per rak supaya ringan
function Books({ w, rows, rowH, depth, seed }) {
  const ref = useRef()
  const books = useMemo(() => {
    const r = rng(seed)
    const out = []
    rows.forEach((y) => {
      let x = -w / 2 + 0.05
      while (x < w / 2 - 0.12) {
        const bw = 0.05 + r() * 0.06
        const bh = rowH * (0.6 + r() * 0.3)
        if (r() > 0.12) out.push({ x: x + bw / 2, y: y + bh / 2, w: bw, h: bh, d: depth * (0.7 + r() * 0.2), c: BOOK_COLS[Math.floor(r() * BOOK_COLS.length)], tilt: r() > 0.92 ? 0.25 : 0 })
        x += bw + 0.008
      }
    })
    return out
  }, [w, rows, rowH, depth, seed])
  useLayoutEffect(() => {
    books.forEach((b, i) => {
      dummy.position.set(b.x, b.y, 0)
      dummy.rotation.set(0, 0, b.tilt)
      dummy.scale.set(b.w, b.h, b.d)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
      ref.current.setColorAt(i, color.set(b.c))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [books])
  return (
    <instancedMesh ref={ref} args={[null, null, books.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  )
}

export function Bookshelf({ p, rot = 0, w = 1.6, h = 2, d = 0.4, c = '#6e4f35', seed = 1 }) {
  const shelves = []
  const n = Math.max(2, Math.round(h / 0.45))
  for (let i = 0; i <= n; i++) shelves.push((i / n) * (h - 0.04))
  const rowH = h / n
  return (
    <group position={p} rotation-y={rot}>
      {shelves.map((y) => <B key={y} p={[0, y + 0.02, 0]} s={[w, 0.04, d]} c={c} />)}
      {[-1, 1].map((s) => <B key={s} p={[s * (w / 2 - 0.02), h / 2, 0]} s={[0.04, h, d]} c={c} />)}
      <B p={[0, h / 2, -d / 2 + 0.01]} s={[w, h, 0.02]} c={c} cast={false} />
      <Books w={w} rows={shelves.slice(0, -1).map((y) => y + 0.04)} rowH={rowH - 0.06} depth={d * 0.9} seed={seed} />
    </group>
  )
}

export function Chair({ p, rot = 0, c = '#2b2d31', office = false }) {
  return (
    <group position={p} rotation-y={rot}>
      <B p={[0, 0.48, 0]} s={[0.55, 0.08, 0.55]} c={c} r={0.8} />
      <B p={[0, 0.85, -0.25]} s={[0.55, 0.65, 0.07]} c={c} r={0.8} />
      {office ? (
        <>
          <B p={[0, 0.25, 0]} s={[0.06, 0.45, 0.06]} c="#888" m={0.8} r={0.3} />
          {[0, 1, 2, 3, 4].map((i) => (
            <B key={i} p={[Math.cos(i * 1.256) * 0.2, 0.04, Math.sin(i * 1.256) * 0.2]} s={[0.4, 0.04, 0.05]} c="#333" rotation-y={-i * 1.256} cast={false} />
          ))}
        </>
      ) : (
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <B key={`${x}${z}`} p={[x * 0.24, 0.23, z * 0.24]} s={[0.05, 0.46, 0.05]} c={c} />)
      )}
    </group>
  )
}

export function Armchair({ p, rot = 0, c = '#b07a5a' }) {
  return (
    <group position={p} rotation-y={rot}>
      <B p={[0, 0.25, 0]} s={[1, 0.4, 0.95]} c={c} r={0.95} />
      <B p={[0, 0.75, -0.38]} s={[1, 0.7, 0.2]} c={c} r={0.95} />
      {[-1, 1].map((s) => <B key={s} p={[s * 0.45, 0.55, 0]} s={[0.12, 0.35, 0.95]} c={c} r={0.95} />)}
      <B p={[0, 0.5, 0.05]} s={[0.75, 0.12, 0.7]} c="#efe6d8" r={1} />
    </group>
  )
}

export function Lamp({ p, h = 1.6, shade = '#f3e7cf', light = false }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.06, 20]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </mesh>
      <B p={[0, h / 2, 0]} s={[0.04, h, 0.04]} c="#222" m={0.6} cast={false} />
      <mesh position={[0, h + 0.1, 0]}>
        <cylinderGeometry args={[0.18, 0.26, 0.3, 20, 1, true]} />
        <meshStandardMaterial color={shade} emissive="#ffd79a" emissiveIntensity={1.3} side={THREE.DoubleSide} />
      </mesh>
      {light && <pointLight position={[0, h, 0]} intensity={2.5} distance={4} color="#ffcf94" />}
    </group>
  )
}

export function SideTable({ p, c = '#8a6748', h = 0.55, items = true }) {
  return (
    <group position={p}>
      <B p={[0, h, 0]} s={[0.55, 0.05, 0.55]} c={c} r={0.5} />
      <B p={[0, h / 2, 0]} s={[0.06, h, 0.06]} c={c} />
      {items && (
        <>
          <mesh position={[-0.1, h + 0.12, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.2, 14]} />
            <meshStandardMaterial color="#e9e1d4" roughness={0.4} />
          </mesh>
          <B p={[0.12, h + 0.04, 0.05]} s={[0.22, 0.04, 0.16]} c="#3d6fc8" cast={false} />
        </>
      )}
    </group>
  )
}

export function Rug({ p, w, d, c = '#c9b79a', round = false, border = '#8a6a4a' }) {
  return (
    <group position={p}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} receiveShadow>
        {round ? <circleGeometry args={[w / 2, 48]} /> : <planeGeometry args={[w, d]} />}
        <meshStandardMaterial color={border} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        {round ? <circleGeometry args={[w / 2 - 0.12, 48]} /> : <planeGeometry args={[w - 0.25, d - 0.25]} />}
        <meshStandardMaterial color={c} roughness={1} />
      </mesh>
    </group>
  )
}

// jam dinding dengan jarum yang bergerak sungguhan
export function Clock({ p, rot = 0, face = '#f5f1ea', rim = '#1b1c1f' }) {
  const hour = useRef()
  const min = useRef()
  useFrame(() => {
    const d = new Date()
    min.current.rotation.z = -(d.getMinutes() / 60) * Math.PI * 2
    hour.current.rotation.z = -((d.getHours() % 12) / 12 + d.getMinutes() / 720) * Math.PI * 2
  })
  return (
    <group position={p} rotation-y={rot}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 32]} />
        <meshStandardMaterial color={rim} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <circleGeometry args={[0.28, 32]} />
        <meshStandardMaterial color={face} />
      </mesh>
      <group ref={hour} position={[0, 0, 0.04]}><B p={[0, 0.07, 0]} s={[0.025, 0.15, 0.01]} c="#111" cast={false} /></group>
      <group ref={min} position={[0, 0, 0.045]}><B p={[0, 0.1, 0]} s={[0.015, 0.21, 0.01]} c="#111" cast={false} /></group>
    </group>
  )
}

export function WallShelf({ p, rot = 0, w = 1.4, c = '#7a5a3c', seed = 3 }) {
  return (
    <group position={p} rotation-y={rot}>
      <B p={[0, 0, 0]} s={[w, 0.04, 0.25]} c={c} />
      <group position={[-w * 0.15, 0.02, 0]}>
        <Books w={w * 0.6} rows={[0]} rowH={0.3} depth={0.2} seed={seed} />
      </group>
      <mesh position={[w * 0.35, 0.1, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.16, 12]} />
        <meshStandardMaterial color="#e9e4dc" />
      </mesh>
      <mesh position={[w * 0.35, 0.25, 0]} scale={[1, 0.8, 1]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color="#3f6b35" />
      </mesh>
    </group>
  )
}

export function Cabinet({ p, rot = 0, w = 1.6, h = 0.8, d = 0.45, c = '#e6d3b8', handle = '#8a7a66' }) {
  return (
    <group position={p} rotation-y={rot}>
      <B p={[0, h / 2, 0]} s={[w, h, d]} c={c} r={0.6} />
      {[-1, 1].map((s) => <B key={s} p={[s * w * 0.06, h * 0.6, d / 2 + 0.01]} s={[0.02, 0.18, 0.02]} c={handle} m={0.6} cast={false} />)}
      <B p={[0, h / 2, d / 2 + 0.005]} s={[0.01, h - 0.06, 0.01]} c={handle} cast={false} />
    </group>
  )
}

export function Beanbag({ p, c = '#e2b04a' }) {
  return (
    <mesh position={[p[0], 0.32, p[2]]} scale={[0.55, 0.36, 0.55]} castShadow>
      <sphereGeometry args={[1, 20, 14]} />
      <meshStandardMaterial color={c} roughness={0.95} />
    </mesh>
  )
}

// lampu gantung dari langit-langit
export function Pendant({ p, ceiling, c = '#1b1c1f', glow = '#ffd79a' }) {
  const len = ceiling - p[1]
  return (
    <group position={p}>
      <B p={[0, len / 2, 0]} s={[0.015, len, 0.015]} c="#222" cast={false} />
      <mesh>
        <sphereGeometry args={[0.25, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={c} side={THREE.DoubleSide} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
    </group>
  )
}

export function Counter({ p, rot = 0, w = 2.4, c = '#f1ece4', top = '#2b2d31' }) {
  return (
    <group position={p} rotation-y={rot}>
      <B p={[0, 0.45, 0]} s={[w, 0.9, 0.65]} c={c} r={0.6} />
      <B p={[0, 0.92, 0]} s={[w + 0.05, 0.05, 0.7]} c={top} r={0.3} m={0.2} />
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x * (w / 2.4), 1.0, 0]}>
          <cylinderGeometry args={[0.1, 0.08, 0.12, 14]} />
          <meshStandardMaterial color={x < 0 ? '#c8553d' : '#e9e4dc'} />
        </mesh>
      ))}
    </group>
  )
}

export function Whiteboard({ p, rot = 0, w = 2.2, h = 1.2, scribble = '#3d6fc8' }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 280
    const g = c.getContext('2d')
    g.fillStyle = '#fbfbfb'
    g.fillRect(0, 0, 512, 280)
    g.strokeStyle = scribble
    g.lineWidth = 4
    g.strokeRect(40, 40, 140, 70)
    g.strokeRect(300, 40, 160, 70)
    g.strokeRect(170, 170, 170, 70)
    g.beginPath(); g.moveTo(180, 75); g.lineTo(300, 75); g.moveTo(110, 110); g.lineTo(200, 170); g.moveTo(380, 110); g.lineTo(300, 170); g.stroke()
    g.fillStyle = '#c8553d'
    g.font = '600 22px Inter, Arial'
    g.fillText('IDEA → BUILD → SHIP', 140, 150)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [scribble])
  return (
    <group position={p} rotation-y={rot}>
      <B p={[0, 0, -0.02]} s={[w + 0.08, h + 0.08, 0.03]} c="#b9bec4" m={0.6} cast={false} />
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}
