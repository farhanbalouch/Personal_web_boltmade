export type ContentImage = { src: string; alt: string; caption: string; width: number; height: number };
export type BlogLanguage = 'en' | 'hi' | 'ur';

export type BlogTranslation = {
  title: string;
  excerpt: string;
  body: string[];
  keywords: string[];
};

export type BlogPost = {
  images?: ContentImage[];
  slug: string;
  author: { name: string; url: string };
  publishedAt: string; // ISO date-time, added automatically
  translations: Record<BlogLanguage, BlogTranslation>;
};

