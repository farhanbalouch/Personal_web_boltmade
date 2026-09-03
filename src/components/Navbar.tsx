import { useEffect, useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { useRouter } from '@/router';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/story', label: 'My Story' },
  { href: '/work', label: 'Work' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const { route, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [route.path]);

  // Lock scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? route.path === '/' : route.path.startsWith(href);

  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-bg/85 backdrop-blur-md border-b border-border/60'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => go('/')}
            className="flex items-center gap-2 font-display text-lg font-semibold text-text hover:text-gold transition-colors"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span>Farhan Balouch</span>
          </button>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <button
                  onClick={() => go(l.href)}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(l.href)
                      ? 'text-gold'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 text-text-muted hover:text-text transition-colors"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden bg-bg/95 backdrop-blur-lg pt-16 chat-pop">
          <ul className="flex flex-col items-center gap-2 p-8">
            {links.map((l, i) => (
              <li key={l.href}>
                <button
                  onClick={() => go(l.href)}
                  className={`text-2xl font-display py-3 transition-colors ${
                    isActive(l.href) ? 'text-gold' : 'text-text-muted hover:text-text'
                  }`}
                  style={{ animation: `msg-in 0.3s ease ${i * 60}ms both` }}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
