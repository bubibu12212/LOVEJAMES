import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Stars, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import Character from './Character'
import GardenGate from './GardenGate'
import Garden from './Garden'
import Journey from './Journey'
import Buildings from './Buildings'
import Interior from './Interior'
import ContactSpot from './ContactSpot'
import {
  camState, windTime, pushOut, journeySpots, buildingSpots, gardenObstacles, roomObstacles,
  GARDEN_BOUNDS, ROOM_BOUNDS, ROOM, ROOM_SPAWN, ROOM_EXIT, SCREEN_SPOT, CONTACT, PLAYER_START,
} from '../world'

const camPos = new THREE.Vector3()
const camLook = new THREE.Vector3()
const lookNow = new THREE.Vector3(0, 4, 0)
const focusPos = new THREE.Vector3()
const gateCam = new THREE.Vector3()
const gateLook = new THREE.Vector3()
const entryFrom = new THREE.Vector3()
const entryLook = new THREE.Vector3()
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const smooth = (a, b, x) => THREE.MathUtils.smoothstep(x, a, b)

// langit malam musim semi: biru tua di atas, ungu-merah muda di cakrawala, bulan & bintang
function NightSky() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vP;
      void main(){
        float h = clamp(vP.y, -0.2, 1.0);
        vec3 top = vec3(0.015, 0.02, 0.06);
        vec3 mid = vec3(0.08, 0.05, 0.16);
        vec3 hor = vec3(0.42, 0.16, 0.3);
        vec3 c = mix(hor, mid, smoothstep(-0.02, 0.22, h));
        c = mix(c, top, smoothstep(0.22, 0.8, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }), [])
  const halo = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,240,230,0.55)')
    grad.addColorStop(1, 'rgba(255,200,220,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  return (
    <group>
      <mesh material={mat} renderOrder={-1}>
        <sphereGeometry args={[350, 32, 16]} />
      </mesh>
      <Stars radius={300} depth={40} count={1400} factor={5} fade speed={0.3} />
      <group position={[150, 80, -240]}>
        <mesh>
          <circleGeometry args={[9, 48]} />
          <meshBasicMaterial color="#fff1e4" toneMapped={false} fog={false} />
        </mesh>
        <mesh position={[0, 0, -1]}>
          <planeGeometry args={[70, 70]} />
          <meshBasicMaterial map={halo} transparent depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  )
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

// mode: 'scroll' (kamera digerakkan scroll halaman) | 'explore' (bebas jalan)
// world: 'garden' | id project (di dalam gedung)
// onFocus({ type: 'story' | 'door' | 'contact' | 'screen', data }) = hal di dekat pemain (untuk HUD)
export default function Scene({ mode, world, progressRef, onFocus, onWorldSwitch, onOpenProject, onOpenContact }) {
  const player = useRef()
  const light = useRef()
  const playerLight = useRef()
  const story = useRef(null)
  const door = useRef(null)
  const contact = useRef(false)
  const screen = useRef(false)
  const focusKey = useRef(null)
  const gateOpen = useRef(0)
  const focus = useRef(0)
  const switching = useRef(false)
  const lastBuilding = useRef(null)
  const prevWorld = useRef(world)
  const entry = useRef(1)
  const [ready, setReady] = useState(false)
  const { camera } = useThree()
  const explore = mode === 'explore'
  const inRoom = world !== 'garden'
  const project = buildingSpots.find((b) => b.id === world) ?? null
  useOrbitControls(explore && ready)

  // pindah dunia: taruh pemain di titik masuk.
  // Dibandingkan dengan dunia sebelumnya (bukan posisi pemain), dan pakai useLayoutEffect supaya
  // berjalan sebelum frame berikutnya: kalau tombol jalan masih ditekan, posisi lama sempat
  // terpotong batas taman sehingga pemain muncul lagi di gerbang.
  useLayoutEffect(() => {
    const p = player.current
    const from = prevWorld.current
    prevWorld.current = world
    let spawn = null
    if (world !== 'garden') {
      spawn = ROOM_SPAWN
      lastBuilding.current = world
    } else if (from !== 'garden') {
      const b = buildingSpots.find((s) => s.id === lastBuilding.current)
      spawn = b ? b.back : PLAYER_START
    }
    if (spawn) {
      p.position.set(...spawn)
      p.rotation.y = Math.PI
      camState.yaw = 0
      camera.position.set(spawn[0], 4, spawn[2] + 6)
      lookNow.set(spawn[0], 1.25, spawn[2])
    }
    story.current = null
    door.current = null
    contact.current = false
    screen.current = false
    focusKey.current = null
    switching.current = false
  }, [world, camera])

  // masuk: kamera terbang pelan lewat gerbang ke belakang karakter.
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

  const setFocus = (type, data) => {
    const key = type ? `${type}:${data?.id ?? data?.index ?? ''}` : null
    if (key === focusKey.current) return
    focusKey.current = key
    onFocus(type ? { type, data } : null)
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = player.current.position
    windTime.value = state.clock.elapsedTime

    if (!explore) {
      if (ready) setReady(false)
      // ===== mode scroll: kamera mendekat pelan ke gerbang & pintu terbuka (tidak masuk otomatis) =====
      const t = progressRef.current
      gateOpen.current = smooth(0.12, 0.7, t)
      const e = smooth(0, 1, t)
      gateCam.set(0, 2.6 - e * 0.5, 22 - e * 8)
      gateLook.set(0, 4.6 - e * 1.4, -4)
      const k = 1 - Math.exp(-5 * dt)
      camera.position.lerp(gateCam, k)
      lookNow.lerp(gateLook, k)
      camera.lookAt(lookNow)
    } else {
      gateOpen.current = 1
      // saat panel cerita muncul, kamera mundur & sedikit mendongak supaya panel terlihat utuh
      const s = !inRoom && journeySpots[story.current]
      focus.current = THREE.MathUtils.damp(focus.current, s ? 1 : 0, 3, dt)
      const f = focus.current
      if (s) focusPos.set(s.x - s.side * 0.6, 2.2, s.z)
      const { yaw } = camState
      let pitch = camState.pitch + f * Math.max(0, 0.22 - camState.pitch)
      let dist = camState.dist + f * Math.max(0, 7.5 - camState.dist)
      if (inRoom) {
        // di dalam ruangan kamera lebih dekat & datar
        pitch = Math.min(pitch, 0.24)
        dist = Math.min(dist, 4.6)
      }
      const flat = Math.cos(pitch) * dist
      camPos.set(p.x + Math.sin(yaw) * flat, p.y + 1.2 + Math.sin(pitch) * dist, p.z + Math.cos(yaw) * flat)
      camLook.set(p.x, p.y + (inRoom ? 1.6 : 1.25), p.z)
      camLook.lerp(focusPos, f * 0.45)

      if (inRoom) {
        camPos.x = THREE.MathUtils.clamp(camPos.x, -ROOM.halfW + 0.4, ROOM.halfW - 0.4)
        camPos.z = THREE.MathUtils.clamp(camPos.z, ROOM.cz - ROOM.halfD + 0.4, ROOM.cz + ROOM.halfD - 0.4)
        camPos.y = Math.min(camPos.y, ROOM.height - 0.4)
      } else {
        // jangan sampai kamera masuk ke dalam gedung, pohon, atau lentera
        pushOut(camPos, gardenObstacles, 0.6, true)
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

    // bayangan bulan & lampu hangat ikut pemain
    light.current.position.set(p.x - 16, 30, p.z + 12)
    light.current.target.position.set(p.x, 0, p.z)
    light.current.target.updateMatrixWorld()
    playerLight.current.position.set(p.x + 0.8, p.y + 3.2, p.z + 1.6)

    if (!explore || !ready || switching.current) return

    if (!inRoom) {
      // pintu gedung terdekat
      let nearDoor = null
      for (const b of buildingSpots) {
        const d = Math.hypot(p.x - b.door[0], p.z - b.door[1])
        if (d < 1.0) {
          switching.current = true
          onWorldSwitch(b.id)
          return
        }
        if (d < 3) nearDoor = b
      }
      door.current = nearDoor?.id ?? null
      // cerita terdekat
      let near = null
      let best = 3.6
      for (const s of journeySpots) {
        const d = Math.hypot(p.x - (s.x - s.side * 0.5), p.z - s.z)
        if (d < best) { best = d; near = s }
      }
      story.current = near?.index ?? null
      contact.current = Math.hypot(p.x - CONTACT.x, p.z - (CONTACT.z - 2)) < 5.5
      if (nearDoor) setFocus('door', nearDoor)
      else if (near) setFocus('story', near)
      else if (contact.current) setFocus('contact', null)
      else setFocus(null)
    } else {
      screen.current = Math.hypot(p.x - SCREEN_SPOT[0], p.z - SCREEN_SPOT[1]) < 2.6
      setFocus(screen.current ? 'screen' : 'room', project)
      if (Math.hypot(p.x - ROOM_EXIT[0], p.z - ROOM_EXIT[1]) < 0.9) {
        switching.current = true
        onWorldSwitch('garden')
      }
    }
  })

  return (
    <>
      <NightSky />
      <fog attach="fog" args={['#191326', 30, 165]} />
      <hemisphereLight args={['#6a6fb0', '#20160f', 0.6]} />
      <ambientLight intensity={0.14} />
      <Environment resolution={256} frames={1} environmentIntensity={0.5}>
        <Lightformer intensity={2.2} color="#ff7eb6" position={[40, 10, -20]} scale={[60, 10, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={1.8} color="#7fe8ff" position={[-40, 12, -10]} scale={[60, 10, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={1.2} color="#ffb070" position={[0, 8, 50]} scale={[80, 12, 1]} target={[0, 0, 0]} />
        <Lightformer intensity={0.5} color="#3a4a80" position={[0, 60, 0]} rotation-x={Math.PI / 2} scale={[160, 160, 1]} />
      </Environment>
      {/* cahaya bulan (bayangan) */}
      <directionalLight
        ref={light}
        intensity={0.85}
        color="#b7c3ff"
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
      <pointLight ref={playerLight} intensity={7} distance={8} color="#ffc48a" />

      <group visible={!inRoom}>
        <Garden playerRef={player} />
        <GardenGate openRef={gateOpen} />
        <Journey activeRef={story} />
        <Buildings nearRef={door} />
        <ContactSpot activeRef={contact} onOpen={onOpenContact} />
      </group>

      {inRoom && <Interior project={project} nearRef={screen} onOpen={onOpenProject} />}

      <Character
        playerRef={player}
        enabled={explore && ready}
        bounds={inRoom ? ROOM_BOUNDS : GARDEN_BOUNDS}
        obstacles={inRoom ? (roomObstacles[project?.interior] ?? []) : gardenObstacles}
      />
    </>
  )
}
