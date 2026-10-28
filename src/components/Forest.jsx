import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { trees, pathPoints } from '../world'

const dummy = new THREE.Object3D()
const color = new THREE.Color()

export function Path() {
  const ref = useRef()
  useLayoutEffect(() => {
    pathPoints.forEach((p, i) => {
      dummy.position.set(p.x + Math.sin(i * 12.9) * 0.25, 0.02, p.z + Math.cos(i * 7.7) * 0.25)
      const s = 0.95 + (Math.sin(i * 3.3) * 0.5 + 0.5) * 0.45
      dummy.scale.set(s, 1, s)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pathPoints.length]} receiveShadow>
      <cylinderGeometry args={[1, 1, 0.04, 14]} />
      <meshStandardMaterial color="#e3cf9b" />
    </instancedMesh>
  )
}

export default function Forest() {
  const trunk = useRef()
  const pine = useRef()
  const round = useRef()
  const pines = trees.filter((t) => t.type === 0)
  const rounds = trees.filter((t) => t.type === 1)

  useLayoutEffect(() => {
    trees.forEach((t, i) => {
      dummy.position.set(t.x, 0.7 * t.s, t.z)
      dummy.scale.setScalar(t.s)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      trunk.current.setMatrixAt(i, dummy.matrix)
    })
    pines.forEach((t, i) => {
      dummy.position.set(t.x, 2.5 * t.s, t.z)
      dummy.scale.setScalar(t.s)
      dummy.rotation.set(0, t.shade * 6, 0)
      dummy.updateMatrix()
      pine.current.setMatrixAt(i, dummy.matrix)
      pine.current.setColorAt(i, color.setHSL(0.37 + t.shade * 0.04, 0.5, 0.2 + t.shade * 0.1))
    })
    rounds.forEach((t, i) => {
      dummy.position.set(t.x, 2.3 * t.s, t.z)
      dummy.scale.set(t.s, t.s * 0.9, t.s)
      dummy.rotation.set(0, t.shade * 6, 0)
      dummy.updateMatrix()
      round.current.setMatrixAt(i, dummy.matrix)
      round.current.setColorAt(i, color.setHSL(0.27 + t.shade * 0.08, 0.5, 0.32 + t.shade * 0.1))
    })
    ;[trunk, pine, round].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true
    })
  }, [pines, rounds])

  return (
    <>
      <instancedMesh ref={trunk} args={[undefined, undefined, trees.length]} castShadow>
        <cylinderGeometry args={[0.18, 0.25, 1.4, 6]} />
        <meshStandardMaterial color="#7a4a24" />
      </instancedMesh>
      <instancedMesh ref={pine} args={[undefined, undefined, pines.length]} castShadow>
        <coneGeometry args={[1.2, 3, 7]} />
        <meshStandardMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={round} args={[undefined, undefined, rounds.length]} castShadow>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial flatShading />
      </instancedMesh>
    </>
  )
}