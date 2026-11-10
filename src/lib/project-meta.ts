import { projects, SITE, type Project } from '../data/content';

type Milestone = { date: string; label: string; released?: boolean };
// Launch dates come from the owner or published release notes. Repository dates
// describe a portfolio record, never an inferred product release.
export const projectMilestones: Record<string, Milestone> = {
  dreamers: { date: '2026-11-10', label: 'Added to portfolio' },
  buildora: { date: '2026-11-10', label: 'Added to portfolio' },
  'farhan-deals': { date: '2026-01-01', label: 'Launched', released: true },
  saras: { date: '2026-10-29', label: 'Current preview released', released: true },
  'movie-hub': { date: '2026-10-28', label: 'Live relaunch', released: true },
  'nexus-ai': { date: '2026-09-11', label: 'Portfolio record' },
  rawi: { date: '2026-09-21', label: 'Portfolio record' },
  'hack-ai': { date: '2026-09-11', label: 'Portfolio record' },
};
export const projectDate = (date: string) => new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const orderedProjects = () => [...projects].sort((a, b) => (a.featuredOrder || 10) - (b.featuredOrder || 10));
export function projectSchema(project: Project) {
  const milestone = projectMilestones[project.slug];
  return {
    '@type': 'CreativeWork', '@id': SITE.url + '/work#' + project.slug,
    name: project.title, description: project.description, url: project.link,
    creator: { '@type': 'Person', name: SITE.name, url: SITE.url },
    ...(project.logo ? { image: SITE.url + project.logo } : {}),
    ...(milestone?.released ? { datePublished: milestone.date } : {}),
    ...(project.secondaryLink ? { relatedLink: project.secondaryLink } : {}),
  };
}
export function projectsSchema() {
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Projects by Farhan Balouch',
    itemListElement: orderedProjects().filter(project => project.link).map((project, index) => ({ '@type': 'ListItem', position: index + 1, item: projectSchema(project) })),
  }).replace(/</g, '\\u003c');
}
