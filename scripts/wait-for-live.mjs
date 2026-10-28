import { readFile } from "node:fs/promises";
export async function waitForLive(ids, timeout = 10 * 60 * 1000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(
        `https://farhanbalouch.com/publish-receipts.json?t=${Date.now()}`,
        { cache: "no-store", signal: AbortSignal.timeout(15000) },
      );
      const live = await response.json();
      if (Array.isArray(live) && ids.every((id) => live.includes(id))) return;
    } catch {
      /* Deployment is still building. */
    }
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  throw new Error(
    "The production update is not live yet. Notifications were not sent. Check Vercel, then retry this notification step.",
  );
}
if (process.argv[1]?.endsWith("wait-for-live.mjs")) {
  const { notify } = await import("./notify-onesignal.mjs");
  const notes = JSON.parse(
    await readFile(
      process.argv[2] || "content/studio-notifications.json",
      "utf8",
    ),
  );
  if (notes.length) {
    await waitForLive(notes.map((n) => n.id));
    for (const note of notes) await notify(note);
  }
}
