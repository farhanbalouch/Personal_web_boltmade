import { StudioInstall } from "@/components/StudioInstall";
import { setupStudioPwa } from "@/lib/studioPwa";
import { parseStudioResponse } from "@/lib/studio-response";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
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
} from "lucide-react";
import type { BlogPost } from "@/data/blog";
import type { StoryChapter } from "@/data/content";
import "./studio.css";
type Kind = "blog" | "story" | "chapter" | "project";
type Draft = {
  id: string;
  kind: Kind;
  raw: string;
  slug: string;
  notify: boolean;
};
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
};
type Content = {
  warnings?: string[];
  results: StudioResult[];
  liveIds: string[];
  blogs: BlogPost[];
  stories: BlogPost[];
  chapters: StoryChapter[];
  drafts: { name: string }[];
  runs: Run[];
};
const empty = (): Draft => ({
  id: crypto.randomUUID(),
  kind: "blog",
  raw: "",
  slug: "",
  notify: true,
});
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
const labels: Record<Kind, string> = {
  blog: "Blog post",
  story: "Public story",
  chapter: "Biography chapter",
  project: "Project update",
};
export function Studio() {
  const [auth, setAuth] = useState<"loading" | "login" | "ready">("loading"),
    [token, setToken] = useState("");
  const [content, setContent] = useState<Content | null>(null),
    [tab, setTab] = useState("write");
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("studio-note") || "null") || empty()
      );
    } catch {
      return empty();
    }
  });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [query, setQuery] = useState(""),
    [preview, setPreview] = useState<BlogPost | null>(null),
    [lang, setLang] = useState<"en" | "hi" | "ur">("en");
  const file = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    try {
      setContent(await api());
      setAuth("ready");
    } catch (e) {
      if ((e as { status?: number }).status === 401) setAuth("login");
      else {
        setError((e as Error).message);
        setAuth((s) => (s === "loading" ? "login" : s));
      }
    }
  }, []);
  useEffect(() => {
    document.title = "Farhan Studio · Your publishing desk";
    setupStudioPwa().catch(() => {
      /* Online editing remains available if app installation is unsupported. */
    });
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    load();
    return () => robots.remove();
  }, [load]);
  useEffect(() => {
    try {
      localStorage.setItem("studio-note", JSON.stringify(draft));
    } catch {
      /* Repository draft saving remains available when device storage is full. */
    }
  }, [draft]);
  useEffect(() => {
    if (auth !== "ready") return;
    const timer = setInterval(load, 20000);
    return () => clearInterval(timer);
  }, [auth, load]);
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
  function edit(post: BlogPost | StoryChapter, kind: Kind) {
    const t = post.translations.en;
    const raw = `${t.title}\n\n${"body" in t ? t.body.join("\n\n") : t.paragraphs.join("\n\n")}`;
    setDraft({
      id: crypto.randomUUID(),
      kind,
      raw,
      slug: post.slug,
      notify: false,
    });
    setPreview(null);
    setTab("write");
    setMessage("Editing the existing item. Its public URL will stay the same.");
  }
  const publish = (mode: "save" | "publish") =>
    action(async () => {
      const result = await api({ action: mode, ...draft });
      setMessage(result.message);
      if (mode === "publish") {
        setDraft(empty());
        setTab("activity");
      }
      await load();
    });
  const input = (value: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...value }));
  if (auth === "loading")
    return (
      <div className="studio studio-loading">
        <Sparkles /> Opening your publishing desk…
      </div>
    );
  if (auth === "login")
    return (
      <div className="studio studio-login">
        <a href="/" className="studio-wordmark">
          FB<span>STUDIO</span>
        </a>
        <div className="studio-login-install">
          <StudioInstall />
        </div>
        <div className="studio-login-grid">
          <section>
            <span className="studio-eyebrow">A little space for big ideas</span>
            <h1>
              Your words.
              <br />
              Ready for
              <br />
              <em>the world.</em>
            </h1>
            <p>
              Bas apne alfaaz likho. AI unhein saaf, professional English,
              Hinglish aur Urdu mein publish kar dega.
            </p>
            <div className="studio-login-steps">
              <span>01 &nbsp; Write naturally</span>
              <span>02 &nbsp; AI edits & translates</span>
              <span>03 &nbsp; Your website updates</span>
            </div>
          </section>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                await api({
                  action: "login",
                  token: token.replace(/\s+/g, ""),
                });
                setToken("");
                await load();
              });
            }}
            className="studio-login-card"
          >
            <div className="studio-icon">
              <PenLine />
            </div>
            <h2>Welcome back, Farhan.</h2>
            <p>
              Connect GitHub once on this browser. After that, manage everything
              here.
            </p>
            <label htmlFor="studio-token">GitHub access token</label>
            <input
              id="studio-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              required
              placeholder="github_pat_…"
            />
            <p className="studio-token-hint">
              Paste the full generated <code>github_pat_…</code> value, not the
              name you gave the token. Spaces and line breaks are removed
              automatically.
            </p>
            <button className="studio-primary" disabled={busy}>
              {busy ? "Connecting…" : "Open my Studio"}
              <ArrowUpRight size={18} />
            </button>
            {error && (
              <p role="alert" className="studio-error">
                {error}
              </p>
            )}
            <details>
              <summary>First visit? One-time connection guide</summary>
              <ol>
                <li>
                  <a
                    href="https://github.com/settings/personal-access-tokens/new"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Create a fine-grained GitHub token ↗
                  </a>
                </li>
                <li>
                  Choose only <strong>Personal_web_boltmade</strong>.
                </li>
                <li>
                  Allow <strong>Contents: Read and write</strong> and{" "}
                  <strong>Actions: Read and write</strong>. Metadata is
                  automatic.
                </li>
                <li>
                  Choose an expiry, generate it, and paste it into the field
                  above.
                </li>
              </ol>
              <p>
                Your token stays encrypted in a secure browser cookie. It is
                never saved in website code or local storage. Reconnect when it
                expires. Never paste it into a chat.
              </p>
            </details>
          </form>
        </div>
        <footer>FARHAN BALOUCH &nbsp; / &nbsp; A PRIVATE CREATIVE SPACE</footer>
      </div>
    );
  const total = (content?.blogs.length || 0) + (content?.stories.length || 0);
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
        <a href="/admin" className="studio-wordmark">
          FB<span>STUDIO</span>
        </a>
        <div className="studio-sidebar-label">YOUR WORKSPACE</div>
        <nav>
          {[
            { id: "write", label: "Writing desk", icon: PenLine },
            { id: "library", label: "Content library", icon: BookOpen },
            { id: "drafts", label: "Saved drafts", icon: FileText },
            { id: "biography", label: "My biography", icon: LayoutDashboard },
            { id: "activity", label: "Activity", icon: Radio },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setPreview(null);
              }}
            >
              <Icon size={18} />
              {label}
              {id === "library" && <span>{total}</span>}
            </button>
          ))}
        </nav>
        <div className="studio-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            View website <ArrowUpRight size={16} />
          </a>
          <button
            onClick={() =>
              action(async () => {
                await api({ action: "logout" });
                setAuth("login");
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
            <span className="studio-dot" /> Personal publishing space
          </span>
          <button
            type="button"
            className="studio-session-exit"
            disabled={busy}
            onClick={() =>
              action(async () => {
                await api({ action: "logout" });
                setAuth("login");
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
                  ? "The writing desk."
                  : tab === "library"
                    ? "Your words, out there."
                    : tab === "drafts"
                      ? "Ideas in progress."
                      : tab === "biography"
                        ? "The bigger story."
                        : "Behind the scenes."}
              </h1>
              <p>
                {tab === "write"
                  ? "A thought, an update, a story. Start with your own words."
                  : "Everything you need, in one place."}
              </p>
            </div>
            {tab !== "write" && (
              <button
                className="studio-primary"
                onClick={() => {
                  setDraft(empty());
                  setTab("write");
                }}
              >
                <Plus size={17} /> New post
              </button>
            )}
          </div>
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
          {tab === "write" && (
            <div className="studio-editor-grid">
              <section className="studio-paper">
                <div className="studio-paper-top">
                  <span>
                    <PenLine size={17} />
                    {draft.slug ? "Editing published content" : "A fresh page"}
                  </span>
                  <span>
                    {draft.raw.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <label htmlFor="studio-kind">What are you sharing?</label>
                <select
                  id="studio-kind"
                  value={draft.kind}
                  onChange={(e) =>
                    input({
                      kind: e.target.value as Kind,
                      slug: "",
                      notify: true,
                    })
                  }
                >
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
                <label htmlFor="studio-raw" className="sr-only">
                  Your note
                </label>
                <textarea
                  id="studio-raw"
                  value={draft.raw}
                  maxLength={50000}
                  onChange={(e) => input({ raw: e.target.value })}
                  placeholder={
                    "Start with a title or just a thought…\n\nAaj main ne apne project par kaam kiya…\n\nEnglish, Roman Urdu, Hinglish or Urdu — write however you think."
                  }
                />
                <div className="studio-paper-bottom">
                  <button onClick={() => file.current?.click()}>
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
                        selected
                          .text()
                          .then((raw) => input({ raw: raw.slice(0, 50000) }));
                      else setError("Choose a text file smaller than 200 KB.");
                      e.target.value = "";
                    }}
                  />
                  <span>Draft restored on this device</span>
                </div>
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
                    busy ||
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
                  disabled={busy || draft.raw.trim().length < 10}
                  onClick={() => publish("save")}
                >
                  <Save size={16} />
                  Save private draft
                </button>
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
                  <button onClick={() => setPreview(null)}>
                    ← Back to library
                  </button>
                  <div className="studio-languages">
                    {(["en", "hi", "ur"] as const).map((l) => (
                      <button key={l} onClick={() => setLang(l)}>
                        {l === "hi" ? "Hinglish" : l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div dir={lang === "ur" ? "rtl" : "ltr"}>
                    <h2>{preview.translations[lang].title}</h2>
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
                        <button onClick={() => setPreview(p)}>Read</button>
                        <button onClick={() => edit(p, p.kind)}>
                          Edit <PenLine size={14} />
                        </button>
                        <a
                          href={`${p.kind === "blog" ? "/blog" : "/stories"}/${p.slug}`}
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
          {tab === "drafts" && (
            <div className="studio-content-list">
              {content?.drafts.map((d) => (
                <article key={d.name}>
                  <div>
                    <span className="studio-tag">Private draft</span>
                    <h2>Saved idea · {d.name.slice(0, 8)}</h2>
                  </div>
                  <button
                    onClick={() =>
                      action(async () => {
                        setDraft(await api({ action: "draft", name: d.name }));
                        setTab("write");
                      })
                    }
                  >
                    Continue writing <ArrowUpRight size={17} />
                  </button>
                </article>
              ))}
              {!content?.drafts.length && (
                <div className="studio-empty">
                  Your saved drafts will wait here until you’re ready.
                </div>
              )}
            </div>
          )}
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
                  disabled={busy}
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
                      onClick={() =>
                        action(async () => {
                          const note = await api({
                            action: "failed",
                            name: result.id + ".json",
                          });
                          setDraft({ ...note, id: crypto.randomUUID() });
                          setTab("write");
                        })
                      }
                    >
                      Recover note & retry
                    </button>
                  ) : (
                    result.url && (
                      <a href={result.url} target="_blank" rel="noreferrer">
                        View post <ArrowUpRight size={17} />
                      </a>
                    )
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
          MADE FOR YOUR NEXT CHAPTER. <a href="/">farhanbalouch.com ↗</a>
        </footer>
      </div>
    </div>
  );
}
