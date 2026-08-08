import { useMemo, useState } from 'react';
import { Box, Braces, Copy, Plus, Trash2, Variable } from 'lucide-react';
import type { LocalDefinition, TerraformValueType, VariableDefinition } from '../types';

type Props={
  variables:VariableDefinition[];
  locals:LocalDefinition[];
  onVariablesChange:(v:VariableDefinition[])=>void;
  onLocalsChange:(v:LocalDefinition[])=>void;
};

const renderDefault=(v:VariableDefinition)=>{
  if(v.defaultValue===undefined||v.defaultValue==='')return undefined;
  if(v.type==='number'||v.type==='bool'||v.type==='map(string)'||v.type==='list(string)'||v.type==='any')return String(v.defaultValue);
  return JSON.stringify(String(v.defaultValue));
};
const variableBlock=(v:VariableDefinition)=>{
  const rows=[`variable "${v.name}" {`,`  type = ${v.type}`];
  if(v.description)rows.push(`  description = ${JSON.stringify(v.description)}`);
  const d=renderDefault(v); if(d!==undefined)rows.push(`  default = ${d}`);
  if(v.sensitive)rows.push('  sensitive = true');
  if(v.nullable===false)rows.push('  nullable = false');
  rows.push('}');
  return rows.join('\n');
};
const localsBlock=(items:LocalDefinition[])=>`locals {\n${items.length?items.map(x=>`  ${x.name} = ${x.value}`).join('\n'):'  # Add local values'}\n}`;

export default function VariablesManager({variables,locals,onVariablesChange,onLocalsChange}:Props){
  const[tab,setTab]=useState<'variables'|'locals'|'code'>('variables');
  const varsCode=useMemo(()=>variables.length?variables.map(variableBlock).join('\n\n'):'# No variables declared',[variables]);
  const localsCode=useMemo(()=>localsBlock(locals),[locals]);

  return <div className="variables-manager">
    <div className="variables-manager-header">
      <div><strong>Variables & Locals</strong><small>Declare reusable Terraform inputs here, then reference them from any resource property or Tags.</small></div>
      <div className="variables-manager-tabs">
        <button className={tab==='variables'?'active':''} onClick={()=>setTab('variables')}><Variable size={14}/> Variables</button>
        <button className={tab==='locals'?'active':''} onClick={()=>setTab('locals')}><Box size={14}/> Locals</button>
        <button className={tab==='code'?'active':''} onClick={()=>setTab('code')}><Braces size={14}/> Code</button>
      </div>
    </div>
    {tab==='variables'&&<div className="variables-manager-body">
      <div className="variables-toolbar"><span>{variables.length} variables</span><button onClick={()=>onVariablesChange([...variables,{name:`variable_${variables.length+1}`,type:'string',defaultValue:'',description:'',sensitive:false,nullable:true}])}><Plus size={14}/> Add variable</button></div>
      {!variables.length&&<div className="variables-empty"><Variable size={22}/><strong>No variables declared</strong><span>Add reusable inputs such as location, environment, VM size and tags.</span></div>}
      {variables.map((v,i)=><div className="variable-card" key={`${v.name}-${i}`}>
        <div className="variable-card-title"><strong>var.{v.name}</strong><button onClick={()=>onVariablesChange(variables.filter((_,x)=>x!==i))}><Trash2 size={13}/></button></div>
        <div className="variable-grid">
          <label>Name<input value={v.name} onChange={e=>onVariablesChange(variables.map((x,n)=>n===i?{...x,name:e.target.value.replace(/\s+/g,'_')}:x))}/></label>
          <label>Type<select value={v.type} onChange={e=>onVariablesChange(variables.map((x,n)=>n===i?{...x,type:e.target.value as TerraformValueType}:x))}><option>string</option><option>number</option><option>bool</option><option>list(string)</option><option>map(string)</option><option>any</option></select></label>
          <label className="span-2">Default value<textarea rows={v.type==='map(string)'||v.type==='list(string)'?4:2} value={String(v.defaultValue??'')} placeholder={v.type==='map(string)'?'{ Environment = "Production" }':'Optional default'} onChange={e=>onVariablesChange(variables.map((x,n)=>n===i?{...x,defaultValue:e.target.value}:x))}/></label>
          <label className="span-2">Description<input value={v.description||''} onChange={e=>onVariablesChange(variables.map((x,n)=>n===i?{...x,description:e.target.value}:x))}/></label>
          <label className="toggle-row"><span>Sensitive</span><input type="checkbox" checked={Boolean(v.sensitive)} onChange={e=>onVariablesChange(variables.map((x,n)=>n===i?{...x,sensitive:e.target.checked}:x))}/></label>
          <label className="toggle-row"><span>Nullable</span><input type="checkbox" checked={v.nullable!==false} onChange={e=>onVariablesChange(variables.map((x,n)=>n===i?{...x,nullable:e.target.checked}:x))}/></label>
        </div>
      </div>)}
    </div>}
    {tab==='locals'&&<div className="variables-manager-body">
      <div className="variables-toolbar"><span>{locals.length} locals</span><button onClick={()=>onLocalsChange([...locals,{name:`local_${locals.length+1}`,value:'""',description:''}])}><Plus size={14}/> Add local</button></div>
      {!locals.length&&<div className="variables-empty"><Box size={22}/><strong>No locals declared</strong><span>Add calculated or standardized reusable values.</span></div>}
      {locals.map((v,i)=><div className="variable-card" key={`${v.name}-${i}`}>
        <div className="variable-card-title"><strong>local.{v.name}</strong><button onClick={()=>onLocalsChange(locals.filter((_,x)=>x!==i))}><Trash2 size={13}/></button></div>
        <div className="variable-grid">
          <label>Name<input value={v.name} onChange={e=>onLocalsChange(locals.map((x,n)=>n===i?{...x,name:e.target.value.replace(/\s+/g,'_')}:x))}/></label>
          <label className="span-2">Value / expression<textarea rows={3} value={v.value} placeholder='merge(var.tags, { ManagedBy = "ArchMindCanvas" })' onChange={e=>onLocalsChange(locals.map((x,n)=>n===i?{...x,value:e.target.value}:x))}/></label>
          <label className="span-2">Description<input value={v.description||''} onChange={e=>onLocalsChange(locals.map((x,n)=>n===i?{...x,description:e.target.value}:x))}/></label>
        </div>
      </div>)}
    </div>}
    {tab==='code'&&<div className="variables-code">
      <div className="code-toolbar"><strong>variables.tf</strong><button onClick={()=>navigator.clipboard?.writeText(varsCode)}><Copy size={13}/> Copy</button></div><pre>{varsCode}</pre>
      <div className="code-toolbar"><strong>locals.tf</strong><button onClick={()=>navigator.clipboard?.writeText(localsCode)}><Copy size={13}/> Copy</button></div><pre>{localsCode}</pre>
    </div>}
  </div>;
}
