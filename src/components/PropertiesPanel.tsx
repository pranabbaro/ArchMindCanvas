import { useMemo, useState } from 'react';
import {
  ChevronDown, ChevronRight, Code2, Copy, Database, FormInput, Link2, PackageOpen,
  Trash2, Variable, Boxes, Braces, Box, X
} from 'lucide-react';
import { resourceMap } from '../resourceCatalog';
import { getResourceSchema, schemaGroups, type PropertyField } from '../resourceSchemas';
import type {
  ArchitectureNode, ArchitectureNodeData, PropertyBinding, PropertyValueSource,
  ResourceMode, ResourceType, TagMap
} from '../types';

type Option={id:string;label:string};
type Props={
  nodeId:string;
  data?:ArchitectureNodeData;
  allResources:ArchitectureNode[];
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
  if(builtInKeys.has(key))return ({[key]:value} as unknown) as Partial<ArchitectureNodeData>;
  return {properties:{...(data.properties||{}),[key]:value}};
};

const terraformResourceNames:Partial<Record<ResourceType,string>>={
  resourceGroup:'azurerm_resource_group',
  virtualNetwork:'azurerm_virtual_network',
  subnet:'azurerm_subnet',
  networkSecurityGroup:'azurerm_network_security_group',
  routeTable:'azurerm_route_table',
  publicIp:'azurerm_public_ip',
  privateEndpoint:'azurerm_private_endpoint',
  natGateway:'azurerm_nat_gateway',
  vpnGateway:'azurerm_virtual_network_gateway',
  expressRoute:'azurerm_express_route_circuit',
  loadBalancer:'azurerm_lb',
  applicationGateway:'azurerm_application_gateway',
  firewall:'azurerm_firewall',
  bastion:'azurerm_bastion_host',
  dnsZone:'azurerm_dns_zone',
  privateDnsZone:'azurerm_private_dns_zone',
  virtualMachine:'azurerm_windows_virtual_machine',
  vmScaleSet:'azurerm_windows_virtual_machine_scale_set',
  availabilitySet:'azurerm_availability_set',
  storageAccount:'azurerm_storage_account',
  blobStorage:'azurerm_storage_container',
  fileShare:'azurerm_storage_share',
  sqlDatabase:'azurerm_mssql_database',
  sqlManagedInstance:'azurerm_mssql_managed_instance',
  cosmosDb:'azurerm_cosmosdb_account',
  postgresql:'azurerm_postgresql_flexible_server',
  mysql:'azurerm_mysql_flexible_server',
  redis:'azurerm_redis_cache',
  appService:'azurerm_linux_web_app',
  functionApp:'azurerm_linux_function_app',
  staticWebApp:'azurerm_static_web_app',
  aks:'azurerm_kubernetes_cluster',
  containerRegistry:'azurerm_container_registry',
  containerApps:'azurerm_container_app',
  containerInstances:'azurerm_container_group',
  keyVault:'azurerm_key_vault',
  managedIdentity:'azurerm_user_assigned_identity',
  apiManagement:'azurerm_api_management',
  logicApps:'azurerm_logic_app_workflow',
  serviceBus:'azurerm_servicebus_namespace',
  eventGrid:'azurerm_eventgrid_topic',
  eventHubs:'azurerm_eventhub_namespace',
  dataFactory:'azurerm_data_factory',
  synapse:'azurerm_synapse_workspace',
  databricks:'azurerm_databricks_workspace',
  azureOpenAI:'azurerm_cognitive_account',
  cognitiveServices:'azurerm_cognitive_account',
  aiSearch:'azurerm_search_service',
  machineLearning:'azurerm_machine_learning_workspace',
  monitor:'azurerm_monitor_action_group',
  logAnalytics:'azurerm_log_analytics_workspace',
  applicationInsights:'azurerm_application_insights',
  automation:'azurerm_automation_account',
};
const tfName=(type:ResourceType)=>terraformResourceNames[type]||`azurerm_${type}`;

const safeName=(value:string)=>value.toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'')||'resource';
const quote=(v:string|number|boolean)=>typeof v==='boolean'||typeof v==='number'?String(v):`"${String(v)}"`;

const bindingExpression=(
  binding:PropertyBinding|undefined,
  literal:string|number|boolean,
  resources:ArchitectureNode[]
)=>{
  if(!binding||binding.source==='literal')return quote(literal);
  if(binding.source==='variable')return `var.${binding.variableName||'value'}`;
  if(binding.source==='local')return `local.${binding.localName||'value'}`;
  if(binding.source==='moduleOutput')return `module.${binding.moduleName||'module'}.${binding.moduleOutput||'output'}`;
  if(binding.source==='data')return `data.${binding.dataSourceType||'azurerm_resource_group'}.${binding.dataSourceName||'existing'}.${binding.dataAttribute||'id'}`;
  if(binding.source==='resource'){
    const target=resources.find(r=>r.id===binding.targetNodeId);
    if(!target)return `/* broken reference */ null`;
    const prefix=(target.data.resourceMode||'create')==='existing'?'data.':'';
    return `${prefix}${tfName(target.data.resourceType)}.${safeName(target.data.label)}.${binding.targetAttribute||'id'}`;
  }
  return quote(literal);
};

const terraformPreview=(data:ArchitectureNodeData,resources:ArchitectureNode[])=>{
  const schema=getResourceSchema(data.resourceType);
  const safe=safeName(data.label||data.resourceType);
  const mode=data.resourceMode||'create';
  const bodyLines=schema.filter(f=>f.terraformProperty).map(f=>{
    const literal=getValue(data,f);
    const expr=bindingExpression(data.bindings?.[f.key],literal,resources);
    return `  ${f.terraformProperty} = ${expr}`;
  });
  const tags=`  tags = ${JSON.stringify({...data.inheritedTags,...data.tags},null,2).replace(/\n/g,'\n  ')}`;

  if(mode==='existing'){
    const lookup=data.existingResource||{lookupType:'name' as const};
    const selector=lookup.lookupType==='resourceId'&&lookup.resourceId
      ? `  # Resource ID reference\n  # ${lookup.resourceId}`
      : `  name = "${lookup.name||data.label}"`;
    return `data "${tfName(data.resourceType)}" "${safe}" {\n${selector}\n${bodyLines.join('\n')}\n}`;
  }

  const resource=`resource "${tfName(data.resourceType)}" "${safe}" {\n  name = "${data.label}"\n${bodyLines.join('\n')}\n\n${tags}\n}`;
  if(mode==='import'){
    const id=data.existingResource?.resourceId||'/subscriptions/.../resourceGroups/.../providers/...';
    return `${resource}\n\nimport {\n  to = ${tfName(data.resourceType)}.${safe}\n  id = "${id}"\n}`;
  }
  return resource;
};

const sourceLabels:Record<PropertyValueSource,string>={
  literal:'Direct',
  variable:'Variable',
  resource:'Diagram resource',
  data:'Data source',
  local:'Local',
  moduleOutput:'Module output'
};

function SourcePicker({
  field,data,nodeId,resources,onChange,onClose
}:{
  field:PropertyField;
  data:ArchitectureNodeData;
  nodeId:string;
  resources:ArchitectureNode[];
  onChange:(u:Partial<ArchitectureNodeData>)=>void;
  onClose:()=>void;
}){
  const current=data.bindings?.[field.key]||{source:'literal' as const};
  const patch=(b:PropertyBinding)=>onChange({bindings:{...(data.bindings||{}),[field.key]:b}});
  const candidates=resources.filter(r=>r.id!==nodeId&&(!field.allowedResourceTypes?.length||field.allowedResourceTypes.includes(r.data.resourceType)));
  return <div className="binding-popover">
    <div className="binding-popover-head"><strong>Value source · {field.label}</strong><button onClick={onClose}><X size={14}/></button></div>
    <div className="binding-source-grid">
      <button className={current.source==='literal'?'active':''} onClick={()=>patch({source:'literal'})}><Braces size={14}/> Direct</button>
      <button className={current.source==='variable'?'active':''} onClick={()=>patch({source:'variable',variableName:current.variableName||field.key})}><Variable size={14}/> Variable</button>
      <button className={current.source==='resource'?'active':''} onClick={()=>patch({source:'resource',targetNodeId:current.targetNodeId,targetAttribute:current.targetAttribute||'id'})}><Boxes size={14}/> Resource</button>
      <button className={current.source==='data'?'active':''} onClick={()=>patch({source:'data',dataSourceType:current.dataSourceType||tfName(data.resourceType),dataSourceName:current.dataSourceName||'existing',dataAttribute:current.dataAttribute||'id'})}><Database size={14}/> Data</button>
      <button className={current.source==='local'?'active':''} onClick={()=>patch({source:'local',localName:current.localName||field.key})}><Box size={14}/> Local</button>
      <button className={current.source==='moduleOutput'?'active':''} onClick={()=>patch({source:'moduleOutput',moduleName:current.moduleName||'platform',moduleOutput:current.moduleOutput||field.key})}><PackageOpen size={14}/> Module</button>
    </div>

    {current.source==='variable'&&<label>Variable name<input value={current.variableName||''} onChange={e=>patch({...current,variableName:e.target.value})}/><small>Generates var.{current.variableName||field.key}</small></label>}
    {current.source==='local'&&<label>Local name<input value={current.localName||''} onChange={e=>patch({...current,localName:e.target.value})}/><small>Generates local.{current.localName||field.key}</small></label>}
    {current.source==='resource'&&<>
      <label>Diagram resource<select value={current.targetNodeId||''} onChange={e=>patch({...current,targetNodeId:e.target.value})}><option value="">Select resource...</option>{candidates.map(r=><option value={r.id} key={r.id}>{r.data.label} · {resourceMap[r.data.resourceType].label}</option>)}</select></label>
      <label>Attribute<input value={current.targetAttribute||'id'} onChange={e=>patch({...current,targetAttribute:e.target.value})} placeholder="id / name / location"/></label>
    </>}
    {current.source==='data'&&<>
      <label>Terraform data source<input value={current.dataSourceType||''} onChange={e=>patch({...current,dataSourceType:e.target.value})} placeholder="azurerm_resource_group"/></label>
      <label>Data name<input value={current.dataSourceName||''} onChange={e=>patch({...current,dataSourceName:e.target.value})} placeholder="existing"/></label>
      <label>Attribute<input value={current.dataAttribute||'id'} onChange={e=>patch({...current,dataAttribute:e.target.value})}/></label>
    </>}
    {current.source==='moduleOutput'&&<>
      <label>Module name<input value={current.moduleName||''} onChange={e=>patch({...current,moduleName:e.target.value})}/></label>
      <label>Output<input value={current.moduleOutput||''} onChange={e=>patch({...current,moduleOutput:e.target.value})}/></label>
    </>}
    <div className="binding-preview"><span>Expression</span><code>{bindingExpression(current,getValue(data,field),resources)}</code></div>
  </div>;
}

function FieldEditor({
  field,data,nodeId,resources,onChange
}:{
  field:PropertyField;
  data:ArchitectureNodeData;
  nodeId:string;
  resources:ArchitectureNode[];
  onChange:(u:Partial<ArchitectureNodeData>)=>void
}){
  const value=getValue(data,field);
  const binding=data.bindings?.[field.key];
  const[showSource,setShowSource]=useState(false);
  const set=(v:string|number|boolean)=>onChange(patchFor(data,field.key,v));
  const compatibleResources=resources.filter(r=>r.id!==nodeId&&(!field.allowedResourceTypes?.length||field.allowedResourceTypes.includes(r.data.resourceType)));
  const editor=
    field.type==='resourceRef'?<label>{field.label}{field.required&&<em> *</em>}<select value={binding?.source==='resource'?(binding.targetNodeId||''):''} onChange={e=>{
      if(!e.target.value){
        onChange({bindings:{...(data.bindings||{}),[field.key]:{source:'literal'}}});
        return;
      }
      onChange({bindings:{...(data.bindings||{}),[field.key]:{source:'resource',targetNodeId:e.target.value,targetAttribute:field.referenceAttribute||'id'}}});
    }}><option value="">Select compatible resource...</option>{compatibleResources.map(r=><option value={r.id} key={r.id}>{r.data.label} · {resourceMap[r.data.resourceType].label} · {(r.data.resourceMode||'create')==='existing'?'Existing':'Create'}</option>)}</select><small>{field.allowedResourceTypes?.map(t=>resourceMap[t]?.label||t).join(' / ')}</small></label>:
    field.type==='boolean'?<label className="property-toggle"><span><b>{field.label}</b>{field.help&&<small>{field.help}</small>}</span><input type="checkbox" checked={Boolean(value)} onChange={e=>set(e.target.checked)}/></label>:
    field.type==='textarea'?<label>{field.label}{field.required&&<em> *</em>}<textarea rows={4} value={String(value)} placeholder={field.placeholder} readOnly={field.readOnly} onChange={e=>set(e.target.value)}/>{field.help&&<small>{field.help}</small>}</label>:
    field.type==='select'?<label>{field.label}{field.required&&<em> *</em>}<select value={String(value)} disabled={field.readOnly} onChange={e=>set(e.target.value)}>{field.options?.map(o=><option key={o}>{o}</option>)}</select>{field.help&&<small>{field.help}</small>}</label>:
    <label>{field.label}{field.required&&<em> *</em>}<input type={field.type==='number'?'number':'text'} value={value as string|number} placeholder={field.placeholder} readOnly={field.readOnly} onChange={e=>set(field.type==='number'?Number(e.target.value):e.target.value)}/>{field.help&&<small>{field.help}</small>}</label>;

  return <div className="smart-property-field">
    <div className="smart-field-row"><div className="smart-field-editor">{editor}</div><button className={`binding-button ${binding&&binding.source!=='literal'?'bound':''}`} title="Choose value source" onClick={()=>setShowSource(v=>!v)}><Link2 size={14}/></button></div>
    {binding&&binding.source!=='literal'&&<div className="binding-chip">{sourceLabels[binding.source]} · <code>{bindingExpression(binding,value,resources)}</code></div>}
    {showSource&&<SourcePicker field={field} data={data} nodeId={nodeId} resources={resources} onChange={onChange} onClose={()=>setShowSource(false)}/>}
  </div>;
}

export default function PropertiesPanel({nodeId,data,allResources,onChange,onDelete,onDuplicate,hierarchy,parentId,onParentChange}:Props){
  const[mode,setMode]=useState<'form'|'code'>('form');
  const[collapsed,setCollapsed]=useState<Record<string,boolean>>({});
  const schema=useMemo(()=>data?getResourceSchema(data.resourceType):[],[data?.resourceType]);
  const groups=useMemo(()=>data?schemaGroups(data.resourceType):[],[data?.resourceType]);
  if(!data)return <aside className="properties-panel"><div className="empty-properties"><div className="empty-icon">◇</div><strong>No resource selected</strong><span>Select a node to edit its Azure configuration.</span></div></aside>;

  const item=resourceMap[data.resourceType];const Icon=item.fallbackIcon;
  const parentOptions=data.resourceType==='managementGroup'?hierarchy.tenants:data.resourceType==='subscription'?hierarchy.managementGroups:data.resourceType==='resourceGroup'?hierarchy.subscriptions:data.resourceType==='virtualNetwork'?hierarchy.resourceGroups:data.resourceType==='subnet'?hierarchy.vnets:[...hierarchy.subnets,...hierarchy.resourceGroups];
  const showParent=data.resourceType!=='tenant';
  const resourceMode=data.resourceMode||'create';

  const changeResourceMode=(resourceMode:ResourceMode)=>{
    if(resourceMode==='create')onChange({resourceMode,existingResource:undefined});
    else onChange({resourceMode,existingResource:data.existingResource||{lookupType:'name',name:data.label}});
  };

  return <aside className="properties-panel dynamic-properties">
    <div className="property-resource-header">
      <div className="selected-resource-summary"><span className="summary-icon">{item.iconUrl?<img src={item.iconUrl} alt="" />:<Icon size={20}/>}</span><div><strong>{data.label}</strong><small>{item.label} · {item.category}</small></div></div>
      <div className="property-mode-switch"><button className={mode==='form'?'active':''} onClick={()=>setMode('form')}><FormInput size={14}/> Form</button><button className={mode==='code'?'active':''} onClick={()=>setMode('code')}><Code2 size={14}/> Code</button></div>
    </div>

    {mode==='code'?<div className="resource-code-view"><div className="code-toolbar"><span>{resourceMode==='existing'?'data':resourceMode} · {tfName(data.resourceType)}</span><button onClick={()=>navigator.clipboard?.writeText(terraformPreview(data,allResources))}><Copy size={13}/> Copy</button></div><pre>{terraformPreview(data,allResources)}</pre></div>:<>
      <section className="property-section smart-resource-mode-section">
        <div className="property-section-title"><strong>Resource mode</strong><small>Choose whether ArchMindCanvas creates, references, or imports this Azure resource.</small></div>
        <div className="resource-mode-grid">
          <button className={resourceMode==='create'?'active':''} onClick={()=>changeResourceMode('create')}><Boxes size={15}/><b>Create</b><span>Deploy a new resource</span></button>
          <button className={resourceMode==='existing'?'active':''} onClick={()=>changeResourceMode('existing')}><Database size={15}/><b>Existing</b><span>Reference with data/existing</span></button>
          <button className={resourceMode==='import'?'active':''} onClick={()=>changeResourceMode('import')}><PackageOpen size={15}/><b>Import</b><span>Adopt into state</span></button>
        </div>
        {resourceMode!=='create'&&<div className="existing-resource-box">
          <label>Existing resource name<input value={data.existingResource?.name||data.label} onChange={e=>onChange({existingResource:{...(data.existingResource||{lookupType:'name'}),lookupType:'name',name:e.target.value}})}/><small>Name is the default lookup method.</small></label>
          <details className="advanced-existing-lookup">
            <summary>Advanced lookup</summary>
            <label>Azure resource ID <small>Optional. Use this only when you want to bind/import by full Azure resource ID.</small><textarea rows={3} value={data.existingResource?.resourceId||''} placeholder="/subscriptions/.../resourceGroups/.../providers/..." onChange={e=>onChange({existingResource:{...(data.existingResource||{lookupType:'name'}),resourceId:e.target.value}})}/></label>
          </details>
        </div>}
      </section>

      <section className="property-section">
        <div className="property-section-title"><strong>Metadata</strong></div>
        <div className="form-stack">
          <label>Resource name<input value={data.label} onChange={e=>onChange({label:e.target.value})}/></label>
          <label>Terraform type<input value={tfName(data.resourceType)} readOnly/></label>
          {showParent&&<label>Parent / placement<select value={parentId||''} onChange={e=>onParentChange(e.target.value||undefined)}><option value="">No parent / top level</option>{parentOptions.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>}
          <label>Environment<select value={data.environment} onChange={e=>onChange({environment:e.target.value as ArchitectureNodeData['environment']})}><option>Production</option><option>Development</option><option>Test</option><option>Shared</option></select></label>
        </div>
      </section>

      {groups.map(group=><section className="property-section" key={group}>
        <button className="property-section-toggle" onClick={()=>setCollapsed(c=>({...c,[group]:!c[group]}))}>{collapsed[group]?<ChevronRight size={15}/>:<ChevronDown size={15}/>}<strong>{group}</strong></button>
        {!collapsed[group]&&<div className="form-stack">{schema.filter(f=>f.group===group).map(f=><FieldEditor key={f.key} field={f} data={data} nodeId={nodeId} resources={allResources} onChange={onChange}/>)}</div>}
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
