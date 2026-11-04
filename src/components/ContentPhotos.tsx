import type { ContentImage } from '@/data/blog';
import './content-photos.css';
export function ContentPhotos({images, mode = 'all'}: {images?: ContentImage[]; mode?: 'cover' | 'gallery' | 'all'}) {
  const selected = mode === 'cover' ? images?.slice(0, 1).filter(photo => !photo.inlineAfter) : images;
  if (!selected?.length) return null;
  return <div className={`content-photos ${mode === 'gallery' ? 'content-photos-gallery' : ''}`}>
    {selected.map((photo, i) => <figure key={`${photo.src}-${i}`}>
      <a href={photo.src} target="_blank" rel="noreferrer" aria-label={`View photo: ${photo.alt}`}>
        <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading={mode === 'cover' ? 'eager' : 'lazy'} decoding="async" />
      </a>
      {photo.caption && <figcaption>{photo.caption}</figcaption>}
    </figure>)}
  </div>;
}
