import type { BlogPost } from '../data/blog';
import { blogPromoScenes } from '../data/blog-promo-scenes';

export type SocialPromo = { headline: string; subhead: string; caption: string; scene: string };
export type PromoFormat = 'feed' | 'vertical' | 'square';
export type PromoLayout = 'cinematic' | 'editorial' | 'split' | 'minimal';
export const promoLayouts = {cinematic:'Cinematic cover',editorial:'Editorial magazine',split:'Bold split',minimal:'Clean statement'};
export function promoVariation(id: string) { const n=[...id].reduce((sum,c)=>sum+c.charCodeAt(0),0); return { layout: Object.keys(promoLayouts)[n%4] as PromoLayout, accent:['#e8b14b','#67d7bd','#af9bff','#f09281'][n%4] }; }

export type PromoSettings = SocialPromo & {
  format: PromoFormat;
  layout?: PromoLayout;
  font?: 'serif' | 'sans';
  label: string;
  callToAction: string;
  accent: string;
  showLogo: boolean;
  focalX: number;
  focalY: number;
};

export const promoFormats = {
  square: {label:'Square post',ratio:'1:1',width:1080,height:1080},
  feed: { label: 'Instagram feed', ratio: '4:5', width: 1080, height: 1350 },
  vertical: { label: 'TikTok / Stories', ratio: '9:16', width: 1080, height: 1920 },
};

const navy = '#0a0e17';
const teal = '#3fb5a4';
const cream = '#fff4df';

export const blogPromoUrl = (slug: string) => `https://farhanbalouch.com/blog/${slug}`;

export function promoFromBlog(blog: BlogPost): SocialPromo {
  const { title, excerpt } = blog.translations.en;
  const brief = blogPromoScenes[blog.slug] || blog.aliases?.map(alias => blogPromoScenes[alias]).find(Boolean);
  return {
    headline: blog.translations.en.shortTitle || brief?.headline || title.slice(0, 90),
    subhead: excerpt.slice(0, 150),
    caption: `${title}\n\n${excerpt}`.slice(0, 600),
    scene: brief?.scene || `Create a photorealistic editorial scene for “${title}”. Choose a focal subject grounded in this summary: ${excerpt.slice(0, 500)}`,
  };
}

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
    `Design: ${settings.layout || "cinematic"}; headline font: ${settings.font || "sans"}.`,
    `Use the website palette: deep navy ${navy}, warm cream ${cream}, accent ${settings.accent}, and subtle teal ${teal}. Fade the lower half to navy behind the title. Keep generous side and bottom margins.`,
    settings.showLogo ? 'Place the attached official Farhan Balouch logo at the top with its transparent background and no colored box. Preserve its proportions and design. Leave the logo area empty if a reference is unavailable.' : 'Keep the top uncluttered.',
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
  const { width, height } = promoFormats[settings.format]; canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const layout=settings.layout || 'cinematic', accent=settings.accent, side=78;
  const tall=settings.format==='vertical', square=settings.format==='square';
  const top=tall?155:68, footerY=height-(tall?260:85);
  const sans='Inter, Arial, sans-serif', family=settings.font==='sans'?sans:'Georgia, serif';
  ctx.fillStyle=navy;ctx.fillRect(0,0,width,height);
  const artBottom=layout==='split'?height*.57:height;
  if(artwork){
    const scale=Math.max(width/artwork.naturalWidth,artBottom/artwork.naturalHeight),sw=width/scale,sh=artBottom/scale;
    ctx.drawImage(artwork,(artwork.naturalWidth-sw)*settings.focalX/100,(artwork.naturalHeight-sh)*settings.focalY/100,sw,sh,0,0,width,artBottom);
  }else{
    const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,'#203a4b');gradient.addColorStop(.6,navy);gradient.addColorStop(1,accent);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
    ctx.save();ctx.translate(width*.72,height*.25);ctx.rotate(-.4);ctx.globalAlpha=.15;ctx.fillStyle=accent;
    for(let i=0;i<5;i++)ctx.fillRect(i*65-170,-350,25,850);ctx.restore();
  }
  const shade=ctx.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#0a0e1766');shade.addColorStop(.3,'#0a0e1715');shade.addColorStop(.66,'#0a0e17d9');shade.addColorStop(1,navy);
  ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);
  let titleY=height*(tall?.58:.54),textWidth=width-side*2,labelY=titleY-83;
  if(layout==='editorial'){
    ctx.fillStyle='#f7ecd8';ctx.fillRect(38,height*.51,width-76,height*.39);
    titleY=height*.61;labelY=titleY-83;textWidth=width-side*2;
  }else if(layout==='split'){
    ctx.fillStyle=accent;ctx.fillRect(0,height*.53,width,12);titleY=height*.64;labelY=titleY-80;
  }else if(layout==='minimal'){
    ctx.fillStyle='#0a0e17bb';ctx.fillRect(0,0,width,height);
    ctx.fillStyle=accent;ctx.font='700 220px Georgia';ctx.fillText('“',side-12,height*.44);titleY=height*.52;labelY=titleY-75;
  }
  if(settings.showLogo&&logo){
    // The existing alpha logo has transparent padding; draw only its artwork, no backplate.
    ctx.drawImage(logo,22,102,630,154,side,top,340,83);
  }
  const ink=layout==='editorial'?'#182437':cream;
  drawText(ctx,settings.label,side,labelY,textWidth,{color:layout==='editorial'?'#72562e':accent,family:sans,size:25,min:21,rows:1,weight:700});
  const after=drawText(ctx,settings.headline,side,titleY,textWidth,{color:ink,family,size:square?76:tall?100:90,min:square?43:52,rows:3,weight:700});
  drawText(ctx,settings.subhead,side,after+18,textWidth,{color:layout==='editorial'?'#455267':'#d4deeb',family:sans,size:square?28:32,min:23,rows:square?2:3,weight:400});
  ctx.fillStyle=accent;ctx.fillRect(side,footerY-39,62,4);
  drawText(ctx,settings.callToAction,side,footerY,textWidth*.51,{color:accent,family:sans,size:24,min:19,rows:1,weight:700});
  ctx.fillStyle=cream;ctx.font='600 24px '+sans;ctx.textAlign='right';ctx.fillText('farhanbalouch.com',width-side,footerY,textWidth*.46);ctx.textAlign='left';
}
