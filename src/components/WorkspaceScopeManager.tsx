import { useMemo, useState } from 'react';
import { Building2, FolderKanban, Layers3, Network, X } from 'lucide-react';
import VariablesManager from './VariablesManager';
import type { LocalDefinition, VariableDefinition, VariableScope } from '../types';

type ScopeData={
  id:string;
  name:string;
  variables:VariableDefinition[];
  locals:LocalDefinition[];
};

type Props={
  organization:ScopeData;
  project:ScopeData;
  environment:ScopeData;
  architecture:ScopeData;
  onOrganizationChange:(v:ScopeData)=>void;
  onProjectChange:(v:ScopeData)=>void;
  onEnvironmentChange:(v:ScopeData)=>void;
  onArchitectureChange:(v:ScopeData)=>void;
  onClose:()=>void;
};

const rank:VariableScope[]=['organization','project','environment','architecture'];
const title:Record<VariableScope,string>={
  organization:'Organization',
  project:'Project',
  environment:'Environment',
  architecture:'Architecture'
};

const withScope=(items:VariableDefinition[],scope:VariableScope)=>items.map(v=>({...v,scope}));
const withLocalScope=(items:LocalDefinition[],scope:VariableScope)=>items.map(v=>({...v,scope}));

export default function WorkspaceScopeManager({
  organization,project,environment,architecture,
  onOrganizationChange,onProjectChange,onEnvironmentChange,onArchitectureChange,onClose
}:Props){
  const[scope,setScope]=useState<VariableScope>('architecture');

  const selected=scope==='organization'?organization:scope==='project'?project:scope==='environment'?environment:architecture;
  const update=scope==='organization'?onOrganizationChange:scope==='project'?onProjectChange:scope==='environment'?onEnvironmentChange:onArchitectureChange;

  const effective=useMemo(()=>{
    const all=[
      ...withScope(organization.variables,'organization'),
      ...withScope(project.variables,'project'),
      ...withScope(environment.variables,'environment'),
      ...withScope(architecture.variables,'architecture'),
    ];
    const map=new Map<string,VariableDefinition>();
    for(const s of rank){
      all.filter(v=>v.scope===s).forEach(v=>map.set(v.name,v));
    }
    return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
  },[organization.variables,project.variables,environment.variables,architecture.variables]);

  return <div className="workspace-scope-overlay" onMouseDown={onClose}>
    <div className="workspace-scope-dialog" onMouseDown={e=>e.stopPropagation()}>
      <div className="workspace-scope-head">
        <div>
          <strong>Enterprise Scope Manager</strong>
          <small>Organization → Project → Environment → Architecture</small>
        </div>
        <button onClick={onClose}><X size={16}/></button>
      </div>

      <div className="scope-breadcrumb">
        <button className={scope==='organization'?'active':''} onClick={()=>setScope('organization')}><Building2 size={14}/><span>{organization.name}</span><small>Organization</small></button>
        <span>›</span>
        <button className={scope==='project'?'active':''} onClick={()=>setScope('project')}><FolderKanban size={14}/><span>{project.name}</span><small>Project</small></button>
        <span>›</span>
        <button className={scope==='environment'?'active':''} onClick={()=>setScope('environment')}><Layers3 size={14}/><span>{environment.name}</span><small>Environment</small></button>
        <span>›</span>
        <button className={scope==='architecture'?'active':''} onClick={()=>setScope('architecture')}><Network size={14}/><span>{architecture.name}</span><small>Architecture</small></button>
      </div>

      <div className="scope-manager-grid">
        <div className="scope-editor">
          <div className="scope-editor-title">
            <div><strong>{title[scope]} settings</strong><small>Variables declared here are inherited by lower scopes.</small></div>
            <label>Name<input value={selected.name} onChange={e=>update({...selected,name:e.target.value})}/></label>
          </div>
          <VariablesManager
            variables={selected.variables}
            locals={selected.locals}
            onVariablesChange={variables=>update({...selected,variables:withScope(variables,scope)})}
            onLocalsChange={locals=>update({...selected,locals:withLocalScope(locals,scope)})}
          />
        </div>

        <aside className="effective-values-panel">
          <div className="effective-title"><strong>Effective variables</strong><small>Most specific scope wins.</small></div>
          {!effective.length&&<div className="effective-empty">No variables declared in the hierarchy yet.</div>}
          {effective.map(v=><div className="effective-variable" key={v.name}>
            <div><code>var.{v.name}</code><span className={`scope-chip ${v.scope}`}>{title[v.scope||'architecture']}</span></div>
            <small>{v.type}{v.defaultValue!==undefined&&v.defaultValue!==''?` · ${String(v.defaultValue)}`:''}</small>
          </div>)}
          <div className="scope-precedence">
            <strong>Precedence</strong>
            <span>Architecture</span><b>›</b><span>Environment</span><b>›</b><span>Project</span><b>›</b><span>Organization</span>
          </div>
        </aside>
      </div>
    </div>
  </div>;
}
