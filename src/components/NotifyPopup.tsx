import { useEffect, useState, useRef } from 'react';
import { BellRing, X } from 'lucide-react';

const DELAYS = [5, 60, 120, 180]; // seconds: 5s, then 1min, 2min, 3min

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

    // IMPORTANT: we check OneSignal's OWN record of whether this browser
    // is a push subscriber — NOT the raw browser Notification.permission.
    // A browser can have permission "granted" (e.g. from an earlier test,
    // or a different site) while OneSignal still has no subscription for
    // it at all. Checking the wrong thing was the bug that caused pushes
    // to silently never register.
    withOneSignal((OneSignal) => {
      const alreadySubscribed = OneSignal.User?.PushSubscription?.optedIn;
      if (alreadySubscribed) {
        localStorage.setItem('notify_dismissed', '1');
        dismissedForever.current = true;
        return;
      }
      scheduleNext();
    });

    function scheduleNext() {
      if (stepIndex >= DELAYS.length) return;
      const timer = setTimeout(() => setVisible(true), DELAYS[stepIndex] * 1000);
      return () => clearTimeout(timer);
    }

    scheduleNext();
  }, [stepIndex]);

  const handleClose = () => {
    setVisible(false);
    setStepIndex((i) => i + 1);
  };

  const handleAllow = () => {
    withOneSignal(async (OneSignal) => {
      try {
        // requestPermission() asks the browser AND, if granted, creates
        // the actual OneSignal push subscription (registers the service
        // worker + stores the subscription server-side).
        await OneSignal.Notifications.requestPermission();

        // Extra safety: explicitly opt in too, in case permission was
        // already granted at the browser level from before (so
        // requestPermission() alone might not re-trigger subscription).
        if (OneSignal.User?.PushSubscription && !OneSignal.User.PushSubscription.optedIn) {
          await OneSignal.User.PushSubscription.optIn();
        }
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
