import React from 'react';
import FireGlobe from './components/FireGlobe';
import PreventionTips from './components/PreventionTips';
import WaterCalculator from './components/WaterCalculator';
import './App.css';

function App() {
  return (
    <div>
      <FireGlobe />
      <PreventionTips />
      <WaterCalculator />
    </div>
  );
}

export default App;
