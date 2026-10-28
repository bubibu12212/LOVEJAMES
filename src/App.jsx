import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import Scene from './components/Scene'
import Overlay from './components/Overlay'

const keyMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
]

export default function App() {
  const [stage, setStage] = useState('intro') // intro | opening | explore
  const [active, setActive] = useState(null)

  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        shadows
        camera={{ position: [0, 2.6, 9.5], fov: 50 }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene stage={stage} setStage={setStage} setActive={setActive} />
        </Suspense>
      </Canvas>
      <Overlay stage={stage} setStage={setStage} active={active} />
    </KeyboardControls>
  )
}