import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { journeySpots, photoSrc } from '../world'

const PW = 2.5      // lebar foto
const PH = 1.66      // tinggi foto
const PANEL_Y = 2.45
const HOLO = '#7fe8ff'
const PINK = '#ff7eb6'
const worldPos = new THREE.Vector3()

// foto dipotong supaya pas di bingkai (seperti object-fit: cover)
function usePhotoTexture(item) {
  return useMemo(() => {
    const tex = new THREE.TextureLoader().load(photoSrc(item), (t) => {
      const aspect = t.image.width / t.image.height
      const frame = PW / PH
      if (aspect > frame) {
        t.repeat.set(frame / aspect, 1)
        t.offset.set((1 - frame / aspect) / 2, 0)
      } else {
        t.repeat.set(1, aspect / frame)
        t.offset.set(0, (1 - aspect / frame) / 2)
      }
      t.needsUpdate = true
    })
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [item])
}

// garis-garis hologram yang bergerak di atas foto
function makeScanMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOn: { value: 0 }, uColor: { value: new THREE.Color(HOLO) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTime; uniform float uOn; uniform vec3 uColor; varying vec2 vUv;
      void main(){
        float lines = 0.5 + 0.5 * sin(vUv.y * 320.0 - uTime * 6.0);
        float sweep = smoothstep(0.0, 0.08, 0.08 - abs(fract(uTime * 0.35) - vUv.y));
        float edge = 1.0 - smoothstep(0.0, 0.05, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
        float a = (lines * 0.06 + sweep * 0.35 + edge * 0.5) * uOn;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  })
}

function Station({ spot, activeRef }) {
  const tex = usePhotoTexture(spot)
  const scan = useMemo(() => makeScanMaterial(), [])
  const scanMesh = useRef()
  const panel = useRef()
  const beam = useRef()
  const marker = useRef()
  const chip = useRef()
  const anim = useRef({ s: 0, v: 0 })
  const lampX = spot.side * 0.6

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const t = state.clock.elapsedTime
    const on = activeRef.current === spot.index
    const a = anim.current
    // pegas: panel "pop" muncul sedikit memantul
    a.v += (((on ? 1 : 0) - a.s) * 160 - a.v * 14) * dt
    a.s += a.v * dt
    if (!on && a.s < 0.02) { a.s = 0; a.v = 0 }
    const g = panel.current
    g.visible = a.s > 0.001
    g.scale.set(Math.max(a.s, 0.0001), Math.max(Math.min(a.s * 1.4, a.s + 0.1), 0.0001), 1)
    g.position.y = Math.sin(t * 1.4 + spot.index) * 0.05

    // panel selalu menghadap kamera (hanya putar kiri-kanan)
    g.getWorldPosition(worldPos)
    const cam = state.camera.position
    const yaw = Math.atan2(cam.x - worldPos.x, cam.z - worldPos.z)
    const diff = Math.atan2(Math.sin(yaw - g.rotation.y), Math.cos(yaw - g.rotation.y))
    g.rotation.y += diff * (1 - Math.exp(-5 * dt))

    const u = scanMesh.current.material.uniforms
    u.uTime.value = t
    u.uOn.value = Math.min(a.s, 1)
    const lit = THREE.MathUtils.clamp(a.s, 0, 1)
    beam.current.material.opacity = lit * 0.16
    beam.current.visible = lit > 0.01
    marker.current.emissiveIntensity = 0.5 + lit * 2.5
    chip.current.visible = lit < 0.5
    chip.current.rotation.y = t * 1.5
    chip.current.position.y = 1.3 + Math.sin(t * 2 + spot.index) * 0.08
  })

  return (
    <group position={[spot.x, 0, spot.z]}>
      {/* tiang lampu sorot */}
      <mesh position={[lampX, 0.12, 0]} castShadow>
        <boxGeometry args={[0.36, 0.24, 0.36]} />
        <meshStandardMaterial color="#5e5b56" roughness={0.9} />
      </mesh>
      <mesh position={[lampX, 2.05, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 3.9, 8]} />
        <meshStandardMaterial color="#141518" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[lampX - spot.side * 0.18, 4.0, 0]} rotation-z={spot.side * 0.9}>
        <cylinderGeometry args={[0.07, 0.12, 0.28, 12]} />
        <meshStandardMaterial color="#141518" metalness={0.7} roughness={0.35} emissive="#fff3dd" emissiveIntensity={0.4} />
      </mesh>
      {/* berkas cahaya sorot (palsu, cukup kerucut transparan) */}
      <mesh ref={beam} position={[-spot.side * 0.35, 2.05, 0]} rotation-z={spot.side * 0.22}>
        <coneGeometry args={[1.25, 3.9, 32, 1, true]} />
        <meshBasicMaterial color="#fff1d8" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      {/* penanda di tanah */}
      <mesh rotation-x={-Math.PI / 2} position={[-spot.side * 0.5, 0.11, 0]}>
        <ringGeometry args={[0.55, 0.62, 48]} />
        <meshStandardMaterial ref={marker} color={HOLO} emissive={HOLO} emissiveIntensity={0.5} toneMapped={false} transparent opacity={0.8} />
      </mesh>
      <Text position={[-spot.side * 0.5, 0.115, 0]} rotation-x={-Math.PI / 2} fontSize={0.22} letterSpacing={0.1} color="#e9f9ff" anchorX="center" anchorY="middle">
        {spot.year}
      </Text>
      {/* kristal kecil melayang = tanda ada cerita */}
      <mesh ref={chip} position={[-spot.side * 0.5, 1.3, 0]}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color={HOLO} emissive={HOLO} emissiveIntensity={2} toneMapped={false} transparent opacity={0.85} />
      </mesh>

      {/* panel hologram */}
      <group position={[-spot.side * 0.6, PANEL_Y, 0]}>
        <group ref={panel} visible={false}>
          <mesh position={[0, -0.12, -0.03]}>
            <planeGeometry args={[PW + 0.34, PH + 1.04]} />
            <meshBasicMaterial color="#06131c" transparent opacity={0.72} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <planeGeometry args={[PW, PH]} />
            <meshBasicMaterial map={tex} toneMapped={false} transparent opacity={0.96} />
          </mesh>
          <mesh ref={scanMesh} position={[0, 0.1, 0.01]} material={scan}>
            <planeGeometry args={[PW, PH]} />
          </mesh>
          {/* sudut bingkai */}
          {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => (
            <group key={`${sx}${sy}`} position={[sx * (PW / 2 + 0.1), 0.1 + sy * (PH / 2 + 0.1), 0.02]}>
              <mesh position={[-sx * 0.14, 0, 0]}>
                <planeGeometry args={[0.3, 0.025]} />
                <meshBasicMaterial color={HOLO} toneMapped={false} />
              </mesh>
              <mesh position={[0, -sy * 0.14, 0]}>
                <planeGeometry args={[0.025, 0.3]} />
                <meshBasicMaterial color={HOLO} toneMapped={false} />
              </mesh>
            </group>
          ))}
          <Text position={[-PW / 2, 0.1 + PH / 2 + 0.2, 0.02]} fontSize={0.1} letterSpacing={0.3} color={PINK} anchorX="left" anchorY="middle">
            {`MY JOURNEY · ${String(spot.index + 1).padStart(2, '0')}`}
          </Text>
          <Text position={[PW / 2, 0.1 + PH / 2 + 0.2, 0.02]} fontSize={0.1} letterSpacing={0.3} color={HOLO} anchorX="right" anchorY="middle">
            {spot.year}
          </Text>
          <Text position={[-PW / 2, 0.1 - PH / 2 - 0.12, 0.02]} fontSize={0.17} maxWidth={PW} color="#ffffff" anchorX="left" anchorY="top" fontWeight={700}>
            {spot.title}
          </Text>
          <Text position={[-PW / 2, 0.1 - PH / 2 - 0.38, 0.02]} fontSize={0.095} maxWidth={PW} lineHeight={1.4} color="#bfe9f5" anchorX="left" anchorY="top">
            {spot.text}
          </Text>
        </group>
      </group>
    </group>
  )
}

// lampu sorot sungguhan hanya satu, pindah ke cerita yang sedang aktif
function MovingSpot({ activeRef }) {
  const light = useRef()
  const target = useRef()
  useFrame((_, dt) => {
    const i = activeRef.current
    const s = journeySpots[i]
    const l = light.current
    if (l.target !== target.current) l.target = target.current
    if (s) {
      l.position.set(s.x + s.side * 0.4, 4.1, s.z + 0.3)
      target.current.position.set(s.x - s.side * 0.6, 1.5, s.z)
    }
    l.intensity = THREE.MathUtils.damp(l.intensity, s ? 60 : 0, 5, dt)
  })
  return (
    <>
      <spotLight ref={light} angle={0.55} penumbra={0.6} distance={12} decay={1.6} color="#fff0d8" intensity={0} />
      <object3D ref={target} />
    </>
  )
}

export default function Journey({ activeRef }) {
  return (
    <group>
      {journeySpots.map((s) => <Station key={s.index} spot={s} activeRef={activeRef} />)}
      <MovingSpot activeRef={activeRef} />
    </group>
  )
}
