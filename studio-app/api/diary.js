import { github, unseal } from './studio.js';

const root = '/repos/muhammadfarhan138223-cmyk/Personal_web_boltmade';
const folder = 'private/memories';
const fail = (status, message) => Object.assign(new Error(message), { status });
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const sha = /^[a-f0-9]{40}$/;

function base64(value, min, max) {
  if (typeof value !== 'string' || value.length > 4 * Math.ceil(max / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  const data = Buffer.from(value, 'base64');
  return data.length >= min && data.length <= max && data.toString('base64') === value;
}

export function envelope(value, max = 1700000) {
  if (!value || Object.keys(value).sort().join(',') !== 'data,iv,version' || value.version !== 1 ||
      !base64(value.iv, 12, 12) || !base64(value.data, 16, max))
    throw fail(400, 'The encrypted memory format is invalid.');
  return { version: 1, iv: value.iv, data: value.data };
}

async function file(token, path) {
  try { return await github(token, root + '/contents/' + path + '?ref=main'); }
  catch (error) { if (error.githubStatus === 404) return null; throw error; }
}

async function decode(token, metadata) {
  if (metadata.size > 2400000) throw fail(413, 'This encrypted memory is too large.');
  const blob = metadata.encoding === 'base64' && metadata.content
    ? metadata
    : await github(token, root + '/git/blobs/' + metadata.sha);
  return JSON.parse(Buffer.from(blob.content, 'base64').toString('utf8'));
}

async function write(token, path, content, revision) {
  try {
    return await github(token, root + '/contents/' + path, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Save encrypted memory',
        branch: 'main',
        content: Buffer.from(JSON.stringify(content)).toString('base64'),
        ...(revision ? { sha: revision } : {}),
      }),
    });
  } catch (error) {
    if (error.githubStatus === 409 || error.githubStatus === 422)
      throw fail(409, 'Another device saved this memory. Your device copy is kept. Refresh the list or save it as a new memory.');
    throw error;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const reply = (status, data) => res.status(status).json(data);
  try {
    if (!['GET', 'POST'].includes(req.method)) throw fail(405, 'Method not allowed.');
    if (req.method === 'POST' && (req.headers.origin !== 'https://' + req.headers.host ||
        !req.headers['content-type']?.startsWith('application/json')))
      throw fail(403, 'Open Memories in your Studio.');
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')));
    const token = unseal(cookies['__Host-farhan-studio']);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (JSON.stringify(body).length > 2450000) throw fail(413, 'Keep the encrypted memory under 2.4 MB.');
    const configFile = await file(token, folder + '/config.json');
    if (req.method === 'GET') {
      const parent = await file(token, folder);
      const directory = Array.isArray(parent) && parent.find(item => item.name === 'entries' && item.type === 'dir');
      const tree = directory ? await github(token, root + '/git/trees/' + directory.sha) : { tree: [] };
      if (tree.truncated) throw fail(503, 'The memory index is incomplete. Try again shortly.');
      return reply(200, {
        config: configFile ? await decode(token, configFile) : null,
        entries: tree.tree.filter(item => item.type === 'blob' && uuid.test(item.path.replace(/\.json$/, '')) && item.path.endsWith('.json'))
          .map(item => ({ id: item.path.slice(0, -5), revision: item.sha, size: item.size })),
      });
    }
    if (body.action === 'initialize') {
      if (configFile) throw fail(409, 'Memories already has a key. Unlock it with your existing passphrase.');
      const config = body.config;
      if (!config || Object.keys(config).sort().join(',') !== 'check,iterations,salt,version' ||
          config.version !== 1 || config.iterations !== 600000 || !base64(config.salt, 16, 16))
        throw fail(400, 'The encryption setup is invalid.');
      const stored = { version: 1, iterations: 600000, salt: config.salt, check: envelope(config.check, 200) };
      await write(token, folder + '/config.json', stored);
      return reply(201, { ok: true });
    }
    if (!configFile) throw fail(409, 'Create your Memories key first.');
    if (!uuid.test(body.id || '')) throw fail(400, 'Choose a valid memory.');
    const path = folder + '/entries/' + body.id + '.json';
    const current = await file(token, path);
    if (body.action === 'read') {
      if (!current) throw fail(404, 'This memory was not found.');
      return reply(200, { ...await decode(token, current), revision: current.sha });
    }
    if (body.action !== 'save') throw fail(400, 'Choose a valid memory action.');
    if (current ? body.revision !== current.sha : body.revision != null)
      throw fail(409, 'A different cloud version exists. Save your device copy as a new memory to keep both.');
    if (body.revision != null && !sha.test(body.revision)) throw fail(400, 'Invalid memory version.');
    const encrypted = envelope(body.envelope);
    const prior = current ? await decode(token, current) : null;
    const now = new Date().toISOString();
    const record = { id: body.id, createdAt: prior?.createdAt || now, updatedAt: now, envelope: encrypted };
    const result = await write(token, path, record, current?.sha);
    return reply(200, { ...record, revision: result.content.sha });
  } catch (error) {
    return reply(error.status || 500, { error: error.status ? error.message : 'Memories could not complete the request. Your device copy is kept.' });
  }
}
