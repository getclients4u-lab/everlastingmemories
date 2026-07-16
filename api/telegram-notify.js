// Telegram Lead Notifier — called by /api/leads.js on new submissions
// Sends an instant Telegram message when a new lead comes in

const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || null;
const CHAT_ID = '8710537854';

function notify(params) {
  if (!BOT_TOKEN || !params.name) return false;
  
  const text = `🛎️ <b>New Lead!</b>\n\n`
    + `👤 ${params.name}\n`
    + `📧 ${params.email || '—'}\n`
    + `📞 ${params.phone || '—'}\n`
    + `📝 ${params.message?.slice(0, 200) || '—'}\n`
    + `📅 ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  
  const payload = JSON.stringify({
    chat_id: CHAT_ID,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
  
  const url = new URL(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`);
  
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', () => resolve(false));
    req.write(payload);
    req.end();
  });
}

module.exports = { notify };
