import { createHash } from 'node:crypto';
const fail = (status, message) => Object.assign(new Error(message), {status});
const SRC = /^\/media\/studio\/[a-f0-9]{32}\.webp$/;
export function validateImages(value) {
  if (value === undefined) return undefined; // Old clients preserve existing photos.
  if (!Array.isArray(value) || value.length > 6) throw fail(400, 'Add up to six photos per post.');
  return value.map((image) => {
    if (!image || !SRC.test(image.src || '') || typeof image.alt !== 'string' || !image.alt.trim() || image.alt.length > 240 ||
      (image.caption !== undefined && (typeof image.caption !== 'string' || image.caption.length > 400)) ||
      !Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 || image.width > 1600 || image.height > 1600)
      throw fail(400, 'Choose an uploaded Studio photo and add a short description.');
    return {src: image.src, alt: image.alt.trim(), caption: (image.caption || '').trim(), width: image.width, height: image.height};
  });
}
export function validateUpload(body) {
  if (typeof body.data !== 'string' || body.data.length > 2800000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.data))
    throw fail(400, 'Choose a photo smaller than 2 MB after optimization.');
  const buffer = Buffer.from(body.data, 'base64');
  if (buffer.length < 30 || buffer.length > 2000000 || buffer.toString('base64') !== body.data ||
    buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP' ||
    buffer.readUInt32LE(4) !== buffer.length - 8 || !['VP8 ', 'VP8L', 'VP8X'].includes(buffer.toString('ascii', 12, 16)))
    throw fail(400, 'This photo could not be verified. Try another JPG, PNG or WebP image.');
  const name = createHash('sha256').update(buffer).digest('hex').slice(0, 32);
  return {buffer, src: `/media/studio/${name}.webp`, path: `public/media/studio/${name}.webp`};
}
