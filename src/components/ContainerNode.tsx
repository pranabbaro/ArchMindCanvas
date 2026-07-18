import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { resourceMap } from '../resourceCatalog';
import type { ArchitectureNode } from '../types';

const minSize: Record<string,{w:number;h:number}> = {
  tenant:{w:900,h:650}, managementGroup:{w:820,h:590}, subscription:{w:740,h:530}, resourceGroup:{w:640,h:450}, virtualNetwork:{w:520,h:360}, subnet:{w:280,h:210}
};
export default function ContainerNode({ data, selected }: NodeProps<ArchitectureNode>) {
  const item=resourceMap[data.resourceType]; const Icon=item.fallbackIcon; const m=minSize[data.resourceType]||{w:300,h:220};
  return <>
    <NodeResizer isVisible={selected} minWidth={m.w} minHeight={m.h}/>
    <div className={`container-node hierarchy-${data.resourceType} ${selected?'selected':''}`}>
      <Handle id="left" type="target" position={Position.Left}/><Handle id="top" type="target" position={Position.Top}/>
      <div className="container-titlebar"><span className="container-title-icon"><Icon size={16}/></span><div><strong>{data.label}</strong><small>{item.label}{data.region?` · ${data.region}`:''}</small></div></div>
      <div className="container-drop-hint">Drop compatible resources inside</div>
      <Handle id="right" type="source" position={Position.Right}/><Handle id="bottom" type="source" position={Position.Bottom}/>
    </div>
  </>;
}
