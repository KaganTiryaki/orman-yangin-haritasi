import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import '../App.css';

function fireColor(frp) {
  if (frp < 20) return '#FFD700';
  if (frp < 40) return '#FFA500';
  if (frp < 70) return '#FF4500';
  if (frp < 120) return '#DC143C';
  return '#8B0000';
}

const AQ_COLORS = {
  pm25: '#FF6B6B', pm10: '#FFA07A', o3: '#87CEEB',
  no2: '#DDA0DD', so2: '#F0E68C', co: '#98FB98', bc: '#C0C0C0',
};
function aqColor(name) { return AQ_COLORS[name?.toLowerCase()] || '#aaa'; }

/* ─── Sidebar / Bottom-sheet panel ─── */
function DetailPanel({ point, onClose }) {
  const [aqStatus, setAqStatus] = useState('loading');
  const [aqData, setAqData] = useState(null);
  const [spStatus, setSpStatus] = useState('loading');
  const [species, setSpecies] = useState([]);
  const isMobile = window.innerWidth <= 600;

  useEffect(() => {
    setAqStatus('loading'); setAqData(null);
    setSpStatus('loading'); setSpecies([]);

    fetch(`http://localhost:5000/api/airquality?lat=${point.lat}&lng=${point.lng}`)
      .then(r => r.json())
      .then(d => { setAqData(d); setAqStatus(d ? 'done' : 'empty'); })
      .catch(() => setAqStatus('error'));

    fetch(`http://localhost:5000/api/species?lat=${point.lat}&lng=${point.lng}`)
      .then(r => r.json())
      .then(d => { setSpecies(Array.isArray(d) ? d : []); setSpStatus('done'); })
      .catch(() => setSpStatus('error'));
  }, [point]);

  const distKm = aqData?.location?.distance != null
    ? (aqData.location.distance / 1000).toFixed(1) : null;

  const panelStyle = isMobile ? {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '65vh', borderRadius: '18px 18px 0 0',
    borderTop: '1px solid rgba(255,140,0,0.25)',
  } : {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: 320, borderLeft: '1px solid rgba(255,140,0,0.2)',
    borderRadius: 0,
  };

  return (
    <div style={{
      ...panelStyle,
      zIndex: 30,
      background: 'rgba(8,8,8,0.93)',
      backdropFilter: 'blur(18px)',
      overflowY: 'auto',
      padding: isMobile ? '14px 16px 36px' : '20px 18px',
      boxShadow: isMobile ? '0 -8px 40px rgba(0,0,0,0.7)' : '-8px 0 40px rgba(0,0,0,0.7)',
    }}>
      {/* Handle (mobile only) */}
      {isMobile && (
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 14px' }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ color: '#FF8C00', fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 }}>
            Fire Point
          </div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
            {point.lat.toFixed(3)}, {point.lng.toFixed(3)}
          </div>
          <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
            Intensity: <span style={{ color: fireColor(point.frp) }}>{point.frp} MW</span>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.07)', border: 'none', color: '#888',
          width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
          fontSize: 13, flexShrink: 0,
        }}>✕</button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0 0 16px' }} />

      {/* ── Hava Kalitesi ── */}
      <Section title="Air Quality" icon="💨">
        {aqStatus === 'loading' && <Hint>Searching nearest station…</Hint>}
        {aqStatus === 'error' && <Hint error>Failed to fetch data</Hint>}
        {aqStatus === 'empty' && <Hint>No station found within 25 km</Hint>}
        {aqStatus === 'done' && aqData && (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 8,
              padding: '8px 10px', marginBottom: 10,
            }}>
              <div style={{ color: '#ddd', fontSize: 12, fontWeight: 600 }}>
                {aqData.location.name}
              </div>
              <div style={{ color: '#666', fontSize: 10, marginTop: 1 }}>
                {[aqData.location.locality, aqData.location.country?.name].filter(Boolean).join(', ')}
                {distKm && <span style={{ marginLeft: 6, color: '#444' }}>~{distKm} km</span>}
              </div>
            </div>
            {aqData.measurements.length === 0
              ? <Hint>No recent measurements</Hint>
              : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {aqData.measurements.map((m, i) => (
                    <MeasCard key={i} m={m} />
                  ))}
                </div>
            }
          </>
        )}
      </Section>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '16px 0' }} />

      {/* ── At-Risk Species ── */}
      <Section title="At-Risk Species" icon="🌿">
        {spStatus === 'loading' && <Hint>Searching for species…</Hint>}
        {spStatus === 'error' && <Hint error>Failed to fetch data</Hint>}
        {spStatus === 'done' && species.length === 0 && (
          <Hint>No data found for this area</Hint>
        )}
        {spStatus === 'done' && species.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {species.map((s, i) => <SpeciesCard key={i} s={s} />)}
          </div>
        )}
      </Section>

      <div style={{ color: '#2a2a2a', fontSize: 10, marginTop: 16, textAlign: 'right' }}>
        OpenAQ · GBIF
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <div style={{ color: '#aaa', fontSize: 11, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span>{title}
      </div>
      {children}
    </div>
  );
}

function Hint({ children, error }) {
  return (
    <div style={{ color: error ? '#f66' : '#444', fontSize: 12, padding: '8px 0' }}>
      {children}
    </div>
  );
}

function MeasCard({ m }) {
  const color = aqColor(m.parameter?.name);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}22`,
      borderTop: `2px solid ${color}`,
      borderRadius: 8, padding: '8px 8px 6px',
    }}>
      <div style={{ color, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        {m.parameter?.displayName || m.parameter?.name || `Sensor ${m.sensorsId}`}
      </div>
      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>
        {m.value != null ? m.value.toFixed(1) : '–'}
      </div>
      <div style={{ color: '#444', fontSize: 9, marginTop: 2 }}>{m.parameter?.units}</div>
    </div>
  );
}

function SpeciesCard({ s }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8, padding: '8px 10px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {s.imageUrl
        ? <img src={s.imageUrl} alt={s.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
        : <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌱</div>
      }
      <div style={{ minWidth: 0 }}>
        <div style={{ color: '#d0e8d0', fontSize: 11, fontStyle: 'italic', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.name}
        </div>
        {s.commonName && (
          <div style={{ color: '#666', fontSize: 10, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.commonName}
          </div>
        )}
        {s.family && (
          <div style={{ color: '#3a3a3a', fontSize: 9, marginTop: 1 }}>{s.family}</div>
        )}
      </div>
    </div>
  );
}

/* ─── Haversine distance in km ─── */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Main Globe Component ─── */
export default function FireGlobe() {
  const ref = useRef(null);
  const globe = useRef(null);
  const firesRef = useRef([]);
  const [status, setStatus] = useState('loading');
  const [fireCount, setFireCount] = useState(0);
  const [clickedPoint, setClickedPoint] = useState(null);
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const isMobile = window.innerWidth <= 600;

  useEffect(() => {
    const g = Globe()(ref.current);
    g.globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .pointsData([])
      .pointLat(d => d[0])
      .pointLng(d => d[1])
      .pointColor(d => fireColor(d[2]))
      .pointRadius(d => Math.min(0.15 + d[2] / 200, 0.5))
      .pointAltitude(0)
      .pointsMerge(true)
      .pointResolution(3)
      .atmosphereColor('#1a5276')
      .atmosphereAltitude(0.15)
      .onGlobeClick(({ lat, lng }) => {
        const fires = firesRef.current;
        if (!fires.length) return;
        // Find the nearest fire point (max 50 km)
        let best = null, bestDist = Infinity;
        for (const f of fires) {
          const d = haversine(lat, lng, f[0], f[1]);
          if (d < bestDist) { bestDist = d; best = f; }
        }
        if (best && bestDist <= 50) {
          setClickedPoint({ lat: best[0], lng: best[1], frp: best[2] });
          g.controls().autoRotate = false;
        }
      });

    g.camera().position.z = 290;
    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.5;
    g.controls().enableDamping = true;
    g.controls().enableZoom = false;

    const el = ref.current;
    el.addEventListener('mousedown', () => { g.controls().autoRotate = false; });
    el.addEventListener('mouseup', () => { g.controls().autoRotate = true; });
    el.addEventListener('touchstart', () => { g.controls().autoRotate = false; }, { passive: true });
    el.addEventListener('touchend', () => { g.controls().autoRotate = true; }, { passive: true });

    // Ctrl key → enable zoom; release → disable zoom + allow page scroll
    const onKeyDown = (e) => {
      if (e.key === 'Control') {
        g.controls().enableZoom = true;
        setCtrlHeld(true);
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'Control') {
        g.controls().enableZoom = false;
        setCtrlHeld(false);
      }
    };
    // Safety: if window loses focus while Ctrl is held
    const onBlur = () => {
      g.controls().enableZoom = false;
      setCtrlHeld(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Prevent OrbitControls from consuming wheel events unless Ctrl is held
    el.addEventListener('wheel', (e) => {
      if (!e.ctrlKey) e.stopPropagation();
    }, { capture: true, passive: true });

    const resize = () => { g.width(window.innerWidth); g.height(window.innerHeight); };
    window.addEventListener('resize', resize);
    resize();

    globe.current = g;
    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/fires')
      .then(r => r.json())
      .then(fires => {
        firesRef.current = fires;
        if (globe.current) globe.current.pointsData(fires);
        setFireCount(fires.length);
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />

      {/* Info Panel */}
      <div style={{
        position: 'absolute', top: isMobile ? 12 : 20, left: isMobile ? 12 : 20, zIndex: 10,
        background: 'rgba(0,0,0,0.7)', padding: isMobile ? '10px 14px' : '14px 18px',
        borderRadius: 10, backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        maxWidth: clickedPoint && !isMobile ? 'calc(100% - 360px)' : undefined,
      }}>
        <div style={{ color: '#fff', fontSize: isMobile ? 15 : 18, fontWeight: 700, marginBottom: 4 }}>
          Worldwide Fire Map
        </div>
        <div style={{ color: '#aaa', fontSize: isMobile ? 11 : 13 }}>
          Active fires in the last 24h
        </div>
        {status === 'done' && (
          <div style={{ color: '#FF8C00', fontSize: isMobile ? 18 : 22, fontWeight: 700, marginTop: 6 }}>
            {fireCount.toLocaleString()}
            <span style={{ color: '#aaa', fontSize: isMobile ? 10 : 12, fontWeight: 400, marginLeft: 5 }}>
              fire points detected
            </span>
          </div>
        )}
        {status === 'done' && (
          <div style={{ color: '#555', fontSize: 10, marginTop: 5 }}>
            Click on a fire point
          </div>
        )}
        {!isMobile && (
          <div style={{
            marginTop: 8,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: ctrlHeld ? 'rgba(255,140,0,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${ctrlHeld ? 'rgba(255,140,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 6, padding: '3px 8px',
            transition: 'background 0.2s, border-color 0.2s',
          }}>
            <kbd style={{
              background: ctrlHeld ? 'rgba(255,140,0,0.25)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${ctrlHeld ? 'rgba(255,140,0,0.5)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 3, padding: '1px 5px',
              fontSize: 9, color: ctrlHeld ? '#FF8C00' : '#888',
              fontFamily: 'monospace', fontStyle: 'normal',
              transition: 'all 0.2s',
            }}>Ctrl</kbd>
            <span style={{ color: ctrlHeld ? '#FF8C00' : '#555', fontSize: 9, transition: 'color 0.2s' }}>
              to zoom
            </span>
          </div>
        )}
      </div>

      {status === 'loading' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', color: '#fff',
          background: 'rgba(0,0,0,0.7)', padding: '16px 24px',
          borderRadius: 10, zIndex: 20,
        }}>Loading...</div>
      )}
      {status === 'error' && (
        <div style={{
          position: 'absolute', top: 70, left: '50%',
          transform: 'translateX(-50%)', color: '#f44',
          background: 'rgba(0,0,0,0.7)', padding: '8px 16px',
          borderRadius: 8, zIndex: 20,
        }}>Failed to load data</div>
      )}

      {!clickedPoint && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%',
          transform: 'translateX(-50%)', zIndex: 10,
          textAlign: 'center', pointerEvents: 'none',
          animation: 'bounce 2s infinite',
        }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Scroll down</div>
          <div style={{ color: '#888', fontSize: 20 }}>↓</div>
        </div>
      )}

      {clickedPoint && (
        <DetailPanel
          point={clickedPoint}
          onClose={() => {
            setClickedPoint(null);
            if (globe.current) globe.current.controls().autoRotate = true;
          }}
        />
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}
