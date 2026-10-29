# Farhan Balouch — Personal Site

A multi-page personal biography + portfolio website with a floating AI chatbot ("Rawi") that narrates Farhan's story.

## Tech stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS
- **Fonts:** Fraunces (display serif) + Inter (body sans)
- **Chatbot backend:** Supabase Edge Function (Deno) — calls OpenAI with a server-side API key
- **Hosting:** Deploy to Vercel (recommended, for full chatbot support) or GitHub Pages (static only — chatbot backend won't run)

---

## Deploying

### Option 1: Vercel (recommended — chatbot works fully)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), import the repo, and deploy.
3. Vercel auto-detects Vite. No extra config needed — the build command is `npm run build` and the output folder is `dist`.
4. **Add your domain** in Vercel project settings (see checklist below).

> The chatbot runs as a Supabase Edge Function (not a Vercel serverless function), so it works regardless of where you host the frontend — as long as the site can reach the internet. No `/api` folder is needed on Vercel.

### Option 2: GitHub Pages (static — chatbot will NOT work)

1. Push to GitHub.
2. Run `npm run build` — this produces a `dist/` folder.
3. Enable GitHub Pages on the repo (Settings → Pages), serving the `dist/` folder (via the `gh-pages` branch or a Actions workflow).
4. The Rawi chat widget will detect the backend is unreachable and show a friendly fallback message. All other site features (story, portfolio, contact) work fine.

---

## The Rawi chatbot — where to put your AI API key

**The API key must NEVER be in any file in this repo or in the browser.** It lives only as a server-side secret on Supabase.

### How to set it

1. Go to your **Supabase project dashboard** → **Edge Functions** → **Secrets** (or Project Settings → Edge Functions → Secrets).
2. Add a secret named **`OPENAI_API_KEY`** with your OpenAI API key as the value.
   - (The function also checks `RAWI_API_KEY` as an alternative name.)
3. Save. That's it — the edge function reads this at runtime. No code change needed.

### How it works

- The floating chat button on every page sends messages to the Supabase Edge Function (`rawi`).
- The edge function adds the "Rawi" persona system prompt and forwards the conversation to OpenAI.
- The API key stays on the server. The browser only sees the reply text.
- If no key is set, the chatbot replies with a friendly "lamp needs oil" message instead of crashing.

### Getting an OpenAI API key

1. Create an account at [platform.openai.com](https://platform.openai.com).
2. Go to API Keys → Create new secret key.
3. Copy the key (starts with `sk-...`) and paste it into the Supabase secrets screen as `OPENAI_API_KEY`.

---

## Where to edit your content

All text content lives in **`src/data/content.ts`**:

| What | Where in that file |
|------|-------------------|
| Name, email, origin | `SITE` object |
| Home page highlight cards | `highlights` array |
| Story chapters (4 parts) | `storyChapters` array — replace the placeholder paragraphs with your real story |
| Portfolio projects | `projects` array |
| JSON-LD Person schema | `personSchema` object |

### Story chapters — important

The current story text is **placeholder scaffold** based on the brief. Replace the `paragraphs` arrays in `storyChapters` with your real life story. The text is marked with `[Placeholder — ...]` notes so you can find what to replace.

**Before publishing, review anything that identifies other real people** (family members, specific names, locations that could be sensitive on a public searchable site). Flag anything sensitive rather than publishing it as-is.

---

## Checklist — placeholders you still need to fill in

- [ ] **Domain:** Replace `farhanbalouch.com` in `public/sitemap.xml`, `public/robots.txt`, and `src/components/Seo.tsx` with your real domain
- [ ] **Email:** Replace `farhan@example.com` in `src/data/content.ts` (`SITE.email`) with your real email
- [ ] **Story text:** Replace all placeholder paragraphs in `src/data/content.ts` (`storyChapters`) with your actual life story
- [ ] **Photos/images:** Add real photos where desired (hero, about page, story chapters). Currently the design uses no photos — add `<img>` tags with real image URLs when ready
- [ ] **Social links:** Create GitHub/Twitter/LinkedIn accounts, then add the URLs to the `socials` array in `src/pages/Contact.tsx`
- [ ] **Portfolio projects:** Replace the 4 placeholder project cards in `src/data/content.ts` (`projects`) with real projects — titles, descriptions, categories, and links
- [ ] **OpenAI API key:** Add `OPENAI_API_KEY` to Supabase Edge Function secrets (see above) so Rawi can talk
- [ ] **OG image:** Add a real social share image and update the `og:image` meta tag in `index.html`

---

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # production build → dist/
npm run typecheck # type checking
```


## Farhan Studio

Open **https://farhanbalouch.com/admin**. This is a separate owner-only publishing
workspace within the existing website and Vercel project. Public updates appear
at **/stories**; the longer biography remains at **/story**.

### One-time connection per browser

Create a fine-grained GitHub personal access token for **only this repository**,
with **Contents: Read and write** and **Actions: Read and write**. Paste it into
Studio's connection form, never into chat or repository files. Studio verifies
the exact owner account and encrypts the token into a Secure, HttpOnly,
SameSite=Strict cookie. Sessions last up to 30 days; token expiry or revocation
can end them earlier. Sign out to remove the cookie. Saved draft text remains
on this device for recovery; repository drafts are private and not bundled into
the public website. `ADMIN_SESSION_SECRET` must be set in Vercel; rotate it to
invalidate all sessions.

### Daily publishing

- Write in English, Roman Urdu/Hinglish or Urdu, or import a `.txt` / `.md` file.
- Choose a blog, public story, project announcement or existing biography chapter.
- Save privately, or publish with AI. A publish request goes to GitHub Actions,
  which uses the existing `GEMINI_API_KEY` secret to edit and translate it.
- Edits keep the original address and publication date. Biography chapter edits
  preserve its position, subtitle and moral.
- Activity reports AI results, deployment progress and failed workflows. Recover
  a failed note from Activity to retry without opening source files.
- A project announcement appears in the Stories feed; portfolio card source is
  still managed in `src/data/content.tsx`.

Every Sunday at 18:00 UTC (11pm Pakistan), the weekly workflow appends relevant
new blog details to existing biography chapters. It publishes automatically
instead of creating review PRs. It does not invent new facts. You can also run it
from Studio's biography page.

### Browser notifications

Visitors choose **Allow notifications** and then allow the browser permission.
No email signup or account is required. They can turn notifications off from the
same footer control. If browser permission was denied, they must allow it again
in their browser's site settings. Web push must be enabled in the OneSignal app
for the exact HTTPS origin `https://farhanbalouch.com`; the app ID in `index.html`
is public. `public/OneSignalSDKWorker.js` must remain available as JavaScript.

GitHub Actions requires `ONESIGNAL_REST_API_KEY`; `ONESIGNAL_APP_ID` is optional
and must match the public app ID when set. The integration check workflow makes
read-only provider requests, never a test broadcast. Publishing waits for its
receipt on the production domain before sending a push. Idempotency keys prevent
duplicate delivery when that step retries. Provider acceptance is recorded in
workflow logs; device delivery still depends on browser/OS permission and
connectivity. No email broadcasting is promised by this browser push flow.

### Verification

`npm test`, `npm run typecheck`, and `npm run build`. The automated tests cover
owner-only access, CSRF rejection, encrypted-cookie tampering, input validation,
stable URLs on edits, and multilingual biography updates. Never test broadcasts
to all subscribers merely to check configuration.

## Install Farhan Studio as a PWA

Open https://farhanbalouch.com/admin/ directly in Chrome or Edge, then use
**Install Studio app** or the browser's **Install Farhan Studio** command.
The manifest uses standalone display, its own 192/512px icons, and the
/admin/ launch scope. This is app installation rather than Create shortcut.
On iPhone, use Safari's Add to Home Screen with Open as Web App.

The separate /admin/sw.js worker caches only the app shell and static assets.
It never caches API responses, tokens, or publish requests, and it does not
replace the public website's OneSignal root worker. Login and publishing
require connectivity. Non-JSON security/proxy responses are now reported with
the HTTP status and a readable recovery message instead of a JSON syntax error.

## Dedicated Creator Studio, photos and share previews

The password-based app is deployed separately from `studio-app/` in the same repository, with its own Git-linked Vercel project. See [studio-app/README.md](studio-app/README.md) for its private server ENV configuration, PWA installation and photo controls. The public site's older `/admin/` connection remains separate; use the dedicated Studio domain for password login and image uploads.

Studio can attach up to six optimized uploaded photos, captions and accessible descriptions to blogs, stories, project updates and biography chapters. The first photo is a cover; article pages use a responsive gallery and listing pages show cover thumbnails. Uploaded files are public, even when their associated draft is private. Media stays outside AI translations, and legacy requests preserve existing photos.

The production build generates route-specific Open Graph/Twitter tags directly in each public route's initial HTML, a branded default `og-image.png`, Markdown editions and an updated `/llms.txt` discovery index. Post cover photos become their share image. Private drafts and admin routes are excluded from the discovery file. `/llms.txt` is a discovery aid, not a guarantee of search ranking or AI citation. Social platforms can cache previously fetched previews.
