import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { getPushSDK } from "@/lib/notifications";
import { NotificationButton } from "./NotificationButton";
export function NotifyPopup() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (
        !("Notification" in window) ||
        Notification.permission === "denied"
      )
        return;
      try {
        try { if (localStorage.getItem("notify_dismissed") === "1") return; } catch { /* Optional storage. */ }
        if (Notification.permission !== "granted") { if (!cancelled) setVisible(true); return; }
        const sdk = await getPushSDK();
        if (!cancelled && !(sdk.User.PushSubscription.optedIn && sdk.User.PushSubscription.id)) setVisible(true);
      } catch {
        /* Footer remains available for retry. */
      }
    }, 15000);
    const close = () => setVisible(false);
    window.addEventListener("push-status", close);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("push-status", close);
    };
  }, []);
  if (!visible) return null;
  return (
    <aside className="notify-popup" aria-label="Website updates">
      <button
        className="notify-popup-close"
        aria-label="Dismiss notification invitation"
        onClick={() => {
          try { localStorage.setItem("notify_dismissed", "1"); } catch { /* Close still works. */ }
          setVisible(false);
        }}
      >
        <X size={16} />
      </button>
      <div className="notify-popup-icon">
        <BellRing size={22} />
      </div>
      <p className="notify-popup-text">
        New stories, fresh projects, and notes from my journey.
      </p>
      <NotificationButton />
    </aside>
  );
}
