// api
import fetch from 'node-fetch';

export default async function handler(req,res){
  const binId = '69a05d5343b1c97be9a098fd';
  const masterKey = '$2a$10$zL4T9HjKXwgb4mPCljOxM.RBemOLg8j.MiBnLzB8/8Y7qDOOK9VWO'; // 写入用
  const accessKey = 'OlinaDiaryKey'; // 只读用
  const writePassword = 'Olina890'; // 只有你知道

  if(req.method==='GET'){
    try{
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`,{
        headers:{'X-Master-Key': accessKey}
      });
      const json = await getRes.json();
      return res.status(200).json(json.record||[]);
    } catch(e){
      return res.status(500).json({message:'Failed to fetch diary'});
    }
  }

  if(req.method==='POST'){
    const {password,title,content} = req.body;
    if(password!==writePassword){
      return res.status(401).json({message:'Wrong password for writing'});
    }

    try{
      // 先获取现有条目
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`,{
        headers:{'X-Master-Key': masterKey}
      });
      const json = await getRes.json();
      const diary = json.record || [];

      // 添加新条目
      const today = new Date();
      const date = today.toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
      diary.push({date,title,content});

      // 写回 JSONBin
      await fetch(`https://api.jsonbin.io/v3/b/${binId}`,{
        method:'PUT',
        headers:{
          'Content-Type':'application/json',
          'X-Master-Key': masterKey,
          'X-Bin-Versioning':'false'
        },
        body: JSON.stringify(diary)
      });

      return res.status(200).json({message:'Entry added'});
    } catch(e){
      return res.status(500).json({message:'Failed to write diary'});
    }
  }

  res.status(405).json({message:'Method not allowed'});
}
