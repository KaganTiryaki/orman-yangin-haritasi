const axios = require('axios');

module.exports = async (req, res) => {
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
};
