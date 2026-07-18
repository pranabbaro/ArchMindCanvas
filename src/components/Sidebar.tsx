import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { categories, resourceCatalog } from '../resourceCatalog';
import type { ResourceCategory } from '../types';

type Props = { onAddResource: (type: string) => void };

export default function Sidebar({ onAddResource }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<ResourceCategory, boolean>>(() => Object.fromEntries(categories.map((c) => [c, true])) as Record<ResourceCategory, boolean>);
  const normalized = query.trim().toLowerCase();
  const resources = useMemo(() => resourceCatalog.filter((item) => `${item.label} ${item.description} ${item.category}`.toLowerCase().includes(normalized)), [normalized]);

  return (
    <aside className="sidebar">
      <div className="sidebar-heading">
        <div><div className="panel-title">Resource library</div><div className="panel-subtitle">Azure building blocks</div></div>
        <span className="count-badge">{resourceCatalog.length}</span>
      </div>
      <div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Azure resources" /></div>
      <div className="resource-groups">
        {categories.map((category) => {
          const items = resources.filter((item) => item.category === category);
          if (!items.length) return null;
          const expanded = normalized ? true : open[category];
          return <section className="resource-group" key={category}>
            <button className="group-header" onClick={() => setOpen((v) => ({ ...v, [category]: !v[category] }))}>
              <span>{expanded ? <ChevronDown size={15}/> : <ChevronRight size={15}/>} {category}</span><small>{items.length}</small>
            </button>
            {expanded && <div className="resource-list">{items.map((resource) => {
              const Icon = resource.icon;
              return <button key={resource.type} className="resource-item" draggable
                onDoubleClick={() => onAddResource(resource.type)}
                onDragStart={(event) => { event.dataTransfer.setData('application/cloud-resource', resource.type); event.dataTransfer.effectAllowed = 'move'; }}>
                <span className="resource-icon"><Icon size={18}/></span>
                <span className="resource-copy"><strong>{resource.label}</strong><small>{resource.description}</small></span>
              </button>;
            })}</div>}
          </section>;
        })}
      </div>
      <div className="sidebar-help"><strong>Tip:</strong> Drag onto the canvas, or double-click to add instantly.</div>
    </aside>
  );
}
