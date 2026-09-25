import { useEffect, useState, useRef } from 'react';
import { AlertCircle, Pause, Play } from 'lucide-react';

interface StoryGateOverlayProps {
  onComplete: () => void;
  seconds?: number;
}

export function StoryGateOverlay({ onComplete, seconds = 5 }: StoryGateOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (paused || done) return;

    if (timeLeft <= 0) {
      setDone(true);
      onCompleteRef.current();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, paused, done]);

  if (done) return null;

  return (
    <div className="story-gate-overlay" role="dialog" aria-modal="true">
      <div className="story-gate-box">
        <div className="story-gate-top-row">
          <div className="story-gate-controls">
            <button
              type="button"
              className="story-gate-btn"
              onClick={() => setPaused(true)}
              disabled={paused}
              aria-label="Pause countdown"
            >
              <Pause size={16} />
            </button>
            <button
              type="button"
              className="story-gate-btn"
              onClick={() => setPaused(false)}
              disabled={!paused}
              aria-label="Resume countdown"
            >
              <Play size={16} />
            </button>
          </div>

          <div className="story-gate-countdown">{timeLeft}</div>
        </div>

        <div className="story-gate-content">
          <span className="story-gate-alert">
            <AlertCircle size={20} />
          </span>
          <p className="story-gate-text">
            This story is AI-generated and creatively edited. Some scenes,
            details, or dialogues may not be 100% real. Please double-confirm
            with the site owner, Farhan Balouch, before treating any part of
            it as fact.
          </p>
        </div>
      </div>
    </div>
  );
}
