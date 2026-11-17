import { unseal } from './studio.js';

const REPO = 'farhanbalouch/Personal_web_boltmade';
const PATH = 'src/data/projects.json';
const COOKIE = '__Host-farhan-studio';
const fail = (status, message) => Object.assign(new Error(message), { status });
const allowedStatus = new Set(['live', 'coming-soon', 'preview', 'placeholder']);
const allowedIcon = new Set(['bot', 'book', 'store', 'shield', 'film']);
const allowedTemplate = new Set(['aurora', 'glass', 'editorial', 'minimal']);

function tokenFrom(req) {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map(part => {
    const [name, ...value] = part.trim().split('=');
    return [name, value.join('=')];
  }));
  return unseal(cookies[COOKIE]);
}

async function github(token, path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    if (response.status === 401) throw fail(401, 'GitHub session expired. Sign in to Studio again.');
    throw fail(response.status === 403 || response.status === 404 ? 403 : 502, `GitHub could not access project settings (HTTP ${response.status}). Check the repository Contents read/write permission.`);
  }
  return response.status === 204 ? null : response.json();
}

function validateProject(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw fail(400, 'Project details are missing.');
  const text = (key, max, required = false) => {
    const value = input[key] == null ? '' : String(input[key]).trim();
    if (required && !value) throw fail(400, `Add a project ${key}.`);
    if (value.length > max) throw fail(400, `Project ${key} is too long (maximum ${max} characters).`);
    return value || null;
  };
  const slug = text('slug', 80, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw fail(400, 'Use a simple lowercase project address, such as saras-city.');
  const status = input.status;
  if (!allowedStatus.has(status)) throw fail(400, 'Choose a valid project status.');
  const icon = input.icon;
  if (!allowedIcon.has(icon)) throw fail(400, 'Choose a valid project icon.');
  const template = input.template || 'aurora';
  if (!allowedTemplate.has(template)) throw fail(400, 'Choose one of the saved project templates.');
  const url = (key, required = false) => {
    const value = text(key, 500, required);
    if (value) { let parsed; try { parsed = new URL(value); } catch { throw fail(400, `Enter a complete https:// address for ${key}.`); }
      if (parsed.protocol !== 'https:') throw fail(400, `Only secure https:// addresses are accepted for ${key}.`); }
    return value;
  };
  const features = Array.isArray(input.features) ? input.features.map(v => String(v).trim()).filter(Boolean).slice(0, 10) : [];
  if (features.some(v => v.length > 100)) throw fail(400, 'Keep each feature under 100 characters.');
  const keywords = Array.isArray(input.keywords) ? input.keywords.map(v => String(v).trim()).filter(Boolean).slice(0, 10) : [];
  if (keywords.some(v => v.length > 60)) throw fail(400, 'Keep each search phrase under 60 characters.');
  const releaseDate = text('releaseDate', 10);
  if (releaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) throw fail(400, 'Use YYYY-MM-DD for a project date.');
  const result = {
    slug, title: text('title', 100, true), category: text('category', 100, true),
    tagline: text('tagline', 180, true), description: text('description', 1500, true),
    seoTitle: text('seoTitle', 65), seoDescription: text('seoDescription', 200), keywords,
    features, link: url('link'), displayUrl: text('displayUrl', 200),
    cta: text('cta', 80, true), status, icon, template,
    logo: text('logo', 500), secondaryLink: url('secondaryLink'), secondaryCta: text('secondaryCta', 80),
    ...(releaseDate ? { releaseDate, releaseLabel: text('releaseLabel', 60) || 'Added to portfolio' } : {}),
    ...(Number.isInteger(Number(input.featuredOrder)) && Number(input.featuredOrder) > 0 ? { featuredOrder: Number(input.featuredOrder) } : {}),
    ...(input.spotlight === true ? { spotlight: true } : {}), ...(input.showcase === true ? { showcase: true } : {}),
  };
  return result;
}

function safeConversation(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-8).filter(item => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string')
    .map(item => ({ role: item.role, content: item.content.slice(0, 1600) }));
}

async function askProjectAi(body) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const secret = process.env.CLOUDFLARE_WORKERS_AI_TOKEN?.trim();
  if (!/^[a-f0-9]{32}$/i.test(account || '') || !secret) throw fail(503, 'Project AI needs the Cloudflare Workers AI account ID and token configured for the Studio project.');
  if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 1600) throw fail(400, 'Write a project question or instruction up to 1,600 characters.');
  const system = `You are Farhan's private project setup assistant inside Creator Studio. Discuss ideas in concise, beginner-friendly language. Help create professional, truthful portfolio copy and suggest a fitting saved visual template. Do not invent releases, capabilities, metrics, links, or confirmed launch dates. Keep unknown facts unknown. Never publish or claim you published. Return only valid JSON with keys reply (short string) and project (complete project object). The object keys must be slug,title,category,tagline,description,seoTitle,seoDescription,keywords,features,link,displayUrl,cta,status,icon,template,logo,secondaryLink,secondaryCta,releaseDate,releaseLabel,featuredOrder,spotlight,showcase. Valid status: live, coming-soon, preview, placeholder. Valid icon: bot, book, store, shield, film. Valid template: aurora, glass, editorial, minimal. Preserve existing project fields and links unless Farhan explicitly asks to change them. For a new project, fill copy from facts supplied and leave unknown URLs empty. SEO title should be concise and accurate; SEO description should be clear, natural and non-spammy; keywords should be only a few factual search phrases. If discussing without a change, return the current object unchanged. Feature list must be an array of short strings. If data is missing, ask in reply rather than guessing.`;
  const prompt = [{ role: 'system', content: system }, { role: 'system', content: `Current project draft:\n${JSON.stringify(body.project || {})}` }, ...safeConversation(body.messages), { role: 'user', content: body.message.trim() }];
  const models = ['@cf/qwen/qwen3.8-27b', '@cf/meta/llama-3.3-70b-instruct-fp8-fast'];
  let lastStatus = 502;
  for (const model of models) {
    let response;
    try {
      response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
        method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: prompt, max_tokens: 1500, temperature: 0.35 }),
        signal: AbortSignal.timeout(18000),
      });
    } catch { continue; }
    const data = await response.json().catch(() => null);
    if (response.status === 401 || response.status === 403) throw fail(503, 'Cloudflare AI denied access. Check the account ID and Workers AI token permissions.');
    if (response.status === 402) throw fail(429, 'This AI model needs paid access. The app will not switch to a paid model.');
    const errors = JSON.stringify(data?.errors || []);
    if (/daily|quota|allocation|neuron/i.test(errors)) throw fail(429, 'Cloudflare free AI usage is temporarily exhausted. Your project draft is safe; try after the daily reset.');
    if (!response.ok) { lastStatus = response.status; continue; }
    const answer = data?.result?.response;
    if (typeof answer !== 'string' || !answer.trim()) continue;
    let parsed;
    try { const clean = answer.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''); parsed = JSON.parse(clean); }
    catch { const match = answer.match(/\{[\s\S]*\}/); if (match) try { parsed = JSON.parse(match[0]); } catch { /* show reply without applying a project */ } }
    if (parsed && typeof parsed.reply === 'string') {
      let project = null;
      if (parsed.project && typeof parsed.project === 'object') { try { project = validateProject(parsed.project); } catch { project = null; } }
      return { reply: parsed.reply.slice(0, 1400), project, model };
    }
    return { reply: answer.slice(0, 1400), project: null, model };
  }
  throw fail(lastStatus === 429 ? 429 : 502, 'Project AI is busy. Your form remains available; try again or edit it manually.');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (!['GET', 'POST'].includes(req.method)) throw fail(405, 'Use GET or POST.');
    if (req.method === 'POST' && (req.headers.origin !== `https://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json'))) throw fail(403, 'Open project settings inside Creator Studio.');
    const token = tokenFrom(req);
    if (req.method === 'GET') {
      const file = await github(token, `/repos/${REPO}/contents/${PATH}?ref=main`);
      return res.status(200).json(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')));
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (JSON.stringify(body).length > 25000) throw fail(413, 'Project request is too large.');
    if (body.action === 'ai') return res.status(200).json(await askProjectAi(body));
    if (body.action !== 'publish') throw fail(400, 'Unknown project action.');
    const project = validateProject(body.project);
    const filePath = `/repos/${REPO}/contents/${PATH}`;
    const existing = await github(token, `${filePath}?ref=main`);
    const projects = JSON.parse(Buffer.from(existing.content, 'base64').toString('utf8'));
    if (!Array.isArray(projects)) throw fail(502, 'The website project list has an unexpected format.');
    const originalSlug = typeof body.originalSlug === 'string' ? body.originalSlug : project.slug;
    const position = projects.findIndex(item => item.slug === originalSlug);
    if (body.mode === 'create' && position >= 0) throw fail(409, 'That project address already exists. Open it from the list to edit.');
    if (body.mode === 'update' && position < 0) throw fail(404, 'That project was removed from the website list. Refresh Projects and try again.');
    if (position < 0) projects.push(project); else projects[position] = project;
    const result = await github(token, filePath, { method: 'PUT', body: JSON.stringify({
      message: `${position < 0 ? 'Add' : 'Update'} portfolio project: ${project.title}`,
      content: Buffer.from(JSON.stringify(projects, null, 2) + '\n').toString('base64'),
      branch: 'main', sha: existing.sha,
    }) });
    return res.status(200).json({ ok: true, project, commit: result.commit?.sha, message: 'Project saved to the website repository. Vercel is building the update now.' });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.status ? error.message : 'Could not save project settings. Try again.' });
  }
}
