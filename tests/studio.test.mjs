import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import handler, { seal, unseal, validateRequest } from "../api/studio.js";
import { buildItem } from "../scripts/publish-studio.mjs";
process.env.ADMIN_SESSION_SECRET = randomBytes(48).toString("hex");
const translations = Object.fromEntries(
  ["en", "hi", "ur"].map((l) => [
    l,
    {
      title: "A useful update",
      excerpt: "A short excerpt",
      body: [`${l} paragraph`],
      keywords: ["update"],
    },
  ]),
);
test("session encrypts token and rejects tampering", () => {
  const secret = "github_pat_private_test_value",
    cookie = seal(secret);
  assert.equal(cookie.includes(secret), false);
  assert.equal(unseal(cookie), secret);
  const data = Buffer.from(cookie, "base64url");
  data[30] ^= 255;
  assert.throws(
    () => unseal(data.toString("base64url")),
    (e) => e.status === 401,
  );
});
test("a rotated session key invalidates old cookies", () => {
  const old = process.env.ADMIN_SESSION_SECRET,
    cookie = seal("private");
  process.env.ADMIN_SESSION_SECRET = randomBytes(48).toString("hex");
  assert.throws(
    () => unseal(cookie),
    (e) => e.status === 401,
  );
  process.env.ADMIN_SESSION_SECRET = old;
});
test("publishing validates paths, kind, note size and chapter selection", () => {
  const base = {
    id: randomUUID(),
    kind: "blog",
    raw: "A plain language note to publish.",
    notify: true,
  };
  assert.equal(validateRequest(base).notify, true);
  for (const change of [
    { slug: "../private" },
    { kind: "shell" },
    { raw: "tiny" },
    { raw: "a".repeat(50001) },
    { id: "../../secret" },
    { kind: "chapter" },
  ])
    assert.throws(
      () => validateRequest({ ...base, ...change }),
      (e) => e.status === 400,
    );
});
async function request(req) {
  const response = {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.code = n;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await handler(req, response);
  return response;
}
test("anonymous and cross-origin callers cannot publish or see drafts", async () => {
  let r = await request({ method: "GET", headers: {} });
  assert.equal(r.code, 401);
  r = await request({
    method: "POST",
    headers: {
      host: "farhanbalouch.com",
      origin: "https://evil.example",
      "content-type": "application/json",
    },
    body: { action: "publish" },
  });
  assert.equal(r.code, 403);
  assert.equal(r.headers["Cache-Control"], "no-store");
});
test("a non-owner cannot create an authenticated session", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) =>
    new Response(
      JSON.stringify(
        url.endsWith("/user")
          ? { login: "someone-else" }
          : { permissions: { push: true } },
      ),
    );
  try {
    const r = await request({
      method: "POST",
      headers: {
        host: "farhanbalouch.com",
        origin: "https://farhanbalouch.com",
        "content-type": "application/json",
      },
      body: { action: "login", token: "github_pat_fake_test_value" },
    });
    assert.equal(r.code, 403);
    assert.equal(r.headers["Set-Cookie"], undefined);
  } finally {
    globalThis.fetch = original;
  }
});
test("editing keeps the public address and publication date", () => {
  const existing = {
    slug: "original-address",
    publishedAt: "2026-09-01",
    translations,
  };
  const edited = buildItem(
    { kind: "blog", slug: existing.slug },
    translations,
    [existing],
    "2026-10-28",
  );
  assert.equal(edited.slug, "original-address");
  assert.equal(edited.publishedAt, "2026-09-01");
  assert.equal(edited.updatedAt, "2026-10-28");
});
test("new stories avoid duplicate addresses and missing edits fail safely", () => {
  assert.equal(
    buildItem({ kind: "story" }, translations, [{ slug: "a-useful-update" }])
      .slug,
    "a-useful-update-2",
  );
  assert.throws(() =>
    buildItem({ kind: "story", slug: "gone" }, translations, []),
  );
});
test("biography edits preserve chapter position, subtitle and moral", () => {
  const chapter = {
    slug: "school",
    part: 3,
    period: "School",
    translations: Object.fromEntries(
      ["en", "hi", "ur"].map((l) => [
        l,
        {
          title: "Old",
          subtitle: "Keep subtitle",
          moral: "Keep moral",
          paragraphs: ["Old paragraph"],
        },
      ]),
    ),
  };
  const edited = buildItem({ kind: "chapter", slug: "school" }, translations, [
    chapter,
  ]);
  assert.equal(edited.part, 3);
  assert.equal(edited.translations.ur.moral, "Keep moral");
  assert.equal(edited.translations.hi.subtitle, "Keep subtitle");
  assert.deepEqual(edited.translations.en.paragraphs, ["en paragraph"]);
});

test("login removes clipboard whitespace before verifying and sealing a token", async () => {
  const original = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (url, options) => {
    seen.push(options.headers.Authorization);
    return new Response(
      JSON.stringify(
        url.endsWith("/user")
          ? { login: "muhammadfarhan138223-cmyk" }
          : { permissions: { push: true } },
      ),
    );
  };
  try {
    const r = await request({
      method: "POST",
      headers: {
        host: "farhanbalouch.com",
        origin: "https://farhanbalouch.com",
        "content-type": "application/json",
      },
      body: { action: "login", token: "  github_pat_test_valid_value\n  " },
    });
    assert.equal(r.code, 200);
    assert.ok(seen.every((h) => h === "Bearer github_pat_test_valid_value"));
    const cookie = r.headers["Set-Cookie"].split(";")[0].split("=")[1];
    assert.equal(unseal(cookie), "github_pat_test_valid_value");
  } finally {
    globalThis.fetch = original;
  }
});
test("a rejected GitHub token is distinguished from missing repository access", async () => {
  const original = globalThis.fetch;
  try {
    for (const status of [401, 403, 404]) {
      globalThis.fetch = async () => new Response("{}", { status });
      const r = await request({
        method: "POST",
        headers: {
          host: "farhanbalouch.com",
          origin: "https://farhanbalouch.com",
          "content-type": "application/json",
        },
        body: { action: "login", token: "github_pat_invalid_test_value" },
      });
      assert.equal(r.code, status === 401 ? 401 : 403);
      assert.equal(r.headers["Set-Cookie"], undefined);
      assert.ok(
        r.body.error.includes(status === 401 ? "rejected" : "access") ||
          r.body.error.includes("denied"),
      );
    }
  } finally {
    globalThis.fetch = original;
  }
});
