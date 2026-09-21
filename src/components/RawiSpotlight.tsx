import { ArrowRight, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { useRouter } from '@/router';
import { projects } from '@/data/content';

/** Home page par "Meet Rawi" card + Rawi ka link button (rawi.farhanbalouch.com). */
export function RawiSpotlight() {
  const { navigate } = useRouter();
  const rawi = projects.find((p) => p.spotlight);
  if (!rawi || !rawi.link) return null;

  return (
    <section className="py-20 sm:py-24 max-w-6xl mx-auto px-5 sm:px-8" aria-labelledby="meet-rawi">
      <Reveal>
        <div className="relative rounded-3xl border border-gold/20 bg-gradient-to-br from-bg-card via-bg-soft to-bg-card overflow-hidden p-8 sm:p-14 text-center">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-teal/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold/25 to-teal/20 border border-gold/30 mb-6">
              <Sparkles className="w-7 h-7 text-gold" />
            </div>

            <p className="text-xs text-teal font-medium uppercase tracking-[0.25em] mb-3">
              {rawi.category}
            </p>
            <h2 id="meet-rawi" className="font-display text-3xl sm:text-5xl mb-4">
              Meet <span className="text-gradient-gold">Rawi</span>
            </h2>
            <p className="text-text-muted max-w-xl mx-auto leading-relaxed mb-3">
              {rawi.description}
            </p>
            <p className="text-sm text-text-muted/80 italic mb-8">
              Ask a question about Farhan — get a story back.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={rawi.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${rawi.cta} — ${rawi.displayUrl}`}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-bg font-medium hover:bg-gold-soft hover:scale-[1.03] transition-all shadow-[0_10px_35px_rgba(212,168,75,0.18)]"
              >
                {rawi.cta}
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              <button
                onClick={() => navigate('/story')}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border hover:border-gold/40 text-text hover:text-gold transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Or read the story first
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <p className="mt-5 text-xs text-text-muted/60">{rawi.displayUrl}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
