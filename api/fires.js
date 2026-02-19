const axios = require('axios');

let cache = null;
let cacheTime = 0;

function splitFires(lines, h) {
  const li = h.indexOf('latitude'), lo = h.indexOf('longitude');
  const fi = h.indexOf('frp'), ci = h.indexOf('confidence');
  const raw = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(',');
    if (c.length < h.length) continue;
    const frp  = parseFloat(c[fi]) || 0;
    if (frp < 20) continue;
    const conf = ci >= 0 ? (c[ci]?.trim() || '') : '';
    if (conf !== 'high') continue;
    raw.push([+parseFloat(c[li]).toFixed(2), +parseFloat(c[lo]).toFixed(2), frp]);
  }

  // Solitary-pixel check on the FRP>=50 subset
  const highFrp = raw.filter(f => f[2] >= 50);
  const GRID = 1.0;
  const gc = {};
  for (const f of highFrp) {
    const k = `${Math.floor(f[0] / GRID)},${Math.floor(f[1] / GRID)}`;
    gc[k] = (gc[k] || 0) + 1;
  }
  const hasNeighbour = f => {
    const gx = Math.floor(f[0] / GRID), gy = Math.floor(f[1] / GRID);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const cnt = gc[`${gx + dx},${gy + dy}`] || 0;
        if (cnt > 0 && (dx !== 0 || dy !== 0)) return true;
        if (cnt > 1 && dx === 0 && dy === 0) return true;
      }
    return false;
  };

  const verified   = highFrp.filter(hasNeighbour);
  // unverified = low-frp high-confidence  +  solitary high-frp
  const unverified = [
    ...raw.filter(f => f[2] < 50),
    ...highFrp.filter(f => !hasNeighbour(f)),
  ];

  return { verified, unverified };
}

module.exports = async (req, res) => {
  if (cache && Date.now() - cacheTime < 600000) return res.json(cache);
  try {
    const { data } = await axios.get(
      'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv',
      { timeout: 25000 }
    );
    const lines = data.split('\n');
    const h = lines[0].split(',');
    const result = splitFires(lines, h);
    cache = result;
    cacheTime = Date.now();
    res.json(result);
  } catch (e) {
    console.error(e.message);
    res.json(cache || { verified: [], unverified: [] });
  }
};
