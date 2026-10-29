export interface StudioInstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let pending: StudioInstallEvent | null = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  pending = event as StudioInstallEvent;
  window.dispatchEvent(new Event("studio-install-ready"));
});
window.addEventListener("appinstalled", () => {
  pending = null;
  window.dispatchEvent(new Event("studio-installed"));
});
export function installed() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
export function installAvailable() {
  return !!pending;
}
export async function promptInstall() {
  const event = pending;
  if (!event) return false;
  pending = null;
  await event.prompt();
  return (await event.userChoice).outcome === "accepted";
}
export async function setupStudioPwa() {
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest.webmanifest";
    document.head.appendChild(link);
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", "#101c34");
  const favicon = document.querySelector('link[rel="icon"]');
  favicon?.setAttribute("href", "/admin/icons/icon-192.png");
  for (const [name, content] of [
    ["apple-mobile-web-app-capable", "yes"],
    ["apple-mobile-web-app-status-bar-style", "default"],
    ["apple-mobile-web-app-title", "Farhan Studio"],
    ["mobile-web-app-capable", "yes"],
  ]) {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const meta = document.createElement("meta");
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  }
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const link = document.createElement("link");
    link.rel = "apple-touch-icon";
    link.href = "/admin/icons/apple-touch-icon.png";
    document.head.appendChild(link);
  }
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return null;
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/", updateViaCache: "none",
  });
  // Retire only our former nested worker on this dedicated Studio origin.
  // The public portfolio and its OneSignal worker live on a different origin.
  await new Promise<void>((resolve, reject) => {
    if (registration.active?.state === "activated") { resolve(); return; }
    const worker = registration.installing || registration.waiting;
    if (!worker) { reject(new Error("Studio worker is not ready.")); return; }
    const finish = () => {
      if (worker.state !== "activated" && worker.state !== "redundant") return;
      clearTimeout(timer);
      worker.removeEventListener("statechange", finish);
      if (worker.state === "activated") resolve();
      else reject(new Error("Studio app shell could not be installed."));
    };
    const timer = setTimeout(() => {
      worker.removeEventListener("statechange", finish);
      reject(new Error("Studio app shell setup timed out."));
    }, 20000);
    worker.addEventListener("statechange", finish);
    finish();
  });
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const old of registrations) {
    const script = old.active?.scriptURL || old.waiting?.scriptURL || old.installing?.scriptURL;
    if (old.scope === new URL("/admin/", location.origin).href &&
        script === new URL("/admin/sw.js", location.origin).href)
      await old.unregister();
  }
  registration.active?.postMessage({ type: "STUDIO_CLAIM" });
  window.dispatchEvent(new Event("studio-worker-ready"));
  return registration;
}
