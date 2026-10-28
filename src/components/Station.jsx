import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

const STYLE = {
  project: { wall: '#f2d9b0', roof: '#c8553d', door: '#6b3a1e', sign: '#2a9d8f' },
  experience: { wall: '#d9e4f2', roof: '#3d6fc8', door: '#3a4a6b', sign: '#e76f51' },
}

export default function Station({ data, activeRef }) {
  const c = STYLE[data.type] ?? STYLE.project
  const tall = data.type === 'experience' ? 1.35 : 1
  const wallH = 1.8 * tall
  const ringMat = useRef()

  useFrame(() => {
    ringMat.current.opacity = activeRef.current === data.id ? 0.95 : 0.45
  })

  return (
    <group position={data.pos}>
      {/* rumah (agak diputar biar natural) */}
      <group rotation-y={data.rot ?? 0}>
        <mesh position={[0, wallH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, wallH, 2.4]} />
          <meshStandardMaterial color={c.wall} />
        </mesh>
        <mesh position={[0, wallH + 0.65, 0]} rotation-y={Math.PI / 4} castShadow>
          <coneGeometry args={[2.1, 1.3, 4]} />
          <meshStandardMaterial color={c.roof} />
        </mesh>
        <mesh position={[0.7, wallH + 0.9, -0.3]} castShadow>
          <boxGeometry args={[0.3, 0.7, 0.3]} />
          <meshStandardMaterial color="#8a7060" />
        </mesh>
        <mesh position={[0, 0.5, 1.21]}>
          <boxGeometry args={[0.5, 1, 0.06]} />
          <meshStandardMaterial color={c.door} />
        </mesh>
        {[-0.75, 0.75].map((x) => (
          <mesh key={x} position={[x, 1.1 * tall, 1.21]}>
            <boxGeometry args={[0.45, 0.45, 0.06]} />
            <meshStandardMaterial color="#ffe9a8" emissive="#ffcf6b" emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>

      {/* cincin area interaksi di depan rumah */}
      <mesh position={[0, 0.06, 3.2]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.0, 1.3, 40]} />
        <meshBasicMaterial ref={ringMat} color={c.sign} transparent opacity={0.45} />
      </mesh>

      {/* papan nama */}
      <group position={[1.9, 0, 3.3]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.4]} />
          <meshStandardMaterial color="#6b3a1e" />
        </mesh>
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[1.6, 0.55, 0.08]} />
          <meshStandardMaterial color={c.sign} />
        </mesh>
        <Text position={[0, 1.45, 0.05]} fontSize={0.19} maxWidth={1.4} color="white" anchorX="center" anchorY="middle">
          {data.title}
        </Text>
      </group>
    </group>
  )
}