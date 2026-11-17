import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, webcrypto } from 'node:crypto';
import { build } from 'esbuild';
import handler from '../api/diary.js';
import { seal } from '../api/studio.js';
const { outputFiles } = await build({ entryPoints: ['src/lib/memories-crypto.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { createConfig, encrypt, decrypt, unlockConfig, memoryContext } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
if (!globalThis.crypto) globalThis.crypto = webcrypto;
process.env.ADMIN_SESSION_SECRET = randomBytes(48).toString('hex');
process.env.ADMIN_PASSWORD = 'test-only-owner-password';
process.env.STUDIO_GITHUB_TOKEN = 'github_pat_only_a_synthetic_test';
const phrase = 'synthetic-test-memories-key';
const created = await createConfig(phrase);
const key = created.key, config = created.config;

test('separate passphrase unlocks across devices; plaintext, photos and key never appear in the stored envelope', async () => {
  const id = randomUUID(), value = { title: 'Synthetic moment', text: 'Synthetic private text', happenedAt: '2026-11-01T08:30:00', photos: [{ data: randomBytes(300).toString('base64'), caption: 'Synthetic photo' }] };
  const envelope = await encrypt(key, value, memoryContext(id));
  assert.equal(key.extractable, false);
  const serialized = JSON.stringify(envelope);
  for (const secret of [phrase, value.title, value.text, value.photos[0].data, value.photos[0].caption]) assert.equal(serialized.includes(secret), false);
  const otherDevice = await unlockConfig(phrase, config);
  assert.deepEqual(await decrypt(otherDevice, envelope, memoryContext(id)), value);
  await assert.rejects(unlockConfig('a-different-test-passphrase', config));
  await assert.rejects(decrypt(otherDevice, envelope, memoryContext(randomUUID())));
  const bytes = Buffer.from(envelope.data, 'base64'); bytes[0] ^= 1;
  await assert.rejects(decrypt(otherDevice, { ...envelope, data: bytes.toString('base64') }, memoryContext(id)));
  const again = await encrypt(key, value, memoryContext(id)); assert.notEqual(again.iv, envelope.iv);
});

function response() {
  return { code: 0, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
}
const host = 'studio.example.test';
function req(body, options = {}) { return { method: body ? 'POST' : 'GET', body, headers: { host, origin: 'https://' + host, 'content-type': 'application/json', cookie: '__Host-farhan-studio=' + seal(), ...options } }; }
const path = '/repos/farhanbalouch/Personal_web_boltmade';
test('authenticated encrypted cloud lifecycle protects timestamps, multiple entries and concurrent-device edits', async () => {
  const actualFetch = globalThis.fetch, files = new Map(), blobs = new Map(); let writes = 0, largeBlobReads = 0;
  const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  globalThis.fetch = async (url, options = {}) => {
    const u = new URL(url), endpoint = u.pathname.slice(path.length);
    assert.equal(u.host, 'api.github.com');
    assert.equal(options.headers.Authorization, 'Bearer ' + process.env.STUDIO_GITHUB_TOKEN);
    if (endpoint.startsWith('/contents/')) {
      const name = endpoint.slice('/contents/'.length);
      if (options.method === 'PUT') {
        const body = JSON.parse(options.body), old = files.get(name);
        if (old ? old.sha !== body.sha : body.sha) return json({}, 409);
        const content = Buffer.from(body.content, 'base64').toString();
        assert.equal(content.includes(phrase), false); assert.equal(content.includes('Synthetic private text'), false);
        const sha = (++writes).toString(16).padStart(40, '0');
        files.set(name, { content, sha }); blobs.set(sha, content);
        return json({ content: { sha } }, 201);
      }
      if (name === 'private/memories') return files.size ? json([{ name: 'entries', type: 'dir', sha: 'entries-tree' }]) : json({}, 404);
      const found = files.get(name); if (!found) return json({}, 404);
      const large = found.content.length > 1000000;
      return json({ sha: found.sha, size: found.content.length, encoding: large ? 'none' : 'base64', content: large ? '' : Buffer.from(found.content).toString('base64') });
    }
    if (endpoint === '/git/trees/entries-tree') return json({ tree: [...files].filter(([name]) => name.includes('/entries/')).map(([name, value]) => ({ type: 'blob', path: name.split('/').pop(), sha: value.sha, size: value.content.length })) });
    if (endpoint.startsWith('/git/blobs/')) { largeBlobReads++; return json({ content: Buffer.from(blobs.get(endpoint.split('/').pop())).toString('base64') }); }
    throw new Error('Unexpected repository operation: ' + endpoint);
  };
  try {
    let r = response(); await handler(req(undefined, { cookie: '' }), r); assert.equal(r.code, 401); assert.equal(writes, 0); assert.equal(r.headers['Cache-Control'], 'no-store');
    r = response(); await handler(req({ action: 'initialize', config }, { origin: 'https://other.example' }), r); assert.equal(r.code, 403);
    r = response(); await handler(req({ action: 'initialize', config }), r); assert.equal(r.code, 201);
    r = response(); await handler(req({ action: 'initialize', config }), r); assert.equal(r.code, 409);
    const id = randomUUID(), value = { title: 'Synthetic moment', text: 'Synthetic private text', photos: [], happenedAt: '2026-11-01T08:30:00' };
    const envelope = await encrypt(key, value, memoryContext(id));
    r = response(); await handler(req({ action: 'save', id, revision: null, envelope, createdAt: '1900-01-01' }), r); assert.equal(r.code, 200); const first = r.data;
    assert.ok(first.createdAt.startsWith('20')); assert.notEqual(first.createdAt, '1900-01-01'); assert.equal(first.createdAt, first.updatedAt);
    const secondId = randomUUID(); r = response(); await handler(req({ action: 'save', id: secondId, revision: null, envelope: await encrypt(key, { ...value, title: 'Another moment' }, memoryContext(secondId)) }), r); assert.equal(r.code, 200);
    r = response(); await handler(req(), r); assert.equal(r.data.entries.length, 2); assert.deepEqual(r.data.config, config);
    r = response(); await handler(req({ action: 'save', id, revision: null, envelope }), r); assert.equal(r.code, 409);
    r = response(); await handler(req({ action: 'save', id, revision: first.revision, envelope }), r); assert.equal(r.code, 200); assert.equal(r.data.createdAt, first.createdAt); assert.notEqual(r.data.revision, first.revision);
    r = response(); await handler(req({ action: 'save', id, revision: first.revision, envelope }), r); assert.equal(r.code, 409);
    r = response(); await handler(req({ action: 'read', id: '../../public/leak' }), r); assert.equal(r.code, 400);
    r = response(); await handler(req({ action: 'save', id: randomUUID(), revision: null, envelope: { ...envelope, title: value.title } }), r); assert.equal(r.code, 400);
    const largeId = randomUUID(), largeValue = { ...value, photos: [{ data: randomBytes(650000).toString('base64') }] };
    r = response(); await handler(req({ action: 'save', id: largeId, revision: null, envelope: await encrypt(key, largeValue, memoryContext(largeId)) }), r); assert.equal(r.code, 200);
    r = response(); await handler(req({ action: 'read', id: largeId }), r); assert.equal(r.code, 200); assert.equal(largeBlobReads, 1); assert.deepEqual(await decrypt(key, r.data.envelope, memoryContext(largeId)), largeValue);
    assert.ok([...files.keys()].every(name => name.startsWith('private/memories/')));
  } finally { globalThis.fetch = actualFetch; }
});
