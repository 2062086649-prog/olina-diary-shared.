// api/addEntry.js
// Serverless function for Vercel — does NOT expose secrets to the browser.
// Node's global fetch is used (no extra dependency needed).

const BIN_ID = '69a05d5343b1c97be9a098fd';

// KEYS (only used on server-side)
// X-Master-Key (write): full write permission
const MASTER_KEY = '$2a$10$zL4T9HjKXwgb4mPCljOxM.RBemOLg8j.MiBnLzB8/8Y7qDOOK9VWO';

// X-Access-Key (read): read-only key (named by you "OlinaDiaryKey")
const ACCESS_KEY = '$2a$10$zY2FY2eA8/eR3a.6U4AHbuEBe4yrd38d5EFrAD1742xPfdcBogCbu';

// Passwords (kept only here, not in front-end)
const VIEW_PASSWORD = 'Olina123';   // must provide to view entries
const WRITE_PASSWORD = 'Olina890';  // only you can write

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // optional query param: ?viewPassword=...
      const url = new URL(req.url, `https://${req.headers.host || 'example.com'}`);
      const vp = url.searchParams.get('viewPassword');

      // If view password provided, validate it; if not provided, allow read if bin public.
      if (vp) {
        if (vp !== VIEW_PASSWORD) {
          return res.status(401).json({ message: 'Wrong view password' });
        }
      }
      // Fetch latest from JSONBin with read (access) key
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Access-Key': ACCESS_KEY }
      });
      if (!getRes.ok) {
        const errText = await getRes.text().catch(()=>null);
        console.error('JSONBin GET error', getRes.status, errText);
        return res.status(502).json({ message: 'Failed to fetch from JSONBin' });
      }
      const json = await getRes.json();
      // Normalize: support legacy shapes (array or {entries:[]} or {users:[]})
      const record = json.record;
      let entries = [];
      if (!record) entries = [];
      else if (Array.isArray(record)) entries = record;
      else if (Array.isArray(record.entries)) entries = record.entries;
      else if (Array.isArray(record.users)) entries = record.users;
      else entries = [];

      return res.status(200).json(entries);
    }

    if (req.method === 'POST') {
      // must contain JSON body with {password, title, content}
      const body = req.body || (await parseJsonBody(req).catch(()=>null));
      if (!body) return res.status(400).json({ message: 'Invalid request body' });

      const { password, title, content } = body;
      if (!password) return res.status(401).json({ message: 'Write password required' });
      if (password !== WRITE_PASSWORD) return res.status(401).json({ message: 'Wrong write password' });

      if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

      // Read current record using MASTER_KEY (we read with access or master; read with ACCESS_KEY also okay)
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
        headers: { 'X-Master-Key': MASTER_KEY }
      });
      if (!getRes.ok) {
        const errText = await getRes.text().catch(()=>null);
        console.error('JSONBin GET before PUT error', getRes.status, errText);
        return res.status(502).json({ message: 'Failed to read JSONBin before write' });
      }
      const json = await getRes.json();
      let record = json.record;
      // normalize to entries array
      let entries = [];
      if (!record) entries = [];
      else if (Array.isArray(record)) entries = record;
      else if (Array.isArray(record.entries)) entries = record.entries;
      else if (Array.isArray(record.users)) entries = record.users;
      else entries = [];

      // Append new entry with full timestamp
      const now = new Date();
      const date = now.toLocaleString('en-US', { month:'long', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });
      const newEntry = { date, title, content };

      entries.push(newEntry);

      // Write back using MASTER_KEY (write permission)
      const putRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': MASTER_KEY,
          'X-Bin-Versioning': 'false'
        },
        body: JSON.stringify({ entries })
      });
      if (!putRes.ok) {
        const errText = await putRes.text().catch(()=>null);
        console.error('JSONBin PUT error', putRes.status, errText);
        return res.status(502).json({ message: 'Failed to write to JSONBin' });
      }

      return res.status(200).json({ message: 'Entry added', entry: newEntry });
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('Server error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/* helper to parse body if req.body not populated (some platforms) */
async function parseJsonBody(req){
  return new Promise((resolve, reject)=>{
    let data='';
    req.on('data', chunk=>data+=chunk);
    req.on('end', ()=> {
      try{ resolve(JSON.parse(data)); } catch(e){ reject(e); }
    });
    req.on('error', err=>reject(err));
  });
}
