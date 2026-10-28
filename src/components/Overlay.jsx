import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { profile } from '../data'
import { photoSrc, buildingSpots } from '../world'

function Loader() {
  const { progress, active } = useProgress()
  const done = !active && progress >= 100
  const [gone, setGone] = useState(false)
  // hanya tampil saat pemuatan pertama
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setGone(true), 900)
    return () => clearTimeout(t)
  }, [done])
  if (gone) return null
  return (
    <div className={`loader ${done ? 'is-done' : ''}`}>
      <p className="eyebrow">Planting the garden</p>
      <div className="loader-bar"><span style={{ width: `${progress}%` }} /></div>
      <p className="loader-num">{Math.round(progress)}%</p>
    </div>
  )
}

// tutup dengan Esc tanpa ikut keluar dari mode jalan-jalan
function useEscape(onClose) {
  useEffect(() => {
    const key = (e) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose() } }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  }, [onClose])
}

function Lightbox({ photo, onClose }) {
  useEscape(onClose)
  return (
    <div className="lightbox" onClick={onClose}>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={photoSrc(photo)} alt={photo.title} />
        <figcaption><b>{photo.year} · {photo.title}</b><br />{photo.text}</figcaption>
      </figure>
      <button className="btn ghost lightbox-close" onClick={onClose}>Close</button>
    </div>
  )
}

function ProjectModal({ project, onClose }) {
  useEscape(onClose)
  const n = String(project.index + 1).padStart(2, '0')
  return (
    <div className="lightbox" onClick={onClose}>
      <article className="project-modal" onClick={(e) => e.stopPropagation()} style={{ '--accent': project.accent }}>
        <p className="mono pm-cat"><span>{n}</span> {project.category}</p>
        <h3 className="display">{project.title}</h3>
        <p className="pm-desc">{project.details || project.desc}</p>
        {project.images?.length > 0 && (
          <div className="pm-images">
            {project.images.map((src) => <img key={src} src={src} alt="" />)}
          </div>
        )}
        <div className="pm-row">
          <div>
            <p className="mono label">Tech stack</p>
            <ul className="chips">{project.tech.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          {project.tools?.length > 0 && (
            <div>
              <p className="mono label">Tools</p>
              <ul className="chips">{project.tools.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
        </div>
        <div className="pm-actions">
          {project.link
            ? <a className="btn red" href={project.link} target="_blank" rel="noreferrer">Open project ↗</a>
            : <span className="mono muted">Link coming soon</span>}
          <button className="btn ghost" onClick={onClose}>Close <kbd>Esc</kbd></button>
        </div>
      </article>
    </div>
  )
}

function ContactRowHtml({ c }) {
  const [copied, setCopied] = useState(false)
  const live = c.href && c.href !== '#'
  const copy = () => {
    navigator.clipboard?.writeText(c.text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <li>
      <span className="mono">{c.label}</span>
      {live ? <a href={c.href} target="_blank" rel="noreferrer">{c.text} ↗</a> : <span>{c.text}</span>}
      <button className="btn ghost cm-copy" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
    </li>
  )
}

function ContactModal({ onClose }) {
  useEscape(onClose)
  const email = profile.contacts.find((c) => c.label.toLowerCase() === 'email')
  return (
    <div className="lightbox" onClick={onClose}>
      <article className="project-modal contact-modal" onClick={(e) => e.stopPropagation()} style={{ '--accent': '#ff7eb6' }}>
        <p className="mono pm-cat"><span>✿</span> Get in touch · お問い合わせ</p>
        <h3 className="display">Contact me</h3>
        <p className="pm-desc">Open to opportunities, collaborations, or just a friendly chat. Pick whatever works best for you.</p>
        <ul className="cm-list">{profile.contacts.map((c) => <ContactRowHtml key={c.label} c={c} />)}</ul>
        <div className="pm-actions">
          {email && email.href !== '#' && <a className="btn red" href={email.href}>Send an email ↗</a>}
          <button className="btn ghost" onClick={onClose}>Close <kbd>Esc</kbd></button>
        </div>
      </article>
    </div>
  )
}

// teks di atas gerbang selama mode scroll (opacity diatur lewat CSS var --p)
export function ScrollIntro({ canEnter, onEnter }) {
  return (
    <>
      <div className="gate-intro">
        <p className="eyebrow"><span className="rule" /> 03 — Projects <span className="jp">· 庭園</span></p>
        <h2>Enter my garden.</h2>
        <p>Walk through my journey, step inside each building to explore a project, and say hi at the end of the path.</p>
        <div className="scroll-hint"><span />Scroll to open the gate</div>
      </div>
      <div className={`enter-cta ${canEnter ? 'show' : ''}`}>
        <button className="btn primary btn-lg" onClick={onEnter} tabIndex={canEnter ? 0 : -1}>
          Enter the Garden <span aria-hidden>→</span>
        </button>
        <p>or press <kbd>Enter</kbd> · you control the character</p>
      </div>
    </>
  )
}

function FocusCard({ focus, onPhoto, onOpenProject, onOpenContact }) {
  if (!focus) return null
  const { type, data } = focus
  if (type === 'story') {
    return (
      <button className="photo-card glass" onClick={() => onPhoto(data)}>
        <img src={photoSrc(data)} alt="" />
        <span>
          <small className="mono">My journey · {data.year}</small>
          <b>{data.title}</b>
          <small>Click to view the photo</small>
        </span>
      </button>
    )
  }
  if (type === 'door') {
    return (
      <div className="toast glass toast-static" style={{ '--accent': data.accent }}>
        <span className="mono">{String(data.index + 1).padStart(2, '0')} · {data.category}</span>
        <b>{data.title}</b> — step into the glowing circle to go inside.
      </div>
    )
  }
  if (type === 'screen') {
    return (
      <button className="btn primary open-link" onClick={onOpenProject}>
        Open {data.title} <kbd>E</kbd>
      </button>
    )
  }
  if (type === 'contact') {
    return (
      <div className="contact-card glass">
        <p className="mono label">Contact me · お問い合わせ</p>
        <ul>
          {profile.contacts.map((c) => (
            <li key={c.label}>
              <span className="mono">{c.label}</span>
              {c.href && c.href !== '#'
                ? <a href={c.href} target="_blank" rel="noreferrer">{c.text} ↗</a>
                : <span>{c.text}</span>}
            </li>
          ))}
        </ul>
        <button className="btn red cc-open" onClick={onOpenContact}>Contact me →</button>
      </div>
    )
  }
  return null
}

export default function Overlay({ mode, world, focus, modal, fade, canEnter, onEnter, onExit, onOpenProject, onCloseModal, contactOpen, onOpenContact, onCloseContact }) {
  const [photo, setPhoto] = useState(null)
  const project = buildingSpots.find((b) => b.id === world)

  return (
    <div className="ui">
      <Loader />
      <div className={`fade ${fade ? 'on' : ''}`} />

      {mode === 'scroll' && <ScrollIntro canEnter={canEnter} onEnter={onEnter} />}

      {mode === 'explore' && (
        <>
          <div className="hud-brand glass">
            <strong>{profile.name}</strong>
            <span>{project ? `${project.category} · inside` : 'The Garden · 庭園'}</span>
          </div>

          <button className="btn ghost hud-exit glass" onClick={onExit}>Exit <kbd>Esc</kbd></button>

          <div className="hud-keys glass">
            <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk</span>
            <span><kbd>Shift</kbd> run</span>
            <span><kbd>Drag</kbd> look around</span>
            <span><kbd>Scroll</kbd> zoom</span>
          </div>

          {!project && !focus && (
            <div className="toast glass">Follow the stone path: my journey comes first, then step into a building to explore a project. Say hi at the end!</div>
          )}
          {project && focus?.type === 'room' && (
            <div className="toast glass">Walk to the glowing screen and click it to open the project. The frames show the tools I used.</div>
          )}

          <FocusCard focus={focus} onPhoto={setPhoto} onOpenProject={onOpenProject} onOpenContact={onOpenContact} />
        </>
      )}

      {photo && <Lightbox photo={photo} onClose={() => setPhoto(null)} />}
      {modal && project && <ProjectModal project={project} onClose={onCloseModal} />}
      {contactOpen && <ContactModal onClose={onCloseContact} />}
    </div>
  )
}
