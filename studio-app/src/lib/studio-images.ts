export async function optimizePhoto(file: File, maxSide = 1600, mime = 'image/webp') {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP photo.');
  if (file.size > 12000000) throw new Error('Choose a photo smaller than 12 MB.');
  const image = await createImageBitmap(file);
  try {
    if (image.width * image.height > 50000000) throw new Error('This image is too large. Choose a smaller copy.');
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale)), height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Photo processing is unavailable in this browser.');
    ctx.drawImage(image, 0, 0, width, height);
    let blob: Blob | null = null;
    for (const quality of [.84, .72, .58]) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
      if (blob && blob.size <= 2000000) break;
    }
    if (!blob || blob.type !== mime || blob.size > 2000000) throw new Error('This photo is too large after optimization. Choose a smaller copy.');
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('Could not read this photo.'));
      reader.readAsDataURL(blob!);
    });
    return { data, width, height, preview: `data:${mime};base64,${data}` };
  } finally { image.close(); }
}
