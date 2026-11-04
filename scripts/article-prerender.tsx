import { renderToStaticMarkup } from 'react-dom/server';
import { ArticleIntro, ArticleReading } from '../src/components/ArticleReading';
import { ContentPhotos } from '../src/components/ContentPhotos';
import { articleSchema, type ArticleMetadata } from '../src/lib/article-schema';
import type { ReadingText } from '../src/lib/article-reading';

export { articleSchema };

type Page = ArticleMetadata & {
  slug: string;
  translation: ReadingText;
  collection: string;
  collectionLabel: string;
  previous?: { path: string; title: string };
  next?: { path: string; title: string };
};

export function renderArticle(page: Page) {
  return renderToStaticMarkup(
    <main className="reading-static">
      <a className="reading-static-back" href={page.collection}>{page.collectionLabel}</a>
      <article>
        <h1 className="font-display text-4xl sm:text-5xl leading-tight">{page.headline}</h1>
        {page.publishedAt && <time dateTime={page.publishedAt} className="reading-eyebrow">
          {new Date(page.publishedAt).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })}
        </time>}
        {page.collection === '/story' && <p className="text-text-muted mt-4">
          This chapter is creatively edited with AI. Some scenes and dialogue may be reconstructed.
        </p>}
        <ArticleIntro translation={page.translation} language="en" />
        <ContentPhotos images={page.images} mode="cover" />
        <ArticleReading slug={page.slug} translation={page.translation} language="en" />
        <ContentPhotos images={page.images} mode="gallery" />
        <p className="text-text-muted mt-8">Written by <a className="reading-static-back" href="/about">Farhan Balouch</a></p>
      </article>
      {(page.previous || page.next) && <nav aria-label="More biography chapters" className="reading-static-list">
        {page.previous && <p className="mt-4"><a href={page.previous.path}>Previous: {page.previous.title}</a></p>}
        {page.next && <p className="mt-4"><a href={page.next.path}>Next: {page.next.title}</a></p>}
      </nav>}
    </main>,
  );
}

export function renderReadingIndex(page: {title: string; description: string}, articles: {path: string; headline: string; description: string}[]) {
  return renderToStaticMarkup(
    <main className="reading-static">
      <a className="reading-static-back" href="/">Farhan Balouch</a>
      <h1 className="font-display text-4xl sm:text-5xl leading-tight">{page.title}</h1>
      <p>{page.description}</p>
      {articles.length ? <ul className="reading-static-list">{articles.map((article) => (
        <li key={article.path}>
          <a href={article.path}>{article.headline}</a>
          <p>{article.description}</p>
        </li>
      ))}</ul> : <p className="mt-6">Read <a className="reading-static-back" href="/story">my biography</a> while new stories are being prepared.</p>}
    </main>,
  );
}
