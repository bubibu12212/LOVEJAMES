import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { profile } from '../data'
import { photoSrc } from '../world'

function Loader() {
  const { progress, active } = useProgress()
  const done = !active && progress >= 100
  return (
    <div className={`loader ${done ? 'is-done' : ''}`}>
      <p className="eyebrow">Membangun kota</p>
      <div className="loader-bar"><span style={{ width: `${progress}%` }} /></div>
      <p className="loader-num">{Math.round(progress)}%</p>
    </div>
  )
}

function Lightbox({ photo, onClose }) {
  useEffect(() => {
    const key = (e) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose() } }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  }, [onClose])
  return (
    <div className="lightbox" onClick={onClose}>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={photoSrc(photo)} alt={photo.caption} />
        <figcaption>{photo.caption}</figcaption>
      </figure>
      <button className="btn ghost lightbox-close" onClick={onClose}>Tutup</button>
    </div>
  )
}

// teks di atas gerbang selama mode scroll (opacity diatur lewat CSS var --p)
export function ScrollIntro() {
  return (
    <div className="gate-intro">
      <p className="eyebrow">Projects</p>
      <h2>Selamat datang di kotaku.</h2>
      <p>Setiap gedung menyimpan satu project atau pengalaman.</p>
      <div className="scroll-hint"><span />Scroll untuk membuka gerbang</div>
    </div>
  )
}

export default function Overlay({ mode, world, active, photo, fade, onExit }) {
  const [zoomed, setZoomed] = useState(null)

  return (
    <div className="ui">
      <Loader />
      <div className={`fade ${fade ? 'on' : ''}`} />

      {mode === 'scroll' && <ScrollIntro />}

      {mode === 'explore' && (
        <>
          <div className="hud-brand glass">
            <strong>{profile.name}</strong>
            <span>{world === 'room' ? 'Galeri Kegiatan' : 'Kota Project'}</span>
          </div>

          <button className="btn ghost hud-exit glass" onClick={onExit}>Keluar <kbd>Esc</kbd></button>

          <div className="hud-keys glass">
            <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> jalan</span>
            <span><kbd>Shift</kbd> lari</span>
            <span><kbd>Drag</kbd> putar kamera</span>
            <span><kbd>Scroll</kbd> zoom</span>
          </div>

          {world === 'city' && !active && (
            <div className="toast glass">Berdiri di lingkaran depan gedung untuk melihat project. Gedung <b>GALERI</b> ada di ujung jalan.</div>
          )}

          {world === 'city' && active?.link && (
            <a className="btn primary open-link" href={active.link} target="_blank" rel="noreferrer">
              Buka {active.title} ↗
            </a>
          )}

          {world === 'room' && photo && (
            <button className="photo-card glass" onClick={() => setZoomed(photo)}>
              <img src={photoSrc(photo)} alt="" />
              <span>
                <b>{photo.caption}</b>
                <small>Klik untuk perbesar</small>
              </span>
            </button>
          )}
        </>
      )}

      {zoomed && <Lightbox photo={zoomed} onClose={() => setZoomed(null)} />}
    </div>
  )
}
