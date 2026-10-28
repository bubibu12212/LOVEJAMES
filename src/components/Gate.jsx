import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

const STEEL = '#23272c'
const LED = '#ffcf8a'
const OPENING = 3.5      // setengah lebar bukaan gerbang
const DOOR_W = 3.6
const DOOR_H = 7.4

// pintu kaca geser. dir = -1 (kiri) / 1 (kanan)
function Door({ dir, openRef }) {
  const ref = useRef()
  useFrame(() => {
    const closed = dir * (DOOR_W / 2 - 0.05)
    const open = dir * (OPENING + DOOR_W / 2 + 0.4)
    ref.current.position.x = closed + (open - closed) * openRef.current
  })
  return (
    <group ref={ref} position={[0, DOOR_H / 2, 0]}>
      <mesh>
        <boxGeometry args={[DOOR_W, DOOR_H, 0.06]} />
        <meshStandardMaterial color="#c9dbe4" transparent opacity={0.6} roughness={0.25} metalness={0.3} depthWrite={false} />
      </mesh>
      {/* rangka */}
      {[[0, DOOR_H / 2 - 0.06, DOOR_W, 0.12], [0, -DOOR_H / 2 + 0.06, DOOR_W, 0.12],
        [-DOOR_W / 2 + 0.06, 0, 0.12, DOOR_H], [DOOR_W / 2 - 0.06, 0, 0.12, DOOR_H]].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <boxGeometry args={[w, h, 0.14]} />
          <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[-dir * (DOOR_W / 2 - 0.35), 0, 0.12]}>
        <boxGeometry args={[0.06, 1.6, 0.06]} />
        <meshStandardMaterial color="#d9dde0" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Pillar({ x }) {
  const inner = -Math.sign(x)
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 4.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 8.4, 2]} />
        <meshStandardMaterial color={STEEL} roughness={0.45} metalness={0.5} />
      </mesh>
      {/* strip LED di sisi dalam & depan */}
      <mesh position={[inner * 0.81, 4, 0]}>
        <boxGeometry args={[0.02, 7.6, 0.12]} />
        <meshStandardMaterial color={LED} emissive={LED} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0, 4, 1.01]}>
        <boxGeometry args={[0.08, 7.2, 0.02]} />
        <meshStandardMaterial color={LED} emissive={LED} emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Wall({ side }) {
  const len = 55
  const x0 = OPENING + 1.6
  return (
    <group position={[side * (x0 + len / 2), 0, 0]}>
      <mesh position={[0, 3.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, 6.6, 1.2]} />
        <meshStandardMaterial color="#b9bcbf" roughness={0.85} />
      </mesh>
      {/* alur horizontal fasad */}
      {[1.6, 3.2, 4.8].map((y) => (
        <mesh key={y} position={[0, y, 0.61]}>
          <boxGeometry args={[len, 0.05, 0.02]} />
          <meshStandardMaterial color="#8d9093" />
        </mesh>
      ))}
      <mesh position={[0, 6.65, 0]}>
        <boxGeometry args={[len, 0.1, 1.3]} />
        <meshStandardMaterial color={STEEL} />
      </mesh>
    </group>
  )
}

export default function Gate({ openRef, title = 'PROJECTS', subtitle = '' }) {
  return (
    <group>
      <Pillar x={-(OPENING + 0.8)} />
      <Pillar x={OPENING + 0.8} />
      <Wall side={-1} />
      <Wall side={1} />

      {/* balok atas */}
      <mesh position={[0, 9, 0]} castShadow>
        <boxGeometry args={[OPENING * 2 + 3.6, 1.3, 2.2]} />
        <meshStandardMaterial color={STEEL} roughness={0.45} metalness={0.5} />
      </mesh>
      <mesh position={[0, 8.33, 0]}>
        <boxGeometry args={[OPENING * 2, 0.03, 1.4]} />
        <meshStandardMaterial color={LED} emissive={LED} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <Text position={[0, 9.12, 1.12]} fontSize={0.72} letterSpacing={0.42} color="#f4efe6" anchorX="center" anchorY="middle" fontWeight={700}>
        {title}
      </Text>
      {subtitle && (
        <Text position={[0, 8.6, 1.12]} fontSize={0.2} letterSpacing={0.3} color={LED} anchorX="center" anchorY="middle">
          {subtitle}
        </Text>
      )}

      <Door dir={-1} openRef={openRef} />
      <Door dir={1} openRef={openRef} />
    </group>
  )
}
