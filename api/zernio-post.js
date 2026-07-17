// Zernio social poster — triggered by admin actions
const https = require('https');

const ZERNIO_KEY = process.env.ZERNIO_API_KEY || null;

function postToSocial(content, platforms) {
  if (!ZERNIO_KEY || !content) return Promise.resolve({ error: 'Missing key or content' });
  
  const body = JSON.stringify({
    content,
    publishNow: true,
    platforms: platforms || [{ platform: 'twitter', accountId: null }]
  });
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'zernio.com',
      path: '/api/v1/posts',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZERNIO_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }
  
  const { content, platforms } = req.body || {};
  if (!content) {
    return res.status(400).json({ error: 'content required' });
  }
  
  const result = await postToSocial(content, platforms);
  res.status(200).json(result);
};
