import { ArrowDownToLine, ArrowUpRight, Check, Laptop, Mic, ShoppingBag, Smartphone, Sparkles } from 'lucide-react';
import { projects } from '@/data/content';
import { projectDate, projectMilestones } from '@/lib/project-meta';
import { Reveal } from './Reveal';
import './project-spotlights.css';

export function ProjectSpotlights() {
  const list = projects.filter(project => project.featuredOrder && project.featuredOrder < 3).sort((a, b) => a.featuredOrder! - b.featuredOrder!);
  return <section className="project-spotlights" aria-labelledby="selected-projects">
    <Reveal><div className="project-section-heading"><p>BUILT WITH CURIOSITY. SHARED WITH YOU.</p><h2 id="selected-projects">Ideas that became <em>real things.</em></h2><span>Three projects from my world. Explore what they do, and find your way in.</span></div></Reveal>
    {list.map(project => {
      const saras = project.slug === 'saras', milestone = projectMilestones[project.slug];
      return <Reveal key={project.slug}><article id={project.slug} className={`project-spotlight ${saras ? 'project-saras' : 'project-deals'}`}>
        <div className="project-card-copy">
          <div className="project-card-topline"><span>0{project.featuredOrder} / {project.category}</span><span className="project-live"><i />{saras ? 'Development preview' : 'Live'}</span></div>
          <div className="project-brand">{saras ? <><img src={project.logo} alt="SARAS Next official logo" width="66" height="66" loading="lazy" /><span>SARAS<span>NEXT</span></span></> : <img src={project.logo} alt="Farhan Deals official logo" width="190" height="86" loading="lazy" />}</div>
          <p className="project-kicker">{saras ? 'A LITTLE PRESENCE. A MORE CAPABLE COMPUTER.' : 'FROM AHMADPUR EAST, TO THE DIGITAL WORLD.'}</p>
          <h3>{saras ? <>Your computer.<br /><em>A little closer.</em></> : <>Big ideas.<br /><em>Better discoveries.</em></>}</h3>
          <p className="project-card-intro">{saras ? 'Meet SARAS Next: my Windows companion with a separate mobile controller. Pair your phone, connect to your PC and explore supported voice and remote actions.' : 'Farhan Deals is my online shopping and e-commerce project. A business born in Ahmadpur East, Pakistan, bringing my curiosity about products and digital business to life.'}</p>
          <ul className="project-feature-tags">{project.features.slice(0, 3).map(feature => <li key={feature}><Check size={12} />{feature}</li>)}</ul>
          <p className="project-release">{milestone.label} <time dateTime={milestone.date}>{projectDate(milestone.date)}</time>{saras && <span> · v2.0.0-dev.8</span>}</p>
          <div className="project-cta-row"><a href={project.link!} target="_blank" rel="noopener noreferrer" className="project-primary-link">{project.cta}<ArrowUpRight size={18} /></a>
            {project.secondaryLink && <a className="project-secondary-link" href={project.secondaryLink} target="_blank" rel="noopener noreferrer"><ArrowDownToLine size={15} />{project.secondaryCta}</a>}
          </div><span className="project-domain">{project.displayUrl}</span>
          {saras && <p className="project-requirement">Windows 10/11 Companion required. Your PC must stay awake, online and running SARAS. Preview features vary by version.</p>}
        </div>
        {saras ? <div className="project-art saras-art" aria-hidden="true"><div className="saras-orbit saras-orbit-one" /><div className="saras-orbit saras-orbit-two" /><div className="saras-orbit saras-orbit-three" />
          <div className="saras-desktop"><div className="project-window-bar"><i /><i /><i /><span>SARAS COMPANION</span></div><div className="saras-desktop-screen"><img src={project.logo} alt="" width="85" height="85" loading="lazy" /><strong>A little more possible.</strong><span>YOUR VOICE. YOUR COMPUTER.</span><div className="saras-wave">{Array.from({ length: 15 }, (_, i) => <i key={i} style={{ animationDelay: `${i * -.13}s` }} />)}</div><div className="saras-action-pills"><span><Mic size={12} />Voice</span><span><Laptop size={12} />Windows</span></div></div></div>
          <div className="saras-phone"><div /><Smartphone size={20} /><strong>Connected.</strong><span>Your PC, within reach.</span><div className="saras-phone-button"><Mic size={20} /></div></div><div className="project-floating-note"><Check size={16} />Paired with your approval</div>
        </div> : <div className="project-art deals-art" aria-hidden="true"><div className="deals-orbit" /><div className="deals-orbit deals-orbit-alt" /><div className="deals-display"><div className="project-window-bar"><i /><i /><i /><span>FARHAN DEALS</span></div><div className="deals-store-screen"><img src={project.logo} alt="" width="190" height="86" loading="lazy" /><div className="deals-store-line" /><div className="deals-product-grid"><div><ShoppingBag size={28} /><span>DISCOVER</span></div><div><Sparkles size={28} /><span>EXPLORE</span></div><div><ShoppingBag size={28} /><span>FIND YOUR NEXT</span></div></div><span className="deals-store-foot">AN IDEA. A STORE. A NEW CHAPTER.</span></div></div><div className="deals-bag"><ShoppingBag size={52} strokeWidth={1.2} /><span>FD.</span></div><div className="project-floating-note"><Sparkles size={15} />Built by Farhan Balouch</div></div>}
      </article></Reveal>;
    })}
  </section>;
}
