const panel = {
  position: 'fixed', pointerEvents: 'none', color: '#3b2210',
  fontFamily: 'system-ui, sans-serif',
}

export default function Overlay({ stage, setStage, active }) {
  if (stage === 'intro') {
    return (
      <>
        <div style={{ ...panel, top: 36, left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 18, letterSpacing: 2 }}>WELCOME TO MY PORTFOLIO</p>
          <h1 style={{ margin: '6px 0', fontSize: 'clamp(28px, 5vw, 52px)' }}>
            Hi, I'm Salsa Ica Indriani
          </h1>
        </div>
        <div style={{ position: 'fixed', bottom: 48, left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ margin: '0 0 12px', color: '#3b2210' }}>
            Buka gerbang untuk mulai menjelajah dunia 3D-ku
          </p>
          <button
            onClick={() => setStage('opening')}
            style={{
              padding: '14px 32px', fontSize: 18, border: 0, borderRadius: 999,
              background: '#6b3a1e', color: 'white', cursor: 'pointer',
            }}
          >
            Buka Gerbang
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {stage === 'explore' && (
        <div style={{ ...panel, bottom: 24, left: 24, background: '#fffc', padding: '10px 16px', borderRadius: 12 }}>
          Jalan: <b>W A S D</b> atau tombol panah
        </div>
      )}
      {active && (
        <div
          style={{
            ...panel, top: 24, right: 24, width: 320, background: '#fffe',
            padding: 20, borderRadius: 16, boxShadow: '0 8px 30px #0003',
          }}
        >
          <small style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            {active.type === 'project' ? 'Project' : 'Pengalaman Kerja'}
          </small>
          <h2 style={{ margin: '4px 0 8px' }}>{active.title}</h2>
          <p style={{ margin: 0 }}>{active.desc}</p>
          {active.tech.length > 0 && (
            <p style={{ margin: '10px 0 0', fontSize: 14 }}>
              <b>Tech:</b> {active.tech.join(', ')}
            </p>
          )}
        </div>
      )}
    </>
  )
}