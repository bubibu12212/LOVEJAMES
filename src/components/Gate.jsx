import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const VERMILION = '#c8231a'
const BLACK = '#141416'
const OPENING = 3.5

// balok atas torii (kasagi) yang melengkung ke atas di kedua ujung
function curvedBeam(len, h, d, lift) {
  const g = new THREE.BoxGeometry(len, h, d, 24, 1, 1)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / (len / 2)
    pos.setY(i, pos.getY(i) + Math.pow(Math.abs(x), 2.4) * lift)
  }
  g.computeVertexNormals()
  return g
}

// lentera kertas (chōchin) yang menyala bertahap saat scroll
function Lantern({ position, index, openRef }) {
  const mat = useRef()
  const light = useRef()
  useFrame((state) => {
    const on = THREE.MathUtils.clamp(openRef.current * 7 - index * 0.5, 0, 1)
    const flicker = 0.92 + Math.sin(state.clock.elapsedTime * 9 + index) * 0.05
    mat.current.emissiveIntensity = 0.15 + on * 2.4 * flicker
    if (light.current) light.current.intensity = on * 5 * flicker
  })
  return (
    <group position={position}>
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 2.6, 8]} />
        <meshStandardMaterial color="#2b2b2e" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 2.95, 0]} scale={[1, 1.3, 1]}>
        <sphereGeometry args={[0.42, 20, 14]} />
        <meshStandardMaterial ref={mat} color="#ffe6c6" emissive="#ff7a3a" emissiveIntensity={0.15} roughness={0.9} />
      </mesh>
      {[2.43, 3.47].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.08, 14]} />
          <meshStandardMaterial color={BLACK} />
        </mesh>
      ))}
      {index % 2 === 0 && <pointLight ref={light} position={[0, 2.9, 0.6]} distance={7} color="#ff9a5a" intensity={0} />}
    </group>
  )
}

export default function Gate({ openRef }) {
  const kasagi = useMemo(() => curvedBeam(OPENING * 2 + 6.2, 0.55, 1.5, 0.75), [])
  const shimaki = useMemo(() => curvedBeam(OPENING * 2 + 5, 0.45, 1.2, 0.5), [])
  const lanterns = useMemo(() => {
    const out = []
    for (let i = 0; i < 6; i++) {
      out.push([-(OPENING + 2.2 + i * 3.2), 0, 1.6], [OPENING + 2.2 + i * 3.2, 0, 1.6])
    }
    return out
  }, [])

  return (
    <group>
      {/* pilar */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (OPENING + 0.55), 0, 0]}>
          <mesh position={[0, 4.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.6, 9.2, 28]} />
            <meshStandardMaterial color={VERMILION} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.72, 0.78, 0.9, 28]} />
            <meshStandardMaterial color={BLACK} roughness={0.5} metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* nuki: balok penghubung bawah */}
      <mesh position={[0, 7.1, 0]} castShadow>
        <boxGeometry args={[OPENING * 2 + 3.4, 0.55, 0.6]} />
        <meshStandardMaterial color={VERMILION} roughness={0.55} />
      </mesh>
      {/* shimaki (merah) + kasagi (hitam) */}
      <mesh geometry={shimaki} position={[0, 8.75, 0]} castShadow>
        <meshStandardMaterial color={VERMILION} roughness={0.55} />
      </mesh>
      <mesh geometry={kasagi} position={[0, 9.25, 0]} castShadow>
        <meshStandardMaterial color={BLACK} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* papan nama (gakuzuka) */}
      <mesh position={[0, 7.95, 0.32]} castShadow>
        <boxGeometry args={[1.9, 1.15, 0.12]} />
        <meshStandardMaterial color={BLACK} roughness={0.5} />
      </mesh>
      <Text position={[0, 8.12, 0.4]} fontSize={0.28} letterSpacing={0.18} color="#f1ebe1" anchorX="center" anchorY="middle">
        PROJECTS
      </Text>
      <Text position={[0, 7.75, 0.4]} fontSize={0.16} letterSpacing={0.3} color="#ff5a3c" anchorX="center" anchorY="middle">
        作 品
      </Text>

      {/* pagar rendah gelap di kiri-kanan */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (OPENING + 1.6 + 27.5), 0, 0]}>
          <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
            <boxGeometry args={[55, 2.2, 0.9]} />
            <meshStandardMaterial color="#2a2a2e" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.25, 0]}>
            <boxGeometry args={[55, 0.12, 1.05]} />
            <meshStandardMaterial color={VERMILION} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {lanterns.map((p, i) => <Lantern key={i} position={p} index={Math.floor(i / 2)} openRef={openRef} />)}
    </group>
  )
}
