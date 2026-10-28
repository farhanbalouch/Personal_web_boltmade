// Read-only provider checks. Never print credentials or provider response bodies.
const expectedApp = "724f058f-edba-4c5a-b0dc-17d9a442eda8";
let failed = false;
async function check(name, task) {
  try {
    await task();
    console.log(`${name}: ready`);
  } catch (e) {
    failed = true;
    console.error(`${name}: ${e.message}`);
  }
}
await check("AI editing", async () => {
  if (!process.env.GEMINI_API_KEY)
    throw new Error("GEMINI_API_KEY repository secret is missing.");
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash",
    {
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!r.ok)
    throw new Error(
      `Provider rejected the read-only check (HTTP ${r.status}). Check API key and model access.`,
    );
});
await check("Browser notifications", async () => {
  if (!process.env.ONESIGNAL_REST_API_KEY)
    throw new Error("ONESIGNAL_REST_API_KEY repository secret is missing.");
  const appId = process.env.ONESIGNAL_APP_ID || expectedApp;
  if (appId !== expectedApp)
    throw new Error("The repository app ID differs from the website app ID.");
  const r = await fetch(
    `https://api.onesignal.com/apps/${appId}/segments?limit=1`,
    {
      headers: { Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}` },
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!r.ok)
    throw new Error(
      `Provider rejected the read-only check (HTTP ${r.status}). Check OneSignal app API key.`,
    );
});
if (failed) process.exitCode = 1;
