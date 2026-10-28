import { useEffect, useState } from 'react'
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

export function Contact() {
  const kinds = ['glass', 'apartment', 'green', 'shop', 'wooden', 'villa', 'glass', 'apartment']
  return (
    <footer className="contact" id="contact">
      <div className="grid-lines" aria-hidden><i /><i /><i /></div>
      <div className="contact-main">
        <div>
          <Eyebrow no="04" en="Contact" jp="お問い合わせ" />
          <h2 className="display">Let&apos;s work<br />together</h2>
          <p className="jp-red">一緒に作りましょう</p>
          <ul className="contact-list">
            {profile.contacts.map((c) => (
              <li key={c.label}>
                <span className="mono">{c.label}</span>
                {c.href && c.href !== '#'
                  ? <a href={c.href} target="_blank" rel="noreferrer">{c.text}<b>↗</b></a>
                  : <span>{c.text}<b>↗</b></span>}
              </li>
            ))}
          </ul>
        </div>
        <TowerArt />
      </div>
      <div className="skyline" aria-hidden>
        {kinds.map((k, i) => <IsoBuilding key={i} kind={k} height={70 + (i % 3) * 14} />)}
      </div>
      <p className="copy mono">© {new Date().getFullYear()} {profile.name} · Made with three.js</p>
    </footer>
  )
}
