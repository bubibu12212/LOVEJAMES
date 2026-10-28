import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Tokyo Tower prosedural: rangka baja dengan pita oranye-putih, dua dek observasi, dan antena.
const LEG_TOP = 26           // titik kaki bertemu jadi tiang
const ORANGE = new THREE.Color('#ff4a1c')
const WHITE = new THREE.Color('#efe9df')
const UP = new THREE.Vector3(0, 1, 0)
const dummy = new THREE.Object3D()
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const dir = new THREE.Vector3()

// setengah lebar menara pada ketinggian y (melebar di bawah seperti aslinya)
const halfW = (y) => 0.45 + 5.4 * Math.pow(1 - Math.min(y, LEG_TOP) / LEG_TOP, 2.25)
const bandColor = (y) => (Math.floor(y / 2.4) % 2 === 0 ? ORANGE : WHITE)

function buildMembers() {
  const m = []
  const add = (p, q, r) => m.push({ p: p.clone(), q: q.clone(), r })
  const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
  const levels = []
  for (let y = 0; y <= LEG_TOP + 0.01; y += y < 12 ? 0.85 : 0.7) levels.push(y)
  for (let i = 0; i < levels.length - 1; i++) {
    const y0 = levels[i]
    const y1 = levels[i + 1]
    const w0 = halfW(y0)
    const w1 = halfW(y1)
    const legR = 0.05 + w0 * 0.035
    for (let c = 0; c < 4; c++) {
      const [sx, sz] = corners[c]
      const [nx, nz] = corners[(c + 1) % 4]
      // kaki
      add(a.set(sx * w0, y0, sz * w0), b.set(sx * w1, y1, sz * w1), legR)
      // balok horizontal
      add(a.set(sx * w0, y0, sz * w0), b.set(nx * w0, y0, nz * w0), 0.035)
      // silang X di tiap sisi
      add(a.set(sx * w0, y0, sz * w0), b.set(nx * w1, y1, nz * w1), 0.028)
      add(a.set(nx * w0, y0, nz * w0), b.set(sx * w1, y1, sz * w1), 0.028)
    }
  }
  // tiang atas (rangka kecil) sampai y 31
  for (let y = LEG_TOP; y < 31; y += 0.6) {
    for (let c = 0; c < 4; c++) {
      const [sx, sz] = corners[c]
      const [nx, nz] = corners[(c + 1) % 4]
      const w = 0.42 - (y - LEG_TOP) * 0.05
      add(a.set(sx * w, y, sz * w), b.set(sx * (w - 0.03), y + 0.6, sz * (w - 0.03)), 0.04)
      add(a.set(sx * w, y, sz * w), b.set(nx * (w - 0.03), y + 0.6, nz * (w - 0.03)), 0.02)
    }
  }
  return m
}

function windowRing(r, h, y, intensity = 1.1) {
  return (
    <mesh position={[0, y, 0]}>
      <cylinderGeometry args={[r, r, h, 8, 1, true]} />
      <meshStandardMaterial color="#20262c" emissive="#ffcf8f" emissiveIntensity={intensity} roughness={0.2} metalness={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function TokyoTower(props) {
  const ref = useRef()
  const beacons = useRef([])
  const members = useMemo(() => buildMembers(), [])
  const geo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6, 1), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.35, emissive: '#ff5a22', emissiveIntensity: 0.18 }), [])

  useLayoutEffect(() => {
    const color = new THREE.Color()
    members.forEach((m, i) => {
      dir.subVectors(m.q, m.p)
      const len = dir.length()
      dummy.position.addVectors(m.p, m.q).multiplyScalar(0.5)
      dummy.quaternion.setFromUnitVectors(UP, dir.normalize())
      dummy.scale.set(m.r, len, m.r)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
      ref.current.setColorAt(i, color.copy(bandColor(dummy.position.y)))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [members])

  // lampu penerbangan berkedip
  useFrame((state) => {
    const on = Math.sin(state.clock.elapsedTime * 3) > 0.2
    beacons.current.forEach((m) => { if (m) m.color.setRGB(on ? 6 : 0.6, on ? 0.6 : 0.06, on ? 0.4 : 0.04) })
  })

  return (
    <group {...props}>
      <instancedMesh ref={ref} args={[geo, mat, members.length]} castShadow />

      {/* dek observasi utama (dua tingkat) */}
      <mesh position={[0, 11.2, 0]}>
        <cylinderGeometry args={[3.05, 2.7, 0.9, 8]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.5} metalness={0.4} />
      </mesh>
      {windowRing(3.08, 0.55, 11.75)}
      <mesh position={[0, 12.55, 0]}>
        <cylinderGeometry args={[2.75, 3.1, 0.7, 8]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.5} metalness={0.4} />
      </mesh>
      {windowRing(2.8, 0.5, 13.05)}
      <mesh position={[0, 13.45, 0]}>
        <cylinderGeometry args={[2.2, 2.8, 0.35, 8]} />
        <meshStandardMaterial color="#ff4a1c" roughness={0.5} />
      </mesh>

      {/* dek atas */}
      <mesh position={[0, 20.6, 0]}>
        <cylinderGeometry args={[1.35, 1.15, 0.7, 8]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.5} metalness={0.4} />
      </mesh>
      {windowRing(1.38, 0.4, 21.1, 1.3)}
      <mesh position={[0, 21.45, 0]}>
        <cylinderGeometry args={[0.9, 1.4, 0.3, 8]} />
        <meshStandardMaterial color="#ff4a1c" roughness={0.5} />
      </mesh>

      {/* antena */}
      {[[31, 32.5, 0.16, ORANGE], [32.5, 34, 0.12, WHITE], [34, 35.5, 0.09, ORANGE], [35.5, 37, 0.06, WHITE]].map(([y0, y1, r, c]) => (
        <mesh key={y0} position={[0, (y0 + y1) / 2, 0]}>
          <cylinderGeometry args={[r * 0.8, r, y1 - y0, 8]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.25} roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      {[[0, 37.1, 0], [0.4, 26.2, 0.4], [-0.4, 26.2, -0.4], [2.9, 13.7, 0], [-2.9, 13.7, 0]].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i === 0 ? 0.16 : 0.1, 10, 8]} />
          <meshBasicMaterial ref={(m) => { beacons.current[i] = m }} toneMapped={false} />
        </mesh>
      ))}

      {/* gedung kaki (Foot Town) */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[9.4, 2.2, 9.4]} />
        <meshStandardMaterial color="#1b1e22" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.2, 4.72]}>
        <planeGeometry args={[8.6, 1.2]} />
        <meshStandardMaterial color="#111" emissive="#ffd6a0" emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}
