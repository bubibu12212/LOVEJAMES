import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const STYLE = {
  project: { wall: '#e8dccb', trim: '#5b4636', roof: '#6e3426', door: '#3e2a1e', accent: '#e0a458' },
  experience: { wall: '#dfe2e3', trim: '#3a4651', roof: '#2f3f4f', door: '#26323d', accent: '#7cc4d8' },
}
const LABEL = { project: 'PROJECT', experience: 'PENGALAMAN' }

const BOARD_W = 4.4
const BOARD_H = 2.7
const worldPos = new THREE.Vector3()

// papan besar yang "pop" muncul saat pemain berdiri di cincin depan rumah
function Billboard({ data, index, accent, activeRef }) {
  const ref = useRef()
  const anim = useRef({ s: 0, v: 0 })

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
  const no = String(index + 1).padStart(2, '0')

  return (
    <group position={[0, 0, 1.4]}>
      <group ref={ref} visible={false}>
        {/* tiang */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (BOARD_W / 2 - 0.35), 1.6, -0.08]} castShadow>
            <boxGeometry args={[0.12, 3.2, 0.12]} />
            <meshStandardMaterial color="#2a2420" roughness={0.6} metalness={0.3} />
          </mesh>
        ))}
        <group position={[0, 3.35, 0]}>
          {/* bingkai & papan */}
          <RoundedBox args={[BOARD_W + 0.14, BOARD_H + 0.14, 0.1]} radius={0.06} position={[0, 0, -0.04]}>
            <meshStandardMaterial color={accent} roughness={0.4} metalness={0.2} />
          </RoundedBox>
          <RoundedBox args={[BOARD_W, BOARD_H, 0.06]} radius={0.05}>
            <meshBasicMaterial color="#10161d" toneMapped={false} />
          </RoundedBox>

          <group position={[0, 0, 0.04]}>
            <Text position={[-pad, 1.02, 0]} fontSize={0.13} letterSpacing={0.15} color={accent} anchorX="left" anchorY="middle">
              {`KASUS #${no}  ·  ${LABEL[data.type] ?? 'PROJECT'}`}
            </Text>
            <Text position={[-pad, 0.84, 0]} fontSize={0.34} maxWidth={BOARD_W - 0.6} color="#ffffff" anchorX="left" anchorY="top" fontWeight={700}>
              {data.title}
            </Text>
            {data.story && (
              <Text position={[-pad, 0.3, 0]} fontSize={0.125} maxWidth={BOARD_W - 0.6} color="#9fb0bf" anchorX="left" anchorY="top" lineHeight={1.35}>
                {`“${data.story}”`}
              </Text>
            )}
            <mesh position={[0, 0.0, 0]}>
              <planeGeometry args={[BOARD_W - 0.6, 0.008]} />
              <meshBasicMaterial color="#2b3846" />
            </mesh>
            <Text position={[-pad, -0.12, 0]} fontSize={0.15} maxWidth={BOARD_W - 0.6} color="#dbe3ea" anchorX="left" anchorY="top" lineHeight={1.45}>
              {data.desc}
            </Text>
            {data.tech?.length > 0 && (
              <Text position={[-pad, -1.07, 0]} fontSize={0.13} letterSpacing={0.05} color={accent} anchorX="left" anchorY="middle">
                {data.tech.join('   •   ')}
              </Text>
            )}
          </group>
        </group>
      </group>
    </group>
  )
}

export default function Station({ data, index, activeRef }) {
  const c = STYLE[data.type] ?? STYLE.project
  const tall = data.type === 'experience' ? 1.35 : 1
  const wallH = 1.8 * tall
  const ringMat = useRef()

  useFrame((state) => {
    const on = activeRef.current === data.id
    ringMat.current.opacity = on ? 0.9 : 0.35 + Math.sin(state.clock.elapsedTime * 2.5) * 0.12
  })

  return (
    <group position={data.pos}>
      {/* rumah (agak diputar biar natural) */}
      <group rotation-y={data.rot ?? 0}>
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 0.24, 2.8]} />
          <meshStandardMaterial color="#8b8178" roughness={0.95} />
        </mesh>
        <mesh position={[0, wallH / 2 + 0.24, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, wallH, 2.4]} />
          <meshStandardMaterial color={c.wall} roughness={0.9} />
        </mesh>
        {/* list kayu di sudut */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x * 1.2, wallH / 2 + 0.24, z * 1.2]} castShadow>
            <boxGeometry args={[0.14, wallH, 0.14]} />
            <meshStandardMaterial color={c.trim} roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, wallH + 0.24 + 0.7, 0]} rotation-y={Math.PI / 4} castShadow>
          <coneGeometry args={[2.25, 1.4, 4]} />
          <meshStandardMaterial color={c.roof} roughness={0.85} />
        </mesh>
        <mesh position={[0.7, wallH + 1.2, -0.3]} castShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color="#6d625a" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.74, 1.21]}>
          <boxGeometry args={[0.55, 1, 0.06]} />
          <meshStandardMaterial color={c.door} roughness={0.7} />
        </mesh>
        {[-0.75, 0.75].map((x) => (
          <group key={x} position={[x, 1.3 * tall + 0.1, 1.21]}>
            <mesh>
              <boxGeometry args={[0.52, 0.52, 0.05]} />
              <meshStandardMaterial color={c.trim} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <boxGeometry args={[0.42, 0.42, 0.05]} />
              <meshStandardMaterial color="#ffe2a0" emissive="#ffbe5c" emissiveIntensity={0.9} />
            </mesh>
          </group>
        ))}
        <pointLight position={[0, 1.2, 1.6]} color="#ffc876" intensity={2} distance={4} />
      </group>

      {/* cincin area interaksi di depan rumah */}
      <mesh position={[0, 0.04, 3.2]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.05, 1.25, 48]} />
        <meshBasicMaterial ref={ringMat} color={c.accent} transparent opacity={0.4} depthWrite={false} />
      </mesh>

      {/* papan nama kecil */}
      <group position={[1.9, 0, 3.3]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.4]} />
          <meshStandardMaterial color="#4a3426" />
        </mesh>
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[1.6, 0.5, 0.07]} />
          <meshStandardMaterial color="#5a4332" roughness={0.8} />
        </mesh>
        <Text position={[0, 1.45, 0.045]} fontSize={0.17} maxWidth={1.45} color="#f3e6d3" anchorX="center" anchorY="middle">
          {data.title}
        </Text>
      </group>

      <Billboard data={data} index={index} accent={c.accent} activeRef={activeRef} />
    </group>
  )
}
