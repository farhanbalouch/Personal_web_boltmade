import { MessageSquare } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Reveal } from '@/components/Reveal';
import { ProjectCard } from '@/components/FeaturedProjects';
import { useRouter } from '@/router';
import { projects, SITE } from '@/data/content';

// Google ke liye: projects ki list structured data ke taur par
const projectsSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Projects by Farhan Balouch',
  itemListElement: projects
    .filter((p) => p.link)
    .map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.title,
      url: p.link,
      description: p.description,
    })),
};

export function Work() {
  const { navigate } = useRouter();

  return (
    <>
      <Seo
        title="Projects & Portfolio — Farhan Balouch"
        description="Projects by Farhan Balouch: Nexus AI (AI chatbot & coding assistant), Rawi (AI storyteller), Farhan Deals (e-commerce store), Hack AI (cybersecurity AI) and Movie Hub (coming soon)."
        path="/work"
        ogImage={SITE.ogImage}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectsSchema) }}
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
            AI chatbots, an online store and cybersecurity tools — everything I&apos;ve built so far,
            with bigger projects still on the way.
          </p>
        </Reveal>
      </section>

      <section className="py-12 max-w-5xl mx-auto px-5 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((p, i) => (
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
