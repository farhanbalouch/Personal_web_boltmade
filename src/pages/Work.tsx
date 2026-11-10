import { MessageSquare } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Reveal } from '@/components/Reveal';
import { MovieHubSpotlight } from '@/components/MovieHubSpotlight';
import { ProjectSpotlights } from '@/components/ProjectSpotlights';
import { projectsSchema, projectDate, projectMilestones, orderedProjects } from '@/lib/project-meta';
import { ProjectCard } from '@/components/FeaturedProjects';
import { useRouter } from '@/router';
import { projects, SITE } from '@/data/content';

export function Work() {
  const { navigate } = useRouter();

  return (
    <>
      <Seo
        title="Projects & Portfolio — Farhan Balouch"
        description="Explore Farhan Deals, SARAS Next, MovieHub and other projects by Farhan Balouch, with official links, introductions and release records."
        structuredData={projectsSchema()}
        ogType="website"
        path="/work"
        ogImage={SITE.ogImage}
      />

      <section className="pt-32 pb-8 max-w-5xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="text-sm text-gold/80 font-medium tracking-wide uppercase mb-4">Portfolio</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display text-4xl sm:text-5xl mb-6 leading-tight">
            Work & projects
          </h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="text-lg text-text-muted max-w-2xl leading-relaxed">
            An online store, a Windows companion, entertainment and AI tools. Explore my main projects here, then discover the smaller experiments below.
          </p>
        </Reveal>
      </section>

      <ProjectSpotlights />
      <MovieHubSpotlight />
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-10" aria-labelledby="project-records">
        <h2 id="project-records" className="font-display text-2xl mb-5">Project dates & release records</h2>
        <p className="text-sm text-text-muted mb-5">Launch dates are shown where confirmed. A portfolio record is the date a project was documented on this website, rather than its original release date.</p>
        <dl className="grid sm:grid-cols-2 gap-3">{orderedProjects().map(project => {
          const milestone = projectMilestones[project.slug];
          return <div key={project.slug} className="rounded-xl border border-border bg-bg-card p-4"><dt className="text-gold text-sm">{project.title}</dt><dd className="text-text-muted text-xs mt-2">{milestone ? <>{milestone.label} · <time dateTime={milestone.date}>{projectDate(milestone.date)}</time></> : 'Release date not recorded'}</dd></div>;
        })}</dl>
      </section>
      <section className="py-12 max-w-5xl mx-auto px-5 sm:px-8">
        <h2 className="font-display text-3xl mb-3">More things I’m building</h2><p className="text-text-muted mb-8">Learning, creating and exploring with AI.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.filter(p => !p.showcase && !p.featuredOrder).map((p, i) => (
            <Reveal key={p.slug} delay={i * 90}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-5 sm:px-8">
        <Reveal>
          <div className="rounded-2xl border border-dashed border-border bg-bg-soft/30 p-7 flex items-start gap-4">
            <MessageSquare className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-text leading-relaxed">
                Have an idea, a collaboration or a project in mind? I&apos;d love to hear about it.
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="mt-3 text-sm text-gold hover:text-gold-soft transition-colors link-underline"
              >
                Get in touch
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

