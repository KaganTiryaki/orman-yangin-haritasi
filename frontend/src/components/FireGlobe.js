import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import '../App.css';

function fireColor(frp) {
  // sarı → turuncu → kırmızı → bordo
  if (frp < 20) return '#FFD700';
  if (frp < 40) return '#FFA500';
  if (frp < 70) return '#FF4500';
  if (frp < 120) return '#DC143C';
  return '#8B0000';
}

export default function FireGlobe() {
  const ref = useRef(null);
  const globe = useRef(null);
  const [status, setStatus] = useState('loading');
  const [fireCount, setFireCount] = useState(0);

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
      .atmosphereAltitude(0.15);

    g.camera().position.z = 290;

    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.5;
    g.controls().enableDamping = true;
    g.controls().enableZoom = false;

    const el = ref.current;
    el.addEventListener('mousedown', () => { g.controls().autoRotate = false; });
    el.addEventListener('mouseup', () => { g.controls().autoRotate = true; });

    const resize = () => { g.width(window.innerWidth); g.height(window.innerHeight); };
    window.addEventListener('resize', resize);
    resize();

    globe.current = g;
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/fires')
      .then(r => r.json())
      .then(fires => {
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
        position: 'absolute', top: 20, left: 20, zIndex: 10,
        background: 'rgba(0,0,0,0.7)', padding: '14px 18px',
        borderRadius: 10, backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Worldwide Fire Map
        </div>
        <div style={{ color: '#aaa', fontSize: 13 }}>
          Active fires in the last 24h
        </div>
        {status === 'done' && (
          <div style={{ color: '#FF8C00', fontSize: 22, fontWeight: 700, marginTop: 8 }}>
            {fireCount.toLocaleString()}
            <span style={{ color: '#aaa', fontSize: 12, fontWeight: 400, marginLeft: 6 }}>
              fire points detected
            </span>
          </div>
        )}
      </div>
      {status === 'loading' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', color: '#fff',
          background: 'rgba(0,0,0,0.7)', padding: '16px 24px',
          borderRadius: 10, zIndex: 20
        }}>Loading...</div>
      )}
      {status === 'error' && (
        <div style={{
          position: 'absolute', top: 70, left: '50%',
          transform: 'translateX(-50%)', color: '#f44',
          background: 'rgba(0,0,0,0.7)', padding: '8px 16px',
          borderRadius: 8, zIndex: 20
        }}>Failed to load data</div>
      )}

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%',
        transform: 'translateX(-50%)', zIndex: 10,
        textAlign: 'center', pointerEvents: 'none',
        animation: 'bounce 2s infinite'
      }}>
        <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Scroll down</div>
        <div style={{ color: '#888', fontSize: 20 }}>&#8595;</div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}
