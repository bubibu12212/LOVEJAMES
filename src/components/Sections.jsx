import { Fragment, useEffect, useRef, useState } from 'react'
import { profile } from '../data'
import About3D from './About3D'
import TokyoHero from './TokyoHero'
import { IsoBuilding, TowerArt } from './Illustrations'

const NAV = [
  { id: 'top', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
]

export function Nav() {
  const [current, setCurrent] = useState('top')
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setCurrent(e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' }
    )
    NAV.forEach((n) => { const el = document.getElementById(n.id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])

  return (
    <nav className="nav">
      <a href="#top" className="nav-brand">{profile.short}<span className="dot-red">.</span></a>
      <div className="nav-links">
        {NAV.map((n, i) => (
          <a key={n.id} href={`#${n.id}`} className={current === n.id ? 'on' : ''}>
            <span className="mono">{String(i + 1).padStart(2, '0')}</span> {n.label}
          </a>
        ))}
      </div>
      <span className="nav-status mono"><i /> Available</span>
    </nav>
  )
}

function Eyebrow({ no, en, jp }) {
  return (
    <p className="eyebrow">
      <span className="rule" /> {no && <>{no} — </>}{en} <span className="jp">· {jp}</span>
    </p>
  )
}

export function Hero() {
  const [first, ...rest] = profile.name.toUpperCase().split(' ')
  return (
    <header className="hero" id="top">
      <TokyoHero />
      <div className="hero-shade" aria-hidden />
      <div className="grid-lines" aria-hidden><i /><i /><i /></div>

      <div className="hero-inner">
        <Eyebrow en="Portfolio 2026" jp="ポートフォリオ" />
        <h1 className="display">
          <span className="line"><span>{first} {rest[0]}</span></span>
          <span className="line"><span>{rest.slice(1).join(' ')}</span></span>
        </h1>
        <p className="hero-role">{profile.role}</p>
        <p className="hero-tag">{profile.tagline}</p>
        <div className="hero-actions">
          <a className="btn red" href="#projects">View Projects <span aria-hidden>→</span></a>
          <a className="btn line" href="#contact">Contact Me <span aria-hidden>→</span></a>
        </div>
      </div>
      <p className="page-no mono">01 / 04</p>
      <p className="scroll-note mono">Scroll <span>↓</span></p>
    </header>
  )
}

export function About() {
  return (
    <section className="about" id="about">
      <div className="grid-lines" aria-hidden><i /><i /><i /></div>
      <div className="about-visual">
        <div className="sun" aria-hidden />
        {profile.useAbout3D ? (
          <About3D />
        ) : (
          <div className="portrait">
            {profile.photo ? <img src={profile.photo} alt={profile.name} onError={(e) => { e.currentTarget.style.display = 'none' }} /> : null}
            <span className="portrait-fallback mono">Add your photo at<br />public/photo.jpg</span>
          </div>
        )}
        <p className="caption mono">{profile.name} · 写真</p>
      </div>
      <div className="about-text">
        <Eyebrow no="02" en="About me" jp="私について" />
        <h2 className="display">{profile.aboutTitle}</h2>
        {profile.about.map((p, i) => <p key={i} className="lead">{p}</p>)}
        <dl className="facts">
          {profile.facts.map((f) => (
            <div key={f.label}><dt className="mono">{f.label}</dt><dd>{f.value}</dd></div>
          ))}
        </dl>
        <p className="mono label">Skills · スキル</p>
        <ul className="chips">
          {profile.skills.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </div>
    </section>
  )
}

// tambah class "in" sekali saat elemen mulai terlihat (untuk animasi muncul)
function useReveal(threshold = 0.2) {
  const ref = useRef()
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect() }
    }, { threshold })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [threshold])
  return [ref, shown]
}

function ContactItem({ c, i }) {
  const [copied, setCopied] = useState(false)
  const live = c.href && c.href !== '#'
  const copy = (e) => {
    if (live) return
    e.preventDefault()
    const done = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
    // cadangan untuk browser yang menolak akses clipboard
    const fallback = () => {
      const t = document.createElement('textarea')
      t.value = c.text
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
      done()
    }
    if (navigator.clipboard) navigator.clipboard.writeText(c.text).then(done, fallback)
    else fallback()
  }
  return (
    <li className="rv" style={{ '--d': `${0.45 + i * 0.1}s` }}>
      <a href={live ? c.href : '#contact'} target={live ? '_blank' : undefined} rel="noreferrer" onClick={copy}>
        <span className="mono">{c.label}</span>
        <span className="ci-text">{c.text}</span>
        <span className="ci-act mono">{copied ? 'Copied ✓' : live ? 'Open' : 'Copy'}</span>
        <b>↗</b>
      </a>
    </li>
  )
}

export function Contact() {
  const kinds = ['glass', 'apartment', 'green', 'shop', 'wooden', 'villa', 'glass', 'apartment']
  const [ref, shown] = useReveal(0.15)
  const art = useRef()
  // menara & matahari sedikit mengikuti mouse (paralaks)
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    art.current.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    art.current.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }
  const title = ["Let's", 'work', 'together']
  return (
    <footer className={`contact ${shown ? 'in' : ''}`} id="contact" ref={ref} onMouseMove={onMove}>
      <div className="grid-lines" aria-hidden><i /><i /><i /></div>
      <div className="petals" aria-hidden>{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>
      <div className="contact-main">
        <div>
          <div className="rv" style={{ '--d': '0s' }}><Eyebrow no="04" en="Contact" jp="お問い合わせ" /></div>
          <h2 className="display contact-title">
            {title.map((w, i) => (
              <Fragment key={w}>
                <span className="word"><span style={{ '--d': `${0.08 + i * 0.12}s` }}>{w}</span></span>
                {i === 1 ? <br /> : ' '}
              </Fragment>
            ))}
          </h2>
          <p className="jp-red">
            {[...'一緒に作りましょう'].map((ch, i) => <span key={i} style={{ '--d': `${0.4 + i * 0.05}s` }}>{ch}</span>)}
          </p>
          <ul className="contact-list">
            {profile.contacts.map((c, i) => <ContactItem key={c.label} c={c} i={i} />)}
          </ul>
        </div>
        <div className="tower-wrap" ref={art}>
          <TowerArt />
        </div>
      </div>
      <div className="skyline" aria-hidden>
        {kinds.map((k, i) => (
          <span key={i} className="sky-b" style={{ '--d': `${0.3 + i * 0.07}s` }}>
            <IsoBuilding kind={k} height={70 + (i % 3) * 14} />
          </span>
        ))}
      </div>
      <p className="copy mono">© {new Date().getFullYear()} {profile.name} · Made with three.js</p>
    </footer>
  )
}
