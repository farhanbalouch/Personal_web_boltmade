export type BlogLanguage = 'en' | 'hi' | 'ur';

export type BlogTranslation = {
  title: string;
  excerpt: string;
  body: string[];
  keywords: string[];
};

export type BlogPost = {
  slug: string;
  author: { name: string; url: string };
  publishedAt: string; // ISO date-time, added automatically
  translations: Record<BlogLanguage, BlogTranslation>;
};

