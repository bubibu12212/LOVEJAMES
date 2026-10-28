import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const STONE = '#e8c39a'
const IRON = '#6b3a1e'
const GREEN = '#2a9d6f'

function Pillar({ x }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.6, 0.8, 1.6]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[1.2, 4, 1.2]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      {/* panel hijau di pilar */}
      <mesh position={[0, 2.2, 0.62]}>
        <boxGeometry args={[0.7, 2.6, 0.05]} />
        <meshStandardMaterial color={GREEN} />
      </mesh>
      <mesh position={[0, 4.15, 0]} castShadow>
        <boxGeometry args={[1.5, 0.3, 1.5]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
      <mesh position={[0, 4.75, 0]} castShadow>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial color={STONE} />
      </mesh>
    </group>
  )
}

// width = lebar pintu, dir = +1 (pintu kiri, menjulur ke +x) / -1 (pintu kanan)
function Door({ dir, open }) {
  const ref = useRef()
  const bars = Array.from({ length: 10 }, (_, i) => (i + 0.5) * 0.3)

  useFrame((_, dt) => {
    const target = open ? dir * 1.45 : 0
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, target, 2.5, dt)
  })

  return (
    <group ref={ref} position={[-dir * 3, 0, 0]}>
      {bars.map((x, i) => (
        <mesh key={i} position={[dir * x, 1.8 + (i % 2 ? 0.1 : 0), 0]} castShadow>
          <boxGeometry args={[0.07, 3.4 + (i % 2 ? 0.2 : 0), 0.07]} />
          <meshStandardMaterial color={IRON} />
        </mesh>
      ))}
      {[0.4, 3.2].map((y) => (
        <mesh key={y} position={[dir * 1.5, y, 0]}>
          <boxGeometry args={[3, 0.1, 0.1]} />
          <meshStandardMaterial color={IRON} />
        </mesh>
      ))}
    </group>
  )
}

export default function Gate({ open }) {
  return (
    <group>
      <Pillar x={-3.6} />
      <Pillar x={3.6} />

      {/* lengkungan */}
      <mesh position={[0, 4.3, 0]} castShadow>
        <torusGeometry args={[3.6, 0.5, 16, 64, Math.PI]} />
        <meshStandardMaterial color={STONE} />
      </mesh>

      {/* papan tulisan */}
      <mesh position={[0, 7.6, 0]} castShadow>
        <boxGeometry args={[3.4, 1.1, 0.4]} />
        <meshStandardMaterial color="#f0cfa0" />
      </mesh>
      <Text position={[0, 7.6, 0.25]} fontSize={0.55} color="#5a2d0c" anchorX="center" anchorY="middle">
        WELCOME
      </Text>

      <Door dir={1} open={open} />
      <Door dir={-1} open={open} />
    </group>
  )
}