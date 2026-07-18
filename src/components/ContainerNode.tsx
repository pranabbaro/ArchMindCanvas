import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { Network, Split } from 'lucide-react';
import type { ArchitectureNode } from '../types';

export default function ContainerNode({ data, selected }: NodeProps<ArchitectureNode>) {
  const isSubnet = data.resourceType === 'subnet';
  const Icon = isSubnet ? Split : Network;
  return (
    <>
      <NodeResizer isVisible={selected} minWidth={isSubnet ? 260 : 420} minHeight={isSubnet ? 200 : 320} />
      <div className={`container-node ${isSubnet ? 'subnet-container' : 'vnet-container'} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="container-titlebar">
        <span className="container-title-icon"><Icon size={16}/></span>
        <div><strong>{data.label}</strong><small>{isSubnet ? 'Subnet' : 'Virtual Network'} · {data.region}</small></div>
      </div>
      <div className="container-drop-hint">Drop resources inside</div>
      <Handle type="source" position={Position.Right} />
    </div>
    </>
  );
}
