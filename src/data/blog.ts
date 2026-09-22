// Blog posts are written to blog-posts.json by scripts/publish-blog.mjs
// (the GitHub Action). This file just types and re-exports them, sorted
// newest first.

import blogPostsData from './blog-posts.json';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  keywords: string[];
  publishedAt: string; // ISO date-time, added automatically
};

export const blogPosts: BlogPost[] = (blogPostsData as BlogPost[])
  .slice()
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
