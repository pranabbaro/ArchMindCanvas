import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { resourceCatalog } from '../resourceCatalog';

export default function Sidebar() {
  const [query, setQuery] = useState('');
  const resources = useMemo(
    () => resourceCatalog.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <aside className="sidebar">
      <div className="panel-title">Azure resources</div>
      <div className="search-box">
        <Search size={16} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources" />
      </div>
      <div className="resource-list">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <button
              key={resource.type}
              className="resource-item"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/cloud-resource', resource.type);
                event.dataTransfer.effectAllowed = 'move';
              }}
            >
              <span className="resource-icon"><Icon size={19} /></span>
              <span>
                <strong>{resource.label}</strong>
                <small>{resource.description}</small>
              </span>
            </button>
          );
        })}
      </div>
      <div className="sidebar-help">Drag a resource onto the canvas.</div>
    </aside>
  );
}
