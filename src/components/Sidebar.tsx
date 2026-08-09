import { ChevronDown, ChevronRight, Search, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getCloudCatalog, providerInfo } from '../cloud/providerRegistry';
import type { CloudProvider } from '../cloud/types';
import type { ResourceCategory } from '../types';

type Props={onAddResource:(type:string)=>void};

function ResourceIcon({iconUrl,label,FallbackIcon}:{iconUrl:string;label:string;FallbackIcon:LucideIcon}){
  const[failed,setFailed]=useState(false);
  return failed||!iconUrl?<FallbackIcon size={22}/>:<img src={iconUrl} alt={`${label} icon`} draggable={false} onError={()=>setFailed(true)}/>;
}

function ProviderLogo({provider}:{provider:CloudProvider}){
  const[failed,setFailed]=useState(false);
  const p=providerInfo[provider];
  return <span className={`cloud-provider-logo ${provider}`}>
    {!failed
      ?<img src={p.logo} alt={`${p.label} logo`} draggable={false} onError={()=>setFailed(true)}/>
      :<span className="cloud-provider-logo-fallback">{provider==='azure'?'AZ':provider==='aws'?'AWS':'GCP'}</span>}
  </span>;
}

export default function Sidebar({onAddResource}:Props){
  const[query,setQuery]=useState('');
  const[provider,setProvider]=useState<CloudProvider>(()=>(localStorage.getItem('archmind-resource-provider') as CloudProvider)||'azure');
  const[providerOpen,setProviderOpen]=useState(false);

  const current=providerInfo[provider];
  const selectedCatalog=getCloudCatalog(provider);
  const categories=selectedCatalog.categories as ResourceCategory[];
  const resourceCatalog=selectedCatalog.resources;

  const[open,setOpen]=useState<Record<ResourceCategory,boolean>>(
    ()=>Object.fromEntries((getCloudCatalog('azure').categories as ResourceCategory[]).map(c=>[c,c==='Governance'||c==='Networking'])) as Record<ResourceCategory,boolean>
  );

  const selectProvider=(next:CloudProvider)=>{
    setProvider(next);
    setProviderOpen(false);
    setQuery('');
    localStorage.setItem('archmind-resource-provider',next);
  };
  const normalized=query.trim().toLowerCase();
  const resources=useMemo(
    ()=>resourceCatalog.filter(i=>`${i.label} ${i.description} ${i.category}`.toLowerCase().includes(normalized)),
    [normalized,resourceCatalog]
  );

  return <aside className="sidebar">
    <div className="cloud-provider-selector-wrap">
      <button className="cloud-provider-selector" onClick={()=>setProviderOpen(v=>!v)} title="Select cloud provider">
        <ProviderLogo provider={provider}/>
        <span><strong>{current.resourceLabel}</strong><small>{current.label}</small></span>
        <ChevronDown size={15}/>
      </button>
      {providerOpen&&<div className="cloud-provider-menu">
        {(['azure','aws','gcp'] as CloudProvider[]).map(p=><button key={p} className={provider===p?'active':''} onClick={()=>selectProvider(p)}>
          <ProviderLogo provider={p}/>
          <span><strong>{providerInfo[p].resourceLabel}</strong><small>{providerInfo[p].label}</small></span>
          {provider===p&&<span className="provider-selected-dot"/>}
        </button>)}
      </div>}
    </div>

    {provider!=='gcp'?<>
      <div className="sidebar-heading">
        <div>
          <div className="panel-title">{provider==='azure'?'Azure resource library':'AWS resource library'}</div>
          <div className="panel-subtitle">{provider==='azure'?'Hierarchy, services and architecture elements':'Core AWS services and architecture elements'}</div>
        </div>
        <span className="count-badge">{resourceCatalog.length}</span>
      </div>
      <div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={provider==='azure'?'Search Azure resources':'Search AWS resources'}/></div>
      <div className="resource-groups">
        {categories.map(category=>{
          const items=resources.filter(i=>i.category===category);
          if(!items.length)return null;
          const expanded=normalized?true:open[category];
          return <section className="resource-group" key={category}>
            <button className="group-header" onClick={()=>setOpen(v=>({...v,[category]:!v[category]}))}>
              <span>{expanded?<ChevronDown size={15}/>:<ChevronRight size={15}/>} {category}</span><small>{items.length}</small>
            </button>
            {expanded&&<div className="resource-list">
              {items.map(resource=>{
                const canvasReady=resource.canvasReady!==false;
                return <button
                  key={resource.type}
                  className={`resource-item ${canvasReady?'':'catalog-only'}`}
                  draggable={canvasReady}
                  title={canvasReady?`Drag ${resource.label} to canvas`:`${resource.label} catalog icon loaded. AWS canvas/IaC support will be enabled in the provider-specific canvas phase.`}
                  onDoubleClick={()=>{if(canvasReady)onAddResource(resource.type)}}
                  onDragStart={e=>{
                    if(!canvasReady){e.preventDefault();return;}
                    e.dataTransfer.setData('application/cloud-resource',resource.type);
                    e.dataTransfer.effectAllowed='move';
                  }}>
                  <span className="resource-icon azure-service-icon-small"><ResourceIcon iconUrl={resource.iconUrl} label={resource.label} FallbackIcon={resource.fallbackIcon}/></span>
                  <span className="resource-copy"><strong>{resource.label}</strong><small>{resource.description}</small></span>
                  {!canvasReady&&<span className="catalog-preview-badge">ICON</span>}
                </button>;
              })}
            </div>}
          </section>;
        })}
      </div>
      {provider==='azure'
        ?<div className="sidebar-help"><strong>Tip:</strong> Drag a Subscription, Resource Group, VNet or Subnet first, then place resources inside or link hierarchy from Properties.</div>
        :<div className="sidebar-help aws-catalog-note"><strong>AWS catalog:</strong> Official AWS architecture icon set is loaded for the core services. Canvas placement will be enabled after provider-specific AWS node and IaC handling is isolated from Azure.</div>}
    </>:<div className="provider-coming-soon">
      <ProviderLogo provider={provider}/>
      <strong>{current.resourceLabel}</strong>
      <p>The {current.label} resource catalog will be added in the next multi-cloud phase.</p>
      <button onClick={()=>selectProvider('azure')}>Back to Azure Resources</button>
    </div>}
  </aside>;
}
