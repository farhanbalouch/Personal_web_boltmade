/// <reference lib="es2022.intl" />

import notes from '../data/reading-notes.json';
import type { BlogLanguage } from '../data/blog';

export type Editorial = {
  sections?: { start: number; title: string }[];
  highlights?: string[];
  questions?: { question: string; answer: string }[];
  takeaway?: string;
};

type Localized = [string, string, string];
type ReadingNote = {
  sections: [number, ...Localized][];
  highlights?: Localized[];
  questions?: [Localized, Localized][];
  takeaway?: Localized;
};

export type ReadingText = {
  title: string;
  shortTitle?: string;
  secondaryTitle?: string;
  excerpt: string;
  body?: string[];
  paragraphs?: string[];
  keywords?: string[];
  moral?: string;
  editorial?: Editorial;
};

const curated: Record<string, ReadingNote> = notes as unknown as Record<string, ReadingNote>;

const copy = {
  en: { brief: 'In brief', contents: 'On this page', questions: 'Questions & answers', takeaway: 'Takeaway', minute: 'min read' },
  hi: { brief: 'Mukhtasar baat', contents: 'Is safhe par', questions: 'Sawaal aur jawaab', takeaway: 'Is se kya seekha', minute: 'min ki reading' },
  ur: { brief: 'خلاصہ', contents: 'اس صفحے پر', questions: 'سوال اور جواب', takeaway: 'حاصلِ تحریر', minute: 'منٹ کا مطالعہ' },
};

export function readingLabels(language: BlogLanguage) {
  return copy[language];
}

const shortText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;

export function readingContent(slug: string, translation: ReadingText, language: BlogLanguage) {
  const paragraphs = translation.body ?? translation.paragraphs ?? [];
  const index = language === 'en' ? 0 : language === 'hi' ? 1 : 2;
  const note = Object.prototype.hasOwnProperty.call(curated, slug) ? curated[slug] : undefined;
  const editorial = translation.editorial ?? {
    sections: note?.sections.map(([start, ...titles]) => ({ start, title: titles[index] })),
    highlights: note?.highlights?.map((values) => values[index]),
    questions: note?.questions?.map(([questions, answers]) => ({ question: questions[index], answer: answers[index] })),
    takeaway: note?.takeaway?.[index],
  };

  const headings = new Map<number, string>();
  if (Array.isArray(editorial.sections)) {
    for (const section of editorial.sections) {
      if (section && Number.isInteger(section.start) && section.start >= 0 &&
          section.start < paragraphs.length && shortText(section.title, 150)) {
        headings.set(section.start, section.title.trim());
      }
    }
  }

  const candidates = [
    ...(Array.isArray(editorial.highlights) ? editorial.highlights : []),
    ...(Array.isArray(translation.keywords) ? translation.keywords : []),
  ];
  const highlights = [...new Set(candidates.filter((phrase) => shortText(phrase, 80) && phrase.trim().length >= 3).map((phrase) => phrase.trim()))]
    .sort((a, b) => b.length - a.length)
    .slice(0, 20);
  const questions = Array.isArray(editorial.questions)
    ? editorial.questions.filter((item) => item && shortText(item.question, 180) && shortText(item.answer, 600))
    : [];
  const takeaway = shortText(editorial.takeaway, 600) ? editorial.takeaway.trim() : translation.moral;
  const moral = shortText(translation.moral, 600) ? translation.moral.trim() : takeaway;
  return { paragraphs, headings, highlights, questions, takeaway, moral };
}

export function splitLongParagraph(paragraph: string, language: BlogLanguage) {
  if (paragraph.length <= 470 || typeof Intl.Segmenter !== 'function') return [paragraph];
  const segmenter = new Intl.Segmenter(language === 'hi' ? 'en' : language, { granularity: 'sentence' });
  const chunks: string[] = [];
  let current = '';
  for (const { segment } of segmenter.segment(paragraph)) {
    if (current.length >= 230 && (current.length + segment.length > 470)) {
      chunks.push(current.trim());
      current = '';
    }
    current += segment;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function paragraphHighlight(text: string, phrases: string[], used: Set<string>) {
  const explicit = /\*\*([^*\n]{2,120})\*\*/u.exec(text);
  if (explicit) return [text.slice(0, explicit.index), explicit[1], text.slice(explicit.index + explicit[0].length)];
  for (const phrase of phrases) {
    const key = phrase.toLocaleLowerCase();
    if (used.has(key)) continue;
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${escaped}(?![\\p{L}\\p{M}\\p{N}])`, 'iu').exec(text);
    if (match) {
      used.add(key);
      return [text.slice(0, match.index), match[0], text.slice(match.index + match[0].length)];
    }
  }
  return null;
}
