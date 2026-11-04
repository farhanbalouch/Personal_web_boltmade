import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Sparkles, X } from 'lucide-react';
import type { ContentImage } from '@/data/blog';
import { optimizePhoto } from '@/lib/studio-images';

type Mode = 'original' | 'generate' | 'edit';
type PreviewRequest = { mode: 'generate' | 'edit'; topic: string; instructions: string; reference?: string; width?: number; height?: number };
type Candidate = Awaited<ReturnType<typeof optimizePhoto>> & { alt: string; caption: string };
type Props = {
  images: ContentImage[];
  raw: string;
  aiReady: boolean;
  onChange: (images: ContentImage[]) => void;
  upload: (data: string) => Promise<{ src: string }>;
  createPreview: (body: PreviewRequest) => Promise<{ data: string; mime: string }>;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
};
const modes = { original: 'Original photos', generate: 'Generate with AI', edit: 'Edit a photo' } as const;
const photoName = (file: File) => file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').slice(0, 240) || 'Photo';

export function StudioPhotos({ images, raw, aiReady, onChange, upload, createPreview, disabled, onBusy }: Props) {
  const picker = useRef<HTMLInputElement>(null);
  const live = useRef(true);
  const previews = useRef(new Map<string, string>());
  const [mode, setMode] = useState<Mode>('original');
  const [source, setSource] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState('');
  const [instructions, setInstructions] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const topic = raw.trim().slice(0, 850);
  const title = topic.split('\n', 1)[0].slice(0, 180);
  const full = images.length >= 6;
  const locked = disabled || !!status;

  useEffect(() => {
    live.current = true;
    return () => { live.current = false; };
  }, []);
  useEffect(() => {
    const url = source ? URL.createObjectURL(source) : '';
    setSourcePreview(url);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [source]);

  async function work(label: string, fn: () => Promise<void>) {
    setStatus(label);
    setError('');
    onBusy(true);
    try {
      await fn();
    } catch (err) {
      if (live.current) setError((err as Error).message || 'The photo could not be processed.');
    } finally {
      if (live.current) {
        setStatus('');
        onBusy(false);
      }
    }
  }

  function chooseMode(next: Mode) {
    setMode(next);
    setSource(null);
    setInstructions('');
    setCandidates([]);
    setError('');
  }

  function select(files: File[]) {
    if (mode === 'edit') {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(files[0].type) || files[0].size > 12000000) {
        setError('Choose a JPG, PNG or WebP photo under 12 MB.');
        return;
      }
      setSource(files[0]);
      setCandidates([]);
      setError('');
      return;
    }
    if (files.length + images.length > 6) {
      setError('You can add up to six photos.');
      return;
    }
    void work('Preparing original previews…', async () => {
      const photos = await Promise.all(files.map(async file => ({
        ...await optimizePhoto(file), alt: photoName(file), caption: '',
      })));
      if (live.current) setCandidates(photos);
    });
  }

  function generate() {
    if (mode === 'original') return;
    setCandidates([]);
    void work(mode === 'edit' ? 'Editing your photo…' : 'Creating your illustration…', async () => {
      const original = mode === 'edit' && source ? await optimizePhoto(source, 496, 'image/jpeg') : null;
      if (!live.current) return;
      const result = await createPreview({
        mode, topic, instructions,
        ...(original && { reference: original.data, width: original.width, height: original.height }),
      });
      const bytes = Uint8Array.from(atob(result.data), char => char.charCodeAt(0));
      const file = new File([bytes], 'ai-preview', { type: result.mime });
      const photo = await optimizePhoto(file);
      if (live.current) setCandidates([{
        ...photo,
        alt: mode === 'edit' && source ? photoName(source) : title ? `Illustration for ${title}` : 'AI illustration',
        caption: mode === 'edit' ? 'AI-edited photo' : 'AI-generated illustration',
      }]);
    });
  }

  function attach() {
    if (images.length + candidates.length > 6) return;
    void work('Uploading approved photos…', async () => {
      const next = [...images];
      for (const photo of candidates) {
        const { src } = await upload(photo.data);
        if (!live.current) return;
        previews.current.set(src, photo.preview);
        const { alt, caption, width, height } = photo;
        if (!next.some(image => image.src === src)) next.push({ src, alt, caption, width, height });
        onChange([...next]);
        setCandidates(current => current.filter(candidate => candidate !== photo));
      }
    });
  }

  function update(index: number, value: Partial<ContentImage>) {
    onChange(images.map((photo, i) => i === index ? { ...photo, ...value } : photo));
  }

  function move(index: number, step: number) {
    const next = [...images];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    onChange(next);
  }

  return <section className="studio-photos" aria-label="Photos for this post">
    <div className="studio-photos-heading">
      <div><h3>Photos & illustrations</h3><p>Preview your images, then choose where they appear.</p></div>
      <span>{images.length}/6</span>
    </div>
    <div className="studio-photo-modes" role="group" aria-label="Image source">
      {(Object.keys(modes) as Mode[]).map(key => <button type="button" key={key} aria-pressed={mode === key}
        disabled={locked} onClick={() => chooseMode(key)}>{modes[key]}</button>)}
    </div>
    {mode !== 'generate' && <>
      <button type="button" className="studio-photo-add" disabled={locked || full} onClick={() => picker.current?.click()}>
        <ImagePlus size={19} /> {mode === 'edit' ? 'Choose source photo' : 'Choose original photos'}
      </button>
      <input key={mode} ref={picker} type="file" accept="image/jpeg,image/png,image/webp" multiple={mode === 'original'} hidden
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          event.target.value = '';
          if (files.length) select(files);
        }} />
      {source && <p className="studio-photo-status">Source photo · {source.name}</p>}
      {sourcePreview && <img className="studio-photo-source" src={sourcePreview} alt="Original source for the AI edit" />}
    </>}
    {mode !== 'original' && <div className="studio-photo-fields studio-photo-instructions">
      <label htmlFor="studio-image-instructions">{mode === 'edit' ? 'What should AI change?' : 'Art direction (optional)'}
        <textarea id="studio-image-instructions" rows={3} maxLength={900} value={instructions} disabled={locked || full}
          placeholder={mode === 'edit' ? 'Keep my face and pose. Brighten the photo and tidy the background.' : 'Show the main idea in a simple editorial illustration…'}
          onChange={event => setInstructions(event.target.value)} />
      </label>
      {mode === 'edit' && <p className="studio-photo-status">Only the selected source goes to Workers AI for this preview.</p>}
      {!aiReady && <p className="studio-photo-status">AI previews need a Cloudflare Workers AI connection. Original photo previews are ready.</p>}
      <button type="button" className="studio-photo-add" onClick={generate}
        disabled={locked || full || !aiReady || (mode === 'edit' ? !source || !instructions.trim() : !topic && !instructions.trim())}>
        <Sparkles size={16} /> {mode === 'edit' ? 'Preview AI edit' : 'Generate preview'}
      </button>
    </div>}
    {status && <p role="status" className="studio-photo-status">{status}</p>}
    {error && <p role="alert" className="studio-error">{error}</p>}
    {!!candidates.length && <div className="studio-photo-review">
      <p>Review before uploading. Approved files will be publicly accessible.</p>
      <div className="studio-photo-candidates">{candidates.map((photo, i) =>
        <img key={i} src={photo.preview} alt={photo.alt} width={photo.width} height={photo.height} />)}</div>
      <div className="studio-photo-review-actions">
        <button type="button" className="studio-photo-add" disabled={locked || images.length + candidates.length > 6} onClick={attach}>
          Approve &amp; attach {candidates.length === 1 ? 'image' : 'images'}
        </button>
        <button type="button" disabled={locked} onClick={() => setCandidates([])}>Discard preview</button>
      </div>
    </div>}
    <div className="studio-photo-list">{images.map((photo, i) => <article key={`${photo.src}-${i}`}>
      <div className="studio-photo-preview">
        <img src={previews.current.get(photo.src) || `https://farhanbalouch.com${photo.src}`} alt={photo.alt} width={photo.width} height={photo.height} />
        <span>{photo.inlineAfter ? 'IN ARTICLE' : i === 0 ? 'COVER PHOTO' : 'GALLERY PHOTO'}</span>
      </div>
      <div className="studio-photo-fields">
        <label htmlFor={`photo-alt-${i}`}>Photo description
          <input id={`photo-alt-${i}`} value={photo.alt} maxLength={240} required disabled={locked} onChange={event => update(i, { alt: event.target.value })} />
        </label>
        <label htmlFor={`photo-caption-${i}`}>Caption <small>(optional)</small>
          <input id={`photo-caption-${i}`} value={photo.caption} maxLength={400} placeholder="A little context for this image…" disabled={locked} onChange={event => update(i, { caption: event.target.value })} />
        </label>
        <label htmlFor={`photo-position-${i}`}>Placement
          <select id={`photo-position-${i}`} value={photo.inlineAfter ? 'inline' : 'default'} disabled={locked}
            onChange={event => update(i, { inlineAfter: event.target.value === 'inline' ? 1 : undefined })}>
            <option value="default">{i === 0 ? 'Cover' : 'End gallery'}</option>
            <option value="inline">Inside the article</option>
          </select>
        </label>
        {photo.inlineAfter && <label htmlFor={`photo-paragraph-${i}`}>After published paragraph
          <input id={`photo-paragraph-${i}`} type="number" min={1} max={100} value={photo.inlineAfter} disabled={locked}
            onChange={event => update(i, { inlineAfter: Math.min(100, Math.max(1, Math.floor(event.target.valueAsNumber || 1))) })} />
        </label>}
        <div className="studio-photo-actions">
          <button type="button" aria-label={`Move photo ${i + 1} earlier`} disabled={locked || i === 0} onClick={() => move(i, -1)}><ArrowUp size={15} /></button>
          <button type="button" aria-label={`Move photo ${i + 1} later`} disabled={locked || i === images.length - 1} onClick={() => move(i, 1)}><ArrowDown size={15} /></button>
          <button type="button" disabled={locked} onClick={() => onChange(images.filter((_, j) => j !== i))}><X size={14} /> Remove</button>
        </div>
      </div>
    </article>)}</div>
    {!!images.length && <p className="studio-photo-status">Photos use optimized WebP. The first photo is the cover unless placed in the article. If AI editing shortens the article, photos beyond the last paragraph move to the end gallery.</p>}
  </section>;
}
