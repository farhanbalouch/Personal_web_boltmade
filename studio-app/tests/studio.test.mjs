import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import handler, { seal, unseal, validateRequest } from "../api/studio.js";
process.env.ADMIN_SESSION_SECRET = randomBytes(48).toString("hex");
process.env.ADMIN_PASSWORD = "test-only-strong-password";
process.env.STUDIO_GITHUB_TOKEN = "github_pat_private_test_value";
test("session encrypts token and rejects tampering", () => {
  const secret = process.env.STUDIO_GITHUB_TOKEN,
    cookie = seal();
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
      "x-forwarded-for": randomUUID(),
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
          : { content: Buffer.from("[]").toString("base64") },
      ),
    );
  try {
    const r = await request({
      method: "POST",
      headers: {
        host: "farhanbalouch.com",
      "x-forwarded-for": randomUUID(),
        origin: "https://farhanbalouch.com",
        "content-type": "application/json",
      },
      body: { action: "login", password: process.env.ADMIN_PASSWORD },
    });
    assert.equal(r.code, 403);
    assert.equal(r.headers["Set-Cookie"], undefined);
  } finally {
    globalThis.fetch = original;
  }
});
test("password login uses only the server token and creates a credential-free cookie", async () => {
  const original = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (url, options) => {
    seen.push(options.headers.Authorization);
    return new Response(
      JSON.stringify(
        url.endsWith("/user")
          ? { login: "muhammadfarhan138223-cmyk" }
          : { content: Buffer.from("[]").toString("base64") },
      ),
    );
  };
  try {
    const r = await request({
      method: "POST",
      headers: {
        host: "farhanbalouch.com",
      "x-forwarded-for": randomUUID(),
        origin: "https://farhanbalouch.com",
        "content-type": "application/json",
      },
      body: { action: "login", password: process.env.ADMIN_PASSWORD, token: "github_pat_attacker_supplied_token" },
    });
    assert.equal(r.code, 200);
    assert.ok(seen.every((h) => h === "Bearer " + process.env.STUDIO_GITHUB_TOKEN));
    const cookie = r.headers["Set-Cookie"].split(";")[0].split("=")[1];
    assert.equal(unseal(cookie), process.env.STUDIO_GITHUB_TOKEN);
    assert.match(r.headers["Set-Cookie"], /HttpOnly; Secure; SameSite=Strict/);
    assert.match(r.headers["Set-Cookie"], /Max-Age=28800/);
    assert.equal(JSON.stringify(r.body).includes(process.env.STUDIO_GITHUB_TOKEN), false);
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
      "x-forwarded-for": randomUUID(),
          origin: "https://farhanbalouch.com",
          "content-type": "application/json",
        },
        body: { action: "login", password: process.env.ADMIN_PASSWORD },
      });
      assert.equal(r.code, status === 401 ? 401 : 403);
      assert.equal(r.headers["Set-Cookie"], undefined);
      assert.ok(r.body.error.includes(status === 401 ? "rejected" : "HTTP"));
    }
  } finally {
    globalThis.fetch = original;
  }
});

test('missing Actions permission does not lock an authenticated owner out of the content dashboard',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async url=>{
  if(url.includes('/actions/runs'))return new Response('{}',{status:403});
  if(url.includes('publish-receipts.json'))return new Response('[]');
  if(url.includes('studio-drafts')||url.includes('studio-results.json'))return new Response('{}',{status:404});
  return new Response(JSON.stringify({content:Buffer.from('[]').toString('base64')}));
 };
 try{
  const r=await request({method:'GET',headers:{cookie:'__Host-farhan-studio='+seal('github_pat_mock_owner_token')}});
  assert.equal(r.code,200);assert.deepEqual(r.body.blogs,[]);assert.deepEqual(r.body.runs,[]);assert.ok(r.body.warnings[0].includes('Actions'));
 }finally{globalThis.fetch=original;}
});

const loginHeaders = {host: "studio.example.com", origin: "https://studio.example.com", "content-type": "application/json"};
test("wrong password and legacy PAT login never reach GitHub", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Unauthenticated GitHub call"); };
  try {
    for (const body of [{password: "wrong"}, {token: process.env.STUDIO_GITHUB_TOKEN}, {password: {length: 20}}]) {
      const r = await request({method: "POST", headers: {...loginHeaders, "x-forwarded-for": randomUUID()}, body: {action: "login", ...body}});
      assert.equal(r.code, 401);
      assert.equal(r.headers["Set-Cookie"], undefined);
    }
  } finally { globalThis.fetch = original; }
});
test("password and GitHub token rotation revoke old sessions", () => {
  for (const name of ["ADMIN_PASSWORD", "STUDIO_GITHUB_TOKEN"]) {
    const saved = process.env[name], cookie = seal();
    process.env[name] = saved + "rotated";
    assert.throws(() => unseal(cookie), e => e.status === 401);
    process.env[name] = saved;
  }
});
test("expired sessions cannot access content", () => {
  const original = Date.now, cookie = seal();
  Date.now = () => original() + 9 * 60 * 60 * 1000;
  try { assert.throws(() => unseal(cookie), e => e.status === 401); }
  finally { Date.now = original; }
});
test("missing or weak configuration fails closed", async () => {
  const saved = process.env.ADMIN_PASSWORD;
  for (const value of ["", "short"]) {
    process.env.ADMIN_PASSWORD = value;
    const r = await request({method: "POST", headers: loginHeaders, body: {action: "login", password: value}});
    assert.equal(r.code, 503);
    assert.equal(r.headers["Set-Cookie"], undefined);
  }
  process.env.ADMIN_PASSWORD = saved;
});
test("repeated wrong passwords are throttled before GitHub calls", async () => {
  const headers = {...loginHeaders, "x-forwarded-for": "192.0.2.124"};
  for (let i = 0; i < 5; i++) {
    const r = await request({method: "POST", headers, body: {action: "login", password: "wrong"}});
    assert.equal(r.code, 401);
  }
  const r = await request({method: "POST", headers, body: {action: "login", password: process.env.ADMIN_PASSWORD}});
  assert.equal(r.code, 429);
  assert.equal(r.headers["Retry-After"], "600");
});
test("logout deletes the server cookie", async () => {
  const r = await request({method: "POST", headers: loginHeaders, body: {action: "logout"}});
  assert.equal(r.code, 200);
  assert.match(r.headers["Set-Cookie"], /Max-Age=0/);
});

test("only an authenticated owner can upload a photo", async () => {
 const r = await request({method: "POST", headers: loginHeaders, body: {action: "upload-image", data: "not-an-image"}});
 assert.equal(r.code,401);
});
test("an authenticated upload writes only a validated image into the original repository", async () => {
 const original = globalThis.fetch, calls=[];
 globalThis.fetch=async (url, options={})=>{
  calls.push({url,options});
  return new Response("{}",{status: options.method === "PUT" ? 201 : 404});
 };
 try {
  const r=await request({method:"POST",headers:{...loginHeaders,cookie:"__Host-farhan-studio="+seal()},body:{action:"upload-image",data:"UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoCAAIAAUAmJaACdLoB+AADsAD+97Qf/5rt812+a7f812/+Smv8bcdgAAA="}});
  assert.equal(r.code,200);assert.match(r.body.src,/^\/media\/studio\/[a-f0-9]{32}\.webp$/);
  const put=calls.find(c=>c.options.method==="PUT");assert.ok(put);
  assert.ok(put.url.startsWith("https://api.github.com/repos/muhammadfarhan138223-cmyk/Personal_web_boltmade/contents/public/media/studio/"));
  assert.equal(JSON.parse(put.options.body).branch,"main");
  assert.equal(JSON.stringify(r.body).includes(process.env.STUDIO_GITHUB_TOKEN),false);
  const bad=await request({method:"POST",headers:{...loginHeaders,cookie:"__Host-farhan-studio="+seal()},body:{action:"upload-image",data:Buffer.from("<svg onload=alert(1) />").toString("base64")}});
  assert.equal(bad.code,400);assert.equal(calls.length,2);
 }finally{globalThis.fetch=original;}
});

test("AI previews require the same owner session and origin as photo uploads", async () => {
  const body = { action: "image-preview", mode: "generate", topic: "A guide to AI tokens" };
  const r = await request({ method: "POST", headers: loginHeaders, body });
  assert.equal(r.code, 401);
  const crossOrigin = await request({
    method: "POST",
    headers: { ...loginHeaders, origin: "https://evil.example", cookie: "__Host-farhan-studio=" + seal() },
    body,
  });
  assert.equal(crossOrigin.code, 403);
});

test("generation and reference edits produce previews without uploading or publishing", async (t) => {
  const account = "a".repeat(32);
  const credential = "test-workers-ai-token";
  const image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jQioAAAAASUVORK5CYII=";
  const reference = Buffer.from([255, 216, 255, ...Array(16).fill(0)]).toString("base64");
  const previous = [process.env.CLOUDFLARE_ACCOUNT_ID, process.env.CLOUDFLARE_WORKERS_AI_TOKEN];
  const names = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_WORKERS_AI_TOKEN"];
  t.after(() => names.forEach((name, i) => {
    if (previous[i] === undefined) delete process.env[name];
    else process.env[name] = previous[i];
  }));
  delete process.env.CLOUDFLARE_WORKERS_AI_TOKEN;
  const headers = { ...loginHeaders, cookie: "__Host-farhan-studio=" + seal() };
  const preview = (payload) => request({ method: "POST", headers, body: { action: "image-preview", ...payload } });
  const configMissing = await preview({ mode: "generate", topic: "AI tokens" });
  assert.equal(configMissing.code, 503);
  assert.match(configMissing.body.error, /Workers AI token/);

  process.env.CLOUDFLARE_ACCOUNT_ID = account;
  process.env.CLOUDFLARE_WORKERS_AI_TOKEN = credential;
  let providerResponse = { success: true, result: { image } };
  const fetch = t.mock.method(globalThis, "fetch", async (url, request) => {
    assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`);
    assert.equal(request.headers.Authorization, "Bearer " + credential);
    assert.equal(request.method, "POST");
    assert.ok(request.body instanceof FormData);
    return Response.json(providerResponse, { status: providerResponse.success ? 200 : 429 });
  });
  const generated = await preview({ mode: "generate", topic: "AI tokens", instructions: "Use blue blocks" });
  assert.equal(generated.code, 200);
  assert.equal(generated.headers["Cache-Control"], "no-store");
  assert.deepEqual(generated.body, { data: image, mime: "image/png" });
  const generateForm = fetch.mock.calls[0].arguments[1].body;
  assert.match(generateForm.get("prompt"), /AI tokens[\s\S]*blue blocks/);
  assert.equal(generateForm.has("input_image_0"), false);

  const edited = await preview({ mode: "edit", topic: "Private draft topic", instructions: "Brighten the source photo", reference, width: 496, height: 320 });
  assert.equal(edited.code, 200);
  const editForm = fetch.mock.calls[1].arguments[1].body;
  assert.match(editForm.get("prompt"), /Brighten the source photo/);
  assert.doesNotMatch(editForm.get("prompt"), /Private draft topic/);
  assert.equal(Buffer.from(await editForm.get("input_image_0").arrayBuffer()).toString("base64"), reference);
  const invalid = await preview({ mode: "edit", instructions: "Brighten", reference: image });
  assert.equal(invalid.code, 400);
  assert.equal(fetch.mock.callCount(), 2);

  providerResponse = { success: false, errors: [{ code: 3036 }] };
  const limited = await preview({ mode: "generate", topic: "AI tokens" });
  assert.equal(limited.code, 429);
  assert.match(limited.body.error, /free usage limit/);
});
