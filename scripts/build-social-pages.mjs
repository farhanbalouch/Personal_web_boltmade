import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const SITE = 'https://farhanbalouch.com';
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const absolute = (path) => new URL(path, SITE).href;
export function socialHtml(shell, page) {
  const cover = page.images?.[0];
  const image = absolute(cover?.src || '/og-image.png');
  const imageAlt = cover?.alt || 'Farhan Balouch — stories, ideas and digital projects';
  const url = SITE + page.path;
  const tags = [
    ['name','description',page.description], ['property','og:site_name','Farhan Balouch'],
    ['property','og:type',page.article ? 'article' : 'website'], ['property','og:locale','en_US'],
    ['property','og:title',page.title], ['property','og:description',page.description], ['property','og:url',url],
    ['property','og:image',image], ['property','og:image:secure_url',image],
    ['property','og:image:type',cover ? 'image/webp' : 'image/png'],
    ['property','og:image:width',cover?.width || 1200], ['property','og:image:height',cover?.height || 630],
    ['property','og:image:alt',imageAlt], ['name','twitter:card','summary_large_image'],
    ['name','twitter:title',page.title], ['name','twitter:description',page.description],
    ['name','twitter:image',image], ['name','twitter:image:alt',imageAlt],
    ...(page.publishedAt ? [['property','article:published_time',page.publishedAt]] : []),
    ...(page.updatedAt ? [['property','article:modified_time',page.updatedAt]] : []),
  ];
  let html = shell.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:property=["'](?:og:|article:)[^"']*["']|name=["'](?:twitter:[^"']*|description)["'])[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, '');
  const markup = `<title>${escape(page.title)}</title>\n` + tags.map(([attr,key,value]) => `<meta ${attr}="${key}" content="${escape(value)}" />`).join('\n') +
    `\n<link rel="canonical" href="${escape(url)}" />\n<link rel="alternate" type="text/markdown" href="${escape(absolute(page.path === '/' ? '/index.md' : page.path + '.md'))}" />`;
  return html.replace('</head>', markup + '\n</head>');
}
const cleanLabel = (s) => String(s).replace(/[\[\]\r\n]/g, ' ');
export function llmsIndex(base, pages) {
  const articles = pages.filter(p => p.article);
  return base.trim() + '\n\n## Published writing\n\n' + articles.map(p => `- [${cleanLabel(p.title)}](${SITE}${p.path}.md): ${cleanLabel(p.description)}`).join('\n') + '\n';
}
export async function main() {
  const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
  const [blogs, stories, chapters, shell, llms] = await Promise.all([
    read('src/data/blog-posts.json'),read('src/data/stories.json'),read('src/data/story-chapters.json'),
    readFile('dist/index.html','utf8'),readFile('public/llms.txt','utf8'),
  ]);
  const pages = [
    {path:'/',title:'Farhan Balouch — Official Website',description:'Explore Farhan Balouch’s stories, AI projects, blogs and journey in SEO and online business.'},
    {path:'/about',title:'About Farhan Balouch',description:'Meet Farhan Balouch and explore the ideas, interests and projects behind this personal website.'},
    {path:'/work',title:'Projects — Farhan Balouch',description:'Explore Farhan Balouch’s AI and web projects, including MovieHub, Nexus AI and Rawi.'},
    {path:'/contact',title:'Contact — Farhan Balouch',description:'Get in touch with Farhan Balouch through the contact options on his official website.'},
    {path:'/blog',title:'Blog — Farhan Balouch',description:'Ideas, project notes and updates from Farhan Balouch.'},
    {path:'/stories',title:'Stories & Updates — Farhan Balouch',description:'Fresh stories, project updates and moments from Farhan Balouch’s journey.'},
    {path:'/story',title:'My Story — Farhan Balouch',description:'Read the chapters of Farhan Balouch’s personal journey.'},
  ];
  for (const [route,items] of [['blog',blogs],['stories',stories],['story',chapters]]) for (const item of items) {
    if (!/^[a-z0-9-]{1,100}$/.test(item.slug)) throw new Error('Invalid public content slug');
    const t = item.translations.en;
    pages.push({path:`/${route}/${item.slug}`,title:`${t.title} — Farhan Balouch`,description:t.excerpt,images:item.images,article:true,publishedAt:item.publishedAt,updatedAt:item.updatedAt,paragraphs:t.body || t.paragraphs});
  }
  for (const page of pages) {
    const dir = join('dist',page.path.slice(1)); await mkdir(dir,{recursive:true});
    await writeFile(join(dir,'index.html'),socialHtml(shell,page));
    const markdown = `# ${page.title}\n\n> ${page.description}\n\nSource: ${SITE}${page.path}\n\n` +
      (page.paragraphs ? page.paragraphs.join('\n\n') : `Read the official page: ${SITE}${page.path}`) +
      (page.images?.length ? '\n\n' + page.images.map(p => `![${cleanLabel(p.alt)}](${absolute(p.src)})${p.caption ? '\n\n' + p.caption : ''}`).join('\n\n') : '') + '\n';
    await writeFile(page.path === '/' ? 'dist/index.md' : join('dist',page.path.slice(1)+'.md'),markdown);
  }
  await writeFile('dist/llms.txt',llmsIndex(llms,pages));
  console.log(`Generated social metadata and Markdown for ${pages.length} public pages.`);
}
if (process.argv[1]?.endsWith('build-social-pages.mjs')) main().catch(e=>{console.error(e.message);process.exitCode=1;});
