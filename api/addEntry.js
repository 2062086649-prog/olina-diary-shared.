const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { password, title, content } = req.body;

    if(password !== "Olina123"){
      return res.status(401).json({message:"Wrong password"});
    }

    const filePath = path.join(process.cwd(), 'diary.json');
    const diary = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const today = new Date();
    const date = today.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});

    diary.push({date, title, content});
    fs.writeFileSync(filePath, JSON.stringify(diary, null, 2));

    return res.status(200).json({message:"Entry added"});
  } else {
    res.status(405).json({message:"Method not allowed"});
  }
}
