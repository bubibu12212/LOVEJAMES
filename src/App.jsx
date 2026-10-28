import { Suspense, useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import Scene from './components/Scene'
import Overlay from './components/Overlay'

const keyMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

export default function App() {
  const [stage, setStage] = useState('intro') // intro | opening | explore
  const [active, setActive] = useState(null)
  const [visited, setVisited] = useState([])

  const onActive = useCallback((s) => {
    setActive(s)
    if (s) setVisited((v) => (v.includes(s.id) ? v : [...v, s.id]))
  }, [])

  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        camera={{ position: [0, 2.6, 9.5], fov: 50, near: 0.1, far: 200 }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene stage={stage} setStage={setStage} setActive={onActive} />
        </Suspense>
      </Canvas>
      <Overlay stage={stage} setStage={setStage} active={active} visited={visited} />
    </KeyboardControls>
  )
}
