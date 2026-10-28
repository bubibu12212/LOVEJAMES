import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'
import { obstacles } from '../world'

const SPEED = 3.5
const MODEL_SCALE = 0.33   // tinggi karakter ≈ 1.7. Mau lebih kecil/besar? ubah angka ini
const MODEL_FACING = 0     // kalau jalannya mundur, ganti jadi Math.PI
const dir = new THREE.Vector3()

export default function Character({ playerRef, stage }) {
  const enabled = stage === 'explore'
  const { scene, animations } = useGLTF('/models/icafixed.glb')
  const model = useRef()
  const { actions } = useAnimations(animations, model)
  const [, getKeys] = useKeyboardControls()

  useEffect(() => {
    // sembunyikan alas, kaca pembesar, dan lengan kanan yang terangkat
    ;['pedestal', 'magnifier_glass', 'magnifier_handle', 'magnifier_ring',
      'elbow_R', 'sleeve_R_fore', 'sleeve_R_upper'].forEach((n) => {
      const o = scene.getObjectByName(n)
      if (o) o.visible = false
    })

    // lengan kanan turun: tiru lengan kiri (dicerminkan)
    const sL = scene.getObjectByName('sleeve_L')
    if (sL && !scene.getObjectByName('sleeve_R_down')) {
      const sR = sL.clone()
      sR.name = 'sleeve_R_down'
      sR.position.set(-sL.position.x, sL.position.y, sL.position.z)
      sR.quaternion.set(sL.quaternion.x, -sL.quaternion.y, -sL.quaternion.z, sL.quaternion.w)
      sL.parent.add(sR)
    }
    const hL = scene.getObjectByName('hand_L')
    const hR = scene.getObjectByName('hand_R')
    if (hL && hR) hR.position.set(-hL.position.x, hL.position.y, hL.position.z)
    const tL = scene.getObjectByName('thumb_L')
    const tR = scene.getObjectByName('thumb_R')
    if (tL && tR) {
      tR.position.set(-tL.position.x, tL.position.y, tL.position.z)
      tR.quaternion.set(tL.quaternion.x, -tL.quaternion.y, -tL.quaternion.z, tL.quaternion.w)
    }

    scene.traverse((o) => { if (o.isMesh) o.castShadow = true })
    actions['Head_PivotAction']?.play()
  }, [actions, scene])

  useFrame((state, dt) => {
    const g = playerRef.current
    const k = getKeys()
    dir.set(Number(k.right) - Number(k.left), 0, Number(k.back) - Number(k.forward))
    const moving = enabled && dir.lengthSq() > 0
    let target = null

    if (moving) {
      dir.normalize()
      g.position.addScaledVector(dir, SPEED * dt)
      g.position.x = THREE.MathUtils.clamp(g.position.x, -13.5, 13.5)
      g.position.z = THREE.MathUtils.clamp(g.position.z, -38, 3.5)

      // tabrakan sama pohon, rumah, tembok, pilar
      for (const o of obstacles) {
        const dx = g.position.x - o.x
        const dz = g.position.z - o.z
        const d = Math.hypot(dx, dz)
        const min = o.r + 0.35
        if (d < min && d > 0.0001) {
          g.position.x = o.x + (dx / d) * min
          g.position.z = o.z + (dz / d) * min
        }
      }
      target = Math.atan2(dir.x, dir.z) + MODEL_FACING
    } else if (stage === 'opening') {
      target = Math.PI + MODEL_FACING // berbalik menghadap gerbang
    }

    if (target !== null) {
      let diff = target - g.rotation.y
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      g.rotation.y += diff * Math.min(1, dt * 8)
    }

    const t = state.clock.elapsedTime
    model.current.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.06 : 0
    model.current.rotation.z = moving ? Math.sin(t * 10) * 0.05 : 0
  })

  return (
    <group ref={playerRef} position={[0, 0, 2.5]}>
      <group ref={model} scale={MODEL_SCALE}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload('/models/icafixed.glb')