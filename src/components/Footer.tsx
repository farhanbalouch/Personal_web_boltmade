import { Sparkles, Mail, MapPin } from 'lucide-react';
import { useRouter } from '@/router';
import { SITE } from '@/data/content';

export function Footer() {
  const { navigate } = useRouter();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-bg-soft/40 mt-auto">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 font-display text-lg font-semibold text-text mb-3"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              Farhan Balouch
            </button>
            <p className="text-sm text-text-muted max-w-xs leading-relaxed">
              From Ahmadpur East to the world of AI, SEO, and online business.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-body font-semibold">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/about')} className="text-text-muted hover:text-gold transition-colors">About</button></li>
              <li><button onClick={() => navigate('/story')} className="text-text-muted hover:text-gold transition-colors">My Story</button></li>
              <li><button onClick={() => navigate('/work')} className="text-text-muted hover:text-gold transition-colors">Work</button></li>
              <li><button onClick={() => navigate('/contact')} className="text-text-muted hover:text-gold transition-colors">Contact</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-body font-semibold">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors">
                  <Mail className="w-4 h-4" /> {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-text-muted">
                <MapPin className="w-4 h-4" /> {SITE.origin}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">© {year} Farhan Balouch. All rights reserved.</p>
          <p className="text-xs text-text-muted">Built with care. Narrated by Rawi.</p>
        </div>
      </div>
    </footer>
  );
}
