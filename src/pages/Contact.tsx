import { Mail, MapPin, Send, Globe, Github, Youtube, Facebook, Instagram, MessageCircle, LucideIcon } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Reveal } from '@/components/Reveal';
import { SITE } from '@/data/content';

// Type definition for social item
interface SocialItem {
  label: string;
  handle: string;
  url: string;
  color?: string;
  badge?: string;
  icon?: LucideIcon | (({ className }: { className?: string }) => JSX.Element);
  faviconUrl?: string;
}

export function Contact() {
  // TikTok Icon Component (Custom SVG)
  const TiktokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V5.8a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 12a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.16 8.16 0 0 0 4.91 1.64V7.24a4.85 4.85 0 0 1-1-.55z" />
    </svg>
  );

  // All social media, websites & dynamic favicons
  const socials: SocialItem[] = [
    { 
      icon: MessageCircle, 
      label: 'WhatsApp', 
      handle: '+92 309 3244171',
      url: 'https://wa.me/923093244171?text=Hi%20Farhan,%20I%20reached%20out%20via%20your%20website!',
      color: 'hover:border-emerald-500/50 hover:text-emerald-400',
      badge: 'Direct Chat'
    },
    { 
      label: 'Nexus AI', 
      handle: 'nexusai.farhanbalouch.com',
      url: 'https://nexusai.farhanbalouch.com',
      faviconUrl: 'https://www.google.com/s2/favicons?domain=nexusai.farhanbalouch.com&sz=64',
      color: 'hover:border-purple-500/50 hover:text-purple-400',
      badge: 'AI Tool'
    },
    { 
      label: 'Hack AI', 
      handle: 'hackarai.streamlit.app',
      url: 'https://hackarai.streamlit.app',
      faviconUrl: 'https://www.google.com/s2/favicons?domain=hackarai.streamlit.app&sz=64',
      color: 'hover:border-emerald-500/50 hover:text-emerald-400',
      badge: 'AI App'
    },
    { 
      icon: Github, 
      label: 'GitHub', 
      handle: 'muhammadfarhan138223-cmyk',
      url: 'https://github.com/muhammadfarhan138223-cmyk',
      color: 'hover:border-purple-500/50'
    },
    { 
      icon: Linkedin, 
      label: 'LinkedIn', 
      handle: 'Farhan Balouch',
      url: 'https://www.linkedin.com/in/farhan-balouch-18a9b6434',
      color: 'hover:border-blue-500/50'
    },
    { 
      icon: Youtube, 
      label: 'YouTube', 
      handle: '@Farhanbalouch715',
      url: 'https://www.youtube.com/@Farhanbalouch715',
      color: 'hover:border-red-500/50'
    },
    { 
      icon: Facebook, 
      label: 'Facebook', 
      handle: 'Farhan Balouch',
      url: 'https://www.facebook.com/share/18xn791BLy/',
      color: 'hover:border-blue-600/50'
    },
    { 
      icon: Instagram, 
      label: 'Instagram', 
      handle: '@farhanbalouch715',
      url: 'https://www.instagram.com/farhanbalouch715',
      color: 'hover:border-pink-500/50'
    },
    { 
      icon: TiktokIcon, 
      label: 'TikTok', 
      handle: '@farhandeals.store',
      url: 'https://www.tiktok.com/@farhandeals.store',
      color: 'hover:border-cyan-500/50'
    },
    { 
      icon: Globe, 
      label: 'Farhan Deals Store', 
      handle: 'farhandeals.store',
      url: 'https://farhandeals.store',
      color: 'hover:border-gold/50'
    },
  ];

  return (
    <>
      <Seo
        title="Contact Farhan Balouch — Get in Touch via WhatsApp, Email & Socials"
        description="Connect with Farhan Balouch directly via WhatsApp (+92 309 3244171), Email, LinkedIn, GitHub, YouTube, or Instagram."
        path="/contact"
      />

      <section className="pt-28 pb-20 max-w-2xl mx-auto px-5 sm:px-8">
        {/* Availability Badge */}
        <Reveal>
          <p className="text-sm text-gold font-semibold tracking-wider uppercase mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Available for Opportunities
          </p>
        </Reveal>
        
        {/* Main Title */}
        <Reveal delay={80}>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4 leading-tight text-text">
            Say Salaam & Let's Connect
          </h1>
        </Reveal>

        <Reveal delay={140}>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed mb-10">
            Whether it's a project, a inquiry, or just a hello — reach out directly on WhatsApp or connect on any platform below.
          </p>
        </Reveal>

        {/* WhatsApp Direct Card */}
        <Reveal delay={180}>
          <a
            href="https://wa.me/923093244171?text=Hi%20Farhan,%20I%20reached%20out%20via%20your%20website!"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-6 mb-5 hover:border-emerald-500/60 transition-all shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Fastest Reply</p>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">WhatsApp Direct</span>
                </div>
                <p className="font-display text-lg font-bold text-text truncate">+92 309 3244171</p>
              </div>
              <Send className="w-5 h-5 text-emerald-400 opacity-70 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </Reveal>

        {/* Email Card */}
        <Reveal delay={220}>
          <a
            href={`mailto:${SITE.email}`}
            className="group block rounded-2xl border border-border bg-bg-card p-6 mb-6 hover:border-gold/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Email Direct</p>
                <p className="font-display text-lg text-text font-semibold truncate">{SITE.email}</p>
              </div>
              <Send className="w-5 h-5 text-text-muted group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </Reveal>

        {/* Location Card */}
        <Reveal delay={240}>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-bg-card/50 p-6 mb-10">
            <div className="w-12 h-12 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Based in</p>
              <p className="font-display text-lg text-text font-medium">{SITE.origin}</p>
            </div>
          </div>
        </Reveal>

        {/* Social & External Web Links Section */}
        <Reveal delay={260}>
          <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2 text-text">
            <Globe className="w-5 h-5 text-teal" />
            Social Platforms & Projects
          </h2>
        </Reveal>

        <div className="space-y-3">
          {socials.map((s, i) => (
            <Reveal key={s.label} delay={280 + i * 40}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-4 rounded-xl border border-border bg-bg-card p-4 transition-all hover:bg-bg-soft ${s.color}`}
              >
                {/* Dynamic Favicon or Lucide Icon Container */}
                <div className="w-10 h-10 rounded-lg bg-bg-soft border border-border flex items-center justify-center text-text group-hover:scale-110 transition-transform overflow-hidden p-2">
                  {s.faviconUrl ? (
                    <img 
                      src={s.faviconUrl} 
                      alt={s.label} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    s.icon && <s.icon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text">{s.label}</p>
                    {s.badge && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">{s.handle}</p>
                </div>

                <Send className="w-4 h-4 text-text-muted group-hover:translate-x-1 transition-transform shrink-0" />
              </a>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
