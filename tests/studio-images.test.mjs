import test from 'node:test';
import assert from 'node:assert/strict';
import { buildItem } from '../scripts/publish-studio.mjs';
const image = {src: '/media/studio/' + 'a'.repeat(32) + '.webp',alt:'A memory',caption:'An actual school day',width:1200,height:800};
const translations=Object.fromEntries(['en','hi','ur'].map(lang=>[lang,{title:'A memory',excerpt:'Some context',body:['A paragraph.'],keywords:[]} ]));
test('publishing attaches the exact chosen media, preserves it for old clients, and allows removal',()=>{
 for(const kind of ['blog','story','project','chapter']){
  const existing={slug:'original',publishedAt:'2026-01-01',part:3,translations,images:[image]};
  const request={kind,slug:'original'};
  assert.deepEqual(buildItem(request,translations,[existing]).images,[image]);
  assert.deepEqual(buildItem({...request,images:[]},translations,[existing]).images,[]);
  const changed={...image,caption:'Updated caption'};
  assert.deepEqual(buildItem({...request,images:[changed]},translations,[existing]).images,[changed]);
 }
});
test('AI output cannot invent or replace uploaded photos and invalid source URLs fail',()=>{
 const generated={...translations,images:[{src:'https://evil.example/track.png'}]};
 assert.equal(buildItem({kind:'blog'},generated,[]).images,undefined);
 assert.throws(()=>buildItem({kind:'story',images:[{...image,src:'https://evil.example/track.png'}]},translations,[]));
});
