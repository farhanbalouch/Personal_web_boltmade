import { useEffect, useRef, useState } from 'react';
import { ImagePlus, ArrowUp, ArrowDown, X } from 'lucide-react';
import type { ContentImage } from '@/data/blog';
import { optimizePhoto } from '@/lib/studio-images';
type Props = {images: ContentImage[]; onChange: (images: ContentImage[]) => void; upload: (data: string) => Promise<{src: string}>; disabled: boolean; onBusy: (busy: boolean) => void};
export function StudioPhotos({images, onChange, upload, disabled, onBusy}: Props) {
  const picker = useRef<HTMLInputElement>(null);
  const previews = useRef(new Map<string, string>());
  const [uploading, setUploading] = useState(''), [error, setError] = useState('');
  useEffect(() => () => { for (const url of previews.current.values()) URL.revokeObjectURL(url); }, []);
  function update(index: number, value: Partial<ContentImage>) { onChange(images.map((photo, i) => i === index ? {...photo, ...value} : photo)); }
  function move(index: number, step: number) { const next = [...images]; [next[index], next[index + step]] = [next[index + step], next[index]]; onChange(next); }
  async function add(files: File[]) {
    if (files.length + images.length > 6) { setError('You can add up to six photos.'); return; }
    setError(''); onBusy(true);
    const next = [...images];
    try {
      for (let i = 0; i < files.length; i++) {
        setUploading(`Optimizing and uploading photo ${i + 1} of ${files.length}…`);
        const photo = await optimizePhoto(files[i]);
        try {
          const result = await upload(photo.data);
          previews.current.set(result.src, photo.preview);
          const alt = files[i].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').slice(0, 240) || 'Photo';
          next.push({src: result.src, alt, caption: '', width: photo.width, height: photo.height});
          onChange([...next]);
        } catch (e) { URL.revokeObjectURL(photo.preview); throw e; }
      }
    } catch (e) { setError((e as Error).message || 'Could not process this photo. Try another JPG, PNG or WebP.'); }
    finally { setUploading(''); onBusy(false); }
  }
  return <section className="studio-photos" aria-label="Photos for this post">
    <div className="studio-photos-heading"><div><h3>Bring your story to life.</h3><p>Add up to six photos. The first is your cover. Uploaded files are public.</p></div><span>{images.length}/6</span></div>
    <button type="button" className="studio-photo-add" disabled={disabled || !!uploading || images.length >= 6} onClick={() => picker.current?.click()}><ImagePlus size={19} /> {uploading || 'Add photos'}</button>
    <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { const files = Array.from(e.target.files || []); e.target.value = ''; if (files.length) void add(files); }} />
    {error && <p role="alert" className="studio-error">{error}</p>}
    {uploading && <p role="status" className="studio-photo-status">{uploading}</p>}
    <div className="studio-photo-list">{images.map((photo, i) => <article key={`${photo.src}-${i}`}>
      <div className="studio-photo-preview"><img src={previews.current.get(photo.src) || `https://farhanbalouch.com${photo.src}`} alt={photo.alt} width={photo.width} height={photo.height} /><span>{i === 0 ? 'COVER PHOTO' : `PHOTO ${i + 1}`}</span></div>
      <div className="studio-photo-fields"><label htmlFor={`photo-alt-${i}`}>Photo description<input id={`photo-alt-${i}`} value={photo.alt} maxLength={240} required disabled={disabled} onChange={(e) => update(i, {alt: e.target.value})} /></label>
        <label htmlFor={`photo-caption-${i}`}>Caption <small>(optional)</small><input id={`photo-caption-${i}`} value={photo.caption} maxLength={400} placeholder="A little context for this moment…" disabled={disabled} onChange={(e) => update(i, {caption: e.target.value})} /></label>
        <div className="studio-photo-actions"><button type="button" aria-label={`Move photo ${i + 1} earlier`} disabled={disabled || !!uploading || i === 0} onClick={() => move(i, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={`Move photo ${i + 1} later`} disabled={disabled || !!uploading || i === images.length - 1} onClick={() => move(i, 1)}><ArrowDown size={15} /></button><button type="button" disabled={disabled || !!uploading} onClick={() => onChange(images.filter((_, j) => j !== i))}><X size={14} /> Remove</button></div>
      </div>
    </article>)}</div>
    {!!images.length && <p className="studio-photo-status">Photos are saved as optimized WebP. They appear on your public page only when you publish; uploaded files become publicly accessible after deployment.</p>}
  </section>;
}
