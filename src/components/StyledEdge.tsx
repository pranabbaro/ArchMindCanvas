import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import type { CanvasEdge } from '../types';

type P={x:number;y:number};
type Segment={a:P;b:P};

function nearly(a:number,b:number,eps=0.5){return Math.abs(a-b)<eps;}

function segmentIntersection(s1:Segment,s2:Segment):P|null{
  const {a,b}=s1,{a:c,b:d}=s2;
  const den=(a.x-b.x)*(c.y-d.y)-(a.y-b.y)*(c.x-d.x);
  if(Math.abs(den)<0.0001)return null;
  const t=((a.x-c.x)*(c.y-d.y)-(a.y-c.y)*(c.x-d.x))/den;
  const u=-((a.x-b.x)*(a.y-c.y)-(a.y-b.y)*(a.x-c.x))/den;
  // Ignore intersections too close to segment ends.
  if(t<=0.08||t>=0.92||u<=0.08||u>=0.92)return null;
  return {x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)};
}

function orthogonalSegments(points:P[]):Segment[]{
  const segs:Segment[]=[];
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1];
    if(nearly(a.x,b.x)||nearly(a.y,b.y)){
      segs.push({a,b});
    }else{
      // split diagonal visual route into an L for robust crossing detection
      const mid={x:b.x,y:a.y};
      segs.push({a,b:mid},{a:mid,b});
    }
  }
  return segs;
}

function routePointsForEdge(edge:any,getNode:(id:string)=>any):P[]{
  const sn=getNode(edge.source),tn=getNode(edge.target);
  if(!sn||!tn)return [];
  const sw=Number(sn.measured?.width||sn.width||sn.style?.width||0);
  const sh=Number(sn.measured?.height||sn.height||sn.style?.height||0);
  const tw=Number(tn.measured?.width||tn.width||tn.style?.width||0);
  const th=Number(tn.measured?.height||tn.height||tn.style?.height||0);
  const start={x:sn.position.x+sw/2,y:sn.position.y+sh/2};
  const end={x:tn.position.x+tw/2,y:tn.position.y+th/2};
  const route=edge.data?.routePoints||[];
  return [start,...route,end];
}

export default function StyledEdge(props:EdgeProps<CanvasEdge>){
 const {id,sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,data,selected,markerEnd,markerStart}=props;
 const {setEdges,screenToFlowPosition,getEdges,getNode}=useReactFlow();

 const kind=data?.connectorStyle||'smoothstep';
 const legacy=Number.isFinite(data?.routeX)&&Number.isFinite(data?.routeY)?[{x:Number(data?.routeX),y:Number(data?.routeY)}]:[];
 const route:P[]=Array.isArray(data?.routePoints)?data!.routePoints as P[]:legacy;

 let path='',labelX=(sourceX+targetX)/2,labelY=(sourceY+targetY)/2;
 const currentPoints:P[]=[{x:sourceX,y:sourceY},...route,{x:targetX,y:targetY}];

 if(route.length){
   if(kind==='bezier'&&route.length===1){
     const p=route[0];
     path=`M ${sourceX},${sourceY} Q ${p.x},${p.y} ${targetX},${targetY}`;
   }else if(kind==='smoothstep'){
     path=`M ${currentPoints[0].x},${currentPoints[0].y}`;
     for(let i=1;i<currentPoints.length;i++){
       const a=currentPoints[i-1],b=currentPoints[i];
       path+=` L ${b.x},${a.y} L ${b.x},${b.y}`;
     }
   }else{
     path=`M ${currentPoints.map(p=>`${p.x},${p.y}`).join(' L ')}`;
   }
   const mid=route[Math.floor(route.length/2)];
   labelX=mid.x;labelY=mid.y;
 }else{
   let r:[string,number,number,number,number];
   if(kind==='straight'||kind==='dotted'||kind==='dashed'){
     r=getStraightPath({sourceX,sourceY,targetX,targetY});
   }else if(kind==='bezier'){
     r=getBezierPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition});
   }else{
     r=getSmoothStepPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,borderRadius:8,offset:24});
   }
   [path,labelX,labelY]=r;
 }

 if(Number.isFinite(data?.labelX)&&Number.isFinite(data?.labelY)){
   labelX=Number(data?.labelX);labelY=Number(data?.labelY);
 }

 const dash=kind==='dotted'?'3 7':kind==='dashed'?'10 7':undefined;
 const label=[data?.label,data?.connectionType,data?.protocol&&data?.port?`${data.protocol} ${data.port}`:data?.protocol||data?.port].filter(Boolean).join(' · ');

 // Find true crossings with unrelated edges.
 const jumpStyle=(data as any)?.lineJumpStyle||'arc';
 const jumpPoints:P[]=[];
 if(jumpStyle!=='none' && (kind==='smoothstep'||kind==='straight'||kind==='dotted'||kind==='dashed')){
   const mySegments=orthogonalSegments(currentPoints);
   for(const other of getEdges()){
     if(other.id===id)continue;
     // Shared endpoint means actual logical connection: do not show a jump.
     if(
       other.source===props.source||other.source===props.target||
       other.target===props.source||other.target===props.target
     )continue;

     const otherPoints=routePointsForEdge(other,getNode);
     if(otherPoints.length<2)continue;
     const otherSegments=orthogonalSegments(otherPoints);

     for(const a of mySegments){
       for(const b of otherSegments){
         const p=segmentIntersection(a,b);
         if(p && !jumpPoints.some(j=>Math.hypot(j.x-p.x,j.y-p.y)<8)){
           jumpPoints.push(p);
         }
       }
     }
   }
 }

 const currentRoute=():P[]=>Array.isArray(data?.routePoints)?data!.routePoints as P[]:legacy;

 const dragPoint=(index:number,event:React.PointerEvent)=>{
   event.preventDefault();event.stopPropagation();
   const start=currentRoute();
   const move=(e:PointerEvent)=>{
     const p=screenToFlowPosition({x:e.clientX,y:e.clientY});
     setEdges(es=>es.map(edge=>edge.id===id?{
       ...edge,
       data:{...edge.data,routePoints:start.map((q,i)=>i===index?p:q),routeX:undefined,routeY:undefined}
     }:edge));
   };
   const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};
   window.addEventListener('pointermove',move);
   window.addEventListener('pointerup',up);
 };

 const addPoint=(e:React.MouseEvent)=>{
   if(!selected)return;
   e.preventDefault();e.stopPropagation();
   const p=screenToFlowPosition({x:e.clientX,y:e.clientY});
   setEdges(es=>es.map(edge=>edge.id===id?{
     ...edge,
     data:{...edge.data,routePoints:[...(Array.isArray(edge.data?.routePoints)?edge.data!.routePoints as P[]:legacy),p],routeX:undefined,routeY:undefined}
   }:edge));
 };

 const removePoint=(index:number,e:React.MouseEvent)=>{
   e.preventDefault();e.stopPropagation();
   setEdges(es=>es.map(edge=>edge.id===id?{
     ...edge,
     data:{...edge.data,routePoints:(Array.isArray(edge.data?.routePoints)?edge.data!.routePoints as P[]:legacy).filter((_:P,i:number)=>i!==index),routeX:undefined,routeY:undefined}
   }:edge));
 };

 const dragLabel=(event:React.PointerEvent)=>{
   event.preventDefault();event.stopPropagation();
   const move=(e:PointerEvent)=>{
     const p=screenToFlowPosition({x:e.clientX,y:e.clientY});
     setEdges(es=>es.map(edge=>edge.id===id?{
       ...edge,data:{...edge.data,labelX:p.x,labelY:p.y}
     }:edge));
   };
   const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};
   window.addEventListener('pointermove',move);
   window.addEventListener('pointerup',up);
 };

 return <>
  <BaseEdge
    id={id}
    path={path}
    markerEnd={markerEnd}
    markerStart={markerStart}
    style={{
      stroke:selected?'#2563eb':'#64748b',
      strokeWidth:data?.strokeWidth||(selected?3:1.8),
      strokeDasharray:dash
    }}
  />

  {/* True crossover bridges only at detected intersections */}
  {jumpStyle==='arc' && jumpPoints.map((p,i)=>
    <g key={`jump-${i}`} pointerEvents="none">
      <line x1={p.x-10} y1={p.y} x2={p.x+10} y2={p.y} stroke="#fff" strokeWidth={(data?.strokeWidth||2)+6} strokeLinecap="round"/>
      <path d={`M ${p.x-10},${p.y} Q ${p.x},${p.y-12} ${p.x+10},${p.y}`}
        fill="none"
        stroke={selected?'#2563eb':'#64748b'}
        strokeWidth={data?.strokeWidth||(selected?3:1.8)}
        strokeLinecap="round"/>
    </g>
  )}

  {jumpStyle==='gap' && jumpPoints.map((p,i)=>
    <line key={`gap-${i}`} x1={p.x-9} y1={p.y} x2={p.x+9} y2={p.y}
      stroke="#fff" strokeWidth={(data?.strokeWidth||2)+6} strokeLinecap="round" pointerEvents="none"/>
  )}

  <path
    d={path}
    fill="none"
    stroke="transparent"
    strokeWidth={28}
    style={{pointerEvents:'stroke',cursor:selected?'crosshair':'pointer'}}
    onDoubleClick={addPoint}
  />

  <EdgeLabelRenderer>
    {label&&<div
      className={`edge-label nodrag nopan ${selected?'edge-label-movable':''}`}
      onPointerDown={selected?dragLabel:undefined}
      style={{transform:`translate(-50%, -50%) translate(${labelX}px,${labelY}px)`}}>
      {label}
    </div>}

    {selected&&route.map((p,i)=>
      <div
        key={i}
        className="edge-route-handle nodrag nopan"
        title="Drag waypoint. Double-click to remove."
        onPointerDown={e=>dragPoint(i,e)}
        onDoubleClick={e=>removePoint(i,e)}
        style={{transform:`translate(-50%, -50%) translate(${p.x}px,${p.y}px)`}}
      />
    )}
  </EdgeLabelRenderer>
 </>;
}
