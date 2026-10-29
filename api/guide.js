const limits=new Map();
function allow(req){const now=Date.now();for(const [key,value]of limits)if(value.until<now)limits.delete(key);const ip=(req.headers['x-forwarded-for']||'unknown').split(',')[0];let bucket=limits.get(ip);if(!bucket){if(limits.size>2000)limits.delete(limits.keys().next().value);bucket={count:0,until:now+60000};limits.set(ip,bucket);}return ++bucket.count<=15;}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Use POST.'});
 if(req.headers.origin!==`https://${req.headers.host}`||!req.headers['content-type']?.startsWith('application/json'))return res.status(403).json({error:'Open the guide on this website.'});
 if(!allow(req))return res.status(429).json({error:'Please wait a minute before asking more questions.'});
 const body=req.body||{};
 if(typeof body.message!=='string'||!body.message.trim()||body.message.length>800)return res.status(400).json({error:'Ask a question up to 800 characters.'});
 try{
  const response=await fetch('https://balouch-ai.vercel.app/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:body.message,mode:'quick',page:typeof body.page==='string'?body.page.slice(0,200):'/',language:body.language}),signal:AbortSignal.timeout(55000)});
  const data=await response.json();
  if(!response.ok)return res.status(503).json({error:'The AI guide is busy. Try again in a moment.'});
  return res.status(200).json({reply:data.reply,sources:data.sources||[],indexedAt:data.indexedAt,verifiedExcerpt:data.verifiedExcerpt===true});
 }catch(error){console.warn('Site guide connection failed',error?.name,error?.cause?.code||'');return res.status(503).json({error:'The AI guide could not connect. Please try again.'});}
}
