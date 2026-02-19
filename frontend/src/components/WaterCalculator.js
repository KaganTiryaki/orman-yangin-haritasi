import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// ─── Constants ───────────────────────────────────────────────────────────────
const SHOWER_L_MIN = 9;
const BATH_L       = 150;
const TOILET_L     = 7;
const DISHWASHER_L = 13;
const HANDWASH_L   = 22;
const LAUNDRY_L    = 60;
const GARDEN_L_MIN = 15;
const CAR_L        = 280;
const DRINK_L      = 3;      // per person/day
const WATER_COST   = 0.0018; // USD per litre (~$1.80/m³)
const WORLD_AVG    = 150;
const EU_AVG       = 185;
const US_AVG       = 310;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

function getRating(l) {
  if (l <  80) return { label: 'Excellent',  grade: 'A+', color: '#00ff88' };
  if (l < 130) return { label: 'Very Good',  grade: 'A',  color: '#66ff44' };
  if (l < 175) return { label: 'Average',    grade: 'B',  color: '#ffcc00' };
  if (l < 240) return { label: 'High',       grade: 'C',  color: '#ff8800' };
  if (l < 330) return { label: 'Excessive',  grade: 'D',  color: '#ff4400' };
  return         { label: 'Critical',        grade: 'F',  color: '#ff0033' };
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function CircularGauge({ value, color }) {
  const R   = 72;
  const C   = 2 * Math.PI * R;
  const pct = Math.min(1, value / 420);

  return (
    <div style={{ position: 'relative', width: 210, height: 210, margin: '0 auto' }}>
      <svg width="210" height="210" viewBox="0 0 210 210" style={{ transform: 'rotate(-90deg)' }}>
        {/* Outer glow ring */}
        <circle cx="105" cy="105" r={R} fill="none" stroke={color} strokeWidth="18"
          strokeOpacity="0.06" />
        {/* Track */}
        <circle cx="105" cy="105" r={R} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="11" />
        {/* Progress */}
        <motion.circle
          cx="105" cy="105" r={R}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 10px ${color}99)` }}
        />
      </svg>

      {/* Center label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.div
          key={Math.round(value)}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ color, fontSize: 46, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 }}
        >
          {Math.round(value)}
        </motion.div>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 5, letterSpacing: 2 }}>
          L / DAY
        </div>
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, marginTop: 2 }}>
          per person
        </div>
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ color, label }) {
  return (
    <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
      <span style={{ color, fontSize: 10.5, letterSpacing: 3.5, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ icon, label, value, min, max, onChange, color }) {
  const btnStyle = {
    width: 30, height: 30, borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#777', fontSize: 18, lineHeight: 1, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
      <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
        <span style={{ fontSize: 17 }}>{icon}</span>
        <span style={{ color: '#bbb', fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} style={btnStyle}>−</button>
        <span style={{ color: color || '#44aaff', fontSize: 22, fontWeight: 700, fontFamily: 'monospace', minWidth: 30, textAlign: 'center' }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} style={btnStyle}>+</button>
      </div>
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({ icon, label, sub, value, min, max, step, unit, onChange, color }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
          <div>
            <div style={{ color: '#bbb', fontSize: 13 }}>{label}</div>
            {sub && <div style={{ color: '#3e3e3e', fontSize: 11, marginTop: 1 }}>{sub}</div>}
          </div>
        </div>
        <span style={{ color: color || '#44aaff', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${color || '#44aaff'}44, ${color || '#44aaff'})`,
            borderRadius: 2, transition: 'width 0.08s ease',
          }} />
        </div>
        <input
          type="range" min={min} max={max} step={step || 1} value={value}
          onChange={e => onChange(+e.target.value)} className="wc-range"
          style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            left: 0, width: '100%', margin: 0, opacity: 0, cursor: 'pointer', height: 20,
          }}
        />
      </div>
    </div>
  );
}

// ─── Category Bar ─────────────────────────────────────────────────────────────
function CatBar({ icon, label, liters, max, color }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ color: '#666', fontSize: 12 }}>{label}</span>
        </div>
        <span style={{ color, fontSize: 11.5, fontFamily: 'monospace', fontWeight: 600 }}>{fmt(liters)} L/day</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${Math.min(100, (liters / max) * 100)}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${color}44, ${color})`, borderRadius: 3 }}
        />
      </div>
    </div>
  );
}

// ─── Comparison Bar ───────────────────────────────────────────────────────────
function CmpBar({ label, value, max, color, bold }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: bold ? '#c0c0c0' : '#444', fontSize: 12, fontWeight: bold ? 600 : 400 }}>{label}</span>
        <span style={{ color: bold ? color : '#444', fontSize: 12, fontFamily: 'monospace', fontWeight: bold ? 700 : 400 }}>
          {Math.round(value)} L/day
        </span>
      </div>
      <div style={{ height: bold ? 9 : 5, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: bold
              ? `linear-gradient(90deg, ${color}66, ${color})`
              : 'rgba(255,255,255,0.15)',
            borderRadius: 4,
            ...(bold ? { boxShadow: `0 0 8px ${color}55` } : {}),
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WaterCalculator() {
  const [people,     setPeople]     = useState(3);
  const [showerMins, setShowerMins] = useState(8);
  const [showerWk,   setShowerWk]   = useState(7);
  const [bathWk,     setBathWk]     = useState(1);
  const [flushDay,   setFlushDay]   = useState(5);
  const [dishMode,   setDishMode]   = useState('machine');
  const [dishWk,     setDishWk]     = useState(5);
  const [laundryWk,  setLaundryWk]  = useState(4);
  const [gardenWk,   setGardenWk]   = useState(30);
  const [carMo,      setCarMo]      = useState(2);

  const R = useMemo(() => {
    const showerL  = (showerMins * SHOWER_L_MIN * showerWk / 7) * people;
    const bathL    = (BATH_L * bathWk / 7) * people;
    const toiletL  = flushDay * TOILET_L * people;
    const dishL    = ((dishMode === 'machine' ? DISHWASHER_L : HANDWASH_L) * dishWk) / 7;
    const laundryL = (LAUNDRY_L * laundryWk) / 7;
    const gardenL  = (GARDEN_L_MIN * gardenWk) / 7;
    const carL     = (CAR_L * carMo) / 30;
    const drinkL   = DRINK_L * people;

    const totalDay  = showerL + bathL + toiletL + dishL + laundryL + gardenL + carL + drinkL;
    const perPerson = totalDay / people;
    const monthly   = totalDay * 30;
    const annual    = totalDay * 365;
    const annualCost = annual * WATER_COST;
    const saving20L  = annual * 0.20;
    const saving20$  = saving20L * WATER_COST;

    const rating = getRating(perPerson);

    const categories = [
      { label: 'Shower',   icon: '🚿', liters: showerL,  color: '#00ccff' },
      { label: 'Bath',     icon: '🛁', liters: bathL,    color: '#4488ff' },
      { label: 'Toilet',   icon: '🚽', liters: toiletL,  color: '#aa44ff' },
      { label: 'Dishes',   icon: '🍽️', liters: dishL,    color: '#ffcc44' },
      { label: 'Laundry',  icon: '👕', liters: laundryL, color: '#ff8844' },
      { label: 'Garden',   icon: '🌿', liters: gardenL,  color: '#44ff88' },
      { label: 'Car Wash', icon: '🚗', liters: carL,     color: '#ff4466' },
      { label: 'Drinking', icon: '🥤', liters: drinkL,   color: '#44ccff' },
    ].sort((a, b) => b.liters - a.liters);

    const cmpMax = Math.max(perPerson, US_AVG) * 1.12;

    const tips = [];
    if (showerMins > 7)
      tips.push({ icon: '🚿', text: `Cutting shower by ${showerMins - 7} min saves ~${Math.round((showerMins - 7) * SHOWER_L_MIN * showerWk / 7 * people)} L/day.` });
    if (bathWk > 2)
      tips.push({ icon: '🛁', text: `Replacing ${bathWk - 2} bath(s)/week with showers saves ~${Math.round((bathWk - 2) * (BATH_L - 8 * SHOWER_L_MIN) / 7 * people)} L/day.` });
    if (dishMode === 'hand')
      tips.push({ icon: '🍽️', text: `A modern dishwasher uses 13 L vs 22 L by hand — switching saves ~40% on dishes.` });
    if (gardenWk > 20)
      tips.push({ icon: '🌿', text: `Watering in early morning cuts evaporation. Trimming ${gardenWk - 20} min/week saves ~${Math.round((gardenWk - 20) * GARDEN_L_MIN / 7)} L/day.` });
    if (carMo > 1)
      tips.push({ icon: '🚗', text: `A bucket wash instead of hose saves ~200 L per car (${carMo}×/mo = ${carMo * 200} L/mo saved).` });
    if (flushDay > 4)
      tips.push({ icon: '🚽', text: `Dual-flush toilets use ~3.5 L for half-flush — saves ${Math.round((flushDay - 4) * 3.5 * people)} L/day for your home.` });
    if (tips.length === 0)
      tips.push({ icon: '⭐', text: `Outstanding habits — you're well below the global average of ${WORLD_AVG} L/day.` });

    return {
      perPerson, totalDay, monthly, annual, annualCost, saving20L, saving20$,
      rating, categories, maxCat: categories[0]?.liters || 1, cmpMax, tips,
    };
  }, [people, showerMins, showerWk, bathWk, flushDay, dishMode, dishWk, laundryWk, gardenWk, carMo]);

  const glass = (accent = 'rgba(255,255,255,0.07)') => ({
    background: 'rgba(7, 13, 24, 0.84)',
    backdropFilter: 'blur(16px)',
    border: `1px solid ${accent}`,
    borderRadius: 20,
    padding: '26px 24px',
  });

  return (
    <>
      <style>{`
        .wc-range{-webkit-appearance:none;appearance:none;background:transparent}
        .wc-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;cursor:pointer;box-shadow:0 0 6px rgba(255,255,255,.35)}
        .wc-range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;cursor:pointer;border:none}
        .wc-mode{transition:all .18s;cursor:pointer}
        .wc-mode:hover{filter:brightness(1.18)}
      `}</style>

      <div style={{ minHeight: '100vh', background: '#000', padding: 'clamp(50px, 8vw, 100px) clamp(16px, 5vw, 40px) 80px' }}>

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <span style={{ color: '#44aaff', fontSize: 12, fontWeight: 500, letterSpacing: 4, textTransform: 'uppercase', display: 'block', marginBottom: 14 }}>
            Water Footprint Analysis
          </span>
          <h2 style={{ color: '#fff', fontSize: 'clamp(26px, 6vw, 38px)', fontWeight: 700, marginBottom: 14, letterSpacing: -0.5 }}>
            Daily Water Usage Calculator
          </h2>
          <p style={{ color: '#444', fontSize: 15, maxWidth: 460, margin: '0 auto', lineHeight: 1.75 }}>
            Enter your daily habits to discover your personal water footprint
            and compare it against global benchmarks.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, maxWidth: 1240, margin: '0 auto' }}>

          {/* ── INPUTS ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.55 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Household */}
            <div style={{ ...glass('rgba(68,170,255,0.14)'), boxShadow: '0 0 30px rgba(68,170,255,0.04)' }}>
              <SectionLabel color="#44aaff" label="Household" />
              <Stepper icon="👥" label="Number of people" value={people} min={1} max={12} onChange={setPeople} color="#44aaff" />
            </div>

            {/* Hygiene */}
            <div style={{ ...glass('rgba(0,200,255,0.1)') }}>
              <SectionLabel color="#00ccff" label="Personal Hygiene" />
              <Slider icon="🚿" label="Shower duration" sub="Per person" value={showerMins} min={2} max={30} unit=" min" onChange={setShowerMins} color="#00ccff" />
              <Slider icon="📅" label="Showers per week" sub="Per person" value={showerWk} min={1} max={14} unit="×/wk" onChange={setShowerWk} color="#00aaee" />
              <Slider icon="🛁" label="Baths per week" sub="Per person" value={bathWk} min={0} max={7} unit="×/wk" onChange={setBathWk} color="#4488ff" />
              <Slider icon="🚽" label="Toilet flushes per day" sub="Per person" value={flushDay} min={1} max={12} unit="×/day" onChange={setFlushDay} color="#aa44ff" />
            </div>

            {/* Household Tasks */}
            <div style={{ ...glass('rgba(255,200,68,0.08)') }}>
              <SectionLabel color="#ffcc44" label="Household Tasks" />

              <div style={{ marginBottom: 18 }}>
                <div style={{ color: '#444', fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                  Dish washing method
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { id: 'machine', label: '🤖 Dishwasher', sub: '13 L / cycle' },
                    { id: 'hand',    label: '🤲 By Hand',    sub: '22 L / session' },
                  ].map(m => (
                    <div key={m.id} onClick={() => setDishMode(m.id)} className="wc-mode" style={{
                      background: dishMode === m.id ? 'rgba(255,204,68,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${dishMode === m.id ? 'rgba(255,204,68,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 10, padding: '10px 13px',
                      color: dishMode === m.id ? '#ffcc44' : '#3a3a3a',
                    }}>
                      <div style={{ fontSize: 12.5, marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 10.5, opacity: 0.55 }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Slider icon="🍽️" label="Dish sessions per week" value={dishWk} min={1} max={21} unit="×/wk" onChange={setDishWk} color="#ffcc44" />
              <Slider icon="👕" label="Laundry loads per week" value={laundryWk} min={0} max={14} unit="×/wk" onChange={setLaundryWk} color="#ff8844" />
            </div>

            {/* Outdoor */}
            <div style={{ ...glass('rgba(68,255,136,0.08)') }}>
              <SectionLabel color="#44ff88" label="Outdoor Use" />
              <Slider icon="🌿" label="Garden watering" sub="Total minutes per week" value={gardenWk} min={0} max={180} step={5} unit=" min/wk" onChange={setGardenWk} color="#44ff88" />
              <Slider icon="🚗" label="Car washes per month" value={carMo} min={0} max={8} unit="×/mo" onChange={setCarMo} color="#ff4466" />
            </div>
          </motion.div>

          {/* ── RESULTS ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Gauge + Grade */}
            <div style={{ ...glass(), padding: '34px 24px', textAlign: 'center' }}>
              <CircularGauge value={R.perPerson} color={R.rating.color} />

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                marginTop: 20, padding: '8px 24px',
                background: `${R.rating.color}10`,
                border: `1px solid ${R.rating.color}33`,
                borderRadius: 30,
              }}>
                <span style={{ color: R.rating.color, fontSize: 24, fontWeight: 800, fontFamily: 'monospace' }}>
                  {R.rating.grade}
                </span>
                <span style={{ color: R.rating.color, fontSize: 13, fontWeight: 600, letterSpacing: 2 }}>
                  {R.rating.label.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 22 }}>
                {[
                  { l: 'Household / day', v: fmt(R.totalDay),   u: 'L',     c: '#44aaff' },
                  { l: 'Monthly total',   v: fmt(R.monthly),    u: 'L',     c: '#00ffcc' },
                  { l: 'Annual cost est.', v: '$' + R.annualCost.toFixed(0), u: '/yr', c: '#ffcc44' },
                ].map(s => (
                  <div key={s.l} style={{ padding: '13px 6px', background: 'rgba(255,255,255,0.025)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ color: '#303030', fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>{s.l}</div>
                    <div style={{ color: s.c, fontSize: 17, fontWeight: 700, fontFamily: 'monospace' }}>{s.v}</div>
                    <div style={{ color: '#252525', fontSize: 9.5, marginTop: 2 }}>{s.u}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Comparison */}
            <div style={{ ...glass('rgba(0,255,204,0.08)') }}>
              <SectionLabel color="#00ffcc" label="Global Comparison" />
              <CmpBar label="Your usage (per person)" value={R.perPerson} max={R.cmpMax} color={R.rating.color} bold />
              <CmpBar label="World average — 150 L/day" value={WORLD_AVG} max={R.cmpMax} />
              <CmpBar label="EU average — 185 L/day"    value={EU_AVG}    max={R.cmpMax} />
              <CmpBar label="US average — 310 L/day"    value={US_AVG}    max={R.cmpMax} />

              <div style={{
                marginTop: 14, padding: '12px 14px', borderRadius: 10, fontSize: 12.5, lineHeight: 1.7,
                background: R.perPerson > WORLD_AVG ? 'rgba(255,80,0,0.06)' : 'rgba(0,255,136,0.05)',
                border: `1px solid ${R.perPerson > WORLD_AVG ? 'rgba(255,80,0,0.2)' : 'rgba(0,255,136,0.18)'}`,
                color: R.perPerson > WORLD_AVG ? '#ff8844' : '#44ff88',
              }}>
                {R.perPerson > WORLD_AVG
                  ? `You use ${Math.round((R.perPerson / WORLD_AVG - 1) * 100)}% more than the world average — ${Math.round(R.perPerson - WORLD_AVG)} L/day extra per person.`
                  : `You're ${Math.round((1 - R.perPerson / WORLD_AVG) * 100)}% below the world average — ${Math.round(WORLD_AVG - R.perPerson)} L/day less per person. Great work!`
                }
              </div>
            </div>

            {/* Usage Breakdown */}
            <div style={{ ...glass('rgba(255,140,0,0.07)') }}>
              <SectionLabel color="#FF8C00" label="Usage Breakdown" />
              {R.categories.map(c => (
                <CatBar key={c.label} icon={c.icon} label={c.label} liters={c.liters} max={R.maxCat} color={c.color} />
              ))}
            </div>

            {/* Savings + Tips */}
            <div style={{ ...glass('rgba(68,255,136,0.07)') }}>
              <SectionLabel color="#44ff88" label="Savings Potential" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                <div style={{ padding: '14px', background: 'rgba(68,255,136,0.05)', border: '1px solid rgba(68,255,136,0.14)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ color: '#2a2a2a', fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Save 20% → Annual</div>
                  <div style={{ color: '#44ff88', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{fmt(R.saving20L)}</div>
                  <div style={{ color: '#252525', fontSize: 9.5, marginTop: 2 }}>litres / year</div>
                </div>
                <div style={{ padding: '14px', background: 'rgba(255,204,68,0.05)', border: '1px solid rgba(255,204,68,0.14)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ color: '#2a2a2a', fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Money saved</div>
                  <div style={{ color: '#ffcc44', fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>${R.saving20$.toFixed(0)}</div>
                  <div style={{ color: '#252525', fontSize: 9.5, marginTop: 2 }}>per year</div>
                </div>
              </div>

              {R.tips.slice(0, 4).map((t, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 11, padding: '10px 0',
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{ fontSize: 17, flexShrink: 0, lineHeight: 1.45 }}>{t.icon}</span>
                  <p style={{ color: '#5a5a5a', fontSize: 12.5, lineHeight: 1.7, margin: 0 }}>{t.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ textAlign: 'center', marginTop: 64, color: '#1e1e1e', fontSize: 11.5, lineHeight: 1.9 }}
        >
          Reference values: WHO, OECD, IWA · Water cost: $1.80/m³ average · For informational purposes only
        </motion.div>
      </div>
    </>
  );
}
