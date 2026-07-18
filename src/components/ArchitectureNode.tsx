import { Handle, Position, type NodeProps } from '@xyflow/react';
import { resourceMap } from '../resourceCatalog';
import type { ArchitectureNode } from '../types';

export default function ArchitectureNodeComponent({ data, selected }: NodeProps<ArchitectureNode>) {
  const item = resourceMap[data.resourceType];
  const Icon = item.icon;
  return (
    <div className={`architecture-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-icon"><Icon size={23} strokeWidth={1.8} /></div>
      <div className="node-content">
        <div className="node-category">{item.category}</div>
        <strong>{data.label}</strong>
        <span>{data.region} · {data.environment}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
