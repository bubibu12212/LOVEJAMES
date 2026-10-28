import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { makeFacadeMaterial, rng } from '../world'

// Kota futuristik malam untuk latar halaman awal: kamera terbang pelan maju di antara gedung.
const PERIOD = 96          // pola kota berulang tiap 96 unit, jadi terbangnya bisa tanpa ujung
const COPIES = [-4, -3, -2, -1, 0, 1]
const SPEED = 7
const dummy = new THREE.Object3D()
const color = new THREE.Color()
const NEON = ['#41e2ff', '#ff4fd8', '#ffb259', '#7c6bff']

function buildCity() {
  const r = rng(77)
  const pattern = []
  for (let gx = -168; gx <= 168; gx += 12) {
    if (Math.abs(gx) < 30) continue // koridor lebar di tengah (jalan & taman)
    for (let gz = 0; gz < PERIOD; gz += 12) {
      if (gz % 48 === 0) continue // jalan melintang
      const near = 1 - Math.min(1, (Math.abs(gx) - 30) / 120)
      const w = 6.5 + r() * 3.5
      const d = 6.5 + r() * 3.5
      const h = 8 + r() * 18 + near * (14 + r() * 40) + (r() < 0.06 ? 60 + r() * 50 : 0)
      pattern.push({ x: gx + (r() - 0.5) * 2, z: -gz - 6, w, d, h, tint: r(), neon: r() < 0.2 ? Math.floor(r() * NEON.length) : -1, spire: h > 60 && r() < 0.7 })
    }
  }
  return COPIES.flatMap((k) => pattern.map((t) => ({ ...t, z: t.z + k * PERIOD })))
}

function Skyline() {
  const towers = useMemo(() => buildCity(), [])
  const neon = useMemo(() => towers.filter((t) => t.neon >= 0), [towers])
  const spires = useMemo(() => towers.filter((t) => t.spire), [towers])
  const body = useRef()
  const crown = useRef()
  const strips = useRef()
  const tips = useRef()
  const mat = useMemo(() => makeFacadeMaterial({ lit: 0.1, glow: 2.2, seed: 9, floorH: 2.6, bayW: 1.3 }), [])
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), [])

  useLayoutEffect(() => {
    towers.forEach((t, i) => {
      dummy.rotation.set(0, 0, 0)
      dummy.position.set(t.x, 0, t.z)
      dummy.scale.set(t.w, t.h, t.d)
      dummy.updateMatrix()
      body.current.setMatrixAt(i, dummy.matrix)
      body.current.setColorAt(i, color.setHSL(0.6, 0.12, 0.12 + t.tint * 0.12))
      // mahkota: tingkat atas yang lebih ramping
      dummy.position.set(t.x, t.h, t.z)
      dummy.scale.set(t.w * 0.62, 4 + t.tint * 10, t.d * 0.62)
      dummy.updateMatrix()
      crown.current.setMatrixAt(i, dummy.matrix)
      crown.current.setColorAt(i, color.setHSL(0.6, 0.1, 0.1 + t.tint * 0.1))
    })
    neon.forEach((t, i) => {
      dummy.position.set(t.x + t.w / 2 + 0.05, 0, t.z + t.d / 2 + 0.05)
      dummy.scale.set(0.25, t.h, 0.25)
      dummy.updateMatrix()
      strips.current.setMatrixAt(i, dummy.matrix)
      strips.current.setColorAt(i, color.set(NEON[t.neon]).multiplyScalar(3))
    })
    spires.forEach((t, i) => {
      dummy.position.set(t.x, t.h + 4 + t.tint * 10, t.z)
      dummy.scale.set(0.35, 18, 0.35)
      dummy.updateMatrix()
      tips.current.setMatrixAt(i, dummy.matrix)
    })
    ;[body, crown, strips, tips].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true
      r.current.computeBoundingSphere()
    })
  }, [towers, neon, spires])

  return (
    <>
      <instancedMesh ref={body} args={[box, mat, towers.length]} />
      <instancedMesh ref={crown} args={[box, mat, towers.length]} />
      <instancedMesh ref={strips} args={[box, undefined, neon.length]}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={tips} args={[box, undefined, spires.length]}>
        <meshBasicMaterial color={[4, 0.6, 0.6]} toneMapped={false} />
      </instancedMesh>
    </>
  )
}

// kendaraan terbang: garis-garis cahaya yang melaju di jalur udara
function SkyTraffic() {
  const ref = useRef()
  const cars = useMemo(() => {
    const r = rng(12)
    return Array.from({ length: 260 }, () => {
      const lane = Math.floor(r() * 9) - 4
      const dir = r() < 0.5 ? 1 : -1
      return {
        x: lane * 14 + (dir > 0 ? 2.5 : -2.5),
        y: 24 + Math.floor(r() * 6) * 10,
        z: -r() * PERIOD * 5 + PERIOD,
        dir,
        speed: 22 + r() * 26,
        hot: r() < 0.5,
      }
    })
  }, [])

  useLayoutEffect(() => {
    cars.forEach((c, i) => ref.current.setColorAt(i, c.dir > 0 ? color.set(4, 3.2, 2.4) : color.set(4, 0.5, 0.35)))
    ref.current.instanceColor.needsUpdate = true
  }, [cars])

  useFrame((state, dt) => {
    const camZ = state.camera.position.z
    cars.forEach((c, i) => {
      c.z -= c.speed * c.dir * dt
      if (c.z < camZ - PERIOD * 4.5) c.z += PERIOD * 5
      if (c.z > camZ + PERIOD * 0.5) c.z -= PERIOD * 5
      dummy.position.set(c.x, c.y, c.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(0.35, 0.22, c.hot ? 3.2 : 2)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cars.length]} frustumCulled={false}>
      <boxGeometry />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

function Ground() {
  const lines = useMemo(() => {
    const out = []
    for (const x of [-6, 6]) out.push([x, 0.8])
    for (let x = -162; x <= 162; x += 24) if (Math.abs(x) > 30) out.push([x, 0.35])
    return out
  }, [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -150]}>
        <planeGeometry args={[600, 900]} />
        <meshStandardMaterial color="#07090d" roughness={0.35} metalness={0.6} />
      </mesh>
      {lines.map(([x, w], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.05, -150]}>
          <planeGeometry args={[w, 900]} />
          <meshBasicMaterial color={x === -6 ? [3, 1.6, 0.6] : x === 6 ? [3, 0.5, 0.4] : [0.5, 1.2, 1.8]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

// langit: gradasi biru tua ke ungu-oranye di cakrawala
function SkyDome() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP;
      void main(){
        float h = clamp(vP.y, -0.1, 1.0);
        vec3 top = vec3(0.01, 0.015, 0.05);
        vec3 mid = vec3(0.09, 0.05, 0.2);
        vec3 hor = vec3(0.55, 0.2, 0.32);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.18, h));
        c = mix(c, top, smoothstep(0.18, 0.7, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  }), [])
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[800, 32, 16]} />
    </mesh>
  )
}

function Rig() {
  const pointer = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const move = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  useFrame((state, dt) => {
    const cam = state.camera
    const t = state.clock.elapsedTime
    const z = 40 - ((t * SPEED) % PERIOD)
    const px = pointer.current.x * 8
    const py = 88 - pointer.current.y * 6
    cam.position.x = THREE.MathUtils.damp(cam.position.x, px + Math.sin(t * 0.2) * 2, 2, dt)
    cam.position.y = THREE.MathUtils.damp(cam.position.y, py, 2, dt)
    cam.position.z = z
    cam.lookAt(cam.position.x * 0.4, 0, z - 170)
    cam.rotation.z += Math.sin(t * 0.15) * 0.015
  })
  return null
}

export default function HeroCity() {
  const wrap = useRef()
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(wrap.current)
    return () => io.disconnect()
  }, [])

  return (
    <div className="hero-canvas" ref={wrap}>
      <Canvas dpr={[1, 1.5]} frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 88, 40], fov: 50, near: 0.5, far: 1200 }}>
        <fog attach="fog" args={['#2b1631', 90, 480]} />
        <SkyDome />
        <Stars radius={500} depth={60} count={2500} factor={6} fade speed={0.4} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[-60, 80, -200]} intensity={0.8} color="#9f86ff" />
        <Environment resolution={128} frames={1} environmentIntensity={0.18}>
          <Lightformer intensity={2} color="#ff6aa8" position={[0, 6, -60]} scale={[200, 12, 1]} />
          <Lightformer intensity={1} color="#5fd3f3" position={[0, 40, 0]} rotation-x={Math.PI / 2} scale={[100, 100, 1]} />
        </Environment>
        <Skyline />
        <SkyTraffic />
        <Ground />
        <Rig />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.6} intensity={0.9} radius={0.7} />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
