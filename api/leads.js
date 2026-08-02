// Vercel Serverless Function - Leads API
// Persistent storage: GitHub private repo (getclients4u-lab/em-leads) via API
// Fallback: /tmp cache so reads stay fast between writes

const https = require('https');
const AUTH_TOKEN = process.env.ADMIN_TOKEN || 'ADMIN_TOKEN_REVOKED';
const GH_TOKEN = process.env.GH_TOKEN || null;
const GH_REPO = 'getclients4u-lab/em-leads';
const GH_PATH = 'leads.json';

const CACHE_PATH = '/tmp/leads-cache.json';

function ghRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'everlastingmemories-leads',
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function readCache() {
  try {
    const fs = require('fs');
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    }
  } catch (e) {}
  return null;
}

function writeCache(data) {
  try {
    const fs = require('fs');
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data));
  } catch (e) {}
}

async function fetchFromGitHub() {
  if (!GH_TOKEN) return null;
  const res = await ghRequest('GET', `/repos/${GH_REPO}/contents/${GH_PATH}`);
  if (res.status !== 200 || !res.body.content) return null;
  const content = Buffer.from(res.body.content, 'base64').toString('utf8');
  return { data: JSON.parse(content), sha: res.body.sha };
}

async function saveToGitHub(data, sha) {
  if (!GH_TOKEN) return false;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const res = await ghRequest('PUT', `/repos/${GH_REPO}/contents/${GH_PATH}`, {
    message: `lead update ${new Date().toISOString()}`,
    content: content,
    ...(sha ? { sha } : {})
  });
  return res.status === 200 || res.status === 201;
}

async function readDB() {
  // Prefer GitHub (source of truth), fall back to /tmp cache
  const gh = await fetchFromGitHub();
  if (gh) {
    writeCache(gh.data);
    return gh;
  }
  const cached = readCache();
  if (cached) return { data: cached, sha: null };
  return { data: { leads: [], createdAt: new Date().toISOString() }, sha: null };
}

function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${AUTH_TOKEN}`;
}

const telegramNotify = require('./telegram-notify');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    if (method === 'GET') {
      // Get all leads (public endpoint for form submissions)
      const { data } = await readDB();
      return res.status(200).json({ success: true, leads: data.leads });
    }

    if (method === 'POST') {
      const { name, email, phone, eventType, eventDate, message, source, medium, campaign, term, device, browser, os, screen, referrer, sessionId, language, timezone, duration, type } = req.body;
      
      // Auto-recorded visits don't need name/email
      if (type !== 'visit' && type !== 'engagement' && (!name || !email)) {
        return res.status(400).json({ success: false, error: 'Name and email are required' });
      }

      const { data, sha } = await readDB();
      const newLead = {
        id: Date.now().toString(),
        name: name || '[Visitor]',
        email: email || '',
        phone: phone || '',
        eventType: eventType || '',
        eventDate: eventDate || '',
        message: message || '',
        source: source || '',
        medium: medium || '',
        campaign: campaign || '',
        term: term || '',
        device: device || '',
        browser: browser || '',
        os: os || '',
        screen: screen || '',
        referrer: referrer || '',
        sessionId: sessionId || '',
        language: language || '',
        timezone: timezone || '',
        duration: duration ? Number(duration) : 0,
        type: type || 'lead',
        status: (type === 'visit' || type === 'engagement') ? type : 'new',
        date: new Date().toISOString()
      };

      data.leads.unshift(newLead);
      const saved = await saveToGitHub(data, sha);
      if (saved) {
        writeCache(data);
      } else {
        // GitHub failed - keep in cache so data isn't lost this session
        writeCache(data);
      }

      // Send Telegram notification (only fires for real leads)
      Promise.resolve(telegramNotify.notify(newLead)).catch(() => {});

      return res.status(201).json({ success: true, lead: newLead });
    }

    if (method === 'PUT') {
      // Protected endpoint - requires auth
      if (!verifyAuth(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id, status } = req.body;
      const { data, sha } = await readDB();
      const leadIndex = data.leads.findIndex(l => l.id === id);
      
      if (leadIndex === -1) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }

      data.leads[leadIndex].status = status;
      const saved = await saveToGitHub(data, sha);
      if (saved) writeCache(data);

      return res.status(200).json({ success: true, lead: data.leads[leadIndex] });
    }

    if (method === 'DELETE') {
      // Protected endpoint - requires auth
      if (!verifyAuth(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.query;
      const { data, sha } = await readDB();
      data.leads = data.leads.filter(l => l.id !== id);
      const saved = await saveToGitHub(data, sha);
      if (saved) writeCache(data);

      return res.status(200).json({ success: true, message: 'Lead deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
