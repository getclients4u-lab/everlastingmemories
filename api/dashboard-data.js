// Dashboard data API — serves latest market data for the briefing
// Returns cached data from data/market-data.json or fetches fresh

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  const dataPath = path.join(__dirname, '..', 'data', 'market-data.json');
  
  // Set CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  try {
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return res.status(200).json(data);
    }
    
    // Fallback: return embedded defaults
    return res.status(200).json({
      date: new Date().toISOString().split('T')[0],
      prices: {
        "SPY": {"current": 749.17, "prevClose": 749.17},
        "QQQ": {"current": 711.74, "prevClose": 711.74},
        "DIA": {"current": 524.47, "prevClose": 524.47}
      },
      note: "Cached data — run daily build to refresh"
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
