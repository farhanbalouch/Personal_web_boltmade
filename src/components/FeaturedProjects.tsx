import { BookOpen, Bot, ExternalLink, Film, ShieldCheck, ShoppingBag } from 'lucide-react';
import { ProjectSpotlights } from './ProjectSpotlights';
import { projectDate, projectMilestones } from '@/lib/project-meta';
import { type Project } from '@/data/content';

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
  preview: 'text-gold border-gold/30 bg-gold/10',
};

const statusLabel: Record<Project['status'], string> = {
  placeholder: 'Placeholder',
  'coming-soon': 'Coming soon',
  live: 'Live',
  preview: 'Preview',
};

/** Ek project ka card — Home (Featured Projects) aur Work page dono isi ko use karte hain. */
export function ProjectCard({ project: p }: { project: Project }) {
  const Icon = iconMap[p.icon];
  const milestone = projectMilestones[p.slug];

  return (
    <article id={p.slug} className="project-small-card card-glow rounded-2xl border border-border bg-bg-card p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-5">
        <div className="w-12 h-12 rounded-xl bg-bg-soft border border-border flex items-center justify-center">
          {p.logo ? <img src={p.logo} alt={`${p.title} official logo`} className="w-10 h-10 object-contain" loading="lazy" /> : <Icon className="w-6 h-6 text-gold" />}
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

      {milestone && <p className="text-xs text-text-muted mb-5">{milestone.label} · <time dateTime={milestone.date}>{projectDate(milestone.date)}</time></p>}
      <div className="mt-auto project-small-actions">
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
            
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm text-text-muted italic">
            {p.cta} — stay tuned
          </span>
        )}
        {p.secondaryLink && <a className="project-small-secondary" href={p.secondaryLink} target="_blank" rel="noopener noreferrer">{p.secondaryCta} <ExternalLink size={13} /></a>}
        <span className="project-small-domain">{p.displayUrl}</span>
      </div>
    </article>
  );
}

/** Homepage highlights; MovieHub keeps its existing separate card. */
export function FeaturedProjects() {
  return <ProjectSpotlights />;
}
