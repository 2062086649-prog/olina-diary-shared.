import fetch from 'node-fetch';

export default async function handler(req, res) {
  const binId = '69a05d5343b1c97be9a098fd';
  const accessKey = 'OlinaDiaryKey';

  if (req.method === 'GET') {
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': accessKey }
    });
    const json = await getRes.json();
    const diary = json.record?.users || [];
    return res.status(200).json(diary);
  }

  if (req.method === 'POST') {
    const { password, title, content } = req.body;
    if (password !== 'Olina123') return res.status(401).json({ message: 'Wrong password' });

    // 获取现有数据
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': accessKey }
    });
    const json = await getRes.json();
    const diary = json.record?.users || [];

    // 添加条目
    const today = new Date();
    const date = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    diary.push({ date, title, content });

    // 写回 JSONBin
    const putRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': accessKey,
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify({ users: diary })
    });

    if (!putRes.ok) return res.status(500).json({ message: 'Failed to write entry' });

    return res.status(200).json({ message: 'Entry added' });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
