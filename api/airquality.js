const axios = require('axios');

const OAQ_KEY = '9088dee828153187a0c810eabe373067a519c4647b22f176c1c3c59d1790cbf9';

module.exports = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required' });
  try {
    const { data: locData } = await axios.get('https://api.openaq.org/v3/locations', {
      params: { coordinates: `${lat},${lng}`, radius: 25000, limit: 1 },
      headers: { 'X-API-Key': OAQ_KEY },
      timeout: 10000
    });
    if (!locData.results?.length) return res.json(null);
    const loc = locData.results[0];
    const { data: latestData } = await axios.get(
      `https://api.openaq.org/v3/locations/${loc.id}/latest`,
      { headers: { 'X-API-Key': OAQ_KEY }, timeout: 10000 }
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
};
