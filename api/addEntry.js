// api/addEntry.js
export default async function handler(req, res) {
  const binId = '69a05d5343b1c97be9a098fd';
  // NOTE: these values are what you provided earlier.
  const MASTER_KEY = '$2a$10$zL4T9HjKXwgb4mPCljOxM.RBemOLg8j.MiBnLzB8/8Y7qDOOK9VWO'; // write
  const ACCESS_KEY = '$2a$10$zY2FY2eA8/eR3a.6U4AHbuEBe4yrd38d5EFrAD1742xPfdcBogCbu'; // read
  const WRITE_PW = 'Olina890'; // writing/editing/deleting password

  // helper: fetch latest data from JSONBin
  async function fetchLatest() {
    const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': ACCESS_KEY } // using access key to read
    });
    const j = await r.json();
    // ensure structure: store array in record.entries
    const entries = (j && j.record && j.record.entries) ? j.record.entries : [];
    return entries;
  }

  // helper: write back entries (overwrite)
  async function putEntries(entries) {
    const r = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': MASTER_KEY,
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify({ entries })
    });
    return r;
  }

  try {
    if (req.method === 'GET') {
      const entries = await fetchLatest();
      return res.status(200).json(entries);
    }

    if (req.method === 'POST') {
      // Add new entry — requires correct write password
      const { password, title, content, date, time } = req.body || {};
      if (!password || password !== WRITE_PW) return res.status(401).json({ message: 'Wrong write password' });
      if (!title || !content) return res.status(400).json({ message: 'Title and content required' });

      const entries = await fetchLatest();
      // push new entry with date/time
      entries.push({
        date: date || new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }),
        time: time || new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
        title,
        content
      });

      const putRes = await putEntries(entries);
      if (!putRes.ok) return res.status(500).json({ message: 'Failed to write to JSONBin' });
      return res.status(200).json({ message: 'Entry added' });
    }

    if (req.method === 'PUT') {
      // Edit existing entry: expects { password, index, title, content }
      const { password, index, title, content } = req.body || {};
      if (!password || password !== WRITE_PW) return res.status(401).json({ message: 'Wrong write password' });
      if (typeof index !== 'number') return res.status(400).json({ message: 'Index required' });

      const entries = await fetchLatest();
      if (index < 0 || index >= entries.length) return res.status(400).json({ message: 'Index out of range' });

      // apply edits
      if (title !== undefined) entries[index].title = title;
      if (content !== undefined) entries[index].content = content;
      // update editing time
      const now = new Date();
      entries[index].date = now.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
      entries[index].time = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

      const putRes = await putEntries(entries);
      if (!putRes.ok) return res.status(500).json({ message: 'Failed to write to JSONBin' });
      return res.status(200).json({ message: 'Entry updated' });
    }

    if (req.method === 'DELETE') {
      // Delete entry: expects { password, index }
      const { password, index } = req.body || {};
      if (!password || password !== WRITE_PW) return res.status(401).json({ message: 'Wrong write password' });
      if (typeof index !== 'number') return res.status(400).json({ message: 'Index required' });

      const entries = await fetchLatest();
      if (index < 0 || index >= entries.length) return res.status(400).json({ message: 'Index out of range' });

      entries.splice(index, 1);
      const putRes = await putEntries(entries);
      if (!putRes.ok) return res.status(500).json({ message: 'Failed to write to JSONBin' });
      return res.status(200).json({ message: 'Entry deleted' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('Server error in addEntry:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}
