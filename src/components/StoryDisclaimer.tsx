import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

const messages = [
  'AI-generated & creatively edited — not every detail is 100% accurate.',
  'This story is based on real experiences, but some scenes may be creatively presented.',
  'A personal story, creatively edited with AI — please don’t take every scene literally.',
  'Some details, scenes & dialogues may be AI-generated or creatively reconstructed.',
  'Inspired by real moments — presented through AI-assisted storytelling.',
  'Story note: Not every scene represents events exactly as they happened.',
  'For storytelling purposes, some moments may be reconstructed or dramatized.',
];

const positions = [
  'story-disclaimer-top',
  'story-disclaimer-middle',
  'story-disclaimer-bottom',
  'story-disclaimer-upper-middle',
];

export function StoryDisclaimer() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [positionIndex, setPositionIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const runAnimation = () => {
      if (!mounted) return;

      setVisible(true);

      // Stay completely still for 2 seconds.
      timer = setTimeout(() => {
        if (!mounted) return;

        setVisible(false);

        // Wait 5 seconds after leaving before next message.
        timer = setTimeout(() => {
          if (!mounted) return;

          setMessageIndex((current) => (current + 1) % messages.length);
          setPositionIndex((current) => (current + 1) % positions.length);

          runAnimation();
        }, 5000);
      }, 11000); // 2 sec stop + ~9 sec total visible animation
    };

    // Initial 10 second delay.
    timer = setTimeout(() => {
      runAnimation();
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={`story-disclaimer ${
        positions[positionIndex]
      } ${visible ? 'story-disclaimer-visible' : ''}`}
      aria-hidden="true"
    >
      <div className="story-disclaimer-inner">
        <span className="story-disclaimer-alert">
          <AlertCircle />
        </span>

        <span className="story-disclaimer-text">
          {messages[messageIndex]}
        </span>
      </div>
    </div>
  );
          }
