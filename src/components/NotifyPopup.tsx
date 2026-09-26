import { useEffect, useState, useRef } from 'react';
import { BellRing, X } from 'lucide-react';

const DELAYS = [5, 60, 120, 180]; // seconds: 5s, then 1min, 2min, 3min

// OneSignal loads asynchronously via the script tag in index.html. This
// helper waits for window.OneSignalDeferred to be ready before we touch it.
function withOneSignal(fn: (OneSignal: any) => void) {
  if (typeof window === 'undefined') return;
  (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
  (window as any).OneSignalDeferred.push(fn);
}

export function NotifyPopup() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const dismissedForever = useRef(
    typeof window !== 'undefined' && localStorage.getItem('notify_dismissed') === '1'
  );

  useEffect(() => {
    if (dismissedForever.current) return;

    // If they already granted browser permission some other way (or are
    // already subscribed), don't bother showing the popup at all.
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      localStorage.setItem('notify_dismissed', '1');
      dismissedForever.current = true;
      return;
    }

    if (stepIndex >= DELAYS.length) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, DELAYS[stepIndex] * 1000);

    return () => clearTimeout(timer);
  }, [stepIndex]);

  const handleClose = () => {
    setVisible(false);
    setStepIndex((i) => i + 1); // next delay ke liye schedule ho jayega
  };

  const handleAllow = () => {
    withOneSignal(async (OneSignal) => {
      try {
        // This is the real subscribe step: it registers the service
        // worker, asks for browser permission, AND tells OneSignal to
        // remember this browser as a subscriber it can push to later.
        await OneSignal.Notifications.requestPermission();
      } catch (err) {
        console.error('OneSignal subscribe failed:', err);
      }
    });
    localStorage.setItem('notify_dismissed', '1');
    dismissedForever.current = true;
    setVisible(false);
  };

  const handleNeverShow = () => {
    localStorage.setItem('notify_dismissed', '1');
    dismissedForever.current = true;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="notify-popup">
      <button className="notify-popup-close" onClick={handleClose} aria-label="Close">
        <X size={16} />
      </button>
      <div className="notify-popup-icon">
        <BellRing size={22} />
      </div>
      <p className="notify-popup-text">
        Get notified the moment a new blog post or story chapter drops. No spam, ever.
      </p>
      <div className="notify-popup-actions">
        <button className="notify-popup-allow" onClick={handleAllow}>
          Allow Notifications
        </button>
        <button className="notify-popup-never" onClick={handleNeverShow}>
          Don't show again
        </button>
      </div>
    </div>
  );
}
