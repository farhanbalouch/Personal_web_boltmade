import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {buildItem} from '../scripts/publish-studio.mjs';
import {callGemini} from '../scripts/publish-blog.mjs';
import {validateLabels} from '../studio-app/server/content-labels.js';
const languages=['en','hi','ur'];
const text=Object.fromEntries(languages.map(lang=>[lang,{title:'A long descriptive article title',shortTitle:'Fear and Action',excerpt:'A source-based introduction',body:[`${lang}: first real point`,`${lang}: another real point`],keywords:['courage']} ]));

test('names-only edits preserve every body, date and photo; new slugs retain old aliases and reject collisions',()=>{
 const existing={slug:'old-long-address',publishedAt:'2026-01-01T10:00:00Z',images:[],translations:text};
 const updated=buildItem({kind:'blog',slug:existing.slug,urlSlug:'fear-action',shortTitle:'Fear & Action',secondaryTitle:'Another descriptive title',metadataOnly:true},text,[existing]);
 assert.equal(updated.slug,'fear-action');assert.deepEqual(updated.aliases,['old-long-address']);assert.equal(updated.publishedAt,existing.publishedAt);
 for(const lang of languages)assert.deepEqual(updated.translations[lang].body,existing.translations[lang].body);
 assert.equal(updated.translations.en.shortTitle,'Fear & Action');assert.equal(updated.translations.hi.shortTitle,text.hi.shortTitle);
 assert.throws(()=>buildItem({kind:'blog',slug:existing.slug,urlSlug:'used'},text,[existing,{slug:'used'}]),/already used/);
 assert.throws(()=>validateLabels({urlSlug:'../../escape'}),/short link/);
 assert.throws(()=>validateLabels({kind:'chapter',slug:'part-1',urlSlug:'new'}),/stay fixed/);
 const chapter={slug:'part-1',part:1,translations:Object.fromEntries(languages.map(lang=>[lang,{title:'Original',paragraphs:['Original one','Original two'],moral:'Original moral',subtitle:'Original subtitle'}]))};
 const preserved=buildItem({kind:'chapter',slug:'part-1',metadataOnly:true,shortTitle:'A new name'},chapter.translations,[chapter]);
 assert.deepEqual(preserved.translations.en.paragraphs,chapter.translations.en.paragraphs);assert.equal(preserved.translations.en.moral,'Original moral');
});

test('source coverage is required in every language; incomplete model output cannot be published',async()=>{
 const previous=globalThis.fetch,key=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='synthetic-only';
 let coverage=Object.fromEntries(languages.map(lang=>[lang,['S1','S2','S3']])),finishReason='STOP',sent;
 globalThis.fetch=async(_url,request)=>{sent=JSON.parse(request.body);return Response.json({candidates:[{finishReason,content:{parts:[{text:JSON.stringify({...text,coverage})}]}}]});};
 try{
  const result=await callGemini('First event\nSecond detail\nFinal conclusion');assert.deepEqual(Object.keys(result).sort(),languages.slice().sort());
  assert.match(sent.contents[0].parts[0].text,/\[S3\] Final conclusion/);assert.doesNotMatch(sent.systemInstruction.parts[0].text,/Use 2-6 short paragraphs|up to 2 reader questions/);
  coverage.en=['S1','S3'];await assert.rejects(callGemini('First event\nSecond detail\nFinal conclusion'),/every source line/);
  finishReason='MAX_TOKENS';await assert.rejects(callGemini('A source note'),/incomplete/);
 }finally{globalThis.fetch=previous;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key;}
});

test('reading keeps all supported questions, exposes a moral, and every old blog address redirects',async()=>{
 const bundle=await build({entryPoints:['src/lib/article-reading.ts'],bundle:true,write:false,platform:'node',format:'esm'});
 const {readingContent}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
 const questions=Array.from({length:8},(_,i)=>({question:`Question ${i}?`,answer:`Answer ${i}.`}));
 const result=readingContent('synthetic',{...text.en,moral:'A grounded lesson.',editorial:{questions}},'en');
 assert.equal(result.questions.length,8);assert.equal(result.moral,'A grounded lesson.');
 const posts=JSON.parse(await readFile('src/data/blog-posts.json','utf8')),config=JSON.parse(await readFile('vercel.json','utf8'));
 for(const post of posts){assert.ok(post.translations.en.shortTitle);for(const alias of post.aliases||[])assert.ok(config.redirects.some(r=>r.source==='/blog/'+alias&&r.destination==='/blog/'+post.slug&&r.permanent));}
});
