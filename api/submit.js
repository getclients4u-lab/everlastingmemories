// Vercel serverless function: receives form POST and appends to submissions.csv in GitHub

const OWNER = 'getclients4u-lab';
const REPO  = 'everlastingmemories';
const PATH  = 'submissions.csv';

module.exports = async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Location', '/contact.html?error=method');
    return res.status(302).end();
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN missing');
    res.setHeader('Location', '/contact.html?error=env');
    return res.status(302).end();
  }

  const body = req.body || {};
  const name      = (body.name  || '').replace(/"/g, '""').trim();
  const email     = (body.email || '').replace(/"/g, '""').trim();
  const phone     = (body.phone || '').replace(/"/g, '""').trim();
  const eventType = (body.event_type || '').replace(/"/g, '""').trim();
  const eventDate = (body.event_date || '').replace(/"/g, '""').trim();
  const message   = (body.message || '').replace(/"/g, '""').trim();
  const timestamp = new Date().toISOString();

  const row = `"${timestamp}","${name}","${email}","${phone}","${eventType}","${eventDate}","${message}"\n`;

  try {
    // 1. Fetch existing file (or create header)
    const getRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
    );

    let content = '';
    let sha = null;

    if (getRes.status === 200) {
      const data = await getRes.json();
      content = Buffer.from(data.content, 'base64').toString('utf8');
      sha = data.sha;
    } else if (getRes.status === 404) {
      content = 'Timestamp,Name,Email,Phone,Event Type,Event Date,Message\n';
    } else {
      throw new Error(`GitHub GET ${getRes.status}`);
    }

    content += row;

    const encoded = Buffer.from(content).toString('base64');

    // 2. Commit updated file
    const putRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Submission from ${name || 'anonymous'}`,
          content: encoded,
          sha,
        }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      throw new Error(`GitHub PUT ${putRes.status}: ${err}`);
    }

    // 3. Redirect back with success
    res.setHeader('Location', '/contact.html?submitted=true');
    return res.status(302).end();

  } catch (err) {
    console.error('Submit error:', err);
    res.setHeader('Location', '/contact.html?error=server');
    return res.status(302).end();
  }
};
