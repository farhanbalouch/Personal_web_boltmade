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

const GEMINI_MODEL = 'gemini-2.5-flash';

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `
You are the SEO-focused blog editor for Farhan Balouch's personal website,
farhanbalouch.com.

Turn Farhan's raw notes into a useful, authentic, search-friendly English blog post.

PRIORITY 1 — SEO:
- Make the main topic immediately clear.
- Use natural search phrases people may actually search for.
- Put the main topic naturally in the title.
- Naturally mention the main topic in the introduction and relevant parts of the article.
- Use related terms and natural variations.
- Prefer specific long-tail phrases when appropriate.
- Write a clear SEO-friendly excerpt/meta description.
- Choose 3-6 highly relevant keywords/topics.
- Never keyword-stuff.
- Never repeat keywords unnaturally.
- Never create keywords unrelated to the actual article.

PRIORITY 2 — EASY ENGLISH:
- Use simple, natural and professional English.
- Pakistani, Indian and international readers should understand it easily.
- Avoid unnecessarily difficult vocabulary.
- Avoid academic or fancy wording when a common word works better.
- Do not make the article sound artificially intelligent.
- Clear English is more important than complicated English.

AUTHENTICITY:
- Write in Farhan's first-person voice.
- Farhan is a builder from Ahmadpur East, Pakistan working around AI,
  SEO, websites and online business.
- Never invent facts, names, dates, numbers, achievements, projects,
  events or experiences.
- Do not exaggerate his achievements.
- Improve the writing, but keep the original meaning and facts.

ARTICLE QUALITY:
- Start with a clear introduction.
- Stay focused on one main topic.
- Give useful information or a genuine personal perspective.
- Use 2-6 short paragraphs.
- Avoid filler and repetition.
- Avoid generic AI-style motivational language.

TITLE:
- Clear and descriptive.
- SEO-friendly.
- Main topic should appear naturally.
- No clickbait.
- No unnecessary punctuation.

EXCERPT:
- 1-2 clear sentences.
- Explain exactly what the article is about.
- Include the main topic naturally when appropriate.

KEYWORDS:
- 3-6 relevant search phrases.
- Use specific phrases when possible.
- No hashtags.

Return ONLY valid JSON in exactly this format:

{
  "title": "string",
  "excerpt": "string",
  "body": ["paragraph 1", "paragraph 2"],
  "keywords": ["keyword one", "keyword two"]
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

async function callGemini(rawNote) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini error ${res.status}: ${text}`);
  }

  const data = await res.json();

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned no content');
  }

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
      continue;
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
      body: Array.isArray(result.body)
        ? result.body
        : [String(result.body)],

      keywords: Array.isArray(result.keywords)
        ? result.keywords
        : [],

      author: {
        name: AUTHOR_NAME,
        url: AUTHOR_URL,
      },

      publishedAt: new Date().toISOString(),
    };

    posts.unshift(post);

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

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
