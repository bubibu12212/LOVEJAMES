import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  towers, lamps, planters, makeFacadeMaterial, applyWind, rng,
  AVENUE_HALF, CROSS_Z, ROAD_W, SIDE_AVENUE_X, GALLERY,
} from '../world'
import { canopyGeometry } from '../geometry'

const dummy = new THREE.Object3D()
const color = new THREE.Color()
const FACADES = ['#d8d4cc', '#b9a68f', '#4b525b', '#e6e6e3', '#7f8d9b', '#a3a8ad', '#c4b8a6']

function finish(...refs) {
  refs.forEach((r) => {
    r.current.instanceMatrix.needsUpdate = true
    if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true
    r.current.computeBoundingSphere()
  })
}

// tekstur paving boulevard
function pavingTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const r = rng(3)
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const l = 74 + r() * 8
      g.fillStyle = `hsl(32, 8%, ${l}%)`
      g.fillRect(x * 64, y * 64, 64, 64)
    }
  }
  g.strokeStyle = 'rgba(80,70,60,0.45)'
  g.lineWidth = 3
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke()
    g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function Ground() {
  const paving = useMemo(() => pavingTexture(), [])
  const boulevard = useMemo(() => { const t = paving.clone(); t.repeat.set(AVENUE_HALF, 28); t.needsUpdate = true; return t }, [paving])
  const sidewalk = useMemo(() => { const t = paving.clone(); t.repeat.set(1.8, 28); t.needsUpdate = true; return t }, [paving])
  const plaza = useMemo(() => { const t = paving.clone(); t.repeat.set(16, 10); t.needsUpdate = true; return t }, [paving])
  const roadLen = 320

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, -40]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#8c8e8f" roughness={0.95} />
      </mesh>

      {/* boulevard & trotoar */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, -19.25]} receiveShadow>
        <planeGeometry args={[AVENUE_HALF * 2, 56.5]} />
        <meshStandardMaterial map={boulevard} roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation-x={-Math.PI / 2} position={[s * 6.25, 0.004, -19.25]} receiveShadow>
          <planeGeometry args={[3.5, 56.5]} />
          <meshStandardMaterial map={sidewalk} color="#cfcac2" roughness={0.9} />
        </mesh>
      ))}
      {/* plaza depan gerbang */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 16]} receiveShadow>
        <planeGeometry args={[64, 32]} />
        <meshStandardMaterial map={plaza} roughness={0.85} />
      </mesh>

      {/* jalan raya */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, CROSS_Z]} receiveShadow>
        <planeGeometry args={[roadLen, ROAD_W]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -64]} receiveShadow>
        <planeGeometry args={[roadLen, ROAD_W]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation-x={-Math.PI / 2} position={[s * SIDE_AVENUE_X, 0.011, -55]} receiveShadow>
          <planeGeometry args={[ROAD_W, roadLen]} />
          <meshStandardMaterial color="#2c2f33" roughness={0.9} />
        </mesh>
      ))}
      <RoadMarks />
    </group>
  )
}

// garis putus-putus jalan + zebra cross
function RoadMarks() {
  const ref = useRef()
  const marks = useMemo(() => {
    const out = []
    for (let x = -150; x < 150; x += 4) {
      if (Math.abs(x) < AVENUE_HALF + 1) continue
      out.push([x, CROSS_Z, 2, 0.14], [x, -64, 2, 0.14])
    }
    for (let z = 40; z > -200; z -= 4) {
      if (Math.abs(z - CROSS_Z) < 4.5 || Math.abs(z + 64) < 4.5) continue
      out.push([SIDE_AVENUE_X, z, 0.14, 2], [-SIDE_AVENUE_X, z, 0.14, 2])
    }
    for (let x = -AVENUE_HALF + 0.5; x <= AVENUE_HALF - 0.4; x += 0.95) out.push([x, CROSS_Z, 0.5, ROAD_W - 1.4])
    return out
  }, [])

  useLayoutEffect(() => {
    marks.forEach(([x, z, w, d], i) => {
      dummy.position.set(x, 0.02, z)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.scale.set(w, d, 1)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    finish(ref)
  }, [marks])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, marks.length]} receiveShadow>
      <planeGeometry />
      <meshStandardMaterial color="#e9e6dc" roughness={0.8} />
    </instancedMesh>
  )
}

function Towers() {
  const body = useRef()
  const roof = useRef()
  const mat = useMemo(() => makeFacadeMaterial({ lit: 0.3, seed: 2 }), [])
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), [])

  useLayoutEffect(() => {
    towers.forEach((t, i) => {
      dummy.rotation.set(0, 0, 0)
      dummy.position.set(t.x, 0, t.z)
      dummy.scale.set(t.w, t.h, t.d)
      dummy.updateMatrix()
      body.current.setMatrixAt(i, dummy.matrix)
      body.current.setColorAt(i, color.set(FACADES[Math.floor(t.tint * FACADES.length)]))
      dummy.position.set(t.x + (t.seed - 0.5) * t.w * 0.3, t.h, t.z + (t.tint - 0.5) * t.d * 0.3)
      dummy.scale.set(t.w * 0.45, 1 + t.seed * 1.6, t.d * 0.45)
      dummy.updateMatrix()
      roof.current.setMatrixAt(i, dummy.matrix)
    })
    finish(body, roof)
  }, [])

  return (
    <>
      <instancedMesh ref={body} args={[geo, mat, towers.length]} castShadow receiveShadow />
      <instancedMesh ref={roof} args={[geo, undefined, towers.length]} castShadow>
        <meshStandardMaterial color="#6f7378" roughness={0.8} metalness={0.3} />
      </instancedMesh>
    </>
  )
}

function Lamps() {
  const pole = useRef()
  const head = useRef()

  useLayoutEffect(() => {
    lamps.forEach(([x, z], i) => {
      const s = Math.sign(x)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.position.set(x, 2.3, z)
      dummy.updateMatrix()
      pole.current.setMatrixAt(i, dummy.matrix)
      dummy.position.set(x - s * 0.45, 4.55, z)
      dummy.updateMatrix()
      head.current.setMatrixAt(i, dummy.matrix)
    })
    finish(pole, head)
  }, [])

  return (
    <>
      <instancedMesh ref={pole} args={[undefined, undefined, lamps.length]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 4.6, 8]} />
        <meshStandardMaterial color="#2b2f34" roughness={0.5} metalness={0.6} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, lamps.length]}>
        <boxGeometry args={[1.1, 0.12, 0.32]} />
        <meshStandardMaterial color="#fff3d9" emissive="#ffd9a0" emissiveIntensity={1.6} />
      </instancedMesh>
    </>
  )
}

function Planters() {
  const box = useRef()
  const trunk = useRef()
  const crown = useRef()
  const geo = useMemo(() => canopyGeometry(), [])
  const mat = useMemo(() => applyWind(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), 0.012, 4), [])

  useLayoutEffect(() => {
    planters.forEach(([x, z], i) => {
      dummy.rotation.set(0, i * 1.3, 0)
      dummy.scale.set(1, 1, 1)
      dummy.position.set(x, 0.3, z)
      dummy.updateMatrix()
      box.current.setMatrixAt(i, dummy.matrix)
      dummy.position.set(x, 1.4, z)
      dummy.updateMatrix()
      trunk.current.setMatrixAt(i, dummy.matrix)
      dummy.position.set(x, 0, z)
      dummy.scale.setScalar(0.9 + (i % 3) * 0.08)
      dummy.updateMatrix()
      crown.current.setMatrixAt(i, dummy.matrix)
      crown.current.setColorAt(i, color.setHSL(0.24 + (i % 4) * 0.02, 0.42, 0.27 + (i % 3) * 0.03))
    })
    finish(box, trunk, crown)
  }, [])

  return (
    <>
      <instancedMesh ref={box} args={[undefined, undefined, planters.length]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.6, 1.7]} />
        <meshStandardMaterial color="#a9a49b" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={trunk} args={[undefined, undefined, planters.length]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 2.4, 8]} />
        <meshStandardMaterial color="#4a3a2c" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crown} args={[geo, mat, planters.length]} castShadow receiveShadow />
    </>
  )
}

// ---------------- lalu lintas ----------------
const CAR_COLORS = ['#e8e8e8', '#1f2328', '#b3202a', '#2d5c9e', '#8d9399', '#f2c14e', '#3d6b55']

function Car({ carRef, paint }) {
  return (
    <group ref={carRef}>
      <RoundedBox args={[1.9, 0.62, 4.3]} radius={0.18} position={[0, 0.58, 0]} castShadow>
        <meshStandardMaterial color={paint} roughness={0.3} metalness={0.6} />
      </RoundedBox>
      <RoundedBox args={[1.62, 0.56, 2.3]} radius={0.2} position={[0, 1.08, -0.2]} castShadow>
        <meshStandardMaterial color="#1b2430" roughness={0.1} metalness={0.8} />
      </RoundedBox>
      {[[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.34, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.34, 0.34, 0.26, 16]} />
          <meshStandardMaterial color="#141414" roughness={0.8} />
        </mesh>
      ))}
      {[-0.6, 0.6].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.66, 2.16]}>
            <boxGeometry args={[0.42, 0.12, 0.04]} />
            <meshStandardMaterial color="#fffbe8" emissive="#fff3c4" emissiveIntensity={2} />
          </mesh>
          <mesh position={[x, 0.68, -2.16]}>
            <boxGeometry args={[0.42, 0.1, 0.04]} />
            <meshStandardMaterial color="#ff3b3b" emissive="#ff2020" emissiveIntensity={1.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Traffic({ playerRef }) {
  const cars = useMemo(() => {
    const r = rng(9)
    const out = []
    // axis 'x' = jalan melintang, 'z' = jalan memanjang. dir = arah gerak
    const lanes = [
      { axis: 'x', fixed: CROSS_Z - 1.7, dir: 1, min: -110, max: 110, stop: true },
      { axis: 'x', fixed: CROSS_Z + 1.7, dir: -1, min: -110, max: 110, stop: true },
      { axis: 'x', fixed: -64 - 1.7, dir: 1, min: -110, max: 110 },
      { axis: 'z', fixed: SIDE_AVENUE_X + 1.7, dir: 1, min: -170, max: 50 },
      { axis: 'z', fixed: SIDE_AVENUE_X - 1.7, dir: -1, min: -170, max: 50 },
      { axis: 'z', fixed: -SIDE_AVENUE_X + 1.7, dir: 1, min: -170, max: 50 },
      { axis: 'z', fixed: -SIDE_AVENUE_X - 1.7, dir: -1, min: -170, max: 50 },
    ]
    lanes.forEach((lane) => {
      const n = lane.axis === 'x' ? 3 : 3
      for (let i = 0; i < n; i++) {
        out.push({
          lane,
          pos: lane.min + ((i + r() * 0.5) / n) * (lane.max - lane.min),
          base: 7 + r() * 4,
          speed: 8,
          paint: CAR_COLORS[Math.floor(r() * CAR_COLORS.length)],
        })
      }
    })
    return out
  }, [])
  const refs = useRef([])

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const p = playerRef.current?.position
    cars.forEach((c, i) => {
      const { lane } = c
      let target = c.base
      if (lane.stop && p) {
        const ahead = (p.x - c.pos) * lane.dir
        if (ahead > 0 && ahead < 8 && Math.abs(p.z - lane.fixed) < 2.6) target = 0 // berhenti untuk pejalan kaki
      }
      // jaga jarak dengan mobil di depan pada jalur yang sama
      cars.forEach((o) => {
        if (o === c || o.lane !== lane) return
        const gap = (o.pos - c.pos) * lane.dir
        if (gap > 0 && gap < 7) target = Math.min(target, o.speed * 0.9)
      })
      c.speed = THREE.MathUtils.damp(c.speed, target, 3, dt)
      c.pos += c.speed * lane.dir * dt
      if (c.pos > lane.max) c.pos = lane.min
      if (c.pos < lane.min) c.pos = lane.max
      const g = refs.current[i]
      if (!g) return
      if (lane.axis === 'x') {
        g.position.set(c.pos, 0, lane.fixed)
        g.rotation.y = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2
      } else {
        g.position.set(lane.fixed, 0, c.pos)
        g.rotation.y = lane.dir > 0 ? 0 : Math.PI
      }
    })
  })

  return cars.map((c, i) => <Car key={i} paint={c.paint} carRef={(el) => { refs.current[i] = el }} />)
}

function GalleryBuilding() {
  const mat = useMemo(() => {
    const m = makeFacadeMaterial({ lit: 0, floorH: 100, seed: 4 })
    m.color.set('#ecebe7')
    return m
  }, [])
  const W = 20
  const D = 2 * (GALLERY.front - GALLERY.z)
  const H = 10

  return (
    <group position={[0, 0, GALLERY.z]}>
      <mesh material={mat} position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
      </mesh>
      {/* kanopi kantilever */}
      <mesh position={[0, 6.4, D / 2 + 1.6]} castShadow>
        <boxGeometry args={[14, 0.5, 3.4]} />
        <meshStandardMaterial color="#f5f4f1" roughness={0.6} />
      </mesh>
      {/* dinding kaca lobi yang menyala */}
      <mesh position={[0, 3, D / 2 + 0.02]}>
        <boxGeometry args={[11, 5.6, 0.1]} />
        <meshStandardMaterial color="#2a3640" emissive="#ffd9a6" emissiveIntensity={0.55} roughness={0.1} metalness={0.4} />
      </mesh>
      {[-5.5, -2.75, 0, 2.75, 5.5].map((x) => (
        <mesh key={x} position={[x, 3, D / 2 + 0.1]}>
          <boxGeometry args={[0.12, 5.6, 0.1]} />
          <meshStandardMaterial color="#1d2126" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {/* pintu */}
      <mesh position={[0, 1.4, D / 2 + 0.12]}>
        <boxGeometry args={[2.4, 2.8, 0.06]} />
        <meshStandardMaterial color="#0f1418" emissive="#ffe2b8" emissiveIntensity={0.9} />
      </mesh>
      <group position={[0, 8.2, D / 2 + 0.05]}>
        <Text fontSize={1.5} letterSpacing={0.25} color="#1e2328" anchorX="center" anchorY="middle" fontWeight={700}>
          GALERI
        </Text>
        <Text position={[0, -1.05, 0]} fontSize={0.32} letterSpacing={0.2} color="#5b6168" anchorX="center" anchorY="middle">
          FOTO KEGIATAN · MASUK
        </Text>
      </group>
    </group>
  )
}

export default function City({ playerRef }) {
  return (
    <group>
      <Ground />
      <Towers />
      <Lamps />
      <Planters />
      <Traffic playerRef={playerRef} />
      <GalleryBuilding />
    </group>
  )
}
