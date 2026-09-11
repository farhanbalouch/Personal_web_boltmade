import { useEffect, useState } from 'react';

export function CinematicIntro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        bg-black
        pointer-events-none
        animate-cinematic-intro
      "
      aria-label="Farhan Balouch"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />

      <div className="relative text-center">
        <p
          className="
            text-gold
            text-2xl sm:text-4xl
            font-display
            tracking-[0.35em]
            uppercase
            animate-intro-text
          "
        >
          FARHAN BALOUCH
        </p>

        <div
          className="
            mt-4 mx-auto
            h-px w-24
            bg-gold/60
          "
        />
      </div>

      {/* cinematic fog */}
      <div className="
        absolute bottom-[-10%] left-[-10%]
        w-[120%] h-[35%]
        rounded-[50%]
        bg-white/10
        blur-[80px]
        animate-intro-fog
      " />
    </div>
  );
}
