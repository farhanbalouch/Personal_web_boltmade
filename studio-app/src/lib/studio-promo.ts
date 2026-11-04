export type SocialPromo = { headline: string; subhead: string; caption: string; scene: string };
export type PromoFormat = 'feed' | 'vertical';

export type PromoSettings = SocialPromo & {
  format: PromoFormat;
  label: string;
  callToAction: string;
  accent: string;
  showLogo: boolean;
  focalX: number;
  focalY: number;
};

export const promoFormats = {
  feed: { label: 'Instagram feed', ratio: '4:5', width: 1080, height: 1350 },
  vertical: { label: 'TikTok / Stories', ratio: '9:16', width: 1080, height: 1920 },
};

const navy = '#0a0e17';
const teal = '#3fb5a4';
const cream = '#fff4df';

export function imagePrompt(settings: PromoSettings, finished: boolean) {
  const { ratio, width, height } = promoFormats[settings.format];
  const art = settings.scene.trim() || 'Choose one visual subject that reflects the blog headline.';
  const format = `Portrait ${ratio} canvas (${width} × ${height}).`;
  const direction = `${art}\nUse realistic textures, natural light and one clear focal subject. ${format}`;
  if (!finished) {
    return `${direction}\nArtwork only. Keep the frame free of letters, logos and watermarks. Place the subject in the upper half so the lower half has room for the Studio headline.`;
  }

  return [
    'Create a finished, photorealistic blog announcement thumbnail for Farhan Balouch.',
    direction,
    `Use the website palette: deep navy ${navy}, warm cream ${cream}, accent ${settings.accent}, and subtle teal ${teal}. Fade the lower half to navy behind the title. Keep generous side and bottom margins.`,
    settings.showLogo ? 'Place the attached official Farhan Balouch logo at the top on a small navy plate. Preserve its proportions and design. Leave the logo area empty if a reference is unavailable.' : 'Keep the top uncluttered.',
    'Use the following text exactly, with a bold editorial serif headline and clear sans-serif supporting text:',
    ...[settings.label, settings.headline, settings.subhead, settings.callToAction, 'farhanbalouch.com'].filter(Boolean).map(text => JSON.stringify(text)),
    'Keep all typography within the safe margins and the artwork visible above the headline.',
  ].join('\n');
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.trim().split(/\s+/u)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, options: {
  color: string; family: string; size: number; min: number; rows: number; weight: number;
}) {
  let size = options.size;
  let lines: string[];
  do {
    ctx.font = `${options.weight} ${size}px ${options.family}`;
    lines = wrap(ctx, text, width);
    if (lines.length <= options.rows && lines.every(line => ctx.measureText(line).width <= width)) break;
    if (size === options.min) break;
    size = Math.max(options.min, size - 3);
  } while (true);
  if (lines.length > options.rows) {
    lines = lines.slice(0, options.rows);
    lines[lines.length - 1] += '…';
  }
  ctx.fillStyle = options.color;
  for (const [i, line] of lines.entries()) ctx.fillText(line, x, y + i * size * 1.15, width);
  return lines.length ? y + (lines.length - 1) * size * 1.15 + size : y;
}

export function renderPromo(canvas: HTMLCanvasElement, settings: PromoSettings, artwork: HTMLImageElement | null, logo: HTMLImageElement | null) {
  const { width, height } = promoFormats[settings.format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const tall = settings.format === 'vertical';
  const side = 82;
  const textWidth = width - side * 2;
  const top = tall ? 160 : 74;
  const artHeight = height * (tall ? .65 : .60);
  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, width, height);

  if (artwork) {
    const scale = Math.max(width / artwork.naturalWidth, artHeight / artwork.naturalHeight);
    const sw = width / scale;
    const sh = artHeight / scale;
    ctx.drawImage(artwork, (artwork.naturalWidth - sw) * settings.focalX / 100,
      (artwork.naturalHeight - sh) * settings.focalY / 100, sw, sh, 0, 0, width, artHeight);
  } else {
    const glow = ctx.createRadialGradient(770, artHeight * .42, 0, 770, artHeight * .42, 740);
    glow.addColorStop(0, '#1c4d55');
    glow.addColorStop(.58, '#132434');
    glow.addColorStop(1, navy);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, artHeight);
    ctx.strokeStyle = settings.accent;
    ctx.lineWidth = 3;
    for (const [index, radius] of [135, 210, 285].entries()) {
      ctx.globalAlpha = .36 - index * .08;
      ctx.beginPath();
      ctx.arc(765, artHeight * .43, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = settings.accent;
    ctx.beginPath();
    ctx.arc(765, artHeight * .43, 19, 0, Math.PI * 2);
    ctx.fill();
  }

  const shade = ctx.createLinearGradient(0, 0, 0, artHeight);
  shade.addColorStop(0, '#0a0e1755');
  shade.addColorStop(.34, '#0a0e1700');
  shade.addColorStop(.84, '#0a0e17e8');
  shade.addColorStop(1, navy);
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, artHeight);
  ctx.strokeStyle = settings.accent;
  ctx.globalAlpha = .5;
  ctx.lineWidth = 2;
  ctx.strokeRect(42, tall ? 125 : 42, width - 84, height - (tall ? 335 : 84));
  ctx.globalAlpha = 1;

  if (settings.showLogo && logo) {
    ctx.fillStyle = '#0a0e17ec';
    ctx.beginPath();
    ctx.roundRect(side, top, 410, 107, 18);
    ctx.fill();
    // The shipped website logo includes a transparent border around its artwork.
    ctx.drawImage(logo, 22, 102, 630, 154, side + 28, top + 10, 354, 87);
  }

  const labelY = tall ? 925 : 665;
  ctx.fillStyle = settings.accent;
  ctx.fillRect(side, labelY, 64, 5);
  const sans = 'Inter, Arial, sans-serif';
  drawText(ctx, settings.label, side, labelY + 54, textWidth,
    { color: settings.accent, family: sans, size: 28, min: 23, rows: 1, weight: 700 });
  const afterTitle = drawText(ctx, settings.headline, side, labelY + (tall ? 173 : 145), textWidth,
    { color: cream, family: 'Georgia, serif', size: tall ? 96 : 83, min: 57, rows: 3, weight: 700 });
  drawText(ctx, settings.subhead, side, afterTitle + 15, textWidth,
    { color: '#d4deeb', family: sans, size: tall ? 37 : 32, min: 28, rows: 3, weight: 400 });

  const footerY = height - (tall ? 253 : 111);
  ctx.fillStyle = settings.accent;
  ctx.fillRect(side, footerY - 49, textWidth, 2);
  drawText(ctx, settings.callToAction, side, footerY, textWidth * .52,
    { color: settings.accent, family: sans, size: 25, min: 20, rows: 1, weight: 700 });
  ctx.fillStyle = cream;
  ctx.font = `600 25px ${sans}`;
  ctx.textAlign = 'right';
  ctx.fillText('farhanbalouch.com', width - side, footerY, textWidth * .45);
}
