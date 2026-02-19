const axios = require('axios');

let cache = null;
let cacheTime = 0;

// Remove solitary pixels: keep only points that have at least one
// other fire point within ~1 degree (~111 km) in any direction.
function removeSolitary(fires) {
  const GRID = 1.0;
  const gridCount = {};
  for (const f of fires) {
    const key = `${Math.floor(f[0] / GRID)},${Math.floor(f[1] / GRID)}`;
    gridCount[key] = (gridCount[key] || 0) + 1;
  }
  return fires.filter(f => {
    const gx = Math.floor(f[0] / GRID), gy = Math.floor(f[1] / GRID);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gx + dx},${gy + dy}`;
        const cnt = gridCount[key] || 0;
        // neighbour cell with any point, OR same cell with more than 1 point
        if (cnt > 0 && (dx !== 0 || dy !== 0)) return true;
        if (cnt > 1 && dx === 0 && dy === 0) return true;
      }
    }
    return false;
  });
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
    const li = h.indexOf('latitude'), lo = h.indexOf('longitude'), fi = h.indexOf('frp');
    const ci = h.indexOf('confidence');
    const raw = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(',');
      if (c.length < h.length) continue;
      const frp = parseFloat(c[fi]) || 0;
      if (frp < 50) continue;                          // FRP eşiği: 50 MW
      const conf = ci >= 0 ? (c[ci]?.trim() || '') : '';
      if (conf !== 'high') continue;                   // Sadece high confidence
      raw.push([+parseFloat(c[li]).toFixed(2), +parseFloat(c[lo]).toFixed(2), frp]);
    }
    const fires = removeSolitary(raw);                 // Solitary pixel temizliği
    cache = fires;
    cacheTime = Date.now();
    res.json(fires);
  } catch (e) {
    console.error(e.message);
    res.json(cache || []);
  }
};
