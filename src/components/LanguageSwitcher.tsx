import { Languages } from 'lucide-react';
import { useLanguage, type Language } from '@/context/LanguageContext';

const OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hinglish' },
  { code: 'ur', label: '\u0627\u0631\u062f\u0648' },
];

/** Small pill switcher used on the story hub and chapter pages. */
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center gap-1.5 p-1 rounded-full border border-border bg-bg-soft/60">
      <Languages className="w-3.5 h-3.5 text-text-muted ml-2" aria-hidden="true" />
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          onClick={() => setLanguage(opt.code)}
          aria-pressed={language === opt.code}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            language === opt.code
              ? 'bg-gold text-bg'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
