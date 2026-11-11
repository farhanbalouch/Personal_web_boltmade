import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, BookOpen, Briefcase, ExternalLink, Eye, Plus, Save, Send, Sparkles, Store, Film, ShieldCheck } from 'lucide-react';
import { parseStudioResponse } from '@/lib/studio-response';
import { optimizePhoto } from '@/lib/studio-images';
import './studio-projects.css';

type Status = 'live' | 'coming-soon' | 'preview' | 'placeholder';
type Template = 'aurora' | 'glass' | 'editorial' | 'minimal';
type Project = {
  slug: string; title: string; category: string; tagline: string; description: string; features: string[];
  seoTitle?: string; seoDescription?: string; keywords?: string[];
  link: string | null; displayUrl: string | null; cta: string; status: Status; icon: 'bot'|'book'|'store'|'shield'|'film';
  logo?: string | null; secondaryLink?: string | null; secondaryCta?: string | null; releaseDate?: string; releaseLabel?: string;
  featuredOrder?: number; spotlight?: boolean; showcase?: boolean; template?: Template;
};
type ChatMessage = { role: 'user'|'assistant'; content: string };
const draftKey = 'farhan-studio-project-editor-v1';
const emptyProject = (): Project => ({slug:'',title:'',category:'',tagline:'',description:'',seoTitle:'',seoDescription:'',keywords:[],features:[],link:'',displayUrl:'',cta:'Explore project',status:'coming-soon',icon:'bot',template:'aurora',logo:'',secondaryLink:'',secondaryCta:'',releaseDate:'',releaseLabel:'Added to portfolio'});
const statusText: Record<Status,string> = {live:'Live','coming-soon':'Coming soon',preview:'Preview',placeholder:'Placeholder'};
const templateText: Record<Template,string> = {aurora:'Aurora glow',glass:'Glass',editorial:'Editorial',minimal:'Minimal'};
const iconMap = {bot:Bot,book:BookOpen,store:Store,shield:ShieldCheck,film:Film};
async function send(body?: object) {
  return parseStudioResponse(await fetch('/api/projects', body ? {method:'POST',cache:'no-store',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {cache:'no-store',credentials:'same-origin'}));
}
async function studioSend(body: object) { return parseStudioResponse(await fetch('/api/studio',{method:'POST',cache:'no-store',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})); }
async function squareWebp(data:string,mime:string) {
  const raw=Uint8Array.from(atob(data),character=>character.charCodeAt(0));
  const image=await createImageBitmap(new Blob([raw],{type:mime}));
  try {
    const side=Math.min(image.width,image.height), canvas=document.createElement('canvas'); canvas.width=side;canvas.height=side;
    const context=canvas.getContext('2d'); if(!context)throw new Error('Logo image processing is unavailable on this device.');
    context.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,side,side);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.86));
    if(!blob)throw new Error('Could not prepare the square logo.');
    return optimizePhoto(new File([blob],'project-logo.webp',{type:'image/webp'}),900,'image/webp',1_800_000);
  } finally { image.close(); }
}
const slugify = (value:string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);

export function StudioProjects({imageAi=false}:{imageAi?:boolean}) {
  const [projects,setProjects] = useState<Project[]>([]), [project,setProject] = useState<Project>(emptyProject());
  const [mode,setMode] = useState<'create'|'update'>('create'), [busy,setBusy] = useState(false), [error,setError] = useState(''), [notice,setNotice] = useState('');
  const [originalSlug,setOriginalSlug] = useState('');
  const [loading,setLoading] = useState(true), [question,setQuestion] = useState(''), [messages,setMessages] = useState<ChatMessage[]>([]);
  const [logoPrompt,setLogoPrompt]=useState(''),[logoPreview,setLogoPreview]=useState('');
  const [restorable,setRestorable] = useState(false);
  const logoFile=useRef<HTMLInputElement>(null);
  const sorted = useMemo(()=>[...projects].sort((a,b)=>a.title.localeCompare(b.title)),[projects]);
  const Icon = iconMap[project.icon] || Briefcase;
  const existing = projects.some(item=>item.slug===project.slug);
  useEffect(()=>{
    let active=true;
    send().then(data=>{if(!active)return; const rows=Array.isArray(data)?data:[]; setProjects(rows); const raw=localStorage.getItem(draftKey); setRestorable(Boolean(raw)); setLoading(false);}).catch(e=>{if(active){setError(e.message);setLoading(false);}});
    return()=>{active=false;};
  },[]);
  const update = (patch: Partial<Project>) => setProject(old=>({...old,...patch}));
  const startNew = () => {setProject(emptyProject());setMode('create');setOriginalSlug('');setMessages([]);setNotice('New project draft ready. Add its facts, links and design, then preview it.');setError('');};
  const open = (item:Project) => {setProject({...emptyProject(),...item,features:[...item.features],releaseDate:item.releaseDate||'',releaseLabel:item.releaseLabel||'Added to portfolio'});setMode('update');setOriginalSlug(item.slug);setMessages([]);setError('');setNotice(`${item.title} loaded for editing.`);};
  const localSave = () => {localStorage.setItem(draftKey,JSON.stringify({project,mode,originalSlug}));setRestorable(true);setNotice('Editor draft saved on this device. It has not changed the live website.');};
  const localRestore = () => {try{const data=JSON.parse(localStorage.getItem(draftKey)||'{}');if(data.project){setProject({...emptyProject(),...data.project});setMode(data.mode==='update'?'update':'create');setOriginalSlug(data.originalSlug||'');setNotice('Device draft restored.');setError('');}}catch{setError('Saved editor draft could not be opened.');}};
  const askAi = async () => {
    if(!question.trim()||busy)return;
    const userMessage=question.trim(); const history=[...messages,{role:'user' as const,content:userMessage}];
    setMessages(history);setQuestion('');setBusy(true);setError('');setNotice('');
    try{
      const result=await send({action:'ai',message:userMessage,messages,project});
      setMessages([...history,{role:'assistant',content:result.reply||'I could not prepare a response.'}]);
      if(result.project){setProject(old=>({...old,...result.project,features:Array.isArray(result.project.features)?result.project.features:old.features}));setNotice(`AI suggestion added to the editable draft${result.model?` · ${result.model}`:''}. Review it before publishing.`);}
    }catch(e){setMessages(history);setError((e as Error).message);}
    finally{setBusy(false);}
  };
  const uploadLogoData = async (data:string) => {
    const saved=await studioSend({action:'upload-image',data});
    update({logo:saved.src});setLogoPreview('');setNotice('Logo uploaded. It will appear on the project card after you publish the project update.');
  };
  const chooseLogo = async (file?:File) => {
    if(!file)return;
    setBusy(true);setError('');setNotice('');
    try{const image=await optimizePhoto(file,900,'image/webp',1_800_000);await uploadLogoData(image.data);}
    catch(e){setError((e as Error).message);}
    finally{setBusy(false);if(logoFile.current)logoFile.current.value='';}
  };
  const generateLogo = async () => {
    if(!project.title.trim()){setError('Project name pehle add karo, phir AI logo bana dega.');return;}
    setBusy(true);setError('');setNotice('');
    try{
      const result=await studioSend({action:'image-preview',mode:'generate',topic:`Square project logo emblem for ${project.title} — ${project.category||'digital project'}`,width:512,height:512,instructions:`Create a clean, recognizable square app emblem, not a full poster or social thumbnail. Use one strong central symbol inspired by the project's real subject. Premium Farhan Balouch portfolio style: deep navy, warm gold and restrained teal; crisp contrast, simple silhouette, roomy margins. No words, letters, fake brand names, watermark or copied trademarks. Keep it readable at small icon size. ${logoPrompt.trim()}`});
      const image=await squareWebp(result.data,result.mime);setLogoPreview(image.preview);setNotice('AI logo preview ready. Review it, then tap “Use this logo” to upload it.');
    }catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  };
  const useGeneratedLogo = async () => {if(!logoPreview)return;setBusy(true);setError('');try{const data=logoPreview.split(',')[1];await uploadLogoData(data);}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  const publish = async () => {
    setBusy(true);setError('');setNotice('');
    try{
      const saveMode=mode==='create'?'create':'update';
      const data=await send({action:'publish',mode:saveMode,originalSlug,project:{...project,features:project.features.filter(Boolean)}});
      const refreshed=await send();setProjects(Array.isArray(refreshed)?refreshed:[]);setProject({...emptyProject(),...data.project});setMode('update');setOriginalSlug(data.project.slug);setNotice(data.message||'Website project updated. Vercel is deploying it now.');
    }catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  };
  return <section className="studio-projects">
    <div className="studio-projects-intro"><div><p className="studio-eyebrow">PORTFOLIO CONTROL ROOM</p><h2>Projects, one place.</h2><p>Add ideas, update links and status, or ask AI to shape honest project copy. Preview first, then publish.</p></div><button className="studio-primary" disabled={busy} onClick={startNew}><Plus size={16}/>New project</button></div>
    {error&&<p className="studio-error" role="alert">{error}</p>}{notice&&<p className="studio-success" role="status">{notice}</p>}
    <div className="studio-projects-grid">
      <aside className="studio-paper studio-projects-list"><div className="studio-projects-list-head"><h3>Website projects</h3><span>{projects.length}</span></div>
        {loading?<p>Loading project settings…</p>:sorted.map(item=><button key={item.slug} className={`studio-project-row ${project.slug===item.slug?'active':''}`} onClick={()=>open(item)} disabled={busy}><strong>{item.title}</strong><span>{statusText[item.status]} · {item.slug}</span></button>)}
        {!loading&&!projects.length&&<p>No projects found.</p>}
        <button className="studio-project-row studio-project-new" onClick={startNew} disabled={busy}><Plus size={15}/> Add another project</button>
        {restorable&&<button className="studio-project-restore" onClick={localRestore} disabled={busy}>Restore device draft</button>}
      </aside>
      <div className="studio-project-editor">
        <section className="studio-paper studio-project-ai"><div className="studio-project-ai-head"><Sparkles size={19}/><div><h3>Project setup AI</h3><p>Discuss the idea, request copy, or ask which template fits.</p></div></div>
          <div className="studio-project-chat" aria-live="polite">{messages.length?messages.map((item,index)=><p key={index} className={`studio-project-chat-${item.role}`}><b>{item.role==='user'?'You':'AI'}</b>{item.content}</p>):<p className="studio-project-chat-empty">Try: “Make this description clearer, but don’t invent features.”</p>}</div>
          <div className="studio-project-ask"><textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={2} maxLength={1600} placeholder="Tell AI what this project does or ask for an edit…" disabled={busy}/><button onClick={askAi} disabled={busy||!question.trim()}><Send size={15}/>{busy?'Thinking…':'Ask AI'}</button></div>
          <small>AI suggestions only change this draft. You review and publish them yourself. Uses your configured Cloudflare Workers AI account; free usage has a shared daily limit.</small>
        </section>
        <div className="studio-projects-edit-layout">
          <section className="studio-paper studio-project-form"><div className="studio-project-form-head"><h3>{mode==='create'&&!existing?'Project details':'Edit project'}</h3><div><button onClick={localSave} disabled={busy}><Save size={15}/>Save draft</button><button onClick={()=>document.querySelector('.studio-project-preview')?.scrollIntoView({behavior:'smooth',block:'start'})}><Eye size={15}/>Preview</button></div></div>
            <div className="studio-project-fields">
              <label>Project name<input maxLength={100} value={project.title} onChange={e=>update({title:e.target.value,slug:mode==='create'&&!project.slug?slugify(e.target.value):project.slug})} placeholder="SARAS City"/></label>
              <label>Project address (slug)<input maxLength={80} value={project.slug} onChange={e=>update({slug:slugify(e.target.value)})} placeholder="saras-city"/></label>
              <label>Category<input maxLength={100} value={project.category} onChange={e=>update({category:e.target.value})} placeholder="Creative technology · SARAS"/><small>Yeh card par project ki qisam batata hai, image ya URL nahi. Misal: Education, AI tool, online store.</small></label>
              <label>Status<select value={project.status} onChange={e=>update({status:e.target.value as Status})}>{Object.entries(statusText).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
              <label className="wide">Short tagline<input maxLength={180} value={project.tagline} onChange={e=>update({tagline:e.target.value})} placeholder="A new place in the SARAS universe is taking shape."/></label>
              <label className="wide">About this project<textarea rows={4} maxLength={1500} value={project.description} onChange={e=>update({description:e.target.value})} placeholder="Explain the project clearly. Use real details; avoid guesses."/></label>
              <label className="wide">Features · one per line<textarea rows={3} value={project.features.join('\n')} onChange={e=>update({features:e.target.value.split('\n').slice(0,10)})} placeholder="In development\nPreview available"/></label>
              <label>Primary link<input value={project.link||''} onChange={e=>update({link:e.target.value})} placeholder="https://example.com"/><small>Button dabane par visitor is website par jayega.</small></label>
              <label>Button text<input maxLength={80} value={project.cta} onChange={e=>update({cta:e.target.value})} placeholder="View project"/></label>
              <label>Second link (optional)<input value={project.secondaryLink||''} onChange={e=>update({secondaryLink:e.target.value})} placeholder="https://github.com/..."/></label>
              <label>Second button text<input maxLength={80} value={project.secondaryCta||''} onChange={e=>update({secondaryCta:e.target.value})} placeholder="View source code"/></label>
              <label>Show as domain<input value={project.displayUrl||''} onChange={e=>update({displayUrl:e.target.value})} placeholder="example.com"/></label>
              <div className="studio-project-logo-field wide">
                <div className="studio-project-logo-heading"><div><strong>Project logo</strong><p>Phone gallery ya computer se image chunein. Logo card par dikhega; yeh website link nahi hai.</p></div>{project.logo&&<button type="button" onClick={()=>update({logo:''})} disabled={busy}>Remove logo</button>}</div>
                <input ref={logoFile} className="studio-project-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void chooseLogo(e.target.files?.[0])} />
                <div className="studio-project-logo-actions"><button type="button" onClick={()=>logoFile.current?.click()} disabled={busy}><Briefcase size={15}/>{busy?'Working…':'Choose from gallery / device'}</button>{imageAi&&<button type="button" onClick={()=>void generateLogo()} disabled={busy||!project.title.trim()}><Sparkles size={15}/>{busy?'Creating…':'Create logo with AI'}</button>}</div>
                {logoPreview&&<div className="studio-project-logo-generated"><img src={logoPreview} alt="AI generated project logo preview"/><div><strong>AI preview</strong><small>Pasand aaye to upload karke card mein lagayein.</small><button type="button" onClick={()=>void useGeneratedLogo()} disabled={busy}>Use this logo</button><button type="button" onClick={()=>setLogoPreview('')} disabled={busy}>Discard</button></div></div>}
                {project.logo&&!logoPreview&&<div className="studio-project-logo-current"><img src={project.logo} alt="Current project logo"/><span>Current logo</span></div>}
                <label className="studio-project-logo-prompt">AI direction (optional)<textarea rows={2} maxLength={500} value={logoPrompt} onChange={e=>setLogoPrompt(e.target.value)} placeholder="Example: simple teal compass symbol, no text"/></label>
                <small className="studio-project-logo-tip">Quick guide: AI/tech → spark or circuit; education → book; store → shopping bag; movies → film. Use a square, clear logo with no tiny text. Upload an official transparent PNG/WebP when you already have the real brand logo.</small>
              </div>
              <label>Saved card template<select value={project.template||'aurora'} onChange={e=>update({template:e.target.value as Template})}>{Object.entries(templateText).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
              <label>Fallback icon · used if no logo<select value={project.icon} onChange={e=>update({icon:e.target.value as Project['icon']})}><option value="bot">AI / technology</option><option value="book">Education / story</option><option value="store">Store / business</option><option value="shield">Security</option><option value="film">Movies / media</option></select></label>
              <label>Project date (optional)<input type="date" value={project.releaseDate||''} onChange={e=>update({releaseDate:e.target.value})}/></label>
              <label>Date label<input maxLength={60} value={project.releaseLabel||''} onChange={e=>update({releaseLabel:e.target.value})} placeholder="Launched / Added to portfolio"/></label>
              <label>Google title · optional<input maxLength={65} value={project.seoTitle||''} onChange={e=>update({seoTitle:e.target.value})} placeholder={project.title||'Clear project name'}/><small>Short, accurate title. Leave blank to use the project name.</small></label>
              <label>Google description · optional<textarea rows={2} maxLength={200} value={project.seoDescription||''} onChange={e=>update({seoDescription:e.target.value})} placeholder="One clear sentence about what the project does."/><small>Describe real features in natural language.</small></label>
              <label className="wide">Search phrases · optional, one per line<textarea rows={2} maxLength={650} value={(project.keywords||[]).join('\n')} onChange={e=>update({keywords:e.target.value.split('\n').slice(0,10)})} placeholder="SARAS City companion app\nFarhan Balouch projects"/><small>Use a few relevant phrases only. Accurate details help search engines understand the project; no field can guarantee a higher ranking.</small></label>
            </div>
            <div className="studio-project-form-foot"><button className="studio-primary" disabled={busy} onClick={publish}><Send size={15}/>{busy?'Publishing…':'Publish website update'}</button><p>Publishes this project list to GitHub main; Vercel then builds the public page. Check the preview first.</p></div>
          </section>
          <aside className="studio-paper studio-project-preview"><div className="studio-project-preview-title"><h3>Website card preview</h3><span>{statusText[project.status]}</span></div><article className={`studio-project-card-preview template-${project.template||'aurora'}`}>
            <div className="studio-project-preview-top"><span className="studio-project-preview-logo">{logoPreview?<img src={logoPreview} alt="AI project logo preview"/>:project.logo?<img src={project.logo} alt="Project logo preview"/>:<Icon size={22}/>}</span><span className={`studio-project-status status-${project.status}`}>{statusText[project.status]}</span></div>
            <small>{project.category||'PROJECT CATEGORY'}</small><h4>{project.title||'Your project name'}</h4><strong>{project.tagline||'Your short project statement goes here.'}</strong><p>{project.description||'Add a clear explanation so visitors understand what this project does.'}</p>
            <ul>{project.features.filter(Boolean).slice(0,4).map((feature,index)=><li key={index}>{feature}</li>)}</ul><div className="studio-project-preview-actions">{project.link&&<span>{project.cta} <ExternalLink size={12}/></span>}{project.secondaryLink&&<span>{project.secondaryCta||'More'} <ExternalLink size={12}/></span>}</div>
          </article>
          <p className="studio-project-preview-note">Template preview updates as you edit. The site’s live cards keep the official layout and project links.</p></aside>
        </div>
      </div>
    </div>
  </section>;
}
