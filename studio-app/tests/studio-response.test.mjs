import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseStudioResponse } from '../src/lib/studio-response.ts';
test('HTML security responses have an actionable message instead of a JSON syntax error', async () => {
 const response = new Response('<!DOCTYPE html><title>Just a moment...</title>', {status:403,headers:{'Content-Type':'text/html','cf-mitigated':'challenge'}});
 await assert.rejects(parseStudioResponse(response), e => e.code === 'NON_JSON_RESPONSE' && e.status === 403 && /browser check/.test(e.message) && !/Unexpected token/.test(e.message));
});
test('JSON login errors preserve the real status and reason', async () => {
 await assert.rejects(parseStudioResponse(new Response(JSON.stringify({error:'Token expired'}),{status:401})),e=>e.status===401 && e.message==='Token expired');
 assert.deepEqual(await parseStudioResponse(new Response('{"ok":true}')),{ok:true});
});
test('dedicated app covers its origin, preserves identity and has standalone icons', async () => {
 const manifest=JSON.parse(await readFile('public/admin/manifest.webmanifest','utf8'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'/');assert.equal(manifest.id,'/admin/');assert.equal(manifest.prefer_related_applications,false);assert.ok(manifest.start_url.startsWith(manifest.scope));
 for(const icon of manifest.icons){const file=await readFile('public'+icon.src);assert.equal(file.subarray(1,4).toString(),'PNG');}
 assert.ok(manifest.icons.some(i=>i.sizes==='192x192'));assert.ok(manifest.icons.some(i=>i.sizes==='512x512' && i.purpose==='maskable'));
});

