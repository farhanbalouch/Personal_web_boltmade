export type ContentImage = { src: string; alt: string; caption: string; width: number; height: number };
// Blog posts are written to blog-posts.json by scripts/publish-blog.mjs
// (the GitHub Action). This file just types and re-exports them, sorted
// newest first.

import blogPostsData from './blog-posts.json';

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

export const blogPosts: BlogPost[] = (blogPostsData as BlogPost[])
  .slice()
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

export function formatBlogDate(iso: string, language: BlogLanguage = 'en'): string {
  const locale = language === 'ur' || language === 'hi' ? 'en-GB' : 'en-US';
  return new Date(iso).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

