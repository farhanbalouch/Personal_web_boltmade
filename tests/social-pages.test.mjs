import test from 'node:test';
import assert from 'node:assert/strict';
import { socialHtml, llmsIndex } from '../scripts/build-social-pages.mjs';
const shell='<html><head><title>Old</title><meta property="og:title" content="Old" /><meta property="og:image" content="old.png" /><meta name="twitter:title" content="Old" /><meta name="description" content="Old" /><link rel="canonical" href="https://old.example/" /><script type="module" src="/assets/app.js"></script></head><body><div id="root"></div></body></html>';
test('a non-JavaScript reader receives route-specific canonical metadata and chosen cover',()=>{
 const html=socialHtml(shell,{path:'/blog/a-memory',title:'My memory',description:'A real memory',article:true,images:[{src:'/media/studio/photo.webp',alt:'School photo',width:1200,height:800}]});
 assert.match(html,/<title>My memory<\/title>/);
 assert.match(html,/property="og:image" content="https:\/\/farhanbalouch.com\/media\/studio\/photo.webp"/);
 assert.match(html,/property="og:url" content="https:\/\/farhanbalouch.com\/blog\/a-memory"/);
 assert.match(html,/property="og:type" content="article"/);
 assert.equal((html.match(/property="og:title"/g)||[]).length,1);
 assert.match(html,/src="\/assets\/app.js"/);
 assert.match(html,/href="https:\/\/farhanbalouch.com\/blog\/a-memory.md"/);
});
test('titles, captions and descriptions cannot break out of HTML metadata',()=>{
 const html=socialHtml(shell,{path:'/stories/safe',title:'\"><script>alert(1)</script>',description:'A & B',article:true});
 assert.equal(html.includes('<script>alert(1)</script>'),false);
 assert.match(html,/A &amp; B/);
 assert.match(html,/og-image.png/);
});
test('LLM discovery contains published public writing rather than private drafts or admin pages',()=>{
 const text=llmsIndex('# Farhan Balouch',[{path:'/blog/hello',title:'Hello',description:'A public post',article:true},{path:'/admin',title:'Private',description:'Do not list'}]);
 assert.match(text,/https:\/\/farhanbalouch.com\/blog\/hello.md/);
 assert.equal(text.includes('/admin'),false);assert.equal(text.includes('Private'),false);
});
