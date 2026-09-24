import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const messages = {
  en: [
    'AI-generated & creatively edited — not every detail is 100% accurate.',
    'This story is based on real experiences, but some scenes may be creatively presented.',
    'A personal story, creatively edited with AI — please don’t take every scene literally.',
    'Some details, scenes & dialogues may be AI-generated or creatively reconstructed.',
    'Inspired by real moments — presented through AI-assisted storytelling.',
    'Story note: Not every scene represents events exactly as they happened.',
    'For storytelling purposes, some moments may be reconstructed or dramatized.',
  ],

  hi: [
    'AI-generated & creatively edited — not every detail is 100% accurate.',
    'This story is based on real experiences, but some scenes may be creatively presented.',
    'A personal story, creatively edited with AI — please don’t take every scene literally.',
    'Some details, scenes & dialogues may be AI-generated or creatively reconstructed.',
    'Inspired by real moments — presented through AI-assisted storytelling.',
    'Story note: Not every scene represents events exactly as they happened.',
    'For storytelling purposes, some moments may be reconstructed or dramatized.',
  ],

  ur: [
    'AI-generated & creatively edited — not every detail is 100% accurate.',
    'This story is based on real experiences, but some scenes may be creatively presented.',
    'A personal story, creatively edited with AI — please don’t take every scene literally.',
    'Some details, scenes & dialogues may be AI-generated or creatively reconstructed.',
    'Inspired by real moments — presented through AI-assisted storytelling.',
    'Story note: Not every scene represents events exactly as they happened.',
    'For storytelling purposes, some moments may be reconstructed or dramatized.',
  ],
} as const;

export function StoryDisclaimer() {
  const { language } = useLanguage();
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const currentMessages = messages[language] || messages.en;

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    const showNext = () => {
      setMessageIndex((current) => (current + 1) % currentMessages.length);
      setVisible(true);

      hideTimer = setTimeout(() => {
        setVisible(false);
      }, 7000);

      showTimer = setTimeout(() => {
        showNext();
      }, 13000);
    };

    // First appearance after about 5 seconds.
    showTimer = setTimeout(() => {
      setVisible(true);

      hideTimer = setTimeout(() => {
        setVisible(false);
      }, 7000);

      showTimer = setTimeout(() => {
        showNext();
      }, 13000);
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [language, currentMessages.length]);

  return (
    <div
      className={`story-disclaimer ${
        visible ? 'story-disclaimer-visible' : ''
      }`}
      dir={language === 'ur' ? 'rtl' : 'ltr'}
      aria-hidden="true"
    >
      <div className="story-disclaimer-inner">
        <Sparkles className="story-disclaimer-icon" />
        <span>{currentMessages[messageIndex]}</span>
      </div>
    </div>
  );
    }
