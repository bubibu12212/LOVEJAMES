import { profile } from '../data'
import About3D from './About3D'

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

export function Hero() {
  return (
    <header className="hero" id="top">
      <div className="hero-grid" aria-hidden />
      <div className="hero-inner">
        <p className="eyebrow">Portfolio</p>
        <h1>{profile.name}</h1>
        <p className="hero-role">{profile.role}</p>
        <p className="hero-tag">{profile.tagline}</p>
        <div className="hero-actions">
          <a className="btn primary" href="#projects">Jelajahi Kota Project</a>
          <a className="btn ghost" href="#about">Tentang Aku</a>
        </div>
      </div>
      <a className="scroll-cue" href="#about" aria-label="Scroll ke bawah"><span /></a>
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
