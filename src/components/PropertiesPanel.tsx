import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Code2, Copy, FormInput, Trash2 } from 'lucide-react';
import { resourceMap } from '../resourceCatalog';
import { getResourceSchema, schemaGroups, type PropertyField } from '../resourceSchemas';
import type { ArchitectureNodeData, ResourceType, TagMap } from '../types';

type Option={id:string;label:string};
type Props={
  data?:ArchitectureNodeData;
  onChange:(updates:Partial<ArchitectureNodeData>)=>void;
  onDelete:()=>void;
  onDuplicate:()=>void;
  hierarchy:{tenants:Option[];managementGroups:Option[];subscriptions:Option[];resourceGroups:Option[];vnets:Option[];subnets:Option[]};
  parentId?:string;
  onParentChange:(parentId?:string)=>void;
};

const tagString=(tags?:TagMap)=>Object.entries(tags||{}).map(([k,v])=>`${k}=${v}`).join('; ');
const parseTags=(value:string):TagMap=>Object.fromEntries(value.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return i>0?[x.slice(0,i).trim(),x.slice(i+1).trim()]:[x,''];}));

const builtInKeys=new Set(['label','region','sku','owner','tenantId','subscriptionName','subscriptionId','resourceGroup','vnet','subnet','description','environment']);
const getValue=(data:ArchitectureNodeData,field:PropertyField)=>{
  const direct=(data as unknown as Record<string,unknown>)[field.key];
  if(direct!==undefined&&direct!==null&&direct!=='')return direct as string|number|boolean;
  const extra=data.properties?.[field.key];
  if(extra!==undefined)return extra;
  return field.defaultValue ?? (field.type==='boolean'?false:'');
};
const patchFor=(data:ArchitectureNodeData,key:string,value:string|number|boolean):Partial<ArchitectureNodeData>=>{
  if(builtInKeys.has(key))return {[key]:value} as Partial<ArchitectureNodeData>;
  return {properties:{...(data.properties||{}),[key]:value}};
};

const terraformResourceNames:Partial<Record<ResourceType,string>>={
  resourceGroup:'azurerm_resource_group',
  virtualNetwork:'azurerm_virtual_network',
  subnet:'azurerm_subnet',
  virtualMachine:'azurerm_windows_virtual_machine',
  vmScaleSet:'azurerm_windows_virtual_machine_scale_set',
  storageAccount:'azurerm_storage_account',
  blobStorage:'azurerm_storage_container',
  fileShare:'azurerm_storage_share',
  sqlDatabase:'azurerm_mssql_database',
  sqlManagedInstance:'azurerm_mssql_managed_instance',
  appService:'azurerm_linux_web_app',
  functionApp:'azurerm_linux_function_app',
  keyVault:'azurerm_key_vault',
  aks:'azurerm_kubernetes_cluster',
  privateEndpoint:'azurerm_private_endpoint',
  networkSecurityGroup:'azurerm_network_security_group',
  applicationGateway:'azurerm_application_gateway',
  firewall:'azurerm_firewall',
  azureOpenAI:'azurerm_cognitive_account',
  aiSearch:'azurerm_search_service',
};
const tfName=(type:ResourceType)=>terraformResourceNames[type]||`azurerm_${type}`;

const terraformPreview=(data:ArchitectureNodeData)=>{
  const schema=getResourceSchema(data.resourceType);
  const lines=schema.filter(f=>f.terraformProperty).map(f=>{
    const v=getValue(data,f);
    const rendered=typeof v==='boolean'?String(v):typeof v==='number'?String(v):`"${String(v)}"`;
    return `  ${f.terraformProperty} = ${rendered}`;
  });
  const safe=(data.label||data.resourceType).toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'')||'resource';
  return `resource "${tfName(data.resourceType)}" "${safe}" {\n  name = "${data.label}"\n${lines.join('\n')}\n\n  tags = ${JSON.stringify({...data.inheritedTags,...data.tags},null,2).replace(/\n/g,'\n  ')}\n}`;
};

function FieldEditor({field,data,onChange}:{field:PropertyField;data:ArchitectureNodeData;onChange:(u:Partial<ArchitectureNodeData>)=>void}){
  const value=getValue(data,field);
  const set=(v:string|number|boolean)=>onChange(patchFor(data,field.key,v));
  if(field.type==='boolean')return <label className="property-toggle"><span><b>{field.label}</b>{field.help&&<small>{field.help}</small>}</span><input type="checkbox" checked={Boolean(value)} onChange={e=>set(e.target.checked)}/></label>;
  if(field.type==='textarea')return <label>{field.label}{field.required&&<em> *</em>}<textarea rows={4} value={String(value)} placeholder={field.placeholder} readOnly={field.readOnly} onChange={e=>set(e.target.value)}/>{field.help&&<small>{field.help}</small>}</label>;
  if(field.type==='select')return <label>{field.label}{field.required&&<em> *</em>}<select value={String(value)} disabled={field.readOnly} onChange={e=>set(e.target.value)}>{field.options?.map(o=><option key={o}>{o}</option>)}</select>{field.help&&<small>{field.help}</small>}</label>;
  return <label>{field.label}{field.required&&<em> *</em>}<input type={field.type==='number'?'number':'text'} value={value as string|number} placeholder={field.placeholder} readOnly={field.readOnly} onChange={e=>set(field.type==='number'?Number(e.target.value):e.target.value)}/>{field.help&&<small>{field.help}</small>}</label>;
}

export default function PropertiesPanel({data,onChange,onDelete,onDuplicate,hierarchy,parentId,onParentChange}:Props){
  const[mode,setMode]=useState<'form'|'code'>('form');
  const[collapsed,setCollapsed]=useState<Record<string,boolean>>({});
  const schema=useMemo(()=>data?getResourceSchema(data.resourceType):[],[data?.resourceType]);
  const groups=useMemo(()=>data?schemaGroups(data.resourceType):[],[data?.resourceType]);
  if(!data)return <aside className="properties-panel"><div className="empty-properties"><div className="empty-icon">◇</div><strong>No resource selected</strong><span>Select a node to edit its Azure configuration.</span></div></aside>;

  const item=resourceMap[data.resourceType];const Icon=item.fallbackIcon;
  const parentOptions=data.resourceType==='managementGroup'?hierarchy.tenants:data.resourceType==='subscription'?hierarchy.managementGroups:data.resourceType==='resourceGroup'?hierarchy.subscriptions:data.resourceType==='virtualNetwork'?hierarchy.resourceGroups:data.resourceType==='subnet'?hierarchy.vnets:[...hierarchy.subnets,...hierarchy.resourceGroups];
  const showParent=data.resourceType!=='tenant';

  return <aside className="properties-panel dynamic-properties">
    <div className="property-resource-header">
      <div className="selected-resource-summary"><span className="summary-icon">{item.iconUrl?<img src={item.iconUrl} alt="" />:<Icon size={20}/>}</span><div><strong>{data.label}</strong><small>{item.label} · {item.category}</small></div></div>
      <div className="property-mode-switch"><button className={mode==='form'?'active':''} onClick={()=>setMode('form')}><FormInput size={14}/> Form</button><button className={mode==='code'?'active':''} onClick={()=>setMode('code')}><Code2 size={14}/> Code</button></div>
    </div>

    {mode==='code'?<div className="resource-code-view"><div className="code-toolbar"><span>{tfName(data.resourceType)}</span><button onClick={()=>navigator.clipboard?.writeText(terraformPreview(data))}><Copy size={13}/> Copy</button></div><pre>{terraformPreview(data)}</pre></div>:<>
      <section className="property-section">
        <div className="property-section-title"><strong>Metadata</strong></div>
        <div className="form-stack">
          <label>Resource name<input value={data.label} onChange={e=>onChange({label:e.target.value})}/></label>
          <label>Resource type<input value={tfName(data.resourceType)} readOnly/></label>
          {showParent&&<label>Parent / placement<select value={parentId||''} onChange={e=>onParentChange(e.target.value||undefined)}><option value="">No parent / top level</option>{parentOptions.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>}
          <label>Environment<select value={data.environment} onChange={e=>onChange({environment:e.target.value as ArchitectureNodeData['environment']})}><option>Production</option><option>Development</option><option>Test</option><option>Shared</option></select></label>
        </div>
      </section>

      {groups.map(group=><section className="property-section" key={group}>
        <button className="property-section-toggle" onClick={()=>setCollapsed(c=>({...c,[group]:!c[group]}))}>{collapsed[group]?<ChevronRight size={15}/>:<ChevronDown size={15}/>}<strong>{group}</strong></button>
        {!collapsed[group]&&<div className="form-stack">{schema.filter(f=>f.group===group).map(f=><FieldEditor key={f.key} field={f} data={data} onChange={onChange}/>)}</div>}
      </section>)}

      <section className="property-section">
        <button className="property-section-toggle" onClick={()=>setCollapsed(c=>({...c,tags:!c.tags}))}>{collapsed.tags?<ChevronRight size={15}/>:<ChevronDown size={15}/>}<strong>Tags & description</strong></button>
        {!collapsed.tags&&<div className="form-stack">
          <label>Tags <small>key=value; key2=value2</small><textarea value={tagString(data.tags)} rows={3} onChange={e=>onChange({tags:parseTags(e.target.value)})}/></label>
          {Object.keys(data.inheritedTags||{}).length>0&&<label>Inherited tags<textarea readOnly value={tagString(data.inheritedTags)} rows={3}/></label>}
          <label>Description<textarea value={data.description} rows={3} onChange={e=>onChange({description:e.target.value})}/></label>
        </div>}
      </section>

      <div className="hierarchy-path"><strong>Hierarchy</strong><span>{[data.subscriptionName,data.resourceGroup,data.vnet,data.subnet].filter(Boolean).join('  ›  ')||'Not linked yet'}</span></div>
    </>}

    <div className="property-actions"><button onClick={onDuplicate}><Copy size={15}/> Duplicate</button><button className="danger-button" onClick={onDelete}><Trash2 size={15}/> Delete</button></div>
  </aside>;
}
