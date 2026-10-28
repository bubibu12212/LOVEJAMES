import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { ROOM, ROOM_EXIT, photoSpots, photoSrc } from '../world'

const FRAME_W = 2.6
const FRAME_H = 1.85
const PHOTO_Y = 2.35

function woodTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')
  for (let i = 0; i < 8; i++) {
    const l = 60 + ((i * 37) % 9)
    g.fillStyle = `hsl(32, 26%, ${l}%)`
    g.fillRect(i * 32, 0, 32, 512)
    g.fillStyle = 'rgba(70,50,30,0.25)'
    g.fillRect(i * 32, 0, 1.5, 512)
    g.fillRect(i * 32, (i * 173) % 512, 32, 1.5)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(4, 3)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// foto dipotong supaya pas di bingkai (seperti object-fit: cover)
function usePhotoTexture(spot) {
  return useMemo(() => {
    const tex = new THREE.TextureLoader().load(photoSrc(spot), (t) => {
      const img = t.image
      const frame = FRAME_W / FRAME_H
      const aspect = img.width / img.height
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
  }, [spot])
}

function Photo({ spot, activeRef }) {
  const tex = usePhotoTexture(spot)
  const glow = useRef()
  useFrame((_, dt) => {
    const on = activeRef.current === spot.index
    glow.current.emissiveIntensity = THREE.MathUtils.damp(glow.current.emissiveIntensity, on ? 2.2 : 0.15, 6, dt)
  })

  return (
    <group position={[spot.x, PHOTO_Y, spot.z]} rotation-y={spot.rot}>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[FRAME_W + 0.2, FRAME_H + 0.2, 0.06]} />
        <meshStandardMaterial ref={glow} color="#16181b" emissive="#ffcf8a" emissiveIntensity={0.15} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[FRAME_W + 0.06, FRAME_H + 0.06]} />
        <meshBasicMaterial color="#f4f1ea" />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[FRAME_W - 0.12, FRAME_H - 0.12]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* lampu sorot kecil di atas foto */}
      <mesh position={[0, FRAME_H / 2 + 0.55, 0.3]}>
        <cylinderGeometry args={[0.06, 0.1, 0.25, 12]} />
        <meshStandardMaterial color="#222" emissive="#fff1d6" emissiveIntensity={0.6} />
      </mesh>
      <Text position={[0, -FRAME_H / 2 - 0.3, 0.05]} fontSize={0.12} maxWidth={FRAME_W} color="#3a3d42" anchorX="center" anchorY="top" textAlign="center">
        {spot.caption}
      </Text>
    </group>
  )
}

export default function GalleryRoom({ activePhotoRef }) {
  const wood = useMemo(() => woodTexture(), [])
  const { cx, cz, halfW, halfD, height } = ROOM
  const wall = <meshStandardMaterial color="#f1efea" emissive="#f1efea" emissiveIntensity={0.28} roughness={0.95} />
  const doorW = 2.6

  return (
    <group>
      {/* lantai & langit-langit */}
      <mesh rotation-x={-Math.PI / 2} position={[cx, 0.01, cz]} receiveShadow>
        <planeGeometry args={[halfW * 2, halfD * 2]} />
        <meshStandardMaterial map={wood} roughness={0.55} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[cx, height, cz]}>
        <planeGeometry args={[halfW * 2, halfD * 2]} />
        <meshStandardMaterial color="#f7f6f3" emissive="#f7f6f3" emissiveIntensity={0.55} roughness={1} />
      </mesh>

      {/* dinding */}
      <mesh position={[cx - halfW, height / 2, cz]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[halfD * 2, height]} />
        {wall}
      </mesh>
      <mesh position={[cx + halfW, height / 2, cz]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[halfD * 2, height]} />
        {wall}
      </mesh>
      <mesh position={[cx, height / 2, cz - halfD]}>
        <planeGeometry args={[halfW * 2, height]} />
        {wall}
      </mesh>
      {/* dinding depan dengan pintu */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[cx + s * (doorW / 2 + (halfW - doorW / 2) / 2), height / 2, cz + halfD]} rotation-y={Math.PI}>
          <planeGeometry args={[halfW - doorW / 2, height]} />
          {wall}
        </mesh>
      ))}
      <mesh position={[cx, (height + 3) / 2, cz + halfD]} rotation-y={Math.PI}>
        <planeGeometry args={[doorW, height - 3]} />
        {wall}
      </mesh>
      <mesh position={[cx, 1.5, cz + halfD + 0.05]} rotation-y={Math.PI}>
        <planeGeometry args={[doorW, 3]} />
        <meshBasicMaterial color="#fff4de" />
      </mesh>
      <Text position={[cx, 3.35, cz + halfD - 0.02]} rotation-y={Math.PI} fontSize={0.2} letterSpacing={0.25} color="#2f8f5b" anchorX="center">
        KELUAR
      </Text>

      {/* list lantai */}
      {[[cx - halfW + 0.03, cz, 0.06, halfD * 2], [cx + halfW - 0.03, cz, 0.06, halfD * 2], [cx, cz - halfD + 0.03, halfW * 2, 0.06]].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.08, z]}>
          <boxGeometry args={[w, 0.16, d]} />
          <meshStandardMaterial color="#d9d5cd" />
        </mesh>
      ))}

      {/* lampu panel di langit-langit */}
      {[-5, 0, 5].map((dz) => (
        <group key={dz}>
          <mesh position={[cx, height - 0.02, cz + dz]} rotation-x={Math.PI / 2}>
            <planeGeometry args={[8, 0.35]} />
            <meshBasicMaterial color="#fffaf0" toneMapped={false} />
          </mesh>
          <pointLight position={[cx, height - 0.6, cz + dz]} intensity={14} distance={11} color="#fff1dc" />
        </group>
      ))}

      {/* bangku di tengah */}
      <group position={[cx, 0, cz - 1]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.12, 0.9]} />
          <meshStandardMaterial color="#8a6a4a" roughness={0.6} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1, 0.2, 0]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.8]} />
            <meshStandardMaterial color="#2a2d31" metalness={0.6} />
          </mesh>
        ))}
      </group>

      <Text position={[cx, 4.1, cz - halfD + 0.05]} fontSize={0.36} letterSpacing={0.3} color="#2a2d31" anchorX="center" fontWeight={700}>
        GALERI KEGIATAN
      </Text>

      {photoSpots.map((s) => <Photo key={s.index} spot={s} activeRef={activePhotoRef} />)}

      {/* lingkaran keluar */}
      <mesh position={[ROOM_EXIT[0], 0.03, ROOM_EXIT[1]]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.8, 1.0, 48]} />
        <meshBasicMaterial color="#2fbf71" transparent opacity={0.75} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
