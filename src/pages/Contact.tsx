import { Mail, MapPin, Send, Globe, Github, Twitter, Linkedin, Sparkles } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Reveal } from '@/components/Reveal';
import { SITE } from '@/data/content';

export function Contact() {
  // Placeholder social slots — clearly marked, ready to fill
  const socials = [
    { icon: Github, label: 'GitHub', url: '', placeholder: 'github.com/yourusername' },
    { icon: Twitter, label: 'Twitter / X', url: '', placeholder: 'x.com/yourhandle' },
    { icon: Linkedin, label: 'LinkedIn', url: '', placeholder: 'linkedin.com/in/yourprofile' },
  ];

  return (
    <>
      <Seo
        title="Contact — Farhan Balouch"
        description="Get in touch with Farhan Balouch. Email and social links (coming soon)."
        path="/contact"
      />

      <section className="pt-32 pb-16 max-w-2xl mx-auto px-5 sm:px-8">
        <Reveal>
          <p className="text-sm text-gold/80 font-medium tracking-wide uppercase mb-4">Contact</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-display text-4xl sm:text-5xl mb-6 leading-tight">
            Say salaam
          </h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="text-lg text-text-muted leading-relaxed mb-10">
            Whether it's a project, a question, or just a hello — the door is open.
            The fastest way to reach me is email.
          </p>
        </Reveal>

        {/* Email card */}
        <Reveal delay={180}>
          <a
            href={`mailto:${SITE.email}`}
            className="card-glow block rounded-2xl border border-border bg-bg-card p-7 mb-10"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Mail className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Email</p>
                <p className="font-display text-lg text-text truncate">{SITE.email}</p>
              </div>
              <Send className="w-5 h-5 text-text-muted shrink-0" />
            </div>
          </a>
        </Reveal>

        {/* Location */}
        <Reveal delay={220}>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-bg-card/50 p-6 mb-10">
            <div className="w-12 h-12 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-teal" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Based in</p>
              <p className="font-display text-lg text-text">{SITE.origin}</p>
            </div>
          </div>
        </Reveal>

        {/* Social slots */}
        <Reveal delay={260}>
          <h2 className="font-display text-xl mb-5 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal" />
            Social links
          </h2>
        </Reveal>
        <div className="space-y-3">
          {socials.map((s, i) => (
            <Reveal key={s.label} delay={300 + i * 80}>
              <div className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-bg-soft/20 p-5">
                <div className="w-10 h-10 rounded-lg bg-bg-soft border border-border flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{s.label}</p>
                  <p className="text-xs text-text-muted/70">{s.url ? s.url : `Not set yet — ${s.placeholder}`}</p>
                </div>
                <span className="text-xs text-text-muted/60 italic">slot open</span>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Note */}
        <Reveal delay={560}>
          <p className="mt-10 text-sm text-text-muted/70 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-gold/60 shrink-0 mt-0.5" />
            Social profiles aren't set up yet — these slots are ready and waiting.
            Once you create the accounts, the links can be wired in.
          </p>
        </Reveal>
      </section>
    </>
  );
}
