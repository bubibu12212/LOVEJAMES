import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import Character from './Character'
import Gate from './Gate'
import Station from './Station'
import Forest, { Path } from './Forest'
import { stations } from '../data'
import { GATE_SCALE } from '../world'

const camPos = new THREE.Vector3()
const camLook = new THREE.Vector3()
const lookNow = new THREE.Vector3(0, 2.8, 0)

function Walls() {
  return [-1, 1].map((s) => (
    <mesh key={s} position={[s * 8.4, 0.55, 0]} castShadow receiveShadow>
      <boxGeometry args={[11.2, 1.1, 0.5]} />
      <meshStandardMaterial color="#b9a58a" />
    </mesh>
  ))
}

export default function Scene({ stage, setStage, setActive }) {
  const player = useRef()
  const light = useRef()
  const lastId = useRef(null)
  const { camera } = useThree()

  useEffect(() => {
    if (stage !== 'opening') return
    const t = setTimeout(() => setStage('explore'), 2200)
    return () => clearTimeout(t)
  }, [stage, setStage])

  useFrame((_, dt) => {
    const p = player.current.position

    if (stage === 'explore') {
      camPos.set(p.x, 4.2, p.z + 6.5)
      camLook.set(p.x, 1.2, p.z - 1)
    } else if (stage === 'opening') {
      camPos.set(0, 2.6, 7)
      camLook.set(0, 2.8, 0)
    } else {
      camPos.set(0, 2.6, 9.5)
      camLook.set(0, 2.8, 0)
    }
    const k = 1 - Math.exp(-3 * dt)
    camera.position.lerp(camPos, k)
    lookNow.lerp(camLook, k)
    camera.lookAt(lookNow)

    // bayangan ikut pemain
    light.current.position.set(p.x + 8, 14, p.z + 8)
    light.current.target.position.set(p.x, 0, p.z)
    light.current.target.updateMatrixWorld()

    // cek rumah terdekat (area cincin di depan rumah)
    let near = null
    for (const s of stations) {
      if (Math.hypot(p.x - s.pos[0], p.z - (s.pos[2] + 3.2)) < 2.2) { near = s; break }
    }
    const id = near?.id ?? null
    if (id !== lastId.current) {
      lastId.current = id
      setActive(near)
    }
  })

  return (
    <>
      <Sky sunPosition={[50, 40, 30]} />
      <fog attach="fog" args={['#cfe8ff', 22, 65]} />
      <ambientLight intensity={0.8} />
      <directionalLight
        ref={light}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -30]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#6fb56f" />
      </mesh>

      <Path />
      <Forest />
      <Walls />

      <group scale={GATE_SCALE}>
        <Gate open={stage !== 'intro'} />
      </group>

      <Character playerRef={player} stage={stage} />

      {stations.map((s) => (
        <Station key={s.id} data={s} activeRef={lastId} />
      ))}
    </>
  )
}