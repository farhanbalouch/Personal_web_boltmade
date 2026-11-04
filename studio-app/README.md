# Farhan Studio

A dedicated password-protected admin app for farhanbalouch.com, in the same GitHub repository. Deploy this folder as its own Vercel project. Public content and AI workflows remain in the repository root on main.

## Vercel setup

- Git repository: muhammadfarhan138223-cmyk/Personal_web_boltmade
- Production branch: main
- Root Directory: studio-app
- Framework: Vite; build: npm run build; output: dist; Node 22+
- Open the deployment URL (it redirects to /admin/). Add any HTTPS custom domain in this project's Settings → Domains. No source edits are needed.

Set these **server-only** environment variables for Production (and Preview if testing previews), then redeploy:

| Variable | Value |
| --- | --- |
| ADMIN_PASSWORD | Your one owner password, at least 16 characters, at most 256. Use a long unique passphrase. |
| STUDIO_GITHUB_TOKEN | The full existing fine-grained token for Personal_web_boltmade. Resource owner muhammadfarhan138223-cmyk; Contents and Actions: read/write. |
| ADMIN_SESSION_SECRET | A random secret of at least 32 characters. |

Never prefix these with VITE_; never commit secret values. Add them directly to Vercel. Missing/weak configuration fails closed with a setup message. The public app contains neither password nor GitHub credentials. GitHub Actions' existing GEMINI_API_KEY and OneSignal secrets remain in GitHub; no copying is needed.

## Access and mobile

Every fresh page/app opening starts at password verification, even if a session cookie exists. Use the same password on phone and desktop. A five-minute background period locks the UI when returning; local drafts stay on this device. The API validates encrypted HttpOnly, Secure, SameSite=Strict owner-session cookies on every data/write request, with an eight-hour expiry. Cookies contain no GitHub token. Rotating password, token, or session secret invalidates earlier sessions. Wrong passwords, legacy token login, other GitHub owners and cross-origin submissions cannot publish.

Login verifies the password with a constant-time digest comparison, then confirms the configured GitHub token belongs to the exact website owner and can read the private content. A bounded per-instance five-attempt/ten-minute limiter reduces repeated guesses; counters are not shared across Vercel instances. For stronger distributed limits, set a Vercel Firewall rate-limit rule on POST /api/studio. Use a strong unique password rather than relying on the instance limiter.

Choose Install Studio app in Chrome/Edge, or Safari → Share → Add to Home Screen. This is a standalone PWA with its own navy/gold icon and whole-origin scope. It caches the app shell, never API data, login requests or publish requests. Internet is required for login and publishing.

## Publishing

Write or import text; save a private draft or publish with AI. The API writes to the ORIGINAL repository's main branch. Existing GitHub workflows translate/publish and update farhanbalouch.com. Public links and production receipts intentionally use farhanbalouch.com; adding a Studio custom domain doesn't move the public website. Project announcements appear in Stories. Biography edits preserve chapters; the weekly workflow is unchanged.

The original /admin/ in the public root app keeps its existing GitHub-token connection. Use this dedicated project's URL or custom domain for the new password app.

## Development and verification

npm install
npm run typecheck
npm test
npm run build

Tests cover session tampering/expiry/rotation, exact-owner authorization, wrong passwords and legacy PAT rejection, CSRF, missing configuration, throttling and standalone PWA assets. They use mock credentials only; real publishing needs the configured server token. Never test notifications by broadcasting to all visitors.

## Android installation

The dedicated app uses /manifest.webmanifest and /sw.js with scope /, retaining /admin/ as its stable app ID. The original portfolio app and push worker on farhanbalouch.com are unaffected. Old Studio /admin/ worker registrations are retired after the root worker is ready. The root worker precaches the document and its first-load JS/CSS for an offline login shell, never private API responses.

Use one origin consistently (the chosen custom domain), in a regular Android Chrome tab. The in-app install button invokes the native beforeinstallprompt flow when offered; its fallback explains installation and does not create shortcuts. A WebAPK and a Chrome shortcut are different OS installations; removing/replacing an old home-screen shortcut is a device action. Chrome/GMS support, WebAPK service availability, device policy and launcher behavior can affect the final icon/install. Website code cannot guarantee removal of a browser badge on every Android device. A working older WebAPK does not establish that new installations currently succeed. Browser changes, Google Play install errors, package creation, device policy, storage, and asset download failures need evidence before choosing a fix. Do not remove a working older app or change security settings as a diagnostic. No claim of a native APK download is made.

## Photos

The writing desk accepts up to six JPG/PNG/WebP photos per blog, story, project update or biography chapter. It optimizes each to at most 1600px and 2 MB in WebP, uploads to public/media/studio on the original main branch, and saves only validated metadata with the draft. Uploaded files are public after deployment even before a draft is published; the UI discloses this before upload. The first image is the cover. Reorder, remove from the post, edit accessible descriptions, and add optional captions. Removing a reference doesn't delete the file from GitHub. Publishing keeps photos outside AI-generated translations. Old clients that omit media preserve existing images; an explicit empty array removes post references. Public articles show a full-photo cover and responsive gallery, with cover thumbnails on listing cards.


### Installation diagnostics

Open `/admin/?install-check=1` on the same origin used to install the app. The owner can run the check without unlocking private content. It fetches only this origin's public manifest/icons (without credentials), decodes actual icon dimensions, checks worker activation/control and the cached login shell, and queries this PWA's installation through `getInstalledRelatedApps()` when available. The manifest self-declares its webapp relationship using a relative URL so custom domains keep working. The API's empty response is explicitly inconclusive; older browser support and OS state can differ.

Accepting `beforeinstallprompt` or receiving `appinstalled` is never treated as proof that Android has installed a WebAPK. The checkmark appears only when the page is actually running in an app window. Installation diagnostics retain a short in-memory browser event history; no password, cookie, token, draft, unrelated app list or private response is inspected, stored or transmitted. The owner chooses whether to copy the report.

If all visible website checks pass while Android still makes a shortcut, collect the device's native evidence. `chrome://webapks` lists registered WebAPK details (including the working app's origin, manifest and owning browser). Chrome's `chrome://histograms/WebApk` page may contain installation results when that build records them. An absent histogram is not proof of success or failure. Native failure codes distinguish installer, server, timeout, space and icon-hash errors; website JavaScript cannot read this private installer log. USB remote debugging is an option for a later, explicitly requested device session. A TWA/APK wrapper is a separate distribution choice; the PWA install button does not create one.

References: [Chrome installed-related-app detection](https://developer.chrome.com/docs/capabilities/get-installed-related-apps), [WebAPK result codes](https://chromium.googlesource.com/chromium/src/+/main/components/webapps/browser/android/webapk/webapk_types.h), [Chromium WebAPK details](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/resources/webapks/about_webapks.ts).

## Photo previews and AI image tools

The editor can preview original photos before upload, generate an illustration from the draft topic or art direction, or edit a selected source photo using instructions. The preview is kept in the browser until you choose **Approve & attach**. Approved WebP files go to the existing website media folder. Set the description, caption and placement before publishing. An inline placement beyond the last published paragraph is shown in the end gallery.

AI preview requests are authenticated and run on the server. To enable them, use a [Cloudflare Workers AI Free account](https://developers.cloudflare.com/workers-ai/platform/pricing/) with an [account-scoped Workers AI API token](https://developers.cloudflare.com/workers-ai/get-started/rest-api/). In the **farhan-creator-studio** Vercel project, set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_WORKERS_AI_TOKEN` for Production, with the token marked Sensitive, then redeploy. The model is FLUX.2 klein 4B. Keeping the Cloudflare account on the Workers Free plan keeps inference within its free daily quota. Original photo previews and publishing are available without the AI connection.
