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
