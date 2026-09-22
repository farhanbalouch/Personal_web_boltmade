// scripts/merge-story.mjs
//
// Runs on a schedule. Reads blog posts that haven't been considered for
// the story yet, asks Gemini which chapter (by time-period, not by
// publish date) each one belongs to, and appends a paragraph to that
// chapter in src/data/story-chapters.json.
//
// This script only edits files — it does NOT commit or push, and it
// does NOT touch main directly. The GitHub Action
// (.github/workflows/story-merge.yml) opens a Pull Request with the
// changes so Farhan can review and merge (or edit) before anything
// becomes part of the permanent biography.
//
// Requires env var GEMINI_API_KEY (set as a GitHub Actions repo secret).

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BLOG_JSON = path.join(ROOT, 'src/data/blog-posts.json');
const CHAPTERS_JSON = path.join(ROOT, 'src/data/story-chapters.json');
const PHASES_JSON = path.join(ROOT, 'src/data/phases.json');
const STATE_JSON = path.join(ROOT, 'content/story-merge-state.json');
const SUMMARY_MD = path.join(ROOT, 'content/last-merge-summary.md');

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are helping organize Farhan Balouch's autobiography into chapters.
You will be given:
- A list of existing story chapters (part number, period, title, subtitle, current paragraphs)
- The life-phase groups those chapters belong to
- One new blog post Farhan wrote

Decide which chapter this blog post's content actually belongs to, based on WHEN in his life
it happened (not when it was posted). For example, a memory about school belongs in a school
chapter, even if he posted about it today.

Then write ONE short paragraph (2-4 sentences), in the same warm first-person narrative voice
as the existing paragraphs of that chapter, that could be appended to that chapter. Do not
repeat facts already in the chapter's paragraphs. Do not invent details beyond what the blog
post says.

If truly nothing fits (e.g. it's just a generic announcement with no life-story content),
set "chapterPart" to null.

Respond with ONLY a JSON object in exactly this shape:
{
  "chapterPart": 4,
  "paragraph": "string",
  "reasoning": "one short sentence explaining why this chapter"
}`;

async function callGemini(chapters, phases, post) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const chapterSummaries = chapters.map((c) => ({
    part: c.part,
    period: c.period,
    title: c.title,
    subtitle: c.subtitle,
    paragraphs: c.paragraphs,
  }));

  const userContent = JSON.stringify(
    {
      phases,
      chapters: chapterSummaries,
      blogPost: { title: post.title, body: post.body },
    },
    null,
    2
  );

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      generationConfig: {
        temperature: 0.6,
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

async function main() {
  const posts = await readJsonSafe(BLOG_JSON, []);
  const chapters = await readJsonSafe(CHAPTERS_JSON, []);
  const phases = await readJsonSafe(PHASES_JSON, []);
  const state = await readJsonSafe(STATE_JSON, { processedBlogSlugs: [] });

  const processed = new Set(state.processedBlogSlugs || []);
  const newPosts = posts.filter((p) => !processed.has(p.slug));

  if (newPosts.length === 0) {
    console.log('No new blog posts to consider for the story.');
    await writeFile(SUMMARY_MD, '_No new blog posts since the last check — nothing to review._\n');
    return;
  }

  const summaryLines = [
    `## Story update — ${newPosts.length} blog post(s) reviewed\n`,
    'Please review each suggested change below before merging.\n',
  ];
  let changed = false;

  for (const post of newPosts) {
    console.log(`Considering blog post: ${post.slug}`);
    let result;
    try {
      result = await callGemini(chapters, phases, post);
    } catch (err) {
      console.error(`  Failed to classify ${post.slug}:`, err.message);
      continue; // try again next run
    }

    processed.add(post.slug);

    if (!result.chapterPart) {
      summaryLines.push(`- **${post.title}** — no matching chapter found, skipped.\n`);
      continue;
    }

    const chapter = chapters.find((c) => c.part === result.chapterPart);
    if (!chapter) {
      summaryLines.push(
        `- **${post.title}** — AI suggested chapter part ${result.chapterPart}, but no such chapter exists. Skipped — please check manually.\n`
      );
      continue;
    }

    chapter.paragraphs.push(result.paragraph);
    changed = true;

    summaryLines.push(
      `- **${post.title}** → Chapter ${chapter.part}: "${chapter.title}"\n` +
        `  - Reason: ${result.reasoning}\n` +
        `  - Added paragraph: "${result.paragraph}"\n`
    );
  }

  state.processedBlogSlugs = Array.from(processed);
  await writeFile(STATE_JSON, JSON.stringify(state, null, 2) + '\n');
  await writeFile(SUMMARY_MD, summaryLines.join('\n') + '\n');

  if (changed) {
    await writeFile(CHAPTERS_JSON, JSON.stringify(chapters, null, 2) + '\n');
    console.log('Story chapters updated — a Pull Request will be opened for review.');
  } else {
    console.log('No chapters changed this run.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
