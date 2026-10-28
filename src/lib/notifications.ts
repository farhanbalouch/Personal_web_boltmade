type PushSubscription = {
  optedIn: boolean;
  id?: string;
  optIn: () => Promise<void>;
  optOut: () => Promise<void>;
};
type OneSignalSDK = {
  Notifications: { requestPermission: () => Promise<void> };
  User: { PushSubscription: PushSubscription };
};
declare global {
  interface Window {
    OneSignalDeferred?: Array<(sdk: OneSignalSDK) => void>;
    farhanPushReady?: Promise<OneSignalSDK>;
  }
}
export function getPushSDK(): Promise<OneSignalSDK> {
  if (window.farhanPushReady)
    return Promise.race([
      window.farhanPushReady,
      new Promise<OneSignalSDK>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Notification service is unavailable. Please try again.",
              ),
            ),
          12000,
        ),
      ),
    ]);
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () =>
        reject(
          new Error("Notification service is unavailable. Please try again."),
        ),
      12000,
    );
    (window.OneSignalDeferred ||= []).push((sdk) => {
      clearTimeout(timer);
      resolve(sdk);
    });
  });
}
export async function allowNotifications() {
  if (
    !window.isSecureContext ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  )
    throw new Error(
      "Open this website in Chrome, Edge, Firefox or a supported browser to allow notifications. On iPhone, add it to your Home Screen first.",
    );
  if (Notification.permission === "denied")
    throw new Error(
      "Notifications are blocked. Open this site’s browser settings, allow notifications, then try again.",
    );
  const sdk = await getPushSDK();
  await sdk.Notifications.requestPermission();
  if (Notification.permission !== "granted")
    throw new Error(
      "Permission was not allowed. You can try again whenever you want.",
    );
  await sdk.User.PushSubscription.optIn();
  // optIn resolves before the subscription change can finish registering.
  for (let i = 0; i < 40; i++) {
    if (sdk.User.PushSubscription.optedIn && sdk.User.PushSubscription.id) {
      localStorage.setItem("push_allowed", "1");
      window.dispatchEvent(new Event("push-status"));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    "Permission allowed, but registration is still pending. Please try again.",
  );
}
