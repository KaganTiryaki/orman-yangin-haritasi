const axios = require('axios');

const NEWS_KEY = '2441469102354c0a826fd3160cee1295';

module.exports = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q required' });
  try {
    const { data } = await axios.get('https://newsapi.org/v2/everything', {
      params: { q, sortBy: 'publishedAt', language: 'en', pageSize: 5, apiKey: NEWS_KEY },
      timeout: 8000,
    });
    // NewsAPI sometimes returns status:'error' even with HTTP 200
    if (data.status === 'error') {
      console.error('NewsAPI response error:', data.code, data.message);
      return res.json({ articles: [], apiError: data.code || 'unknown' });
    }
    res.json({ articles: (data.articles || []).slice(0, 4) });
  } catch (e) {
    const status = e.response?.status;
    const code = e.response?.data?.code
      || (status === 429 ? 'rateLimited' : status === 426 ? 'upgrade' : 'networkError');
    console.error('NewsAPI error:', status, code, e.message);
    // Return 200 so frontend can distinguish API errors from network failures
    res.json({ articles: [], apiError: code });
  }
};
