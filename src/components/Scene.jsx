import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import Character from './Character'
import Gate from './Gate'
import Station from './Station'
import Forest, { Path, Ground, Grass, Rocks } from './Forest'
import { stations } from '../data'
import { GATE_SCALE, camState, windTime, obstacles } from '../world'

const camPos = new THREE.Vector3()
const camLook = new THREE.Vector3()
const lookNow = new THREE.Vector3(0, 2.8, 0)
const boardPos = new THREE.Vector3()

function Walls() {
  return [-1, 1].map((s) => (
    <group key={s} position={[s * 8.4, 0, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.2, 1.1, 0.5]} />
        <meshStandardMaterial color="#9c9184" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.4, 0.12, 0.65]} />
        <meshStandardMaterial color="#b3a998" roughness={0.9} />
      </mesh>
    </group>
  ))
}

// drag mouse / jari untuk memutar kamera, scroll untuk zoom
function useOrbitControls(enabled) {
  const { gl } = useThree()
  useEffect(() => {
    if (!enabled) return
    const el = gl.domElement
    const body = document.body.classList
    let drag = null
    const down = (e) => { drag = { x: e.clientX, y: e.clientY }; body.add('dragging') }
    const move = (e) => {
      if (!drag) return
      camState.yaw -= (e.clientX - drag.x) * 0.006
      camState.pitch = THREE.MathUtils.clamp(camState.pitch + (e.clientY - drag.y) * 0.004, 0.08, 1.25)
      drag = { x: e.clientX, y: e.clientY }
    }
    const up = () => { drag = null; body.remove('dragging') }
    const wheel = (e) => {
      e.preventDefault()
      camState.dist = THREE.MathUtils.clamp(camState.dist + e.deltaY * 0.006, 3.5, 14)
    }
    body.add('can-drag')
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      body.remove('can-drag', 'dragging')
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [enabled, gl])
}

export default function Scene({ stage, setStage, setActive }) {
  const player = useRef()
  const light = useRef()
  const lastId = useRef(null)
  const focus = useRef(0)
  const activeSince = useRef(0)
  const { camera } = useThree()
  useOrbitControls(stage === 'explore')

  useEffect(() => {
    if (stage !== 'opening') return
    const t = setTimeout(() => setStage('explore'), 2400)
    return () => clearTimeout(t)
  }, [stage, setStage])

  useFrame((state, dt) => {
    const p = player.current.position
    windTime.value = state.clock.elapsedTime

    if (stage === 'explore') {
      // saat papan muncul, kamera mundur & mendongak supaya papan terlihat utuh
      const board = stations.find((s) => s.id === lastId.current)
      focus.current = THREE.MathUtils.damp(focus.current, board ? 1 : 0, 3, dt)
      const f = focus.current
      if (board) {
        boardPos.set(board.pos[0], 3.1, board.pos[2] + 1.4)
        // sebentar setelah papan muncul, kamera berputar ke depan papan
        if (state.clock.elapsedTime - activeSince.current < 1.8) {
          const want = Math.atan2(p.x - boardPos.x, p.z - boardPos.z)
          const diff = Math.atan2(Math.sin(want - camState.yaw), Math.cos(want - camState.yaw))
          camState.yaw += diff * (1 - Math.exp(-3 * dt))
        }
      }
      const { yaw } = camState
      const pitch = camState.pitch + f * Math.max(0, 0.32 - camState.pitch)
      const dist = camState.dist + f * Math.max(0, 8.5 - camState.dist)
      const flat = Math.cos(pitch) * dist
      camPos.set(p.x + Math.sin(yaw) * flat, p.y + 1.2 + Math.sin(pitch) * dist, p.z + Math.cos(yaw) * flat)
      camLook.set(p.x, 1.25, p.z)
      camLook.lerp(boardPos, f * 0.6)
      // jangan sampai kamera masuk ke dalam rumah, pilar, atau batang pohon
      for (const o of obstacles) {
        if (camPos.y > o.h + 0.3) continue
        const dx = camPos.x - o.x
        const dz = camPos.z - o.z
        const d = Math.hypot(dx, dz)
        const min = o.r + 0.6
        if (d < min && d > 0.0001) {
          camPos.x = o.x + (dx / d) * min
          camPos.z = o.z + (dz / d) * min
        }
      }
    } else if (stage === 'opening') {
      camPos.set(0, 2.6, 7)
      camLook.set(0, 2.8, 0)
    } else {
      // intro: kamera mengayun pelan di depan gerbang
      const t = state.clock.elapsedTime
      camPos.set(Math.sin(t * 0.15) * 1.5, 2.6, 9.5)
      camLook.set(0, 2.8, 0)
    }
    const k = 1 - Math.exp(-4 * dt)
    camera.position.lerp(camPos, k)
    lookNow.lerp(camLook, k)
    camera.lookAt(lookNow)

    // bayangan ikut pemain
    light.current.position.set(p.x + 12, 18, p.z + 6)
    light.current.target.position.set(p.x, 0, p.z)
    light.current.target.updateMatrixWorld()

    // cek rumah terdekat (area cincin di depan rumah)
    let near = null
    for (const s of stations) {
      if (Math.hypot(p.x - s.pos[0], p.z - (s.pos[2] + 3.2)) < 2.4) { near = s; break }
    }
    const id = near?.id ?? null
    if (id !== lastId.current) {
      lastId.current = id
      activeSince.current = state.clock.elapsedTime
      setActive(near)
    }
  })

  return (
    <>
      <Sky sunPosition={[60, 22, 20]} turbidity={6} rayleigh={1.2} mieCoefficient={0.004} mieDirectionalG={0.85} />
      <fog attach="fog" args={['#c4d3d6', 18, 60]} />
      <hemisphereLight args={['#dcecff', '#4a5a32', 0.75]} />
      <ambientLight intensity={0.15} />
      <directionalLight
        ref={light}
        intensity={2.4}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <Ground />
      <Path />
      <Grass />
      <Rocks />
      <Forest />
      <Walls />

      <group scale={GATE_SCALE}>
        <Gate open={stage !== 'intro'} />
      </group>

      <Character playerRef={player} stage={stage} />

      {stations.map((s, i) => (
        <Station key={s.id} data={s} index={i} activeRef={lastId} />
      ))}
    </>
  )
}
