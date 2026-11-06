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
        <ArticleReading slug={page.slug} translation={page.translation} language="en" images={page.images} />
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

import { orderedProjects, projectDate, projectMilestones, projectsSchema } from '../src/lib/project-meta';
export { projectsSchema };
export function renderProjects() {
  return renderToStaticMarkup(<main className="reading-static"><a className="reading-static-back" href="/">Farhan Balouch</a><h1 className="font-display text-4xl sm:text-5xl">Work & projects</h1><p>Projects created by Farhan Balouch, with official links, introductions and release records.</p>
    {orderedProjects().map(project => {
      const milestone = projectMilestones[project.slug];
      return <article id={project.slug} key={project.slug} className="reading-static-list">
        {project.logo && <img src={project.logo} alt={`${project.title} official logo`} width={project.slug === 'saras' ? 66 : 190} height={project.slug === 'saras' ? 66 : 86} loading="lazy" />}
        <h2 className="font-display text-2xl mt-6">{project.title}</h2><p>{project.tagline}</p><p>{project.description}</p><p>Status: {project.status === 'preview' ? 'Development preview' : project.status === 'live' ? 'Live' : project.status}</p>
        <ul>{project.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
        {milestone && <p>{milestone.label}: <time dateTime={milestone.date}>{projectDate(milestone.date)}</time></p>}
        {project.link && <p><a href={project.link} rel="noopener noreferrer">{project.cta} — {project.displayUrl}</a></p>}
        {project.secondaryLink && <p><a href={project.secondaryLink} rel="noopener noreferrer">{project.secondaryCta}</a></p>}
      </article>;
    })}<p className="mt-6">A portfolio record is a date documented on this website, rather than the project’s original release date. Launch dates are shown where confirmed.</p></main>);
}
export function projectMarkdown() {
  return orderedProjects().map(project => {
    const milestone = projectMilestones[project.slug];
    return `## ${project.title}\n\n${project.description}\n\nStatus: ${project.status === 'preview' ? 'Development preview' : project.status}.\n\n${milestone ? milestone.label + ': ' + milestone.date + '.\n\n' : ''}Official website: ${project.link}${project.secondaryLink ? '\n\nDownload and setup guide: ' + project.secondaryLink : ''}`;
  });
}
