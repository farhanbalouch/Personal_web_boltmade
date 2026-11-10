# Farhan Balouch website — beginner editing guide

Yeh guide isi repository ke liye hai: [Personal_web_boltmade](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade). Public website aur private Creator Studio isi repo se Vercel par deploy hote hain. Website ka root repo hai; dedicated Studio ka root `studio-app/` hai.

## 1. Coding ke baghair naya blog, story ya project update

1. [Creator Studio](https://adminpage.farhanbalouch.com/admin/) khol kar Studio password se login karo.
2. **Writing desk → New draft**. Content type choose karo. Biography mein existing chapter choose hota hai.
3. **Short display title**: chhota, complete naam, jaise `Fear and Action`. Yeh English card aur primary heading mein aayega. Blank chhoro to AI apna short title suggest karega.
4. **Secondary / alternate title**: descriptive doosra naam, jaise `What fear teaches us about courage`. Dono names page aur SEO metadata mein use hote hain. Google ranking ya kis exact query par result aayega uski guarantee nahi hoti.
5. **Short link**: sirf lowercase English letters, numbers aur hyphens, jaise `fear-and-action`. Full URL paste na karo. Biography chapter ka link fixed rehta hai.
6. Raw text mein apni poori baat likho. Har alag point ko alag line dena AI coverage check ke liye behtar hai. Dates aur facts sirf wahi likho jo confirm hain. Interface 50,000 characters tak accept karta hai; bohat lambi writing ko chapters mein divide karna model limits ke liye behtar ho sakta hai.
7. Photos choose karo; placement aur captions set karo. **Save draft to cloud** karo. Sirf device autosave doosre mobile/laptop par nahi jata.
8. **Publish** AI English, Hinglish aur Urdu versions prepare karta hai. Notifications chahiye hon to notification checkbox on rakho. Activity mein Prepared ka matlab deploy abhi pending bhi ho sakta hai; **Live on website** status dekho.
9. Result parh kar points aur translations verify karo. Source-line coverage check omitted IDs ya incomplete AI output par publish rokta hai; AI apni coverage galat report kar sakta hai, isliye final human review zaroori hai.

## 2. Published content ka naam ya link sahi karna

**Content library → article → Edit**. Short title, alternate title aur short link change kar sakte ho.

- **Update names and link only** pehle se checked hoga: article ki body, existing Q&A, photos aur original publication date ko AI dobara nahi likhega.
- Sirf labels change karne par English display names update honge; doosri language versions apni existing writing rakhti hain.
- Body ko AI se dobara edit karwana ho to yeh checkbox OFF karo, phir raw text edit karo aur publish karo.
- Link badalne par old slug `aliases` mein save hota hai. Publishing workflow `vercel.json` mein permanent redirects banata hai. Purana Google/social link naye page par khulta hai.
- Existing post ka `publishedAt` bachaya jata hai. Biography chapter addresses rename nahi hote.

## 3. Social Promo: Instagram / TikTok ki ready image

**Content library → Social Promo** kholo.

1. **Design layout**: Cinematic cover, Editorial magazine, Bold split, Clean statement. Har article ko ek default variation milti hai; **Try another design** se badal sakte ho.
2. **Post size**: Instagram feed 4:5, TikTok/Stories 9:16, square 1:1.
3. Accent color, headline font, headline, supporting line, top label, CTA aur caption editable hain. Website logo alpha PNG se draw hota hai; uske peechhe colored box draw nahi kiya jata.
4. Existing blog cover available ho to pehle artwork ke taur par use hota hai. Apni photo **Upload artwork** se lagao ya **Generate with AI** dabao. AI scene direction is article ke mutabiq likho.
5. Artwork ke baad **What should AI change?** mein exact instruction do aur **Edit artwork with AI** dabao. Yeh selected picture ko reference ke taur par bhejta hai. Face/identity preservation ki absolute guarantee nahi; preview check karo. Article ki original photo khud nahi badalti.
6. Crop sliders adjust karo. **Download thumbnail** final PNG download karta hai. Text aur logo Canvas se add hote hain, taake AI ke spelling mistakes par depend na karna pare.
7. **Copy caption** mein live blog link milta hai. **Copy full thumbnail prompt** ChatGPT/Nano Banana ke liye fallback hai. **Copy artwork prompt** sirf background scene ke liye hai.

Promo text/design settings is browser mein save hote hain. Custom artwork ko download kar lo; uploaded/generated artwork ko yeh screen permanent cloud file nahi banati. Blog ki chosen cover photo aur published photos alag se repo mein hoti hain.

### Free AI routing ka matlab

Existing `CLOUDFLARE_ACCOUNT_ID` aur `CLOUDFLARE_WORKERS_AI_TOKEN` dedicated Studio Vercel project mein use hote hain. Kisi key ko chat, public JS, JSON ya GitHub commit mein paste na karo.

- Generation: FLUX.1 Schnell → FLUX.2 Klein 4B.
- Editing: FLUX.2 Klein 4B → FLUX.2 Dev.
- Model busy/unavailable ho to next eligible model try hota hai. Authentication, payment-required, moderation aur shared-quota errors par routing rukti hai.
- Yeh Workers AI ke free-plan-eligible models hain. [Official pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) ke mutabiq shared free allocation 10,000 Neurons/day hai; model switching se yeh allowance reset nahi hota.
- **Workers Free plan par raho** agar paid overage nahi chahiye. Workers Paid par free allocation se zyada usage bill ho sakti hai. Yeh app provider billing settings change nahi karti aur unlimited free images ka wada nahi karti.
- Keys configured hona successful live generation ka saboot nahi. Live requests quota aur provider availability par depend karti hain. Limit par original photo ya copied prompt use karo.

## 4. Kaunsi file kya edit karti hai?

Neeche har link isi repo ki real file kholta hai. `main` current version hai; pehle branch ya backup banao.

| Kaam | Exact file | Kya edit karna hai |
|---|---|---|
| Project descriptions, links, status, features | [src/data/content.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/data/content.tsx) | `projects` array. Main 3 ke `featuredOrder` 1, 2, 3 hain; normal project mein yeh field na lagao. |
| Project dates + SEO ItemList | [src/lib/project-meta.ts](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/lib/project-meta.ts) | `projectMilestones`. Release date confirm na ho to `Added to portfolio` label use karo; fake launch date mat banao. |
| Smaller cards | [src/components/FeaturedProjects.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/components/FeaturedProjects.tsx) | `ProjectCard`, primary/secondary buttons aur small-card text. |
| Project card colors/layout | [src/components/project-spotlights.css](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/components/project-spotlights.css) | `.project-small-*` normal cards; `.project-spotlight` main cards. |
| Main Farhan Deals / SARAS cards | [src/components/ProjectSpotlights.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/components/ProjectSpotlights.tsx) | Existing large cards. Size/layout tabhi change karo jab zaroorat ho. |
| MovieHub original card | [src/components/MovieHubSpotlight.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/components/MovieHubSpotlight.tsx) | Existing card; is update mein change nahi kiya. |
| Home / All projects page | [Home.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/pages/Home.tsx), [Work.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/pages/Work.tsx) | Homepage par 3 large cards; baqi `/work` par. |
| Farhan Deals alpha logo | [public/projects/farhan-deals-transparent.png](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/public/projects/farhan-deals-transparent.png) | PNG asset; JPG transparency support nahi karta. |
| Public blog data | [src/data/blog-posts.json](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/data/blog-posts.json) | `slug`, `aliases`, `translations.en.shortTitle`, `secondaryTitle`, `title`, `body`, `editorial`, `moral`. Prefer Studio. |
| Public stories / biography | [stories.json](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/data/stories.json), [story-chapters.json](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/data/story-chapters.json) | Public content only. Private thoughts yahan mat likho. |
| Blog list and reading page | [Blog.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/pages/Blog.tsx), [BlogPost.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/pages/BlogPost.tsx) | Short heading, descriptive secondary line, visible article layout. |
| Shared Q&A / highlights / moral | [ArticleReading.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/components/ArticleReading.tsx), [article-reading.ts](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/lib/article-reading.ts), [article-reading.css](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/components/article-reading.css) | Reading logic, validated Q&A, headings, right-aligned italic moral. |
| AI writing rules + coverage validation | [scripts/publish-blog.mjs](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/scripts/publish-blog.mjs) | `SYSTEM_PROMPT`, `callGemini`. Paragraph/Q&A count artificially fix na karo. |
| Studio publish/update handling | [scripts/publish-studio.mjs](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/scripts/publish-studio.mjs) | `buildItem`, stable publication dates, slug collisions, names-only updates. |
| Admin form | [studio-app/src/pages/Studio.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/studio-app/src/pages/Studio.tsx) | Fields, sidebar, library, edit controls. |
| Admin API validation | [studio-app/api/studio.js](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/studio-app/api/studio.js), [content-labels.js](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/studio-app/server/content-labels.js) | Owner authentication, safe draft/request fields. Secret keys yahan hardcode na karo. |
| Promo UI and Canvas layouts | [StudioPromo.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/studio-app/src/components/StudioPromo.tsx), [studio-promo.ts](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/studio-app/src/lib/studio-promo.ts) | Editable controls, layout renderer, sizes, defaults, prompts. |
| AI image routing | [studio-app/server/image-ai.js](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/studio-app/server/image-ai.js) | Cloudflare model allowlist, generation/edit payloads, timeout/quota handling. |
| Promo website logo | [studio-app/public/promo-logo.png](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/studio-app/public/promo-logo.png) | Existing transparent website logo; social renderer adds no dark plate. |
| WhatsApp label / contact links | [src/pages/Contact.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/pages/Contact.tsx) | Visible label aur `https://wa.me/...` link alag fields hain. |
| Sitemap and old-link redirects | [scripts/build-sitemap.mjs](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/scripts/build-sitemap.mjs), [vercel.json](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/vercel.json) | `aliases` se permanent redirects generate hote hain; old redirects delete na karo. |
| Initial HTML / Google metadata | [scripts/build-social-pages.mjs](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/scripts/build-social-pages.mjs), [article-prerender.tsx](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/scripts/article-prerender.tsx), [article-schema.ts](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/lib/article-schema.ts) | JavaScript chalne se pehle readable page, canonical, OG, alternative headline. |
| Public AI site guide data | [scripts/build-site-knowledge.mjs](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/scripts/build-site-knowledge.mjs) | Sirf public writing/projects index hote hain; private Memories exclude rakho. |
| Notification flow | [src/lib/notifications.ts](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/src/lib/notifications.ts), [notify-onesignal.mjs](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/scripts/notify-onesignal.mjs) | Browser opt-in aur publishing ke baad audience notification. |
| Publishing workflow | [.github/workflows/studio-publish.yml](https://github.com/muhammadfarhan138223-cmyk/Personal_web_boltmade/blob/main/.github/workflows/studio-publish.yml) | AI processing, data commit, redirects, deploy receipt, optional notification. |

## 5. GitHub se chhota safe edit

1. Repo khol kar pehle nayi branch banao ya file ka backup rakho.
2. Sahi file khol kar pencil/Edit dabao. JSON mein commas, quotes aur brackets sambhalna.
3. Sirf related text change karo. `slug` ko manually rename karne se pehle old value `aliases` mein add karo; Studio isay automatically karta hai.
4. Commit karke pull request se changes compare karna behtar hai. Main par merge/commit hone ke baad dono Vercel projects apni relevant files build karte hain.
5. Vercel mein READY hone ka wait karo. Public link normal browser mein refresh karo. Short URL aur purana URL dono test karo.
6. Agar build fail ho to last working version restore karo; user content/data ko blindly reset mat karo.

Local checks:

```bash
npm run typecheck
npm test
npm run build
cd studio-app
npm run typecheck
npm test
npm run build
```

## 6. Kisi AI ko yeh exact instruction de sakte ho

> Meri repository muhammadfarhan138223-cmyk/Personal_web_boltmade hai. Pehle docs/EDITING_GUIDE_ROMAN_URDU.md aur relevant source files parho. Mera requested change [yahan likho] hai. Main 3 project cards ka layout/size aur MovieHub files unchanged rakho jab tak main explicitly na kahoon. Published article bodies, original dates, photos aur translations preserve karo. URL rename par old aliases aur permanent redirects rakho. Private Memories ko public JSON, sitemap, AI prompt ya source log mein include na karo. Secrets env mein rakho. Relevant tests, both typechecks/builds, GitHub diff aur production deployment verify karo. Jo verify na ho usay clear batao; ranking ya unlimited free AI guarantee mat do.
