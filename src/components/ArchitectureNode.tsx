import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { useState } from 'react';
import { resourceMap } from '../resourceCatalog';
import type { ArchitectureNode } from '../types';

export default function ArchitectureNodeComponent({ data, selected }: NodeProps<ArchitectureNode>) {
  const item = resourceMap[data.resourceType];
  const FallbackIcon = item.fallbackIcon;
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={180} minHeight={72} keepAspectRatio={false} />
      <div className={`architecture-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-icon azure-service-icon">
        {iconFailed ? (
          <FallbackIcon size={28} strokeWidth={1.8} />
        ) : (
          <img src={item.iconUrl} alt={`${item.label} Azure icon`} draggable={false} onError={() => setIconFailed(true)} />
        )}
      </div>
      <div className="node-content">
        <div className="node-category">Microsoft Azure · {item.category}</div>
        <strong>{data.label}</strong>
        <span>{data.region} · {data.environment}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
    </>
  );
}
