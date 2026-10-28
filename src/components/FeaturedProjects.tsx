import { ArrowRight, BookOpen, Bot, ExternalLink, Film, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { useRouter } from '@/router';
import { projects, type Project } from '@/data/content';

const iconMap = {
  bot: Bot,
  book: BookOpen,
  store: ShoppingBag,
  shield: ShieldCheck,
  film: Film,
};

const statusStyle: Record<Project['status'], string> = {
  placeholder: 'text-text-muted border-border bg-bg-soft',
  'coming-soon': 'text-gold border-gold/30 bg-gold/10',
  live: 'text-teal border-teal/30 bg-teal/10',
};

const statusLabel: Record<Project['status'], string> = {
  placeholder: 'Placeholder',
  'coming-soon': 'Coming soon',
  live: 'Live',
};

/** Ek project ka card — Home (Featured Projects) aur Work page dono isi ko use karte hain. */
export function ProjectCard({ project: p }: { project: Project }) {
  const Icon = iconMap[p.icon];

  return (
    <article className="card-glow rounded-2xl border border-border bg-bg-card p-7 h-full flex flex-col">
      <div className="flex items-start justify-between mb-5">
        <div className="w-12 h-12 rounded-xl bg-bg-soft border border-border flex items-center justify-center">
          <Icon className="w-6 h-6 text-gold" />
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusStyle[p.status]}`}>
          {statusLabel[p.status]}
        </span>
      </div>

      <span className="text-xs text-teal font-medium uppercase tracking-wide mb-2">{p.category}</span>
      <h3 className="font-display text-2xl mb-2">{p.title}</h3>
      <p className="text-sm text-gold/90 mb-3">{p.tagline}</p>
      <p className="text-sm text-text-muted leading-relaxed mb-5">{p.description}</p>

      <ul className="flex flex-wrap gap-2 mb-6">
        {p.features.map((f) => (
          <li
            key={f}
            className="text-xs px-2.5 py-1 rounded-full bg-bg-soft border border-border text-text-muted"
          >
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {p.link ? (
          <a
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${p.cta} — ${p.title} (${p.displayUrl})`}
            className="group inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-soft transition-colors"
          >
            {p.cta}
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-xs text-text-muted font-normal">{p.displayUrl}</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-text-muted italic">
            {p.cta} — stay tuned
          </span>
        )}
      </div>
    </article>
  );
}

/** Home page ka "Featured Projects" section (Rawi alag spotlight card mein hai, isliye yahan nahi). */
export function FeaturedProjects() {
  const { navigate } = useRouter();
  const list = projects.filter((p) => !p.spotlight && !p.showcase);

  return (
    <section className="py-20 sm:py-24 max-w-6xl mx-auto px-5 sm:px-8" aria-labelledby="featured-projects">
      <Reveal>
        <p className="text-sm text-gold/80 font-medium tracking-wide uppercase text-center mb-3">
          Portfolio
        </p>
      </Reveal>
      <Reveal delay={60}>
        <h2 id="featured-projects" className="font-display text-3xl sm:text-4xl text-center mb-3">
          Featured Projects
        </h2>
      </Reveal>
      <Reveal delay={120}>
        <p className="text-center text-text-muted max-w-xl mx-auto mb-14">
          AI tools, an online store and more — real things built by Farhan Balouch,
          with the biggest project still on its way.
        </p>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2">
        {list.map((p, i) => (
          <Reveal key={p.slug} delay={i * 90}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/work')}
            className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-gold/40 text-text hover:text-gold transition-colors"
          >
            View all projects
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </Reveal>
    </section>
  );
}


