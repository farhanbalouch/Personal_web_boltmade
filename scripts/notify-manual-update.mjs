import { notify } from "./notify-onesignal.mjs";
const sha = process.env.GITHUB_SHA;
if (!sha) throw new Error("A source commit is required.");
let live = false;
for (let attempt = 0; attempt < 40; attempt++) {
  try {
    const r = await fetch(
      `https://farhanbalouch.com/version.json?t=${Date.now()}`,
      { signal: AbortSignal.timeout(15000), cache: "no-store" },
    );
    if ((await r.json()).sha === sha) {
      live = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 15000));
}
if (!live)
  throw new Error(
    "The exact website update is not live yet; notification was not sent.",
  );
await notify({
  id: `manual-${sha}`,
  title: "New from Farhan Balouch",
  message: "Fresh stories or projects are live. Take a look at what’s new.",
  url: "https://farhanbalouch.com" + (process.env.UPDATE_PATH || "/stories"),
});
