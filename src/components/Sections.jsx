import { useEffect, useState } from 'react'
import { profile, stations, gallery } from '../data'
import About3D from './About3D'
import HeroCity from './HeroCity'

const links = profile.contacts.filter((c) => c.href && c.href !== '#')

export function Nav() {
  return (
    <nav className="nav">
      <a href="#top" className="nav-brand">{profile.name}</a>
      <div className="nav-links">
        <a href="#about">About</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>
  )
}

const ROLES = ['Developer', 'Creative Technologist', '3D Web Builder', 'Problem Solver']

function RoleRotator() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % ROLES.length), 2400)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="role-rotator">
      <span key={i}>{ROLES[i]}</span>
    </span>
  )
}

export function Hero() {
  const projects = stations.filter((s) => s.type === 'project').length
  const exp = stations.filter((s) => s.type === 'experience').length
  const [first, ...rest] = profile.name.split(' ')

  return (
    <header className="hero" id="top">
      <HeroCity />
      <div className="hero-shade" aria-hidden />
      <div className="hud-frame" aria-hidden><i /><i /><i /><i /></div>
      <div className="hero-meta mono" aria-hidden>
        <span>SECTOR 01 · HOME</span>
        <span className="hide-sm">NEO-CITY / {new Date().getFullYear()}</span>
      </div>

      <div className="hero-inner">
        <p className="status-pill"><span className="dot" /> Open for collaboration</p>
        <h1>
          <span className="line"><span>{first}</span></span>
          <span className="line"><span className="grad">{rest.join(' ')}</span></span>
        </h1>
        <p className="hero-role">
          <span className="mono">&gt;</span> <RoleRotator />
        </p>
        <p className="hero-tag">{profile.tagline}</p>
        <div className="hero-actions">
          <a className="btn primary" href="#projects">Jelajahi Kota Project <span aria-hidden>→</span></a>
          <a className="btn ghost glass" href="#about">Tentang Aku</a>
        </div>
      </div>

      <div className="hero-bottom">
        <dl className="stats">
          <div><dt>{String(projects).padStart(2, '0')}</dt><dd>Project</dd></div>
          <div><dt>{String(exp).padStart(2, '0')}</dt><dd>Pengalaman</dd></div>
          <div><dt>{String(gallery.length).padStart(2, '0')}</dt><dd>Momen</dd></div>
        </dl>
        <div className="marquee" aria-hidden>
          <div>
            {[...profile.skills, ...profile.skills, ...profile.skills, ...profile.skills].map((s, i) => <span key={i}>{s}</span>)}
          </div>
        </div>
      </div>
    </header>
  )
}

export function About() {
  return (
    <section className="about" id="about">
      <div className="about-text">
        <p className="eyebrow">About me</p>
        <h2>Halo, aku {profile.name.split(' ')[0]}.</h2>
        {profile.about.map((p, i) => <p key={i}>{p}</p>)}
        <ul className="skills">
          {profile.skills.map((s) => <li key={s}>{s}</li>)}
        </ul>
      </div>
      <div className="about-visual">
        <About3D />
      </div>
    </section>
  )
}

export function Contact() {
  return (
    <footer className="contact" id="contact">
      <p className="eyebrow">Contact</p>
      <h2>Ayo bekerja sama.</h2>
      <p className="contact-sub">Punya ide, project, atau kesempatan kerja? Hubungi aku lewat:</p>
      <div className="contact-links">
        {links.length > 0
          ? links.map((c) => <a key={c.label} className="btn ghost" href={c.href} target="_blank" rel="noreferrer">{c.label}</a>)
          : <span className="muted">Isi link kontak di src/data.js</span>}
      </div>
      <p className="copy">© {new Date().getFullYear()} {profile.name}</p>
    </footer>
  )
}
