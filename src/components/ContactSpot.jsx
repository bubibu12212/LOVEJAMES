import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { B } from './Props'
import { profile } from '../data'
import { CONTACT } from '../world'

const PINK = '#ff7eb6'
const CYAN = '#7fe8ff'
const BW = 4
const BH = 2.6

// karakter kamu berdiri di ujung jalan (salinan model yang sama dengan pemain)
function Host({ activeRef }) {
  const { scene, animations } = useGLTF('/models/icafixed.glb')
  const model = useMemo(() => scene.clone(true), [scene])
  const ref = useRef()
  const { actions } = useAnimations(animations, ref)
  useEffect(() => {
    ;['pedestal', 'magnifier_glass', 'magnifier_handle', 'magnifier_ring'].forEach((n) => {
      const o = model.getObjectByName(n)
      if (o) o.visible = false
    })
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.material.envMapIntensity = 0.35 } })
    actions['Head_PivotAction']?.play()
  }, [model, actions])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const g = ref.current
    // bernapas & sedikit bergoyang; menoleh ke pemain saat dekat
    g.position.y = Math.sin(t * 2) * 0.01
    const target = activeRef.current ? 0.05 : 0.3 + Math.sin(t * 0.5) * 0.15
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, target, 0.05)
  })
  return (
    <group position={[CONTACT.character[0], 0, CONTACT.character[1]]}>
      {/* alas batu bundar */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.75, 0.85, 0.2, 40]} />
        <meshStandardMaterial color="#77736c" roughness={0.9} />
      </mesh>
      <group ref={ref} position={[0, 0.2, 0]}>
        <group scale={0.33}>
          <primitive object={model} />
        </group>
      </group>
      {/* gelembung sapaan */}
      <group position={[0, 2.55, 0.1]}>
        <RoundedBox args={[1.7, 0.42, 0.04]} radius={0.12}>
          <meshBasicMaterial color="#fff6f9" toneMapped={false} />
        </RoundedBox>
        <Text position={[0, 0, 0.03]} fontSize={0.13} color="#2a1b22" anchorX="center" anchorY="middle" fontWeight={700}>
          Hi, thanks for visiting!
        </Text>
      </group>
    </group>
  )
}

function ContactRow({ c, y, onOpen }) {
  const live = c.href && c.href !== '#'
  const open = (e) => {
    e.stopPropagation()
    if (live) window.open(c.href, '_blank', 'noopener')
    else onOpen()
  }
  return (
    <group position={[-BW / 2 + 0.35, y, 0.06]}>
      <mesh
        position={[BW / 2 - 0.35, 0, -0.005]}
        onClick={open}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = '' }}
      >
        <planeGeometry args={[BW - 0.7, 0.32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Text fontSize={0.085} letterSpacing={0.25} color={PINK} anchorX="left" anchorY="middle">{c.label.toUpperCase()}</Text>
      <Text position={[0.95, 0, 0]} fontSize={0.15} color="#f4f1ec" anchorX="left" anchorY="middle">{c.text}</Text>
      <Text position={[BW - 0.75, 0, 0]} fontSize={0.15} color={CYAN} anchorX="right" anchorY="middle">↗</Text>
      <mesh position={[BW / 2 - 0.35, -0.2, 0]}>
        <planeGeometry args={[BW - 0.7, 0.006]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

// papan kontak: kaca buram dengan rangka kayu gelap & atap kecil
function Board({ activeRef, onOpen }) {
  const edge = useRef()
  useFrame((state, dt) => {
    const on = activeRef.current
    edge.current.emissiveIntensity = THREE.MathUtils.damp(edge.current.emissiveIntensity, on ? 2.6 + Math.sin(state.clock.elapsedTime * 3) * 0.4 : 1, 4, dt)
  })
  const rows = profile.contacts
  return (
    <group position={[CONTACT.board[0], 0, CONTACT.board[1]]} rotation-y={-0.12}>
      {[-1, 1].map((s) => (
        <group key={s}>
          <B p={[s * (BW / 2 + 0.12), 1.7, 0]} s={[0.16, 3.4, 0.16]} c="#2a1d14" />
          <B p={[s * (BW / 2 + 0.12), 0.1, 0]} s={[0.36, 0.2, 0.36]} c="#6d6a64" />
        </group>
      ))}
      <B p={[0, 3.45, 0]} s={[BW + 0.9, 0.14, 0.42]} c="#1d1f23" r={0.5} />
      <B p={[0, 3.3, 0]} s={[BW + 0.5, 0.12, 0.22]} c="#2a1d14" />
      {/* kaca buram (klik = buka jendela kontak) */}
      <mesh
        position={[0, 1.85, 0]}
        onClick={(e) => { e.stopPropagation(); onOpen() }}
        onPointerOver={() => { document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { document.body.style.cursor = '' }}
      >
        <boxGeometry args={[BW, BH, 0.06]} />
        <meshStandardMaterial color="#120e16" transparent opacity={0.85} roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.85, -0.04]}>
        <boxGeometry args={[BW + 0.08, BH + 0.08, 0.02]} />
        <meshStandardMaterial ref={edge} color="#000" emissive={PINK} emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <group position={[0, 1.85, 0]}>
        <Text position={[-BW / 2 + 0.35, BH / 2 - 0.3, 0.05]} fontSize={0.085} letterSpacing={0.35} color={CYAN} anchorX="left" anchorY="middle">
          {'GET IN TOUCH · お問い合わせ'}
        </Text>
        <Text position={[-BW / 2 + 0.33, BH / 2 - 0.68, 0.05]} fontSize={0.44} letterSpacing={0.02} color="#ffffff" anchorX="left" anchorY="middle" fontWeight={800}>
          CONTACT ME
        </Text>
        <Text position={[-BW / 2 + 0.35, BH / 2 - 1.02, 0.05]} fontSize={0.12} color="#c9c1d1" anchorX="left" anchorY="middle">
          {"Let's build something together."}
        </Text>
        {rows.map((c, i) => <ContactRow key={c.label} c={c} y={-0.05 - i * 0.36} onOpen={onOpen} />)}
        <Text position={[BW / 2 - 0.35, -BH / 2 + 0.2, 0.05]} fontSize={0.075} letterSpacing={0.3} color={CYAN} anchorX="right" anchorY="middle">
          CLICK THE BOARD TO CONTACT ME ▸
        </Text>
      </group>
    </group>
  )
}

export default function ContactSpot({ activeRef, onOpen }) {
  const spot = useRef()
  const target = useRef()
  useFrame(() => {
    if (spot.current.target !== target.current) spot.current.target = target.current
  })
  return (
    <group>
      <Host activeRef={activeRef} />
      <Board activeRef={activeRef} onOpen={onOpen} />
      {/* lampu sorot dari atas ke karakter & papan */}
      <spotLight ref={spot} position={[CONTACT.x, 7, CONTACT.z - 0.5]} angle={0.6} penumbra={0.7} intensity={70} distance={16} decay={1.5} color="#ffe6f0" castShadow={false} />
      <object3D ref={target} position={[CONTACT.x, 0.8, CONTACT.board[1]]} />
      <pointLight position={[CONTACT.x, 2.6, CONTACT.z - 1.4]} intensity={4} distance={7} color={PINK} />
    </group>
  )
}
