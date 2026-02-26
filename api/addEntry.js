// api/addEntry.js
// Replace the existing file content with this exact code.

const BIN_ID = '69a05d5343b1c97be9a098fd';

// keys you provided (server-only)
const ACCESS_KEY = 'OlinaDiaryKey'; // read-only key name (the token value stored in JSONBin account)
const ACCESS_KEY_VALUE = '$2a$10$zY2FY2eA8/eR3a.6U4AHbuEBe4yrd38d5EFrAD1742xPfdcBogCbu';
const MASTER_KEY_VALUE = '$2a$10$zL4T9HjKXwgb4mPCljOxM.RBemOLg8j.MiBnLzB8/8Y7qDOOK9VWO';

const VIEW_PASSWORD = 'Olina123';   // required to view
const WRITE_PASSWORD = 'Olina890';  // required to write

// helper to parse raw body (works on platforms where req.body may be empty)
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on && req.on('data', chunk => data += chunk);
    req.on && req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch (e) { reject(e); }
    });
    req.on && req.on('error', err => reject(err));
  });
}

export default async function handler(req, res) {
  try {
    // normalize method
    const method = (req.method || 'GET').toUpperCase();

    // === GET: require view password (query param viewPassword) ===
    if (method === 'GET') {
      // parse query param
      const url = new URL(req.url, `https://${req.headers.host || 'example.com'}`);
      const vp = url.searchParams.get('viewPassword') || '';

      if (!vp || vp !== VIEW_PASSWORD) {
        return res.status(401).json({ message: 'Wrong view password' });
      }

      // fetch from JSONBin using X-Access-Key (read)
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Access-Key': ACCESS_KEY_VALUE }
      });

      if (!getRes.ok) {
        const text = await getRes.text().catch(()=>null);
        console.error('JSONBin GET failed', getRes.status, text);
        return res.status(502).json({ message: 'Failed to fetch from JSONBin' });
      }

      const json = await getRes.json();
      const record = json.record;
      let entries = [];

      if (!record) entries = [];
      else if (Array.isArray(record)) entries = record;
      else if (Array.isArray(record.entries)) entries = record.entries;
      else if (Array.isArray(record.users)) entries = record.users;
      else entries = [];

      return res.status(200).json(entries);
    }

    // === POST: add entry (requires write password) ===
    if (method === 'POST') {
      // parse JSON body robustly
      let body = req.body;
      if (!body || Object.keys(body).length === 0) {
        try { body = await parseJsonBody(req); } catch(e) { return res.status(400).json({ message: 'Invalid JSON body' }); }
      }

      const { password, title, content } = body || {};

      if (!password || password !== WRITE_PASSWORD) {
        return res.status(401).json({ message: 'Wrong write password' });
      }
      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content required' });
      }

      // read current record (use MASTER_KEY to be safe)
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Master-Key': MASTER_KEY_VALUE }
      });

      if (!getRes.ok) {
        const text = await getRes.text().catch(()=>null);
        console.error('JSONBin GET before PUT failed', getRes.status, text);
        return res.status(502).json({ message: 'Failed to read JSONBin before write' });
      }

      const json = await getRes.json();
      const record = json.record;
      let entries = [];
      if (!record) entries = [];
      else if (Array.isArray(record)) entries = record;
      else if (Array.isArray(record.entries)) entries = record.entries;
      else if (Array.isArray(record.users)) entries = record.users;
      else entries = [];

      const now = new Date();
      const date = now.toLocaleString('en-US', { month:'long', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });

      // add an id so later deletion is possible if you want
      const id = `${Date.now()}${Math.floor(Math.random()*900+100)}`;
      const newEntry = { id, date, title, content };

      entries.push(newEntry);

      // write back as { entries: [...] } to be explicit and stable
      const putRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': MASTER_KEY_VALUE,
          'X-Bin-Versioning': 'false'
        },
        body: JSON.stringify({ entries })
      });

      if (!putRes.ok) {
        const text = await putRes.text().catch(()=>null);
        console.error('JSONBin PUT failed', putRes.status, text);
        return res.status(502).json({ message: 'Failed to write to JSONBin' });
      }

      return res.status(200).json({ message: 'Entry added', entry: newEntry });
    }

    // other methods
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('Server error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
                                     }
