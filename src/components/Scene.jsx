import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
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
  const activeSince = useRef(0)
  const switching = useRef(false)
  const { camera } = useThree()
  const explore = mode === 'explore'
  useOrbitControls(explore)

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

  // keluar dari mode jelajah: kembalikan pemain ke titik awal supaya animasi gerbang tetap pas
  useEffect(() => {
    if (explore) return
    player.current.position.set(...PLAYER_START)
    player.current.rotation.y = 0
    Object.assign(camState, { yaw: 0, pitch: 0.38, dist: 7 })
  }, [explore])

  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05)
    const p = player.current.position
    windTime.value = state.clock.elapsedTime
    const inRoom = world === 'room'

    if (!explore) {
      // ===== mode scroll: kamera mendekati gerbang, pintu terbuka, lalu masuk ke kota =====
      const t = progressRef.current
      gateOpen.current = smooth(0.1, 0.48, t)
      const enter = smooth(0.42, 1, t)
      gateCam.set(0, 3.2 - t * 0.8, 26 - Math.min(t, 0.42) * 16)
      gateLook.set(0, 7 - t * 4, 0)
      const { yaw, pitch, dist } = camState
      const flat = Math.cos(pitch) * dist
      camPos.set(p.x + Math.sin(yaw) * flat, 1.2 + Math.sin(pitch) * dist, p.z + Math.cos(yaw) * flat)
      camLook.set(p.x, 1.25, p.z)
      camPos.lerpVectors(gateCam, camPos, enter)
      camLook.lerpVectors(gateLook, camLook, enter)
      const k = 1 - Math.exp(-10 * dt)
      camera.position.lerp(camPos, k)
      lookNow.lerp(camLook, k)
      camera.lookAt(lookNow)
    } else {
      gateOpen.current = 1
      // saat papan muncul, kamera mundur & mendongak supaya papan terlihat utuh
      const board = !inRoom && stationSpots.find((s) => s.id === activeId.current)
      focus.current = THREE.MathUtils.damp(focus.current, board ? 1 : 0, 3, dt)
      const f = focus.current
      if (board) {
        boardPos.set(board.side * 7.4, 3.1, board.z)
        if (state.clock.elapsedTime - activeSince.current < 1.8) {
          const want = Math.atan2(p.x - boardPos.x, p.z - boardPos.z)
          const diff = Math.atan2(Math.sin(want - camState.yaw), Math.cos(want - camState.yaw))
          camState.yaw += diff * (1 - Math.exp(-3 * dt))
        }
      }
      const { yaw } = camState
      let pitch = camState.pitch + f * Math.max(0, 0.3 - camState.pitch)
      let dist = camState.dist + f * Math.max(0, 8.5 - camState.dist)
      if (inRoom) {
        // di dalam ruangan kamera lebih dekat & datar supaya foto di dinding terlihat
        pitch = Math.min(pitch, 0.22)
        dist = Math.min(dist, 4.8)
      }
      const flat = Math.cos(pitch) * dist
      camPos.set(p.x + Math.sin(yaw) * flat, 1.2 + Math.sin(pitch) * dist, p.z + Math.cos(yaw) * flat)
      camLook.set(p.x, inRoom ? 1.7 : 1.25, p.z)
      camLook.lerp(boardPos, f * 0.6)

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
      const k = 1 - Math.exp(-4 * dt)
      camera.position.lerp(camPos, k)
      lookNow.lerp(camLook, k)
      camera.lookAt(lookNow)
    }

    // bayangan ikut pemain
    light.current.position.set(p.x + 14, 26, p.z + 18)
    light.current.target.position.set(p.x, 0, p.z)
    light.current.target.updateMatrixWorld()

    if (!explore || switching.current) return

    if (!inRoom) {
      // gedung project terdekat
      let near = null
      for (const s of stationSpots) {
        if (Math.hypot(p.x - s.ring[0], p.z - s.ring[1]) < 2.1) { near = s; break }
      }
      const id = near?.id ?? null
      if (id !== activeId.current) {
        activeId.current = id
        activeSince.current = state.clock.elapsedTime
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
      <Sky sunPosition={[40, 14, 60]} turbidity={7} rayleigh={1.6} mieCoefficient={0.006} mieDirectionalG={0.88} />
      <fog attach="fog" args={['#d7c8b6', 45, 170]} />
      <hemisphereLight args={['#dfe9f5', '#6b6158', 0.85]} />
      <directionalLight
        ref={light}
        intensity={2.6}
        color="#ffe2bd"
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

      <Character
        playerRef={player}
        enabled={explore}
        bounds={world === 'room' ? ROOM_BOUNDS : CITY_BOUNDS}
        obstacles={world === 'room' ? roomObstacles : cityObstacles}
      />
    </>
  )
}

