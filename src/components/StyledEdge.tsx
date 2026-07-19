import { BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, getStraightPath, useReactFlow, type EdgeProps } from '@xyflow/react';
import type { CanvasEdge } from '../types';

export default function StyledEdge(props:EdgeProps<CanvasEdge>){
 const {id,sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,data,selected,markerEnd,markerStart}=props;
 const {setEdges,screenToFlowPosition}=useReactFlow();
 const kind=data?.connectorStyle||'smoothstep';
 const legacy=Number.isFinite(data?.routeX)&&Number.isFinite(data?.routeY)?[{x:Number(data?.routeX),y:Number(data?.routeY)}]:[];
 const route=data?.routePoints?.length?data.routePoints:legacy;
 let path='',labelX=(sourceX+targetX)/2,labelY=(sourceY+targetY)/2;
 if(route.length){
   const all=[{x:sourceX,y:sourceY},...route,{x:targetX,y:targetY}];
   if(kind==='bezier'&&route.length===1){const p=route[0];path=`M ${sourceX},${sourceY} Q ${p.x},${p.y} ${targetX},${targetY}`;}
   else if(kind==='smoothstep'){path=`M ${all[0].x},${all[0].y}`;for(let i=1;i<all.length;i++){const a=all[i-1],b=all[i];path+=` L ${b.x},${a.y} L ${b.x},${b.y}`;}}
   else path=`M ${all.map(p=>`${p.x},${p.y}`).join(' L ')}`;
   const mid=route[Math.floor(route.length/2)];labelX=mid.x;labelY=mid.y;
 }else{
   let r:[string,number,number,number,number];
   if(kind==='straight'||kind==='dotted'||kind==='dashed')r=getStraightPath({sourceX,sourceY,targetX,targetY});
   else if(kind==='bezier')r=getBezierPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition});
   else r=getSmoothStepPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,borderRadius:8,offset:24});
   [path,labelX,labelY]=r;
 }
 if(Number.isFinite(data?.labelX)&&Number.isFinite(data?.labelY)){labelX=Number(data?.labelX);labelY=Number(data?.labelY);}
 const dash=kind==='dotted'?'3 7':kind==='dashed'?'10 7':undefined;
 const label=[data?.label,data?.connectionType,data?.protocol&&data?.port?`${data.protocol} ${data.port}`:data?.protocol||data?.port].filter(Boolean).join(' · ');
 const currentRoute=()=>data?.routePoints?.length?data.routePoints:legacy;
 const dragPoint=(index:number,event:React.PointerEvent)=>{event.preventDefault();event.stopPropagation();const move=(e:PointerEvent)=>{const p=screenToFlowPosition({x:e.clientX,y:e.clientY});setEdges(es=>es.map(edge=>edge.id===id?{...edge,data:{...edge.data,routePoints:currentRoute().map((q,i)=>i===index?p:q),routeX:undefined,routeY:undefined}}:edge));};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);};
 const addPoint=(e:React.MouseEvent)=>{if(!selected)return;e.preventDefault();e.stopPropagation();const p=screenToFlowPosition({x:e.clientX,y:e.clientY});setEdges(es=>es.map(edge=>edge.id===id?{...edge,data:{...edge.data,routePoints:[...((((edge.data as CanvasEdge['data'])?.routePoints)||legacy)),p],routeX:undefined,routeY:undefined}}:edge));};
 const removePoint=(index:number,e:React.MouseEvent)=>{e.preventDefault();e.stopPropagation();setEdges(es=>es.map(edge=>edge.id===id?{...edge,data:{...edge.data,routePoints:((((edge.data as CanvasEdge['data'])?.routePoints)||legacy)).filter((_: {x:number;y:number},i:number)=>i!==index),routeX:undefined,routeY:undefined}}:edge));};
 const dragLabel=(event:React.PointerEvent)=>{event.preventDefault();event.stopPropagation();const move=(e:PointerEvent)=>{const p=screenToFlowPosition({x:e.clientX,y:e.clientY});setEdges(es=>es.map(edge=>edge.id===id?{...edge,data:{...edge.data,labelX:p.x,labelY:p.y}}:edge));};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up);};
 return <><BaseEdge id={id} path={path} markerEnd={markerEnd} markerStart={markerStart} style={{stroke:selected?'#2563eb':'#64748b',strokeWidth:data?.strokeWidth|| (selected?3:1.8),strokeDasharray:dash}}/>{selected&&<path d={path} fill="none" stroke="transparent" strokeWidth={18} style={{pointerEvents:'stroke',cursor:'crosshair'}} onDoubleClick={addPoint}/>}<EdgeLabelRenderer>{label&&<div className={`edge-label nodrag nopan ${selected?'edge-label-movable':''}`} onPointerDown={selected?dragLabel:undefined} style={{transform:`translate(-50%, -50%) translate(${labelX}px,${labelY}px)`}}>{label}</div>}{selected&&route.map((p,i)=><div key={i} className="edge-route-handle nodrag nopan" title="Drag waypoint. Double-click to remove." onPointerDown={e=>dragPoint(i,e)} onDoubleClick={e=>removePoint(i,e)} style={{transform:`translate(-50%, -50%) translate(${p.x}px,${p.y}px)`}}/>)}</EdgeLabelRenderer></>;
}
