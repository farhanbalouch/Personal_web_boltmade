import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useRouter } from '@/router';
import { useLanguage } from '@/context/LanguageContext';
import './site-guide.css';
type Source={title:string;url:string};
type Message={role:'user'|'assistant';text:string;sources?:Source[];verified?:boolean};
export function SiteGuide(){
 const [open,setOpen]=useState(false),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[messages,setMessages]=useState<Message[]>([]),[indexed,setIndexed]=useState('');
 const {route}=useRouter(),{language}=useLanguage();const field=useRef<HTMLInputElement>(null),bottom=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(open)field.current?.focus();},[open]);
 useEffect(()=>{if(open)bottom.current?.scrollIntoView({block:'nearest'});},[messages,busy,open]);
 useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);button.current?.focus();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[open]);
 async function ask(question:string){if(busy||!question.trim())return;setBusy(true);setError('');setInput('');setMessages(m=>[...m.slice(-11),{role:'user',text:question}]);
  try{const r=await fetch('/api/guide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,page:route.path,language}),signal:AbortSignal.timeout(60000)});const data=await r.json();if(!r.ok)throw new Error(data.error||'Try again in a moment.');setMessages(m=>[...m,{role:'assistant',text:data.reply,sources:data.sources,verified:data.verifiedExcerpt}]);setIndexed(data.indexedAt||'');}
  catch(e){setError((e as Error).message||'The guide is unavailable.');}finally{setBusy(false);}
 }
 return <div className="site-guide">
  {open&&<section id="site-guide-panel" className="site-guide-panel" role="dialog" aria-label="Farhan website AI guide">
   <header><span className="site-guide-avatar"><Sparkles size={20}/></span><div><strong>Your quick site guide</strong><small>Short answers. Real page links.</small></div><button type="button" aria-label="Close site guide" onClick={()=>{setOpen(false);button.current?.focus();}}><X size={19}/></button></header>
   <div className="site-guide-scroll"><p className="site-guide-intro">Kya dhoond rahe ho? Ask about Farhan, a page, a project or a recent update.</p>
    {!messages.length&&<div className="site-guide-suggestions">{['MovieHub kahan hai?','Latest blog posts','Farhan ki story'].map(q=><button type="button" key={q} disabled={busy} onClick={()=>void ask(q)}>{q}<ChevronRight size={15}/></button>)}</div>}
    <div role="log" aria-live="polite" aria-relevant="additions">{messages.map((m,i)=><div key={i} className={`site-guide-message ${m.role}`}><p>{m.text}</p>{m.verified&&<small className="site-guide-verified">From the published website</small>}{m.sources?.length ? <div className="site-guide-sources">{m.sources.map(s=><a href={s.url} key={s.url} onClick={()=>setOpen(false)}>{s.title}<ArrowUpRight size={13}/></a>)}</div>:null}</div>)}</div>
    {busy&&<p role="status" className="site-guide-thinking">Finding the right page<span>…</span></p>}{error&&<p role="alert" className="site-guide-error">{error}</p>}<div ref={bottom}/>
   </div>
   <form onSubmit={e=>{e.preventDefault();void ask(input);}}><label className="sr-only" htmlFor="site-guide-question">Ask the site guide</label><input ref={field} id="site-guide-question" value={input} onChange={e=>setInput(e.target.value)} maxLength={800} placeholder="Ask a quick question…" disabled={busy}/><button type="submit" aria-label="Send question" disabled={busy||!input.trim()}><Send size={17}/></button></form>
   <footer><a href="https://rawi.farhanbalouch.com" target="_blank" rel="noreferrer">Want a longer conversation? Open Rawi ↗</a>{indexed&&<span>Site index: {new Date(indexed).toLocaleDateString()}</span>}</footer>
  </section>}
  <button ref={button} type="button" className="site-guide-launcher" aria-label={open?'Close AI site guide':'Open AI site guide'} aria-expanded={open} aria-controls="site-guide-panel" onClick={()=>setOpen(v=>!v)}>{open?<X size={22}/>:<Sparkles size={22}/>}<span>Ask site AI</span><i/></button>
 </div>;
}
