import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rockGeometry, bushGeometry } from '../geometry'
import { StoneLanterns } from './Props'
import { SakuraTrees, Petals } from './Sakura'
import TokyoTower from './TokyoTower'
import {
  rng, makeFacadeMaterial, sakuraTrees, stoneLanterns, POND, BRIDGE, GARDEN_HALF, GARDEN_END, CONTACT,
} from '../world'

const dummy = new THREE.Object3D()
const color = new THREE.Color()

function canvasTex(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), rng(w + h))
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(...repeat)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// lumut: hijau tua berbintik
const mossTex = () => canvasTex(256, 256, (g, r) => {
  g.fillStyle = '#26331f'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 3000; i++) {
    const l = 12 + r() * 16
    g.fillStyle = `hsla(${88 + r() * 30}, 32%, ${l}%, 0.55)`
    g.fillRect(r() * 256, r() * 256, 2 + r() * 3, 2 + r() * 3)
  }
})

// kerikil yang digaruk membentuk garis (karesansui)
const gravelTex = (raked = true) => canvasTex(128, 128, (g, r) => {
  g.fillStyle = '#8d8a84'
  g.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.12})`
    g.fillRect(r() * 128, r() * 128, 1.5, 1.5)
  }
  for (let x = 0; raked && x < 128; x += 16) {
    g.fillStyle = 'rgba(0,0,0,0.09)'
    g.fillRect(x, 0, 2, 128)
    g.fillStyle = 'rgba(255,255,255,0.08)'
    g.fillRect(x + 3, 0, 2, 128)
  }
})

function useInstances(ref, items, apply) {
  useLayoutEffect(() => {
    items.forEach((it, i) => {
      apply(it, i)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [ref, items, apply])
}

// tanah lumut dengan lubang untuk kolam + area kerikil + halaman di luar gerbang
function Ground() {
  const moss = useMemo(() => mossTex(), [])
  const gravel = useMemo(() => gravelTex(), [])
  const ground = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-150, -150).lineTo(150, -150).lineTo(150, 150).lineTo(-150, 150).lineTo(-150, -150)
    const hole = new THREE.Path()
    hole.absellipse(0, -POND.z, POND.rx, POND.rz, 0, Math.PI * 2, false)
    s.holes.push(hole)
    const g = new THREE.ShapeGeometry(s, 48)
    g.rotateX(-Math.PI / 2)
    // UV dalam satuan meter / 5
    const pos = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 5, pos.getZ(i) / 5)
    return g
  }, [])
  const strips = useMemo(() => {
    const a = gravel.clone()
    const b = gravel.clone()
    a.repeat.set(5, 40 / 2.2)
    b.repeat.set(5, 58 / 2.2)
    return [a, b]
  }, [gravel])
  const yard = useMemo(() => {
    const t = gravelTex(false)
    t.repeat.set(40, 15)
    return t
  }, [])

  return (
    <group>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial map={moss} roughness={1} />
      </mesh>
      {/* kerikil kiri-kanan jalan */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -20.7]} receiveShadow>
        <planeGeometry args={[11, 40]} />
        <meshStandardMaterial map={strips[0]} roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, -82.5]} receiveShadow>
        <planeGeometry args={[11, 58]} />
        <meshStandardMaterial map={strips[1]} roughness={0.95} />
      </mesh>
      {/* halaman depan gerbang */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 15]} receiveShadow>
        <planeGeometry args={[80, 30]} />
        <meshStandardMaterial map={yard} color="#9c968c" roughness={0.9} />
      </mesh>
      {/* plaza kontak */}
      <mesh rotation-x={-Math.PI / 2} position={[CONTACT.x, 0.02, CONTACT.z - 2]} receiveShadow>
        <circleGeometry args={[6.2, 64]} />
        <meshStandardMaterial color="#8f8b84" roughness={0.75} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[CONTACT.x, 0.025, CONTACT.z - 2]}>
        <ringGeometry args={[4.6, 4.75, 64]} />
        <meshStandardMaterial color="#5c5853" roughness={0.8} />
      </mesh>
    </group>
  )
}

// jalan setapak dari lempeng batu granit
function StonePath() {
  const ref = useRef()
  const slabs = useMemo(() => {
    const r = rng(21)
    const out = []
    const rows = (z0, z1) => {
      for (let z = z0; z > z1; z -= 0.95) {
        const split = r() > 0.55
        if (split) {
          const w1 = 1.1 + r() * 0.8
          out.push({ x: -1.45 + w1 / 2, z, w: w1 - 0.08, d: 0.82, c: r() })
          out.push({ x: -1.45 + w1 + (2.9 - w1) / 2, z, w: 2.9 - w1 - 0.08, d: 0.82, c: r() })
        } else {
          out.push({ x: (r() - 0.5) * 0.1, z, w: 2.8, d: 0.82, c: r() })
        }
      }
    }
    rows(2, BRIDGE.z0 + 0.4)
    rows(BRIDGE.z1 - 0.4, CONTACT.z + 3.6)
    return out
  }, [])
  useInstances(ref, slabs, (s, i) => {
    dummy.position.set(s.x, 0.04, s.z)
    dummy.rotation.set(0, (s.c - 0.5) * 0.04, 0)
    dummy.scale.set(s.w, 1, s.d)
    ref.current.setColorAt(i, color.setHSL(0.08, 0.04, 0.42 + s.c * 0.14))
  })
  return (
    <instancedMesh ref={ref} args={[null, null, slabs.length]} receiveShadow castShadow>
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial roughness={0.8} />
    </instancedMesh>
  )
}

// kolam koi dengan batu di pinggirnya, teratai, dan ikan
function Pond() {
  const rockGeo = useMemo(() => rockGeometry(), [])
  const rocks = useMemo(() => {
    const r = rng(8)
    const out = []
    for (let a = 0; a < Math.PI * 2; a += 0.2 + r() * 0.12) {
      const x = Math.cos(a) * (POND.rx + 0.1)
      if (Math.abs(x) < BRIDGE.half + 0.6) continue
      out.push({ x, z: POND.z + Math.sin(a) * (POND.rz + 0.1), s: 0.35 + r() * 0.45, ry: r() * 6 })
    }
    return out
  }, [])
  const rockRef = useRef()
  useInstances(rockRef, rocks, (k) => {
    dummy.position.set(k.x, -0.05, k.z)
    dummy.rotation.set(0, k.ry, 0)
    dummy.scale.set(k.s * 1.3, k.s, k.s)
  })
  const pads = useMemo(() => {
    const r = rng(4)
    return Array.from({ length: 14 }, () => {
      const a = r() * Math.PI * 2
      const d = 0.35 + r() * 0.55
      const x = Math.cos(a) * POND.rx * d
      return { x: Math.abs(x) < 2 ? x + Math.sign(x || 1) * 2.5 : x, z: POND.z + Math.sin(a) * POND.rz * d, s: 0.25 + r() * 0.2 }
    })
  }, [])
  const padRef = useRef()
  useInstances(padRef, pads, (p) => {
    dummy.position.set(p.x, -0.1, p.z)
    dummy.rotation.set(0, p.s * 20, 0)
    dummy.scale.set(p.s, 1, p.s)
  })
  const koi = useRef([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    koi.current.forEach((k, i) => {
      if (!k) return
      const sp = 0.18 + i * 0.03
      const a = t * sp * (i % 2 ? 1 : -1) + i * 1.3
      const rx = POND.rx * (0.45 + (i % 3) * 0.13)
      const rz = POND.rz * (0.45 + (i % 2) * 0.2)
      k.position.set(Math.cos(a) * rx, -0.32, POND.z + Math.sin(a) * rz)
      const dx = -Math.sin(a) * rx * (i % 2 ? 1 : -1)
      const dz = Math.cos(a) * rz * (i % 2 ? 1 : -1)
      k.rotation.y = Math.atan2(dx, dz)
      k.rotation.z = Math.sin(t * 6 + i) * 0.15
    })
  })
  const koiColors = ['#ff6a2a', '#f4efe6', '#ff8a3d', '#e63b2e', '#f6c14b', '#ffffff']

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, POND.z]} scale={[POND.rx, POND.rz, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial color="#0b1612" roughness={1} />
      </mesh>
      <mesh position={[0, -0.35, POND.z]} scale={[POND.rx, 1, POND.rz]}>
        <cylinderGeometry args={[1, 1, 0.5, 64, 1, true]} />
        <meshStandardMaterial color="#141a14" side={THREE.BackSide} />
      </mesh>
      {koiColors.map((c, i) => (
        <group key={i} ref={(g) => { koi.current[i] = g }}>
          <mesh scale={[0.13, 0.09, 0.42]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.15} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, -0.45]} rotation-x={Math.PI / 2} scale={[1, 1, 0.3]}>
            <coneGeometry args={[0.12, 0.2, 3]} />
            <meshStandardMaterial color={c} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* permukaan air: gelap & memantulkan lampu */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.14, POND.z]} scale={[POND.rx + 0.3, POND.rz + 0.3, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial color="#0c1c26" metalness={0.9} roughness={0.06} transparent opacity={0.72} envMapIntensity={1.4} />
      </mesh>
      <instancedMesh ref={rockRef} args={[rockGeo, null, rocks.length]} castShadow receiveShadow>
        <meshStandardMaterial color="#6f6c66" vertexColors roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={padRef} args={[null, null, pads.length]}>
        <cylinderGeometry args={[1, 1, 0.02, 16, 1, false, 0.4, Math.PI * 1.85]} />
        <meshStandardMaterial color="#2f5a2a" roughness={0.7} side={THREE.DoubleSide} />
      </instancedMesh>
      {pads.filter((_, i) => i % 3 === 0).map((p, i) => (
        <mesh key={i} position={[p.x + 0.05, -0.03, p.z]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial color="#ffc6dc" emissive="#ff8fb5" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// lengkungkan geometri sepanjang z mengikuti busur jembatan
function arch(g, lift, len) {
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const t = 0.5 - pos.getZ(i) / len
    pos.setY(i, pos.getY(i) + lift * Math.sin(Math.PI * THREE.MathUtils.clamp(t, 0, 1)))
  }
  g.computeVertexNormals()
  return g
}

// jembatan melengkung merah (taiko-bashi)
function Bridge() {
  const len = BRIDGE.z0 - BRIDGE.z1
  const deck = useMemo(() => arch(new THREE.BoxGeometry(BRIDGE.half * 2 + 0.1, 0.16, len + 0.6, 1, 1, 48), BRIDGE.rise, len), [len])
  const rail = useMemo(() => arch(new THREE.BoxGeometry(0.1, 0.1, len + 0.3, 1, 1, 48), BRIDGE.rise, len), [len])
  const posts = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    posts.push({ z: BRIDGE.z0 - t * len, y: BRIDGE.rise * Math.sin(Math.PI * t), end: i === 0 || i === 10 })
  }
  const red = <meshStandardMaterial color="#b3241a" roughness={0.55} />
  return (
    <group>
      <mesh geometry={deck} position={[0, -0.08, POND.z]} castShadow receiveShadow>
        <meshStandardMaterial color="#5a3a26" roughness={0.75} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={rail} position={[s * (BRIDGE.half + 0.1), 0.92, POND.z]} castShadow>{red}</mesh>
          <mesh geometry={rail} position={[s * (BRIDGE.half + 0.1), 0.45, POND.z]}>{red}</mesh>
          {posts.map((p) => (
            <group key={p.z} position={[s * (BRIDGE.half + 0.1), p.y, p.z]}>
              <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[0.14, p.end ? 1.25 : 1.05, 0.14]} />
                {red}
              </mesh>
              {p.end && (
                <mesh position={[0, 1.22, 0]}>
                  <sphereGeometry args={[0.1, 12, 10]} />
                  <meshStandardMaterial color="#9c7b3a" metalness={0.85} roughness={0.3} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

// semak azalea & batu hias
function Shrubs() {
  const geo = useMemo(() => bushGeometry(), [])
  const bushes = useMemo(() => {
    const r = rng(12)
    const out = []
    const add = (x, z, s) => out.push({ x, z, s: s * (0.8 + r() * 0.4), pink: r() > 0.62, ry: r() * 6 })
    for (let z = -3; z > -108; z -= 3.6 + r() * 2) {
      add(-GARDEN_HALF + 1.2 + r(), z, 1)
      add(GARDEN_HALF - 1.2 - r(), z - 1.5, 1)
    }
    for (let z = -6; z > -38; z -= 4.1) {
      add(-5.6 - r(), z - 2, 0.7)
      add(5.6 + r(), z, 0.7)
    }
    ;[[-11, -40], [11, -41], [-4, -55.5], [4, -55.8], [-3.6, -97], [3.6, -97.2], [-9.5, -101], [9.5, -101]].forEach(([x, z]) => add(x, z, 0.9))
    return out
  }, [])
  const ref = useRef()
  useInstances(ref, bushes, (b, i) => {
    dummy.position.set(b.x, 0, b.z)
    dummy.rotation.set(0, b.ry, 0)
    dummy.scale.setScalar(b.s)
    ref.current.setColorAt(i, color.set(b.pink ? '#c85a86' : '#2f4a28'))
  })
  return (
    <instancedMesh ref={ref} args={[geo, null, bushes.length]} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.9} />
    </instancedMesh>
  )
}

// kota di kejauhan (di balik tembok) + Tokyo Tower
function Skyline() {
  const ref = useRef()
  const mat = useMemo(() => makeFacadeMaterial({ lit: 0.3, glow: 1.4, seed: 4 }), [])
  const blocks = useMemo(() => {
    const r = rng(31)
    const out = []
    for (let i = 0; i < 160; i++) {
      const a = r() * Math.PI * 2
      const d = 95 + r() * 110
      const x = Math.cos(a) * d
      const z = -50 + Math.sin(a) * d
      if (z > 20 && Math.abs(x) < 60) continue
      // makin jauh makin tinggi, supaya dari dalam taman hanya terlihat siluet di cakrawala
      out.push({ x, z, w: 7 + r() * 10, d: 7 + r() * 10, h: 8 + (d - 95) * 0.35 + r() * 22, c: r() })
    }
    return out
  }, [])
  useInstances(ref, blocks, (b, i) => {
    dummy.position.set(b.x, b.h / 2, b.z)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.set(b.w, b.h, b.d)
    ref.current.setColorAt(i, color.setHSL(0.66, 0.08, 0.1 + b.c * 0.08))
  })
  return (
    <group>
      <instancedMesh ref={ref} args={[null, mat, blocks.length]}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <TokyoTower position={[-38, 0, -205]} scale={1.7} rotation-y={0.4} />
    </group>
  )
}

export default function Garden({ playerRef }) {
  return (
    <group>
      <Ground />
      <StonePath />
      <Pond />
      <Bridge />
      <Shrubs />
      <StoneLanterns positions={stoneLanterns} />
      <SakuraTrees trees={sakuraTrees} />
      <Petals followRef={playerRef} />
      <Skyline />
      {/* lantai luar di belakang tembok supaya tidak terlihat ujung dunia */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, GARDEN_END - 60]}>
        <planeGeometry args={[300, 120]} />
        <meshStandardMaterial color="#14161a" roughness={1} />
      </mesh>
    </group>
  )
}
