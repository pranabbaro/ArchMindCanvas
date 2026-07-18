import { Copy, Trash2 } from 'lucide-react';
import { resourceMap } from '../resourceCatalog';
import type { ArchitectureNodeData } from '../types';

type Props = { data?: ArchitectureNodeData; onChange: (updates: Partial<ArchitectureNodeData>) => void; onDelete: () => void; onDuplicate: () => void };

export default function PropertiesPanel({ data, onChange, onDelete, onDuplicate }: Props) {
  return <aside className="properties-panel">
    <div className="sidebar-heading"><div><div className="panel-title">Properties</div><div className="panel-subtitle">Configure selected resource</div></div></div>
    {!data ? <div className="empty-properties"><div className="empty-icon">◇</div><strong>No resource selected</strong><span>Select a node on the canvas to view and edit its configuration.</span></div> : <>
      <div className="selected-resource-summary"><span className="summary-icon">{(() => { const Icon = resourceMap[data.resourceType].fallbackIcon; return <Icon size={20}/>; })()}</span><div><strong>{resourceMap[data.resourceType].label}</strong><small>{resourceMap[data.resourceType].category}</small></div></div>
      <div className="form-stack">
        <label>Resource name<input value={data.label} onChange={(e) => onChange({ label: e.target.value })}/></label>
        <label>Environment<select value={data.environment} onChange={(e) => onChange({ environment: e.target.value as ArchitectureNodeData['environment'] })}><option>Production</option><option>Development</option><option>Test</option><option>Shared</option></select></label>
        <label>Azure region<select value={data.region} onChange={(e) => onChange({ region: e.target.value })}><option>East US</option><option>East US 2</option><option>West Europe</option><option>North Europe</option><option>Germany West Central</option><option>Central India</option><option>South India</option><option>Southeast Asia</option><option>Australia East</option></select></label>
        <label>SKU / Size<input value={data.sku} onChange={(e) => onChange({ sku: e.target.value })}/></label>
        <label>Owner<input value={data.owner} placeholder="Platform team" onChange={(e) => onChange({ owner: e.target.value })}/></label>
        <label>Description<textarea value={data.description} rows={4} onChange={(e) => onChange({ description: e.target.value })}/></label>
      </div>
      <div className="property-actions"><button onClick={onDuplicate}><Copy size={15}/> Duplicate</button><button className="danger-button" onClick={onDelete}><Trash2 size={15}/> Delete</button></div>
    </>}
  </aside>;
}
