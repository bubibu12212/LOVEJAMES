import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { B } from './Props'
import { Bookshelf, Chair, Armchair, Lamp, SideTable, Rug, Clock, WallShelf, Beanbag, Pendant, Counter, Whiteboard } from './Decor'
import { ROOM, ROOM_EXIT } from '../world'
import { toolTexture, projectTexture, holoTexture, cityViewTexture } from '../screens'

const R = ROOM.cz
const { halfW, halfD, height } = ROOM
const BACK = R - halfD

const THEMES = {
  house: { floor: 'wood', floorTint: '#c89a6a', wall: '#efe6d8', ceil: '#f6f1e8', light: '#ffe2b8', frame: 'light', frameColor: '#7a5a3c', label: 'HOME' },
  office: { floor: 'polished', floorTint: '#15181d', wall: '#1b2027', ceil: '#101317', light: '#cfe6ff', frame: 'dark', frameColor: '#5fe0ff', label: 'OFFICE' },
  apartment: { floor: 'wood', floorTint: '#b08d6a', wall: '#b9b4ab', ceil: '#d9d6d0', light: '#ffe9cc', frame: 'light', frameColor: '#1b1c1f', label: 'APARTMENT' },
  dorm: { floor: 'tile', floorTint: '#d9d2c6', wall: '#ead8cf', ceil: '#f3ece6', light: '#fff0dc', frame: 'poster', frameColor: '#ffffff', label: 'DORM ROOM' },
  lab: { floor: 'grid', floorTint: '#161b21', wall: '#12161b', ceil: '#0e1115', light: '#bfe8ff', frame: 'dark', frameColor: '#4fffb0', label: 'LAB' },
  studio: { floor: 'concrete', floorTint: '#9d998f', wall: '#f1efea', ceil: '#fafafa', light: '#fff4e2', frame: 'light', frameColor: '#e9e4da', label: 'STUDIO' },
}

function floorTexture(kind) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const g = c.getContext('2d')
  if (kind === 'wood') {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `hsl(30, 22%, ${78 + ((i * 37) % 9)}%)`
      g.fillRect(i * 32, 0, 32, 256)
      g.fillStyle = 'rgba(70,50,30,0.25)'
      g.fillRect(i * 32, 0, 1.5, 256)
      g.fillRect(i * 32, (i * 173) % 256, 32, 1.5)
    }
  } else if (kind === 'tile') {
    g.fillStyle = '#fff'
    g.fillRect(0, 0, 256, 256)
    g.fillStyle = 'rgba(0,0,0,0.18)'
    g.fillRect(0, 0, 256, 3)
    g.fillRect(0, 0, 3, 256)
  } else if (kind === 'grid') {
    g.fillStyle = '#fff'
    g.fillRect(0, 0, 256, 256)
    g.fillStyle = 'rgba(95,224,255,0.9)'
    g.fillRect(0, 0, 256, 2)
    g.fillRect(0, 0, 2, 256)
  } else {
    g.fillStyle = '#fff'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(0,0,0,${((i * 7) % 10) / 120})`
      g.fillRect((i * 97) % 256, (i * 57) % 256, 3, 3)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(kind === 'wood' ? 4 : 7, kind === 'wood' ? 3 : 8)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// lantai, dinding, langit-langit, pintu keluar
function Shell({ theme }) {
  const tex = useMemo(() => floorTexture(theme.floor), [theme.floor])
  const dark = theme.floor === 'polished' || theme.floor === 'grid'
  const wall = <meshStandardMaterial color={theme.wall} emissive={theme.wall} emissiveIntensity={dark ? 0.12 : 0.14} roughness={0.95} />
  const doorW = 2.4
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, R]} receiveShadow>
        <planeGeometry args={[halfW * 2, halfD * 2]} />
        <meshStandardMaterial map={theme.floor === 'polished' ? null : tex} color={theme.floorTint} roughness={dark ? 0.25 : 0.6} metalness={dark ? 0.3 : 0} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, height, R]}>
        <planeGeometry args={[halfW * 2, halfD * 2]} />
        <meshStandardMaterial color={theme.ceil} emissive={theme.ceil} emissiveIntensity={dark ? 0.1 : 0.3} roughness={1} />
      </mesh>
      <mesh position={[-halfW, height / 2, R]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[halfD * 2, height]} />
        {wall}
      </mesh>
      <mesh position={[halfW, height / 2, R]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[halfD * 2, height]} />
        {wall}
      </mesh>
      <mesh position={[0, height / 2, BACK]}>
        <planeGeometry args={[halfW * 2, height]} />
        {wall}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (doorW / 2 + (halfW - doorW / 2) / 2), height / 2, R + halfD]} rotation-y={Math.PI}>
          <planeGeometry args={[halfW - doorW / 2, height]} />
          {wall}
        </mesh>
      ))}
      <mesh position={[0, (height + 3) / 2, R + halfD]} rotation-y={Math.PI}>
        <planeGeometry args={[doorW, height - 3]} />
        {wall}
      </mesh>
      {/* pintu terbuka ke taman malam */}
      <mesh position={[0, 1.5, R + halfD + 0.05]} rotation-y={Math.PI}>
        <planeGeometry args={[doorW, 3]} />
        <meshBasicMaterial color="#1c2346" />
      </mesh>
      <Text position={[0, 3.3, R + halfD - 0.02]} rotation-y={Math.PI} fontSize={0.18} letterSpacing={0.3} color={dark ? '#7fe8ff' : '#2f8f5b'} anchorX="center">
        EXIT · BACK TO GARDEN
      </Text>
      {/* list lantai */}
      {[[-halfW + 0.03, R, 0.06, halfD * 2], [halfW - 0.03, R, 0.06, halfD * 2], [0, BACK + 0.03, halfW * 2, 0.06]].map(([x, z, w, d], i) => (
        <B key={i} p={[x, 0.07, z]} s={[w, 0.14, d]} c={dark ? '#0a0c0f' : '#d4cfc6'} cast={false} />
      ))}
      <mesh position={[ROOM_EXIT[0], 0.03, ROOM_EXIT[1]]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.75, 0.95, 48]} />
        <meshBasicMaterial color="#2fbf71" transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* lampu ruangan */}
      <pointLight position={[0, height - 0.5, R - 3]} intensity={dark ? 10 : 16} distance={12} color={theme.light} castShadow={false} />
      <pointLight position={[0, height - 0.5, R + 4]} intensity={dark ? 6 : 12} distance={10} color={theme.light} />
    </group>
  )
}

// bingkai tools di dinding kiri & kanan
function ToolFrame({ name, style, frameColor, position, rotation }) {
  const tex = useMemo(() => toolTexture(name, style), [name, style])
  const S = 1.15
  const poster = style === 'poster'
  return (
    <group position={position} rotation-y={rotation}>
      <group rotation-z={poster ? (name.length % 2 ? 0.04 : -0.035) : 0}>
        {!poster && (
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[S + 0.16, S + 0.16, 0.05]} />
            {style === 'dark'
              ? <meshStandardMaterial color="#0a0d10" emissive={frameColor} emissiveIntensity={0.9} toneMapped={false} />
              : <meshStandardMaterial color={frameColor} roughness={0.5} />}
          </mesh>
        )}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[S, S]} />
          <meshBasicMaterial map={tex} toneMapped={false} transparent={style === 'dark'} opacity={style === 'dark' ? 0.92 : 1} />
        </mesh>
        {poster && (
          <mesh position={[0, S / 2 - 0.02, 0.06]} rotation-z={0.1}>
            <planeGeometry args={[0.3, 0.08]} />
            <meshBasicMaterial color="#f3e6b0" transparent opacity={0.85} />
          </mesh>
        )}
      </group>
    </group>
  )
}

// slot: 0-2 dinding kiri, 3-5 dinding kanan, 6-7 dinding belakang (pojok)
function ToolFrames({ tools, theme, skip = [] }) {
  const slots = [
    ...[-4.5, -1.5, 1.5].map((dz) => ({ position: [-halfW + 0.02, 2.3, R + dz], rotation: Math.PI / 2 })),
    ...[-4.5, -1.5, 1.5].map((dz) => ({ position: [halfW - 0.02, 2.3, R + dz], rotation: -Math.PI / 2 })),
    ...[-5.1, 5.1].map((x) => ({ position: [x, 2.4, BACK + 0.02], rotation: 0 })),
  ].filter((_, i) => !skip.includes(i))
  return tools.slice(0, slots.length).map((t, i) => (
    <ToolFrame key={t + i} name={t} style={theme.frame} frameColor={theme.frameColor} {...slots[i]} />
  ))
}

// layar utama: klik untuk membuka detail project
function MainScreen({ project, w, h, position, rotation = [0, 0, 0], holo = false, nearRef, onOpen }) {
  const tex = useMemo(() => projectTexture(project, project.accent, holo), [project, holo])
  const glow = useRef()
  useFrame((state, dt) => {
    const near = nearRef.current
    const pulse = near ? 1.6 + Math.sin(state.clock.elapsedTime * 4) * 0.4 : 0.5
    glow.current.emissiveIntensity = THREE.MathUtils.damp(glow.current.emissiveIntensity, pulse, 6, dt)
  })
  const open = (e) => { e.stopPropagation(); onOpen() }
  const over = () => { document.body.style.cursor = 'pointer' }
  const out = () => { document.body.style.cursor = '' }
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.04]} />
        <meshStandardMaterial ref={glow} color={holo ? '#0b2533' : '#0a0a0b'} emissive={project.accent} emissiveIntensity={0.5} toneMapped={false} transparent={holo} opacity={holo ? 0.5 : 1} />
      </mesh>
      <mesh onClick={open} onPointerOver={over} onPointerOut={out}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} transparent={holo} opacity={holo ? 0.95 : 1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Plant({ p, s = 1 }) {
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.6, 16]} />
        <meshStandardMaterial color="#e9e4dc" roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.3) * 0.18, 0.95 + (i % 2) * 0.25, Math.sin(i * 1.3) * 0.18]} scale={[0.32, 0.5, 0.32]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={i % 2 ? '#3f6b35' : '#2f5a2a'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// ---------- isi ruangan per tema ----------
function HouseRoom(props) {
  return (
    <group>
      {/* karpet, sofa, meja, lemari TV */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, R - 2.4]}>
        <planeGeometry args={[5.4, 4]} />
        <meshStandardMaterial color="#c9b79a" roughness={1} />
      </mesh>
      <B p={[0, 0.3, R - 0.6]} s={[3.4, 0.45, 1.1]} c="#7d8b7a" r={0.95} />
      <B p={[0, 0.8, R - 0.1]} s={[3.4, 0.75, 0.25]} c="#76846f" r={0.95} />
      {[-1, 1].map((s) => <B key={s} p={[s * 1.6, 0.55, R - 0.6]} s={[0.25, 0.6, 1.1]} c="#6d7b66" r={0.95} />)}
      <B p={[0, 0.38, R - 2.6]} s={[1.5, 0.08, 0.9]} c="#8a6748" r={0.5} />
      {[-1, 1].map((s) => <B key={s} p={[s * 0.6, 0.18, R - 2.6]} s={[0.08, 0.34, 0.7]} c="#5b4330" />)}
      <B p={[0, 0.35, R - 7.45]} s={[4.8, 0.7, 0.9]} c="#7a5a3c" r={0.55} />
      <MainScreen {...props} w={3.6} h={2.03} position={[0, 2, BACK + 0.08]} />
      {/* lampu berdiri */}
      <group position={[5.6, 0, R + 0.5]}>
        <B p={[0, 0.8, 0]} s={[0.05, 1.6, 0.05]} c="#222" m={0.6} />
        <mesh position={[0, 1.7, 0]}>
          <cylinderGeometry args={[0.22, 0.32, 0.36, 20, 1, true]} />
          <meshStandardMaterial color="#f3e7cf" emissive="#ffd79a" emissiveIntensity={1.4} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <Plant p={[-5.9, 0, R - 6.9]} s={1.3} />
      <Plant p={[5.9, 0, R - 6.9]} />
      {/* rak buku rendah, kursi santai, meja makan, dapur kecil */}
      <Bookshelf p={[-6.72, 0, R - 1.5]} rot={Math.PI / 2} w={4.4} h={1.2} seed={2} />
      <Armchair p={[4.3, 0, R - 2.9]} rot={-2.1} />
      <SideTable p={[5.3, 0, R - 1.6]} />
      {[-1, 1].map((s) => <B key={s} p={[s * 1.05, 0.66, R - 0.32]} s={[0.55, 0.42, 0.14]} c={s < 0 ? '#e2b04a' : '#c8553d'} r={1} rotation-z={s * 0.1} />)}
      <Clock p={[0, 3.55, BACK + 0.04]} />
      <group position={[4.6, 0, R + 4.8]}>
        <B p={[0, 0.75, 0]} s={[1.9, 0.06, 1.1]} c="#8a6748" r={0.5} />
        {[[-0.8, -0.45], [0.8, -0.45], [-0.8, 0.45], [0.8, 0.45]].map(([x, z]) => <B key={`${x}${z}`} p={[x, 0.37, z]} s={[0.06, 0.74, 0.06]} c="#5b4330" />)}
        {[-0.45, 0.45].map((x) => <Chair key={`a${x}`} p={[x, 0, 0.85]} rot={Math.PI} c="#7a5a3c" />)}
        {[-0.45, 0.45].map((x) => <Chair key={`b${x}`} p={[x, 0, -0.85]} c="#7a5a3c" />)}
        <mesh position={[0, 0.86, 0]}>
          <cylinderGeometry args={[0.12, 0.09, 0.16, 16]} />
          <meshStandardMaterial color="#e9e1d4" />
        </mesh>
      </group>
      <Pendant p={[4.6, 2.9, R + 4.8]} ceiling={height} c="#e9e1d4" />
      <Counter p={[-6.55, 0, R + 5]} rot={Math.PI / 2} w={2.6} c="#efe6d8" top="#7a5a3c" />
      <WallShelf p={[-6.85, 1.9, R + 5]} rot={Math.PI / 2} />
      <WallShelf p={[6.85, 1.8, R + 5.2]} rot={-Math.PI / 2} seed={7} />
      <Rug p={[4.6, 0, R + 4.8]} w={3} d={2.4} c="#e3d3bb" border="#b49a7a" />
    </group>
  )
}

function OfficeRoom(props) {
  const panels = useMemo(() => [
    { tex: holoTexture('chart', '#7fe8ff', 3), p: [-2.45, 2.05, BACK + 3.5], r: 0.5, s: [1.5, 1] },
    { tex: holoTexture('ring', '#7fe8ff', 7), p: [2.45, 2.05, BACK + 3.5], r: -0.5, s: [1.5, 1] },
    { tex: holoTexture('rows', '#7fe8ff', 9), p: [-1.5, 3.25, BACK + 3.05], r: 0.15, s: [1.1, 0.7] },
    { tex: holoTexture('chart', '#9fd0ff', 5), p: [1.55, 3.25, BACK + 3.05], r: -0.15, s: [1.1, 0.7] },
    { tex: holoTexture('ring', '#9fd0ff', 2), p: [3.5, 3.0, BACK + 4.1], r: -0.8, s: [0.8, 0.8] },
  ], [])
  const group = useRef()
  useFrame((state) => {
    group.current.children.forEach((c, i) => { c.position.y = panels[i].p[1] + Math.sin(state.clock.elapsedTime * 1.2 + i) * 0.04 })
  })
  return (
    <group>
      {/* lantai panggung kaca & lampu strip di langit-langit */}
      {[-3, 0, 3].map((x) => (
        <mesh key={x} position={[x, height - 0.02, R]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[0.08, halfD * 2 - 1]} />
          <meshBasicMaterial color="#cfe8ff" toneMapped={false} />
        </mesh>
      ))}
      {/* meja kaca dengan rangka krom (seperti referensi) */}
      <mesh position={[0, 0.8, R - 4.6]}>
        <boxGeometry args={[4, 0.05, 1.7]} />
        <meshStandardMaterial color="#bfe6ff" transparent opacity={0.28} roughness={0.05} metalness={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.85, 0, R - 4.6]}>
          <B p={[0, 0.4, 0.75]} s={[0.05, 0.8, 0.05]} c="#cfd6dd" m={1} r={0.15} />
          <B p={[0, 0.4, -0.75]} s={[0.05, 0.8, 0.05]} c="#cfd6dd" m={1} r={0.15} />
          <B p={[0, 0.03, 0]} s={[0.05, 0.05, 1.55]} c="#cfd6dd" m={1} r={0.15} />
          <B p={[0, 0.78, 0]} s={[0.05, 0.05, 1.55]} c="#cfd6dd" m={1} r={0.15} />
        </group>
      ))}
      <B p={[-0.3, 0.84, R - 4.3]} s={[1.1, 0.03, 0.35]} c="#d9dde2" m={0.6} r={0.3} />
      <B p={[0.6, 0.84, R - 4.3]} s={[0.12, 0.03, 0.2]} c="#d9dde2" m={0.6} r={0.3} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, R - 4.6]}>
        <planeGeometry args={[5, 2.8]} />
        <meshBasicMaterial color="#5fbfff" transparent opacity={0.08} />
      </mesh>
      {/* layar hologram melayang */}
      <MainScreen {...props} holo w={2.8} h={1.58} position={[0, 2.25, BACK + 2.9]} />
      <group ref={group}>
        {panels.map((pn, i) => (
          <mesh key={i} position={pn.p} rotation-y={pn.r}>
            <planeGeometry args={pn.s} />
            <meshBasicMaterial map={pn.tex} transparent opacity={0.85} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 2.2, BACK + 3.6]} intensity={6} distance={6} color="#5fd0ff" />
      <Plant p={[-5.9, 0, R - 6.9]} s={1.2} />
      <Chair p={[0, 0, R - 3.65]} rot={Math.PI} office c="#16181c" />
      <Plant p={[5.9, 0, R - 6.9]} s={1.2} />
      {/* rak tinggi, sudut santai, papan tulis, dispenser */}
      <Bookshelf p={[6.72, 0, R + 4.6]} rot={-Math.PI / 2} w={3} h={2.6} c="#2b2d31" seed={5} />
      <Armchair p={[-5.7, 0, R + 3.6]} rot={Math.PI / 2} c="#34465a" />
      <Armchair p={[-5.7, 0, R + 5.4]} rot={Math.PI / 2} c="#34465a" />
      <SideTable p={[-4.5, 0, R + 4.5]} c="#cfd6dd" />
      <Rug p={[-5, 0, R + 4.5]} w={3} d={3.4} c="#232a33" border="#5fe0ff" />
      <Whiteboard p={[4.2, 1.9, R + halfD - 0.04]} rot={Math.PI} />
      <group position={[6.5, 0, R]}>
        <B p={[0, 0.5, 0]} s={[0.4, 1, 0.4]} c="#e9edf1" r={0.4} />
        <mesh position={[0, 1.22, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.45, 16]} />
          <meshStandardMaterial color="#8fd0ff" transparent opacity={0.6} roughness={0.1} />
        </mesh>
      </group>
      <Clock p={[-3.6, 3.4, BACK + 0.04]} face="#0f1317" rim="#5fe0ff" />
    </group>
  )
}

function ApartmentRoom(props) {
  const view = useMemo(() => cityViewTexture(), [])
  return (
    <group>
      {/* tempat tidur */}
      <B p={[-4.8, 0.25, R - 1]} s={[3.2, 0.5, 4.8]} c="#5a4636" />
      <B p={[-4.8, 0.62, R - 0.9]} s={[3.1, 0.24, 4.6]} c="#f2efe9" r={0.95} />
      <B p={[-4.8, 0.76, R + 0.4]} s={[3.14, 0.1, 2.6]} c="#3e5a7a" r={0.95} />
      <B p={[-4.8, 1.05, R - 3.45]} s={[3.2, 1.2, 0.12]} c="#4a3a2d" />
      {[-5.6, -4].map((x) => <B key={x} p={[x, 0.85, R - 2.9]} s={[1.2, 0.22, 0.6]} c="#ffffff" r={1} />)}
      {/* meja kerja + monitor */}
      <B p={[0, 0.76, R - 7]} s={[3.8, 0.06, 1.4]} c="#d9cdb9" r={0.5} />
      {[-1.8, 1.8].map((x) => <B key={x} p={[x, 0.38, R - 7]} s={[0.06, 0.76, 1.3]} c="#222" m={0.5} />)}
      <B p={[0, 0.95, R - 7.35]} s={[0.1, 0.35, 0.1]} c="#222" m={0.6} />
      <MainScreen {...props} w={2.2} h={1.24} position={[0, 1.75, R - 7.4]} />
      {/* jendela besar ke kota malam */}
      <mesh position={[halfW - 0.03, 2.1, R - 3.5]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[5, 2.6]} />
        <meshBasicMaterial map={view} toneMapped={false} />
      </mesh>
      {[-2.5, 0, 2.5].map((dz) => <B key={dz} p={[halfW - 0.06, 2.1, R - 3.5 + dz]} s={[0.06, 2.7, 0.08]} c="#1b1c1f" cast={false} />)}
      <B p={[halfW - 0.06, 3.43, R - 3.5]} s={[0.06, 0.08, 5.1]} c="#1b1c1f" cast={false} />
      <B p={[halfW - 0.06, 0.77, R - 3.5]} s={[0.06, 0.08, 5.1]} c="#1b1c1f" cast={false} />
      <Plant p={[5.9, 0, R + 4]} s={1.2} />
      {/* sudut tidur, dapur kecil, rak buku, beanbag dekat jendela */}
      <SideTable p={[-2.85, 0, R - 3.0]} items={false} c="#5a4636" />
      <Lamp p={[-2.85, 0.58, R - 3.0]} h={0.3} light />
      <Rug p={[-1.2, 0, R - 0.6]} w={2.6} d={2.2} c="#d8c7b0" border="#a88f70" />
      <Chair p={[0, 0, R - 5.95]} rot={Math.PI} office />
      <Counter p={[4.8, 0, R + 6.9]} rot={Math.PI} w={3.2} />
      {[4, 5.6].map((x) => (
        <group key={x} position={[x, 0, R + 5.95]}>
          <B p={[0, 0.65, 0]} s={[0.36, 0.05, 0.36]} c="#2b2d31" />
          <B p={[0, 0.32, 0]} s={[0.05, 0.64, 0.05]} c="#888" m={0.7} />
        </group>
      ))}
      <Bookshelf p={[-6.72, 0, R + 4.6]} rot={Math.PI / 2} w={2.4} h={2.2} c="#d9cdb9" seed={8} />
      <Beanbag p={[3.4, 0, R - 2.6]} c="#d97a9c" />
      <Lamp p={[5.8, 0, R - 0.4]} />
      <Clock p={[-3, 3.4, BACK + 0.04]} />
    </group>
  )
}

function DormRoom(props) {
  const bulbs = []
  for (let x = -6.6; x <= 6.6; x += 0.55) bulbs.push(x)
  return (
    <group>
      <B p={[-5.4, 0.22, R - 3]} s={[2.2, 0.44, 4.4]} c="#d7c3a5" />
      <B p={[-5.4, 0.55, R - 3]} s={[2.1, 0.22, 4.3]} c="#fbe3ea" r={1} />
      <B p={[-5.4, 0.7, R - 2]} s={[2.14, 0.08, 2.2]} c="#f29bb4" r={1} />
      <B p={[-5.4, 0.78, R - 4.8]} s={[1.3, 0.2, 0.5]} c="#ffffff" r={1} />
      {/* lemari */}
      <B p={[5.6, 1.2, R - 5.8]} s={[1.6, 2.4, 2.8]} c="#e6d3b8" r={0.6} />
      <B p={[4.79, 1.2, R - 5.8]} s={[0.02, 2.3, 0.02]} c="#8a7a66" cast={false} />
      {/* meja belajar + laptop + TV di dinding */}
      <B p={[0, 0.76, R - 7]} s={[3.2, 0.06, 1.4]} c="#f1ece4" r={0.5} />
      {[-1.5, 1.5].map((x) => <B key={x} p={[x, 0.38, R - 7]} s={[0.06, 0.76, 1.3]} c="#c9c1b4" />)}
      <B p={[0.9, 0.8, R - 6.8]} s={[0.9, 0.03, 0.6]} c="#c0c4c9" m={0.7} r={0.3} />
      <mesh position={[0.9, 1.07, R - 7.12]} rotation-x={-0.25}>
        <boxGeometry args={[0.9, 0.56, 0.02]} />
        <meshStandardMaterial color="#c0c4c9" emissive="#9fd8ff" emissiveIntensity={0.6} metalness={0.6} />
      </mesh>
      <MainScreen {...props} w={2.4} h={1.35} position={[0, 2.35, BACK + 0.08]} />
      {/* lampu tumblr di dinding belakang */}
      {bulbs.map((x, i) => (
        <mesh key={x} position={[x, 3.6 - Math.sin((x + 6.6) / 13.2 * Math.PI * 4) * 0.12, BACK + 0.1]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshBasicMaterial color={i % 3 ? '#ffd79a' : '#ff9ec2'} toneMapped={false} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, R - 1]}>
        <circleGeometry args={[1.6, 40]} />
        <meshStandardMaterial color="#f0c9d4" roughness={1} />
      </mesh>
      {/* kursi belajar, kulkas mini, beanbag, rak rendah, gantungan baju */}
      <Chair p={[0, 0, R - 5.95]} rot={Math.PI} c="#d97a9c" />
      <Lamp p={[-1.15, 0.79, R - 7.15]} h={0.3} shade="#ffd1e0" />
      <B p={[2.35, 0.45, R - 7.35]} s={[0.6, 0.9, 0.6]} c="#e9e4dc" r={0.4} />
      <Beanbag p={[3.2, 0, R - 0.6]} c="#7a4fb0" />
      <mesh position={[-5.3, 0.88, R - 4.4]} castShadow>
        <sphereGeometry args={[0.2, 14, 10]} />
        <meshStandardMaterial color="#c89a6a" roughness={1} />
      </mesh>
      <Bookshelf p={[6.72, 0, R + 0.2]} rot={-Math.PI / 2} w={2} h={1.2} c="#f1ece4" seed={4} />
      <group position={[-5.6, 0, R + 4.6]}>
        {[-0.9, 0.9].map((z) => <B key={z} p={[0, 0.8, z]} s={[0.04, 1.6, 0.04]} c="#bbb" m={0.7} />)}
        <B p={[0, 1.6, 0]} s={[0.04, 0.04, 1.84]} c="#bbb" m={0.7} />
        {['#f29bb4', '#3d6fc8', '#e2b04a', '#f1ece4', '#3da67a'].map((c, i) => (
          <B key={c} p={[0, 1.2, -0.6 + i * 0.3]} s={[0.5, 0.7, 0.05]} c={c} r={1} />
        ))}
      </group>
      <mesh position={[-3.6, 0.25, R + 6]}>
        <cylinderGeometry args={[0.28, 0.24, 0.5, 18]} />
        <meshStandardMaterial color="#e2d3b0" roughness={1} />
      </mesh>
      <Clock p={[3.6, 3.3, BACK + 0.04]} face="#ffe6ee" rim="#d97a9c" />
      <WallShelf p={[-3.5, 1.9, BACK + 0.14]} seed={11} c="#f1ece4" />
    </group>
  )
}

function LabRoom(props) {
  const leds = useRef([])
  const holo = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    leds.current.forEach((m, i) => { if (m) m.emissiveIntensity = Math.sin(t * (3 + (i % 5)) + i * 1.7) > 0.2 ? 3 : 0.3 })
    holo.current.rotation.y = t * 0.6
    holo.current.rotation.x = t * 0.3
  })
  const racks = [-5.5, -3.2, -0.9, 1.4]
  return (
    <group>
      {racks.map((dz, r) => (
        <group key={dz} position={[-6.1, 0, R + dz]}>
          <B p={[0, 1.3, 0]} s={[1.1, 2.6, 2]} c="#1a1e24" m={0.5} r={0.4} />
          {Array.from({ length: 12 }, (_, i) => (
            <mesh key={i} position={[0.56, 0.4 + i * 0.18, -0.6 + (i % 3) * 0.6]}>
              <boxGeometry args={[0.02, 0.04, 0.2]} />
              <meshStandardMaterial ref={(m) => { leds.current[r * 12 + i] = m }} color="#000" emissive={i % 4 ? '#4fffb0' : '#5fe0ff'} emissiveIntensity={1} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
      {/* meja bundar dengan hologram berputar */}
      <mesh position={[0, 0.45, R + 1.5]} castShadow>
        <cylinderGeometry args={[1.2, 1.3, 0.9, 40]} />
        <meshStandardMaterial color="#20262e" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.91, R + 1.5]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.05, 40]} />
        <meshBasicMaterial color="#4fffb0" transparent opacity={0.25} toneMapped={false} />
      </mesh>
      <mesh ref={holo} position={[0, 1.9, R + 1.5]}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshBasicMaterial color="#4fffb0" wireframe transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <MainScreen {...props} w={4.2} h={2.36} position={[0, 2.1, BACK + 0.08]} />
      <pointLight position={[0, 2, R + 1.5]} intensity={5} distance={6} color="#4fffb0" />
      {/* meja kerja dengan dua monitor, kursi, papan tulis, lampu strip */}
      <group position={[6.2, 0, R + 4]}>
        <B p={[0, 0.8, 0]} s={[1.2, 0.06, 3.6]} c="#2b3036" m={0.4} />
        {[-1.6, 1.6].map((z) => <B key={z} p={[0, 0.4, z]} s={[1.1, 0.8, 0.06]} c="#1a1e24" />)}
        {[-0.7, 0.7].map((z) => (
          <group key={z} position={[0.35, 1.25, z]} rotation-y={-Math.PI / 2}>
            <B p={[0, 0, 0]} s={[1.1, 0.65, 0.04]} c="#0a0a0a" e="#5fe0ff" ei={0.6} cast={false} />
            <B p={[0, -0.4, 0]} s={[0.06, 0.2, 0.06]} c="#333" />
          </group>
        ))}
      </group>
      <Chair p={[5.1, 0, R + 4]} rot={Math.PI / 2} office c="#1d2329" />
      {[-1.7, 1.7].map((x) => <Chair key={x} p={[x, 0, R + 1.5]} rot={x > 0 ? -Math.PI / 2 : Math.PI / 2} office c="#1d2329" />)}
      <Whiteboard p={[-4, 2, R + halfD - 0.04]} rot={Math.PI} scribble="#159a6a" />
      {[-3, 0, 3].map((x) => (
        <mesh key={x} position={[x, height - 0.02, R]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[0.06, halfD * 2 - 1]} />
          <meshBasicMaterial color="#4fffb0" toneMapped={false} />
        </mesh>
      ))}
      <B p={[-5.3, 0.03, R - 2]} s={[0.25, 0.06, 9]} c="#0c0f12" cast={false} />
    </group>
  )
}

function StudioRoom(props) {
  return (
    <group>
      <B p={[0, 0.9, R - 6.6]} s={[4.8, 0.07, 1.8]} c="#e7e1d6" r={0.5} />
      {[-2.3, 2.3].map((x) => <B key={x} p={[x, 0.45, R - 6.6]} s={[0.08, 0.9, 1.7]} c="#222" m={0.5} />)}
      <B p={[0, 1.1, R - 7.05]} s={[0.1, 0.35, 0.1]} c="#222" m={0.6} />
      <MainScreen {...props} w={2.6} h={1.46} position={[0, 1.95, R - 7.1]} />
      <B p={[1.7, 0.95, R - 6.3]} s={[0.9, 0.02, 0.6]} c="#1b1c1f" m={0.4} r={0.3} />
      {/* kuda-kuda lukis */}
      <group position={[4.8, 0, R - 1.4]} rotation-y={-0.6}>
        {[-0.4, 0.4].map((x) => <B key={x} p={[x, 1, 0]} s={[0.06, 2, 0.06]} c="#8a6748" rotation-z={-x * 0.15} />)}
        <B p={[0, 1.4, 0.05]} s={[1.1, 0.8, 0.04]} c="#fdfbf7" r={1} />
        <B p={[-0.1, 1.45, 0.08]} s={[0.5, 0.3, 0.01]} c="#ff7eb6" cast={false} />
        <B p={[0.2, 1.3, 0.08]} s={[0.3, 0.35, 0.01]} c="#5fe0ff" cast={false} />
      </group>
      {/* lampu gantung */}
      {[-2.5, 0, 2.5].map((x) => (
        <group key={x} position={[x, height, R - 3]}>
          <B p={[0, -0.5, 0]} s={[0.02, 1, 0.02]} c="#222" cast={false} />
          <mesh position={[0, -1.1, 0]}>
            <coneGeometry args={[0.3, 0.3, 20, 1, true]} />
            <meshStandardMaterial color="#1b1c1f" emissive="#ffd79a" emissiveIntensity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <Plant p={[-5.9, 0, R - 6.9]} s={1.4} />
      <Plant p={[-5.9, 0, R + 4]} />
      {/* sofa, rak buku, papan inspirasi, tripod kamera */}
      <Rug p={[-4.4, 0, R + 3.2]} w={3.2} d={3.2} c="#e9d8c4" border="#c9b79a" round />
      <Armchair p={[-5.9, 0, R + 2.6]} rot={Math.PI / 2} c="#c9b79a" />
      <Armchair p={[-5.9, 0, R + 3.8]} rot={Math.PI / 2} c="#c9b79a" />
      <SideTable p={[-4.6, 0, R + 3.2]} c="#e7e1d6" />
      <Chair p={[0, 0, R - 5.3]} rot={Math.PI} office c="#e9e4dc" />
      <Bookshelf p={[6.72, 0, R + 4.8]} rot={-Math.PI / 2} w={2.4} h={2.4} c="#f1ece4" seed={6} />
      <group position={[-4, 2, R + halfD - 0.04]} rotation-y={Math.PI}>
        <B p={[0, 0, 0]} s={[2.6, 1.4, 0.04]} c="#b98a5a" r={1} cast={false} />
        {['#ffd25e', '#ff7eb6', '#7fe8ff', '#b6f09c', '#ffd25e', '#ff8a3d', '#c58bff', '#ffffff'].map((c, i) => (
          <mesh key={i} position={[-1 + (i % 4) * 0.66, 0.3 - Math.floor(i / 4) * 0.6, 0.03]} rotation-z={((i * 7) % 5 - 2) * 0.04}>
            <planeGeometry args={[i % 3 === 0 ? 0.5 : 0.36, 0.36]} />
            <meshStandardMaterial color={c} roughness={1} />
          </mesh>
        ))}
      </group>
      <group position={[2.8, 0, R + 2]}>
        {[0, 2.1, 4.2].map((a) => <B key={a} p={[Math.sin(a) * 0.22, 0.6, Math.cos(a) * 0.22]} s={[0.03, 1.25, 0.03]} c="#222" rotation={[Math.cos(a) * 0.18, 0, -Math.sin(a) * 0.18]} />)}
        <B p={[0, 1.3, 0]} s={[0.3, 0.2, 0.18]} c="#1b1c1f" m={0.3} />
        <mesh position={[0, 1.3, -0.14]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
          <meshStandardMaterial color="#111" metalness={0.6} />
        </mesh>
      </group>
      <Clock p={[3.4, 3.4, BACK + 0.04]} />
    </group>
  )
}

// slot bingkai yang tertutup furnitur
const SKIP = { apartment: [3, 4], dorm: [3], lab: [0, 1, 2] }

const ROOMS = { house: HouseRoom, office: OfficeRoom, apartment: ApartmentRoom, dorm: DormRoom, lab: LabRoom, studio: StudioRoom }

export default function Interior({ project, nearRef, onOpen }) {
  if (!project) return null
  const theme = THEMES[project.interior] ?? THEMES.house
  const Room = ROOMS[project.interior] ?? HouseRoom
  const tools = project.tools?.length ? project.tools : project.tech
  return (
    <group>
      <Shell theme={theme} />
      <Room project={project} nearRef={nearRef} onOpen={onOpen} />
      <ToolFrames tools={tools} theme={theme} skip={SKIP[project.interior]} />
      <Text position={[-halfW + 0.03, 3.75, R - 1.5]} rotation-y={Math.PI / 2} fontSize={0.09} letterSpacing={0.4} color={theme.frame === 'dark' ? '#5fe0ff' : '#9a9387'} anchorX="center">
        {`${theme.label} · ${String(project.index + 1).padStart(2, '0')} · ${project.title.toUpperCase()}`}
      </Text>
    </group>
  )
}
