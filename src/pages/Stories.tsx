import { ArticleIntro, ArticleReading } from '@/components/ArticleReading';
import { articleSchema } from '@/lib/article-schema';
import { ContentPhotos } from "@/components/ContentPhotos";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Seo } from "@/components/Seo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationButton } from "@/components/NotificationButton";
import { useLanguage } from "@/context/LanguageContext";
import type { BlogPost } from "@/data/blog";
import { formatBlogDate } from "@/data/blog";
import storiesData from "@/data/stories.json";
const stories = (storiesData as BlogPost[])
  .slice()
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
export function Stories({ slug }: { slug?: string }) {
  const { language } = useLanguage();
  const story = slug ? stories.find((s) => s.slug === slug) : undefined;
  const t = story?.translations[language];
  return (
    <section className="pt-32 pb-20 max-w-5xl mx-auto px-5 sm:px-8 min-h-[70vh]">
      <Seo
        title={`${story?.translations.en.title || (slug ? "Story not found" : "Stories & Updates")} — Farhan Balouch`}
        description={
          story?.translations.en.excerpt ||
          "Fresh stories, project updates and moments from Farhan Balouch’s journey."
        }
        path={slug ? `/stories/${slug}` : "/stories"}
        structuredData={story ? articleSchema({
          path: `/stories/${story.slug}`, headline: story.translations.en.title,
          description: story.translations.en.excerpt, publishedAt: story.publishedAt,
          updatedAt: story.updatedAt, images: story.images,
        }) : undefined}
        ogImage={story?.images?.[0] ? `https://farhanbalouch.com${story.images[0].src}` : undefined}
      />
      <p className="text-xs text-teal tracking-[0.25em] uppercase mb-5">
        Notes from the journey
      </p>
      {slug ? (
        <>
          <a
            href="/stories"
            className="inline-flex gap-2 items-center text-gold text-sm mb-7"
          >
            <ArrowLeft size={16} />
            All stories
          </a>
          {story && t ? (
            <article
              className={`max-w-3xl mx-auto ${language === "ur" ? "font-urdu" : ""}`}
              lang={language === "hi" ? "hi-Latn" : language}
              dir={language === "ur" ? "rtl" : "ltr"}
            >
              <LanguageSwitcher />
              <h1 className="font-display text-4xl sm:text-5xl leading-tight mt-8 mb-5">
                {t.title}
              </h1>
              <p className="text-text-muted text-xs mb-10">
                {formatBlogDate(story.publishedAt, language)}
              </p>
              <ArticleIntro translation={t} language={language} />
              <ContentPhotos images={story.images} mode="cover" />
              <ArticleReading slug={story.slug} translation={t} language={language} />
              <ContentPhotos images={story.images} mode="gallery" />
            </article>
          ) : (
            <h1 className="font-display text-4xl">Story not found</h1>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-7 justify-between items-end mb-10">
            <div>
              <h1 className="font-display text-5xl sm:text-6xl mb-5">
                Stories, as they happen.
              </h1>
              <p className="text-text-muted max-w-xl leading-relaxed">
                Small moments, new ideas, and the things I’m building. A place
                for everything along the way.
              </p>
            </div>
            <LanguageSwitcher />
          </div>
          <div className="grid sm:grid-cols-2 gap-5 mb-12">
            {stories.map((s) => (
              <a
                href={`/stories/${s.slug}`}
                key={s.slug}
                className="card-glow rounded-2xl border border-border bg-bg-card p-7 group"
                dir={language === "ur" ? "rtl" : "ltr"}
              >
                {s.images?.[0] && <img src={s.images[0].src} alt={s.images[0].alt} width={s.images[0].width} height={s.images[0].height} loading="lazy" className="w-full h-48 object-cover rounded-xl mb-6" />}
                <div className="flex justify-between items-center text-teal text-xs mb-7">
                  <Sparkles size={19} />
                  <span>{formatBlogDate(s.publishedAt, language)}</span>
                </div>
                <h2 className="font-display text-2xl mb-4 group-hover:text-gold">
                  {s.translations[language].title}
                </h2>
                <p className="text-sm text-text-muted leading-relaxed mb-7">
                  {s.translations[language].excerpt}
                </p>
                <span className="inline-flex gap-2 items-center text-gold text-sm">
                  Read story <ArrowRight size={15} />
                </span>
              </a>
            ))}
            {!stories.length && (
              <div className="sm:col-span-2 rounded-2xl border border-dashed border-border py-16 px-7 text-center">
                <Sparkles className="mx-auto text-gold mb-5" />
                <h2 className="font-display text-2xl mb-3">
                  A new page is waiting.
                </h2>
                <p className="text-text-muted text-sm mb-6">
                  Fresh stories will appear here. Meanwhile, explore the journey
                  so far.
                </p>
                <a
                  href="/story"
                  className="inline-flex items-center gap-2 text-gold text-sm"
                >
                  <BookOpen size={16} />
                  Read my biography
                </a>
              </div>
            )}
          </div>
        </>
      )}
      <div className="mt-14 border-t border-border pt-8">
        <NotificationButton />
      </div>
    </section>
  );
}
