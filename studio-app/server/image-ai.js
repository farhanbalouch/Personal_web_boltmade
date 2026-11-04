const model = '@cf/black-forest-labs/flux-2-klein-4b';
const fail = (status, message) => Object.assign(new Error(message), { status });

export function imageAiConfigured() {
  return /^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '') &&
    Boolean(process.env.CLOUDFLARE_WORKERS_AI_TOKEN?.trim());
}

function decode(data, limit) {
  if (typeof data !== 'string' || !data || data.length > limit || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
  const buffer = Buffer.from(data, 'base64');
  return buffer.toString('base64') === data ? buffer : null;
}

function imageType(buffer) {
  if (!buffer || buffer.length < 16) return null;
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export async function createImagePreview(body) {
  const edit = body.mode === 'edit';
  if (!edit && body.mode !== 'generate') throw fail(400, 'Choose an image action.');
  const topic = typeof body.topic === 'string' ? body.topic.trim().slice(0, 850) : '';
  const instructions = typeof body.instructions === 'string' ? body.instructions.trim().slice(0, 900) : '';
  if ((edit && !instructions) || (!edit && !topic && !instructions))
    throw fail(400, 'Add a topic or describe what you want the image to show.');
  const reference = edit ? decode(body.reference, 800000) : null;
  if (edit && imageType(reference) !== 'image/jpeg') throw fail(400, 'Choose a valid source photo for editing.');
  if (!imageAiConfigured()) throw fail(503, 'AI images need a Workers AI token and account ID in the Studio Vercel project.');

  const prompt = edit
    ? `Edit the uploaded reference image. Keep its subject, facial identity and composition unless explicitly asked to change them. Apply only these changes: ${instructions}`
    : `Create a landscape editorial illustration for a personal website, with a clear visual idea. No watermark or text unless specifically requested. Topic: ${topic}\nArt direction: ${instructions || 'Use the topic to choose the scene and style.'}`;
  const form = new FormData();
  form.set('prompt', prompt);
  form.set('width', edit ? '768' : '1024');
  form.set('height', edit ? '768' : '640');
  if (reference) {
    const { width, height } = body;
    if (![width, height].every(n => Number.isInteger(n) && n >= 1 && n < 512))
      throw fail(400, 'The source preview dimensions are invalid.');
    // Keep the reference aspect ratio, rounding to multiples of 16 for the model.
    form.set('width', String(Math.max(256, Math.round(width / Math.max(width, height) * 768 / 16) * 16)));
    form.set('height', String(Math.max(256, Math.round(height / Math.max(width, height) * 768 / 16) * 16)));
    form.set('input_image_0', new Blob([reference], { type: 'image/jpeg' }), 'reference.jpg');
  }
  const account = process.env.CLOUDFLARE_ACCOUNT_ID.trim();
  const token = process.env.CLOUDFLARE_WORKERS_AI_TOKEN.trim();
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    redirect: 'error',
    signal: AbortSignal.timeout(45000),
  }).catch(() => { throw fail(502, 'The image service could not respond. Try again shortly.'); });
  const result = await response.json().catch(() => null);
  if (response.status === 429 || result?.errors?.some?.(error => error.code === 3036))
    throw fail(429, 'Workers AI is at its request or free usage limit. Try later or use an original photo.');
  if (response.status === 401 || response.status === 403)
    throw fail(503, 'Workers AI denied access. Check the Studio account ID and token permissions in Vercel.');
  const data = result?.result?.image;
  const mime = imageType(decode(data, 3600000));
  if (!response.ok || result?.success !== true || !mime)
    throw fail(502, 'The image service did not return a usable preview. Try another instruction.');
  return { data, mime };
}
