import { validateLabels } from "../server/content-labels.js";
import { validateImages, validateUpload } from "../server/images.js";
import { createImagePreview, imageAiConfigured } from "../server/image-ai.js";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
const REPO = "muhammadfarhan138223-cmyk/Personal_web_boltmade";
const OWNER = "muhammadfarhan138223-cmyk";
const COOKIE = "__Host-farhan-studio";
const TTL = 8 * 60 * 60;
const fail = (status, message) => Object.assign(new Error(message), { status });
const digest = (value) => createHash("sha256").update(value).digest();
// Best-effort per-instance protection; use Vercel Firewall for shared edge limits.
const attempts = new Map();
const WINDOW = 10 * 60 * 1000;
function configuration() {
  const password = process.env.ADMIN_PASSWORD;
  const token = process.env.STUDIO_GITHUB_TOKEN?.replace(/\s+/g, "");
  if (!password || password.length < 16 || password.length > 256 ||
      !token || !/^(github_pat_|ghp_)[A-Za-z0-9_]+$/.test(token) ||
      token.length < 20 || token.length > 500 ||
      !process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32)
    throw fail(503, "Studio setup is incomplete. Set ADMIN_PASSWORD (16+ characters), STUDIO_GITHUB_TOKEN and ADMIN_SESSION_SECRET (32+ characters) in Vercel, then redeploy.");
  return { password, token };
}
function key() {
  const { password, token } = configuration();
  // Rotating any credential invalidates every earlier session, including PAT cookies.
  return digest(JSON.stringify([process.env.ADMIN_SESSION_SECRET, password, token]));
}
export function seal() {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify({ role: "owner", expires: Date.now() + TTL * 1000 })),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function unseal(value) {
  // A broken server configuration must never turn into an authentication bypass.
  const sessionKey = key();
  try {
    const data = Buffer.from(value || "", "base64url");
    const cipher = createDecipheriv("aes-256-gcm", sessionKey, data.subarray(0, 12));
    cipher.setAuthTag(data.subarray(12, 28));
    const session = JSON.parse(Buffer.concat([
      cipher.update(data.subarray(28)), cipher.final(),
    ]).toString());
    if (session.role === "owner" && session.expires > Date.now())
      return configuration().token;
  } catch { /* Invalid, expired or rotated session. */ }
  throw fail(401, "Please enter your Studio password.");
}
function loginBucket(req) {
  const now = Date.now();
  for (const [id, entry] of attempts) if (entry.until <= now) attempts.delete(id);
  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const id = digest(ip).toString("hex");
  let bucket = attempts.get(id);
  if (!bucket) {
    if (attempts.size >= 4096) attempts.delete(attempts.keys().next().value);
    bucket = { count: 0, until: now + WINDOW };
    attempts.set(id, bucket);
  }
  if (bucket.count >= 5) throw fail(429, "Too many attempts. Please wait 10 minutes before trying again.");
  bucket.count++;
  return bucket;
}
export async function github(token, path, options = {}) {
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
    const stage =
      path === "/user"
        ? "GitHub account verification"
        : path.includes("/actions/")
          ? "Actions activity access"
          : path.includes("/contents/")
            ? "Website content access"
            : "Repository access";
    const requestId = r.headers.get("x-github-request-id");
    console.warn(
      "Studio GitHub request failed",
      JSON.stringify({ stage, status: r.status, requestId }),
    );
    let message;
    if (r.status === 401)
      message =
        "GitHub rejected this token during " +
        stage +
        ". It may be incomplete, expired or revoked.";
    else if (stage === "Actions activity access")
      message =
        "Your account is connected, but GitHub denied Actions activity (HTTP " +
        r.status +
        "). Enable Actions: Read and write for this token.";
    else if (stage === "Website content access")
      message =
        "Your GitHub account was verified, but GitHub denied the website content file (HTTP " +
        r.status +
        "). Check Resource owner: muhammadfarhan138223-cmyk, selected repository: Personal_web_boltmade, and Contents: Read and write.";
    else
      message =
        stage +
        " failed (HTTP " +
        r.status +
        "). This does not by itself prove that you selected the wrong repository.";
    throw Object.assign(
      fail(
        r.status === 401
          ? 401
          : r.status === 403 || r.status === 404
            ? 403
            : 502,
        message,
      ),
      { githubStatus: r.status, stage, requestId },
    );
  }
  return r.status === 204 ? null : r.json();
}
const repo = (path) => `/repos/${REPO}${path}`;
async function read(token, path, fallback) {
  let file;
  try {
    file = await github(token, repo(`/contents/${path}?ref=main`));
  } catch (err) {
    if (err.githubStatus === 404 && fallback !== undefined) return fallback;
    throw err;
  }
  return Array.isArray(file)
    ? file
    : JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
}
export function validateRequest(body, savingDraft = false) {
  const kind = body.kind;
  if (!["blog", "story", "chapter", "project"].includes(kind))
    throw fail(400, "Choose a valid content type.");
  if (
    typeof body.raw !== "string" ||
    (savingDraft ? !body.raw.trim() && !body.images?.length : body.raw.trim().length < 10) ||
    body.raw.length > 50000
  )
    throw fail(400, savingDraft ? "Add some text or a photo to save a draft (50,000 characters maximum)." : "Write between 10 and 50,000 characters.");
  const slug = body.slug || "";
  if (slug && !/^[a-z0-9-]{1,100}$/.test(slug))
    throw fail(400, "Invalid content address.");
  if (!savingDraft && kind === "chapter" && !slug)
    throw fail(400, "Select an existing biography chapter.");
  const id = body.id || randomUUID();
  if (!/^[a-f0-9-]{36}$/.test(id)) throw fail(400, "Invalid draft ID.");
  return {
    ...validateLabels(body),
    id,
    kind,
    raw: savingDraft ? body.raw : body.raw.trim(),
    slug,
    notify: body.notify === true,
    createdAt: new Date().toISOString(),
    ...(body.images !== undefined ? { images: validateImages(body.images) } : {}),
  };
}
const draftConflict = () => fail(409, "This draft has a different cloud version. Use Save as new draft to keep your changes separately, or reopen the cloud version from Saved drafts.");

function draftFromFile(file) {
  return JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
}

async function saveDraft(token, body) {
  const draft = validateRequest(body, true);
  const path = repo(`/contents/content/studio-drafts/${draft.id}.json`);
  const current = await fetch(`https://api.github.com${path}?ref=main`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
  });
  if (!current.ok && current.status !== 404) throw fail(502, "Could not check draft status.");
  const file = current.ok ? await current.json() : null;
  const prior = file ? draftFromFile(file) : null;
  const summary = ({ kind, raw, slug, notify, images, shortTitle, secondaryTitle, urlSlug, metadataOnly }) => JSON.stringify([kind, raw, slug, notify, images ?? [], shortTitle, secondaryTitle, urlSlug, metadataOnly]);
  if (prior && summary(prior) === summary(draft)) {
    return { id: draft.id, revision: file.sha, updatedAt: prior.updatedAt || prior.createdAt, message: "Draft saved to the cloud. Find it on any device in Saved drafts." };
  }
  if (file ? body.revision !== file.sha : body.revision !== undefined) throw draftConflict();

  const updatedAt = draft.createdAt;
  const note = { ...draft, createdAt: prior?.createdAt || updatedAt, updatedAt };
  const saved = await github(token, path, {
    method: "PUT",
    body: JSON.stringify({
      message: `Save draft: ${draft.kind}`,
      content: Buffer.from(JSON.stringify(note, null, 2)).toString("base64"),
      branch: "main",
      ...(file ? { sha: file.sha } : {}),
    }),
  }).catch(err => {
    if (err.githubStatus === 409 || err.githubStatus === 422) throw draftConflict();
    throw err;
  });
  return { id: draft.id, revision: saved.content.sha, updatedAt, message: "Draft saved to the cloud. Find it on any device in Saved drafts." };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Farhan-Studio", "api-v4");
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
    const maxBody = body.action === "upload-image" ? 2900000 : body.action === "image-preview" ? 810000 : 60000;
    if (JSON.stringify(body).length > maxBody)
      throw fail(413, "This request is too large.");
    if (req.method === "POST" && body.action === "logout") {
      res.setHeader(
        "Set-Cookie",
        `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
      );
      return reply(200, { ok: true });
    }
    if (req.method === "POST" && body.action === "login") {
      const { password, token: loginToken } = configuration();
      const bucket = loginBucket(req);
      if (typeof body.password !== "string" || body.password.length > 256 ||
          !timingSafeEqual(digest(body.password), digest(password)))
        throw fail(401, "Incorrect password. Please try again.");
      const user = await github(loginToken, "/user");
      if (user.login.toLowerCase() !== OWNER)
        throw fail(
          403,
          "This token belongs to a different GitHub account. Use the account that owns this website.",
        );
      // Authorize the exact owner against the private data the app actually uses.
      // Repository metadata's permissions.push is not a token capability check.
      const content = await read(loginToken, "src/data/blog-posts.json");
      if (!Array.isArray(content))
        throw fail(
          502,
          "The website blog data did not have the expected format.",
        );
      res.setHeader(
        "Set-Cookie",
        `${COOKIE}=${seal()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL}`,
      );
      bucket.count = 0;
      return reply(200, { ok: true });
    }
    const cookies = Object.fromEntries(
      (req.headers.cookie || "").split(";").map((c) => c.trim().split("=")),
    );
    const token = unseal(cookies[COOKIE]);
    if (req.method === "GET") {
      const warnings = [];
      const [blogs, stories, chapters, drafts, runs, results, liveIds] =
        await Promise.all([
          read(token, "src/data/blog-posts.json"),
          read(token, "src/data/stories.json", []),
          read(token, "src/data/story-chapters.json"),
          read(token, "content/studio-drafts", []),
          github(token, repo("/actions/runs?per_page=12")).catch((err) => {
            if (err.status === 401) throw err;
            warnings.push(err.message);
            return { workflow_runs: [] };
          }),
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
        imageAi: imageAiConfigured(),
        warnings,
        drafts: drafts
          .filter((d) => /^[a-f0-9-]{36}\.json$/.test(d.name))
          .map((d) => ({ name: d.name, sha: d.sha })),
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
    if (body.action === "image-preview") {
      return reply(200, await createImagePreview(body));
    }
    if (body.action === "upload-image") {
      const image = validateUpload(body);
      const previous = await fetch(`https://api.github.com${repo(`/contents/${image.path}?ref=main`)}`, {
        headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
      });
      if (!previous.ok && previous.status !== 404) throw fail(502, "Could not check photo upload status.");
      if (!previous.ok) await github(token, repo(`/contents/${image.path}`), {
        method: "PUT", body: JSON.stringify({
          message: "Upload Studio photo", branch: "main", content: image.buffer.toString("base64"),
        }),
      });
      return reply(200, { src: image.src });
    }
    if (body.action === "draft" || body.action === "failed") {
      if (!/^[a-f0-9-]{36}\.json$/.test(body.name || ""))
        throw fail(400, "Invalid draft.");
      if (body.action === "draft") {
        const file = await github(token, repo(`/contents/content/studio-drafts/${body.name}?ref=main`));
        return reply(200, { ...draftFromFile(file), revision: file.sha });
      }
      return reply(
        200,
        await read(token, `content/failed-requests/${body.name}`),
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
    if (body.action === "save") return reply(202, await saveDraft(token, body));
    if (body.action !== "publish")
      throw fail(400, "Unknown Studio action.");
    const draft = validateRequest(body);
    draft.draftRevision = /^[a-f0-9]{40}$/.test(body.revision || "") ? body.revision : null;
    const path = `content/requests/${draft.id}.json`;
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
        message: `Publish from Studio: ${draft.kind}`,
        content: Buffer.from(JSON.stringify(draft, null, 2)).toString("base64"),
        branch: "main",
        ...(prior ? { sha: prior.sha } : {}),
      }),
    });
    return reply(202, {
      id: draft.id,
      message: "Queued for AI editing and translation. Activity will show publishing progress.",
    });
  } catch (err) {
    if (err.status === 429) res.setHeader("Retry-After", "600");
    if (!err.status) console.error("Studio request failed:", err.name);
    return reply(err.status || 500, {
      error: err.status
        ? err.message
        : "Studio could not complete the request. Please try again.",
    });
  }
}
