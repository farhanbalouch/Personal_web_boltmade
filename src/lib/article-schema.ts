import type { ContentImage } from '../data/blog';

const site = 'https://farhanbalouch.com';

export type ArticleMetadata = {
  path: string;
  headline: string;
  alternativeHeadline?: string;
  description: string;
  blog?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  images?: ContentImage[];
};

export function articleSchema(article: ArticleMetadata) {
  const url = site + article.path;
  const image = article.images?.map(({ src }) => new URL(src, site).href);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': article.blog ? 'BlogPosting' : 'Article',
    '@id': url + '#article',
    headline: article.headline,
    ...(article.alternativeHeadline ? { alternativeHeadline: article.alternativeHeadline } : {}),
    description: article.description,
    inLanguage: 'en',
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Person', name: 'Farhan Balouch', url: site + '/about' },
    ...(image?.length ? { image } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
  }).replace(/</g, '\\u003c');
}
