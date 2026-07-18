import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { DrawingNode } from '../types';

export default function DrawingNodeComponent({ data, selected }: NodeProps<DrawingNode>) {
  if (data.shape === 'text') {
    return <div className={`drawing-text ${selected ? 'selected' : ''}`} style={{ color: data.textColor || '#0f172a', fontSize: data.fontSize || 18 }}>{data.label}</div>;
  }
  if (data.shape === 'triangle') {
    return <div className={`drawing-triangle-wrap ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left}/><Handle type="source" position={Position.Right}/>
      <div className="drawing-triangle" style={{ borderBottomColor: data.fill || '#dbeafe' }}/>
      <span>{data.label}</span>
    </div>;
  }
  return <div className={`drawing-rectangle ${selected ? 'selected' : ''}`} style={{ background: data.fill || '#fff', borderColor: data.border || '#2563eb' }}>
    <Handle type="target" position={Position.Left}/><Handle type="source" position={Position.Right}/>
    <Handle id="top" type="target" position={Position.Top}/><Handle id="bottom" type="source" position={Position.Bottom}/>
    {data.label}
  </div>;
}
