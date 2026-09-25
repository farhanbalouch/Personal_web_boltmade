import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Pause, Play } from 'lucide-react';

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

          <div className={`story-gate-countdown ${paused ? 'story-gate-countdown-paused' : ''}`}>
            {timeLeft}
          </div>
        </div>

        <div className="story-gate-icon-wrap">
          <AlertTriangle className="story-gate-icon" size={44} strokeWidth={2.2} />
        </div>

        <p className="story-gate-heading">AI-GENERATED CONTENT WARNING</p>

        <p className="story-gate-text">
          This story is AI-generated and creatively edited. Some scenes,
          details, or dialogues may <span className="story-gate-highlight">NOT be 100% real</span>.
          Please double-confirm with the site owner,{' '}
          <span className="story-gate-highlight">Farhan Balouch</span>, before
          treating any part of it as fact.
        </p>

        <div className="story-gate-progress-track">
          <div
            className="story-gate-progress-fill"
            style={{
              width: `${(timeLeft / seconds) * 100}%`,
              transition: paused ? 'none' : 'width 1s linear',
            }}
          />
        </div>
      </div>
    </div>
  );
      }
