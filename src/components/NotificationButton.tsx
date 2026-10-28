import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { allowNotifications, getPushSDK } from "@/lib/notifications";
export function NotificationButton() {
  const [enabled, setEnabled] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    const update = () => {
      getPushSDK()
        .then((sdk) =>
          setEnabled(
            !!(
              sdk.User.PushSubscription.optedIn && sdk.User.PushSubscription.id
            ),
          ),
        )
        .catch(() => {});
    };
    update();
    window.addEventListener("push-status", update);
    return () => window.removeEventListener("push-status", update);
  }, []);
  async function toggle() {
    setBusy(true);
    setMessage("");
    try {
      if (enabled) {
        const sdk = await getPushSDK();
        await sdk.User.PushSubscription.optOut();
        setEnabled(false);
        localStorage.removeItem("push_allowed");
        setMessage("Notifications turned off.");
      } else {
        await allowNotifications();
        setEnabled(true);
        setMessage("You’ll receive new blogs, stories and project updates.");
      }
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl border border-gold/40 px-4 py-3 text-sm text-gold disabled:opacity-50"
      >
        {enabled ? <Check size={16} /> : <Bell size={16} />}
        {busy
          ? "Connecting…"
          : enabled
            ? "Notifications on · Turn off"
            : "Allow notifications"}
      </button>
      <p role="status" className="text-xs text-text-muted mt-2 max-w-sm">
        {message ||
          "No email or account needed. You can turn them off anytime."}
      </p>
    </div>
  );
}
