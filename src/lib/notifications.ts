type PushSubscription = {
  optedIn: boolean;
  id?: string;
  optIn: () => Promise<void>;
  optOut: () => Promise<void>;
};
type OneSignalSDK = { User: { PushSubscription: PushSubscription } };
declare global {
  interface Window {
    OneSignalDeferred?: Array<(sdk: OneSignalSDK) => void>;
    farhanPushReady?: Promise<OneSignalSDK>;
    farhanStartPush?: () => Promise<OneSignalSDK>;
  }
}
export function rememberPushState(enabled: boolean) {
  try {
    if (enabled) localStorage.setItem('push_allowed', '1');
    else { localStorage.removeItem('push_allowed'); localStorage.setItem('notify_dismissed', '1'); }
  } catch { /* Storage is optional; browser permission and subscription are authoritative. */ }
  window.dispatchEvent(new Event('push-status'));
}
export function getPushSDK(): Promise<OneSignalSDK> {
  if (!('Notification' in window) || Notification.permission !== 'granted')
    return Promise.reject(new Error('Use Allow notifications first.'));
  const ready = window.farhanStartPush?.() || window.farhanPushReady;
  if (!ready) return Promise.reject(new Error('Reload the page to connect notifications.'));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Notification service is unavailable. Check your connection and reload.')), 12000);
    ready.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
export async function allowNotifications() {
  if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window))
    throw new Error('Use a supported browser in a normal window. On iPhone, add this website to your Home Screen first.');
  if (Notification.permission === 'denied')
    throw new Error('Notifications are blocked. Use a normal browser window and allow notifications in this site’s browser settings.');
  // Keep the native prompt directly inside the click gesture, before any SDK/network await.
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permission was not allowed. Try a normal browser window; private/Incognito windows may not support push notifications.');
  const sdk = await getPushSDK();
  await sdk.User.PushSubscription.optIn();
  for (let i = 0; i < 40; i++) {
    if (Notification.permission !== 'granted') throw new Error('Browser notification permission was removed.');
    if (sdk.User.PushSubscription.optedIn && sdk.User.PushSubscription.id) {
      rememberPushState(true);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('Permission is allowed, but push registration is still pending. Check your connection, reload and try again.');
}
