import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import TokyoTower from './TokyoTower'
import { makeFacadeMaterial, rng } from '../world'

const dummy = new THREE.Object3D()

// tekstur awan lembut dibuat dari banyak gumpalan radial
function cloudTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const r = rng(4)
  for (let i = 0; i < 70; i++) {
    const x = 128 + (r() - 0.5) * 160
    const y = 150 + (r() - 0.5) * 60 - Math.abs(r() - 0.5) * 40
    const rad = 14 + r() * 34
    const grad = g.createRadialGradient(x, y - rad * 0.2, 0, x, y, rad)
    grad.addColorStop(0, 'rgba(255,255,255,0.75)')
    grad.addColorStop(0.55, 'rgba(235,235,238,0.45)')
    grad.addColorStop(1, 'rgba(200,200,210,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 256)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Clouds() {
  const tex = useMemo(() => cloudTexture(), [])
  const puffs = useMemo(() => {
    const r = rng(21)
    return Array.from({ length: 30 }, (_, i) => ({
      x: -14 + r() * 30,
      y: i < 24 ? -1.5 + r() * 4 : 30 + r() * 6,
      z: -4 + r() * 14,
      s: i < 24 ? 4 + r() * 6 : 4 + r() * 3,
      speed: 0.25 + r() * 0.4,
      rot: r() * Math.PI,
      shade: 0.55 + r() * 0.35,
    }))
  }, [])
  const refs = useRef([])
  useFrame((_, dt) => {
    puffs.forEach((p, i) => {
      p.x += p.speed * dt
      if (p.x > 20) p.x = -18
      const m = refs.current[i]
      if (m) m.position.x = p.x
    })
  })
  return puffs.map((p, i) => (
    <sprite key={i} ref={(m) => { refs.current[i] = m }} position={[p.x, p.y, p.z]} scale={[p.s * 1.6, p.s, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} rotation={p.rot * 0.1} color={[p.shade, p.shade * 0.97, p.shade * 0.97]} opacity={0.85} />
    </sprite>
  ))
}

// kota kecil di kaki menara
function BaseCity() {
  const ref = useRef()
  const mat = useMemo(() => makeFacadeMaterial({ lit: 0.3, glow: 1.8, seed: 5, floorH: 0.9, bayW: 0.55 }), [])
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), [])
  const blocks = useMemo(() => {
    const r = rng(8)
    const out = []
    for (let i = 0; i < 260; i++) {
      const ang = r() * Math.PI * 2
      const d = 8 + r() * 30
      const x = Math.cos(ang) * d
      const z = Math.sin(ang) * d
      if (Math.abs(x) < 6.5 && Math.abs(z) < 6.5) continue
      if (z > 8) continue // jangan terlalu dekat kamera
      out.push({ x, z, w: 1.2 + r() * 2.2, d: 1.2 + r() * 2.2, h: 0.8 + r() * (d < 20 ? 2.5 : 5) })
    }
    return out
  }, [])
  useLayoutEffect(() => {
    const color = new THREE.Color()
    blocks.forEach((t, i) => {
      dummy.position.set(t.x, -1.5, t.z)
      dummy.scale.set(t.w, t.h, t.d)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
      ref.current.setColorAt(i, color.setHSL(0.6, 0.08, 0.1 + (i % 5) * 0.02))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [blocks])
  return <instancedMesh ref={ref} args={[geo, mat, blocks.length]} />
}

function Rig() {
  const pointer = useRef({ x: 0, y: 0 })
  const look = useMemo(() => new THREE.Vector3(), [])
  useEffect(() => {
    const move = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  useFrame((state, dt) => {
    const { camera, size } = state
    const t = state.clock.elapsedTime
    const wide = size.width / size.height > 1.1
    // orbit pelan mengitari menara + sedikit ikut mouse
    const ang = Math.sin(t * 0.06) * 0.35 + pointer.current.x * 0.08
    const dist = wide ? 66 : 84
    const tx = Math.sin(ang) * dist
    const tz = Math.cos(ang) * dist
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tx, 2, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tz, 2, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 10 - pointer.current.y * 2, 2, dt)
    // geser titik pandang ke kiri supaya menara ada di sisi kanan layar (seperti desain)
    const right = new THREE.Vector3().set(Math.cos(ang), 0, -Math.sin(ang))
    look.set(0, 16.5, 0).addScaledVector(right, wide ? -17 : 0)
    camera.lookAt(look)
  })
  return null
}

function UpLight({ target, ...props }) {
  const ref = useRef()
  useLayoutEffect(() => {
    ref.current.target.position.set(...target)
    ref.current.target.updateMatrixWorld()
  }, [target])
  return <spotLight ref={ref} angle={0.5} penumbra={0.8} distance={70} {...props} />
}

// lingkaran merah besar di belakang menara (seperti matahari terbit)
function RedSun() {
  const ref = useRef()
  useFrame(({ camera }) => {
    // selalu menghadap kamera, tetap di belakang menara
    const d = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).setY(0).normalize()
    ref.current.position.set(-d.x * 40, 16, -d.z * 40)
    ref.current.lookAt(camera.position.x, 16, camera.position.z)
  })
  return (
    <mesh ref={ref}>
      <circleGeometry args={[19, 96]} />
      <meshBasicMaterial color="#c9231b" toneMapped={false} fog={false} />
    </mesh>
  )
}

export default function TokyoHero() {
  const wrap = useRef()
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(wrap.current)
    return () => io.disconnect()
  }, [])

  return (
    <div className="hero-canvas" ref={wrap}>
      <Canvas dpr={[1, 1.75]} frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 8, 44], fov: 38, near: 0.5, far: 400 }}>
        <color attach="background" args={['#0a0a0b']} />
        <fog attach="fog" args={['#0a0a0b', 70, 140]} />
        <RedSun />
        <ambientLight intensity={0.12} />
        <hemisphereLight args={['#6d7a9a', '#20140f', 0.35]} />
        {/* lampu sorot dari bawah, seperti Tokyo Tower di malam hari */}
        <UpLight position={[10, -1, 14]} target={[0, 18, 0]} intensity={900} color="#ffb070" />
        <UpLight position={[-12, -1, 10]} target={[0, 16, 0]} intensity={650} color="#ff9a5a" />
        <directionalLight position={[-30, 30, 20]} intensity={0.9} color="#ffe2c4" />
        <directionalLight position={[20, 10, -30]} intensity={0.6} color="#8fb4ff" />
        <TokyoTower position={[0, -1.5, 0]} />
        <BaseCity />
        <Clouds />
        <Rig />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.7} radius={0.65} />
          <Vignette offset={0.3} darkness={0.6} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
