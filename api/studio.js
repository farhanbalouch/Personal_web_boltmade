import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
const REPO = "muhammadfarhan138223-cmyk/Personal_web_boltmade";
const OWNER = "muhammadfarhan138223-cmyk";
const COOKIE = "__Host-farhan-studio";
const TTL = 30 * 24 * 60 * 60;
const fail = (status, message) => Object.assign(new Error(message), { status });
function key() {
  if (!process.env.ADMIN_SESSION_SECRET)
    throw fail(503, "Studio session configuration is missing.");
  return createHash("sha256").update(process.env.ADMIN_SESSION_SECRET).digest();
}
export function seal(token) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify({ token, expires: Date.now() + TTL * 1000 })),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function unseal(value) {
  try {
    const data = Buffer.from(value || "", "base64url");
    const cipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
    cipher.setAuthTag(data.subarray(12, 28));
    const session = JSON.parse(
      Buffer.concat([
        cipher.update(data.subarray(28)),
        cipher.final(),
      ]).toString(),
    );
    if (session.expires > Date.now()) return session.token;
  } catch {
    /* Invalid, expired or rotated session. */
  }
  throw fail(401, "Please connect your GitHub account to Studio.");
}
async function github(token, path, options = {}) {
  const r = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    if (r.status === 401)
      throw fail(
        401,
        "GitHub rejected this token. Paste the complete generated token (not its name). It may be incomplete, expired or revoked.",
      );
    if (r.status === 403)
      throw fail(
        403,
        "GitHub denied access. Select Personal_web_boltmade and allow Contents and Actions: Read and write on this token.",
      );
    if (r.status === 404)
      throw fail(
        403,
        "The token cannot access Personal_web_boltmade. Edit its selected repositories in GitHub and include this repository.",
      );
    throw fail(
      502,
      `GitHub is temporarily unavailable (HTTP ${r.status}). Please retry later.`,
    );
  }
  return r.status === 204 ? null : r.json();
}
const repo = (path) => `/repos/${REPO}${path}`;
async function read(token, path, fallback) {
  const r = await fetch(
    `https://api.github.com${repo(`/contents/${path}?ref=main`)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(20000),
    },
  );
  if (r.status === 404 && fallback !== undefined) return fallback;
  if (!r.ok) throw fail(502, "Could not load website content from GitHub.");
  const file = await r.json();
  return Array.isArray(file)
    ? file
    : JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
}
export function validateRequest(body) {
  const kind = body.kind;
  if (!["blog", "story", "chapter", "project"].includes(kind))
    throw fail(400, "Choose a valid content type.");
  if (
    typeof body.raw !== "string" ||
    body.raw.trim().length < 10 ||
    body.raw.length > 50000
  )
    throw fail(400, "Write between 10 and 50,000 characters.");
  const slug = body.slug || "";
  if (slug && !/^[a-z0-9-]{1,100}$/.test(slug))
    throw fail(400, "Invalid content address.");
  if (kind === "chapter" && !slug)
    throw fail(400, "Select an existing biography chapter.");
  const id = body.id || randomUUID();
  if (!/^[a-f0-9-]{36}$/.test(id)) throw fail(400, "Invalid draft ID.");
  return {
    id,
    kind,
    raw: body.raw.trim(),
    slug,
    notify: body.notify === true,
    createdAt: new Date().toISOString(),
  };
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Farhan-Studio", "api-v2");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const reply = (status, body) => res.status(status).json(body);
  try {
    if (!["GET", "POST"].includes(req.method))
      return reply(405, { error: "Method not allowed." });
    if (
      req.method === "POST" &&
      (req.headers.origin !== `https://${req.headers.host}` ||
        !req.headers["content-type"]?.startsWith("application/json"))
    )
      throw fail(403, "Use Studio from this website.");
    let body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    if (JSON.stringify(body).length > 60000)
      throw fail(413, "This note is too large.");
    if (req.method === "POST" && body.action === "logout") {
      res.setHeader(
        "Set-Cookie",
        `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
      );
      return reply(200, { ok: true });
    }
    if (req.method === "POST" && body.action === "login") {
      const loginToken =
        typeof body.token === "string" ? body.token.replace(/\s+/g, "") : "";
      if (
        !/^(github_pat_|ghp_)[A-Za-z0-9_]+$/.test(loginToken) ||
        loginToken.length < 20 ||
        loginToken.length > 500
      )
        throw fail(
          400,
          "Paste the complete token generated by GitHub. It starts with github_pat_ (fine-grained) or ghp_. Do not paste the token name.",
        );
      const user = await github(loginToken, "/user");
      if (user.login.toLowerCase() !== OWNER)
        throw fail(
          403,
          "This token belongs to a different GitHub account. Use the account that owns this website.",
        );
      const repository = await github(loginToken, repo(""));
      if (!repository.permissions?.push)
        throw fail(
          403,
          "Your token is valid, but it needs Contents: Read and write for Personal_web_boltmade.",
        );
      res.setHeader(
        "Set-Cookie",
        `${COOKIE}=${seal(loginToken)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL}`,
      );
      return reply(200, { ok: true });
    }
    const cookies = Object.fromEntries(
      (req.headers.cookie || "").split(";").map((c) => c.trim().split("=")),
    );
    const token = unseal(cookies[COOKIE]);
    if (req.method === "GET") {
      const [blogs, stories, chapters, drafts, runs, results, liveIds] =
        await Promise.all([
          read(token, "src/data/blog-posts.json"),
          read(token, "src/data/stories.json", []),
          read(token, "src/data/story-chapters.json"),
          read(token, "content/studio-drafts", []),
          github(token, repo("/actions/runs?per_page=12")),
          read(token, "content/studio-results.json", []),
          fetch("https://farhanbalouch.com/publish-receipts.json", {
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
          })
            .then((r) => r.json())
            .catch(() => []),
        ]);
      return reply(200, {
        blogs,
        stories,
        chapters,
        results,
        liveIds,
        drafts: drafts
          .filter((d) => d.name.endsWith(".json"))
          .map((d) => ({ name: d.name, path: d.path })),
        runs: runs.workflow_runs.map((r) => ({
          id: r.id,
          title: r.display_title,
          status: r.status,
          conclusion: r.conclusion,
          url: r.html_url,
          createdAt: r.created_at,
        })),
      });
    }
    if (body.action === "draft" || body.action === "failed") {
      if (!/^[a-f0-9-]{36}\.json$/.test(body.name || ""))
        throw fail(400, "Invalid draft.");
      return reply(
        200,
        await read(
          token,
          `content/${body.action === "failed" ? "failed-requests" : "studio-drafts"}/${body.name}`,
        ),
      );
    }
    if (body.action === "weekly") {
      await github(
        token,
        repo("/actions/workflows/story-merge.yml/dispatches"),
        { method: "POST", body: JSON.stringify({ ref: "main" }) },
      );
      return reply(202, {
        message: "Weekly biography update queued. Check Activity for progress.",
      });
    }
    if (!["save", "publish"].includes(body.action))
      throw fail(400, "Unknown Studio action.");
    const draft = validateRequest(body);
    const path = `content/${body.action === "save" ? "studio-drafts" : "requests"}/${draft.id}.json`;
    const current = await fetch(
      `https://api.github.com${repo(`/contents/${path}?ref=main`)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!current.ok && current.status !== 404)
      throw fail(502, "Could not check draft status.");
    const prior = current.ok ? await current.json() : null;
    await github(token, repo(`/contents/${path}`), {
      method: "PUT",
      body: JSON.stringify({
        message: `${body.action === "save" ? "Save draft" : "Publish from Studio"}: ${draft.kind}`,
        content: Buffer.from(JSON.stringify(draft, null, 2)).toString("base64"),
        branch: "main",
        ...(prior ? { sha: prior.sha } : {}),
      }),
    });
    return reply(202, {
      id: draft.id,
      message:
        body.action === "save"
          ? "Draft saved privately. It is not published."
          : "Queued for AI editing and translation. Activity will show publishing progress.",
    });
  } catch (err) {
    if (!err.status) console.error("Studio request failed:", err.name);
    return reply(err.status || 500, {
      error: err.status
        ? err.message
        : "Studio could not complete the request. Please try again.",
    });
  }
}
