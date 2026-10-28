import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { profile, storyIntro, exploreHint, storyEnding, stations } from '../data'

function Loader() {
  const { progress, active } = useProgress()
  const [gone, setGone] = useState(false)
  const done = !active && progress >= 100
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setGone(true), 700)
    return () => clearTimeout(t)
  }, [done])
  if (gone) return null
  return (
    <div className={`loader ${done ? 'is-done' : ''}`}>
      <p className="kicker">Menyiapkan berkas</p>
      <div className="loader-bar"><span style={{ width: `${progress}%` }} /></div>
      <p className="loader-num">{Math.round(progress)}%</p>
    </div>
  )
}

function Intro({ setStage }) {
  const [step, setStep] = useState(0)
  const last = step === storyIntro.length - 1
  const slide = storyIntro[step]

  return (
    <div className="intro">
      <header className="intro-head">
        <p className="kicker">Portfolio Interaktif</p>
        <h1>{profile.name}</h1>
        <p className="role">{profile.role}</p>
      </header>

      <div className="story-card glass" key={step}>
        <p className="kicker accent">{slide.kicker}</p>
        <p className="story-text">{slide.text}</p>
        <div className="story-foot">
          <div className="dots">
            {storyIntro.map((_, i) => <span key={i} className={i === step ? 'on' : ''} />)}
          </div>
          <div className="story-actions">
            {!last && <button className="btn ghost" onClick={() => setStage('opening')}>Lewati</button>}
            {last
              ? <button className="btn primary" onClick={() => setStage('opening')}>Buka Gerbang</button>
              : <button className="btn primary" onClick={() => setStep(step + 1)}>Lanjut</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Overlay({ stage, setStage, active, visited }) {
  const [endingClosed, setEndingClosed] = useState(false)
  const total = stations.length
  const solved = visited.length
  const allDone = solved >= total
  const contacts = profile.contacts.filter((c) => c.href && c.href !== '#')

  return (
    <div className="ui">
      <Loader />

      {stage === 'intro' && <Intro setStage={setStage} />}

      {stage === 'explore' && (
        <>
          <div className="hud-brand glass">
            <strong>{profile.name}</strong>
            <span>{profile.role}</span>
          </div>

          <div className="hud-progress glass">
            <span className="kicker">Kasus terpecahkan</span>
            <div className="progress-row">
              <b>{solved}/{total}</b>
              <div className="case-dots">
                {stations.map((s) => <span key={s.id} className={visited.includes(s.id) ? 'on' : ''} />)}
              </div>
            </div>
          </div>

          <div className={`toast glass ${active ? 'is-hidden' : ''}`}>{exploreHint}</div>

          <div className="hud-keys glass">
            <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> jalan</span>
            <span><kbd>Shift</kbd> lari</span>
            <span><kbd>Drag</kbd> putar kamera</span>
            <span><kbd>Scroll</kbd> zoom</span>
          </div>

          {active?.link && (
            <a className="btn primary open-link" href={active.link} target="_blank" rel="noreferrer">
              Buka {active.title} ↗
            </a>
          )}

          {allDone && !endingClosed && !active && (
            <div className="ending glass">
              <p className="kicker accent">Epilog</p>
              <h2>{storyEnding.title}</h2>
              <p>{storyEnding.text}</p>
              <div className="ending-actions">
                {contacts.map((c) => (
                  <a key={c.label} className="btn primary" href={c.href} target="_blank" rel="noreferrer">{c.label}</a>
                ))}
                <button className="btn ghost" onClick={() => setEndingClosed(true)}>Tutup</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
