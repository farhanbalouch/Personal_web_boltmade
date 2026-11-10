export type ContentImage = { src: string; alt: string; caption: string; width: number; height: number; inlineAfter?: number };
export type BlogLanguage = 'en' | 'hi' | 'ur';

export type BlogTranslation = {
  title: string;
  shortTitle?: string;
  secondaryTitle?: string;
  excerpt: string;
  body: string[];
  keywords: string[];
  moral?: string;
};

export type BlogPost = {
  images?: ContentImage[];
  slug: string;
  aliases?: string[];
  author: { name: string; url: string };
  publishedAt: string; // ISO date-time, added automatically
  translations: Record<BlogLanguage, BlogTranslation>;
};

