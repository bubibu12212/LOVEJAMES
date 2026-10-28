import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ===================== SLOT ANIMASI 3D "ABOUT ME" =====================
// Ganti ISI fungsi mountAnimation dengan kode Three.js kamu sendiri.
// - container = <div> tempat animasi dipasang (ukurannya mengikuti layout).
// - Kembalikan fungsi "cleanup" yang menghentikan loop & membersihkan renderer.
// Yang di bawah ini hanya contoh sementara.
function mountAnimation(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.set(0, 0, 7)

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.3, 0.38, 220, 32),
    new THREE.MeshStandardMaterial({ color: '#ffb259', roughness: 0.25, metalness: 0.6 })
  )
  scene.add(knot)
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.6, 1),
    new THREE.MeshBasicMaterial({ color: '#5fd3f3', wireframe: true, transparent: true, opacity: 0.25 })
  )
  scene.add(wire)
  scene.add(new THREE.HemisphereLight('#ffffff', '#334455', 1.2))
  const key = new THREE.DirectionalLight('#ffffff', 2.5)
  key.position.set(3, 4, 5)
  scene.add(key)

  const resize = () => {
    const w = container.clientWidth
    const h = container.clientHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  let frame
  const clock = new THREE.Clock()
  const loop = () => {
    const t = clock.getElapsedTime()
    knot.rotation.set(t * 0.3, t * 0.45, 0)
    wire.rotation.set(-t * 0.1, t * 0.15, 0)
    renderer.render(scene, camera)
    frame = requestAnimationFrame(loop)
  }
  loop()

  return () => {
    cancelAnimationFrame(frame)
    ro.disconnect()
    renderer.dispose()
    renderer.domElement.remove()
  }
}

export default function About3D() {
  const ref = useRef()
  useEffect(() => mountAnimation(ref.current), [])
  return <div ref={ref} className="about-3d" />
}
