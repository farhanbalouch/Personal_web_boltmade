import { createHash } from "node:crypto";
const SITE = "https://farhanbalouch.com";
function idempotencyKey(id) {
  const h = createHash("sha256").update(id).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
export async function notify({ title, message, url, id }) {
  if (new URL(url).origin !== SITE)
    throw new Error("Notifications must link to the official website.");
  const appId =
    process.env.ONESIGNAL_APP_ID || "724f058f-edba-4c5a-b0dc-17d9a442eda8";
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!apiKey)
    throw new Error(
      "Set ONESIGNAL_REST_API_KEY in GitHub Actions repository secrets to enable delivery.",
    );
  const r = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: "push",
      included_segments: ["Subscribed Users"],
      headings: { en: title.slice(0, 150) },
      contents: { en: message.slice(0, 300) },
      url,
      chrome_web_icon: `${SITE}/favicon.svg`,
      ...(id ? { idempotency_key: idempotencyKey(id) } : {}),
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await r.json();
  const errors = Array.isArray(data.errors) ? data.errors : [];
  if (r.ok && !data.id && errors.length === 1 && errors[0] === 'All included players are not subscribed') {
    console.log('Notification not sent: no active subscribed devices. Website publishing succeeded.');
    return { status: 'no-recipients', id: null, recipients: 0 };
  }
  if (!r.ok || data.errors)
    throw new Error(
      `OneSignal delivery failed (${r.status}): ${JSON.stringify(data.errors || "request rejected")}`,
    );
  if (!data.id) throw new Error('OneSignal did not return a notification ID. Delivery is unconfirmed.');
  console.log("OneSignal accepted push (device delivery not confirmed):", data.id);
  return data;
}
if (process.argv[1]?.endsWith("notify-onesignal.mjs")) {
  const [title, message, url] = process.argv.slice(2);
  if (!title || !message || !url) {
    console.error("Notification title, message and URL are required.");
    process.exitCode = 1;
  } else
    notify({ title, message, url, id: process.env.NOTIFICATION_ID }).catch(
      (err) => {
        console.error(err.message);
        process.exitCode = 1;
      },
    );
}
