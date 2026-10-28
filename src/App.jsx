import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import Scene from './components/Scene'
import Overlay from './components/Overlay'
import { Nav, Hero, About, Contact } from './components/Sections'

const keyMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

export default function App() {
  const [mode, setMode] = useState('scroll') // scroll | explore
  const [world, setWorld] = useState('garden') // garden | id project
  const [focus, setFocus] = useState(null) // hal di dekat pemain
  const [modal, setModal] = useState(false) // jendela detail project
  const [fade, setFade] = useState(false)
  const [inView, setInView] = useState(false)
  const [canEnter, setCanEnter] = useState(false)
  const section = useRef()
  const stage = useRef()
  const progress = useRef(0)

  const enter = useCallback(() => {
    setMode('explore')
    document.body.classList.add('locked')
  }, [])

  const exit = useCallback(() => {
    setMode('scroll')
    setFocus(null)
    setModal(false)
    setWorld('garden')
    document.body.classList.remove('locked')
  }, [])

  // progres scroll di section Projects: 0 = gerbang tertutup, 1 = gerbang terbuka penuh
  useEffect(() => {
    const onScroll = () => {
      const el = section.current
      const range = el.offsetHeight - window.innerHeight
      const top = el.getBoundingClientRect().top + window.scrollY
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / range))
      progress.current = p
      stage.current.style.setProperty('--p', p.toFixed(3))
      // tombol masuk muncul setelah gerbang terbuka; user sendiri yang memutuskan masuk
      setCanEnter(p > 0.55)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    if (mode !== 'scroll' || !canEnter) return
    const key = (e) => { if (e.key === 'Enter') enter() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [mode, canEnter, enter])

  // hanya render 3D saat section terlihat (hemat baterai)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(section.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (mode !== 'explore') return
    const key = (e) => {
      if (e.key === 'Escape') exit()
      // E = buka project saat berdiri di depan layar
      if ((e.key === 'e' || e.key === 'E') && focus?.type === 'screen') setModal(true)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [mode, exit, focus])

  const switchWorld = useCallback((target) => {
    setFade(true)
    setTimeout(() => {
      setFocus(null)
      setModal(false)
      document.body.style.cursor = ''
      setWorld(target)
      setTimeout(() => setFade(false), 150)
    }, 450)
  }, [])

  const openProject = useCallback(() => setModal(true), [])

  return (
    <>
      <Nav />
      <Hero />
      <About />

      <section className="projects" id="projects">
        <div className="gate-section" ref={section}>
          <div className={`stage ${mode === 'explore' ? 'is-explore' : ''}`} ref={stage}>
            <KeyboardControls map={keyMap}>
              <Canvas
                shadows="soft"
                dpr={[1, 2]}
                frameloop={inView || mode === 'explore' ? 'always' : 'never'}
                camera={{ position: [0, 2.6, 22], fov: 50, near: 0.1, far: 500 }}
              >
                <Suspense fallback={null}>
                  <Scene
                    mode={mode}
                    world={world}
                    progressRef={progress}
                    onFocus={setFocus}
                    onWorldSwitch={switchWorld}
                    onOpenProject={openProject}
                  />
                </Suspense>
              </Canvas>
            </KeyboardControls>
            <Overlay
              mode={mode}
              world={world}
              focus={focus}
              modal={modal}
              fade={fade}
              canEnter={canEnter}
              onEnter={enter}
              onExit={exit}
              onOpenProject={openProject}
              onCloseModal={() => setModal(false)}
            />
          </div>
        </div>
      </section>

      <Contact />
    </>
  )
}
