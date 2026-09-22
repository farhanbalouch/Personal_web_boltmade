import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Reveal } from '@/components/Reveal';
import { useRouter } from '@/router';
import { blogPosts, formatBlogDate } from '@/data/blog';

export function Blog() {
  const { navigate } = useRouter();

  return (
    <>
      <Seo
        title="Blog — Farhan Balouch"
        description="Updates, thoughts and behind-the-scenes notes from Farhan Balouch — on AI, SEO, online business, and the journey from Ahmadpur East."
        path="/blog"
      />

      <section className="pt-32 pb-8 max-w-4xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="text-sm text-gold/80 font-medium tracking-wide uppercase mb-4">Blog</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display text-4xl sm:text-5xl mb-6 leading-tight">
            Notes from the journey
          </h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
            Short updates, whenever there\u2019s something worth sharing \u2014 written as it happens.
          </p>
        </Reveal>
      </section>

      <section className="py-12 max-w-4xl mx-auto px-5 sm:px-8">
        {blogPosts.length === 0 ? (
          <Reveal>
            <div className="rounded-2xl border border-dashed border-border bg-bg-soft/30 p-10 text-center">
              <Newspaper className="w-8 h-8 text-gold mx-auto mb-4" />
              <p className="text-text-muted">
                No posts yet \u2014 the first update is on its way.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="space-y-5">
            {blogPosts.map((post, i) => (
              <Reveal key={post.slug} delay={i * 70}>
                <button
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  className="group w-full text-left card-glow rounded-2xl border border-border bg-bg-card p-6 sm:p-7"
                >
                  <div className="flex items-center gap-2 text-xs text-teal font-medium uppercase tracking-wide mb-3">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatBlogDate(post.publishedAt)}
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl mb-2 group-hover:text-gold transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-text-muted leading-relaxed line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    Read post
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
