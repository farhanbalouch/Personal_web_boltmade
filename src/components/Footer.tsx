import { Mail, MapPin, Phone, Instagram, Youtube, Facebook } from 'lucide-react';
import { useRouter } from '@/router';
import { SITE } from '@/data/content';

export function Footer() {
  const { navigate } = useRouter();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-bg-soft/40 mt-auto">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          
          {/* Brand & Logo Column */}
          <div className="space-y-3 md:col-span-1">
            <button
              onClick={() => navigate('/')}
              className="block transition-transform hover:scale-105"
            >
              <img 
                src="/file_00000000a8d8820ba4e7966e99324f57.png" 
                alt="Farhan Balouch Full Logo" 
                className="h-16 w-auto object-contain"
              />
            </button>
            <p className="text-sm text-text-muted max-w-xs leading-relaxed italic">
              "Farhan — A Story Still Being Written." ⭐
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-body font-semibold">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/about')} className="text-text-muted hover:text-gold transition-colors">About</button></li>
              <li><button onClick={() => navigate('/story')} className="text-text-muted hover:text-gold transition-colors">My Story</button></li>
              <li><button onClick={() => navigate('/work')} className="text-text-muted hover:text-gold transition-colors">Work</button></li>
              <li><button onClick={() => navigate('/contact')} className="text-text-muted hover:text-gold transition-colors">Contact</button></li>
            </ul>
          </div>

          {/* Contact Details Column */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-body font-semibold">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="mailto:Muhammadfarhan138223@gmail.com" className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors">
                  <Mail className="w-4 h-4 text-gold" /> Muhammadfarhan138223@gmail.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/923093244171" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors">
                  <Phone className="w-4 h-4 text-gold" /> +92 309 3244171
                </a>
              </li>
              <li className="flex items-center gap-2 text-text-muted">
                <MapPin className="w-4 h-4 text-gold" /> Ahmadpur East, Pakistan
              </li>
            </ul>
          </div>

          {/* Social Links Column */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted mb-3 font-body font-semibold">Follow Me</h4>
            <div className="flex flex-col space-y-2 text-sm">
              <a 
                href="https://www.instagram.com/farhan_deals/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors"
              >
                <Instagram className="w-4 h-4" /> Instagram
              </a>
              <a 
                href="https://www.tiktok.com/@farhandeals.store" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors"
              >
                <span className="font-bold text-xs px-1 border border-current rounded">TT</span> TikTok
              </a>
              <a 
                href="https://www.youtube.com/@FarhanDeals/shorts" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors"
              >
                <Youtube className="w-4 h-4" /> YouTube
              </a>
              <a 
                href="https://www.facebook.com/p/Farhan-Deals-61586852994463/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-text-muted hover:text-gold transition-colors"
              >
                <Facebook className="w-4 h-4" /> Facebook
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">© {year} Farhan Balouch. All rights reserved.</p>
          <p className="text-xs text-text-muted">Built with care. Narrated by Rawi.</p>
        </div>
      </div>
    </footer>
  );
}
