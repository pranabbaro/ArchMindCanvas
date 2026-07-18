import { Copy, Trash2 } from 'lucide-react';
import { resourceMap } from '../resourceCatalog';
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
const hierarchyOrder:ResourceType[]=['tenant','managementGroup','subscription','resourceGroup','virtualNetwork','subnet'];

export default function PropertiesPanel({data,onChange,onDelete,onDuplicate,hierarchy,parentId,onParentChange}:Props){
  if(!data)return <aside className="properties-panel"><div className="empty-properties"><div className="empty-icon">◇</div><strong>No resource selected</strong><span>Select a node to edit its Azure configuration.</span></div></aside>;
  const item=resourceMap[data.resourceType];const Icon=item.fallbackIcon;
  const parentOptions = data.resourceType==='managementGroup'?hierarchy.tenants:data.resourceType==='subscription'?hierarchy.managementGroups:data.resourceType==='resourceGroup'?hierarchy.subscriptions:data.resourceType==='virtualNetwork'?hierarchy.resourceGroups:data.resourceType==='subnet'?hierarchy.vnets:[...hierarchy.subnets,...hierarchy.resourceGroups];
  const showParent=data.resourceType!=='tenant';
  return <aside className="properties-panel">
    <div className="sidebar-heading"><div><div className="panel-title">Azure properties</div><div className="panel-subtitle">Connected hierarchy and inherited configuration</div></div></div>
    <div className="selected-resource-summary"><span className="summary-icon"><Icon size={20}/></span><div><strong>{item.label}</strong><small>{item.category}</small></div></div>
    <div className="form-stack">
      <label>Resource name<input value={data.label} onChange={e=>onChange({label:e.target.value})}/></label>
      {showParent&&<label>Parent / placement<select value={parentId||''} onChange={e=>onParentChange(e.target.value||undefined)}><option value="">No parent / top level</option>{parentOptions.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>}
      <label>Environment<select value={data.environment} onChange={e=>onChange({environment:e.target.value as ArchitectureNodeData['environment']})}><option>Production</option><option>Development</option><option>Test</option><option>Shared</option></select></label>
      <label>Azure region<select value={data.region} onChange={e=>onChange({region:e.target.value})}><option>Global</option><option>East US</option><option>East US 2</option><option>West Europe</option><option>North Europe</option><option>Germany West Central</option><option>Central India</option><option>South India</option><option>Southeast Asia</option><option>Australia East</option></select></label>
      {data.resourceType==='tenant'&&<label>Tenant ID<input value={data.tenantId||''} onChange={e=>onChange({tenantId:e.target.value})} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/></label>}
      {data.resourceType==='subscription'&&<><label>Subscription name<input value={data.subscriptionName||data.label} onChange={e=>onChange({subscriptionName:e.target.value,label:e.target.value})}/></label><label>Subscription ID<input value={data.subscriptionId||''} onChange={e=>onChange({subscriptionId:e.target.value})} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/></label></>}
      {data.resourceType==='resourceGroup'&&<label>Resource Group<input value={data.resourceGroup||data.label} onChange={e=>onChange({resourceGroup:e.target.value,label:e.target.value})}/></label>}
      {data.subscriptionName&&data.resourceType!=='subscription'&&<label>Subscription (inherited)<input value={data.subscriptionName} readOnly/></label>}
      {data.resourceGroup&&data.resourceType!=='resourceGroup'&&<label>Resource Group (inherited)<input value={data.resourceGroup} readOnly/></label>}
      {data.vnet&&data.resourceType!=='virtualNetwork'&&<label>VNet (inherited)<input value={data.vnet} readOnly/></label>}
      {data.subnet&&data.resourceType!=='subnet'&&<label>Subnet (inherited)<input value={data.subnet} readOnly/></label>}
      <label>SKU / Size<input value={data.sku} onChange={e=>onChange({sku:e.target.value})}/></label>
      <label>Owner<input value={data.owner} placeholder="Platform team" onChange={e=>onChange({owner:e.target.value})}/></label>
      <label>Tags <small>key=value; key2=value2</small><textarea value={tagString(data.tags)} rows={3} onChange={e=>onChange({tags:parseTags(e.target.value)})}/></label>
      {Object.keys(data.inheritedTags||{}).length>0&&<label>Inherited tags<textarea readOnly value={tagString(data.inheritedTags)} rows={3}/></label>}
      <label>Description<textarea value={data.description} rows={3} onChange={e=>onChange({description:e.target.value})}/></label>
    </div>
    <div className="hierarchy-path"><strong>Hierarchy</strong><span>{[data.subscriptionName,data.resourceGroup,data.vnet,data.subnet].filter(Boolean).join('  ›  ')||'Not linked yet'}</span></div>
    <div className="property-actions"><button onClick={onDuplicate}><Copy size={15}/> Duplicate</button><button className="danger-button" onClick={onDelete}><Trash2 size={15}/> Delete</button></div>
  </aside>;
}
