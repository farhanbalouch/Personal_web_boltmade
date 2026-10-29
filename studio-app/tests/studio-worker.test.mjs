import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function worker({ offline = false, failAsset = false } = {}) {
  const listeners = {}, stored = new Map(), requested = [];
  let skipped = false;
  const cache = {
    put: async (key, value) => stored.set(key, value),
    addAll: async (keys) => {
      requested.push(...keys);
      if (failAsset) throw new Error('Asset unavailable');
    },
  };
  const self = {
    location: { origin: 'https://studio.example' },
    addEventListener: (name, handler) => { listeners[name] = handler; },
    clients: { claim: async () => {} },
    skipWaiting: async () => { skipped = true; },
  };
  const caches = { open: async () => cache, keys: async () => [], match: async (key) => stored.get(key) };
  const fetch = async () => {
    if (offline) throw new Error('Offline');
    return new Response('<html><script src="/assets/app.js"></script><link href="/assets/app.css" rel="stylesheet"></html>', {headers: {'Content-Type': 'text/html'}});
  };
  vm.runInNewContext(await readFile('public/sw.js', 'utf8'), {self, caches, fetch, URL, Response, Set});
  return {listeners, stored, requested, skipped: () => skipped};
}
test('first installation precaches launch document and its initial JS/CSS', async () => {
  const w = await worker();
  let work;
  w.listeners.install({waitUntil: (p) => { work = p; }});
  await work;
  assert.ok(w.stored.has('/admin/'));
  assert.ok(w.requested.includes('/assets/app.js'));
  assert.ok(w.requested.includes('/assets/app.css'));
  assert.equal(w.skipped(), true);
});
test('an incomplete offline shell does not activate over the existing worker', async () => {
  const w = await worker({failAsset: true});
  let work;
  w.listeners.install({waitUntil: (p) => { work = p; }});
  await assert.rejects(work, /Asset unavailable/);
  assert.equal(w.skipped(), false);
});
test('private API data and every POST bypass worker caching', async () => {
  const w = await worker();
  for (const request of [
    {method: 'GET', url: 'https://studio.example/api/studio', mode: 'cors'},
    {method: 'POST', url: 'https://studio.example/api/studio', mode: 'cors'},
    {method: 'GET', url: 'https://other.example/assets/x.js', mode: 'cors'},
  ]) w.listeners.fetch({request, respondWith: () => assert.fail('Private request intercepted')});
  assert.equal(w.stored.size, 0);
});
test('offline launch returns cached login shell rather than a blank page', async () => {
  const w = await worker({offline: true});
  w.stored.set('/admin/', new Response('Password screen'));
  let response;
  w.listeners.fetch({request: {method: 'GET', url: 'https://studio.example/admin/', mode: 'navigate'}, respondWith: (p) => { response = p; }});
  assert.equal(await (await response).text(), 'Password screen');
});
