import { useMemo, useState } from 'react';
import {
  Boxes, Braces, ChevronDown, ChevronRight, Copy, GitBranch, Info, Plus,
  Trash2, Variable
} from 'lucide-react';
import type {
  ArchitectureMetadata, ArchitectureModuleDefinition, ArchitectureOutputDefinition,
  ArchitectureNode, LocalDefinition, VariableDefinition
} from '../types';

type Props={
  metadata:ArchitectureMetadata;
  outputs:ArchitectureOutputDefinition[];
  modules:ArchitectureModuleDefinition[];
  variables:VariableDefinition[];
  locals:LocalDefinition[];
  resources:ArchitectureNode[];
  onMetadataChange:(m:ArchitectureMetadata)=>void;
  onOutputsChange:(v:ArchitectureOutputDefinition[])=>void;
  onModulesChange:(v:ArchitectureModuleDefinition[])=>void;
};

const uid=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const safe=(x:string)=>x.trim().replace(/[^a-zA-Z0-9_]/g,'_').replace(/^([0-9])/,'_$1');

export default function ArchitectureModelPanel(p:Props){
  const[tab,setTab]=useState<'metadata'|'outputs'|'modules'|'dependencies'>('metadata');

  const dependencyRows=useMemo(()=>{
    const rows:{from:string;to:string;via:string}[]=[];
    p.resources.forEach(r=>{
      Object.entries(r.data.bindings||{}).forEach(([field,b])=>{
        if(b.source==='resource'&&b.targetNodeId){
          const target=p.resources.find(x=>x.id===b.targetNodeId);
          rows.push({from:r.data.label,to:target?.data.label||'Missing resource',via:field});
        }
        if(b.source==='variable'&&b.variableName)rows.push({from:r.data.label,to:`var.${b.variableName}`,via:field});
        if(b.source==='local'&&b.localName)rows.push({from:r.data.label,to:`local.${b.localName}`,via:field});
        if(b.source==='moduleOutput'&&b.moduleName)rows.push({from:r.data.label,to:`module.${b.moduleName}.${b.moduleOutput||'output'}`,via:field});
      });
    });
    return rows;
  },[p.resources]);

  const patchMetadata=(key:keyof ArchitectureMetadata,value:any)=>p.onMetadataChange({...p.metadata,[key]:value});
  const tagsString=Object.entries(p.metadata.tags||{}).map(([k,v])=>`${k}=${v}`).join('; ');
  const setTags=(raw:string)=>patchMetadata('tags',Object.fromEntries(raw.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return i>0?[x.slice(0,i).trim(),x.slice(i+1).trim()]:[x,'']})));

  return <div className="architecture-model-panel">
    <div className="model-panel-head">
      <div><strong>Architecture Model</strong><small>Metadata, outputs, modules and dependency intelligence.</small></div>
    </div>

    <div className="model-tabs">
      <button className={tab==='metadata'?'active':''} onClick={()=>setTab('metadata')}><Info size={13}/> Metadata</button>
      <button className={tab==='outputs'?'active':''} onClick={()=>setTab('outputs')}><Braces size={13}/> Outputs <span>{p.outputs.length}</span></button>
      <button className={tab==='modules'?'active':''} onClick={()=>setTab('modules')}><Boxes size={13}/> Modules <span>{p.modules.length}</span></button>
      <button className={tab==='dependencies'?'active':''} onClick={()=>setTab('dependencies')}><GitBranch size={13}/> Dependencies <span>{dependencyRows.length}</span></button>
    </div>

    {tab==='metadata'&&<div className="model-body">
      <div className="model-grid">
        <label className="span-2">Description<textarea rows={3} value={p.metadata.description} onChange={e=>patchMetadata('description',e.target.value)} placeholder="Purpose and scope of this architecture..."/></label>
        <label>Owner<input value={p.metadata.owner} onChange={e=>patchMetadata('owner',e.target.value)} placeholder="Cloud Platform Team"/></label>
        <label>Application<input value={p.metadata.application} onChange={e=>patchMetadata('application',e.target.value)} placeholder="Customer Portal"/></label>
        <label>Business unit<input value={p.metadata.businessUnit} onChange={e=>patchMetadata('businessUnit',e.target.value)} placeholder="Digital"/></label>
        <label>Cost center<input value={p.metadata.costCenter} onChange={e=>patchMetadata('costCenter',e.target.value)} placeholder="CC100"/></label>
        <label>Criticality<select value={p.metadata.criticality} onChange={e=>patchMetadata('criticality',e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Mission Critical</option></select></label>
        <label>Lifecycle<select value={p.metadata.lifecycle} onChange={e=>patchMetadata('lifecycle',e.target.value)}><option>Experimental</option><option>Development</option><option>Production</option><option>Retired</option></select></label>
        <label>Architecture version<input value={p.metadata.version} onChange={e=>patchMetadata('version',e.target.value)} placeholder="1.0.0"/></label>
        <label className="span-2">Architecture tags<input value={tagsString} onChange={e=>setTags(e.target.value)} placeholder="Environment=Production; Owner=Platform; CostCenter=CC100"/><small>Semicolon-separated key=value pairs.</small></label>
      </div>
    </div>}

    {tab==='outputs'&&<div className="model-body">
      <div className="model-toolbar"><div><strong>Terraform Outputs</strong><small>Expose reusable architecture values.</small></div><button onClick={()=>p.onOutputsChange([...p.outputs,{id:uid('out'),name:`output_${p.outputs.length+1}`,value:'',description:'',sensitive:false}])}><Plus size={13}/> Add Output</button></div>
      {!p.outputs.length&&<Empty title="No architecture outputs" text="Add IDs, endpoints, IPs or other values that downstream architectures and pipelines need."/>}
      {p.outputs.map((o,i)=><div className="model-card" key={o.id}>
        <div className="model-card-title"><strong>output.{o.name}</strong><button onClick={()=>p.onOutputsChange(p.outputs.filter(x=>x.id!==o.id))}><Trash2 size={13}/></button></div>
        <div className="model-grid">
          <label>Name<input value={o.name} onChange={e=>p.onOutputsChange(p.outputs.map(x=>x.id===o.id?{...x,name:safe(e.target.value)}:x))}/></label>
          <label className="span-2">Value / expression<input value={o.value} onChange={e=>p.onOutputsChange(p.outputs.map(x=>x.id===o.id?{...x,value:e.target.value}:x))} placeholder="azurerm_virtual_network.vnet_prod.id"/></label>
          <label className="span-2">Description<input value={o.description||''} onChange={e=>p.onOutputsChange(p.outputs.map(x=>x.id===o.id?{...x,description:e.target.value}:x))}/></label>
          <label className="model-check"><input type="checkbox" checked={Boolean(o.sensitive)} onChange={e=>p.onOutputsChange(p.outputs.map(x=>x.id===o.id?{...x,sensitive:e.target.checked}:x))}/> Sensitive</label>
        </div>
      </div>)}
    </div>}

    {tab==='modules'&&<div className="model-body">
      <div className="model-toolbar"><div><strong>Terraform Modules</strong><small>Registry, Git and private reusable infrastructure modules.</small></div><button onClick={()=>p.onModulesChange([...p.modules,{id:uid('mod'),name:`module_${p.modules.length+1}`,source:'',version:'',description:'',inputs:{}}])}><Plus size={13}/> Add Module</button></div>
      {!p.modules.length&&<Empty title="No modules configured" text="Add a Terraform Registry or Git module and bind module inputs to variables, locals or resource values."/>}
      {p.modules.map(m=><ModuleCard key={m.id} module={m} onChange={next=>p.onModulesChange(p.modules.map(x=>x.id===m.id?next:x))} onDelete={()=>p.onModulesChange(p.modules.filter(x=>x.id!==m.id))}/>)}
    </div>}

    {tab==='dependencies'&&<div className="model-body">
      <div className="dependency-summary">
        <div><strong>{p.resources.length}</strong><span>Resources</span></div>
        <div><strong>{dependencyRows.length}</strong><span>References</span></div>
        <div><strong>{p.variables.length}</strong><span>Effective variables</span></div>
        <div><strong>{p.modules.length}</strong><span>Modules</span></div>
      </div>
      {!dependencyRows.length&&<Empty title="No explicit dependencies detected" text="Bind resource properties using the link button to build a dependency-aware architecture model."/>}
      {!!dependencyRows.length&&<div className="dependency-table">
        <div className="dependency-row header"><span>From</span><span>Reference</span><span>Via</span></div>
        {dependencyRows.map((d,i)=><div className="dependency-row" key={`${d.from}-${d.to}-${i}`}><span>{d.from}</span><span>{d.to}</span><span>{d.via}</span></div>)}
      </div>}
    </div>}
  </div>;
}

function Empty({title,text}:{title:string;text:string}){return <div className="model-empty"><Boxes size={22}/><strong>{title}</strong><span>{text}</span></div>}

function ModuleCard({module,onChange,onDelete}:{module:ArchitectureModuleDefinition;onChange:(m:ArchitectureModuleDefinition)=>void;onDelete:()=>void}){
  const[expanded,setExpanded]=useState(true);
  const[inputName,setInputName]=useState('');
  const[inputValue,setInputValue]=useState('');
  const addInput=()=>{const key=safe(inputName);if(!key)return;onChange({...module,inputs:{...module.inputs,[key]:inputValue}});setInputName('');setInputValue('')};
  return <div className="model-card">
    <div className="model-card-title module-title"><button className="module-expand" onClick={()=>setExpanded(v=>!v)}>{expanded?<ChevronDown size={13}/>:<ChevronRight size={13}/>}</button><strong>module.{module.name}</strong><button onClick={onDelete}><Trash2 size={13}/></button></div>
    {expanded&&<div className="model-grid">
      <label>Name<input value={module.name} onChange={e=>onChange({...module,name:safe(e.target.value)})}/></label>
      <label>Version<input value={module.version||''} onChange={e=>onChange({...module,version:e.target.value})} placeholder="1.2.0 (optional)"/></label>
      <label className="span-2">Source<input value={module.source} onChange={e=>onChange({...module,source:e.target.value})} placeholder="Azure/avm-res-network-virtualnetwork/azurerm or git::https://..."/></label>
      <label className="span-2">Description<input value={module.description||''} onChange={e=>onChange({...module,description:e.target.value})}/></label>
      <div className="module-inputs span-2">
        <strong>Module inputs</strong>
        {Object.entries(module.inputs).map(([k,v])=><div className="module-input-row" key={k}><code>{k}</code><input value={v} onChange={e=>onChange({...module,inputs:{...module.inputs,[k]:e.target.value}})}/><button onClick={()=>{const next={...module.inputs};delete next[k];onChange({...module,inputs:next})}}><Trash2 size={12}/></button></div>)}
        <div className="module-input-add"><input placeholder="input_name" value={inputName} onChange={e=>setInputName(e.target.value)}/><input placeholder="var.value / literal / resource.id" value={inputValue} onChange={e=>setInputValue(e.target.value)}/><button onClick={addInput}><Plus size={12}/> Add</button></div>
      </div>
    </div>}
  </div>
}
