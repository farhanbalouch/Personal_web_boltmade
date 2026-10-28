// scripts/publish-blog.mjs

import { readdir, readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();

const DRAFTS_DIR = path.join(ROOT, 'content/drafts');
const PUBLISHED_DIR = path.join(ROOT, 'content/published-drafts');
const BLOG_JSON = path.join(ROOT, 'src/data/blog-posts.json');
const SITEMAP = path.join(ROOT, 'public/sitemap.xml');

const SITE_URL = 'https://farhanbalouch.com';
const AUTHOR_NAME = 'Farhan Balouch';
const AUTHOR_URL = `${SITE_URL}/about`;

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `
You are the SEO-focused blog editor for Farhan Balouch's personal website,
farhanbalouch.com. The site is trilingual: every blog post needs an English
version, a Hindi version, and an Urdu version.

Turn Farhan's raw notes into a useful, authentic blog post, then produce it
in THREE language versions of equal quality — not a literal translation of
each other, but the same story told naturally in each language.

PRIORITY 1 — SEO (applies mainly to the English version, since that is what
most search traffic will be in):
- Make the main topic immediately clear.
- Use natural search phrases people may actually search for.
- Put the main topic naturally in the title.
- Naturally mention the main topic in the introduction and relevant parts.
- Use related terms and natural variations.
- Prefer specific long-tail phrases when appropriate.
- Write a clear SEO-friendly excerpt/meta description.
- Choose 3-6 highly relevant keywords/topics.
- Never keyword-stuff. Never repeat keywords unnaturally.
- Never create keywords unrelated to the actual article.

PRIORITY 2 — EASY LANGUAGE:
- English: simple, natural, professional English that Pakistani, Indian
  and international readers understand easily. Avoid unnecessarily
  difficult vocabulary or academic/fancy wording.
- Hindi: write in Roman script (Hinglish) — the way Hindi is casually
  typed on phones — NOT Devanagari script.
- Urdu: write in proper Urdu (Nastaliq) script.
- Clear language is more important than complicated language, in all three.

AUTHENTICITY:
- Write in Farhan's first-person voice, in all three languages.
- Farhan is a builder from Ahmadpur East, Pakistan working around AI,
  SEO, websites and online business.
- Never invent facts, names, dates, numbers, achievements, projects,
  events or experiences beyond what the raw note says.
- Do not exaggerate his achievements.
- Never include anyone's real name other than Farhan's own — if someone
  else is mentioned, refer to them generically (e.g. "a friend", "a
  cousin", "a teacher"), in all three languages.
- Improve the writing, but keep the original meaning and facts identical
  across all three language versions — they should tell the exact same
  story, just written naturally in each language.

ARTICLE QUALITY:
- Start with a clear introduction. Stay focused on one main topic.
- Give useful information or a genuine personal perspective.
- Use 2-6 short paragraphs (the English, Hindi and Urdu versions should
  have the same number of paragraphs, covering the same content in order).
- Avoid filler, repetition, and generic AI-style motivational language.

TITLE: Clear, descriptive, SEO-friendly in English. No clickbait, no
unnecessary punctuation. The Hindi and Urdu titles should carry the same
meaning, written naturally in each language/script.

EXCERPT: 1-2 clear sentences per language, explaining exactly what the
article is about.

KEYWORDS: 3-6 relevant search phrases per language. No hashtags. The
Hindi/Urdu keyword lists can be natural equivalents of the English ones,
not literal translations.

Return ONLY valid JSON in exactly this format:

{
  "en": { "title": "string", "excerpt": "string", "body": ["paragraph 1", "paragraph 2"], "keywords": ["keyword one", "keyword two"] },
  "hi": { "title": "string", "excerpt": "string", "body": ["paragraph 1", "paragraph 2"], "keywords": ["keyword one", "keyword two"] },
  "ur": { "title": "string", "excerpt": "string", "body": ["paragraph 1", "paragraph 2"], "keywords": ["keyword one", "keyword two"] }
}
`;

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

function isValidLangBlock(block) {
  return (
    block &&
    typeof block.title === 'string' && block.title.trim() &&
    typeof block.excerpt === 'string' && block.excerpt.trim() &&
    Array.isArray(block.body) && block.body.length > 0 && block.body.every(p => typeof p === 'string' && p.trim()) &&
    Array.isArray(block.keywords)
  );
}

export async function callGemini(rawNote) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(120000),
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: rawNote }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status}). Check API quota and GEMINI_API_KEY.`);
  }

  const data = await res.json();

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned no content');
  }

  const parsed = JSON.parse(text);

  if (!isValidLangBlock(parsed.en) || !isValidLangBlock(parsed.hi) || !isValidLangBlock(parsed.ur)) {
    throw new Error('Gemini response is missing a valid en/hi/ur block');
  }

  return parsed;
}

async function readJsonSafe(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function addSitemapUrl(xml, url) {
  if (xml.includes(`<loc>${url}</loc>`)) {
    return xml;
  }

  const entry = `  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;

  return xml.replace('</urlset>', `${entry}</urlset>`);
}

async function main() {
  await writeFile(path.join(ROOT, 'content/last-published.json'), '[]\n');
  await mkdir(PUBLISHED_DIR, { recursive: true });

  let files;

  try {
    files = await readdir(DRAFTS_DIR);
  } catch {
    console.log('No content/drafts directory found — nothing to do.');
    return;
  }

  const draftFiles = files.filter(
    (f) => !f.startsWith('.') && f !== 'processed'
  );

  if (draftFiles.length === 0) {
    console.log('No new drafts to publish.');
    return;
  }

  const posts = await readJsonSafe(BLOG_JSON, []);
  const existingSlugs = new Set(posts.map((p) => p.slug));
  const publishedThisRun = [];

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
      console.error(`Failed to process ${file}:`, err.message);
      continue; // leave the draft in place, retry next run
    }

    // Slugs are always derived from the English title, so URLs stay
    // stable and readable regardless of which language the reader views.
    let slug = slugify(result.en.title) || `update-${Date.now()}`;

    let suffix = 2;

    while (existingSlugs.has(slug)) {
      slug = `${slugify(result.en.title)}-${suffix++}`;
    }

    existingSlugs.add(slug);

    const post = {
      slug,
      author: {
        name: AUTHOR_NAME,
        url: AUTHOR_URL,
      },
      publishedAt: new Date().toISOString(),
      translations: {
        en: result.en,
        hi: result.hi,
        ur: result.ur,
      },
    };

    posts.unshift(post);
    publishedThisRun.push({
      title: post.translations.en.title,
      url: `${SITE_URL}/blog/${slug}`,
    });

    if (sitemap) {
      sitemap = addSitemapUrl(
        sitemap,
        `${SITE_URL}/blog/${slug}`
      );
    }

    await rename(
      fullPath,
      path.join(PUBLISHED_DIR, file)
    );

    console.log(`Published as: ${slug}`);
  }

  await writeFile(
    BLOG_JSON,
    JSON.stringify(posts, null, 2) + '\n'
  );

  if (sitemap) {
    await writeFile(SITEMAP, sitemap);
  }

  // The GitHub Action reads this to know what to notify subscribers about —
  // written every run (even if empty) so a stale file never gets reused.
  await writeFile(
    path.join(ROOT, 'content/last-published.json'),
    JSON.stringify(publishedThisRun, null, 2) + '\n'
  );

  console.log('Done.');
}

if (process.argv[1]?.endsWith('publish-blog.mjs')) main().catch((err) => {
  console.error(err);
  process.exit(1);
});

