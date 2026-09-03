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
