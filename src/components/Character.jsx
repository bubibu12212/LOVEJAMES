import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'
import { camState, PLAYER_START } from '../world'

const SPEED = 3.2
const RUN_SPEED = 6
const MODEL_SCALE = 0.33   // tinggi karakter ≈ 1.7. Mau lebih kecil/besar? ubah angka ini
const MODEL_FACING = 0     // kalau jalannya mundur, ganti jadi Math.PI
const LEG_SWING = 0.65     // seberapa lebar langkah kaki (radian)
const ARM_SWING = 0.45     // seberapa lebar ayunan tangan
const dir = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)

// kelompokkan beberapa bagian model ke satu "engsel" supaya bisa diputar bareng
function makePivot(root, name, partNames, pivotPos) {
  let pivot = root.getObjectByName(name)
  if (pivot) return pivot
  pivot = new THREE.Group()
  pivot.name = name
  pivot.position.copy(pivotPos)
  partNames.forEach((n) => {
    const o = root.getObjectByName(n)
    if (!o || o.parent?.name === name) return
    o.position.sub(pivotPos)
    pivot.add(o)
  })
  root.add(pivot)
  return pivot
}

// ujung atas kaos kaki = posisi pinggul
function hipY(scene, sockName) {
  const sock = scene.getObjectByName(sockName)
  if (!sock) return 1.2
  sock.geometry.computeBoundingBox()
  return sock.position.y + sock.geometry.boundingBox.max.y * sock.scale.y
}

// bounds = {minX, maxX, minZ, maxZ} area boleh jalan, obstacles = lingkaran tabrakan dunia aktif
export default function Character({ playerRef, enabled, bounds, obstacles }) {
  const { scene, animations } = useGLTF('/models/icafixed.glb')
  const model = useRef()
  const limbs = useRef(null)
  const walk = useRef({ phase: 0, amount: 0 })
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

      const hL = scene.getObjectByName('hand_L')
      const hR = scene.getObjectByName('hand_R')
      if (hL && hR) hR.position.set(-hL.position.x, hL.position.y, hL.position.z)
      const tL = scene.getObjectByName('thumb_L')
      const tR = scene.getObjectByName('thumb_R')
      if (tL && tR) {
        tR.position.set(-tL.position.x, tL.position.y, tL.position.z)
        tR.quaternion.set(tL.quaternion.x, -tL.quaternion.y, -tL.quaternion.z, tL.quaternion.w)
      }
    }

    // engsel kaki (di pinggul) dan lengan (di bahu)
    const root = scene.getObjectByName('Detective_Root')
    if (root) {
      const hip = hipY(scene, 'sock_L')
      limbs.current = {
        legL: makePivot(root, 'leg_pivot_L', ['sock_L', 'shoe_L', 'shoe_toe_L'], new THREE.Vector3(0.3, hip, 0)),
        legR: makePivot(root, 'leg_pivot_R', ['sock_R', 'shoe_R', 'shoe_toe_R'], new THREE.Vector3(-0.3, hip, 0)),
        armL: makePivot(root, 'arm_pivot_L', ['sleeve_L', 'hand_L', 'thumb_L'], new THREE.Vector3(0.55, 2.7, 0.05)),
        armR: makePivot(root, 'arm_pivot_R', ['sleeve_R_down', 'hand_R', 'thumb_R'], new THREE.Vector3(-0.55, 2.7, 0.05)),
      }
    }

    scene.traverse((o) => { if (o.isMesh) o.castShadow = true })
    actions['Head_PivotAction']?.play()
  }, [actions, scene])

  useFrame((state, dt) => {
    const g = playerRef.current
    const k = getKeys()
    dir.set(Number(k.right) - Number(k.left), 0, Number(k.back) - Number(k.forward))
    const moving = enabled && dir.lengthSq() > 0
    const running = moving && k.run
    let target = null

    if (moving) {
      // arah jalan mengikuti arah kamera
      dir.normalize().applyAxisAngle(UP, camState.yaw)
      g.position.addScaledVector(dir, (running ? RUN_SPEED : SPEED) * dt)
      g.position.x = THREE.MathUtils.clamp(g.position.x, bounds.minX, bounds.maxX)
      g.position.z = THREE.MathUtils.clamp(g.position.z, bounds.minZ, bounds.maxZ)

      // tabrakan dengan lampu, pot, tembok, pilar, bangku
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
    }

    if (target !== null) {
      let diff = target - g.rotation.y
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      g.rotation.y += diff * Math.min(1, dt * 10)
    }

    // siklus langkah: kaki & tangan berayun berlawanan
    const w = walk.current
    w.amount = THREE.MathUtils.damp(w.amount, moving ? (running ? 1.25 : 1) : 0, 10, dt)
    w.phase += dt * (running ? 13 : 9) * (moving ? 1 : 0.4)
    const swing = Math.sin(w.phase) * w.amount
    if (limbs.current) {
      const { legL, legR, armL, armR } = limbs.current
      legL.rotation.x = swing * LEG_SWING
      legR.rotation.x = -swing * LEG_SWING
      armL.rotation.x = -swing * ARM_SWING
      armR.rotation.x = swing * ARM_SWING
    }

    // badan naik-turun tiap langkah, dan bernapas pelan saat diam
    const t = state.clock.elapsedTime
    model.current.position.y = Math.abs(Math.cos(w.phase)) * 0.07 * w.amount + Math.sin(t * 2) * 0.008
    model.current.rotation.z = Math.sin(w.phase) * 0.03 * w.amount
    model.current.rotation.x = 0.06 * w.amount
  })

  return (
    <group ref={playerRef} position={PLAYER_START}>
      <group ref={model} scale={MODEL_SCALE}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload('/models/icafixed.glb')
