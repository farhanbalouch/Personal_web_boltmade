import { useEffect, useMemo, useState } from 'react';
import { Bot, BookOpen, Briefcase, ExternalLink, Eye, Plus, Save, Send, Sparkles, Store, Film, ShieldCheck } from 'lucide-react';
import { parseStudioResponse } from '@/lib/studio-response';
import './studio-projects.css';

type Status = 'live' | 'coming-soon' | 'preview' | 'placeholder';
type Template = 'aurora' | 'glass' | 'editorial' | 'minimal';
type Project = {
  slug: string; title: string; category: string; tagline: string; description: string; features: string[];
  link: string | null; displayUrl: string | null; cta: string; status: Status; icon: 'bot'|'book'|'store'|'shield'|'film';
  logo?: string | null; secondaryLink?: string | null; secondaryCta?: string | null; releaseDate?: string; releaseLabel?: string;
  featuredOrder?: number; spotlight?: boolean; showcase?: boolean; template?: Template;
};
type ChatMessage = { role: 'user'|'assistant'; content: string };
const draftKey = 'farhan-studio-project-editor-v1';
const emptyProject = (): Project => ({slug:'',title:'',category:'',tagline:'',description:'',features:[],link:'',displayUrl:'',cta:'Explore project',status:'coming-soon',icon:'bot',template:'aurora',logo:'',secondaryLink:'',secondaryCta:'',releaseDate:'',releaseLabel:'Added to portfolio'});
const statusText: Record<Status,string> = {live:'Live','coming-soon':'Coming soon',preview:'Preview',placeholder:'Placeholder'};
const templateText: Record<Template,string> = {aurora:'Aurora glow',glass:'Glass',editorial:'Editorial',minimal:'Minimal'};
const iconMap = {bot:Bot,book:BookOpen,store:Store,shield:ShieldCheck,film:Film};
async function send(body?: object) {
  return parseStudioResponse(await fetch('/api/projects', body ? {method:'POST',cache:'no-store',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {cache:'no-store',credentials:'same-origin'}));
}
const slugify = (value:string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80);

export function StudioProjects() {
  const [projects,setProjects] = useState<Project[]>([]), [project,setProject] = useState<Project>(emptyProject());
  const [mode,setMode] = useState<'create'|'update'>('create'), [busy,setBusy] = useState(false), [error,setError] = useState(''), [notice,setNotice] = useState('');
  const [originalSlug,setOriginalSlug] = useState('');
  const [loading,setLoading] = useState(true), [question,setQuestion] = useState(''), [messages,setMessages] = useState<ChatMessage[]>([]);
  const [restorable,setRestorable] = useState(false);
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
              <label>Category<input maxLength={100} value={project.category} onChange={e=>update({category:e.target.value})} placeholder="Creative technology · SARAS"/></label>
              <label>Status<select value={project.status} onChange={e=>update({status:e.target.value as Status})}>{Object.entries(statusText).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
              <label className="wide">Short tagline<input maxLength={180} value={project.tagline} onChange={e=>update({tagline:e.target.value})} placeholder="A new place in the SARAS universe is taking shape."/></label>
              <label className="wide">About this project<textarea rows={4} maxLength={1500} value={project.description} onChange={e=>update({description:e.target.value})} placeholder="Explain the project clearly. Use real details; avoid guesses."/></label>
              <label className="wide">Features · one per line<textarea rows={3} value={project.features.join('\n')} onChange={e=>update({features:e.target.value.split('\n').slice(0,10)})} placeholder="In development\nPreview available"/></label>
              <label>Primary link<input value={project.link||''} onChange={e=>update({link:e.target.value})} placeholder="https://example.com"/></label>
              <label>Button text<input maxLength={80} value={project.cta} onChange={e=>update({cta:e.target.value})} placeholder="View project"/></label>
              <label>Second link (optional)<input value={project.secondaryLink||''} onChange={e=>update({secondaryLink:e.target.value})} placeholder="https://github.com/..."/></label>
              <label>Second button text<input maxLength={80} value={project.secondaryCta||''} onChange={e=>update({secondaryCta:e.target.value})} placeholder="View source code"/></label>
              <label>Show as domain<input value={project.displayUrl||''} onChange={e=>update({displayUrl:e.target.value})} placeholder="example.com"/></label>
              <label>Logo path or https URL<input value={project.logo||''} onChange={e=>update({logo:e.target.value})} placeholder="/projects/saras.svg"/></label>
              <label>Saved card template<select value={project.template||'aurora'} onChange={e=>update({template:e.target.value as Template})}>{Object.entries(templateText).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
              <label>Project icon<select value={project.icon} onChange={e=>update({icon:e.target.value as Project['icon']})}><option value="bot">AI / technology</option><option value="book">Education / story</option><option value="store">Store / business</option><option value="shield">Security</option><option value="film">Movies / media</option></select></label>
              <label>Project date (optional)<input type="date" value={project.releaseDate||''} onChange={e=>update({releaseDate:e.target.value})}/></label>
              <label>Date label<input maxLength={60} value={project.releaseLabel||''} onChange={e=>update({releaseLabel:e.target.value})} placeholder="Launched / Added to portfolio"/></label>
            </div>
            <div className="studio-project-form-foot"><button className="studio-primary" disabled={busy} onClick={publish}><Send size={15}/>{busy?'Publishing…':'Publish website update'}</button><p>Publishes this project list to GitHub main; Vercel then builds the public page. Check the preview first.</p></div>
          </section>
          <aside className="studio-paper studio-project-preview"><div className="studio-project-preview-title"><h3>Website card preview</h3><span>{statusText[project.status]}</span></div><article className={`studio-project-card-preview template-${project.template||'aurora'}`}>
            <div className="studio-project-preview-top"><span className="studio-project-preview-logo">{project.logo?<img src={project.logo} alt="Project logo preview"/>:<Icon size={22}/>}</span><span className={`studio-project-status status-${project.status}`}>{statusText[project.status]}</span></div>
            <small>{project.category||'PROJECT CATEGORY'}</small><h4>{project.title||'Your project name'}</h4><strong>{project.tagline||'Your short project statement goes here.'}</strong><p>{project.description||'Add a clear explanation so visitors understand what this project does.'}</p>
            <ul>{project.features.filter(Boolean).slice(0,4).map((feature,index)=><li key={index}>{feature}</li>)}</ul><div className="studio-project-preview-actions">{project.link&&<span>{project.cta} <ExternalLink size={12}/></span>}{project.secondaryLink&&<span>{project.secondaryCta||'More'} <ExternalLink size={12}/></span>}</div>
          </article>
          <p className="studio-project-preview-note">Template preview updates as you edit. The site’s live cards keep the official layout and project links.</p></aside>
        </div>
      </div>
    </div>
  </section>;
}
