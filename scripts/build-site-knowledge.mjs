import { build } from 'esbuild';
import ts from 'typescript';
import { readFile, writeFile } from 'node:fs/promises';
const { outputFiles } = await build({stdin:{contents:'export {SITE,projects,highlights} from "./src/data/content.tsx";',resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const {SITE,projects,highlights} = await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const read = async p => JSON.parse(await readFile(p,'utf8'));
const [blogs,stories,chapters] = await Promise.all(['blog-posts','stories','story-chapters'].map(p=>read(`src/data/${p}.json`)));
const normalize = s => s.replace(/\s+/g,' ').replace(/&rsquo;/g,"'").replace(/&amp;/g,'&').trim();
const entries=[];
for(const [path,file,title] of [['/','Home','Home'],['/about','About','About Farhan'],['/work','Work','Projects'],['/contact','Contact','Contact'],['/blog','Blog','Blog'],['/stories','Stories','Stories & updates'],['/story','StoryHub','Biography']]){
 const ast=ts.createSourceFile(file+'.tsx',await readFile(`src/pages/${file}.tsx`,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const words=[],anchors=[];
 function visit(node){
  if(ts.isJsxText(node))words.push(node.text);
  if(ts.isJsxAttribute(node)&&node.initializer&&ts.isStringLiteral(node.initializer)){
   if(node.name.getText(ast)==='id')anchors.push(node.initializer.text);
   if(['description','title','placeholder'].includes(node.name.getText(ast)))words.push(node.initializer.text);
  }
  ts.forEachChild(node,visit);
 }visit(ast);
 entries.push({id:path,url:SITE.url+path,title,kind:'page',text:normalize(words.join(' ')),anchors:[...new Set(anchors)],language:'en'});
}
entries.push({id:'profile',url:SITE.url+'/about',title:'Farhan Balouch — public profile',kind:'profile',language:'en',text:[SITE.name,SITE.origin,...highlights.flatMap(h=>[h.title,h.body])].join('\n')});
for(const p of projects)entries.push({id:'project-'+p.slug,url:p.link || SITE.url+'/work',title:p.title,kind:'project',language:'en',text:[p.category,p.tagline,p.description,...p.features,'Portfolio status: '+p.status,'Project address: '+p.link].join('\n')});
for(const [route,items] of [['blog',blogs],['stories',stories],['story',chapters]])for(const item of items)for(const [language,t]of Object.entries(item.translations))entries.push({id:`${route}-${item.slug}-${language}`,url:`${SITE.url}/${route}/${item.slug}`,title:t.title,kind:route,language,publishedAt:item.publishedAt,updatedAt:item.updatedAt,text:[t.title,t.excerpt,t.subtitle,...(t.body||t.paragraphs||[]),t.moral,...(item.images||[]).flatMap(p=>[p.alt,p.caption])].filter(Boolean).join('\n')});
await writeFile('public/site-knowledge.json',JSON.stringify({version:1,site:SITE.url,generatedAt:new Date().toISOString(),revision:process.env.VERCEL_GIT_COMMIT_SHA||null,entries,projects:projects.filter(p=>p.link).map(p=>({name:p.title,url:p.link}))}));
console.log(`Indexed ${entries.length} complete public content entries without private admin data.`);
