import { ArticleIntro, ArticleReading } from '@/components/ArticleReading';
import { articleSchema } from '@/lib/article-schema';
import { ContentPhotos } from "@/components/ContentPhotos";
import { ArrowLeft, CalendarDays, Newspaper, ArrowUpRight, Sparkles } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Reveal } from '@/components/Reveal';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useRouter } from '@/router';
import { useLanguage } from '@/context/LanguageContext';
import { blogPosts, formatBlogDate } from '@/data/blog';
import { SITE } from '@/data/content';

export function BlogPost({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <section className="pt-32 pb-16 max-w-2xl mx-auto px-5 sm:px-8 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Seo
          title="Post not found — Farhan Balouch"
          description="This blog post could not be found."
          path={`/blog/${slug}`}
        />

        <Newspaper className="w-10 h-10 text-text-muted mb-4" />

        <h1 className="font-display text-3xl mb-3">
          Post not found
        </h1>

        <p className="text-text-muted mb-6">
          This update doesn&rsquo;t exist (yet).
        </p>

        <button
          onClick={() => navigate('/blog')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-gold/40 text-text hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to blog
        </button>
      </section>
    );
  }

  const t = post.translations[language];
  const tEn = post.translations.en; // SEO always uses English

  return (
    <>
      <Seo
        title={`${tEn.title} — Farhan Balouch`}
        description={tEn.excerpt}
        path={`/blog/${post.slug}`}
        structuredData={articleSchema({
          path: `/blog/${post.slug}`, headline: tEn.title, description: tEn.excerpt,
          blog: true, publishedAt: post.publishedAt, updatedAt: post.updatedAt, images: post.images,
        })}
        ogImage={post.images?.[0] ? `${SITE.url}${post.images[0].src}` : undefined}
      />

      <article className={`pt-32 pb-16 max-w-3xl mx-auto px-5 sm:px-8 ${isUrdu ? 'font-urdu' : ''}`}>

        {/* Back to blog + language switcher */}
        <Reveal>
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <button
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All posts
            </button>
            <LanguageSwitcher />
          </div>
        </Reveal>

        <div lang={language === "hi" ? "hi-Latn" : language} dir={isUrdu ? 'rtl' : 'ltr'}>
          {/* Date */}
          <Reveal delay={60}>
            <div className="flex items-center gap-2 text-sm text-teal font-medium uppercase tracking-wide mb-4">
              <CalendarDays className="w-4 h-4" />
              {formatBlogDate(post.publishedAt, language)}
            </div>
          </Reveal>

          {/* Title */}
          <Reveal delay={100}>
            <h1 className="font-display text-4xl sm:text-5xl mb-8 leading-tight">
              {t.title}
            </h1>
          </Reveal>

          <ArticleIntro translation={t} language={language} />
          <ContentPhotos images={post.images} mode="cover" />

          <ArticleReading slug={post.slug} translation={t} language={language} />

          <ContentPhotos images={post.images} mode="gallery" />

          {/* Keywords */}
          {t.keywords.length > 0 && (
            <Reveal delay={120}>
              <div dir="ltr" className="mt-10 pt-6 border-t border-border/50 flex flex-wrap gap-2">
                {t.keywords.map((k) => (
                  <span
                    key={k}
                    className="text-xs px-2.5 py-1 rounded-full bg-bg-soft border border-border text-text-muted"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </Reveal>
          )}

          {/* Author section — glowing signature */}
          <Reveal delay={180}>
            <div dir="ltr" className="mt-14 pt-8 border-t border-border">
              <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-bg-soft/60 p-6 sm:p-8">
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gold/10 blur-3xl animate-pulse-slow pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-teal/10 blur-3xl animate-pulse-slow pointer-events-none" />

                <div className="relative">
                  <p className="text-xs uppercase tracking-[0.25em] text-text-muted mb-3">
                    Written by
                  </p>

                  <h2 className="font-display text-2xl sm:text-3xl mb-2 bg-gradient-to-r from-gold via-amber-300 to-gold bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
                    Farhan Balouch
                  </h2>

                  <p className="text-sm text-text-muted mb-5">
                    AI · SEO · Online Business
                  </p>

                  <p className="text-sm text-text-muted leading-relaxed max-w-xl mb-6">
                    Farhan Balouch writes about AI, SEO, online business,
                    technology, and his journey of building digital projects.
                  </p>

                  <button
                    onClick={() => navigate('/about')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-text transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Learn more about Farhan
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

      </article>
    </>
  );
}

