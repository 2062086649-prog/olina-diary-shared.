export default async function handler(req,res){
  const binId='69a05d5343b1c97be9a098fd';
  const masterKey='$2a$10$zL4T9HjKXwgb4mPCljOxM.RBemOLg8j.MiBnLzB8/8Y7qDOOK9VWO';
  const accessKey='$2a$10$zY2FY2eA8/eR3a.6U4AHbuEBe4yrd38d5EFrAD1742xPfdcBogCbu';

  try{
    // GET: 读取日记
    if(req.method==='GET'){
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: {'X-Master-Key':accessKey}
      });
      const json = await getRes.json();
      return res.status(200).json(json.record || []);
    }

    // POST: 添加日记
    if(req.method==='POST'){
      const {password,title,content} = req.body;
      if(password !== 'Olina123') return res.status(401).json({message:'Wrong password'});

      // 获取现有数据
      const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers:{'X-Master-Key':accessKey}
      });
      const json = await getRes.json();
      const diary = json.record || [];

      const today = new Date();
      const date = today.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

      diary.push({date,title,content});

      // 写回 JSONBin
      await fetch(`https://api.jsonbin.io/v3/b/${binId}`,{
        method:'PUT',
        headers:{
          'Content-Type':'application/json',
          'X-Master-Key':masterKey,
          'X-Bin-Versioning':'false'
        },
        body: JSON.stringify(diary)
      });

      return res.status(200).json({message:'Entry added'});
    }

    return res.status(405).json({message:'Method not allowed'});
  }catch(err){
    return res.status(500).json({message:err.message});
  }
}
