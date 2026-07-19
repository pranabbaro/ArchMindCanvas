import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, getStraightPath, useReactFlow, type EdgeProps } from '@xyflow/react';
import type { CanvasEdge } from '../types';

export default function StyledEdge(props:EdgeProps<CanvasEdge>){
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, markerEnd, markerStart } = props;
  const { setEdges, screenToFlowPosition } = useReactFlow();
  const kind=data?.connectorStyle||'smoothstep';
  const hasManual=Number.isFinite(data?.routeX)&&Number.isFinite(data?.routeY);
  const rx=hasManual ? Number(data?.routeX) : (sourceX+targetX)/2;
  const ry=hasManual ? Number(data?.routeY) : (sourceY+targetY)/2;

  let path:string;
  let labelX:number;
  let labelY:number;

  if(hasManual){
    if(kind==='bezier'){
      path=`M ${sourceX},${sourceY} Q ${rx},${ry} ${targetX},${targetY}`;
    }else if(kind==='straight'||kind==='dotted'||kind==='dashed'){
      path=`M ${sourceX},${sourceY} L ${rx},${ry} L ${targetX},${targetY}`;
    }else{
      path=`M ${sourceX},${sourceY} L ${rx},${sourceY} L ${rx},${targetY} L ${targetX},${targetY}`;
    }
    labelX=rx; labelY=ry;
  }else{
    let result:[string,number,number,number,number];
    if(kind==='straight'||kind==='dotted'||kind==='dashed'){
      result=getStraightPath({sourceX,sourceY,targetX,targetY});
    }else if(kind==='bezier'){
      result=getBezierPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition});
    }else{
      result=getSmoothStepPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,borderRadius:8,offset:24});
    }
    [path,labelX,labelY]=result;
  }

  const dash=kind==='dotted'?'3 7':kind==='dashed'?'10 7':undefined;
  const label=[data?.label,data?.connectionType,data?.protocol&&data?.port?`${data.protocol} ${data.port}`:data?.protocol||data?.port].filter(Boolean).join(' · ');

  const startDrag=(event:React.PointerEvent<HTMLDivElement>)=>{
    event.preventDefault();
    event.stopPropagation();
    const move=(e:PointerEvent)=>{
      const p=screenToFlowPosition({x:e.clientX,y:e.clientY});
      setEdges(edges=>edges.map(edge=>edge.id===id?{...edge,data:{...edge.data,routeX:p.x,routeY:p.y}}:edge));
    };
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up);
  };

  const resetRoute=(event:React.MouseEvent)=>{
    event.stopPropagation();
    setEdges(edges=>edges.map(edge=>edge.id===id?{...edge,data:{...edge.data,routeX:undefined,routeY:undefined}}:edge));
  };

  return <>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} markerStart={markerStart}
      style={{stroke:selected?'#2563eb':'#64748b',strokeWidth:selected?3:1.8,strokeDasharray:dash}}/>
    <EdgeLabelRenderer>
      {label&&<div className="edge-label nodrag nopan" style={{transform:`translate(-50%, -50%) translate(${labelX}px,${labelY}px)`}}>{label}</div>}
      {selected&&<div
        className="edge-route-handle nodrag nopan"
        title="Drag to reshape connection. Double-click to reset."
        onPointerDown={startDrag}
        onDoubleClick={resetRoute}
        style={{transform:`translate(-50%, -50%) translate(${rx}px,${ry}px)`}}
      />}
    </EdgeLabelRenderer>
  </>;
}
