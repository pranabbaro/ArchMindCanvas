import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { useState } from 'react';
import { resourceMap } from '../resourceCatalog';
import type { ArchitectureNode } from '../types';

export default function ArchitectureNodeComponent({ data, selected }: NodeProps<ArchitectureNode>) {
  const item = resourceMap[data.resourceType];
  const FallbackIcon = item.fallbackIcon;
  const [iconFailed, setIconFailed] = useState(false);
  const useFallback = iconFailed || !item.iconUrl;
  return <>
    <NodeResizer isVisible={selected} minWidth={180} minHeight={72} keepAspectRatio={false}/>
    <div className={`architecture-node ${selected?'selected':''}`}>
      <Handle id="left" type="target" position={Position.Left}/><Handle id="top" type="target" position={Position.Top}/>
      <div className="node-icon azure-service-icon">{useFallback?<FallbackIcon size={28} strokeWidth={1.8}/>:<img src={item.iconUrl} alt={`${item.label} icon`} draggable={false} onError={()=>setIconFailed(true)}/>}</div>
      <div className="node-content"><div className="node-category">Microsoft Azure · {item.category}</div><strong>{data.label}</strong><span>{data.resourceGroup?`${data.resourceGroup} · `:''}{data.region} · {data.environment}</span></div>
      <Handle id="right" type="source" position={Position.Right}/><Handle id="bottom" type="source" position={Position.Bottom}/>
    </div>
  </>;
}
