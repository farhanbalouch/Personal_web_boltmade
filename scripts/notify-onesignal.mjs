// scripts/notify-onesignal.mjs
//
// Sends a push notification AND an email broadcast via OneSignal, to
// everyone who has opted in on the site (via NotifyPopup / SubscribeFooter).
//
// Usage: node scripts/notify-onesignal.mjs "<title>" "<message>" "<url>"
//
// Requires env vars:
//   ONESIGNAL_APP_ID        (not secret, but read from env for consistency)
//   ONESIGNAL_REST_API_KEY  (SECRET — set as a GitHub Actions repo secret)

const ONESIGNAL_API = 'https://onesignal.com/api/v1/notifications';

async function sendOneSignal(body) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    console.warn('OneSignal credentials missing — skipping notification.');
    return null;
  }

  const res = await fetch(ONESIGNAL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({ app_id: appId, ...body }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Don't throw — a failed notification should never fail the whole
    // publish workflow. Just log it so it shows up in the Action's logs.
    console.error('OneSignal error:', res.status, JSON.stringify(data));
    return null;
  }

  console.log('OneSignal accepted:', JSON.stringify(data));
  return data;
}

async function sendPush(title, message, url) {
  return sendOneSignal({
    included_segments: ['Subscribed Users'],
    headings: { en: title },
    contents: { en: messa
