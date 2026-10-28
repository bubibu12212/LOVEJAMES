import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky, Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import Character from './Character'
import Gate from './Gate'
import City from './City'
import ProjectBuilding from './ProjectBuilding'
import GalleryRoom from './GalleryRoom'
import {
  camState, windTime, stationSpots, cityObstacles, roomObstacles, photoSpots,
  CITY_BOUNDS, ROOM_BOUNDS, ROOM, ROOM_SPAWN, ROOM_EXIT, CITY_RETURN, GALLERY, PLAYER_START,
} from '../world'

const camPos = new THREE.Vector3()
const camLook = new THREE.Vector3()
const lookNow = new THREE.Vector3(0, 4, 0)
const boardPos = new THREE.Vector3()
const gateCam = new THREE.Vector3()
const gateLook = new THREE.Vector3()
const entryFrom = new THREE.Vector3()
const entryLook = new THREE.Vector3()
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

const smooth = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b)

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

// mode: 'scroll' (kamera digerakkan scroll halaman) | 'explore' (bebas jalan)
// world: 'city' | 'room'
export default function Scene({ mode, world, progressRef, onActive, onPhoto, onWorldSwitch }) {
  const player = useRef()
  const light = useRef()
  const activeId = useRef(null)
  const activePhoto = useRef(null)
  const gateOpen = useRef(0)
  const focus = useRef(0)
  const switching = useRef(false)
  const entry = useRef(1)
  const [ready, setReady] = useState(false)
  const { camera } = useThree()
  const explore = mode === 'explore'
  useOrbitControls(explore && ready)

  // pindah dunia: taruh pemain di titik masuk
  useEffect(() => {
    const p = player.current
    const inRoomArea = p.position.z > ROOM.cz - 50
    const spawn = world === 'room' ? ROOM_SPAWN : (inRoomArea ? CITY_RETURN : null)
    if (spawn) {
      p.position.set(...spawn)
      p.rotation.y = Math.PI
      camState.yaw = 0
      camera.position.set(spawn[0], 4, spawn[2] + 6)
      lookNow.set(spawn[0], 1.25, spawn[2])
    }
    activeId.current = null
    activePhoto.current = null
    switching.current = false
  }, [world, camera])

  // masuk: kamera terbang pelan dari gerbang ke belakang karakter.
  // keluar: kembalikan pemain ke titik awal supaya tampilan gerbang tetap pas
  useEffect(() => {
    if (explore) {
      entry.current = 0
      entryFrom.copy(camera.position)
      entryLook.copy(lookNow)
      return
    }
    player.current.position.set(...PLAYER_START)
    player.current.rotation.y = 0
    Object.assign(camState, { yaw: 0, pitch: 0.38, dist: 7 })
  }, [explore, camera])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = player.current.position
    windTime.value = state.clock.elapsedTime
    const inRoom = world === 'room'

    if (!explore) {
      if (ready) setReady(false)
      // ===== mode scroll: kamera mendekat pelan ke gerbang & pintu terbuka (tidak masuk otomatis) =====
      const t = progressRef.current
      gateOpen.current = smooth(0.15, 0.75, t)
      const e = smooth(0, 1, t)
      gateCam.set(0, 3.4 - e * 0.6, 26 - e * 9)
      gateLook.set(0, 7 - e * 2.2, 0)
      const k = 1 - Math.exp(-5 * dt)
      camera.position.lerp(gateCam, k)
      lookNow.lerp(gateLook, k)
      camera.lookAt(lookNow)
    } else {
      gateOpen.current = 1
      // saat papan muncul, kamera mundur & mendongak supaya papan terlihat utuh
      const board = !inRoom && stationSpots.find((s) => s.id === activeId.current)
      focus.current = THREE.MathUtils.damp(focus.current, board ? 1 : 0, 3, dt)
      const f = focus.current
      if (board) boardPos.set(board.side * 7.4, 3.1, board.z)
      const { yaw } = camState
      let pitch = camState.pitch + f * Math.max(0, 0.3 - camState.pitch)
      let dist = camState.dist + f * Math.max(0, 8 - camState.dist)
      if (inRoom) {
        // di dalam ruangan kamera lebih dekat & datar supaya foto di dinding terlihat
        pitch = Math.min(pitch, 0.22)
        dist = Math.min(dist, 4.8)
      }
      const flat = Math.cos(pitch) * dist
      camPos.set(p.x + Math.sin(yaw) * flat, 1.2 + Math.sin(pitch) * dist, p.z + Math.cos(yaw) * flat)
      camLook.set(p.x, inRoom ? 1.7 : 1.25, p.z)
      camLook.lerp(boardPos, f * 0.45)

      if (inRoom) {
        // kamera tetap di dalam ruangan
        camPos.x = THREE.MathUtils.clamp(camPos.x, ROOM.cx - ROOM.halfW + 0.4, ROOM.cx + ROOM.halfW - 0.4)
        camPos.z = THREE.MathUtils.clamp(camPos.z, ROOM.cz - ROOM.halfD + 0.4, ROOM.cz + ROOM.halfD - 0.4)
        camPos.y = Math.min(camPos.y, ROOM.height - 0.4)
      } else {
        // jangan sampai kamera masuk ke dalam pilar, tembok, atau lampu
        for (const o of cityObstacles) {
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
      }
      if (entry.current < 1) {
        // animasi masuk: terbang mulus lewat gerbang (sekitar 2,4 detik)
        entry.current = Math.min(1, entry.current + Math.min(rawDt, 0.25) / 2.4)
        const e = easeInOut(entry.current)
        camera.position.lerpVectors(entryFrom, camPos, e)
        lookNow.lerpVectors(entryLook, camLook, e)
        if (entry.current === 1) setReady(true)
      } else {
        const k = 1 - Math.exp(-4 * dt)
        camera.position.lerp(camPos, k)
        lookNow.lerp(camLook, k)
      }
      camera.lookAt(lookNow)
    }

    // bayangan ikut pemain
    light.current.position.set(p.x + 30, 16, p.z + 20)
    light.current.target.position.set(p.x, 0, p.z)
    light.current.target.updateMatrixWorld()

    if (!explore || !ready || switching.current) return

    if (!inRoom) {
      // gedung project terdekat
      let near = null
      for (const s of stationSpots) {
        if (Math.hypot(p.x - s.ring[0], p.z - s.ring[1]) < 2.1) { near = s; break }
      }
      const id = near?.id ?? null
      if (id !== activeId.current) {
        activeId.current = id
        onActive(near)
      }
      // masuk gedung galeri
      if (Math.hypot(p.x - GALLERY.ring[0], p.z - GALLERY.ring[1]) < 1.3) {
        switching.current = true
        onWorldSwitch('room')
      }
    } else {
      // foto terdekat
      let near = null
      let best = 2.6
      for (const s of photoSpots) {
        const d = Math.hypot(p.x - (s.x + s.nx * 1.6), p.z - (s.z + s.nz * 1.6))
        if (d < best) { best = d; near = s }
      }
      const idx = near?.index ?? null
      if (idx !== activePhoto.current) {
        activePhoto.current = idx
        onPhoto(near)
      }
      if (Math.hypot(p.x - ROOM_EXIT[0], p.z - ROOM_EXIT[1]) < 1) {
        switching.current = true
        onWorldSwitch('city')
      }
    }
  })

  return (
    <>
      {/* senja: matahari rendah, langit oranye-ungu, kabut tipis */}
      <Sky sunPosition={[70, 9, 45]} turbidity={9} rayleigh={2.6} mieCoefficient={0.008} mieDirectionalG={0.9} />
      <fog attach="fog" args={['#c9a08f', 50, 210]} />
      <hemisphereLight args={['#aebfe0', '#5a4a44', 0.7]} />
      <Environment resolution={256} frames={1} environmentIntensity={0.7}>
        <Lightformer intensity={3} color="#ffb27a" position={[60, 8, 40]} scale={[80, 18, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={1.2} color="#8fa7e8" position={[0, 60, 0]} rotation-x={Math.PI / 2} scale={[160, 160, 1]} />
        <Lightformer intensity={0.6} color="#ff8fb8" position={[-60, 10, -40]} scale={[80, 14, 1]} target={[0, 0, 0]} />
      </Environment>
      <directionalLight
        ref={light}
        intensity={2.4}
        color="#ffc995"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-far={90}
      />

      <group visible={world === 'city'}>
        <City playerRef={player} />
        <Gate openRef={gateOpen} />
        {stationSpots.map((s, i) => (
          <ProjectBuilding key={s.id} data={s} index={i} activeRef={activeId} />
        ))}
      </group>

      <group visible={world === 'room'}>
        <GalleryRoom activePhotoRef={activePhoto} />
      </group>

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={0.95} intensity={0.75} radius={0.7} />
        <Vignette offset={0.3} darkness={0.55} />
        <SMAA />
      </EffectComposer>

      <Character
        playerRef={player}
        enabled={explore && ready}
        bounds={world === 'room' ? ROOM_BOUNDS : CITY_BOUNDS}
        obstacles={world === 'room' ? roomObstacles : cityObstacles}
      />
    </>
  )
}

