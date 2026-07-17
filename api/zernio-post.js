// Zernio social poster — triggered from admin dashboard
const https = require('https');

const ZERNIO_KEY = process.env.ZERNIO_API_KEY || process.env.ZERNIO_KEY || null;

function zernioRequest(method, path, body) {
  return new Promise((resolve) => {
    try {
      const payload = body ? JSON.stringify(body) : '';
      const options = {
        hostname: 'zernio.com',
        path: '/api' + path,
        method: method,
        headers: {
          'Authorization': `Bearer ${ZERNIO_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };
      if (payload) {
        options.headers['Content-Length'] = Buffer.byteLength(payload);
      }
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      req.on('error', e => resolve({ error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
      if (payload) req.write(payload);
      req.end();
    } catch (e) {
      resolve({ error: e.message });
    }
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  const { content, platforms, action } = req.body || {};
  
  if (!ZERNIO_KEY) {
    return res.status(500).json({ error: 'ZERNIO_API_KEY not configured' });
  }
  
  // Profile list (for debugging/admin)
  if (action === 'profiles') {
    const r = await zernioRequest('GET', '/v1/profiles');
    return res.status(200).json(r);
  }
  
  // Post content
  if (!content) {
    return res.status(400).json({ error: 'content field required' });
  }
  
  const result = await zernioRequest('POST', '/v1/posts', {
    content,
    publishNow: true,
    platforms: platforms || [{ platform: 'twitter', accountId: null }]
  });
  
  res.status(result.status || 200).json(result);
};
