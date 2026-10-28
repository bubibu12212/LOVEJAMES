import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { makeFacadeMaterial } from '../world'

const LABEL = { project: 'PROJECT', experience: 'PENGALAMAN' }
const FACADE = { project: '#3a3d44', experience: '#4a4f58' }
const W = 9    // lebar gedung (sepanjang jalan)
const D = 10   // kedalaman gedung

const BOARD_W = 4.4
const BOARD_H = 2.5
const worldPos = new THREE.Vector3()

// papan besar yang "pop" muncul saat pemain berdiri di lingkaran depan gedung
function Billboard({ data, number, activeRef }) {
  const ref = useRef()
  const anim = useRef({ s: 0, v: 0 })
  const accent = data.accent

  useFrame((state, dt) => {
    const g = ref.current
    const a = anim.current
    const target = activeRef.current === data.id ? 1 : 0
    // pegas: muncul dengan sedikit memantul
    dt = Math.min(dt, 0.05)
    a.v += ((target - a.s) * 170 - a.v * 15) * dt
    a.s += a.v * dt
    if (target === 0 && a.s < 0.02) { a.s = 0; a.v = 0 }
    g.visible = a.s > 0.001
    g.scale.setScalar(Math.max(a.s, 0.0001))

    // selalu menghadap kamera (hanya berputar kiri-kanan)
    g.getWorldPosition(worldPos)
    const cam = state.camera.position
    const yaw = Math.atan2(cam.x - worldPos.x, cam.z - worldPos.z)
    const diff = Math.atan2(Math.sin(yaw - g.rotation.y), Math.cos(yaw - g.rotation.y))
    g.rotation.y += diff * (1 - Math.exp(-6 * dt))
    g.position.y = 0.04 * Math.sin(state.clock.elapsedTime * 1.6)
  })

  const pad = BOARD_W / 2 - 0.3

  return (
    <group position={[data.side * 7.4, 0, data.z]}>
      <group ref={ref} visible={false}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (BOARD_W / 2 - 0.35), 1.6, -0.08]} castShadow>
            <boxGeometry args={[0.1, 3.2, 0.1]} />
            <meshStandardMaterial color="#2a2d31" roughness={0.4} metalness={0.6} />
          </mesh>
        ))}
        <group position={[0, 3.35, 0]}>
          <RoundedBox args={[BOARD_W + 0.12, BOARD_H + 0.12, 0.1]} radius={0.06} position={[0, 0, -0.04]}>
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[BOARD_W, BOARD_H, 0.06]} radius={0.05}>
            <meshBasicMaterial color="#0e1318" toneMapped={false} />
          </RoundedBox>
          <group position={[0, 0, 0.04]}>
            <Text position={[-pad, 0.95, 0]} fontSize={0.13} letterSpacing={0.18} color={accent} anchorX="left" anchorY="middle">
              {`${number}  ·  ${(data.category ?? LABEL[data.type] ?? 'PROJECT').toUpperCase()}`}
            </Text>
            <Text position={[-pad, 0.76, 0]} fontSize={0.36} maxWidth={BOARD_W - 0.6} color="#ffffff" anchorX="left" anchorY="top" fontWeight={700}>
              {data.title}
            </Text>
            <mesh position={[0, 0.15, 0]}>
              <planeGeometry args={[BOARD_W - 0.6, 0.008]} />
              <meshBasicMaterial color="#2b3846" />
            </mesh>
            <Text position={[-pad, 0.02, 0]} fontSize={0.155} maxWidth={BOARD_W - 0.6} color="#dbe3ea" anchorX="left" anchorY="top" lineHeight={1.45}>
              {data.desc}
            </Text>
            {data.tech?.length > 0 && (
              <Text position={[-pad, -0.98, 0]} fontSize={0.13} letterSpacing={0.05} color={accent} anchorX="left" anchorY="middle">
                {data.tech.join('   •   ')}
              </Text>
            )}
          </group>
        </group>
      </group>
    </group>
  )
}

export default function ProjectBuilding({ data, index, activeRef }) {
  const ringMat = useRef()
  const H = data.floors * 3.2 + 1
  const accent = data.accent
  const mat = useMemo(() => {
    const m = makeFacadeMaterial({ lit: 0.45, seed: index * 3 + 1 })
    m.color.set(FACADE[data.type] ?? FACADE.project)
    return m
  }, [data.type, index])
  const number = String(index + 1).padStart(2, '0')

  useFrame((state) => {
    const on = activeRef.current === data.id
    ringMat.current.opacity = on ? 0.95 : 0.4 + Math.sin(state.clock.elapsedTime * 2.5) * 0.15
  })

  return (
    <group>
      {/* gedung: sumbu +z lokal menghadap boulevard */}
      <group position={[data.side * 13, 0, data.z]} rotation-y={data.side < 0 ? Math.PI / 2 : -Math.PI / 2}>
        {/* lantai atas menggantung di atas lobi */}
        <mesh material={mat} position={[0, 3.6 + (H - 3.6) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, H - 3.6, D]} />
        </mesh>
        <mesh position={[0, 1.8, -1]} castShadow receiveShadow>
          <boxGeometry args={[W - 0.6, 3.6, D - 2]} />
          <meshStandardMaterial color="#2b3036" roughness={0.6} />
        </mesh>
        {/* lobi kaca yang menyala */}
        <mesh position={[0, 1.8, D / 2 - 0.98]}>
          <boxGeometry args={[W - 1.2, 3.4, 0.06]} />
          <meshStandardMaterial color="#26313a" emissive="#ffd7a3" emissiveIntensity={0.55} roughness={0.08} metalness={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (W / 2 - 0.3), 1.8, D / 2 - 0.3]} castShadow>
            <boxGeometry args={[0.35, 3.6, 0.35]} />
            <meshStandardMaterial color="#2b3036" roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 3.58, D / 2 - 0.2]}>
          <boxGeometry args={[W - 0.8, 0.03, 0.25]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
        {/* pintu */}
        <mesh position={[0, 1.3, D / 2 - 0.94]}>
          <boxGeometry args={[2, 2.6, 0.06]} />
          <meshStandardMaterial color="#0f1418" emissive="#ffe2b8" emissiveIntensity={0.9} />
        </mesh>
        {/* strip LED vertikal di sudut depan */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (W / 2 + 0.02), 3.6 + (H - 3.6) / 2, D / 2 - 0.6]}>
            <boxGeometry args={[0.06, H - 4.4, 0.12]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.5} toneMapped={false} />
          </mesh>
        ))}
        {/* papan nama di atap */}
        <group position={[0, H + 1.1, D / 2 - 1.6]}>
          <mesh position={[0, 0, -0.08]}>
            <boxGeometry args={[W - 1, 1.8, 0.12]} />
            <meshStandardMaterial color="#14181c" roughness={0.6} />
          </mesh>
          <Text position={[0, 0.22, 0]} fontSize={0.7} maxWidth={W - 1.6} color={accent} anchorX="center" anchorY="middle" fontWeight={700}>
            {data.title}
          </Text>
          <Text position={[0, -0.5, 0]} fontSize={0.22} letterSpacing={0.3} color="#cfd5da" anchorX="center" anchorY="middle">
            {`${number} · ${(data.category ?? LABEL[data.type] ?? 'PROJECT').toUpperCase()}`}
          </Text>
        </group>
      </group>

      {/* lingkaran area interaksi di trotoar */}
      <mesh position={[data.side * 6.2, 0.03, data.z]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.0, 1.22, 48]} />
        <meshBasicMaterial ref={ringMat} color={accent} transparent opacity={0.4} depthWrite={false} toneMapped={false} />
      </mesh>

      <Billboard data={data} number={number} activeRef={activeRef} />
    </group>
  )
}
