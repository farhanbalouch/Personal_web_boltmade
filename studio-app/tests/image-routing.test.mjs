import test from 'node:test';
import assert from 'node:assert/strict';
import {createImagePreview} from '../server/image-ai.js';
const image='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQioAAAAASUVORK5CYII=';
test('free-eligible model fallback changes models; quota, authentication and moderation never trigger bypass attempts',async()=>{
 const prior=globalThis.fetch,account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_WORKERS_AI_TOKEN;
 process.env.CLOUDFLARE_ACCOUNT_ID='a'.repeat(32);process.env.CLOUDFLARE_WORKERS_AI_TOKEN='synthetic-only';
 let urls=[],scenario='busy';
 globalThis.fetch=async(url)=>{urls.push(url);if(scenario==='busy'&&urls.length===1)return Response.json({success:false},{status:503});
  if(scenario==='quota')return Response.json({success:false,errors:[{code:3036}]},{status:429});
  if(scenario==='policy')return Response.json({success:false,errors:[{message:'Safety policy rejected'}]},{status:400});
  if(scenario==='auth')return Response.json({success:false},{status:403});
  return Response.json({success:true,result:{image}});
 };
 try{
  const result=await createImagePreview({mode:'generate',topic:'A synthetic creative workspace'});assert.equal(result.fallback,true);assert.equal(result.model,'flux-2-klein-4b');assert.equal(urls.length,2);assert.match(urls[0],/flux-1-schnell$/);
  for(const value of ['quota','policy','auth']){scenario=value;urls=[];await assert.rejects(createImagePreview({mode:'generate',topic:'Synthetic image'}));assert.equal(urls.length,1);}
 }finally{globalThis.fetch=prior;if(account===undefined)delete process.env.CLOUDFLARE_ACCOUNT_ID;else process.env.CLOUDFLARE_ACCOUNT_ID=account;if(token===undefined)delete process.env.CLOUDFLARE_WORKERS_AI_TOKEN;else process.env.CLOUDFLARE_WORKERS_AI_TOKEN=token;}
});
