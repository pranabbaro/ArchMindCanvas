import { useMemo, useState } from 'react';
import {
  Boxes, CheckCircle2, ChevronRight, Cloud, Database, ExternalLink, Globe2, Layers3,
  Network, Search, ServerCog, ShieldCheck, Sparkles, X, Zap
} from 'lucide-react';

type Section='library'|'waf'|'references';
type Props={
  section:Section;
  onSectionChange:(section:Section)=>void;
  onClose:()=>void;
  onOpenValidation:()=>void;
  onUseStarter:(starterKey:string,title:string,href:string)=>void;
};

const wafPillars=[
  {name:'Reliability',icon:'R',summary:'Resiliency, availability, recovery and operational continuity.',href:'https://learn.microsoft.com/en-us/azure/well-architected/reliability/'},
  {name:'Security',icon:'S',summary:'Protect confidentiality, integrity and availability through layered controls.',href:'https://learn.microsoft.com/en-us/azure/well-architected/security/'},
  {name:'Cost Optimization',icon:'C',summary:'Model costs, reduce waste and optimize usage and rate efficiency.',href:'https://learn.microsoft.com/en-us/azure/well-architected/cost-optimization/'},
  {name:'Operational Excellence',icon:'O',summary:'Improve development, observability, automation and operational practices.',href:'https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/'},
  {name:'Performance Efficiency',icon:'P',summary:'Meet workload demand through efficient scaling and architecture decisions.',href:'https://learn.microsoft.com/en-us/azure/well-architected/performance-efficiency/'},
];

const categories=[
  {name:'Networking',icon:Network,summary:'Hub-spoke, Virtual WAN, private connectivity, DNS and network security.'},
  {name:'Web & Applications',icon:Globe2,summary:'App Service, API, web application and application platform patterns.'},
  {name:'Containers & AKS',icon:Boxes,summary:'AKS, container platforms, ingress and microservice architectures.'},
  {name:'AI & Machine Learning',icon:Sparkles,summary:'Azure AI, Azure OpenAI, search, ML and generative AI architectures.'},
  {name:'Data & Analytics',icon:Database,summary:'Analytics, data platforms, lakehouse, databases and streaming.'},
  {name:'Virtual Desktop',icon:Cloud,summary:'Azure Virtual Desktop, profile, identity and enterprise connectivity patterns.'},
  {name:'Hybrid & Azure Local',icon:ServerCog,summary:'Hybrid cloud, Azure Local, Arc and datacenter integration.'},
  {name:'Security',icon:ShieldCheck,summary:'Zero Trust, identity, SIEM, network and workload security patterns.'},
  {name:'Business Continuity & DR',icon:Zap,summary:'High availability, backup, disaster recovery and mission-critical patterns.'},
  {name:'SAP & Enterprise',icon:Layers3,summary:'SAP, enterprise-scale workloads and business-critical applications.'},
];

const references=[
  {starterKey:'hub-spoke',title:'Hub-spoke network topology in Azure',category:'Networking',description:'Enterprise network topology with centralized shared services and spoke workload networks.',href:'https://learn.microsoft.com/en-us/azure/architecture/networking/architecture/hub-spoke'},
  {starterKey:'aks-baseline',title:'Baseline architecture for an AKS cluster',category:'Containers & AKS',description:'A production-oriented AKS baseline covering networking, identity, ingress and operations.',href:'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/containers/aks/baseline-aks'},
  {starterKey:'multi-region-web',title:'Highly available multi-region web application',category:'Web & Applications',description:'Patterns for resilient web applications distributed across Azure regions.',href:'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/app-service-web-app/multi-region'},
  {starterKey:'avd-enterprise',title:'Azure Virtual Desktop for the enterprise',category:'Virtual Desktop',description:'Enterprise AVD architecture considerations for identity, networking, profiles and operations.',href:'https://learn.microsoft.com/en-us/azure/architecture/example-scenario/avd/windows-virtual-desktop'},
  {title:'Generative AI with Azure OpenAI',category:'AI & Machine Learning',description:'Reference guidance for building enterprise generative AI solutions on Azure.',href:'https://learn.microsoft.com/en-us/azure/architecture/ai-ml/'},
  {title:'SAP workload architecture on Azure',category:'SAP & Enterprise',description:'Architecture guidance for highly available SAP workloads running on Azure.',href:'https://learn.microsoft.com/en-us/azure/architecture/guide/sap/'},
  {title:'Disaster recovery for Azure applications',category:'Business Continuity & DR',description:'Design guidance for resilient applications and regional disaster recovery.',href:'https://learn.microsoft.com/en-us/azure/architecture/framework/resiliency/overview'},
  {title:'DevSecOps for infrastructure as code',category:'Security',description:'GitHub-based DevSecOps pipeline patterns for validating and deploying infrastructure as code.',href:'https://learn.microsoft.com/en-us/azure/architecture/solution-ideas/articles/devsecops-infrastructure-as-code'},
];

const open=(href:string)=>window.open(href,'_blank','noopener,noreferrer');

export default function ArchitectureToolsDrawer({section,onSectionChange,onClose,onOpenValidation,onUseStarter}:Props){
  const[query,setQuery]=useState('');
  const[category,setCategory]=useState('All');

  const filteredReferences=useMemo(()=>references.filter(r=>{
    const q=query.trim().toLowerCase();
    return (!q||`${r.title} ${r.category} ${r.description}`.toLowerCase().includes(q))&&(category==='All'||r.category===category);
  }),[query,category]);

  return <div className="architecture-tools-drawer">
    <div className="architecture-tools-drawer-head">
      <div><strong>Architecture Tools</strong><small>Microsoft guidance + ArchMindCanvas intelligence</small></div>
      <button onClick={onClose} aria-label="Close"><X size={16}/></button>
    </div>

    <div className="architecture-tools-tabs">
      <button className={section==='library'?'active':''} onClick={()=>onSectionChange('library')}>Library</button>
      <button className={section==='waf'?'active':''} onClick={()=>onSectionChange('waf')}>Well-Architected</button>
      <button className={section==='references'?'active':''} onClick={()=>onSectionChange('references')}>References</button>
    </div>

    {section==='library'&&<div className="architecture-tools-content">
      <div className="architecture-library-hero">
        <div className="ms-badge">MICROSOFT AZURE</div>
        <h2>Architecture Library</h2>
        <p>Explore established Azure patterns, workload guidance, solution ideas and reference architectures.</p>
        <button onClick={()=>open('https://learn.microsoft.com/en-us/azure/architecture/')}><ExternalLink size={13}/> Open Azure Architecture Center</button>
      </div>

      <div className="architecture-tools-search"><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search architecture areas..."/></div>
      <div className="architecture-category-grid">
        {categories.filter(c=>!query||`${c.name} ${c.summary}`.toLowerCase().includes(query.toLowerCase())).map(c=>{
          const Icon=c.icon;
          return <button key={c.name} onClick={()=>{setCategory(c.name);onSectionChange('references')}}>
            <span className="architecture-category-icon"><Icon size={16}/></span>
            <span><strong>{c.name}</strong><small>{c.summary}</small></span>
            <ChevronRight size={13}/>
          </button>
        })}
      </div>

      <button className="browse-complete-catalog" onClick={()=>open('https://learn.microsoft.com/en-us/azure/architecture/browse/')}>
        <span><strong>Browse complete Microsoft catalog</strong><small>Open the current Azure Architecture Center catalog in Microsoft Learn.</small></span>
        <ExternalLink size={14}/>
      </button>
    </div>}

    {section==='waf'&&<div className="architecture-tools-content">
      <div className="architecture-library-hero waf">
        <div className="ms-badge">AZURE WELL-ARCHITECTED FRAMEWORK</div>
        <h2>Design across five pillars</h2>
        <p>Use Microsoft guidance to balance workload quality, risks and architectural tradeoffs.</p>
        <div className="waf-actions">
          <button onClick={()=>open('https://learn.microsoft.com/en-us/azure/well-architected/')}><ExternalLink size={13}/> Open framework</button>
          <button className="secondary" onClick={onOpenValidation}><CheckCircle2 size={13}/> Review current design</button>
        </div>
      </div>

      <div className="waf-pillar-list">
        {wafPillars.map(p=><button key={p.name} onClick={()=>open(p.href)}>
          <span className="waf-pillar-letter">{p.icon}</span>
          <span><strong>{p.name}</strong><small>{p.summary}</small></span>
          <ExternalLink size={13}/>
        </button>)}
      </div>
      <div className="microsoft-reference-note">
        <ShieldCheck size={14}/>
        <span><strong>Microsoft reference guidance</strong><small>ArchMindCanvas links to Microsoft guidance; any editable design you create remains your architecture, not an official Microsoft-produced design.</small></span>
      </div>
    </div>}

    {section==='references'&&<div className="architecture-tools-content">
      <div className="architecture-reference-heading">
        <div><div className="ms-badge">REFERENCE ARCHITECTURES</div><h2>Azure reference designs</h2><p>Starting points and examples to adapt to your own workload requirements.</p></div>
        <button onClick={()=>open('https://learn.microsoft.com/en-us/azure/architecture/browse/')}><ExternalLink size={13}/> Full catalog</button>
      </div>

      <div className="architecture-tools-search"><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search reference architectures..."/></div>
      <div className="reference-filter-row">
        {['All','Networking','Web & Applications','Containers & AKS','Virtual Desktop','AI & Machine Learning','Security','Business Continuity & DR','SAP & Enterprise'].map(c=><button className={category===c?'active':''} key={c} onClick={()=>setCategory(c)}>{c}</button>)}
      </div>

      <div className="reference-card-list">
        {filteredReferences.map(r=><article key={r.title}>
          <div className="reference-card-top"><span>Microsoft reference</span><em>{r.category}</em></div>
          <h3>{r.title}</h3>
          <p>{r.description}</p>
          <div className="reference-card-actions">
            <button onClick={()=>open(r.href)}><ExternalLink size={12}/> View reference</button>
            {'starterKey' in r&&r.starterKey
              ?<button className="secondary starter-enabled" onClick={()=>onUseStarter(r.starterKey!,r.title,r.href)}>Use as starting point</button>
              :<button className="secondary" disabled title="Starter mapping is not available for this reference yet">Coming soon</button>}
          </div>
        </article>)}
        {!filteredReferences.length&&<div className="reference-empty">No reference architectures match this filter.</div>}
      </div>
    </div>}
  </div>;
}
