import test from 'node:test';import assert from 'node:assert/strict';import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {readFile} from 'node:fs/promises';
test('generated knowledge includes every published paragraph and real section address, excluding private routes',async()=>{
 await promisify(execFile)(process.execPath,['scripts/build-site-knowledge.mjs']);
 const k=JSON.parse(await readFile('public/site-knowledge.json','utf8'));
 assert.equal(k.version,1);assert.ok(k.generatedAt);assert.ok(k.entries.some(e=>e.url==='https://farhanbalouch.com/#movie-hub'));
 assert.ok(k.entries.every(e=>!/^https:\/\/farhanbalouch.com\/(?:admin|api)(?:\/|$)/.test(e.url)));
 for(const [route,file]of [['blog','blog-posts'],['stories','stories'],['story','story-chapters']]){
  const items=JSON.parse(await readFile(`src/data/${file}.json`,'utf8'));
  for(const item of items)for(const [lang,t]of Object.entries(item.translations)){
   const entry=k.entries.find(e=>e.id===`${route}-${item.slug}-${lang}`);assert.ok(entry);
   for(const p of t.body||t.paragraphs||[])assert.ok(entry.text.includes(p));
  }
 }
});
