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
    return fires;
  } catch (e) {
    console.error(e.message);
    return cache || [];
  }
}

app.get('/api/fires', async (req, res) => {
  res.json(await getFires());
});

const OAQ_KEY = '9088dee828153187a0c810eabe373067a519c4647b22f176c1c3c59d1790cbf9';
const oaqHeaders = { 'X-API-Key': OAQ_KEY };

app.get('/api/airquality', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required' });
  try {
    const { data: locData } = await axios.get('https://api.openaq.org/v3/locations', {
      params: { coordinates: `${lat},${lng}`, radius: 25000, limit: 1 },
      headers: oaqHeaders,
      timeout: 10000
    });
    if (!locData.results?.length) return res.json(null);
    const loc = locData.results[0];
    const { data: latestData } = await axios.get(
      `https://api.openaq.org/v3/locations/${loc.id}/latest`,
      { headers: oaqHeaders, timeout: 10000 }
    );
    const sensorMap = {};
    (loc.sensors || []).forEach(s => { sensorMap[s.id] = s.parameter; });
    const measurements = (latestData.results || []).map(m => ({
      ...m,
      parameter: sensorMap[m.sensorsId] || null,
    }));
    res.json({ location: loc, measurements });
  } catch (e) {
    console.error('OpenAQ error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/species', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required' });
  const delta = 0.045;
  const latN = parseFloat(lat), lngN = parseFloat(lng);
  try {
    const { data } = await axios.get('https://api.gbif.org/v1/occurrence/search', {
      params: {
        decimalLatitude: `${(latN - delta).toFixed(3)},${(latN + delta).toFixed(3)}`,
        decimalLongitude: `${(lngN - delta).toFixed(3)},${(lngN + delta).toFixed(3)}`,
        limit: 20,
        orderBy: 'lastInterpreted',
        sortOrder: 'desc',
      },
      timeout: 10000,
    });
    const seen = new Set();
    const species = (data.results || [])
      .filter(r => r.species || r.scientificName)
      .reduce((acc, r) => {
        const name = r.species || r.scientificName;
        if (!seen.has(name)) {
          seen.add(name);
          acc.push({
            name,
            commonName: r.vernacularName || null,
            kingdom: r.kingdom || null,
            family: r.family || null,
            imageUrl: r.media?.[0]?.identifier || null,
          });
        }
        return acc;
      }, [])
      .slice(0, 5);
    res.json(species);
  } catch (e) {
    console.error('GBIF error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
