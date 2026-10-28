import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { curvedRoof, curvedBeam, tileTexture } from '../geometry'
import { PaperLantern, StoneLanterns, Wall } from './Props'
import { gateLanterns, GARDEN_HALF, GARDEN_END } from '../world'

const WOOD = '#3a281b'
const WOOD_DARK = '#22170f'
const POST_X = 2.35
const LEAF_W = 2.1
const LEAF_H = 3.95

// papan kayu vertikal untuk daun pintu
function plankTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const g = c.getContext('2d')
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `hsl(24, 34%, ${15 + ((i * 7) % 5)}%)`
    g.fillRect(i * 32, 0, 32, 256)
    g.fillStyle = 'rgba(0,0,0,0.45)'
    g.fillRect(i * 32, 0, 2, 256)
    g.fillStyle = 'rgba(255,220,180,0.04)'
    for (let y = 0; y < 256; y += 6) g.fillRect(i * 32 + 4 + ((y * i) % 20), y, 1, 4)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function DoorLeaf({ side, openRef, map }) {
  const ref = useRef()
  useFrame(() => {
    ref.current.rotation.y = side * openRef.current * 1.45
  })
  return (
    <group ref={ref} position={[-side * (POST_X - 0.21), 0.22, -0.05]}>
      <group position={[side * LEAF_W / 2, LEAF_H / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[LEAF_W, LEAF_H, 0.12]} />
          <meshStandardMaterial map={map} roughness={0.75} />
        </mesh>
        {[-1.35, 0, 1.35].map((y) => (
          <mesh key={y} position={[0, y, 0.09]} castShadow>
            <boxGeometry args={[LEAF_W, 0.16, 0.08]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.6} />
          </mesh>
        ))}
        {/* engsel & pegangan kuningan tua */}
        {[-1.35, 1.35].map((y) => (
          <mesh key={y} position={[-side * (LEAF_W / 2 - 0.35), y, 0.14]}>
            <boxGeometry args={[0.6, 0.2, 0.02]} />
            <meshStandardMaterial color="#6b5428" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[side * (LEAF_W / 2 - 0.22), 0, 0.15]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.1, 0.018, 8, 20]} />
          <meshStandardMaterial color="#8a6a30" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

// Gerbang taman Jepang (yakui-mon) dengan pintu kayu yang terbuka saat scroll
export default function GardenGate({ openRef }) {
  const planks = useMemo(() => plankTexture(), [])
  const roof = useMemo(() => curvedRoof(7.8, 5, 1.55, 0.5), [])
  const tiles = useMemo(() => tileTexture(7.8 / 0.26, 10), [])
  const ridge = useMemo(() => curvedBeam(7.2, 0.32, 0.34, 0.22), [])
  const fascia = useMemo(() => curvedBeam(7.9, 0.16, 0.12, 0.64), [])
  const glow = useRef(0)
  const lanternOn = useRef(0)
  const lights = useRef([])

  useFrame((state, dt) => {
    lanternOn.current = THREE.MathUtils.clamp(openRef.current * 1.6, 0, 1)
    glow.current = THREE.MathUtils.damp(glow.current, lanternOn.current, 4, dt)
    lights.current.forEach((l) => { if (l) l.intensity = 2 + glow.current * 10 })
  })

  const rafters = []
  for (let x = -3.6; x <= 3.6; x += 0.45) rafters.push(x)

  return (
    <group>
      {/* tiang utama + tiang belakang + alas batu */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * POST_X, 2.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.42, 5.5, 0.42]} />
            <meshStandardMaterial color={WOOD} roughness={0.7} />
          </mesh>
          <mesh position={[s * POST_X, 2.35, -1.6]} castShadow>
            <boxGeometry args={[0.32, 4.7, 0.32]} />
            <meshStandardMaterial color={WOOD} roughness={0.7} />
          </mesh>
          {[0, -1.6].map((z) => (
            <mesh key={z} position={[s * POST_X, 0.12, z]} receiveShadow>
              <boxGeometry args={[0.7, 0.24, 0.7]} />
              <meshStandardMaterial color="#6d6a64" roughness={0.95} />
            </mesh>
          ))}
          <mesh position={[s * POST_X, 4.3, -0.8]} castShadow>
            <boxGeometry args={[0.26, 0.3, 1.9]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* balok lintang */}
      <mesh position={[0, 4.4, 0]} castShadow>
        <boxGeometry args={[5.6, 0.36, 0.34]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>
      <mesh position={[0, 5.45, -0.8]} castShadow>
        <boxGeometry args={[6.4, 0.34, 2.3]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>
      {/* ujung kaso di bawah atap */}
      {rafters.map((x) => (
        <mesh key={x} position={[x, 5.66, -0.8]}>
          <boxGeometry args={[0.1, 0.12, 5]} />
          <meshStandardMaterial color="#e9e1d2" roughness={0.8} />
        </mesh>
      ))}

      {/* atap genteng melengkung */}
      <mesh geometry={roof} position={[0, 5.78, -0.8]} castShadow receiveShadow>
        <meshStandardMaterial map={tiles} bumpMap={tiles} bumpScale={2} roughness={0.5} metalness={0.3} side={THREE.DoubleSide} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} geometry={fascia} position={[0, 5.78, -0.8 + s * 2.5]}>
          <meshStandardMaterial color="#1d1f23" roughness={0.5} />
        </mesh>
      ))}
      <mesh geometry={ridge} position={[0, 5.78 + 1.6, -0.8]} castShadow>
        <meshStandardMaterial color="#1d1f23" roughness={0.45} metalness={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 3.6, 7.85, -0.8]} rotation-z={s * 0.35} castShadow>
          <boxGeometry args={[0.45, 0.6, 0.38]} />
          <meshStandardMaterial color="#1d1f23" roughness={0.45} metalness={0.3} />
        </mesh>
      ))}

      {/* papan nama */}
      <group position={[0, 4.95, 0.22]}>
        <mesh>
          <boxGeometry args={[2.3, 0.62, 0.08]} />
          <meshStandardMaterial color="#c9a45a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[2.18, 0.5, 0.02]} />
          <meshStandardMaterial color="#141110" roughness={0.4} />
        </mesh>
        <Text position={[0, 0.05, 0.06]} fontSize={0.22} letterSpacing={0.32} color="#e8c77a" anchorX="center" anchorY="middle">
          THE GARDEN
        </Text>
        <Text position={[0, -0.15, 0.06]} fontSize={0.075} letterSpacing={0.5} color="#b98f4a" anchorX="center" anchorY="middle">
          PROJECTS · JOURNEY · CONTACT
        </Text>
      </group>

      <DoorLeaf side={1} openRef={openRef} map={planks} />
      <DoorLeaf side={-1} openRef={openRef} map={planks} />

      {/* lentera kertas di kiri-kanan gerbang */}
      {[-1, 1].map((s) => (
        <PaperLantern key={s} position={[s * 3.15, 3.75, 0.55]} onRef={lanternOn} light={s === 1} />
      ))}

      {/* lentera batu di depan gerbang, menyala saat gerbang dibuka */}
      <StoneLanterns positions={gateLanterns} scale={1.25} />
      {gateLanterns.map(([x, z], i) => (
        <pointLight key={i} ref={(l) => { lights.current[i] = l }} position={[x, 1.7, z + 0.4]} distance={10} decay={1.5} color="#ffb06a" intensity={2} />
      ))}

      {/* tembok keliling taman */}
      <Wall a={[-34, 0]} b={[-2.6, 0]} />
      <Wall a={[2.6, 0]} b={[34, 0]} />
      <Wall a={[-GARDEN_HALF, -0.4]} b={[-GARDEN_HALF, GARDEN_END]} />
      <Wall a={[GARDEN_HALF, GARDEN_END]} b={[GARDEN_HALF, -0.4]} />
      <Wall a={[-GARDEN_HALF, GARDEN_END]} b={[GARDEN_HALF, GARDEN_END]} />
    </group>
  )
}
