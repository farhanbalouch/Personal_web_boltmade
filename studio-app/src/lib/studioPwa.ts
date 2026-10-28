export interface StudioInstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let pending: StudioInstallEvent | null = null;
window.addEventListener("beforeinstallprompt", (event) => {
  if (!location.pathname.startsWith("/admin")) return;
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
export function setupStudioPwa() {
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/admin/manifest.webmanifest";
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
  if ("serviceWorker" in navigator)
    return navigator.serviceWorker.register("/admin/sw.js", {
      scope: "/admin/",
      updateViaCache: "none",
    });
  return Promise.resolve(null);
}
