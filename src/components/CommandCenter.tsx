import { useState } from 'react';
import {
  Activity, AlertTriangle, Boxes, Building2, ChevronRight, CircleCheck, CircleX, Cloud,
  FileCode2, FolderKanban, Gauge, GitBranch, LayoutDashboard, Layers3, MoreHorizontal,
  Network, Plus, Rocket, Search, Settings, ShieldCheck, Sparkles, UploadCloud
} from 'lucide-react';

type Props={
  organizationName:string; projectName:string; environmentName:string; currentDesignName:string;
  resourceCount:number; connectionCount:number; score:number;
  onOpenEditor:()=>void; onCreateArchitecture:()=>void; onOpenScopeManager:()=>void;
};

export default function CommandCenter(p:Props){
  const[createOpen,setCreateOpen]=useState(false);
  return <div className="command-center-shell">
    <aside className="command-sidebar">
      <div className="command-brand"><div className="command-brand-mark"><Sparkles size={19}/></div><div><strong>ArchMindCanvas</strong><small>Cloud Architecture Platform</small></div></div>
      <div className="command-org"><small>ORGANIZATION</small><button onClick={p.onOpenScopeManager}><Building2 size={15}/><span>{p.organizationName}</span><ChevronRight size={13}/></button></div>
      <nav className="command-nav">
        <button className="active"><LayoutDashboard size={16}/><span>Home</span></button>
        <button><FolderKanban size={16}/><span>Projects</span><em>4</em></button>
        <button><Boxes size={16}/><span>Templates</span></button>
        <button><Activity size={16}/><span>Activity</span></button>
        <div className="nav-divider"/>
        <button><Settings size={16}/><span>Settings</span></button>
      </nav>
      <div className="command-sidebar-footer">
        <div className="org-health"><span className="health-dot"/><div><strong>Platform healthy</strong><small>All systems operational</small></div></div>
        <button className="profile-button"><span>PB</span><div><strong>Pranab Baro</strong><small>Organization Admin</small></div></button>
      </div>
    </aside>

    <main className="command-main">
      <header className="command-header">
        <div className="command-search"><Search size={16}/><input placeholder="Search architectures, projects, resources, variables..."/><kbd>⌘ K</kbd></div>
        <div className="create-menu-wrap">
          <button className="command-create" onClick={()=>setCreateOpen(v=>!v)}><Plus size={16}/> Create</button>
          {createOpen&&<div className="command-create-menu">
            <button onClick={()=>{setCreateOpen(false);p.onCreateArchitecture()}}><Network size={15}/><span><b>New Architecture</b><small>Start a blank cloud design</small></span></button>
            <button><FolderKanban size={15}/><span><b>New Project</b><small>Create an enterprise project workspace</small></span></button>
            <button><Layers3 size={15}/><span><b>New Environment</b><small>DEV, TEST, QA, STAGE or PROD</small></span></button>
            <div/>
            <button><Sparkles size={15}/><span><b>Generate with AI</b><small>Describe the architecture you need</small></span></button>
            <button><FileCode2 size={15}/><span><b>Import IaC</b><small>Terraform, Bicep or ARM</small></span></button>
            <button><UploadCloud size={15}/><span><b>Upload Diagram</b><small>Convert an architecture image later</small></span></button>
          </div>}
        </div>
      </header>

      <div className="command-content">
        <section className="command-hero">
          <div><span className="eyebrow">CLOUD ARCHITECTURE COMMAND CENTER</span><h1>Good afternoon, Pranab.</h1><p>Design, govern and deploy cloud architectures from one operational workspace.</p></div>
          <button className="continue-button" onClick={p.onOpenEditor}><Sparkles size={16}/> Continue designing <ChevronRight size={15}/></button>
        </section>

        <section className="metric-grid">
          <Metric icon={<FolderKanban size={17}/>} label="Projects" value="4" hint={`Across ${p.organizationName}`}/>
          <Metric icon={<Network size={17}/>} label="Architectures" value="12" hint={`${p.resourceCount} resources in current design`}/>
          <Metric icon={<Gauge size={17}/>} label="Architecture score" value={String(p.score)} hint="Current design health"/>
          <Metric icon={<Rocket size={17}/>} label="Deployments" value="7" hint="5 passed · 1 running · 1 failed"/>
        </section>

        <section className="command-section">
          <div className="section-head"><div><span className="section-kicker">CONTINUE DESIGNING</span><h2>Recent architectures</h2></div><button>View all <ChevronRight size={14}/></button></div>
          <div className="architecture-card-grid">
            <ArchitectureCard name={p.currentDesignName} project={p.projectName} env={p.environmentName} resources={p.resourceCount} connections={p.connectionCount} score={p.score} status="Healthy" updated="just now" current onClick={p.onOpenEditor}/>
            <ArchitectureCard name="AI Landing Zone" project="AI Engineering" env="Development" resources={19} connections={13} score={91} status="Warning" updated="2 hours ago"/>
            <ArchitectureCard name="SAP Production" project="SAP Transformation" env="Production" resources={31} connections={27} score={94} status="Healthy" updated="yesterday"/>
          </div>
        </section>

        <section className="intelligence-grid">
          <div className="command-panel architecture-health">
            <div className="panel-heading"><div><span className="section-kicker">ARCHITECTURE INTELLIGENCE</span><h2>Platform health</h2></div><button>Open governance</button></div>
            <div className="health-summary">
              <div className="health-score-ring"><strong>94</strong><span>Overall</span></div>
              <div className="health-stats">
                <div><CircleCheck size={15}/><strong>31</strong><span>Healthy checks</span></div>
                <div><AlertTriangle size={15}/><strong>4</strong><span>Warnings</span></div>
                <div><CircleX size={15}/><strong>2</strong><span>Critical</span></div>
              </div>
            </div>
            <div className="pillar-grid">
              <Pillar name="Security" value={96}/><Pillar name="Reliability" value={91}/><Pillar name="Operations" value={94}/><Pillar name="Cost efficiency" value={87}/>
            </div>
          </div>

          <div className="command-panel ai-command">
            <div className="panel-heading"><div><span className="section-kicker">ARCHMIND AI</span><h2>Architecture copilot</h2></div><Sparkles size={18}/></div>
            <div className="ai-prompt-box"><Sparkles size={16}/><input placeholder="Ask ArchMind AI about your cloud estate..."/><button>Ask</button></div>
            <div className="ai-suggestions"><button>Review my architecture against Azure WAF</button><button>Find resources missing private endpoints</button><button>Reduce estimated monthly cost</button></div>
          </div>
        </section>

        <section className="lower-grid">
          <div className="command-panel">
            <div className="panel-heading"><div><span className="section-kicker">RECENT ACTIVITY</span><h2>What changed</h2></div><button>View activity</button></div>
            <div className="activity-list">
              <ActivityRow icon={<Network size={14}/>} title={`${p.currentDesignName} modified`} detail="Architecture · just now" actor="PB"/>
              <ActivityRow icon={<ShieldCheck size={14}/>} title="Validation completed" detail={`Architecture score improved to ${p.score}`} actor="AI"/>
              <ActivityRow icon={<Rocket size={14}/>} title="Production deployment passed" detail={`${p.projectName} · ${p.environmentName}`} actor="CI"/>
            </div>
          </div>
          <div className="command-panel">
            <div className="panel-heading"><div><span className="section-kicker">DELIVERY PIPELINE</span><h2>Deployment status</h2></div><button>View deployments</button></div>
            <div className="deployment-list">
              <DeployRow status="passed" env="Production" step="Terraform apply" label="PASSED"/>
              <DeployRow status="running" env="QA" step="Terraform plan" label="RUNNING"/>
              <DeployRow status="failed" env="Development" step="Validation" label="FAILED"/>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>;
}

function Metric({icon,label,value,hint}:{icon:any;label:string;value:string;hint:string}){
  return <div className="metric-card"><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div></div>
}
function ArchitectureCard({name,project,env,resources,connections,score,status,updated,current,onClick}:{name:string;project:string;env:string;resources:number;connections:number;score:number;status:'Healthy'|'Warning';updated:string;current?:boolean;onClick?:()=>void}){
  return <article className={`architecture-card ${current?'current-card':''}`} onClick={onClick}>
    <div className="architecture-preview">{current&&<div className="preview-badge">CURRENT</div>}<div className="mini-node n1"/><div className="mini-node n2"/><div className="mini-node n3"/><div className="mini-node n4"/><svg viewBox="0 0 320 150" preserveAspectRatio="none"><path d="M55 75 H120 V45 H180 V105 H255" fill="none" stroke="currentColor" strokeWidth="2"/></svg></div>
    <div className="architecture-card-body">
      <div className="card-title-row"><div><h3>{name}</h3><p>{project} · {env}</p></div><button><MoreHorizontal size={16}/></button></div>
      <div className="architecture-meta"><span><Cloud size={12}/> Azure</span><span><Boxes size={12}/> {resources} resources</span><span><GitBranch size={12}/> {connections} connections</span></div>
      <div className="score-line"><span>Architecture score</span><strong>{score}</strong></div><div className="score-bar"><i style={{width:`${score}%`}}/></div>
      <div className="card-footer"><span className={`health ${status.toLowerCase()}`}>{status==='Healthy'?<CircleCheck size={12}/>:<AlertTriangle size={12}/>} {status}</span><span>Edited {updated}</span></div>
    </div>
  </article>;
}
function Pillar({name,value}:{name:string;value:number}){return <div><span>{name}</span><strong>{value}%</strong><i><b style={{width:`${value}%`}}/></i></div>}
function ActivityRow({icon,title,detail,actor}:{icon:any;title:string;detail:string;actor:string}){return <div><span className="activity-icon">{icon}</span><div><strong>{title}</strong><small>{detail}</small></div><em>{actor}</em></div>}
function DeployRow({status,env,step,label}:{status:string;env:string;step:string;label:string}){return <div><span className={`deploy-dot ${status}`}/><div><strong>{env}</strong><small>{step}</small></div><b>{label}</b></div>}
