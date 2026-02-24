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
const DRINK_L      = 3;
const WATER_COST   = 0.0018;
const WORLD_AVG    = 150;
const EU_AVG       = 185;
const US_AVG       = 310;

// ─── Design tokens ───────────────────────────────────────────────────────────
const ACC    = '#7eb8d4';
const TEXT1  = '#d8d8d8';
const TEXT2  = '#5a5a5a';
const TEXT3  = '#333';
const BG     = 'rgba(9, 10, 13, 0.9)';
const BORDER = 'rgba(255,255,255,0.07)';

// ─── Animation variants ───────────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1]; // smooth spring-like ease

const fadeUp = (delay = 0) => ({
  initial:   { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport:  { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: EASE, delay },
});

const colVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

function getGrade(l) {
  if (l <  80) return { label: 'Excellent',  sub: 'Below global average',           color: '#5a9e7a' };
  if (l < 130) return { label: 'Efficient',  sub: 'Near global average',            color: '#7eb8d4' };
  if (l < 175) return { label: 'Average',    sub: 'On par with global average',     color: '#b0a88a' };
  if (l < 240) return { label: 'High',       sub: 'Above global average',           color: '#c4855a' };
  if (l < 330) return { label: 'Excessive',  sub: 'Well above global average',      color: '#b85050' };
  return         { label: 'Critical',        sub: 'Significantly above average',    color: '#9e3030' };
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function CircularGauge({ value }) {
  const r   = 54;
  const C   = 2 * Math.PI * r;
  const pct = Math.min(1, value / 400);
  const grade = getGrade(value);

  return (
    <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
        {/* track */}
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
        {/* glow behind arc */}
        <motion.circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke={grade.color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - pct), opacity: [0.08, 0.12, 0.08] }}
          transition={{
            strokeDashoffset: { duration: 0.8, ease: EASE },
            opacity:          { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ filter: `blur(6px)` }}
        />
        {/* main arc */}
        <motion.circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke={grade.color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 0.8, ease: EASE }}
        />
      </svg>

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.div
          key={Math.round(value)}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: EASE }}
          style={{ color: TEXT1, fontSize: 38, fontWeight: 600, lineHeight: 1, letterSpacing: -1.5 }}
        >
          {Math.round(value)}
        </motion.div>
        <div style={{ color: TEXT2, fontSize: 9.5, marginTop: 5, letterSpacing: 2.5, textTransform: 'uppercase' }}>
          L / day
        </div>
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SL({ label }) {
  return (
    <div style={{ color: TEXT2, fontSize: 9.5, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>
      {label}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ icon, label, value, min, max, onChange }) {
  const isMob = window.innerWidth <= 600;
  const btn = {
    width: isMob ? 34 : 24, height: isMob ? 34 : 24, borderRadius: isMob ? 6 : 4,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${BORDER}`,
    color: TEXT2, fontSize: isMob ? 16 : 14, lineHeight: 1, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'border-color 0.15s',
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ color: TEXT1, fontSize: 12.5 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} style={btn}>−</button>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ color: TEXT1, fontSize: 16, fontWeight: 600, minWidth: 22, textAlign: 'center', display: 'inline-block' }}
        >
          {value}
        </motion.span>
        <button onClick={() => onChange(Math.min(max, value + 1))} style={btn}>+</button>
      </div>
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({ icon, label, sub, value, min, max, step, unit, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <span style={{ fontSize: 12, lineHeight: 1 }}>{icon}</span>
          <span style={{ color: TEXT1, fontSize: 12.5 }}>{label}</span>
          {sub && <span style={{ color: TEXT3, fontSize: 10.5 }}>· {sub}</span>}
        </div>
        <motion.span
          key={value}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          style={{ color: ACC, fontSize: 12, fontFamily: 'monospace', fontWeight: 500 }}
        >
          {value}{unit}
        </motion.span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{ height: '100%', background: ACC, borderRadius: 1, opacity: 0.65 }}
          />
        </div>
        <input
          type="range" min={min} max={max} step={step || 1} value={value}
          onChange={e => onChange(+e.target.value)} className="wc-range"
          style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, width: '100%', margin: 0, opacity: 0, cursor: 'pointer', height: 28 }}
        />
      </div>
    </div>
  );
}

// ─── Category Row ─────────────────────────────────────────────────────────────
function CatRow({ icon, label, liters, max, index }) {
  const pct = Math.min(100, (liters / max) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, ease: EASE, delay: index * 0.04 }}
      style={{ marginBottom: 8 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11 }}>{icon}</span>
          <span style={{ color: TEXT2, fontSize: 11.5 }}>{label}</span>
        </div>
        <span style={{ color: TEXT2, fontSize: 11, fontFamily: 'monospace' }}>{fmt(liters)} L</span>
      </div>
      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: EASE, delay: index * 0.04 }}
          style={{ height: '100%', background: `rgba(255,255,255,${pct > 60 ? 0.35 : 0.18})`, borderRadius: 1 }}
        />
      </div>
    </motion.div>
  );
}

// ─── Comparison Bar ───────────────────────────────────────────────────────────
function CmpRow({ label, value, max, isYou, index }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.38, ease: EASE, delay: index * 0.06 }}
      style={{ marginBottom: 10 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: isYou ? TEXT1 : TEXT2, fontSize: 11.5, fontWeight: isYou ? 500 : 400 }}>{label}</span>
        <span style={{ color: isYou ? ACC : TEXT2, fontSize: 11.5, fontFamily: 'monospace' }}>
          {Math.round(value)} L
        </span>
      </div>
      <div style={{ height: isYou ? 5 : 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: EASE, delay: index * 0.06 }}
          style={{
            height: '100%',
            background: isYou ? ACC : 'rgba(255,255,255,0.14)',
            borderRadius: 2,
            opacity: isYou ? 0.85 : 1,
          }}
        />
      </div>
    </motion.div>
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

    const grade = getGrade(perPerson);
    const cmpMax = Math.max(perPerson, US_AVG) * 1.1;

    const categories = [
      { label: 'Shower',   icon: '🚿', liters: showerL  },
      { label: 'Bath',     icon: '🛁', liters: bathL    },
      { label: 'Toilet',   icon: '🚽', liters: toiletL  },
      { label: 'Dishes',   icon: '🍽️', liters: dishL    },
      { label: 'Laundry',  icon: '👕', liters: laundryL },
      { label: 'Garden',   icon: '🌿', liters: gardenL  },
      { label: 'Car Wash', icon: '🚗', liters: carL     },
      { label: 'Drinking', icon: '🥤', liters: drinkL   },
    ].sort((a, b) => b.liters - a.liters);

    const tips = [];
    if (showerMins > 7)
      tips.push(`Reducing shower by ${showerMins - 7} min saves ~${Math.round((showerMins - 7) * SHOWER_L_MIN * showerWk / 7 * people)} L/day.`);
    if (bathWk > 2)
      tips.push(`Replacing ${bathWk - 2} bath(s)/week with showers saves ~${Math.round((bathWk - 2) * (BATH_L - 8 * SHOWER_L_MIN) / 7 * people)} L/day.`);
    if (dishMode === 'hand')
      tips.push(`A dishwasher uses 13 L vs 22 L by hand — switching saves ~40% on dish washing.`);
    if (gardenWk > 20)
      tips.push(`Watering early morning cuts evaporation. Trimming ${gardenWk - 20} min/week saves ~${Math.round((gardenWk - 20) * GARDEN_L_MIN / 7)} L/day.`);
    if (carMo > 1)
      tips.push(`A bucket wash instead of hose saves ~200 L per car (${carMo}×/mo = ${carMo * 200} L/mo saved).`);
    if (flushDay > 4)
      tips.push(`Dual-flush toilets save ~3.5 L per half-flush — ${Math.round((flushDay - 4) * 3.5 * people)} L/day for your household.`);
    if (tips.length === 0)
      tips.push(`Outstanding habits — you are well below the global average of ${WORLD_AVG} L/day per person.`);

    return {
      perPerson, totalDay, monthly, annual, annualCost, saving20L, saving20$,
      grade, categories, maxCat: categories[0]?.liters || 1, cmpMax, tips,
    };
  }, [people, showerMins, showerWk, bathWk, flushDay, dishMode, dishWk, laundryWk, gardenWk, carMo]);

  const card = (extra = {}) => ({
    background: BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: '18px',
    ...extra,
  });

  const modeBtn = (active) => ({
    background: active ? 'rgba(126,184,212,0.08)' : 'rgba(255,255,255,0.02)',
    border: `1px solid ${active ? `${ACC}55` : BORDER}`,
    borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
    color: active ? ACC : TEXT2, fontSize: 12, transition: 'all 0.18s',
  });

  return (
    <>
      <style>{`
        .wc-range{-webkit-appearance:none;appearance:none;background:transparent}
        .wc-range::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${ACC};cursor:pointer;transition:transform 0.1s}
        .wc-range::-webkit-slider-thumb:active{transform:scale(1.2)}
        .wc-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:${ACC};cursor:pointer;border:none}
        @media(min-width:601px){
          .wc-range::-webkit-slider-thumb{width:11px;height:11px}
          .wc-range::-moz-range-thumb{width:11px;height:11px}
        }
      `}</style>

      <div style={{ background: '#000', padding: 'clamp(40px, 6vw, 80px) clamp(12px, 4vw, 32px) 60px' }}>

        {/* ── HEADER ── centered, staggered children */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(28px, 5vw, 44px)' }}>
          <motion.div {...fadeUp(0)} style={{ color: TEXT2, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
            Water Footprint Analysis
          </motion.div>
          <motion.h2
            {...fadeUp(0.1)}
            style={{ color: TEXT1, fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 400, letterSpacing: 0.5, margin: '0 0 12px', lineHeight: 1.3 }}
          >
            Daily Water Usage Calculator
          </motion.h2>
          <motion.p
            {...fadeUp(0.2)}
            style={{ color: TEXT2, fontSize: 13, maxWidth: 380, margin: '0 auto', lineHeight: 1.75, fontWeight: 300 }}
          >
            Enter your daily habits to discover your personal water footprint
            and compare it against global benchmarks.
          </motion.p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 14, maxWidth: 1100, margin: '0 auto' }}>

          {/* ── INPUTS ── staggered cards */}
          <motion.div
            variants={colVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <motion.div variants={cardVariants} style={card()}>
              <SL label="Household" />
              <Stepper icon="👥" label="Number of people" value={people} min={1} max={12} onChange={setPeople} />
            </motion.div>

            <motion.div variants={cardVariants} style={card()}>
              <SL label="Personal Hygiene" />
              <Slider icon="🚿" label="Shower duration" sub="per person" value={showerMins} min={2} max={30} unit=" min" onChange={setShowerMins} />
              <Slider icon="📅" label="Showers per week" sub="per person" value={showerWk} min={1} max={14} unit="×/wk" onChange={setShowerWk} />
              <Slider icon="🛁" label="Baths per week" sub="per person" value={bathWk} min={0} max={7} unit="×/wk" onChange={setBathWk} />
              <Slider icon="🚽" label="Toilet flushes / day" sub="per person" value={flushDay} min={1} max={12} unit="×" onChange={setFlushDay} />
            </motion.div>

            <motion.div variants={cardVariants} style={card()}>
              <SL label="Household Tasks" />
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: TEXT2, fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Dish washing method</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                  {[
                    { id: 'machine', label: 'Dishwasher', sub: '13 L / cycle' },
                    { id: 'hand',    label: 'By Hand',    sub: '22 L / session' },
                  ].map(m => (
                    <div key={m.id} onClick={() => setDishMode(m.id)} style={modeBtn(dishMode === m.id)}>
                      <div style={{ marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.5 }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Slider icon="🍽️" label="Dish sessions / week" value={dishWk} min={1} max={21} unit="×/wk" onChange={setDishWk} />
              <Slider icon="👕" label="Laundry loads / week" value={laundryWk} min={0} max={14} unit="×/wk" onChange={setLaundryWk} />
            </motion.div>

            <motion.div variants={cardVariants} style={card()}>
              <SL label="Outdoor Use" />
              <Slider icon="🌿" label="Garden watering" sub="min / week" value={gardenWk} min={0} max={180} step={5} unit=" min/wk" onChange={setGardenWk} />
              <Slider icon="🚗" label="Car washes / month" value={carMo} min={0} max={8} unit="×/mo" onChange={setCarMo} />
            </motion.div>
          </motion.div>

          {/* ── RESULTS ── staggered cards */}
          <motion.div
            variants={colVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {/* Gauge card */}
            <motion.div variants={cardVariants} style={card({ textAlign: 'center', padding: '24px 18px 20px' })}>
              <CircularGauge value={R.perPerson} />

              <motion.div
                key={R.grade.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                style={{ marginTop: 14 }}
              >
                <div style={{ color: R.grade.color, fontSize: 15, fontWeight: 500, letterSpacing: 0.5 }}>
                  {R.grade.label}
                </div>
                <div style={{ color: TEXT2, fontSize: 11, marginTop: 3 }}>{R.grade.sub}</div>
              </motion.div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 18 }}>
                {[
                  { l: 'Household / day', v: fmt(R.totalDay),              u: 'L'   },
                  { l: 'Monthly total',   v: fmt(R.monthly),                u: 'L'   },
                  { l: 'Annual cost',     v: '$' + R.annualCost.toFixed(0), u: '/yr' },
                ].map((s, i) => (
                  <motion.div
                    key={s.l}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.15 + i * 0.07 }}
                    style={{ padding: '10px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}
                  >
                    <div style={{ color: TEXT3, fontSize: 8.5, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>{s.l}</div>
                    <div style={{ color: TEXT1, fontSize: 15, fontWeight: 500 }}>{s.v}</div>
                    <div style={{ color: TEXT3, fontSize: 9, marginTop: 2 }}>{s.u}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Comparison */}
            <motion.div variants={cardVariants} style={card()}>
              <SL label="Global Comparison" />
              {[
                { label: 'Your usage (per person)', value: R.perPerson, isYou: true  },
                { label: 'World avg — 150 L/day',   value: WORLD_AVG,  isYou: false },
                { label: 'EU avg — 185 L/day',      value: EU_AVG,     isYou: false },
                { label: 'US avg — 310 L/day',      value: US_AVG,     isYou: false },
              ].map((row, i) => (
                <CmpRow key={row.label} {...row} max={R.cmpMax} index={i} />
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  marginTop: 10, padding: '10px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.7,
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`,
                  color: R.perPerson > WORLD_AVG ? '#aa6644' : '#6a8e6a',
                }}
              >
                {R.perPerson > WORLD_AVG
                  ? `${Math.round((R.perPerson / WORLD_AVG - 1) * 100)}% above world average — ${Math.round(R.perPerson - WORLD_AVG)} L/day extra per person.`
                  : `${Math.round((1 - R.perPerson / WORLD_AVG) * 100)}% below world average — ${Math.round(WORLD_AVG - R.perPerson)} L/day less per person.`
                }
              </motion.div>
            </motion.div>

            {/* Breakdown */}
            <motion.div variants={cardVariants} style={card()}>
              <SL label="Usage Breakdown" />
              {R.categories.map((c, i) => (
                <CatRow key={c.label} icon={c.icon} label={c.label} liters={c.liters} max={R.maxCat} index={i} />
              ))}
            </motion.div>

            {/* Savings */}
            <motion.div variants={cardVariants} style={card()}>
              <SL label="Savings Potential" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { l: 'Save 20% · Annual', v: fmt(R.saving20L), u: 'L / year' },
                  { l: 'Money saved',       v: `$${R.saving20$.toFixed(0)}`, u: 'per year' },
                ].map((s, i) => (
                  <motion.div
                    key={s.l}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, ease: EASE, delay: i * 0.08 }}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: 8, textAlign: 'center' }}
                  >
                    <div style={{ color: TEXT3, fontSize: 8.5, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 }}>{s.l}</div>
                    <div style={{ color: TEXT1, fontSize: 17, fontWeight: 500 }}>{s.v}</div>
                    <div style={{ color: TEXT3, fontSize: 9, marginTop: 2 }}>{s.u}</div>
                  </motion.div>
                ))}
              </div>
              {R.tips.slice(0, 4).map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, ease: EASE, delay: i * 0.07 }}
                  style={{
                    padding: '8px 0',
                    borderTop: `1px solid ${BORDER}`,
                    display: 'flex', gap: 9, alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: ACC, flexShrink: 0, marginTop: 7, opacity: 0.55 }} />
                  <p style={{ color: TEXT2, fontSize: 12, lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{t}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* FOOTER */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ textAlign: 'center', marginTop: 40, color: TEXT3, fontSize: 10.5, lineHeight: 1.8, letterSpacing: 0.3 }}
        >
          Reference values: WHO, OECD, IWA · Water cost estimate: $1.80 / m³ · For informational purposes only
        </motion.div>
      </div>
    </>
  );
}
