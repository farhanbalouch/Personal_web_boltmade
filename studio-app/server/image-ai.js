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
    ? `Edit the uploaded reference photograph. Identity preservation is the highest priority: preserve the real person's identity and exact face, facial features, expression, skin tone, hair, age, body shape, proportions, pose, and clothing. Do not replace, beautify, reshape, duplicate, or redraw the person. Change only the requested background, surroundings, composition, or lighting. Keep the result natural and photorealistic. If any requested edit risks changing the person, leave the person untouched. Apply these instructions: ${instructions}`
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
  // All routes stay on Workers AI's free-plan-eligible models. A shared account
  // allowance is not multiplied by model switching; quota/auth/policy errors stop.
  const candidates = edit
    ? ['@cf/black-forest-labs/flux-2-klein-4b', '@cf/black-forest-labs/flux-2-dev']
    : ['@cf/black-forest-labs/flux-1-schnell', '@cf/black-forest-labs/flux-2-klein-4b'];
  const deadline = Date.now() + 44000;
  for (const [index, candidate] of candidates.entries()) {
    if (Date.now() >= deadline) break;
    const schnell = candidate.endsWith('flux-1-schnell');
    let response;
    try {
      response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${candidate}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, ...(schnell ? { 'Content-Type': 'application/json' } : {}) },
        body: schnell ? JSON.stringify({ prompt: prompt.slice(0, 2048), steps: 4 }) : form,
        redirect: 'error', signal: AbortSignal.timeout(Math.min(20000, deadline - Date.now())),
      });
    } catch { continue; }
    const result = await response.json().catch(() => null);
    const errors = result?.errors || [];
    const detail = JSON.stringify(errors);
    if (errors.some?.(error => error.code === 3036) || /daily|quota|allocation|neurons.*limit/i.test(detail))
      throw fail(429, 'The shared Workers AI free allowance is used up. Model switching cannot reset it. Try after the daily reset, upload a photo or copy the prompt.');
    if (response.status === 401 || response.status === 403)
      throw fail(503, 'Workers AI denied access. Check the Studio account ID and token permissions in Vercel.');
    if (response.status === 402) throw fail(429, 'This request needs paid access. Studio will not switch to a paid provider. Use the free allowance or upload artwork.');
    if (/safety|moderation|policy|nsfw/i.test(detail)) throw fail(422, 'The image service could not accept this request. Revise the instruction.');
    const data = result?.result?.image;
    const mime = imageType(decode(data, 3600000));
    if (response.ok && result?.success === true && mime) return { data, mime, model: candidate.split('/').pop(), fallback: index > 0 };
  }
  throw fail(502, 'The free-eligible image models are busy or unavailable. Your current artwork is kept. Try later, upload a photo or copy the thumbnail prompt.');
}
