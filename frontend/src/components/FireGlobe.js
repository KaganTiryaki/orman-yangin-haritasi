import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import '../App.css';

/* ─── Fire intensity → classic yellow → orange → red → maroon ─── */
function fireColor(frp) {
  if (frp < 50)  return '#FFD700';  /* yellow */
  if (frp < 150) return '#FF6600';  /* orange */
  if (frp < 300) return '#CC2200';  /* red */
  return '#8B1A1A';                  /* deep maroon */
}

const AQ_COLORS = {
  pm25: '#FF6B6B', pm10: '#FFA07A', o3: '#87CEEB',
  no2: '#DDA0DD', so2: '#F0E68C', co: '#98FB98', bc: '#C0C0C0',
};
function aqColor(name) { return AQ_COLORS[name?.toLowerCase()] || '#aaa'; }

/* ─── Country center from bbox ─── */
function getCountryCenter(feature) {
  const rings = feature.geometry.type === 'MultiPolygon'
    ? feature.geometry.coordinates.flat(2)
    : feature.geometry.coordinates[0];
  const lngs = rings.map(c => c[0]), lats = rings.map(c => c[1]);
  return {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
  };
}

/* ─── Build Google News search URL ─── */
function buildNewsUrl(name, lat, lng) {
  const region = name || (lat != null ? `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)}` : 'wildfire');
  return `https://www.google.com/search?q=${encodeURIComponent(region + ' forest fire wildfire')}&tbm=nws`;
}

/* ─── Filter fires inside country bounding box (verified only) ─── */
function getCountryFires(feature, fires) {
  const rings = feature.geometry.type === 'MultiPolygon'
    ? feature.geometry.coordinates.flat(2)
    : feature.geometry.coordinates[0];
  const lngs = rings.map(c => c[0]), lats = rings.map(c => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return fires
    .filter(f => f[3] === 1 && f[0] >= minLat && f[0] <= maxLat && f[1] >= minLng && f[1] <= maxLng)
    .sort((a, b) => b[2] - a[2])
    .slice(0, 10);
}

/* ─── Holographic Country Panel ─── */
function CountryPanel({ country, fires, onClose }) {
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const [spStatus, setSpStatus] = useState('loading');
  const [species, setSpecies] = useState([]);
  const [aqStatus, setAqStatus] = useState('loading');
  const [aqData, setAqData] = useState(null);
  const isMobile = window.innerWidth <= 600;

  /* Slide-in on mount */
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      if (isMobile) el.style.bottom = '0';
      else el.style.right = '20px';
      el.style.opacity = '1';
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Content fade + data fetch when country changes */
  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.style.opacity = '0';
      content.style.transform = 'translateY(6px)';
    }
    setSpStatus('loading'); setSpecies([]);
    setAqStatus('loading'); setAqData(null);

    const { lat, lng } = country.center;
    fetch(`/api/species?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(d => { setSpecies(Array.isArray(d) ? d : []); setSpStatus('done'); })
      .catch(() => setSpStatus('error'));

    fetch(`/api/airquality?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(d => { setAqData(d); setAqStatus(d ? 'done' : 'empty'); })
      .catch(() => setAqStatus('error'));

    const t = setTimeout(() => {
      if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      }
    }, 140);
    return () => clearTimeout(t);
  }, [country.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    const el = panelRef.current;
    if (!el) { onClose(); return; }
    if (isMobile) el.style.bottom = '-82vh';
    else el.style.right = '-400px';
    el.style.opacity = '0';
    el.addEventListener('transitionend', onClose, { once: true });
  };

  const flagUrl = country.iso && country.iso !== '-99' && country.iso.length === 2
    ? `https://flagcdn.com/32x24/${country.iso}.png`
    : null;
  const distKm = aqData?.location?.distance != null
    ? (aqData.location.distance / 1000).toFixed(1) : null;

  const baseStyle = isMobile ? {
    position: 'fixed', bottom: '-82vh', left: 0, right: 0,
    maxHeight: '82vh', borderRadius: '18px 18px 0 0',
    borderTop: '1px solid rgba(0,255,255,0.2)',
    transition: 'bottom 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.42s ease',
  } : {
    position: 'absolute', top: 16, bottom: 16, right: '-400px',
    width: 360, borderRadius: 16,
    border: '1px solid rgba(0,255,255,0.18)',
    transition: 'right 0.52s cubic-bezier(0.34,1.3,0.64,1), opacity 0.4s ease',
  };

  return (
    <div ref={panelRef} style={{
      ...baseStyle,
      zIndex: 30,
      background: 'rgba(4,10,22,0.82)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      overflowY: 'auto',
      padding: isMobile ? '14px 16px 36px' : '20px 18px',
      boxShadow: '0 0 50px rgba(0,255,255,0.06), 0 8px 40px rgba(0,0,0,0.7)',
      opacity: 0,
    }}>
      {/* Mobile handle */}
      {isMobile && (
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,255,255,0.2)', margin: '0 auto 14px' }} />
      )}

      {/* Header: flag + name + close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          {flagUrl && (
            <img src={flagUrl} alt={country.name}
              style={{ width: 34, height: 24, borderRadius: 3, objectFit: 'cover', flexShrink: 0, boxShadow: '0 1px 6px rgba(0,0,0,0.6)' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#00aaaa', fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
              Country Analysis
            </div>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {country.name}
            </div>
          </div>
        </div>
        <button onClick={handleClose} style={{
          background: 'rgba(0,255,255,0.07)',
          border: '1px solid rgba(0,255,255,0.18)',
          color: '#00bbbb', width: 30, height: 30, borderRadius: '50%',
          cursor: 'pointer', fontSize: 14, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
      </div>

      {/* Fire count bar */}
      <div style={{
        background: fires.length > 0 ? 'rgba(255,69,0,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${fires.length > 0 ? 'rgba(255,100,0,0.22)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10, padding: '10px 14px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 22 }}>🔥</span>
        <div>
          <div style={{ color: fires.length > 0 ? '#FF8C00' : '#555', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
            {fires.length}{fires.length === 10 ? '+' : ''}
          </div>
          <div style={{ color: '#444', fontSize: 10, marginTop: 1 }}>active fire points (24h)</div>
        </div>
      </div>

      {/* Content with fade transition */}
      <div ref={contentRef} style={{
        opacity: 0, transform: 'translateY(6px)',
        transition: 'opacity 0.32s ease, transform 0.32s ease',
      }}>
        {/* Scanning animation while loading */}
        {(spStatus === 'loading' || aqStatus === 'loading') && (
          <div style={{ padding: '4px 0 2px' }}>
            <SpinGlobe text="Loading from Satellite..." />
          </div>
        )}

        {/* Top fire hotspots */}
        {fires.length > 0 && (
          <>
            <CpSection title="Active Fire Hotspots" icon="🌡️" info="FRP (Fire Radiative Power) measures fire intensity in megawatts (MW). Values above 70 MW indicate severe fires that may spread rapidly.">
              {fires.slice(0, 5).map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.02)',
                  borderLeft: `3px solid ${fireColor(f[2])}`,
                  borderRadius: '0 6px 6px 0', padding: '5px 8px', marginBottom: 4,
                }}>
                  <span style={{ color: fireColor(f[2]), fontSize: 11, fontWeight: 700, minWidth: 54 }}>
                    {f[2].toFixed(0)} MW
                  </span>
                  <span style={{ color: '#444', fontSize: 10 }}>
                    {f[0].toFixed(2)}°, {f[1].toFixed(2)}°
                  </span>
                </div>
              ))}
            </CpSection>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,255,255,0.05)', margin: '12px 0' }} />
          </>
        )}

        {/* At-Risk Species */}
        <CpSection title="At-Risk Species" icon="🌿" info="Species recently observed near this region from the GBIF biodiversity database. Wildlife in fire zones face threats from smoke, heat, and habitat destruction.">
          {spStatus === 'loading' && <SpinGlobe text="Searching species..." />}
          {spStatus === 'error' && <CpHint error>Failed to fetch species data</CpHint>}
          {spStatus === 'done' && species.length === 0 && <CpHint>No species data for this region</CpHint>}
          {spStatus === 'done' && species.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {species.map((s, i) => <SpeciesCard key={i} s={s} />)}
            </div>
          )}
        </CpSection>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,255,255,0.05)', margin: '12px 0' }} />

        {/* Air Quality */}
        <CpSection title="Air Quality" icon="💨" info="Real-time air quality from OpenAQ monitoring stations within 50 km. PM2.5 (fine particles) and PM10 are most harmful during wildfires. NO₂ and SO₂ indicate combustion pollution.">
          {aqStatus === 'loading' && <SpinGlobe text="Scanning stations..." />}
          {aqStatus === 'error' && <CpHint error>Failed to fetch air quality data</CpHint>}
          {aqStatus === 'empty' && <CpHint>No station found within 50 km</CpHint>}
          {aqStatus === 'done' && aqData && (
            <>
              <div style={{
                background: 'rgba(0,255,255,0.03)', border: '1px solid rgba(0,255,255,0.08)',
                borderRadius: 8, padding: '8px 10px', marginBottom: 8,
              }}>
                <div style={{ color: '#ccc', fontSize: 12, fontWeight: 600 }}>{aqData.location.name}</div>
                <div style={{ color: '#445', fontSize: 10, marginTop: 1 }}>
                  {[aqData.location.locality, aqData.location.country?.name].filter(Boolean).join(', ')}
                  {distKm && <span style={{ marginLeft: 6 }}>~{distKm} km</span>}
                </div>
              </div>
              {aqData.measurements.length === 0
                ? <CpHint>No recent measurements</CpHint>
                : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {aqData.measurements.map((m, i) => <MeasCard key={i} m={m} />)}
                  </div>
              }
            </>
          )}
        </CpSection>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(0,255,255,0.05)', margin: '12px 0' }} />

        {/* News Verification */}
        <CpSection title="News Verification" icon="📰" info="Search for recent wildfire news coverage for this country via Google News.">
          <a
            href={buildNewsUrl(country.name, country.center.lat, country.center.lng)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'rgba(0,255,255,0.05)',
              border: '1px solid rgba(0,255,255,0.14)',
              borderRadius: 7, padding: '8px 12px',
              color: '#00cccc', fontSize: 11, fontWeight: 600,
              textDecoration: 'none', letterSpacing: 0.3,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,255,255,0.05)'}
          >
            🔍 Search on Google News — {country.name}
          </a>
        </CpSection>

        <div style={{ color: '#162222', fontSize: 9, marginTop: 14, textAlign: 'right' }}>
          NASA FIRMS · OpenAQ · GBIF
        </div>
      </div>
    </div>
  );
}

function CpSection({ title, icon, children, info }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ color: '#008888', fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span>{icon}</span>{title}
        {info && (
          <button
            onClick={e => { e.stopPropagation(); setShowInfo(o => !o); }}
            style={{
              width: 11, height: 11, borderRadius: '50%',
              background: showInfo ? 'rgba(0,255,255,0.18)' : 'rgba(0,255,255,0.07)',
              border: '1px solid rgba(0,255,255,0.3)',
              color: '#00aaaa', fontSize: 7, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, padding: 0, lineHeight: 1, flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >i</button>
        )}
      </div>
      {showInfo && info && (
        <div style={{
          background: 'rgba(0,18,28,0.88)',
          border: '1px solid rgba(0,255,255,0.11)',
          borderRadius: 6, padding: '7px 9px', marginBottom: 8,
          color: '#6a8a9a', fontSize: 9.5, lineHeight: 1.55,
        }}>
          {info}
        </div>
      )}
      {children}
    </div>
  );
}

function CpHint({ children, error }) {
  return <div style={{ color: error ? '#f66' : '#2a3a3a', fontSize: 11, padding: '6px 0' }}>{children}</div>;
}

function SpinGlobe({ text = 'Scanning...' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0, overflow: 'visible' }}>
        {/* Outer sphere */}
        <circle cx="10" cy="10" r="8.5" fill="none" stroke="rgba(0,255,255,0.2)" strokeWidth="1.2" />
        {/* Latitude equator */}
        <ellipse cx="10" cy="10" rx="8.5" ry="3" fill="none" stroke="rgba(0,255,255,0.15)" strokeWidth="0.8" />
        {/* Spinning longitude */}
        <ellipse cx="10" cy="10" rx="4.5" ry="8.5" fill="none" stroke="rgba(0,255,255,0.6)" strokeWidth="1.2"
          style={{ animation: 'globeSpin 2s linear infinite', transformOrigin: '10px 10px' }} />
        {/* Glow dot */}
        <circle cx="10" cy="10" r="1.5" fill="rgba(0,255,255,0.7)"
          style={{ animation: 'globePulse 2s ease-in-out infinite' }} />
      </svg>
      <span style={{ color: '#009999', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' }}>{text}</span>
    </div>
  );
}

/* ─── Badge component ─── */
function Badge({ children, color, bg, border }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg || 'rgba(255,255,255,0.06)',
      border: `1px solid ${border || 'rgba(255,255,255,0.15)'}`,
      borderRadius: 20, padding: '3px 8px',
      color: color || '#aaa', fontSize: 8.5, fontWeight: 700,
      letterSpacing: 0.8, textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );
}

/* ─── Unverified Fire Mini Panel ─── */
function UnverifiedPanel({ point, onClose }) {
  const isMobile = window.innerWidth <= 600;
  const panelStyle = isMobile ? {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '40vh', borderRadius: '18px 18px 0 0',
    borderTop: '1px solid rgba(255,180,0,0.2)',
  } : {
    position: 'absolute', top: 16, right: 0, bottom: 16,
    width: 300, borderLeft: '1px solid rgba(255,180,0,0.12)',
    borderRadius: 0,
  };
  return (
    <div style={{
      ...panelStyle,
      zIndex: 30,
      background: 'rgba(6,6,12,0.94)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      overflowY: 'auto',
      padding: isMobile ? '20px 16px 32px' : '24px 20px',
      boxShadow: isMobile ? '0 -8px 40px rgba(0,0,0,0.7)' : '-8px 0 40px rgba(0,0,0,0.7)',
      animation: 'slideInRight 0.4s cubic-bezier(0.34,1.3,0.64,1) both',
    }}>
      {isMobile && (
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', margin: '0 auto 16px' }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ color: '#886622', fontSize: 8.5, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>
            ⚠ Unverified Thermal Anomaly
          </div>
          {point.country && (
            <div style={{ color: '#bbb', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{point.country}</div>
          )}
          <div style={{ color: '#444', fontSize: 11.5 }}>
            {point.lat.toFixed(3)}°, {point.lng.toFixed(3)}°
          </div>
          <div style={{ color: '#444', fontSize: 11, marginTop: 2 }}>
            FRP: <span style={{ color: '#776633' }}>{point.frp} MW</span>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.06)', border: 'none', color: '#666',
          width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 13, flexShrink: 0,
        }}>✕</button>
      </div>

      <div style={{
        background: 'rgba(255,180,0,0.04)',
        border: '1px solid rgba(255,180,0,0.12)',
        borderRadius: 10, padding: '14px 14px',
      }}>
        <div style={{ color: '#887755', fontSize: 11, lineHeight: 1.75 }}>
          This wildfire isn't verified yet. The heat source may be a low-intensity fire,
          a solitary sensor pixel, or an industrial thermal emission — and has not met
          the minimum intensity threshold for confirmed fire classification.
        </div>
      </div>

      <div style={{ marginTop: 12, color: '#2a2a2a', fontSize: 10, lineHeight: 1.7 }}>
        Verified fires require: confidence = high · FRP ≥ 50 MW · cluster of ≥ 2 adjacent pixels.
      </div>
    </div>
  );
}

/* ─── Fire Point Detail Panel ─── */
function DetailPanel({ point, onClose }) {
  const [aqStatus, setAqStatus] = useState('loading');
  const [aqData, setAqData] = useState(null);
  const [spStatus, setSpStatus] = useState('loading');
  const [species, setSpecies] = useState([]);
  const [newsStatus, setNewsStatus] = useState('idle');
  const [news, setNews] = useState([]);
  const [locData, setLocData] = useState(null);
  const isMobile = window.innerWidth <= 600;

  useEffect(() => {
    setAqStatus('loading'); setAqData(null);
    setSpStatus('loading'); setSpecies([]);
    setNewsStatus('loading'); setNews([]);
    setLocData(null);

    fetch(`/api/airquality?lat=${point.lat}&lng=${point.lng}`)
      .then(r => r.json())
      .then(d => { setAqData(d); setAqStatus(d ? 'done' : 'empty'); })
      .catch(() => setAqStatus('error'));

    fetch(`/api/species?lat=${point.lat}&lng=${point.lng}`)
      .then(r => r.json())
      .then(d => { setSpecies(Array.isArray(d) ? d : []); setSpStatus('done'); })
      .catch(() => setSpStatus('error'));

    /* Location / urban detection */
    fetch(`/api/location?lat=${point.lat}&lng=${point.lng}`)
      .then(r => r.json())
      .then(d => setLocData(d))
      .catch(() => {});

    /* News search */
    const q = encodeURIComponent((point.country || 'wildfire') + ' wildfire fire');
    fetch(`/api/news?q=${q}`)
      .then(r => r.json())
      .then(d => {
        if (d.apiError) {
          setNewsStatus(d.apiError === 'rateLimited' ? 'rateLimit' : 'error');
        } else {
          setNews(d.articles || []);
          setNewsStatus('done');
        }
      })
      .catch(() => setNewsStatus('error'));
  }, [point]);

  const distKm = aqData?.location?.distance != null
    ? (aqData.location.distance / 1000).toFixed(1) : null;

  /* Best available region name for news search */
  const newsRegion =
    locData?.address?.state ||
    locData?.address?.county ||
    locData?.address?.country ||
    point.country ||
    null;

  /* Urban / industrial detection */
  const industrialTypes = ['industrial', 'commercial', 'retail', 'port', 'harbour'];
  const isIndustrial = locData && (
    industrialTypes.includes(locData.type) ||
    locData.address?.industrial || locData.address?.commercial
  );

  const panelStyle = isMobile ? {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '82vh', borderRadius: '18px 18px 0 0',
    borderTop: '1px solid rgba(255,140,0,0.25)',
  } : {
    position: 'absolute', top: 16, right: 0, bottom: 16,
    width: 340, borderLeft: '1px solid rgba(255,140,0,0.15)',
    borderRadius: 0,
  };

  return (
    <div style={{
      ...panelStyle,
      zIndex: 30,
      background: 'rgba(6,6,12,0.94)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      overflowY: 'auto',
      padding: isMobile ? '14px 16px 36px' : '20px 18px',
      boxShadow: isMobile ? '0 -8px 40px rgba(0,0,0,0.7)' : '-8px 0 40px rgba(0,0,0,0.7)',
      animation: 'slideInRight 0.45s cubic-bezier(0.34,1.3,0.64,1) both',
    }}>
      {isMobile && (
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 14px' }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: '#FF0033', fontSize: 8.5, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 3 }}>
            Confirmed Extreme Heat Source
          </div>
          {point.country && (
            <div style={{ color: '#ddd', fontSize: 14, fontWeight: 700, marginBottom: 1 }}>{point.country}</div>
          )}
          <div style={{ color: point.country ? '#555' : '#fff', fontSize: 12, fontWeight: point.country ? 400 : 600 }}>
            {point.lat.toFixed(3)}°, {point.lng.toFixed(3)}°
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

      {/* Badges */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        <Badge color="#00bbbb" bg="rgba(0,187,187,0.1)" border="rgba(0,187,187,0.25)">
          ◉ High Confidence
        </Badge>
        {point.frp > 120 && (
          <Badge color="#ff4422" bg="rgba(255,50,30,0.1)" border="rgba(255,50,30,0.3)">
            🔥 Extreme Intensity
          </Badge>
        )}
        {isIndustrial && (
          <Badge color="#aaa" bg="rgba(150,150,150,0.08)" border="rgba(150,150,150,0.2)">
            ⚠ Industrial Source Possible
          </Badge>
        )}
        {newsStatus === 'done' && news.length > 0 && (
          <Badge color="#66bb6a" bg="rgba(100,187,100,0.1)" border="rgba(100,187,100,0.25)">
            📰 Verified by News
          </Badge>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0 0 16px' }} />

      <Section title="Air Quality" icon="💨" info="Real-time air quality from OpenAQ monitoring stations within 50 km. PM2.5 (fine particles) and PM10 are most harmful near wildfires. NO₂ and SO₂ indicate combustion pollution.">
        {aqStatus === 'loading' && <SpinGlobe text="Searching nearest station..." />}
        {aqStatus === 'error' && <Hint error>Failed to fetch data</Hint>}
        {aqStatus === 'empty' && <Hint>No station found within 50 km</Hint>}
        {aqStatus === 'done' && aqData && (
          <>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
              <div style={{ color: '#ddd', fontSize: 12, fontWeight: 600 }}>{aqData.location.name}</div>
              <div style={{ color: '#666', fontSize: 10, marginTop: 1 }}>
                {[aqData.location.locality, aqData.location.country?.name].filter(Boolean).join(', ')}
                {distKm && <span style={{ marginLeft: 6, color: '#444' }}>~{distKm} km</span>}
              </div>
            </div>
            {aqData.measurements.length === 0
              ? <Hint>No recent measurements</Hint>
              : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {aqData.measurements.map((m, i) => <MeasCard key={i} m={m} />)}
                </div>
            }
          </>
        )}
      </Section>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '16px 0' }} />

      <Section title="At-Risk Species" icon="🌿" info="Species recently observed near this fire point from the GBIF biodiversity database. Wildlife in fire zones face threats from smoke, heat, and habitat loss.">
        {spStatus === 'loading' && <SpinGlobe text="Searching for species..." />}
        {spStatus === 'error' && <Hint error>Failed to fetch data</Hint>}
        {spStatus === 'done' && species.length === 0 && <Hint>No data found for this area</Hint>}
        {spStatus === 'done' && species.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {species.map((s, i) => <SpeciesCard key={i} s={s} />)}
          </div>
        )}
      </Section>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '16px 0' }} />

      <Section title="News Verification" icon="📰" info="Recent news articles about wildfires in this region, sourced from NewsAPI. A 'Verified by News' badge appears when media coverage confirms active fires.">
        {newsStatus === 'loading' && <SpinGlobe text="Scanning news sources..." />}
        {(newsStatus === 'error' || newsStatus === 'rateLimit' || (newsStatus === 'done' && news.length === 0)) && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ color: '#666', fontSize: 10.5, lineHeight: 1.5 }}>
              News verification is currently unavailable. Click the button below for a manual search.
            </div>
            <a
              href={buildNewsUrl(newsRegion, point.lat, point.lng)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                padding: '7px 12px',
                color: '#bbb',
                fontSize: 11,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: 0.3,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              🔍 Search on Google News — {newsRegion || `${point.lat.toFixed(2)}°, ${point.lng.toFixed(2)}°`}
            </a>
          </div>
        )}
        {newsStatus === 'done' && news.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {news.map((article, i) => (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" style={{
                display: 'block', textDecoration: 'none',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: '2px solid rgba(100,187,100,0.45)',
                borderRadius: '0 6px 6px 0', padding: '7px 9px',
              }}>
                <div style={{ color: '#bbb', fontSize: 10.5, fontWeight: 500, lineHeight: 1.4, marginBottom: 3 }}>
                  {(article.title || '').substring(0, 85)}{(article.title || '').length > 85 ? '…' : ''}
                </div>
                <div style={{ color: '#3a3a3a', fontSize: 9 }}>
                  {article.source?.name} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}
                </div>
              </a>
            ))}
          </div>
        )}
      </Section>

      <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,0,51,0.1)', paddingTop: 10 }}>
        <div style={{ color: '#FF0033', fontSize: 8, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 }}>
          ◉ Showing only 100% verified satellite detections
        </div>
        <div style={{ color: '#2a2a2a', fontSize: 9, textAlign: 'right' }}>NASA FIRMS · OpenAQ · GBIF · NewsAPI</div>
      </div>
    </div>
  );
}

function Section({ title, icon, children, info }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div>
      <div style={{ color: '#aaa', fontSize: 11, fontWeight: 600, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span>{title}
        {info && (
          <button
            onClick={e => { e.stopPropagation(); setShowInfo(o => !o); }}
            style={{
              width: 11, height: 11, borderRadius: '50%',
              background: showInfo ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#888', fontSize: 7, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, padding: 0, lineHeight: 1, flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >i</button>
        )}
      </div>
      {showInfo && info && (
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 6, padding: '7px 9px', marginBottom: 10,
          color: '#666', fontSize: 9.5, lineHeight: 1.55,
        }}>
          {info}
        </div>
      )}
      {children}
    </div>
  );
}

function Hint({ children, error }) {
  return <div style={{ color: error ? '#f66' : '#444', fontSize: 12, padding: '8px 0' }}>{children}</div>;
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
        {s.commonName && (
          <div style={{ color: '#e8e8c8', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>
            {s.commonName}
          </div>
        )}
        <div style={{ color: s.commonName ? '#5a7a5a' : '#d0e8d0', fontSize: s.commonName ? 9.5 : 11, fontStyle: 'italic', fontWeight: s.commonName ? 400 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.name}
        </div>
        {!s.commonName && s.kingdom && (
          <div style={{ color: '#555', fontSize: 9, marginTop: 1 }}>{s.kingdom}</div>
        )}
        {s.family && <div style={{ color: '#3a3a3a', fontSize: 9, marginTop: 1 }}>{s.family}</div>}
      </div>
    </div>
  );
}

/* ─── Point-in-polygon (ray casting) ─── */
function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function findCountryAtPoint(lat, lng, features) {
  for (const f of features) {
    const geom = f.geometry;
    if (geom.type === 'Polygon') {
      if (pointInRing(lng, lat, geom.coordinates[0])) return f;
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates)
        if (pointInRing(lng, lat, poly[0])) return f;
    }
  }
  return null;
}

/* ─── Altitude that fits country in view ─── */
function getCountryAltitude(feature) {
  const rings = feature.geometry.type === 'MultiPolygon'
    ? feature.geometry.coordinates.flat(2)
    : feature.geometry.coordinates[0];
  const lngs = rings.map(c => c[0]), lats = rings.map(c => c[1]);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  /* Use separate lat/lng spans — very wide countries (Russia) shouldn't zoom too far */
  const span = Math.max(latSpan * 1.4, lngSpan * 0.6);
  return Math.min(Math.max(span / 38, 1.0), 2.4);
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

/* ─── Fire Intensity Legend ─── */
function FireLegend() {
  const isMobile = window.innerWidth <= 600;
  const tiers = [
    { color: '#2a1510', range: 'Unverified',  label: 'Low conf / solitary', dim: true },
    { color: '#FF6600', range: '50–150 MW',   label: 'Severe' },
    { color: '#CC2200', range: '150–300 MW',  label: 'Extreme' },
    { color: '#8B1A1A', range: '> 300 MW',    label: 'Critical' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: isMobile ? 10 : 20, left: isMobile ? 8 : 20, zIndex: 10,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: isMobile ? 8 : 10, padding: isMobile ? '7px 10px' : '10px 13px',
    }}>
      <div style={{ color: '#FF8C00', fontSize: isMobile ? 7 : 8, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 2, fontWeight: 700 }}>
        Active Fire Hotspots
      </div>
      {!isMobile && <div style={{ color: '#444', fontSize: 7.5, marginBottom: 8 }}>High Confidence · FRP ≥ 50 MW · Verified</div>}
      {isMobile && <div style={{ color: '#444', fontSize: 6.5, marginBottom: 5 }}>Verified · FRP ≥ 50 MW</div>}
      {tiers.map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 5 : 8, marginBottom: i < 4 ? (isMobile ? 3 : 5) : 0 }}>
          <div style={{
            width: isMobile ? 7 : 9, height: isMobile ? 7 : 9, borderRadius: '50%', flexShrink: 0,
            background: t.color,
            boxShadow: t.dim ? 'none' : `0 0 5px ${t.color}88`,
            border: t.dim ? '1px solid #443322' : 'none',
          }} />
          <span style={{ color: '#777', fontSize: isMobile ? 8 : 9.5, minWidth: isMobile ? 46 : 58 }}>{t.range}</span>
          {!isMobile && <span style={{ color: '#3a3a3a', fontSize: 8.5 }}>{t.label}</span>}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Globe Component ─── */
export default function FireGlobe() {
  const ref = useRef(null);
  const globe = useRef(null);
  const firesRef = useRef([]);
  const hoveredPolygonRef = useRef(null);
  const countriesRef = useRef([]);
  const defaultPovRef = useRef({ lat: 20, lng: 10, altitude: 2.5 });
  const [status, setStatus] = useState('loading');
  const [fireCount, setFireCount] = useState(0);
  const [clickedPoint, setClickedPoint] = useState(null);
  const [clickedCountry, setClickedCountry] = useState(null);
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const isMobile = window.innerWidth <= 600;

  useEffect(() => {
    const g = Globe()(ref.current);
    g.globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .pointsData([])
      .pointLat(d => d[0])
      .pointLng(d => d[1])
      .pointColor(d => d[3] === 1 ? fireColor(d[2]) : '#2a1510')
      .pointRadius(d => d[3] === 1 ? Math.min(0.15 + d[2] / 250, 0.55) : 0.07)
      .pointAltitude(0)
      .pointsMerge(true)
      .pointResolution(4)
      .atmosphereColor('#1a5276')
      .atmosphereAltitude(0.15)
      .onGlobeClick(({ lat, lng }) => {
        /* Find nearest fire point */
        const fires = firesRef.current;
        if (fires.length) {
          let best = null, bestDist = Infinity;
          for (const f of fires) {
            const d = haversine(lat, lng, f[0], f[1]);
            if (d < bestDist) { bestDist = d; best = f; }
          }
          const searchRadius = Math.max(80, g.pointOfView().altitude * 600);
          if (best && bestDist <= searchRadius) {
            const countryFeature = findCountryAtPoint(best[0], best[1], countriesRef.current);
            const countryName = countryFeature?.properties?.ADMIN || countryFeature?.properties?.name || null;
            setClickedCountry(null);
            setClickedPoint({ lat: best[0], lng: best[1], frp: best[2], country: countryName, verified: best[3] === 1 });
            g.pointOfView({ lat: best[0], lng: best[1], altitude: g.pointOfView().altitude }, 800);
            g.controls().autoRotate = false;
            return;
          }
        }
        /* No nearby fire — show country panel */
        const country = findCountryAtPoint(lat, lng, countriesRef.current);
        if (country) {
          const center = getCountryCenter(country);
          const name   = country.properties.ADMIN || country.properties.name || '—';
          const iso    = (country.properties.ISO_A2 || '').toLowerCase();
          const alt    = getCountryAltitude(country);
          setClickedPoint(null);
          setClickedCountry({ feature: country, name, iso, center });
          g.pointOfView({ lat: center.lat, lng: center.lng, altitude: alt }, 1000);
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
    el.addEventListener('mouseup',   () => { g.controls().autoRotate = true; });
    el.addEventListener('touchstart', () => { g.controls().autoRotate = false; }, { passive: true });
    el.addEventListener('touchend',   () => { g.controls().autoRotate = true;  }, { passive: true });

    const onKeyDown = (e) => { if (e.key === 'Control') { g.controls().enableZoom = true;  setCtrlHeld(true);  } };
    const onKeyUp   = (e) => { if (e.key === 'Control') { g.controls().enableZoom = false; setCtrlHeld(false); } };
    const onBlur    = ()  => { g.controls().enableZoom = false; setCtrlHeld(false); };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    window.addEventListener('blur', onBlur);
    el.addEventListener('wheel', (e) => { if (!e.ctrlKey) e.stopPropagation(); }, { capture: true, passive: true });

    /* ── Country borders (globe.gl polygon API = Three.js Raycaster internally) ── */
    fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson')
      .then(r => r.json())
      .then(geo => {
        countriesRef.current = geo.features;

        const makeCapColor = d => d === hoveredPolygonRef.current ? 'rgba(0,255,255,0.1)' : 'rgba(0,0,0,0)';
        const makeStroke   = d => d === hoveredPolygonRef.current ? '#00ffff' : 'rgba(255,255,255,0.22)';
        const makeAlt      = d => d === hoveredPolygonRef.current ? 0.015 : 0.005;

        g.polygonsData(geo.features)
          .polygonCapColor(makeCapColor)
          .polygonSideColor(() => 'rgba(0,0,0,0)')
          .polygonStrokeColor(makeStroke)
          .polygonAltitude(makeAlt)
          .polygonsTransitionDuration(260)
          .onPolygonHover(polygon => {
            hoveredPolygonRef.current = polygon || null;
            g.polygonCapColor(makeCapColor);
            g.polygonStrokeColor(makeStroke);
            g.polygonAltitude(makeAlt);
          })
          .onPolygonClick((polygon, ev, { lat, lng }) => {
            /* Check for nearby fire first */
            const fires = firesRef.current;
            if (fires.length) {
              let best = null, bestDist = Infinity;
              for (const f of fires) {
                const d = haversine(lat, lng, f[0], f[1]);
                if (d < bestDist) { bestDist = d; best = f; }
              }
              const searchRadius = Math.max(80, g.pointOfView().altitude * 600);
              if (best && bestDist <= searchRadius) {
                const countryFeature = findCountryAtPoint(best[0], best[1], countriesRef.current);
                const countryName = countryFeature?.properties?.ADMIN || countryFeature?.properties?.name || null;
                setClickedCountry(null);
                setClickedPoint({ lat: best[0], lng: best[1], frp: best[2], country: countryName, verified: best[3] === 1 });
                g.pointOfView({ lat: best[0], lng: best[1], altitude: g.pointOfView().altitude }, 800);
                g.controls().autoRotate = false;
                return;
              }
            }
            const center = getCountryCenter(polygon);
            const name   = polygon.properties.ADMIN || polygon.properties.name || '—';
            const iso    = (polygon.properties.ISO_A2 || '').toLowerCase();
            const alt    = getCountryAltitude(polygon);
            setClickedPoint(null);
            setClickedCountry({ feature: polygon, name, iso, center });
            g.pointOfView({ lat: center.lat, lng: center.lng, altitude: alt }, 1000);
            g.controls().autoRotate = false;
          });
      })
      .catch(() => { /* GeoJSON fetch failed — borders just won't show */ });

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
    fetch('/api/fires')
      .then(r => r.json())
      .then(({ verified = [], unverified = [] }) => {
        // Tag each point: verified=1, unverified=0
        const allFires = [
          ...verified.map(f => [f[0], f[1], f[2], 1]),
          ...unverified.map(f => [f[0], f[1], f[2], 0]),
        ];
        firesRef.current = allFires;
        if (globe.current) {
          globe.current.pointsData(allFires);
          /* Radar ping — verified only */
          globe.current
            .ringsData(verified)
            .ringLat(d => d[0])
            .ringLng(d => d[1])
            .ringColor(() => t => `rgba(255,120,0,${Math.pow(1 - t, 1.4) * 0.7})`)
            .ringMaxRadius(d => Math.min(2.2 + d[2] / 90, 5))
            .ringPropagationSpeed(d => 1.6 + d[2] / 300)
            .ringRepeatPeriod(d => Math.max(1800 - d[2] * 4, 650));
        }
        setFireCount(verified.length);
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  }, []);

  const hasPanel = clickedPoint || clickedCountry;

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div ref={ref} style={{ width: '100%', height: '100%' }} />

      {/* Info panel top-left */}
      <div style={{
        position: 'absolute', top: isMobile ? 50 : 20, left: isMobile ? 10 : 20, zIndex: 10,
        background: 'rgba(0,0,0,0.7)', padding: isMobile ? '8px 12px' : '14px 18px',
        borderRadius: 10, backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.08)',
        maxWidth: isMobile ? 'calc(100% - 20px)' : hasPanel ? 'calc(100% - 380px)' : undefined,
      }}>
        <div style={{ color: '#fff', fontSize: isMobile ? 14 : 18, fontWeight: 700, marginBottom: 3 }}>
          Worldwide Fire Map
        </div>
        <div style={{ color: '#aaa', fontSize: isMobile ? 10 : 13 }}>Active fires in the last 24h</div>
        {status === 'done' && (
          <div style={{ color: '#FF8C00', fontSize: isMobile ? 16 : 22, fontWeight: 700, marginTop: isMobile ? 4 : 6 }}>
            {fireCount.toLocaleString()}
            <span style={{ color: '#aaa', fontSize: isMobile ? 9 : 12, fontWeight: 400, marginLeft: 5 }}>extreme heat sources</span>
          </div>
        )}
        {status === 'done' && !isMobile && (
          <div style={{ color: '#555', fontSize: 10, marginTop: 5 }}>Click a fire point or country</div>
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
            <span style={{ color: ctrlHeld ? '#FF8C00' : '#555', fontSize: 9, transition: 'color 0.2s' }}>to zoom</span>
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

      <FireLegend />

      {!hasPanel && !isMobile && (
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

      {clickedPoint && !clickedPoint.verified && (
        <UnverifiedPanel
          point={clickedPoint}
          onClose={() => setClickedPoint(null)}
        />
      )}

      {clickedPoint && clickedPoint.verified && (
        <DetailPanel
          point={clickedPoint}
          onClose={() => {
            setClickedPoint(null);
            if (globe.current) {
              globe.current.controls().autoRotate = true;
              globe.current.pointOfView(defaultPovRef.current, 1200);
            }
          }}
        />
      )}

      {clickedCountry && (
        <CountryPanel
          country={clickedCountry}
          fires={getCountryFires(clickedCountry.feature, firesRef.current)}
          onClose={() => {
            setClickedCountry(null);
            if (globe.current) {
              globe.current.controls().autoRotate = true;
              globe.current.pointOfView(defaultPovRef.current, 1200);
            }
          }}
        />
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes scan {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 0.15; }
        }
        @keyframes globeSpin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        @keyframes globePulse {
          0%, 100% { opacity: 0.5; r: 1.5px; }
          50%       { opacity: 1;   r: 2.2px; }
        }
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
