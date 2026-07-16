// Vercel Serverless Function - Leads API
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join('/tmp', 'leads.json');
const AUTH_TOKEN = process.env.ADMIN_TOKEN || 'em-admin-2026';

// Initialize DB if not exists
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      leads: [],
      createdAt: new Date().toISOString()
    }, null, 2));
  }
}

function readDB() {
  initDB();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
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
      const db = readDB();
      return res.status(200).json({ success: true, leads: db.leads });
    }

    if (method === 'POST') {
      const { name, email, phone, eventType, eventDate, message } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Name and email are required' });
      }

      const db = readDB();
      const newLead = {
        id: Date.now().toString(),
        name,
        email,
        phone: phone || '',
        eventType: eventType || '',
        eventDate: eventDate || '',
        message: message || '',
        status: 'new',
        date: new Date().toISOString()
      };

      db.leads.unshift(newLead);
      writeDB(db);

      // Send Telegram notification
      telegramNotify.notify(newLead).catch(() => {});

      return res.status(201).json({ success: true, lead: newLead });
    }

    if (method === 'PUT') {
      // Protected endpoint - requires auth
      if (!verifyAuth(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id, status } = req.body;
      const db = readDB();
      const leadIndex = db.leads.findIndex(l => l.id === id);
      
      if (leadIndex === -1) {
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }

      db.leads[leadIndex].status = status;
      writeDB(db);

      return res.status(200).json({ success: true, lead: db.leads[leadIndex] });
    }

    if (method === 'DELETE') {
      // Protected endpoint - requires auth
      if (!verifyAuth(req)) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.query;
      const db = readDB();
      db.leads = db.leads.filter(l => l.id !== id);
      writeDB(db);

      return res.status(200).json({ success: true, message: 'Lead deleted' });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
