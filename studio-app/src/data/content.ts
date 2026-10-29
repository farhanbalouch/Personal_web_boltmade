import type { ContentImage } from "./blog";
export type Language = 'en' | 'hi' | 'ur';

export type ChapterTranslation = {
  title: string;
  subtitle: string;
  excerpt: string;
  moral: string;
  paragraphs: string[];
};

export type StoryChapter = {
  images?: ContentImage[];
  slug: string;
  part: number;
  period: string;
  translations: Record<Language, ChapterTranslation>;
};
