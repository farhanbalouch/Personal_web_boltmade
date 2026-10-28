export type Language = 'en' | 'hi' | 'ur';

export type ChapterTranslation = {
  title: string;
  subtitle: string;
  excerpt: string;
  moral: string;
  paragraphs: string[];
};

export type StoryChapter = {
  slug: string;
  part: number;
  period: string;
  translations: Record<Language, ChapterTranslation>;
};
