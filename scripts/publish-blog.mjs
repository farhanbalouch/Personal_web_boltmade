// scripts/publish-blog.mjs
//
// Reads any new raw notes from content/drafts/, asks Gemini to turn each
// one into a polished English blog post (SEO title, keywords, excerpt,
// body paragraphs), writes it into src/data/blog-posts.json with an
// automatic date/time, appends the URL to public/sitemap.xml, and moves
// the processed draft out of content/drafts/ so it isn't reprocessed.
//
// This script only edits files — it does NOT run git commands. The
// GitHub Action (.github/workflows/blog-publish.yml) commits and pushes
// whatever this script changes.
//
// Requires env var GEMINI_API_KEY (set as a GitHub Actions repo secret).

import { readdir, readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DRAFTS_DIR = path.join(ROOT, 'content/drafts');
const PUBLISHED_DIR = path.join(ROOT, 'content/published-drafts');
const BLOG_JSON = path.join(ROOT, 'src/data/blog-posts.json');
const SITEMAP = path.join(ROOT, 'public/sitemap.xml');
const SITE_URL = 'https://farhanbalouch.com';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are the blog editor for Farhan Balouch's personal website (farhanbalouch.com).
Farhan writes his raw notes casually, mixing Hinglish/Roman Urdu and English. Your job:

1. Rewrite the note as a polished, warm, first-person English blog post in Farhan's voice
   (a builder from Ahmadpur East, Pakistan working in AI, SEO and online business).
   You may add natural color/detail ("namak mirch") but NEVER invent facts, names, numbers,
   or events that aren't implied by the note.
2. Write an SEO-friendly, slightly hooky headline (title).
3. Write a 1-2 sentence excerpt/meta description.
4. Split the body into 2-6 short paragraphs.
5. Suggest 3-6 relevant SEO keywords/tags (short phrases, no hashtags).

Respond with ONLY a JSON object in exactly this shape:
{
  "title": "string",
  "excerpt": "string",
  "body": ["paragraph 1", "paragraph 2"],
  "keywords": ["keyword one", "keyword two"]
}`;

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/-$/, '');
}

async function callGemini(rawNote) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: rawNote }] }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');
  return JSON.parse(text);
}

async function readJsonSafe(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function addSitemapUrl(xml, url) {
  if (xml.includes(`<loc>${url}</loc>`)) return xml; // already there
  const entry = `  <url>\n    <loc>${url}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  return xml.replace('</urlset>', `${entry}</urlset>`);
}

async function main() {
  await mkdir(PUBLISHED_DIR, { recursive: true });

  let files;
  try {
    files = await readdir(DRAFTS_DIR);
  } catch {
    console.log('No content/drafts directory found — nothing to do.');
    return;
  }

  const draftFiles = files.filter((f) => !f.startsWith('.') && f !== 'processed');
  if (draftFiles.length === 0) {
    console.log('No new drafts to publish.');
    return;
  }

  const posts = await readJsonSafe(BLOG_JSON, []);
  const existingSlugs = new Set(posts.map((p) => p.slug));

  let sitemap = await readFile(SITEMAP, 'utf8').catch(() => null);

  for (const file of draftFiles) {
    const fullPath = path.join(DRAFTS_DIR, file);
    const raw = (await readFile(fullPath, 'utf8')).trim();
    if (!raw) continue;

    console.log(`Processing draft: ${file}`);
    let result;
    try {
      result = await callGemini(raw);
    } catch (err) {
      console.error(`  Failed to process ${file}:`, err.message);
      continue; // leave the draft in place, try again next run
    }

    let slug = slugify(result.title) || `update-${Date.now()}`;
    let suffix = 2;
    while (existingSlugs.has(slug)) {
      slug = `${slugify(result.title)}-${suffix++}`;
    }
    existingSlugs.add(slug);

    const post = {
      slug,
      title: result.title,
      excerpt: result.excerpt,
      body: Array.isArray(result.body) ? result.body : [String(result.body)],
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
      publishedAt: new Date().toISOString(),
    };

    posts.unshift(post);

    if (sitemap) {
      sitemap = addSitemapUrl(sitemap, `${SITE_URL}/blog/${slug}`);
    }

    await rename(fullPath, path.join(PUBLISHED_DIR, file));
    console.log(`  Published as: ${slug}`);
  }

  await writeFile(BLOG_JSON, JSON.stringify(posts, null, 2) + '\n');
  if (sitemap) await writeFile(SITEMAP, sitemap);

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
