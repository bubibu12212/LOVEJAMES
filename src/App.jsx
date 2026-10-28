import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import Scene from './components/Scene'
import Overlay from './components/Overlay'
import { Nav, Hero, About, ProjectsGrid, Contact } from './components/Sections'

const keyMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'back', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
]

export default function App() {
  const [mode, setMode] = useState('scroll') // scroll | explore
  const [world, setWorld] = useState('city') // city | room
  const [active, setActive] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [fade, setFade] = useState(false)
  const [inView, setInView] = useState(false)
  const [canEnter, setCanEnter] = useState(false)
  const section = useRef()
  const stage = useRef()
  const progress = useRef(0)
  const modeRef = useRef(mode)

  const enter = useCallback(() => {
    modeRef.current = 'explore'
    setMode('explore')
    document.body.classList.add('locked')
  }, [])

  const exit = useCallback(() => {
    modeRef.current = 'scroll'
    setMode('scroll')
    setActive(null)
    setPhoto(null)
    setWorld('city')
    document.body.classList.remove('locked')
  }, [])

  // progres scroll di section Projects: 0 = gerbang tertutup, 1 = sudah di dalam kota
  useEffect(() => {
    const onScroll = () => {
      const el = section.current
      const range = el.offsetHeight - window.innerHeight
      const top = el.getBoundingClientRect().top + window.scrollY
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / range))
      progress.current = p
      stage.current.style.setProperty('--p', p.toFixed(3))
      // tombol "Masuk ke Kota" muncul setelah gerbang terbuka; user sendiri yang memutuskan masuk
      setCanEnter(p > 0.6)
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
    const key = (e) => { if (e.key === 'Escape') exit() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [mode, exit])

  const switchWorld = useCallback((target) => {
    setFade(true)
    setTimeout(() => {
      setActive(null)
      setPhoto(null)
      setWorld(target)
      setTimeout(() => setFade(false), 150)
    }, 450)
  }, [])

  return (
    <>
      <Nav />
      <Hero />
      <About />

      <section className="projects" id="projects">
        <ProjectsGrid />
        <div className="gate-section" ref={section}>
        <div className={`stage ${mode === 'explore' ? 'is-explore' : ''}`} ref={stage}>
          <KeyboardControls map={keyMap}>
            <Canvas
              shadows="soft"
              dpr={[1, 2]}
              frameloop={inView || mode === 'explore' ? 'always' : 'never'}
              camera={{ position: [0, 3.2, 26], fov: 50, near: 0.1, far: 400 }}
            >
              <Suspense fallback={null}>
                <Scene
                  mode={mode}
                  world={world}
                  progressRef={progress}
                  onActive={setActive}
                  onPhoto={setPhoto}
                  onWorldSwitch={switchWorld}
                />
              </Suspense>
            </Canvas>
          </KeyboardControls>
          <Overlay mode={mode} world={world} active={active} photo={photo} fade={fade} canEnter={canEnter} onEnter={enter} onExit={exit} />
        </div>
        </div>
      </section>

      <Contact />
    </>
  )
}
