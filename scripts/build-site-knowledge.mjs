import { build } from 'esbuild';
import ts from 'typescript';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
const { outputFiles } = await build({stdin:{contents:'export { projectMilestones } from \"./src/lib/project-meta.ts\"; export {SITE,projects,highlights} from "./src/data/content.tsx";',resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const {SITE,projects,highlights,projectMilestones} = await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const read = async p => JSON.parse(await readFile(p,'utf8'));
const [blogs,stories,chapters] = await Promise.all(['blog-posts','stories','story-chapters'].map(p=>read(`src/data/${p}.json`)));
const normalize = s => s.replace(/\s+/g,' ').replace(/&rsquo;/g,"'").replace(/&amp;/g,'&').trim();
const entries=[];
for(const [path,file,title] of [['/','Home','Home'],['/about','About','About Farhan'],['/work','Work','Projects'],['/contact','Contact','Contact'],['/blog','Blog','Blog'],['/stories','Stories','Stories & updates'],['/story','StoryHub','Biography']]){
 const words=[],anchors=[],seen=new Set();
 async function scan(sourcePath){
  if(seen.has(sourcePath))return;seen.add(sourcePath);
  const source=await readFile(sourcePath,'utf8');
  const ast=ts.createSourceFile(sourcePath,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const imports=[];
  function visit(node){
   if(ts.isJsxText(node))words.push(node.text);
   if(ts.isStringLiteral(node)&&!ts.isJsxAttribute(node.parent)&&!ts.isImportDeclaration(node.parent)&&!ts.isExportDeclaration(node.parent)&&!(ts.isPropertyAssignment(node.parent)&&node.parent.name===node)&&node.text.length>12&&/\s/.test(node.text)&&!/[{}<>]/.test(node.text))words.push(node.text);
   if(ts.isJsxAttribute(node)&&node.initializer&&ts.isStringLiteral(node.initializer)){
    if(node.name.getText(ast)==='id')anchors.push(node.initializer.text);
    if(['description','title','placeholder'].includes(node.name.getText(ast)))words.push(node.initializer.text);
   }
   if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)){
    let target=node.moduleSpecifier.text;
    if(target.startsWith('@/components/'))imports.push('src/'+target.slice(2)+'.tsx');
    else if(target.startsWith('./')&&sourcePath.startsWith('src/components/'))imports.push(join(dirname(sourcePath),target+'.tsx'));
   }
   if(ts.isJsxAttribute(node)&&node.name.getText(ast)==='id'&&node.initializer&&ts.isJsxExpression(node.initializer)&&node.initializer.expression&&ts.isStringLiteral(node.initializer.expression))anchors.push(node.initializer.expression.text);
   ts.forEachChild(node,visit);
  }visit(ast);
  for(const imported of imports)try{await scan(imported);}catch(err){if(err.code!=='ENOENT')throw err;}
 }
 await scan(`src/pages/${file}.tsx`);
 entries.push({id:path,url:SITE.url+path,title,kind:'page',text:normalize(words.join(' ')),anchors:[...new Set(anchors)],language:'en'});
 for(const anchor of new Set(anchors))entries.push({id:path+'#'+anchor,url:SITE.url+path+'#'+anchor,title:`${title}: ${anchor.replace(/-/g,' ')}`,kind:'section',text:`Named section on ${title}: ${anchor.replace(/-/g,' ')}. Exact page location: ${SITE.url}${path}#${anchor}`,language:'en'});
}
entries.push({id:'profile',url:SITE.url+'/about',title:'Farhan Balouch — public profile',kind:'profile',language:'en',text:[SITE.name,SITE.origin,...highlights.flatMap(h=>[h.title,h.body])].join('\n')});
for(const p of projects)entries.push({id:'project-'+p.slug,url:p.link || SITE.url+'/work',title:p.title,kind:'project',language:'en',text:[p.category,p.tagline,p.description,...p.features,'Portfolio status: '+p.status,'Project address: '+p.link,p.secondaryLink ? 'Download and setup guide: '+p.secondaryLink : '',projectMilestones[p.slug] ? projectMilestones[p.slug].label+': '+projectMilestones[p.slug].date : ''].join('\n')});
for(const [route,items] of [['blog',blogs],['stories',stories],['story',chapters]])for(const item of items)for(const [language,t]of Object.entries(item.translations))entries.push({id:`${route}-${item.slug}-${language}`,url:`${SITE.url}/${route}/${item.slug}`,title:t.title,kind:route,language,publishedAt:item.publishedAt,updatedAt:item.updatedAt,text:[t.shortTitle,t.secondaryTitle,t.title,t.excerpt,t.subtitle,...(t.body||t.paragraphs||[]),t.moral,...(item.images||[]).flatMap(p=>[p.alt,p.caption])].filter(Boolean).join('\n')});
await writeFile('public/site-knowledge.json',JSON.stringify({version:1,site:SITE.url,generatedAt:new Date().toISOString(),revision:process.env.VERCEL_GIT_COMMIT_SHA||null,entries,projects:projects.filter(p=>p.link).map(p=>({name:p.title,url:p.link}))}));
console.log(`Indexed ${entries.length} complete public content entries without private admin data.`);
