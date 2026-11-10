import { useEffect, useRef, useState } from 'react';
import { Copy, Download, ImagePlus, Sparkles, X } from 'lucide-react';
import { imagePrompt, promoFormats, promoLayouts, promoVariation, renderPromo, type PromoFormat, type PromoSettings, type SocialPromo } from '@/lib/studio-promo';
import { optimizePhoto } from '@/lib/studio-images';
import './studio-promo.css';

type Props = {
  id: string;
  promo: SocialPromo;
  url?: string;
  published: boolean;
  imageAi: boolean;
  initialLabel?: string;
  initialArtwork?: string;
  generateArtwork: (scene: string) => Promise<{ data: string; mime: string; model?: string; fallback?: boolean }>;
  editArtwork?: (request: {reference:string;width:number;height:number;instructions:string}) => Promise<{data:string;mime:string;model?:string;fallback?:boolean}>;
  close: () => void;
};

const logoUrl = '/promo-logo.png';
const textFields = [
  { key: 'headline', label: 'Headline', max: 90 },
  { key: 'subhead', label: 'Supporting line', max: 150 },
  { key: 'label', label: 'Top label', max: 36 },
  { key: 'callToAction', label: 'Call to action', max: 32 },
  { key: 'scene', label: 'AI scene direction', max: 1100 },
  { key: 'caption', label: 'Social caption', max: 600 },
] as const;

function loadSettings(key: string, promo: SocialPromo, label: string): PromoSettings {
  const defaults: PromoSettings = {
    ...promo, format: 'feed', label, callToAction: 'READ THE BLOG',
    ...promoVariation(key), font: 'sans', showLogo: true, focalX: 50, focalY: 50,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    for (const { key, max } of textFields) {
      if (typeof saved[key] === 'string') defaults[key] = Array.from(saved[key]).slice(0, max).join('');
    }
    if (saved.layout in promoLayouts) defaults.layout = saved.layout;
    if (saved.font === 'serif' || saved.font === 'sans') defaults.font = saved.font;
    if (saved.format === 'square' || saved.format === 'vertical' || saved.format === 'feed') defaults.format = saved.format;
    if (/^#[a-f0-9]{6}$/i.test(saved.accent)) defaults.accent = saved.accent;
    if (typeof saved.showLogo === 'boolean') defaults.showLogo = saved.showLogo;
    for (const field of ['focalX', 'focalY'] as const) {
      if (typeof saved[field] === 'number' && Number.isFinite(saved[field])) defaults[field] = Math.max(0, Math.min(saved[field], 100));
    }
  } catch { /* The editor also works without persistent browser storage. */ }
  return defaults;
}

async function decodeImage(src: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;
  await image.decode();
  return image;
}

export function StudioPromo({ id, promo, url, published, imageAi, initialLabel = 'NEW ON THE BLOG', generateArtwork, editArtwork, initialArtwork, close }: Props) {
  const storageKey = 'studio-promo-v2:' + id;
  const [settings, setSettings] = useState(() => loadSettings(storageKey, promo, initialLabel));
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [artwork, setArtwork] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editComposition, setEditComposition] = useState('Change the background or surroundings to fit the blog topic; keep the person centred and at the same scale.');
  const canvas = useRef<HTMLCanvasElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    section.current?.scrollIntoView({ block: 'start' });
    let active = true;
    decodeImage(logoUrl).then(image => { if (active) setLogo(image); })
      .catch(() => { if (active) setError('The website logo could not load. Reload Studio to try again.'); });
    if (initialArtwork) decodeImage(initialArtwork).then(image => { if(active) setArtwork(image); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (canvas.current) renderPromo(canvas.current, settings, artwork, logo);
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); }
    catch { /* Preview and download do not need browser storage. */ }
  }, [artwork, logo, settings, storageKey]);

  const update = (patch: Partial<PromoSettings>) => setSettings(previous => ({ ...previous, ...patch }));
  const caption = [settings.caption.trim(), published ? url : undefined].filter(Boolean).join('\n\n');
  const fullPrompt = imagePrompt(settings, true);
  const artworkPrompt = imagePrompt(settings, false);
  const format = promoFormats[settings.format];

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setError('');
      setNotice(label + ' copied.');
    } catch {
      setNotice('');
      setError('Clipboard access is unavailable. Open “Prompt and caption text” to copy manually.');
    }
  }

  async function prepareArtwork(load: () => Promise<HTMLImageElement>) {
    setBusy(true);
    setError('');
    setNotice('');
    try { setArtwork(await load()); }
    catch (error) { setError((error as Error).message || 'The artwork could not be opened.'); }
    finally { setBusy(false); }
  }

  function upload(file: File) {
    return prepareArtwork(async () => decodeImage((await optimizePhoto(file)).preview));
  }

  function generate() {
    return prepareArtwork(async () => {
      const result = await generateArtwork(artworkPrompt);
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(result.mime)) throw new Error('Studio received an unsupported image.');
      setNotice(`Artwork ready${result.model ? ' · ' + result.model : ''}${result.fallback ? ' (fallback model)' : ''}. Review before downloading.`);
      return decodeImage(`data:${result.mime};base64,${result.data}`);
    });
  }

  function editWithAi(mode: 'enhance' | 'recompose') {
    if(!artwork || !editArtwork) return;
    return prepareArtwork(async()=>{
      const blob=await fetch(artwork.src).then(response=>response.blob());
      const source=await optimizePhoto(new File([blob],'reference',{type:blob.type}),480,'image/jpeg');
      const identityLock='If a person is present, preserve the exact person: face, identity, facial features, expression, skin tone, hair, age, body shape, proportions, pose and clothing. Do not beautify, reshape, replace, duplicate or redraw them. Keep the photo natural and photorealistic.';
      const topic=settings.scene.trim();
      const modePrompt=mode==='enhance'
        ? `Enhance this uploaded artwork for the blog topic. Improve clarity, lighting, color balance and visual polish; adapt the setting gently to this topic while keeping the original framing and subject placement. Topic direction: ${topic}.`
        : `Create a new thumbnail composition from this uploaded artwork for the blog topic. Reframe and adjust the scene to make the topic clear, use a strong editorial composition and leave clean space for the thumbnail text. Topic direction: ${topic}. Keep the person recognizable and unchanged. Composition choice: ${editComposition}.`;
      const result=await editArtwork({reference:source.data,width:source.width,height:source.height,instructions:`${identityLock}\n${modePrompt}\nAdditional edits: ${editInstructions}`});
      setNotice(`Edited preview ready${result.model ? ' · '+result.model : ''}. Check the face and body before downloading; your original photo stays unchanged.`);
      return decodeImage(`data:${result.mime};base64,${result.data}`);
    });
  }

  function download() {
    setError('');
    canvas.current?.toBlob(blob => {
      if (!blob) { setError('The thumbnail could not be exported.'); return; }
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${url?.split('/').pop() || 'farhan-blog'}-${format.width}x${format.height}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    }, 'image/png');
  }

  return <section className="studio-paper studio-promo" ref={section} aria-label="Social Promo editor">
    <header className="studio-promo-header">
      <div>
        <span className="studio-tag">Blog announcement</span>
        <h2>Social Promo</h2>
        <p>Personalize the thumbnail, add artwork if you like, then download the finished PNG.</p>
        {!published && <p className="studio-promo-pending">Website deploy is pending. The caption includes the blog link when it goes live.</p>}
      </div>
      <button type="button" className="studio-secondary" aria-label="Close Social Promo" onClick={close}><X size={18} /></button>
    </header>

    <div className="studio-promo-grid">
      <div className="studio-promo-preview">
        <canvas ref={canvas} role="img" aria-label={settings.headline || 'Blog thumbnail preview'} style={{ aspectRatio: `${format.width} / ${format.height}` }} />
        <small>{format.width} × {format.height} PNG · {format.ratio}</small>
        <button type="button" className="studio-primary" disabled={settings.showLogo && !logo} onClick={download}><Download size={17} /> Download thumbnail</button>
      </div>
      <div className="studio-promo-controls">
        <div className="studio-promo-fields"><label>Choose thumbnail template<select value={settings.layout || 'cinematic'} onChange={event=>update({layout:event.target.value as PromoSettings['layout']})}>{Object.entries(promoLayouts).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><small className="studio-hint">Try Cinematic, Editorial, Split or Minimal; then edit text, colors and photo framing.</small></label><label>Headline font<select value={settings.font || 'sans'} onChange={event=>update({font:event.target.value as 'sans'|'serif'})}><option value="sans">Modern bold</option><option value="serif">Editorial serif</option></select></label></div>
        <label>Post size
          <select value={settings.format} onChange={event => update({ format: event.target.value as PromoFormat })}>
            {Object.entries(promoFormats).map(([key, format]) => <option key={key} value={key}>{format.label} · {format.ratio}</option>)}
          </select>
        </label>
        <div className="studio-promo-brand">
          <label>Accent color<input type="color" value={settings.accent} onChange={event => update({ accent: event.target.value })} /></label>
          <label className="studio-promo-logo"><input type="checkbox" checked={settings.showLogo} onChange={event => update({ showLogo: event.target.checked })} /> Website logo</label>
          <a href={logoUrl} download="farhan-balouch-logo.png">Download logo</a>
        </div>
        <div className="studio-promo-fields">
          {textFields.map(({ key, label, max }) => <label key={key}>{label}
            {key === 'scene' || key === 'caption'
              ? <textarea rows={key === 'scene' ? 4 : 3} maxLength={max} value={settings[key]} onChange={event => update({ [key]: event.target.value })} />
              : <input type="text" maxLength={max} value={settings[key]} onChange={event => update({ [key]: event.target.value })} />}
          </label>)}
        </div>
        <button type="button" className="studio-secondary" onClick={()=>{const keys=Object.keys(promoLayouts);update({layout:keys[(keys.indexOf(settings.layout || 'cinematic')+1)%keys.length] as PromoSettings['layout']});}}>Try another design</button>
        <div className="studio-promo-actions">
          <button type="button" className="studio-secondary" disabled={busy || !imageAi} onClick={generate}><Sparkles size={16} /> {busy ? 'Preparing artwork…' : 'Generate with AI'}</button>
          <button type="button" className="studio-secondary" disabled={busy} onClick={() => picker.current?.click()}><ImagePlus size={16} /> Upload artwork</button>
          <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void upload(file);
          }} />
        </div>
        <p className="studio-hint">AI uses the shared Cloudflare free allocation. Model routing helps with model failures; it cannot reset the daily quota. No paid provider is added.</p>
        {artwork && editArtwork && <div className="studio-promo-edit"><span>AI edit your uploaded artwork</span><p className="studio-hint">Choose how your photo should fit this blog, then select an edit action. The original upload stays unchanged.</p><label>Composition for the new thumbnail<select value={editComposition} onChange={event=>setEditComposition(event.target.value)}>
          <option value="Change the background or surroundings to fit the blog topic; keep the person centred and at the same scale.">Change setting; keep my position and size</option>
          <option value="Move the person slightly to the left and create clean negative space on the right for text; keep their size and pose.">Move me left; leave room for text</option>
          <option value="Use a wider environmental composition that shows more of the setting around the person; preserve their size, face and body.">Show more of the scene</option>
          <option value="Use a closer portrait crop while keeping the complete face and natural upper body proportions unchanged.">Closer portrait framing</option>
          <option value="Keep the original framing and person placement; update only the background to match the blog topic.">Keep framing; change background only</option>
        </select></label><label>Extra instruction<textarea rows={3} maxLength={700} value={editInstructions} onChange={event=>setEditInstructions(event.target.value)} placeholder="e.g. warm window light, remove clutter from the background" /></label><p className="studio-hint">AI face, body, pose aur kapray preserve karne ki koshish karega; result ko download se pehle check karein.</p><div className="studio-promo-actions"><button type="button" className="studio-secondary" disabled={busy || !imageAi} onClick={()=>editWithAi('enhance')}><Sparkles size={15} />Enhance photo for this topic</button><button type="button" className="studio-secondary" disabled={busy || !imageAi} onClick={()=>editWithAi('recompose')}><Sparkles size={15} />Create new topic layout</button></div></div>}
        {artwork && <div className="studio-promo-actions studio-promo-crop">
          <label>Horizontal crop <input type="range" value={settings.focalX} onChange={event => update({ focalX: Number(event.target.value) })} /></label>
          <label>Vertical crop <input type="range" value={settings.focalY} onChange={event => update({ focalY: Number(event.target.value) })} /></label>
          <button type="button" className="studio-secondary" disabled={busy} onClick={() => setArtwork(null)}>Remove artwork</button>
        </div>}
        <div className="studio-promo-actions">
          <button type="button" className="studio-secondary" onClick={() => copy(fullPrompt, 'Thumbnail prompt')}><Copy size={16} /> Copy full thumbnail prompt</button>
          <button type="button" className="studio-secondary" onClick={() => copy(artworkPrompt, 'Artwork prompt')}><Copy size={16} /> Copy artwork prompt</button>
          <button type="button" className="studio-secondary" onClick={() => copy(caption, 'Caption')}><Copy size={16} /> Copy caption</button>
        </div>
        <details className="studio-promo-text">
          <summary>Prompt and caption text</summary>
          <label>Full thumbnail prompt<textarea readOnly rows={4} value={fullPrompt} /></label>
          <label>Artwork prompt<textarea readOnly rows={4} value={artworkPrompt} /></label>
          <label>Caption for sharing<textarea readOnly rows={3} value={caption} /></label>
        </details>
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert" className="studio-error">{error}</p>}
      </div>
    </div>
  </section>;
}
