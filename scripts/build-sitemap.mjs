import { readFile, writeFile } from "node:fs/promises";
const read = async (p) => JSON.parse(await readFile(p, "utf8"));
const [blogs, stories, chapters] = await Promise.all(
  [
    "src/data/blog-posts.json",
    "src/data/stories.json",
    "src/data/story-chapters.json",
  ].map(read),
);
const routes = [
  "",
  "/about",
  "/work",
  "/contact",
  "/blog",
  "/story",
  "/stories",
  ...blogs.map((p) => `/blog/${p.slug}`),
  ...stories.map((p) => `/stories/${p.slug}`),
  ...chapters.map((p) => `/story/${p.slug}`),
];
await writeFile(
  "public/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes
      .map((p) => `  <url><loc>https://farhanbalouch.com${p}</loc></url>`)
      .join("\n") +
    "\n</urlset>\n",
);

// Preserve incoming links and search results when the owner edits a public URL.
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const redirects = new Map((config.redirects || []).map(item => [item.source, item]));
for (const [route, items] of [['blog', blogs], ['stories', stories]]) {
  for (const item of items) for (const alias of item.aliases || []) {
    if (!/^[a-z0-9-]{1,100}$/.test(alias) || !/^[a-z0-9-]{1,100}$/.test(item.slug)) throw new Error('Invalid reading redirect');
    if (alias !== item.slug) redirects.set(`/${route}/${alias}`, { source: `/${route}/${alias}`, destination: `/${route}/${item.slug}`, permanent: true });
  }
}
config.redirects = [...redirects.values()];
await writeFile('vercel.json', JSON.stringify(config, null, 2) + '\n');
