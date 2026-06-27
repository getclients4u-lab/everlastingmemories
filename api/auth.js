// Vercel Serverless Function - Auth verification
const AUTH_TOKEN = process.env.ADMIN_TOKEN || 'em-admin-2026';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { username, password } = req.body;
  
  // Simple auth - in production use bcrypt and proper session management
  const validUsername = process.env.ADMIN_USER || 'admin';
  const validPassword = process.env.ADMIN_PASS || 'Everlasting2026!';
  
  if (username === validUsername && password === validPassword) {
    return res.status(200).json({ 
      success: true, 
      token: AUTH_TOKEN,
      message: 'Authentication successful'
    });
  }

  return res.status(401).json({ success: false, error: 'Invalid credentials' });
};
