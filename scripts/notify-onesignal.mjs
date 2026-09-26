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
    contents: { en: message },
    url,
  });
}

async function sendEmail(title, message, url) {
  return sendOneSignal({
    included_segments: ['Subscribed Users'],
    channel_for_external_user_ids: 'email',
    email_subject: title,
    email_body: `<p>${message}</p><p><a href="${url}">${url}</a></p>`,
  });
}

async function main() {
  const [title, message, url] = process.argv.slice(2);

  if (!title || !message || !url) {
    console.log('Usage: node scripts/notify-onesignal.mjs "<title>" "<message>" "<url>"');
    console.log('Nothing to send — missing arguments.');
    return;
  }

  console.log(`Notifying subscribers: "${title}" -> ${url}`);

  await sendPush(title, message, url);
  await sendEmail(title, message, url);
}

main().catch((err) => {
  console.error('notify-onesignal.mjs failed:', err);
});
