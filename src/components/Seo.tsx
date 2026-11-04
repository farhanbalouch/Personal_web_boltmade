import { useEffect } from 'react';

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  structuredData?: string;
};

const SITE_URL = 'https://farhanbalouch.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/** Lightweight per-page SEO: <title>, meta description, OG/Twitter tags, canonical link. */
export function Seo({ title, description, path = '/', ogImage = DEFAULT_OG_IMAGE, structuredData }: SeoProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
      if (selector.startsWith('link')) {
        let link = document.head.querySelector(selector) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          if (selector.includes('canonical')) link.rel = 'canonical';
          document.head.appendChild(link);
        }
        if (attr === 'href') link.href = value;
      } else {
        let meta = document.head.querySelector(selector) as HTMLMetaElement | null;
        if (!meta) {
          meta = document.createElement('meta');
          const match = selector.match(/\[(?:name|property)="(.+?)"\]/);
          const name = match ? match[1] : '';
          if (selector.includes('property')) meta.setAttribute('property', name);
          else meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.content = value;
      }
    };

    const url = `${SITE_URL}${path === '/' ? '/' : path}`;

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:image"]', 'content', ogImage);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', ogImage);
    setMeta('link[rel="canonical"]', 'href', url);
    setMeta('meta[property="og:type"]', 'content', structuredData ? 'article' : 'website');

    let script = document.head.querySelector<HTMLScriptElement>('#article-structured-data');
    if (!structuredData) {
      script?.remove();
      return;
    }
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'article-structured-data';
      document.head.appendChild(script);
    }
    script.textContent = structuredData;
    return () => script.remove();
  }, [title, description, path, ogImage, structuredData]);

  return null;
}


