import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import FireGlobe from './components/FireGlobe';
import PreventionTips from './components/PreventionTips';
import WaterCalculator from './components/WaterCalculator';
import './App.css';

function NavPill() {
  const { pathname } = useLocation();
  const tab = (to, label, active) => ({
    display: 'inline-block',
    padding: '7px 16px',
    borderRadius: 16,
    fontSize: 12,
    fontWeight: active ? 600 : 400,
    color: active ? '#fff' : '#666',
    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.2s',
    letterSpacing: 0.5,
  });
  const isMap = pathname === '/';
  return (
    <div style={{
      position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
      background: 'rgba(8,8,12,0.75)', backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 20, padding: 4,
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', gap: 2,
    }}>
      <Link to="/" style={tab('/', '🌍 Fire Map', isMap)}>🌍 Fire Map</Link>
      <Link to="/water" style={tab('/water', '💧 Water', !isMap)}>💧 Water</Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <NavPill />
      <Routes>
        <Route path="/" element={
          <>
            <FireGlobe />
            <PreventionTips />
          </>
        } />
        <Route path="/water" element={<WaterCalculator />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
