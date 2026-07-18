import type { ArchitectureNodeData } from '../types';

type Props = {
  data?: ArchitectureNodeData;
  onChange: (updates: Partial<ArchitectureNodeData>) => void;
  onDelete: () => void;
};

export default function PropertiesPanel({ data, onChange, onDelete }: Props) {
  return (
    <aside className="properties-panel">
      <div className="panel-title">Properties</div>
      {!data ? (
        <div className="empty-properties">Select a resource to edit its properties.</div>
      ) : (
        <div className="form-stack">
          <label>
            Resource name
            <input value={data.label} onChange={(e) => onChange({ label: e.target.value })} />
          </label>
          <label>
            Region
            <select value={data.region} onChange={(e) => onChange({ region: e.target.value })}>
              <option>East US</option>
              <option>West Europe</option>
              <option>Germany West Central</option>
              <option>Central India</option>
              <option>South India</option>
              <option>Southeast Asia</option>
            </select>
          </label>
          <label>
            SKU / Size
            <input value={data.sku} onChange={(e) => onChange({ sku: e.target.value })} />
          </label>
          <label>
            Description
            <textarea value={data.description} rows={4} onChange={(e) => onChange({ description: e.target.value })} />
          </label>
          <button className="danger-button" onClick={onDelete}>Delete resource</button>
        </div>
      )}
    </aside>
  );
}
