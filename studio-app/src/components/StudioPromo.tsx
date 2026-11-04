import { useEffect, useRef, useState } from 'react';
import { Copy, Download, ImagePlus, Sparkles, X } from 'lucide-react';
import { imagePrompt, promoFormats, renderPromo, type PromoFormat, type PromoSettings, type SocialPromo } from '@/lib/studio-promo';
import { optimizePhoto } from '@/lib/studio-images';
import './studio-promo.css';

type Props = {
  id: string;
  promo: SocialPromo;
  url?: string;
  published: boolean;
  imageAi: boolean;
  initialLabel?: string;
  generateArtwork: (scene: string) => Promise<{ data: string; mime: string }>;
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
    accent: '#e8b14b', showLogo: true, focalX: 50, focalY: 50,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    for (const { key, max } of textFields) {
      if (typeof saved[key] === 'string') defaults[key] = Array.from(saved[key]).slice(0, max).join('');
    }
    if (saved.format === 'vertical' || saved.format === 'feed') defaults.format = saved.format;
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
  image.src = src;
  await image.decode();
  return image;
}

export function StudioPromo({ id, promo, url, published, imageAi, initialLabel = 'NEW ON THE BLOG', generateArtwork, close }: Props) {
  const storageKey = 'studio-promo-v1:' + id;
  const [settings, setSettings] = useState(() => loadSettings(storageKey, promo, initialLabel));
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [artwork, setArtwork] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const canvas = useRef<HTMLCanvasElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    section.current?.scrollIntoView({ block: 'start' });
    let active = true;
    decodeImage(logoUrl).then(image => { if (active) setLogo(image); })
      .catch(() => { if (active) setError('The website logo could not load. Reload Studio to try again.'); });
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
        <div className="studio-promo-actions">
          <button type="button" className="studio-secondary" disabled={busy || !imageAi} onClick={generate}><Sparkles size={16} /> {busy ? 'Preparing artwork…' : 'Generate artwork'}</button>
          <button type="button" className="studio-secondary" disabled={busy} onClick={() => picker.current?.click()}><ImagePlus size={16} /> Upload artwork</button>
          <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void upload(file);
          }} />
        </div>
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
