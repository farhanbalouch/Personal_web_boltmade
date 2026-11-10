import { Clock3, MessageCircle, Sparkles } from 'lucide-react';
import { readingContent, readingLabels, splitLongParagraph, paragraphHighlight, type ReadingText } from '../lib/article-reading';
import type { BlogLanguage, ContentImage } from '../data/blog';
import { ContentPhotos } from './ContentPhotos';
import './article-reading.css';

type Props = { slug: string; translation: ReadingText; language: BlogLanguage };

export function ArticleIntro({ translation, language }: Pick<Props, 'translation' | 'language'>) {
  const labels = readingLabels(language);
  const words = (translation.body ?? translation.paragraphs ?? []).join(' ').trim().split(/\s+/u).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 210));
  return (
    <div className="reading-intro">
      <div className="reading-intro-meta">
        <span className="reading-eyebrow">{labels.brief}</span>
        <span className="reading-time"><Clock3 size={14} aria-hidden="true" /> {minutes} {labels.minute}</span>
      </div>
      <p>{translation.excerpt}</p>
    </div>
  );
}

export function ArticleReading({ slug, translation, language, images }: Props & { images?: ContentImage[] }) {
  const labels = readingLabels(language);
  const { paragraphs, headings, highlights, questions, takeaway, moral } = readingContent(slug, translation, language);
  const used = new Set<string>();
  const sectionId = (start: number) => `section-${start + 1}`;
  const contents = [...headings.entries()].sort(([a], [b]) => a - b);
  const inline = images?.filter(photo => photo.inlineAfter && photo.inlineAfter <= paragraphs.length) ?? [];
  const gallery = images?.filter((photo, index) => (index > 0 || photo.inlineAfter) && !inline.includes(photo));

  return (
    <div className="article-reading">
      {contents.length >= 3 && (
        <nav className="reading-contents" aria-label={labels.contents}>
          <span className="reading-eyebrow">{labels.contents}</span>
          <ol>{contents.map(([start, title]) => <li key={start}><a href={`#${sectionId(start)}`}>{title}</a></li>)}</ol>
        </nav>
      )}
      <div className="reading-prose">
        {paragraphs.map((paragraph, start) => (
          <div className="reading-block" key={start}>
            {headings.has(start) && <h2 id={sectionId(start)}>{headings.get(start)}</h2>}
            {splitLongParagraph(paragraph, language).map((chunk, offset) => {
              const hit = paragraphHighlight(chunk, highlights, used);
              return <p key={offset}>{hit ? <>{hit[0]}<strong>{hit[1]}</strong>{hit[2]}</> : chunk}</p>;
            })}
            <ContentPhotos images={inline.filter(photo => photo.inlineAfter === start + 1)} />
          </div>
        ))}
      </div>
      {questions.length > 0 && (
        <section className="reading-questions">
          <h2><MessageCircle size={22} aria-hidden="true" /> {labels.questions}</h2>
          {questions.map(({ question, answer }, index) => (
            <details key={index}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </section>
      )}
      {takeaway && (
        <section className="reading-takeaway">
          <h2><Sparkles size={19} aria-hidden="true" /> {labels.takeaway}</h2>
          <p>{takeaway}</p>
        </section>
      )}
      {moral && <aside className="reading-moral" aria-label={language === 'en' ? 'Moral' : 'Sabak'}><span>{language === 'ur' ? 'سبق' : 'Moral'}</span><p>{moral}</p></aside>}
      <ContentPhotos images={gallery} mode="gallery" />
    </div>
  );
}
