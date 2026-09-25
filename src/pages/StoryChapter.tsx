import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Sparkles, ArrowUpRight } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Reveal } from '@/components/Reveal';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useRouter } from '@/router';
import { useLanguage } from '@/context/LanguageContext';
import { storyChapters } from '@/data/content';
import { StoryGateOverlay } from './StoryGateOverlay';
import { StoryDisclaimer } from '@/components/StoryDisclaimer';

export function StoryChapter({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const chapter = storyChapters.find((c) => c.slug === slug);
  const [showSummary, setShowSummary] = useState(false);
  const [gateOpen, setGateOpen] = useState(true);

  if (!chapter) {
    return (
      <section className="pt-32 pb-16 max-w-2xl mx-auto px-5 sm:px-8 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <Seo title="Chapter not found — Farhan Balouch" description="This story chapter could not be found." path={`/story/${slug}`} />
        <BookOpen className="w-10 h-10 text-text-muted mb-4" />
        <h1 className="font-display text-3xl mb-3">Chapter not found</h1>
        <p className="text-text-muted mb-6">This part of the story doesn't exist yet.</p>
        <button
          onClick={() => navigate('/story')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-gold/40 text-text hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all chapters
        </button>
      </section>
    );
  }

  const prev = storyChapters[chapter.part - 2] || null;
  const next = storyChapters[chapter.part] || null;
  const t = chapter.translations[language];
  const tEn = chapter.translations.en; // SEO always uses English

  if (gateOpen) {
    return (
      <>
        <Seo
          title={`${tEn.title} — Farhan Balouch`}
          description={tEn.excerpt}
          path={`/story/${chapter.slug}`}
        />
        <StoryGateOverlay onComplete={() => setGateOpen(false)} seconds={5} />
      </>
    );
  }

  return (
    <>
      <StoryDisclaimer />

      <Seo
        title={`${tEn.title} — Farhan Balouch`}
        description={tEn.excerpt}
        path={`/story/${chapter.slug}`}
      />

      <article className={`pt-32 pb-16 max-w-2xl mx-auto px-5 sm:px-8 ${isUrdu ? 'font-urdu' : ''}`}>
        <Reveal>
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <button
              onClick={() => navigate('/story')}
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> All chapters
            </button>
            <LanguageSwitcher />
          </div>
        </Reveal>

        <div dir={isUrdu ? 'rtl' : 'ltr'}>
          <Reveal delay={60}>
            <p className="text-sm text-teal font-medium tracking-wide uppercase mb-3">
              {language === 'ur' ? `\u0628\u0627\u0628 ${chapter.part}` : `Chapter ${chapter.part}`} \u00b7 {chapter.period}
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="font-display text-4xl sm:text-5xl mb-3 leading-tight">{t.title}</h1>
          </Reveal>

          <Reveal delay={150}>
            <button
              onClick={() => setShowSummary((s) => !s)}
              className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/30 bg-gold/5 text-sm text-gold hover:bg-gold/10 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {showSummary
                ? (language === 'ur' ? 'خلاصہ چھپائیں' : 'Hide summary')
                : (language === 'ur' ? 'اس صفحے کا خلاصہ دیکھیں' : 'Show page summary')}
            </button>
            {showSummary && (
              <div
                dir={isUrdu ? 'rtl' : 'ltr'}
                className="mb-8 rounded-xl border border-border bg-bg-card/50 p-5 text-text-muted leading-relaxed"
              >
                {t.excerpt}
              </div>
            )}
          </Reveal>

          <Reveal delay={140}>
            <p className="text-lg text-text-muted/80 mb-10">{t.subtitle}</p>
          </Reveal>

          <div className="space-y-6">
            {t.paragraphs.map((p, i) => (
              <Reveal key={i} delay={120 + i * 60}>
                <p className="text-lg text-text-muted leading-[1.75]">{p}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={140 + t.paragraphs.length * 60}>
            <div
              dir="ltr"
              className="mt-10 rounded-xl border border-gold/25 bg-gold/5 p-5 flex items-start gap-3"
            >
              <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gold font-medium uppercase tracking-wide mb-1.5">Takeaway</p>
                <p className="text-sm text-text-muted leading-relaxed">{t.moral}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={180 + t.paragraphs.length * 60}>
            <div dir="ltr" className="mt-10 pt-8 border-t border-border">
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
                    This chapter is part of Farhan Balouch's ongoing personal story —
                    from Ahmadpur East to AI, SEO, and online business.
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

      <nav className="max-w-2xl mx-auto px-5 sm:px-8 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 border-t border-border/50 pt-8">
          {prev ? (
            <button
              onClick={() => navigate(`/story/${prev.slug}`)}
              className="group text-left rounded-xl border border-border bg-bg-card/50 p-5 hover:border-gold/30 transition-colors"
            >
              <span className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </span>
              <span className="font-display text-lg group-hover:text-gold transition-colors">
                {prev.translations[language].title}
              </span>
            </button>
          ) : <div className="hidden sm:block" />}

          {next ? (
            <button
              onClick={() => navigate(`/story/${next.slug}`)}
              className="group text-right rounded-xl border border-border bg-bg-card/50 p-5 hover:border-gold/30 transition-colors"
            >
              <span className="flex items-center justify-end gap-1.5 text-xs text-text-muted mb-1.5">
                Next <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="font-display text-lg group-hover:text-gold transition-colors">
                {next.translations[language].title}
              </span>
            </button>
          ) : <div className="hidden sm:block" />}
        </div>
      </nav>
    </>
  );
          }
