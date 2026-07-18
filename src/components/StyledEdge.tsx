import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, getStraightPath, type EdgeProps } from '@xyflow/react';
import type { CanvasEdge } from '../types';

export default function StyledEdge(props: EdgeProps<CanvasEdge>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data, selected } = props;
  const kind = data?.connectorStyle || 'smoothstep';
  let result: [string, number, number, number, number];
  if (kind === 'straight' || kind === 'dotted') result = getStraightPath({ sourceX, sourceY, targetX, targetY });
  else if (kind === 'bezier') result = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  else result = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 8, offset: 24 });
  const [path, labelX, labelY] = result;
  return <>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: selected ? '#2563eb' : '#64748b', strokeWidth: selected ? 3 : 1.8, strokeDasharray: kind === 'dotted' ? '4 7' : undefined }}/>
    {data?.label && <EdgeLabelRenderer><div className="edge-label" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}>{data.label}</div></EdgeLabelRenderer>}
  </>;
}
