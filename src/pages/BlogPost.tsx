import { ArrowLeft, CalendarDays, Newspaper } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Reveal } from '@/components/Reveal';
import { useRouter } from '@/router';
import { blogPosts, formatBlogDate } from '@/data/blog';
import { SITE } from '@/data/content';

export function BlogPost({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <section className="pt-32 pb-16 max-w-2xl mx-auto px-5 sm:px-8 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Seo title="Post not found — Farhan Balouch" description="This blog post could not be found." path={`/blog/${slug}`} />
        <Newspaper className="w-10 h-10 text-text-muted mb-4" />
        <h1 className="font-display text-3xl mb-3">Post not found</h1>
        <p className="text-text-muted mb-6">This update doesn\u2019t exist (yet).</p>
        <button
          onClick={() => navigate('/blog')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-gold/40 text-text hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to blog
        </button>
      </section>
    );
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Person', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Person', name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
    keywords: post.keywords.join(', '),
  };

  return (
    <>
      <Seo title={`${post.title} — Farhan Balouch`} description={post.excerpt} path={`/blog/${post.slug}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="pt-32 pb-16 max-w-2xl mx-auto px-5 sm:px-8">
        <Reveal>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> All posts
          </button>
        </Reveal>

        <Reveal delay={60}>
          <div className="flex items-center gap-2 text-sm text-teal font-medium uppercase tracking-wide mb-4">
            <CalendarDays className="w-4 h-4" />
            {formatBlogDate(post.publishedAt)}
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="font-display text-4xl sm:text-5xl mb-8 leading-tight">{post.title}</h1>
        </Reveal>

        <div className="space-y-6">
          {post.body.map((p, i) => (
            <Reveal key={i} delay={120 + i * 60}>
              <p className="text-lg text-text-muted leading-[1.75]">{p}</p>
            </Reveal>
          ))}
        </div>

        {post.keywords.length > 0 && (
          <Reveal delay={120 + post.body.length * 60}>
            <div className="mt-10 pt-6 border-t border-border/50 flex flex-wrap gap-2">
              {post.keywords.map((k) => (
                <span key={k} className="text-xs px-2.5 py-1 rounded-full bg-bg-soft border border-border text-text-muted">
                  {k}
                </span>
              ))}
            </div>
          </Reveal>
        )}
      </article>
    </>
  );
}
