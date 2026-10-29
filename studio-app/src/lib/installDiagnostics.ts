import { installed, installState, setupStudioPwa } from "./studioPwa";

type Check = { name: string; status: "pass" | "warning" | "fail"; detail: string };
type RelatedApp = { platform: string; url?: string; id?: string };
export type InstallReport = {
  version: 1;
  origin: string;
  browser: string;
  android: string;
  appWindow: boolean;
  installedApp: "detected" | "not-reported" | "unsupported" | "check-failed";
  checks: Check[];
  runtime: ReturnType<typeof installState>;
  summary: string;
  limitation: string;
};

export function installationSummary(checks: Check[], app: InstallReport["installedApp"], runtime: ReturnType<typeof installState>) {
  if (checks.some((check) => check.status === "fail")) return "A website check failed. Share the report so this specific failure can be fixed.";
  if (app === "detected") return "This browser reports Studio installed. Confirm Farhan Studio in Android Settings → Apps.";
  if (runtime.browserReportedInstall || runtime.promptState === "accepted") return "Website checks passed, but an installed app has not been confirmed. Chrome’s package-install log is the next check.";
  return "Website checks passed. This does not confirm that Android can create and install the app package.";
}

function localUrl(raw: string, base: string) {
  const url = new URL(raw, base);
  if (url.origin !== location.origin || url.username || url.password) throw new Error("Expected an asset on this Studio address");
  return url;
}

async function timed<T>(promise: Promise<T>, timeout = 12000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([promise, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Check timed out")), timeout);
    })]);
  } finally { clearTimeout(timer!); }
}

async function checkIcon(icon: { src: string; sizes?: string }, base: string): Promise<Check> {
  const url = localUrl(icon.src, base);
  const name = `Icon ${icon.sizes || "size"}`;
  try {
    const response = await fetch(url, { credentials: "omit", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.headers.get("content-type")?.startsWith("image/")) throw new Error("The icon URL did not return an image");
    const blob = await response.blob();
    if (blob.size > 1000000) throw new Error("Icon exceeds 1 MB");
    // Decode the actual served image, not only the declared manifest dimensions.
    const bitmap = await timed(createImageBitmap(blob));
    const { width, height } = bitmap;
    bitmap.close();
    if (width < 192 || width !== height) throw new Error(`Unexpected dimensions: ${width} × ${height}`);
    if (icon.sizes && !icon.sizes.split(/\s+/).includes(`${width}x${height}`)) throw new Error(`Manifest says ${icon.sizes}, image is ${width} × ${height}`);
    return { name, status: "pass", detail: `${url.pathname}: ${width} × ${height}, image decoded` };
  } catch (error) {
    return { name, status: "fail", detail: `${url.pathname}: ${error instanceof Error ? error.message : "Image check failed"}` };
  }
}

// This checks only this site's public setup and the browser's own install state.
// It does not read cookies, tokens, drafts, personal files or other installed apps.
// Nothing is sent to an API or analytics service; the owner can copy the report.
export async function collectInstallReport(): Promise<InstallReport> {
  const checks: Check[] = [];
  const ua = navigator.userAgent;
  const report: InstallReport = {
    version: 1, origin: location.origin,
    browser: ua.match(/(?:SamsungBrowser|EdgA|Chrome)\/[\d.]+/g)?.join("; ") || "Other browser",
    android: ua.match(/Android [\d.]+/)?.[0] || "Not reported",
    appWindow: installed(), installedApp: "unsupported", checks, runtime: installState(), summary: "",
    limitation: "A website cannot read Google Play's WebAPK installation errors or guarantee an Android app package. An empty installed-app result is not proof of an installation failure. This report contains no password, token or draft data.",
  };
  checks.push({name: "Secure connection", status: isSecureContext ? "pass" : "fail", detail: location.protocol});
  let manifestUrl: URL | undefined;
  try {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) throw new Error("No manifest link in this page");
    manifestUrl = localUrl(link.href, location.href);
    const response = await fetch(manifestUrl, { credentials: "omit", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
    const manifest = await response.json();
    if (typeof manifest.start_url !== "string" || typeof manifest.scope !== "string" || typeof manifest.id !== "string") throw new Error("Manifest is missing its app ID, start URL or scope");
    const start = localUrl(manifest.start_url, manifestUrl.href);
    const scope = localUrl(manifest.scope, manifestUrl.href);
    if (!manifest.name || manifest.display !== "standalone" || !start.href.startsWith(scope.href)) throw new Error("Manifest name, standalone mode or start/scope is invalid");
    checks.push({ name: "App manifest", status: "pass", detail: `ID ${manifest.id}; start ${start.pathname}; scope ${scope.pathname}; ${manifest.display}` });
    const icons = manifest.icons;
    if (!Array.isArray(icons) || !icons.some((icon) => icon.sizes === "192x192") || !icons.some((icon) => icon.sizes === "512x512")) throw new Error("Missing 192px or 512px app icon");
    checks.push(...await Promise.all(icons.slice(0, 5).map((icon) => checkIcon(icon, manifestUrl!.href))));
  } catch (error) {
    checks.push({name: "Manifest / public assets", status: "fail", detail: error instanceof Error ? error.message : "Could not check manifest"});
  }
  try {
    const registration = await timed(setupStudioPwa(), 22000);
    if (!registration?.active) throw new Error("No activated Studio service worker");
    checks.push({name: "App service worker", status: "pass", detail: `${registration.active.state}; scope ${new URL(registration.scope).pathname}`});
    checks.push({name: "Page controlled by worker", status: navigator.serviceWorker.controller ? "pass" : "warning", detail: navigator.serviceWorker.controller ? new URL(navigator.serviceWorker.controller.scriptURL).pathname : "Not yet controlled. Reload once after the worker activates."});
    const shell = await caches.match(new URL("/admin/", location.origin).href);
    checks.push({name: "Offline login screen", status: shell?.ok ? "pass" : "warning", detail: shell?.ok ? "App shell is cached; private API data is not inspected" : "App shell not found in this browser cache"});
  } catch (error) {
    checks.push({name: "App service worker", status: "fail", detail: error instanceof Error ? error.message : "Worker check failed"});
  }
  const browser = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<RelatedApp[]> };
  if (browser.getInstalledRelatedApps && manifestUrl) {
    try {
      const apps = await timed(browser.getInstalledRelatedApps());
      report.installedApp = apps.some((app) => app.platform === "webapp" && app.url && new URL(app.url, location.href).href === manifestUrl!.href) ? "detected" : "not-reported";
    } catch { report.installedApp = "check-failed"; }
  }
  report.runtime = installState();
  report.summary = installationSummary(checks, report.installedApp, report.runtime);
  return report;
}
