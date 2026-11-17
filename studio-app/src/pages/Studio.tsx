import { StudioPhotos } from "@/components/StudioPhotos";
import { StudioDrafts } from "@/components/StudioDrafts";
import { StudioInstall } from "@/components/StudioInstall";
import { StudioPromo } from "@/components/StudioPromo";
import { setupStudioPwa } from "@/lib/studioPwa";
import { parseStudioResponse } from "@/lib/studio-response";
import { draftTitle, emptyDraft, forgetDraft, hasDraftContent, listDeviceDrafts, rememberDraft, restoreActiveDraft, type CloudDraft, type Draft, type Kind } from "@/lib/studio-drafts";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Briefcase,
  BookOpen,
  Check,
  FileText,
  LayoutDashboard,
  LogOut,
  PenLine,
  Plus,
  Radio,
  Save,
  Send,
  Sparkles,
  Upload,
  LockKeyhole,
  ShieldCheck,
  Eye,
  EyeOff,
  CloudOff,
  Trash2,
} from "lucide-react";
import type { BlogPost } from "@/data/blog";
import type { StoryChapter } from "@/data/content";
import { blogPromoUrl, promoFromBlog, type SocialPromo } from "@/lib/studio-promo";
import "./studio.css";
const Memories = lazy(() => import("@/components/Memories").then(module => ({ default: module.Memories })));
const StudioProjects = lazy(() => import("@/components/StudioProjects").then(module => ({ default: module.StudioProjects })));
type Run = {
  id: number;
  title: string;
  status: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
};
type StudioResult = {
  id: string;
  status: string;
  title: string;
  url?: string;
  error?: string;
  socialPromo?: SocialPromo;
};
type Content = {
  warnings?: string[];
  imageAi?: boolean;
  results: StudioResult[];
  liveIds: string[];
  blogs: BlogPost[];
  stories: BlogPost[];
  chapters: StoryChapter[];
  drafts: CloudDraft[];
  runs: Run[];
};
async function api(body?: object): Promise<any> {
  const r = await fetch(
    "/api/studio",
    body
      ? {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : { cache: "no-store" },
  );
  return parseStudioResponse(r);
}
const loadDraft = (name: string): Promise<Draft> => api({ action: "draft", name });
const labels: Record<Kind, string> = {
  blog: "Blog post",
  story: "Public story",
  chapter: "Biography chapter",
  project: "Project update",
};
export function Studio() {
  const [auth, setAuth] = useState<"loading" | "login" | "ready">("login"),
    [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [offlineDrawerOpen, setOfflineDrawerOpen] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  const [onlineNow, setOnlineNow] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [offlineNoteTitle, setOfflineNoteTitle] = useState("");
  const [offlineNoteText, setOfflineNoteText] = useState("");
  const [offlineNoteId, setOfflineNoteId] = useState("");
  const [offlineNotes, setOfflineNotes] = useState(() => listDeviceDrafts().filter(note => note.offlineQuickNote));
  const [content, setContent] = useState<Content | null>(null),
    [tab, setTab] = useState(() => { const space = new URLSearchParams(window.location.search).get("space"); return space === "memories" || space === "projects" ? space : "write"; });
  const [draft, setDraft] = useState(restoreActiveDraft);
  const [deviceSaved, setDeviceSaved] = useState(true);
  const cloudRevision = content?.drafts.find(note => note.name === draft.id + ".json")?.sha;
  const cloudDraft = Boolean(draft.revision || cloudRevision);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [promoUrl, setPromoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [query, setQuery] = useState(""),
    [preview, setPreview] = useState<(BlogPost & { kind: Kind }) | null>(null),
    [lang, setLang] = useState<"en" | "hi" | "ur">("en");
  const working = busy || photoBusy;
  const file = useRef<HTMLInputElement>(null);
  const unlocked = useRef(false);
  const sessionGeneration = useRef(0);
  const load = useCallback(async () => {
    if (!unlocked.current) return;
    const generation = sessionGeneration.current;
    try {
      const result = await api();
      if (!unlocked.current || generation !== sessionGeneration.current) return;
      setContent(result);
      setAuth("ready");
    } catch (e) {
      if (!unlocked.current || generation !== sessionGeneration.current) return;
      if ((e as { status?: number }).status === 401) {
        unlocked.current = false;
        setContent(null);
        setAuth("login");
      }
      else {
        setError((e as Error).message);
        setAuth((s) => (s === "loading" ? "login" : s));
      }
    }
  }, []);
  useEffect(() => {
    document.title = "Farhan Studio · Your publishing desk";
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) { ogUrl = document.createElement("meta"); ogUrl.setAttribute("property", "og:url"); document.head.appendChild(ogUrl); }
    ogUrl.setAttribute("content", location.origin + "/admin/");
    setupStudioPwa().catch(() => {
      /* Online editing remains available if app installation is unsupported. */
    });
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);
  useEffect(() => {
    const online = () => { setOnlineNow(true); };
    const offline = () => { setOnlineNow(false); setOfflineDrawerOpen(true); };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);
  useEffect(() => {
    setDeviceSaved(rememberDraft(draft));
  }, [draft]);
  useEffect(() => {
    const { id, revision, dirty } = draft;
    if (auth !== "ready" || dirty || !revision || !cloudRevision || revision === cloudRevision) return;
    let active = true;
    loadDraft(id + ".json").then(note => {
      if (active) setDraft(current => current.id === id && current.revision === revision && !current.dirty ? note : current);
    }).catch(() => { /* Keep the device copy while the cloud version is unreachable. */ });
    return () => { active = false; };
  }, [auth, draft, cloudRevision]);
  useEffect(() => {
    if (auth !== "ready") return;
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, [auth, load]);
  const lock = useCallback(() => {
    unlocked.current = false;
    sessionGeneration.current++;
    setAuth("login");
    setPassword("");
    setShowPassword(false);
    setContent(null);
    setPreview(null);
    setPromoUrl(null);
    setQuery("");
    setPhotoBusy(false);
    setMessage("");
    setError("");
  }, []);
  useEffect(() => {
    let hiddenAt = 0;
    const visibility = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt >= 5 * 60 * 1000) lock();
    };
    const restored = (event: PageTransitionEvent) => { if (event.persisted) lock(); };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pageshow", restored);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pageshow", restored);
    };
  }, [lock]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function deleteBlog(post: BlogPost) {
    const confirmed = window.confirm(
      `Permanently delete this published blog?\\n\\n"${post.translations.en.title}"\\n\\nPublic URL: https://farhanbalouch.com/blog/${post.slug}\\n\\nThe article and its old URL will be removed from the website. This cannot be undone.`,
    );
    if (!confirmed) return;
    await action(async () => {
      const result = await api({ action: "delete-blog", slug: post.slug });
      setPreview(current => current?.slug === post.slug ? null : current);
      setMessage(result.message);
      await load();
    });
  }
  function keepDeviceDraft() {
    return !hasDraftContent(draft) || (draft.revision && !draft.dirty) || rememberDraft(draft);
  }
  function edit(post: BlogPost | StoryChapter, kind: Kind) {
    if (!keepDeviceDraft()) {
      setError("This device cannot store your changes. Save the current draft to the cloud first.");
      return;
    }
    const t = post.translations.en;
    const raw = `${t.title}\n\n${"body" in t ? t.body.join("\n\n") : t.paragraphs.join("\n\n")}`;
    setDraft({
      id: crypto.randomUUID(),
      kind,
      raw,
      slug: post.slug,
      shortTitle: t.shortTitle || "", secondaryTitle: t.secondaryTitle || "", urlSlug: post.slug, metadataOnly: true,
      notify: false,
      images: post.images || [],
      dirty: true,
      updatedAt: new Date().toISOString(),
    });
    setPreview(null);
    setTab("write");
    setMessage("Editing existing content. Names-only update is on; turn it off to rewrite the text. Old links redirect if you change the address.");
  }
  function newDraft() {
    if (!keepDeviceDraft()) {
      setError("This device cannot store your changes. Save the current draft to the cloud first.");
      return;
    }
    setDraft(emptyDraft());
    setTab("write");
    setError("");
    setMessage("");
  }
  function openDraft(id: string, device?: Draft) {
    void action(async () => {
      if (!keepDeviceDraft())
        throw new Error("Save the current draft to the cloud before switching.");
      const next = device ?? await loadDraft(id + ".json");
      if (!device) {
        const local = listDeviceDrafts().find(note => note.id === id && note.dirty);
        if (local && !rememberDraft({ ...local, id: crypto.randomUUID(), revision: undefined, createdAt: undefined }))
          throw new Error("Could not keep your device edits. Open them and save as a new draft first.");
      }
      setDraft(next);
      setTab("write");
      setMessage(device ? "Device changes restored." : "Cloud draft opened.");
    });
  }
  const publish = (mode: "save" | "publish", copy = false) =>
    action(async () => {
      const note = { ...(copy ? { ...draft, id: crypto.randomUUID(), revision: undefined } : draft), offlineQuickNote: false };
      const result = await api({ action: mode, ...note });
      setMessage(result.message);
      if (mode === "publish") {
        forgetDraft(draft.id);
        setDraft(emptyDraft());
        setPromoUrl(null);
        setTab("activity");
      } else {
        if (copy) forgetDraft(draft.id);
        setDraft({ ...note, revision: result.revision, updatedAt: result.updatedAt, dirty: false });
      }
      await load();
    });
  const input = (value: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...value, dirty: true, updatedAt: new Date().toISOString() }));
  if (auth === "loading")
    return (
      <div className="studio studio-loading">
        <Sparkles /> Opening your publishing desk…
      </div>
    );
  if (auth === "login")
    return (
      <div className="studio studio-login">
        <a href="https://farhanbalouch.com/" className="studio-wordmark" aria-label="Farhan Balouch website">
          <b>FB<span className="studio-brand-dot">.</span></b><span>FARHAN BALOUCH<small>CREATOR STUDIO</small></span>
        </a>
        <div className="studio-login-install"><StudioInstall /></div>
        <section className={`studio-offline-drawer ${offlineDrawerOpen ? "is-open" : ""}`} aria-label="Offline quick notes">
          <button type="button" className="studio-offline-toggle" aria-expanded={offlineDrawerOpen} onClick={() => setOfflineDrawerOpen(value => !value)}>
            <span><CloudOff size={17}/><b>Offline Quick Notes</b><small>{onlineNow ? "Device-only drafts" : "Offline · saved on this device"} · {offlineNotes.length} saved</small></span>
            <span className="studio-offline-chevron">{offlineDrawerOpen ? "−" : "+"}</span>
          </button>
          <div className="studio-offline-body">
            <p>Internet ke baghair note likho. Yeh password ke baghair sirf isi device par draft hoga; online aakar login karo, phir Saved drafts mein kholo.</p>
            <label htmlFor="offline-note-title">Title (optional)</label>
            <input id="offline-note-title" maxLength={120} value={offlineNoteTitle} onChange={event => setOfflineNoteTitle(event.target.value)} placeholder="Aaj ka khayal…" />
            <label htmlFor="offline-note-text">Your note</label>
            <textarea id="offline-note-text" rows={4} maxLength={50000} value={offlineNoteText} onChange={event => setOfflineNoteText(event.target.value)} placeholder="Type your note here. It stays on this device until you log in and save it." />
            <div className="studio-offline-actions">
              <button type="button" className="studio-primary" disabled={!offlineNoteText.trim()} onClick={() => {
                const current = offlineNotes.find(note => note.id === offlineNoteId);
                const note = { ...(current || emptyDraft()), kind: "blog" as const, raw: `${offlineNoteTitle.trim() ? offlineNoteTitle.trim() + "\n\n" : ""}${offlineNoteText.trim()}`, notify: false, dirty: true, offlineQuickNote: true, updatedAt: new Date().toISOString() };
                if (!rememberDraft(note)) { setError("Is device par storage full ya blocked hai. Thori space khali karke dobara try karo."); return; }
                setOfflineNotes(listDeviceDrafts().filter(item => item.offlineQuickNote)); setOfflineNoteTitle(""); setOfflineNoteText(""); setOfflineNoteId(""); setError("");
              }}><Save size={15}/>{offlineNoteId ? "Update device draft" : "Save device draft"}</button>
              <span>Local only · not uploaded</span>
            </div>
            {!!offlineNotes.length && <div className="studio-offline-list"><b>Saved on this device</b>{offlineNotes.map(note => <div key={note.id}><button type="button" onClick={() => { const firstBreak = note.raw.indexOf("\n\n"); setOfflineNoteTitle(firstBreak >= 0 ? note.raw.slice(0, firstBreak) : ""); setOfflineNoteText(firstBreak >= 0 ? note.raw.slice(firstBreak + 2) : note.raw); setOfflineNoteId(note.id); setOfflineDrawerOpen(true); }}>{draftTitle(note)}</button><button type="button" aria-label={`Delete ${draftTitle(note)}`} onClick={() => { forgetDraft(note.id); setOfflineNotes(listDeviceDrafts().filter(item => item.offlineQuickNote)); if (offlineNoteId === note.id) { setOfflineNoteId(""); setOfflineNoteTitle(""); setOfflineNoteText(""); } }}><Trash2 size={14}/></button></div>)}</div>}
            <small className="studio-offline-warning">Note: yeh drawer password/encryption ke baghair hai; shared device par private secrets ya passwords na likho. Device data clear karne se drafts mit sakte hain.</small>
          </div>
        </section>
        <div className="studio-login-grid">
          <section className="studio-intro">
            <span className="studio-eyebrow"><span className="studio-dot" /> YOUR IDEAS. YOUR UNIVERSE.</span>
            <h1>Create a little.<br /><em>Inspire a lot.</em></h1>
            <p>Ek khayal se shuru karo. Apni stories, blogs aur naye ideas ko duniya tak pohanchao.</p>
            <div className="studio-orbit" aria-hidden="true">
              <div className="studio-orbit-ring" /><div className="studio-orbit-core"><Sparkles size={32} /></div>
              <div className="studio-orbit-note"><PenLine size={18} /><span>A spark of an idea<small>In your own words</small></span></div>
              <div className="studio-orbit-publish"><Check size={17} /><span>Ready for the world<small>English · Hinglish · اردو</small></span></div>
            </div>
            <div className="studio-login-steps"><span><PenLine size={15} /> Write freely</span><span><Sparkles size={15} /> Let AI polish</span><span><Radio size={15} /> Share your world</span></div>
          </section>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                await api({ action: "login", password });
                setPassword("");
                setShowPassword(false);
                unlocked.current = true;
                sessionGeneration.current++;
                if (offlineNotes.some(note => note.offlineQuickNote)) setTab("drafts");
                await load();
              });
            }}
            className="studio-login-card"
          >
            <div className="studio-card-heading"><div className="studio-icon"><LockKeyhole /></div><span className="studio-private"><ShieldCheck size={13} /> PRIVATE ACCESS</span></div>
            <span className="studio-eyebrow">WELCOME TO YOUR SPACE</span>
            <h2>Hey, Farhan<span className="studio-brand-dot">.</span></h2>
            <p>Your next great story starts here.<br />Enter your password to open your studio.</p>
            <input type="text" name="username" value="Farhan" autoComplete="username" readOnly hidden />
            <label htmlFor="studio-password">Studio password</label>
            <div className="studio-password-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input id="studio-password" name="password" type={showPassword ? "text" : "password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" maxLength={256} required placeholder="Enter your password" />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button className="studio-primary" disabled={working}>
              {busy ? "Verifying…" : "Unlock my Studio"}<ArrowUpRight size={18} />
            </button>
            {error && (
              <p role="alert" className="studio-error">
                {error}
              </p>
            )}
            <div className="studio-login-assurance"><ShieldCheck size={15} /><span>Just you, your ideas, and a little AI magic.</span></div>
          </form>
        </div>
        <footer>FARHAN BALOUCH &nbsp; / &nbsp; A PRIVATE CREATIVE SPACE</footer>
      </div>
    );
  const total = (content?.blogs.length || 0) + (content?.stories.length || 0);
  const blogUrls = new Set(content?.blogs.map(blog => blogPromoUrl(blog.slug)));
  const promoBlog = content?.blogs.find(blog => blogPromoUrl(blog.slug) === promoUrl);
  const matchingResults = content?.results.filter(result => result.url === promoUrl) || [];
  const promoResult = matchingResults.find(result => result.socialPromo) || matchingResults[0];
  const activePromo = promoResult?.socialPromo ?? (promoBlog && promoFromBlog(promoBlog));
  const promoKey = promoResult?.socialPromo ? promoResult.id : promoUrl;
  const posts = [
    ...(content?.blogs || []).map((p) => ({ ...p, kind: "blog" as Kind })),
    ...(content?.stories || []).map((p) => ({ ...p, kind: "story" as Kind })),
  ]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter((p) =>
      p.translations.en.title.toLowerCase().includes(query.toLowerCase()),
    );
  return (
    <div className="studio studio-shell">
      <aside className="studio-sidebar">
        <a href="/admin/" className="studio-wordmark"><b>FB<span className="studio-brand-dot">.</span></b><span>FARHAN BALOUCH<small>CREATOR STUDIO</small></span></a>
        <div className="studio-sidebar-label">YOUR WORKSPACE</div>
        <nav>
          {[
            { id: "write", label: "Writing desk", icon: PenLine },
            { id: "library", label: "Content library", icon: BookOpen },
            { id: "drafts", label: "Saved drafts", icon: FileText },
            { id: "biography", label: "My biography", icon: LayoutDashboard },
            { id: "activity", label: "Activity", icon: Radio },
            { id: "memories", label: "Memories · private", icon: LockKeyhole },
            { id: "projects", label: "Projects", icon: Briefcase },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              disabled={working}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setPreview(null);
                setPromoUrl(null);
              }}
            >
              <Icon size={18} />
              {label}
              {id === "library" && <span>{total}</span>}
            </button>
          ))}
        </nav>
        <div className="studio-sidebar-bottom">
          <a href="https://farhanbalouch.com/" target="_blank" rel="noreferrer">
            View website <ArrowUpRight size={16} />
          </a>
          <button
            disabled={working}
            onClick={() =>
              action(async () => {
                await api({ action: "logout" });
                lock();
              })
            }
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <div className="studio-main">
        <header>
          <StudioInstall />
          <span>
            <span className="studio-dot" /> Farhan’s creative universe
          </span>
          <button
            type="button"
            className="studio-session-exit"
            disabled={working}
            onClick={() =>
              action(async () => {
                await api({ action: "logout" });
                lock();
              })
            }
          >
            <LogOut size={15} /> Sign out
          </button>
        </header>
        <main>
          {content?.warnings?.map((warning) => (
            <p className="studio-success" role="status" key={warning}>
              {warning}
            </p>
          ))}
          <div className="studio-page-title">
            <div>
              <p className="studio-eyebrow">MAKE SOMETHING WORTH SHARING</p>
              <h1>
                {tab === "write"
                  ? "Make your next move."
                  : tab === "library"
                    ? "Your words, out there."
                    : tab === "drafts"
                      ? "Ideas in progress."
                      : tab === "biography"
                        ? "The bigger story."
                        : tab === "memories" ? "Memories, just for you." : tab === "projects" ? "Projects, one place." : "Behind the scenes."}
              </h1>
              <p>
                {tab === "write"
                  ? "A fresh idea today. A new story for the world tomorrow."
                  : "Everything you need, in one place."}
              </p>
            </div>
            {tab !== "memories" && tab !== "projects" && <button type="button" className="studio-primary" disabled={working} onClick={newDraft}>
              <Plus size={17} /> New draft
            </button>}
          </div>
          {tab === "memories" && <Suspense fallback={<p role="status">Opening Memories…</p>}><Memories /></Suspense>}
          {tab === "projects" && <Suspense fallback={<p role="status">Opening project settings…</p>}><StudioProjects imageAi={content?.imageAi === true} /></Suspense>}
          {tab === "write" && <div className="studio-stats">
            <div><span className="studio-stat-icon"><BookOpen size={20} /></span><strong>{content?.blogs.length || 0}<small>Published blogs</small></strong><span>YOUR PERSPECTIVE</span></div>
            <div><span className="studio-stat-icon"><Sparkles size={20} /></span><strong>{content?.stories.length || 0}<small>Public stories</small></strong><span>YOUR JOURNEY</span></div>
            <div><span className="studio-stat-icon"><FileText size={20} /></span><strong>{content?.drafts.length || 0}<small>Saved ideas</small></strong><span>WHAT’S NEXT</span></div>
          </div>}
          {message && (
            <div role="status" className="studio-success">
              <Check size={18} />
              {message}
            </div>
          )}
          {error && (
            <p role="alert" className="studio-error">
              {error}
            </p>
          )}
          {(tab === "library" || tab === "activity") && activePromo && promoKey && <StudioPromo
            key={promoKey}
            id={promoKey}
            promo={activePromo}
            url={promoUrl ?? undefined}
            published={!promoResult || Boolean(content?.liveIds?.includes(promoResult.id))}
            imageAi={content?.imageAi === true}
            initialArtwork={promoBlog?.images?.[0] ? "https://farhanbalouch.com" + promoBlog.images[0].src : undefined}
            editArtwork={request => api({action:"image-preview", mode:"edit", topic:"", ...request})}
            initialLabel={promoResult?.socialPromo ? undefined : "FROM THE BLOG"}
            generateArtwork={scene => api({ action: "image-preview", mode: "generate", topic: scene,
              instructions: "Photorealistic background art only. Keep it free of any lettering or logos." })}
            close={() => setPromoUrl(null)}
          />}
          {tab === "write" && (
            <div className="studio-editor-grid">
              <section className="studio-paper">
                <div className="studio-paper-top">
                  <span>
                    <PenLine size={17} />
                    {cloudDraft ? draftTitle(draft) : draft.slug ? "Editing published content" : "A fresh page"}
                  </span>
                  <span>
                    {draft.raw.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <label htmlFor="studio-kind">What are you sharing?</label>
                <select
                  disabled={working}
                  id="studio-kind"
                  value={draft.offlineQuickNote ? "" : draft.kind}
                  onChange={(e) =>
                    input({
                      kind: e.target.value as Kind,
                      slug: "",
                      urlSlug: "", metadataOnly: false,
                      notify: true,
                      offlineQuickNote: false,
                    })
                  }
                >
                  {draft.offlineQuickNote && <option value="" disabled>Choose what this note is before saving</option>}
                  {Object.entries(labels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                {draft.kind === "chapter" && (
                  <>
                    <label htmlFor="studio-chapter">Biography chapter</label>
                    <select
                      id="studio-chapter"
                      value={draft.slug}
                      disabled={working}
                      onChange={(e) => {
                        const ch = content?.chapters.find(
                          (c) => c.slug === e.target.value,
                        );
                        if (ch) edit(ch, "chapter");
                      }}
                    >
                      <option value="">Choose a chapter to edit</option>
                      {content?.chapters.map((ch) => (
                        <option key={ch.slug} value={ch.slug}>
                          {ch.part}. {ch.translations.en.title}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {draft.offlineQuickNote && <p className="studio-offline-import-hint">This is still a device-only note. Choose its content type above, then use “Save private draft” to copy it to your account. Public publish stays a separate step.</p>}
                <label htmlFor="studio-short-title">Short display title (optional)</label>
                <input id="studio-short-title" maxLength={80} placeholder="e.g. Fear and Action" value={draft.shortTitle || ''} disabled={working} onChange={e => input({shortTitle:e.target.value})} />
                <label htmlFor="studio-secondary-title">Secondary / alternate title (optional)</label>
                <input id="studio-secondary-title" maxLength={180} placeholder="A descriptive name readers can search for" value={draft.secondaryTitle || ''} disabled={working} onChange={e => input({secondaryTitle:e.target.value})} />
                {draft.kind !== 'chapter' && <><label htmlFor="studio-url-slug">Short link (optional)</label><input id="studio-url-slug" maxLength={64} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="fear-and-action" value={draft.urlSlug || ''} disabled={working} onChange={e => input({urlSlug:e.target.value})} /><p className="studio-hint">Use lowercase English letters, numbers and hyphens. Old published links redirect when you change this.</p></>}
                {draft.slug && <label className="studio-check"><input type="checkbox" checked={draft.metadataOnly === true} disabled={working} onChange={e => input({metadataOnly:e.target.checked})} /> Update names and link only; keep all article text (no AI rewrite)</label>}
                <label htmlFor="studio-raw" className="sr-only">
                  Your note
                </label>
                <textarea
                  id="studio-raw"
                  value={draft.raw}
                  disabled={working}
                  maxLength={50000}
                  onChange={(e) => input({ raw: e.target.value })}
                  placeholder={
                    "Start with a title or just a thought…\n\nAaj main ne apne project par kaam kiya…\n\nEnglish, Roman Urdu, Hinglish or Urdu — write however you think."
                  }
                />
                <div className="studio-paper-bottom">
                  <button type="button" disabled={working} onClick={() => file.current?.click()}>
                    <Upload size={16} /> Import text
                  </button>
                  <input
                    ref={file}
                    type="file"
                    accept=".txt,.md,text/plain,text/markdown"
                    hidden
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (selected && selected.size <= 200000)
                        selected.text().then(raw => {
                          setDraft(current => current.id === draft.id
                            ? { ...current, raw: raw.slice(0, 50000), dirty: true, updatedAt: new Date().toISOString() }
                            : current);
                        });
                      else setError("Choose a text file smaller than 200 KB.");
                      e.target.value = "";
                    }}
                  />
                  <span>{!deviceSaved ? "Device storage unavailable" : cloudDraft && !draft.dirty ? "Saved to cloud" : hasDraftContent(draft) ? "Changes kept on this device" : "Device autosave is on"}</span>
                </div>
                <StudioPhotos key={draft.id} images={draft.images || []} raw={draft.raw} aiReady={content?.imageAi === true}
                  onChange={(images) => input({ images })} disabled={working} onBusy={setPhotoBusy}
                  upload={(data) => api({ action: "upload-image", data })}
                  createPreview={(request) => api({ action: "image-preview", ...request })} />
              </section>
              <aside className="studio-publish">
                <div className="studio-icon">
                  <Sparkles />
                </div>
                <h2>
                  You write.
                  <br />
                  AI takes it from here.
                </h2>
                <p>
                  Your meaning stays yours. AI polishes the writing and prepares
                  three language versions.
                </p>
                <div className="studio-languages">
                  <span>EN</span>
                  <span>Hinglish</span>
                  <span>اردو</span>
                </div>
                <div className="studio-destination">
                  <span>DESTINATION</span>
                  <strong>
                    {draft.kind === "blog"
                      ? "/blog"
                      : draft.kind === "chapter"
                        ? "/story"
                        : "/stories"}
                  </strong>
                </div>
                <label className="studio-check">
                  <input
                    type="checkbox"
                    checked={draft.notify}
                    disabled={working}
                    onChange={(e) => input({ notify: e.target.checked })}
                  />
                  <span>
                    Notify my audience
                    <small>
                      Browser notifications after the update is live.
                    </small>
                  </span>
                </label>
                <button
                  className="studio-primary"
                  disabled={
                    working ||
                    draft.offlineQuickNote ||
                    (draft.images || []).some((image) => !image.alt.trim()) ||
                    draft.raw.trim().length < 10 ||
                    (draft.kind === "chapter" && !draft.slug)
                  }
                  onClick={() => publish("publish")}
                >
                  <Send size={17} />
                  {busy ? "Working…" : "Publish with AI"}
                </button>
                <button
                  className="studio-secondary"
                  disabled={working || draft.offlineQuickNote || !hasDraftContent(draft) || (draft.images || []).some((image) => !image.alt.trim())}
                  onClick={() => publish("save")}
                >
                  <Save size={16} />
                  {draft.offlineQuickNote ? "Choose type to save draft" : cloudDraft ? "Update saved draft" : "Save private draft"}
                </button>
                {cloudDraft && <button type="button" className="studio-secondary"
                  disabled={working || !hasDraftContent(draft) || (draft.images || []).some(image => !image.alt.trim())}
                  onClick={() => publish("save", true)}>
                  <Plus size={16} /> Save as new draft
                </button>}
                <p className="studio-fine">
                  Publishing makes this content public. AI processing and
                  deployment usually take a few minutes.
                </p>
              </aside>
            </div>
          )}
          {tab === "library" && (
            <>
              <input
                className="studio-search"
                aria-label="Search published content"
                placeholder="Find a post or story…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {preview ? (
                <article className="studio-paper studio-reading">
                  <div className="studio-reading-toolbar">
                    <button type="button" onClick={() => setPreview(null)}>
                      ← Back to library
                    </button>
                    {preview.kind === "blog" && (
                      <button
                        type="button"
                        className="studio-delete-blog"
                        disabled={working}
                        onClick={() => deleteBlog(preview)}
                      >
                        <Trash2 size={16} /> Delete this blog
                      </button>
                    )}
                  </div>
                  <div className="studio-languages">
                    {(["en", "hi", "ur"] as const).map((l) => (
                      <button key={l} onClick={() => setLang(l)}>
                        {l === "hi" ? "Hinglish" : l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div dir={lang === "ur" ? "rtl" : "ltr"}>
                    <h2>{preview.translations[lang].title}</h2>
                    {!!preview.images?.length && <div className="studio-reading-photos">{preview.images.map((photo) => <figure key={photo.src}><img src={`https://farhanbalouch.com${photo.src}`} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />{photo.caption && <figcaption>{photo.caption}</figcaption>}</figure>)}</div>}
                    {preview.translations[lang].body.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </article>
              ) : (
                <div className="studio-content-list">
                  {posts.map((p) => (
                    <article key={`${p.kind}-${p.slug}`}>
                      <div>
                        <span className="studio-tag">{labels[p.kind]}</span>
                        <h2>{p.translations.en.title}</h2>
                        <p>{p.translations.en.excerpt}</p>
                        <small>
                          {new Date(p.publishedAt).toLocaleDateString("en-GB")}
                        </small>
                      </div>
                      <div className="studio-row-actions">
                        {p.kind === "blog" && <button type="button" onClick={() => setPromoUrl(blogPromoUrl(p.slug))}>
                          <Sparkles size={16} /> Social Promo
                        </button>}
                        <button onClick={() => setPreview(p)}>Read</button>
                        <button onClick={() => edit(p, p.kind)}>
                          Edit <PenLine size={14} />
                        </button>
                        {p.kind === "blog" && (
                          <button
                            type="button"
                            className="studio-delete-blog"
                            disabled={working}
                            onClick={() => deleteBlog(p)}
                            aria-label={`Permanently delete blog: ${p.translations.en.title}`}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                        <a
                          href={`https://farhanbalouch.com${p.kind === "blog" ? "/blog" : "/stories"}/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${p.translations.en.title}`}
                        >
                          <ArrowUpRight size={18} />
                        </a>
                      </div>
                    </article>
                  ))}
                  {!posts.length && (
                    <div className="studio-empty">
                      No published posts here yet. Your next idea can be the
                      first.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {tab === "drafts" && <StudioDrafts cloud={content?.drafts ?? []} labels={labels}
            disabled={working} loadDraft={loadDraft} open={openDraft} />}
          {tab === "biography" && (
            <>
              <div className="studio-paper studio-reading">
                <h2>A life told in chapters.</h2>
                <p>
                  Every Sunday at 11pm Pakistan time, AI reads new blogs and
                  adds relevant details to your existing biography. You can run
                  it now or edit a chapter below.
                </p>
                <button
                  className="studio-secondary"
                  disabled={working}
                  onClick={() =>
                    action(async () => {
                      const result = await api({ action: "weekly" });
                      setMessage(result.message);
                      setTab("activity");
                    })
                  }
                >
                  <Sparkles size={16} />
                  Update biography from blogs now
                </button>
              </div>
              <div className="studio-content-list">
                {content?.chapters.map((ch) => (
                  <article key={ch.slug}>
                    <div>
                      <span className="studio-tag">
                        Chapter {ch.part} · {ch.period}
                      </span>
                      <h2>{ch.translations.en.title}</h2>
                    </div>
                    <button onClick={() => edit(ch, "chapter")}>
                      Edit chapter <PenLine size={16} />
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
          {tab === "activity" && (
            <div className="studio-content-list">
              <div className="studio-paper studio-reading">
                <h2>From a note to a live post.</h2>
                <p>
                  AI edits → three languages → website deployment → optional
                  notification. A queued request is not published yet. Any
                  failed run appears below; open its details to see what needs
                  attention.
                </p>
                <button onClick={load}>Refresh activity</button>
              </div>
              {content?.results?.map((result) => (
                <article key={result.id}>
                  <div>
                    <span
                      className={`studio-tag ${result.status === "failed" ? "studio-failed" : ""}`}
                    >
                      {result.status === "failed"
                        ? "Needs attention"
                        : content.liveIds?.includes(result.id)
                          ? "Live on website"
                          : "AI ready · deploying"}
                    </span>
                    <h2>{result.title}</h2>
                    {result.error && <p>{result.error}</p>}
                  </div>
                  {result.status === "failed" ? (
                    <button
                      disabled={working}
                      onClick={() =>
                        action(async () => {
                          if (!keepDeviceDraft()) throw new Error("Save the current draft to the cloud before switching.");
                          const note = await api({
                            action: "failed",
                            name: result.id + ".json",
                          });
                          setDraft({ ...note, id: crypto.randomUUID(), revision: undefined, dirty: true });
                          setTab("write");
                        })
                      }
                    >
                      Recover note & retry
                    </button>
                  ) : (
                    <div className="studio-row-actions">
                      {result.url && (result.socialPromo || blogUrls.has(result.url)) && <button type="button" onClick={() => setPromoUrl(result.url ?? null)}>
                        <Sparkles size={16} /> Social Promo
                      </button>}
                      {result.url && <a href={result.url} target="_blank" rel="noreferrer">
                        View post <ArrowUpRight size={17} />
                      </a>}
                    </div>
                  )}
                </article>
              ))}
              {content?.runs.map((run) => (
                <article key={run.id}>
                  <div>
                    <span
                      className={`studio-tag ${run.conclusion === "failure" ? "studio-failed" : ""}`}
                    >
                      {run.status === "completed" ? run.conclusion : run.status}
                    </span>
                    <h2>{run.title}</h2>
                    <small>
                      {new Date(run.createdAt).toLocaleString("en-GB")}
                    </small>
                  </div>
                  <a href={run.url} target="_blank" rel="noreferrer">
                    View details <ArrowUpRight size={17} />
                  </a>
                </article>
              ))}
            </div>
          )}
        </main>
        <footer>
          MADE FOR YOUR NEXT CHAPTER. <a href="https://farhanbalouch.com/">farhanbalouch.com ↗</a>
        </footer>
      </div>
    </div>
  );
}
