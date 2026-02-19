const axios = require('axios');

let cache = null;
let cacheTime = 0;

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
    const fires = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(',');
      if (c.length < h.length) continue;
      const frp = parseFloat(c[fi]) || 0;
      if (frp < 20) continue;
      const conf = ci >= 0 ? (c[ci]?.trim() || '') : '';
      const isHigh = conf === 'h' || conf === 'high' || parseFloat(conf) > 70;
      if (conf && !isHigh) continue;
      fires.push([+parseFloat(c[li]).toFixed(2), +parseFloat(c[lo]).toFixed(2), frp]);
    }
    cache = fires;
    cacheTime = Date.now();
    res.json(fires);
  } catch (e) {
    console.error(e.message);
    res.json(cache || []);
  }
};
