
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const binId = '69a05d5343b1c97be9a098fd'; // 你在 JSONBin 创建的 Bin ID
  const accessKey = 'OlinaDiaryKey';       // 你创建的 X-Access-Key

  // GET 请求：获取现有日记
  if (req.method === 'GET') {
    try {
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: { 'X-Master-Key': accessKey }
      });
      const json = await getRes.json();
      const diary = (json.record && json.record.users) || [];
      return res.status(200).json({ users: diary });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch diary', error: err.message });
    }
  }

  // POST 请求：添加新日记条目
  if (req.method === 'POST') {
    const { password, title, content } = req.body;

    if (password !== 'Olina123') {
      return res.status(401).json({ message: 'Wrong password' });
    }

    try {
      // 先获取现有数据
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: { 'X-Master-Key': accessKey }
      });
      const json = await getRes.json();
      const diary = (json.record && json.record.users) || [];

      // 添加新条目
      const today = new Date();
      const date = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      diary.push({ date, title, content });

      // 写回 JSONBin
      await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': accessKey
        },
        body: JSON.stringify({ users: diary })
      });

      return res.status(200).json({ message: 'Entry added' });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to add entry', error: err.message });
    }
  }

  // 非 GET/POST 请求返回 405
  res.status(405).json({ message: 'Method not allowed' });
}
