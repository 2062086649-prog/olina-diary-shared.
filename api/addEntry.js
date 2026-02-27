const BIN_ID='69a05d5343b1c97be9a098fd';

const ACCESS_KEY='$2a$10$zY2FY2eA8/eR3a.6U4AHbuEBe4yrd38d5EFrAD1742xPfdcBogCbu';
const MASTER_KEY='$2a$10$zL4T9HjKXwgb4mPCljOxM.RBemOLg8j.MiBnLzB8/8Y7qDOOK9VWO';

const VIEW_PASSWORD='Keira123';
const WRITE_PASSWORD='Keira890';

export default async function handler(req,res){
  try{
    if(req.method==='GET'){
      const url=new URL(req.url,`https://${req.headers.host}`);
      const vp=url.searchParams.get('viewPassword');
      if(vp!==VIEW_PASSWORD) return res.status(401).json({message:'Wrong password'});

      const r=await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,{
        headers:{'X-Access-Key':ACCESS_KEY}
      });
      const j=await r.json();
      return res.status(200).json(j.record.entries||[]);
    }

    if(req.method==='POST'){
      const {password,title,content}=req.body;
      if(password!==WRITE_PASSWORD) return res.status(401).json({message:'Wrong write password'});
      if(!title||!content) return res.status(400).json({message:'Missing fields'});

      const r=await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,{
        headers:{'X-Master-Key':MASTER_KEY}
      });
      const j=await r.json();
      const entries=j.record.entries||[];

      const date=new Date().toLocaleString();
      entries.push({title,content,date});

      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`,{
        method:'PUT',
        headers:{
          'Content-Type':'application/json',
          'X-Master-Key':MASTER_KEY,
          'X-Bin-Versioning':'false'
        },
        body:JSON.stringify({entries})
      });

      return res.status(200).json({message:'Added'});
    }

    res.status(405).json({message:'Method not allowed'});
  }catch(e){
    res.status(500).json({message:'Server error'});
  }
}
