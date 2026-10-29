import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';

const source = Object.fromEntries(await Promise.all(['studioPwa', 'installDiagnostics'].map(async name => [name, ts.transpileModule(await readFile(`src/lib/${name}.ts`, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText])));
const manifest = JSON.parse(await readFile('public/manifest.webmanifest', 'utf8'));
function browser({ badIcon = false, invalidManifest = false, related = [] } = {}) {
  const listeners = new Map();
  const win = {
    isSecureContext: true,
    addEventListener: (name, handler) => listeners.set(name, handler),
    dispatchEvent: event => listeners.get(event.type)?.(event),
    matchMedia: () => ({matches: false}),
  };
  const requests = [];
  const worker = {state: 'activated', scriptURL: 'https://studio.example/sw.js', postMessage() {}};
  const nav = {
    userAgent: 'Mozilla/5.0 (Linux; Android 11) Chrome/150.0.0.0',
    serviceWorker: {controller: worker, register: async () => ({active: worker, scope: 'https://studio.example/'}), getRegistrations: async () => []},
    getInstalledRelatedApps: async () => related,
  };
  const globals = {
    window: win, navigator: nav, location: {origin: 'https://studio.example', href: 'https://studio.example/admin/?private_note=do-not-copy', protocol: 'https:'},
    isSecureContext: true, URL, Event, AbortSignal, setTimeout, clearTimeout,
    caches: {match: async () => new Response('login shell')},
    document: {
      cookie: 'owner_password=do-not-copy',
      querySelector: selector => selector === 'link[rel="manifest"]' ? {href: 'https://studio.example/manifest.webmanifest'} : {setAttribute() {}},
    },
    fetch: async (url, options) => {
      requests.push({url: String(url), options});
      if (String(url).endsWith('/manifest.webmanifest')) return invalidManifest ? new Response('<html>not a manifest</html>') : Response.json(manifest);
      return badIcon ? new Response('unavailable', {status: 403}) : new Response(String(url).includes('192') ? '192' : '512', {headers: {'Content-Type': 'image/png'}});
    },
    createImageBitmap: async blob => {const size = Number(await blob.text()); return {width: size, height: size, close() {}};},
  };
  function load(name, dependencies = {}) {
    const module = {exports: {}};
    vm.runInNewContext(source[name], {...globals, module, exports: module.exports, require: path => dependencies[path]});
    return module.exports;
  }
  const pwa = load('studioPwa');
  const diagnostics = load('installDiagnostics', {'./studioPwa': pwa});
  return {pwa, diagnostics, requests, emit: (name, event = {}) => listeners.get(name)?.(event)};
}

test('an accepted prompt and appinstalled event never prove an Android app exists', async () => {
  const b = browser();
  b.emit('beforeinstallprompt', {preventDefault() {}, prompt: async () => {}, userChoice: Promise.resolve({outcome: 'accepted'})});
  assert.equal(await b.pwa.promptInstall(), true);
  b.emit('appinstalled');
  assert.equal(b.pwa.installed(), false);
  assert.equal(b.pwa.installAvailable(), false);
  const report = await b.diagnostics.collectInstallReport();
  assert.equal(report.installedApp, 'not-reported');
  assert.match(report.summary, /has not been confirmed/);
});

test('a self-related app can be detected without inspecting unrelated apps', async () => {
  const b = browser({related: [{platform: 'webapp', url: 'https://studio.example/manifest.webmanifest'}]});
  const report = await b.diagnostics.collectInstallReport();
  assert.equal(report.installedApp, 'detected');
  assert.match(report.summary, /reports Studio installed/);
  assert.equal(manifest.related_applications[0].url, '/manifest.webmanifest');
  assert.equal(manifest.prefer_related_applications, false);
});

test('a served icon failure identifies the broken website boundary', async () => {
  const b = browser({badIcon: true});
  const report = await b.diagnostics.collectInstallReport();
  assert.ok(report.checks.some(c => c.status === 'fail' && /HTTP 403/.test(c.detail)));
  assert.match(report.summary, /website check failed/);
});

test('invalid manifest JSON is reported and report requests never send owner credentials', async () => {
  const b = browser({invalidManifest: true});
  const report = await b.diagnostics.collectInstallReport();
  assert.ok(report.checks.some(c => c.status === 'fail' && c.name.includes('Manifest')));
  assert.equal(JSON.stringify(report).includes('do-not-copy'), false);
  for (const request of b.requests) {
    assert.equal(new URL(request.url).origin, 'https://studio.example');
    assert.equal(request.options.credentials, 'omit');
    assert.equal(new URL(request.url).pathname.startsWith('/api/'), false);
  }
});

test('a different app or browser completion without a matching package stays unconfirmed', async () => {
  const b = browser({related: [{platform: 'webapp', url: 'https://other.example/manifest.webmanifest'}, {platform: 'play', id: 'unrelated'}]});
  b.emit('appinstalled');
  const report = await b.diagnostics.collectInstallReport();
  assert.equal(report.installedApp, 'not-reported');
  assert.match(report.summary, /has not been confirmed/);
});


test('the install UI does not replace an accepted browser handoff with an installed checkmark', async () => {
  const states = [], effects = [], listeners = new Map();
  let hook = 0;
  const react = {
    useState(value) { const index=hook++; states[index]=typeof value==='function'?value():value; return [states[index], next => {states[index]=next;}]; },
    useRef: () => ({current:null}),
    useEffect: callback => effects.push(callback),
  };
  const module = {exports:{}};
  const code = ts.transpileModule(await readFile('src/components/StudioInstall.tsx','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const noop = () => {};
  const pwa = {installed:()=>false,installAvailable:()=>false};
  vm.runInNewContext(code, {
    module,exports:module.exports,URLSearchParams,location:{search:''},
    window:{addEventListener:(name,cb)=>listeners.set(name,cb),matchMedia:()=>({addEventListener:noop})},
    require: name => name==='react'?react:name==='react/jsx-runtime'?{jsx:noop,jsxs:noop}:name.includes('studioPwa')?pwa:{},
  });
  module.exports.StudioInstall();
  effects.forEach(effect=>effect());
  listeners.get('studio-installed')();
  assert.equal(states[0],false);
});
