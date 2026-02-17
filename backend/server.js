const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

let cache = null;
let cacheTime = 0;

async function getFires() {
  if (cache && Date.now() - cacheTime < 600000) return cache;
  try {
    const { data } = await axios.get(
      'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv',
      { timeout: 30000 }
    );
    const lines = data.split('\n');
    const h = lines[0].split(',');
    const li = h.indexOf('latitude'), lo = h.indexOf('longitude'), fi = h.indexOf('frp');
    const fires = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(',');
      if (c.length < h.length) continue;
      const frp = parseFloat(c[fi]) || 0;
      if (frp < 10) continue;
      fires.push([+parseFloat(c[li]).toFixed(2), +parseFloat(c[lo]).toFixed(2), frp]);
    }
    cache = fires;
    cacheTime = Date.now();
    console.log(`${fires.length} fires loaded`);
    return fires;
  } catch (e) {
    console.error(e.message);
    return cache || [];
  }
}

app.get('/api/fires', async (req, res) => {
  res.json(await getFires());
});

app.listen(5000, () => { console.log('Port 5000'); getFires(); });
