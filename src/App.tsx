import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  addEdge, Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow, type Connection, type EdgeChange, type NodeChange,
} from '@xyflow/react';
import { Check, Clipboard, Copy, Download, FilePlus2, FolderOpen, Maximize2, Redo2, Save, ShieldCheck, Sparkles, Undo2, MousePointer2, Hand, Route, Square, Triangle, Type, Trash2, Bot, Code2, DollarSign, Image, FileText, BringToFront, SendToBack, Lock, Unlock } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import ArchitectureNodeComponent from './components/ArchitectureNode';
import ContainerNode from './components/ContainerNode';
import DrawingNodeComponent from './components/DrawingNode';
import StyledEdge from './components/StyledEdge';
import PropertiesPanel from './components/PropertiesPanel';
import Sidebar from './components/Sidebar';
import ValidationPanel from './components/ValidationPanel';
import { isContainerType, resourceMap } from './resourceCatalog';
import type { ArchitectureNode, CanvasEdge, CanvasNode, ConnectorStyle, DrawingNode, ResourceType, ValidationFinding, ArchitectureNodeData, TagMap } from './types';

const STORAGE_KEY='archmindcanvas-v5';
const makeData=(type:ResourceType,label?:string):ArchitectureNodeData=>({label:label||resourceMap[type].label,resourceType:type,description:resourceMap[type].description,region:['tenant','managementGroup'].includes(type)?'Global':'Central India',sku:resourceMap[type].sku,environment:'Production',owner:'',tags:{}});
const containerSizes:Partial<Record<ResourceType,{width:number;height:number}>>={tenant:{width:1200,height:850},managementGroup:{width:1050,height:740},subscription:{width:920,height:650},resourceGroup:{width:780,height:540},virtualNetwork:{width:620,height:420},subnet:{width:360,height:270}};
const containerSize=(type:ResourceType)=>containerSizes[type]||{width:420,height:300};
const starterNodes:CanvasNode[]=[
 {id:'sub',type:'container',position:{x:60,y:50},style:containerSize('subscription'),data:{...makeData('subscription','Contoso Production Subscription'),subscriptionName:'Contoso Production Subscription',subscriptionId:'00000000-0000-0000-0000-000000000000',tags:{Environment:'Production',CostCenter:'CC100'}}},
 {id:'rg',type:'container',parentId:'sub',extent:'parent',position:{x:40,y:90},style:containerSize('resourceGroup'),data:{...makeData('resourceGroup','RG-App-Prod'),resourceGroup:'RG-App-Prod',subscriptionName:'Contoso Production Subscription',tags:{Application:'CustomerPortal'}}},
 {id:'vnet',type:'container',parentId:'rg',extent:'parent',position:{x:35,y:90},style:containerSize('virtualNetwork'),data:{...makeData('virtualNetwork','VNet-Prod'),subscriptionName:'Contoso Production Subscription',resourceGroup:'RG-App-Prod',vnet:'VNet-Prod'}},
 {id:'subnet-app',type:'container',parentId:'vnet',extent:'parent',position:{x:35,y:90},style:containerSize('subnet'),data:{...makeData('subnet','App-Subnet'),subscriptionName:'Contoso Production Subscription',resourceGroup:'RG-App-Prod',vnet:'VNet-Prod',subnet:'App-Subnet'}},
 {id:'app',type:'architecture',parentId:'subnet-app',extent:'parent',position:{x:70,y:110},data:{...makeData('appService','Customer Portal'),subscriptionName:'Contoso Production Subscription',resourceGroup:'RG-App-Prod',vnet:'VNet-Prod',subnet:'App-Subnet',inheritedTags:{Environment:'Production',CostCenter:'CC100',Application:'CustomerPortal'}}},
];
const starterEdges:CanvasEdge[]=[];
type Snapshot={nodes:CanvasNode[];edges:CanvasEdge[]};const clone=(nodes:CanvasNode[],edges:CanvasEdge[]):Snapshot=>({nodes:structuredClone(nodes),edges:structuredClone(edges)});
type Tool='select'|'hand'|'rectangle'|'triangle'|'text';

function Designer(){
 const{screenToFlowPosition,fitView}=useReactFlow();
 const[nodes,setNodes,onNodesChangeBase]=useNodesState<CanvasNode>(starterNodes);const[edges,setEdges,onEdgesChangeBase]=useEdgesState<CanvasEdge>(starterEdges);
 const[selectedNodeId,setSelectedNodeId]=useState<string>();const[selectedEdgeId,setSelectedEdgeId]=useState<string>();const[designName,setDesignName]=useState('My Azure Architecture');const[saveState,setSaveState]=useState<'saved'|'unsaved'>('saved');const[rightPanel,setRightPanel]=useState<'properties'|'validation'|'ai'|'iac'|'cost'|'import'>('properties');const[saveMenuOpen,setSaveMenuOpen]=useState(false);const[contextMenu,setContextMenu]=useState<{x:number;y:number;nodeId?:string}|null>(null);const[lockedIds,setLockedIds]=useState<Set<string>>(new Set());const[tool,setTool]=useState<Tool>('select');const[connectorStyle,setConnectorStyle]=useState<ConnectorStyle>('smoothstep');
 const history=useRef<Snapshot[]>([]),future=useRef<Snapshot[]>([]),copiedNodes=useRef<CanvasNode[]>([]),nextPos=useRef(0);
 const nodeTypes=useMemo(()=>({architecture:ArchitectureNodeComponent,container:ContainerNode,drawing:DrawingNodeComponent}),[]);const edgeTypes=useMemo(()=>({styled:StyledEdge}),[]);
 const selectedNode=nodes.find(n=>n.id===selectedNodeId);const selectedEdge=edges.find(e=>e.id===selectedEdgeId);const isArchitecture=selectedNode&&selectedNode.type!=='drawing';const isDrawing=selectedNode?.type==='drawing';
 const markChanged=useCallback(()=>setSaveState('unsaved'),[]);const pushHistory=useCallback(()=>{history.current.push(clone(nodes,edges));if(history.current.length>60)history.current.shift();future.current=[];},[nodes,edges]);
 const undo=useCallback(()=>{const p=history.current.pop();if(!p)return;future.current.push(clone(nodes,edges));setNodes(p.nodes);setEdges(p.edges);markChanged();},[nodes,edges,setNodes,setEdges,markChanged]);const redo=useCallback(()=>{const n=future.current.pop();if(!n)return;history.current.push(clone(nodes,edges));setNodes(n.nodes);setEdges(n.edges);markChanged();},[nodes,edges,setNodes,setEdges,markChanged]);
 const onConnect=useCallback((c:Connection)=>{pushHistory();setEdges(es=>addEdge({...c,type:'styled',markerEnd:{type:MarkerType.ArrowClosed},data:{connectorStyle,arrowStyle:'end'}},es));markChanged();},[connectorStyle,pushHistory,setEdges,markChanged]);

 const hierarchyData=useMemo(()=>({
  tenants:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='tenant').map(n=>({id:n.id,label:n.data.label})),
  managementGroups:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='managementGroup').map(n=>({id:n.id,label:n.data.label})),
  subscriptions:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='subscription').map(n=>({id:n.id,label:n.data.label})),
  resourceGroups:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='resourceGroup').map(n=>({id:n.id,label:n.data.label})),
  vnets:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='virtualNetwork').map(n=>({id:n.id,label:n.data.label})),
  subnets:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='subnet').map(n=>({id:n.id,label:n.data.label})),
 }),[nodes]);

 const inheritFor=(node:ArchitectureNode,all:CanvasNode[])=>{let cur:CanvasNode|undefined=node;const chain:ArchitectureNode[]=[];const seen=new Set<string>();while(cur?.parentId&&!seen.has(cur.parentId)){seen.add(cur.parentId);const p=all.find(n=>n.id===cur!.parentId);if(!p||p.type==='drawing')break;chain.unshift(p as ArchitectureNode);cur=p;}const data={...node.data};const inherited:TagMap={};for(const p of chain){Object.assign(inherited,p.data.tags||{});if(p.data.resourceType==='tenant')data.tenantId=p.data.tenantId;if(p.data.resourceType==='managementGroup')data.managementGroup=p.data.label;if(p.data.resourceType==='subscription'){data.subscriptionName=p.data.subscriptionName||p.data.label;data.subscriptionId=p.data.subscriptionId;}if(p.data.resourceType==='resourceGroup')data.resourceGroup=p.data.resourceGroup||p.data.label;if(p.data.resourceType==='virtualNetwork')data.vnet=p.data.label;if(p.data.resourceType==='subnet')data.subnet=p.data.label;if(p.data.region&&p.data.region!=='Global'&&!['tenant','managementGroup'].includes(node.data.resourceType))data.region=p.data.region;}data.inheritedTags=inherited;return data;};
 const recalcHierarchy=useCallback((input:CanvasNode[])=>input.map(n=>n.type==='drawing'?n:{...n,data:inheritFor(n as ArchitectureNode,input)} as CanvasNode),[]);

 const compatibleParent=(type:ResourceType)=>type==='managementGroup'?['tenant']:type==='subscription'?['managementGroup','tenant']:type==='resourceGroup'?['subscription']:type==='virtualNetwork'?['resourceGroup']:type==='subnet'?['virtualNetwork']:['subnet','resourceGroup'];
 const findContainer=useCallback((point:{x:number;y:number},type:ResourceType)=>{const wanted=compatibleParent(type);return [...nodes].reverse().find((n):n is ArchitectureNode=>n.type==='container'&&wanted.includes((n as ArchitectureNode).data.resourceType)&&point.x>=n.position.x&&point.x<=n.position.x+Number(n.style?.width||600)&&point.y>=n.position.y&&point.y<=n.position.y+Number(n.style?.height||400));},[nodes]);
 const createResource=useCallback((type:ResourceType,position?:{x:number;y:number})=>{if(!resourceMap[type])return;pushHistory();const o=nextPos.current++%8,id=`${type}-${Date.now()}-${o}`,requested=position||{x:300+o*24,y:180+o*24},parent=position?findContainer(requested,type):undefined,isContainer=isContainerType(type);let node:ArchitectureNode={id,type:isContainer?'container':'architecture',position:parent?{x:Math.max(30,requested.x-parent.position.x),y:Math.max(70,requested.y-parent.position.y)}:requested,data:makeData(type),...(isContainer?{style:containerSize(type)}:{}),...(parent?{parentId:parent.id,extent:'parent' as const}:{})};node={...node,data:inheritFor(node,[...nodes,node])};setNodes(c=>recalcHierarchy([...c,node]));setSelectedNodeId(id);setSelectedEdgeId(undefined);setRightPanel('properties');markChanged();},[pushHistory,findContainer,setNodes,markChanged,nodes,recalcHierarchy]);
 const changeParent=(parentId?:string)=>{if(!selectedNodeId)return;pushHistory();setNodes(current=>{const updated=current.map(n=>n.id===selectedNodeId&&n.type!=='drawing'?{...n,parentId,extent:parentId?'parent' as const:undefined,position:parentId?{x:40,y:90}:n.position}:n);return recalcHierarchy(updated);});markChanged();};
 const updateArchitecture=(updates:Partial<ArchitectureNodeData>)=>{if(!selectedNodeId)return;setNodes(current=>{const updated=current.map(n=>n.id===selectedNodeId&&n.type!=='drawing'?{...n,data:{...n.data,...updates}}:n);return recalcHierarchy(updated);});markChanged();};
 const createDrawing=useCallback((shape:DrawingNode['data']['shape'],position:{x:number;y:number})=>{pushHistory();const id=`${shape}-${Date.now()}`;const node:DrawingNode={id,type:'drawing',position,data:{label:shape==='text'?'Text label':shape==='rectangle'?'Rectangle':'Triangle',shape,fill:shape==='rectangle'?'#ffffff':'#dbeafe',border:'#2563eb',textColor:'#0f172a',fontSize:18},style:shape==='rectangle'?{width:220,height:120}:shape==='triangle'?{width:180,height:150}:{width:150,height:45}};setNodes(c=>[...c,node]);setSelectedNodeId(id);markChanged();},[pushHistory,setNodes,markChanged]);
 const onPaneClick=useCallback((e:React.MouseEvent)=>{if(tool==='select'){setSelectedNodeId(undefined);setSelectedEdgeId(undefined);return;}if(tool==='hand')return;createDrawing(tool,screenToFlowPosition({x:e.clientX,y:e.clientY}));setTool('select');},[tool,createDrawing,screenToFlowPosition]);const onDrop=useCallback((e:DragEvent)=>{e.preventDefault();const type=e.dataTransfer.getData('application/cloud-resource') as ResourceType;if(type)createResource(type,screenToFlowPosition({x:e.clientX,y:e.clientY}));},[createResource,screenToFlowPosition]);
 const updateDrawing=(u:Partial<DrawingNode['data']>)=>{if(!selectedNodeId)return;setNodes(c=>c.map(n=>n.id===selectedNodeId&&n.type==='drawing'?{...n,data:{...n.data,...u}}:n));markChanged();};const updateEdge=(u:Partial<NonNullable<CanvasEdge['data']>>)=>{if(!selectedEdgeId)return;setEdges(c=>c.map(e=>e.id===selectedEdgeId?{...e,data:{...e.data,...u}}:e));markChanged();};
 const selectedIds=()=>{const ids=nodes.filter(n=>n.selected).map(n=>n.id);if(selectedNodeId&&!ids.includes(selectedNodeId))ids.push(selectedNodeId);return ids;};
 const duplicateSelection=()=>{const ids=selectedIds();if(!ids.length)return;pushHistory();const stamp=Date.now();const source=nodes.filter(n=>ids.includes(n.id));const map=new Map(source.map((n,i)=>[n.id,`dup-${stamp}-${i}`]));const copies=source.map(n=>({...structuredClone(n),id:map.get(n.id)!,selected:true,position:{x:n.position.x+36,y:n.position.y+36},parentId:n.parentId&&map.has(n.parentId)?map.get(n.parentId):n.parentId} as CanvasNode));setNodes(c=>[...c.map(n=>({...n,selected:false} as CanvasNode)),...copies]);setSelectedNodeId(copies[0]?.id);markChanged();setContextMenu(null);};
 const lockSelection=()=>{const ids=selectedIds();setLockedIds(s=>{const n=new Set(s);ids.forEach(id=>n.add(id));return n;});setContextMenu(null);};
 const unlockSelection=()=>{const ids=selectedIds();setLockedIds(s=>{const n=new Set(s);ids.forEach(id=>n.delete(id));return n;});setContextMenu(null);};
 const bringForward=()=>{const ids=new Set(selectedIds());if(!ids.size)return;pushHistory();setNodes(c=>{const arr=[...c];for(let i=arr.length-2;i>=0;i--){if(ids.has(arr[i].id)&&!ids.has(arr[i+1].id)){[arr[i],arr[i+1]]=[arr[i+1],arr[i]];}}return arr;});markChanged();setContextMenu(null);};
 const sendBackward=()=>{const ids=new Set(selectedIds());if(!ids.size)return;pushHistory();setNodes(c=>{const arr=[...c];for(let i=1;i<arr.length;i++){if(ids.has(arr[i].id)&&!ids.has(arr[i-1].id)){[arr[i],arr[i-1]]=[arr[i-1],arr[i]];}}return arr;});markChanged();setContextMenu(null);};
 const groupSelection=()=>{const ids=selectedIds();if(ids.length<2)return;pushHistory();const chosen=nodes.filter(n=>ids.includes(n.id));const minX=Math.min(...chosen.map(n=>n.position.x)),minY=Math.min(...chosen.map(n=>n.position.y));const maxX=Math.max(...chosen.map(n=>n.position.x+Number(n.measured?.width||n.style?.width||220))),maxY=Math.max(...chosen.map(n=>n.position.y+Number(n.measured?.height||n.style?.height||120)));const gid=`group-${Date.now()}`;const group:DrawingNode={id:gid,type:'drawing',position:{x:minX-30,y:minY-55},data:{label:'Group',shape:'rectangle',fill:'transparent',border:'#94a3b8',textColor:'#64748b',fontSize:14},style:{width:maxX-minX+60,height:maxY-minY+85},selectable:true};setNodes(c=>[...c.map(n=>ids.includes(n.id)?{...n,parentId:gid,extent:'parent' as const,position:{x:n.position.x-(minX-30),y:n.position.y-(minY-55)},selected:false}:n),group]);setSelectedNodeId(gid);markChanged();setContextMenu(null);};
 const ungroupSelection=()=>{if(!selectedNodeId)return;const group=nodes.find(n=>n.id===selectedNodeId&&n.type==='drawing'&&n.data.label==='Group');if(!group)return;pushHistory();setNodes(c=>c.filter(n=>n.id!==group.id).map(n=>n.parentId===group.id?{...n,parentId:undefined,extent:undefined,position:{x:n.position.x+group.position.x,y:n.position.y+group.position.y}}:n));setSelectedNodeId(undefined);markChanged();setContextMenu(null);};

 const getSelectedLayoutNodes=()=>nodes.filter(n=>n.selected||n.id===selectedNodeId);
 const alignSelected=(mode:'left'|'right'|'top'|'bottom'|'hcenter'|'vcenter')=>{
   const chosen=getSelectedLayoutNodes();if(chosen.length<2)return;
   pushHistory();
   const left=Math.min(...chosen.map(n=>n.position.x));
   const right=Math.max(...chosen.map(n=>n.position.x+Number(n.measured?.width||n.style?.width||220)));
   const top=Math.min(...chosen.map(n=>n.position.y));
   const bottom=Math.max(...chosen.map(n=>n.position.y+Number(n.measured?.height||n.style?.height||120)));
   const cx=(left+right)/2,cy=(top+bottom)/2;
   const ids=new Set(chosen.map(n=>n.id));
   setNodes(current=>current.map(n=>{
     if(!ids.has(n.id)||lockedIds.has(n.id))return n;
     const w=Number(n.measured?.width||n.style?.width||220),h=Number(n.measured?.height||n.style?.height||120);
     let x=n.position.x,y=n.position.y;
     if(mode==='left')x=left;if(mode==='right')x=right-w;if(mode==='top')y=top;if(mode==='bottom')y=bottom-h;
     if(mode==='hcenter')x=cx-w/2;if(mode==='vcenter')y=cy-h/2;
     return {...n,position:{x,y}} as CanvasNode;
   }));
   markChanged();
 };
 const distributeSelected=(axis:'h'|'v')=>{
   const chosen=getSelectedLayoutNodes();if(chosen.length<3)return;
   pushHistory();
   const sorted=[...chosen].sort((a,b)=>axis==='h'?a.position.x-b.position.x:a.position.y-b.position.y);
   const ids=new Set(sorted.map(n=>n.id));
   if(axis==='h'){
     const first=sorted[0],last=sorted[sorted.length-1];
     const start=first.position.x,end=last.position.x;
     const step=(end-start)/(sorted.length-1);
     setNodes(c=>c.map(n=>{const i=sorted.findIndex(x=>x.id===n.id);return ids.has(n.id)&&i>=0&&!lockedIds.has(n.id)?{...n,position:{...n.position,x:start+i*step}} as CanvasNode:n;}));
   }else{
     const first=sorted[0],last=sorted[sorted.length-1];
     const start=first.position.y,end=last.position.y;
     const step=(end-start)/(sorted.length-1);
     setNodes(c=>c.map(n=>{const i=sorted.findIndex(x=>x.id===n.id);return ids.has(n.id)&&i>=0&&!lockedIds.has(n.id)?{...n,position:{...n.position,y:start+i*step}} as CanvasNode:n;}));
   }
   markChanged();
 };
 const autoTidy=()=>{
   pushHistory();
   setNodes(current=>{
     const byParent=new Map<string,CanvasNode[]>();
     current.forEach(n=>{const key=n.parentId||'__root__';if(!byParent.has(key))byParent.set(key,[]);byParent.get(key)!.push(n);});
     const result=current.map(n=>({...n} as CanvasNode));
     const index=new Map(result.map(n=>[n.id,n]));
     byParent.forEach((items,parent)=>{
       const movable=items.filter(n=>!lockedIds.has(n.id));
       const cols=Math.max(1,Math.ceil(Math.sqrt(movable.length)));
       movable.forEach((n,i)=>{
         const target=index.get(n.id)!;
         const baseX=parent==='__root__'?80:40,baseY=parent==='__root__'?80:90;
         target.position={x:baseX+(i%cols)*280,y:baseY+Math.floor(i/cols)*160};
       });
     });
     return result;
   });
   markChanged();
   setTimeout(()=>fitView({padding:.1,duration:450}),80);
 };
 const deleteSelected=useCallback(()=>{const ids=nodes.filter(n=>n.selected).map(n=>n.id);if(selectedNodeId&&!ids.includes(selectedNodeId))ids.push(selectedNodeId);if(!ids.length&&!selectedEdgeId)return;pushHistory();const s=new Set(ids);setNodes(c=>recalcHierarchy(c.filter(n=>!s.has(n.id))));setEdges(c=>c.filter(e=>!s.has(e.source)&&!s.has(e.target)&&e.id!==selectedEdgeId));setSelectedNodeId(undefined);setSelectedEdgeId(undefined);markChanged();},[nodes,selectedNodeId,selectedEdgeId,pushHistory,setNodes,setEdges,markChanged,recalcHierarchy]);
 const duplicateSelected=()=>{if(!selectedNode)return;pushHistory();const id=`copy-${Date.now()}`;setNodes(c=>recalcHierarchy([...c,{...structuredClone(selectedNode),id,selected:false,position:{x:selectedNode.position.x+36,y:selectedNode.position.y+36}} as CanvasNode]));setSelectedNodeId(id);markChanged();};const copySelection=useCallback(()=>{copiedNodes.current=structuredClone(nodes.filter(n=>n.selected||n.id===selectedNodeId));},[nodes,selectedNodeId]);const pasteSelection=useCallback(()=>{if(!copiedNodes.current.length)return;pushHistory();const pasted=copiedNodes.current.map((n,i)=>({...structuredClone(n),id:`paste-${Date.now()}-${i}`,position:{x:n.position.x+42,y:n.position.y+42},selected:true,parentId:undefined,extent:undefined} as CanvasNode));setNodes(c=>recalcHierarchy([...c.map(n=>({...n,selected:false} as CanvasNode)),...pasted]));markChanged();},[pushHistory,setNodes,markChanged,recalcHierarchy]);
 const onNodesChange=useCallback((changes:NodeChange<CanvasNode>[])=>{const allowed=changes.filter((c:any)=>!(('id'in c)&&lockedIds.has(c.id)&&['position','dimensions','remove'].includes(c.type)));onNodesChangeBase(allowed);if(allowed.some(c=>c.type!=='select'))markChanged();},[onNodesChangeBase,markChanged]);const onEdgesChange=useCallback((changes:EdgeChange<CanvasEdge>[])=>{onEdgesChangeBase(changes);if(changes.some(c=>c.type!=='select'))markChanged();},[onEdgesChangeBase,markChanged]);

 const architectureNodes=nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing');
 const [aiPrompt,setAiPrompt]=useState('Create a secure 3-tier Azure application in West Europe with Application Gateway WAF, App Service, Azure SQL, Key Vault, private endpoints and monitoring.');
 const [iacMode,setIacMode]=useState<'terraform'|'bicep'>('terraform');
 const [costCurrency,setCostCurrency]=useState<'USD'|'EUR'|'INR'|'GBP'>('USD');
 const [iacImportType,setIacImportType]=useState<'terraform'|'bicep'|'json'>('terraform');
 const [iacImportCode,setIacImportCode]=useState('');
 const [pricingStatus,setPricingStatus]=useState<'idle'|'loading'|'live'|'partial'|'error'>('idle');
 const [livePrices,setLivePrices]=useState<Record<string,number>>({});

 const [repoProvider,setRepoProvider]=useState<'github'|'azuredevops'>('github');
 const [repoName,setRepoName]=useState('');
 const [repoBranch,setRepoBranch]=useState('main');
 const [repoFolder,setRepoFolder]=useState('infrastructure/');
 const [commitMessage,setCommitMessage]=useState('Add architecture generated by ArchMindCanvas');
 const buildAiArchitecture=()=>{pushHistory();
  const sub='ai-sub',rg='ai-rg',vnet='ai-vnet',web='ai-web-subnet',app='ai-app-subnet',data='ai-data-subnet';
  const mk=(id:string,type:ResourceType,label:string,parentId?:string,pos={x:40,y:90},size?:{width:number;height:number}):ArchitectureNode=>({
    id,type:isContainerType(type)?'container':'architecture',parentId,extent:parentId?'parent':undefined,position:pos,
    style:isContainerType(type)?(size||containerSize(type)):undefined,
    data:{...makeData(type,label),region:'West Europe',environment:'Production',tags:{Environment:'Production',GeneratedBy:'ArchMind AI'}}
  });
  let ns:CanvasNode[]=[
    mk(sub,'subscription','AI Generated Production Subscription',undefined,{x:40,y:35},{width:1320,height:760}),
    mk(rg,'resourceGroup','RG-ThreeTier-Prod',sub,{x:45,y:70},{width:1210,height:630}),
    mk(vnet,'virtualNetwork','VNet-ThreeTier',rg,{x:35,y:75},{width:860,height:490}),
    mk(web,'subnet','Ingress-Subnet',vnet,{x:30,y:85},{width:250,height:330}),
    mk(app,'subnet','App-Subnet',vnet,{x:300,y:85},{width:250,height:330}),
    mk(data,'subnet','Data-Subnet',vnet,{x:570,y:85},{width:250,height:330}),
    mk('agw','applicationGateway','Application Gateway WAF',web,{x:20,y:105}),
    mk('appsvc','appService','Web App',app,{x:20,y:105}),
    mk('pe','privateEndpoint','SQL Private Endpoint',data,{x:20,y:75}),
    mk('sql','sqlDatabase','Azure SQL Database',data,{x:20,y:220}),
    mk('kv','keyVault','Key Vault',rg,{x:920,y:170}),
    mk('mon','monitor','Azure Monitor',rg,{x:920,y:350})
  ];
  ns=recalcHierarchy(ns);
  const es:CanvasEdge[]=[
    ['agw','appsvc','HTTPS'],
    ['appsvc','pe','Private Link'],
    ['pe','sql','Private Endpoint'],
    ['appsvc','kv','Managed Identity'],
    ['appsvc','mon','Telemetry']
  ].map((x,i)=>({id:'ai-e'+i,source:x[0],target:x[1],type:'styled',markerEnd:{type:MarkerType.ArrowClosed},data:{connectorStyle:'smoothstep',label:x[2],connectionType:x[2],arrowStyle:'end'}}));
  setNodes(ns);setEdges(es);setDesignName('AI Generated Secure 3-Tier Architecture');setSaveState('unsaved');setRightPanel('ai');
  setTimeout(()=>fitView({padding:.08}),80);
 };
 const autoArrange=()=>{pushHistory();
  const updates:Record<string,{x:number;y:number;width?:number;height?:number}>={
    'ai-sub':{x:40,y:35,width:1320,height:760},'ai-rg':{x:45,y:70,width:1210,height:630},
    'ai-vnet':{x:35,y:75,width:860,height:490},'ai-web-subnet':{x:30,y:85,width:250,height:330},
    'ai-app-subnet':{x:300,y:85,width:250,height:330},'ai-data-subnet':{x:570,y:85,width:250,height:330},
    'agw':{x:20,y:105},'appsvc':{x:20,y:105},'pe':{x:20,y:75},'sql':{x:20,y:220},
    'kv':{x:920,y:170},'mon':{x:920,y:350}
  };
  setNodes(c=>c.map(n=>{const u=updates[n.id];if(!u)return n;return {...n,position:{x:u.x,y:u.y},style:u.width?{...(n.style||{}),width:u.width,height:u.height}:n.style} as CanvasNode;}));
  setEdges(c=>c.map(e=>({...e,data:{...e.data,connectorStyle:'smoothstep'}})));
  markChanged();setTimeout(()=>fitView({padding:.08}),80);
 };
 const costRates:Record<string,number>={
  virtualMachine:120,virtualMachineScaleSet:240,appService:75,functions:15,aks:220,containerApps:45,containerInstances:35,
  applicationGateway:180,loadBalancer:25,firewall:950,natGateway:40,vpnGateway:140,expressRoute:300,frontDoor:90,bastion:140,
  sqlDatabase:160,sqlManagedInstance:900,cosmosDb:120,postgresql:180,mysql:160,redis:110,
  storageAccount:25,blobStorage:20,fileStorage:45,dataLake:35,netAppFiles:250,
  keyVault:5,defender:25,sentinel:80,monitor:30,logAnalytics:45,applicationInsights:25,
  apiManagement:180,serviceBus:40,eventGrid:15,eventHubs:85,dataFactory:60,synapse:250,databricks:300,machineLearning:100,openAI:150,
  privateEndpoint:8,publicIp:4,dns:2,privateDns:2,containerRegistry:20
 };
 const costCategory=(t:string)=>['virtualMachine','virtualMachineScaleSet','appService','functions','aks','containerApps','containerInstances'].includes(t)?'Compute':
 ['applicationGateway','loadBalancer','firewall','natGateway','vpnGateway','expressRoute','frontDoor','bastion','privateEndpoint','publicIp','dns','privateDns'].includes(t)?'Networking':
 ['sqlDatabase','sqlManagedInstance','cosmosDb','postgresql','mysql','redis'].includes(t)?'Database':
 ['storageAccount','blobStorage','fileStorage','dataLake','netAppFiles'].includes(t)?'Storage':
 ['keyVault','defender','sentinel'].includes(t)?'Security':
 ['monitor','logAnalytics','applicationInsights'].includes(t)?'Monitoring':'Other';
 const fx:Record<string,number>={USD:1,EUR:.92,INR:83,GBP:.79};
 const costItems=nodes.filter((n):n is ArchitectureNode=>n.type==='architecture').map(n=>{const baseline=costRates[n.data.resourceType]||0;const monthly=livePrices[n.id]??baseline;return{id:n.id,name:n.data.label,type:n.data.resourceType,category:costCategory(n.data.resourceType),monthly,live:livePrices[n.id]!==undefined};});
 const monthlyCost=costItems.reduce((s,x)=>s+x.monthly,0);
 const costBreakdown=costItems.reduce((a,x)=>{a[x.category]=(a[x.category]||0)+x.monthly;return a;},{} as Record<string,number>);
 const money=(v:number)=>new Intl.NumberFormat(undefined,{style:'currency',currency:costCurrency,maximumFractionDigits:0}).format(v*fx[costCurrency]);

 const normalizeRegion=(v:string)=>v.toLowerCase().replace(/\s+/g,'');
 const serviceForType:Record<string,string>={
  virtualMachine:'Virtual Machines',virtualMachineScaleSet:'Virtual Machines',appService:'Azure App Service',
  functions:'Functions',aks:'Azure Kubernetes Service',applicationGateway:'Application Gateway',
  loadBalancer:'Load Balancer',firewall:'Azure Firewall',natGateway:'NAT Gateway',vpnGateway:'VPN Gateway',
  bastion:'Azure Bastion',sqlDatabase:'SQL Database',sqlManagedInstance:'SQL Managed Instance',
  cosmosDb:'Azure Cosmos DB',postgresql:'Azure Database for PostgreSQL',mysql:'Azure Database for MySQL',
  redis:'Azure Cache for Redis',storageAccount:'Storage',keyVault:'Key Vault',monitor:'Azure Monitor',
  logAnalytics:'Log Analytics',applicationInsights:'Application Insights',containerRegistry:'Container Registry',
  privateEndpoint:'Private Link'
 };
 const refreshLivePricing=async()=>{
  setPricingStatus('loading'); const next:Record<string,number>={}; let ok=0,failed=0;
  const priced=costItems.filter(x=>serviceForType[x.type]).slice(0,30);
  await Promise.all(priced.map(async x=>{
   try{
    const node=nodes.find(n=>n.id===x.id) as ArchitectureNode|undefined;
    const region=normalizeRegion(node?.data?.region||'westeurope');
    const service=serviceForType[x.type];
    const filter=`serviceName eq '${service.replace(/'/g,"''")}' and armRegionName eq '${region}' and priceType eq 'Consumption'`;
    const url=`https://prices.azure.com/api/retail/prices?currencyCode='${costCurrency}'&$filter=${encodeURIComponent(filter)}`;
    const r=await fetch(url); if(!r.ok)throw new Error('pricing');
    const j=await r.json(); const items=(j.Items||[]).filter((i:any)=>i.retailPrice>0);
    if(items.length){const item=items[0]; const unit=String(item.unitOfMeasure||'').toLowerCase(); next[x.id]=unit.includes('hour')?item.retailPrice*730:item.retailPrice;ok++;}else failed++;
   }catch{failed++;}
  }));
  setLivePrices(next);setPricingStatus(ok===0?'error':failed?'partial':'live');
 };
 const uploadIacFile=()=>{
  const input=document.createElement('input');
  input.type='file';
  input.accept='.tf,.bicep,.json,.txt';
  input.onchange=async()=>{
    const file=input.files?.[0];
    if(!file)return;
    try{
      const text=await file.text();
      setIacImportCode(text);
      const name=file.name.toLowerCase();
      if(name.endsWith('.json'))setIacImportType('json');
      else if(name.endsWith('.bicep'))setIacImportType('bicep');
      else setIacImportType('terraform');
      setRightPanel('import');
    }catch{
      alert('Unable to read import file.');
    }
  };
  input.click();
 };
 const importIacToDiagram=()=>{
  if(!iacImportCode.trim()){alert('Paste or upload JSON, Terraform, or Bicep first.');return;}

  if(iacImportType==='json'){
    try{
      const parsed=JSON.parse(iacImportCode);
      const importedNodes=recalcHierarchy(parsed.nodes||[]);
      setNodes(importedNodes);
      setEdges(parsed.edges||[]);
      setDesignName(parsed.designName||'Imported Architecture');
      setSaveState('unsaved');
      setTimeout(()=>fitView({padding:.12,duration:500}),120);
      setRightPanel('properties');
    }catch{
      alert('Invalid ArchMindCanvas JSON file.');
    }
    return;
  }

  const code=iacImportCode;

  const mapType=(raw:string):ResourceType=>{
   const s=raw.toLowerCase();
   if(s.includes('resource_group'))return'resourceGroup';
   if(s.includes('virtual_network'))return'virtualNetwork';
   if(s.includes('subnet'))return'subnet';
   if(s.includes('linux_virtual_machine')||s.includes('windows_virtual_machine')||s.includes('virtual_machine'))return'virtualMachine';
   if(s.includes('kubernetes_cluster'))return'aks';
   if(s.includes('application_gateway'))return'applicationGateway';
   if(s.includes('load_balancer'))return'loadBalancer';
   if(s.includes('firewall'))return'firewall';
   if(s.includes('key_vault'))return'keyVault';
   if(s.includes('mssql_database')||s.includes('sql_database'))return'sqlDatabase';
   if(s.includes('mssql_server')||s.includes('sql_server'))return'sqlDatabase';
   if(s.includes('storage_account'))return'storageAccount';
   if(s.includes('private_endpoint'))return'privateEndpoint';
   if(s.includes('container_registry'))return'containerRegistry';
   if(s.includes('service_plan')||s.includes('web_app'))return'appService';
   if(s.includes('public_ip'))return'publicIp';
   if(s.includes('network_security_group'))return'networkSecurityGroup';
   if(s.includes('route_table'))return'routeTable';
   if(s.includes('nat_gateway'))return'natGateway';
   if(s.includes('bastion'))return'bastion';
   if(s.includes('vpn_gateway')||s.includes('virtual_network_gateway'))return'vpnGateway';
   return'virtualMachine';
  };

  type Entry={
    id:string; symbol:string; rawType:string; type:ResourceType; label:string; body:string;
    parent?:string; subnetRef?:string; rgRef?:string; vnetRef?:string; nicRefs?:string[];
  };
  const entries:Entry[]=[];

  if(iacImportType==='terraform'){
    const rx=/resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([\s\S]*?)(?=\n\}|\nresource\s+"|$)/g;let m;
    while((m=rx.exec(code))!==null){
      entries.push({id:`imp-${m[2]}`,symbol:m[2],rawType:m[1],type:mapType(m[1]),label:m[2].replace(/_/g,' '),body:m[3]||''});
    }

    const bySymbol=new Map(entries.map(e=>[e.symbol,e]));
    const findRef=(body:string,kind:string)=>{
      const mm=body.match(new RegExp(`azurerm_${kind}\\.([A-Za-z0-9_]+)`));
      return mm?.[1];
    };
    const findAllRefs=(body:string,kind:string)=>[...body.matchAll(new RegExp(`azurerm_${kind}\\.([A-Za-z0-9_]+)`,'g'))].map(x=>x[1]);

    for(const e of entries){
      e.rgRef=findRef(e.body,'resource_group');
      e.vnetRef=findRef(e.body,'virtual_network');
      e.subnetRef=findRef(e.body,'subnet');
      e.nicRefs=findAllRefs(e.body,'network_interface');

      if(e.type==='virtualNetwork'){
        if(e.rgRef&&bySymbol.get(e.rgRef))e.parent=bySymbol.get(e.rgRef)!.id;
      }else if(e.type==='subnet'){
        if(e.vnetRef&&bySymbol.get(e.vnetRef))e.parent=bySymbol.get(e.vnetRef)!.id;
      }else if(e.rawType.toLowerCase().includes('network_interface')){
        if(e.subnetRef&&bySymbol.get(e.subnetRef))e.parent=bySymbol.get(e.subnetRef)!.id;
      }else if(e.type==='privateEndpoint'){
        if(e.subnetRef&&bySymbol.get(e.subnetRef))e.parent=bySymbol.get(e.subnetRef)!.id;
      }else if(e.type==='virtualMachine'){
        const nic=e.nicRefs?.map(n=>bySymbol.get(n)).find(Boolean);
        if(nic?.parent)e.parent=nic.parent;
        else if(e.subnetRef&&bySymbol.get(e.subnetRef))e.parent=bySymbol.get(e.subnetRef)!.id;
        else if(e.rgRef&&bySymbol.get(e.rgRef))e.parent=bySymbol.get(e.rgRef)!.id;
      }else if(['applicationGateway','aks','bastion','firewall','loadBalancer','natGateway'].includes(e.type)){
        if(e.subnetRef&&bySymbol.get(e.subnetRef))e.parent=bySymbol.get(e.subnetRef)!.id;
        else if(e.rgRef&&bySymbol.get(e.rgRef))e.parent=bySymbol.get(e.rgRef)!.id;
      }else{
        if(e.rgRef&&bySymbol.get(e.rgRef))e.parent=bySymbol.get(e.rgRef)!.id;
      }
    }
  }else{
    const rx=/resource\s+([A-Za-z0-9_]+)\s+'([^']+)'(?:\s*=\s*)?\{([\s\S]*?)(?=\n\}|\nresource\s+|$)/g;let m;
    while((m=rx.exec(code))!==null){
      entries.push({id:`imp-${m[1]}`,symbol:m[1],rawType:m[2],type:mapType(m[2]),label:m[1],body:m[3]||''});
    }
    const rg=entries.find(e=>e.type==='resourceGroup');
    const vnet=entries.find(e=>e.type==='virtualNetwork');
    const subnets=entries.filter(e=>e.type==='subnet');
    entries.forEach(e=>{
      if(e.type==='virtualNetwork'&&rg)e.parent=rg.id;
      else if(e.type==='subnet'&&vnet)e.parent=vnet.id;
      else if(!['resourceGroup','virtualNetwork','subnet'].includes(e.type)){
        const matching=subnets.find(s=>new RegExp(`\\b${s.symbol}\\b`,'i').test(e.body));
        e.parent=matching?.id||vnet?.id||rg?.id;
      }
    });
  }

  if(!entries.length){alert('No supported Azure resources were detected.');return;}

  const renderEntries=entries.filter(e=>!e.rawType.toLowerCase().includes('network_interface'));
  const children=(id:string)=>renderEntries.filter(e=>e.parent===id);

  // Collision-free recursive layout.
  const nodeW=250, nodeH=105, gapX=40, gapY=35, headerPad=80, outerPad=35;
  const layouts=new Map<string,{x:number;y:number;width?:number;height?:number}>();

  const layoutChildren=(parentId:string)=>{
    const kids=children(parentId);
    const containerKids=kids.filter(k=>isContainerType(k.type));
    const leafKids=kids.filter(k=>!isContainerType(k.type));

    let cursorY=headerPad;

    // Lay out nested containers vertically with spacing.
    for(const c of containerKids){
      layoutChildren(c.id);
      const childLayout=layouts.get(c.id)!;
      layouts.set(c.id,{...childLayout,x:outerPad,y:cursorY});
      cursorY += (childLayout.height||300)+gapY;
    }

    // Lay out leaf resources in a 2-column grid.
    if(leafKids.length){
      const cols=2;
      const rows=Math.ceil(leafKids.length/cols);
      leafKids.forEach((k,i)=>{
        layouts.set(k.id,{
          x:outerPad+(i%cols)*(nodeW+gapX),
          y:cursorY+Math.floor(i/cols)*(nodeH+gapY)
        });
      });
      cursorY += rows*(nodeH+gapY)+outerPad;
    }

    const width=Math.max(
      360,
      containerKids.length?Math.max(...containerKids.map(c=>(layouts.get(c.id)?.width||360)+outerPad*2)):0,
      leafKids.length?outerPad*2+Math.min(2,leafKids.length)*nodeW+Math.max(0,Math.min(2,leafKids.length)-1)*gapX:0
    );
    const height=Math.max(260,cursorY);
    const self=renderEntries.find(e=>e.id===parentId);
    if(self)layouts.set(parentId,{x:0,y:0,width,height});
  };

  const roots=renderEntries.filter(e=>!e.parent);
  roots.forEach(r=>layoutChildren(r.id));

  // Position multiple roots side-by-side.
  let rootX=50;
  roots.forEach(r=>{
    const l=layouts.get(r.id)||{x:0,y:0,width:900,height:600};
    layouts.set(r.id,{...l,x:rootX,y:40});
    rootX+=(l.width||900)+80;
  });

  const imported:CanvasNode[]=[];
  for(const e of renderEntries){
    const known=resourceMap[e.type];
    const fallbackType:ResourceType=known?e.type:'virtualMachine';
    const l=layouts.get(e.id)||{x:50,y:50};
    imported.push({
      id:e.id,
      type:isContainerType(e.type)?'container':'architecture',
      parentId:e.parent,
      extent:e.parent?'parent':undefined,
      position:{x:l.x,y:l.y},
      style:isContainerType(e.type)?{width:l.width||500,height:l.height||320}:undefined,
      data:{...makeData(fallbackType,e.label),resourceType:e.type,region:'West Europe',environment:'Development',description:'Imported from IaC',tags:{ImportedFrom:'IaC'}}
    } as ArchitectureNode);
  }

  // Basic dependency edges between non-container resources.
  const importedEdges:any[]=[];
  for(const a of renderEntries){
    for(const b of renderEntries){
      if(a.id===b.id||isContainerType(a.type)||isContainerType(b.type))continue;
      if(new RegExp(`\\b${b.symbol}\\b`,'i').test(a.body)){
        if(!importedEdges.some(x=>x.source===b.id&&x.target===a.id)){
          importedEdges.push({id:`rel-${b.id}-${a.id}`,source:b.id,target:a.id,type:'styled',data:{connectorStyle:'smoothstep',label:'dependency'}});
        }
      }
    }
  }

  const rank:Record<string,number>={resourceGroup:1,virtualNetwork:2,subnet:3};
  imported.sort((a,b)=>(rank[(a as ArchitectureNode).data.resourceType]||9)-(rank[(b as ArchitectureNode).data.resourceType]||9));

  setNodes(recalcHierarchy(imported));
  setEdges(importedEdges.slice(0,30));
  setDesignName('Imported Architecture');
  setSaveState('unsaved');
  setTimeout(()=>fitView({padding:.08,duration:600}),160);
  setRightPanel('properties');
 }; const terraformCode=useMemo(()=>{const lines=['terraform { required_providers { azurerm = { source = "hashicorp/azurerm" version = "~> 4.0" } } }','provider "azurerm" { features {} }',''];architectureNodes.forEach((n,i)=>{const safe=n.data.label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||`resource_${i}`;if(n.data.resourceType==='resourceGroup')lines.push(`resource "azurerm_resource_group" "${safe}" {\n  name = "${n.data.label}"\n  location = "${n.data.region}"\n}\n`);else if(n.data.resourceType==='virtualNetwork')lines.push(`# Virtual Network: ${n.data.label}\nresource "azurerm_virtual_network" "${safe}" {\n  name = "${n.data.label}"\n  location = "${n.data.region}"\n  address_space = ["10.0.0.0/16"]\n}\n`);else if(!['tenant','managementGroup','subscription','subnet'].includes(n.data.resourceType))lines.push(`# TODO ${n.data.resourceType}: ${n.data.label}\n# Resource Group: ${n.data.resourceGroup||'unassigned'} | Region: ${n.data.region}\n`);});return lines.join('\n');},[architectureNodes]);
 const bicepCode=useMemo(()=>{const lines=["targetScope = 'subscription'",''];architectureNodes.filter(n=>n.data.resourceType==='resourceGroup').forEach((n,i)=>lines.push(`resource rg${i} 'Microsoft.Resources/resourceGroups@2024-03-01' = {\n  name: '${n.data.label}'\n  location: '${n.data.region}'\n}\n`));architectureNodes.filter(n=>!['tenant','managementGroup','subscription','resourceGroup'].includes(n.data.resourceType)).forEach(n=>lines.push(`// TODO ${n.data.resourceType}: ${n.data.label} | RG: ${n.data.resourceGroup||'unassigned'} | ${n.data.region}`));return lines.join('\n');},[architectureNodes]);
 const iacCode=iacMode==='terraform'?terraformCode:bicepCode;
 const copyIac=()=>navigator.clipboard.writeText(iacCode);
 const downloadIac=()=>download(new Blob([iacCode],{type:'text/plain'}),iacMode==='terraform'?'main.tf':'main.bicep');
 const downloadIacBundle=()=>{const files=iacMode==='terraform'
 ? `# providers.tf\nterraform { required_providers { azurerm = { source = "hashicorp/azurerm" version = "~> 4.0" } } }\nprovider "azurerm" { features {} }\n\n# main.tf\n${terraformCode}\n\n# variables.tf\nvariable "environment" { type = string default = "prod" }\n\n# outputs.tf\noutput "architecture_name" { value = "${designName}" }`
 : `// main.bicep\n${bicepCode}\n\n// parameters.bicepparam\nusing './main.bicep'`;
 download(new Blob([files],{type:'text/plain'}),iacMode==='terraform'?'archmindcanvas-terraform-bundle.txt':'archmindcanvas-bicep-bundle.txt');};
 const prepareRepoPush=()=>{if(!repoName.trim()){alert('Enter a repository name first.');return;}alert(`Repository package prepared for ${repoProvider==='github'?'GitHub':'Azure DevOps'}: ${repoName} / ${repoBranch} / ${repoFolder}.\n\nFor security, v5.3 does not store PATs or tokens in the browser. Connect a secure backend/GitHub App or Azure DevOps OAuth service to enable direct push.`);};

 const findings=useMemo<ValidationFinding[]>(()=>{const r:ValidationFinding[]=[];architectureNodes.forEach(n=>{if(n.data.resourceType==='publicIp')r.push({id:`pub-${n.id}`,severity:'warning',title:'Public IP detected',message:'Prefer controlled ingress, Bastion, Front Door or private access where appropriate.',nodeId:n.id});if(!['tenant','managementGroup','subscription'].includes(n.data.resourceType)&&!n.data.subscriptionName)r.push({id:`sub-${n.id}`,severity:'warning',title:'Subscription not linked',message:'Link this resource to a Subscription hierarchy.',nodeId:n.id});if(!['tenant','managementGroup','subscription','resourceGroup'].includes(n.data.resourceType)&&!n.data.resourceGroup)r.push({id:`rg-${n.id}`,severity:'warning',title:'Resource Group not linked',message:'Assign a Resource Group parent.',nodeId:n.id});if(n.data.resourceType==='virtualMachine'&&!n.data.subnet)r.push({id:`net-${n.id}`,severity:'warning',title:'VM has no subnet',message:'Place the VM under a VNet/Subnet hierarchy.',nodeId:n.id});});if(!r.length)r.push({id:'ok',severity:'success',title:'Hierarchy checks passed',message:'Resources are linked to the modeled Azure hierarchy.'});return r;},[architectureNodes]);const score=Math.max(35,100-findings.filter(f=>f.severity==='warning').length*6-findings.filter(f=>f.severity==='critical').length*20);
 const saveDesign=useCallback(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify({designName,nodes,edges}));setSaveState('saved');},[designName,nodes,edges]);const loadDesign=()=>{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return alert('No saved design found.');const p=JSON.parse(raw);setNodes(recalcHierarchy(p.nodes||[]));setEdges(p.edges||[]);setDesignName(p.designName||'Loaded Architecture');setSaveState('saved');setTimeout(()=>fitView({padding:.18}),0);};const download=(blob:Blob,name:string)=>{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);};const safeFileName=()=>designName.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'archmindcanvas-diagram';
 const getDiagramElement=()=>document.querySelector('.react-flow__viewport') as HTMLElement|null;
 const exportDiagramPng=async()=>{const el=getDiagramElement();if(!el)return alert('Diagram canvas not found.');try{const url=await toPng(el,{backgroundColor:'#ffffff',pixelRatio:2,cacheBust:true});const a=document.createElement('a');a.href=url;a.download=`${safeFileName()}.png`;a.click();setSaveMenuOpen(false);}catch{alert('Unable to export PNG.');}};
 const exportDiagramSvg=async()=>{const el=getDiagramElement();if(!el)return alert('Diagram canvas not found.');try{const url=await toSvg(el,{backgroundColor:'#ffffff',cacheBust:true});const a=document.createElement('a');a.href=url;a.download=`${safeFileName()}.svg`;a.click();setSaveMenuOpen(false);}catch{alert('Unable to export SVG.');}};
 const exportDiagramPdf=async()=>{const el=getDiagramElement();if(!el)return alert('Diagram canvas not found.');try{const url=await toPng(el,{backgroundColor:'#ffffff',pixelRatio:2,cacheBust:true});const img=new window.Image();img.onload=()=>{const landscape=img.width>=img.height;const pdf=new jsPDF({orientation:landscape?'landscape':'portrait',unit:'mm',format:'a4'});const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),margin=10;const scale=Math.min((pageW-margin*2)/img.width,(pageH-margin*2)/img.height);const w=img.width*scale,h=img.height*scale;pdf.addImage(url,'PNG',(pageW-w)/2,(pageH-h)/2,w,h);pdf.save(`${safeFileName()}.pdf`);setSaveMenuOpen(false);};img.src=url;}catch{alert('Unable to export PDF.');}};const exportJson=()=>download(new Blob([JSON.stringify({version:'5.0',designName,nodes,edges},null,2)],{type:'application/json'}),`${designName.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-design.json`);const importJson=()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{const f=i.files?.[0];if(!f)return;try{const p=JSON.parse(await f.text());setNodes(recalcHierarchy(p.nodes||[]));setEdges(p.edges||[]);setDesignName(p.designName||'Imported Architecture');markChanged();}catch{alert('Invalid JSON file.');}};i.click();};const newDesign=()=>{if(confirm('Start a new blank design?')){setNodes([]);setEdges([]);setDesignName('Untitled Architecture');markChanged();}};const loadTemplate=()=>{setNodes(structuredClone(starterNodes));setEdges([]);setDesignName('Azure Hierarchy Starter');markChanged();setTimeout(()=>fitView({padding:.12}),0);};
 useEffect(()=>{let previousTool:Tool='select';const down=(e:KeyboardEvent)=>{const target=e.target as HTMLElement;if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT'].includes(target.tagName)&&!e.repeat){e.preventDefault();setTool(current=>{previousTool=current;return 'hand';});}};const up=(e:KeyboardEvent)=>{if(e.code==='Space'){e.preventDefault();setTool(previousTool==='hand'?'select':previousTool);}};window.addEventListener('keydown',down);window.addEventListener('keyup',up);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(['INPUT','TEXTAREA','SELECT'].includes(t.tagName))return;const mod=e.ctrlKey||e.metaKey;if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();saveDesign();}if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();undo();}if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}if(mod&&e.key.toLowerCase()==='c'){e.preventDefault();copySelection();}if(mod&&e.key.toLowerCase()==='v'){e.preventDefault();pasteSelection();}if(e.key==='Delete'||e.key==='Backspace')deleteSelected();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[saveDesign,undo,redo,copySelection,pasteSelection,deleteSelected]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const tag=(e.target as HTMLElement)?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSelection();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){e.preventDefault();setNodes(c=>c.map(n=>({...n,selected:true} as CanvasNode)));}if(e.key==='Escape'){setSelectedNodeId(undefined);setSelectedEdgeId(undefined);setContextMenu(null);}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 return <div className="app-shell"><header className="topbar"><div className="brand-block"><div className="brand-mark"><Sparkles size={19}/></div><div><div className="brand">ArchMindCanvas</div><div className="subtitle">AI Architecture Studio · Describe. Design. Validate. Generate IaC.<small className="founder-line">Founded by Pranab Baro</small></div></div></div><div className="design-title"><input value={designName} onChange={e=>{setDesignName(e.target.value);markChanged();}}/><div className={`save-status ${saveState}`}><Check size={12}/>{saveState==='saved'?'Saved':'Unsaved'}</div></div><div className="toolbar"><button onClick={undo}><Undo2 size={16}/></button><button onClick={redo}><Redo2 size={16}/></button><button onClick={newDesign}><FilePlus2 size={16}/><span>New</span></button><button onClick={loadTemplate}><Sparkles size={16}/><span>Template</span></button><div className="save-menu-wrap"><button onClick={()=>setSaveMenuOpen(v=>!v)}><Save size={16}/><span>Save</span></button>{saveMenuOpen&&<div className="save-export-menu"><button onClick={exportDiagramPdf}><FileText size={15}/><span><b>Save as PDF</b><small>Professional document</small></span></button><button onClick={exportDiagramPng}><Image size={15}/><span><b>Save as PNG</b><small>High-resolution image</small></span></button><button onClick={exportDiagramSvg}><Image size={15}/><span><b>Save as SVG</b><small>Scalable vector diagram</small></span></button></div>}</div><button onClick={()=>setRightPanel('ai')}><Bot size={16}/><span>AI Studio</span></button><button onClick={autoArrange}><Route size={16}/><span>Auto Arrange</span></button><button onClick={()=>setRightPanel('validation')}><ShieldCheck size={16}/><span>Validate</span></button><button onClick={()=>setRightPanel('iac')}><Code2 size={16}/><span>IaC</span></button><button onClick={()=>setRightPanel('cost')}><DollarSign size={16}/><span>Cost</span></button><button onClick={()=>setRightPanel('import')}><Code2 size={16}/><span>Import IaC</span></button></div></header><div className="statusbar"><span><strong>{nodes.length}</strong> objects</span><span><strong>{edges.length}</strong> connections</span><span><strong>{score}</strong>/100 architecture score</span><span className="shortcut">Hierarchy-aware: Subscription › Resource Group › VNet › Subnet › Resource</span></div>
 <main className="workspace"><Sidebar onAddResource={t=>createResource(t as ResourceType)}/><div className="canvas-wrapper" onDrop={onDrop} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='move';}}><div className="drawing-toolbar"><button className={tool==='select'?'active':''} onClick={()=>setTool('select')} title="Cursor / Select"><MousePointer2 size={16}/></button><button className={tool==='hand'?'active':''} onClick={()=>{setTool('hand');setSelectedNodeId(undefined);setSelectedEdgeId(undefined);}} title="Hand / Pan canvas"><Hand size={16}/></button><span/><select value={connectorStyle} onChange={e=>setConnectorStyle(e.target.value as ConnectorStyle)}><option value="straight">Straight</option><option value="smoothstep">Elbow / routed</option><option value="bezier">Curved</option><option value="dotted">Dotted</option><option value="dashed">Dashed</option></select><span/><button className={tool==='rectangle'?'active':''} onClick={()=>setTool('rectangle')}><Square size={16}/></button><button className={tool==='triangle'?'active':''} onClick={()=>setTool('triangle')}><Triangle size={16}/></button><button className={tool==='text'?'active':''} onClick={()=>setTool('text')}><Type size={16}/></button><span/><button onClick={deleteSelected}><Trash2 size={16}/></button></div>
 <ReactFlow nodes={nodes.map(n=>({...n,draggable:!lockedIds.has(n.id)}))} edges={edges.map(e=>({...e,markerEnd:(e.data?.arrowStyle==='none'||e.data?.arrowStyle==='start')?undefined:{type:MarkerType.ArrowClosed},markerStart:(e.data?.arrowStyle==='start'||e.data?.arrowStyle==='both')?{type:MarkerType.ArrowClosed}:undefined}))} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_,n)=>{if(tool==='hand')return;setSelectedNodeId(n.id);setSelectedEdgeId(undefined);setRightPanel('properties');}} onEdgeClick={(_,e)=>{if(tool==='hand')return;setSelectedEdgeId(e.id);setSelectedNodeId(undefined);setRightPanel('properties');}} onNodeContextMenu={(e,n)=>{e.preventDefault();e.stopPropagation();setNodes(c=>c.map(x=>({...x,selected:x.id===n.id} as CanvasNode)));setSelectedNodeId(n.id);setSelectedEdgeId(undefined);setRightPanel('properties');setContextMenu({x:Math.min(e.clientX,window.innerWidth-220),y:Math.min(e.clientY,window.innerHeight-360),nodeId:n.id});}} onPaneClick={(e)=>{setContextMenu(null);onPaneClick(e)}} fitView snapToGrid snapGrid={[16,16]} selectionOnDrag={tool==='select'} elementsSelectable={tool!=='hand'} nodesDraggable={tool!=='hand'} nodesConnectable={tool!=='hand'} panOnDrag={tool==='hand'} className={tool==='hand'?'hand-mode':'cursor-mode'} multiSelectionKeyCode="Shift" deleteKeyCode={null} defaultEdgeOptions={{type:'styled',markerEnd:{type:MarkerType.ArrowClosed},data:{connectorStyle}}}><Background variant={BackgroundVariant.Dots} gap={20} size={1.2}/><Controls position="bottom-left"/><MiniMap pannable zoomable position="bottom-right"/><div className="canvas-action"><button onClick={()=>fitView({padding:.12})}><Maximize2 size={15}/> Fit</button><button onClick={copySelection}><Copy size={15}/> Copy</button><button onClick={pasteSelection}><Clipboard size={15}/> Paste</button><button onClick={autoTidy} title="Auto Tidy">Tidy</button><button onClick={()=>alignSelected('left')} title="Align Left">Align L</button><button onClick={()=>alignSelected('top')} title="Align Top">Align T</button><button onClick={()=>distributeSelected('h')} title="Distribute Horizontally">Dist H</button><button onClick={()=>distributeSelected('v')} title="Distribute Vertically">Dist V</button>{selectedNodeId&&<><button onClick={bringForward} title="Bring Forward"><BringToFront size={15}/> Forward</button><button onClick={sendBackward} title="Send Backward"><SendToBack size={15}/> Backward</button><button onClick={()=>lockedIds.has(selectedNodeId)?unlockSelection():lockSelection()} title={lockedIds.has(selectedNodeId)?'Unlock':'Lock'}>{lockedIds.has(selectedNodeId)?<Unlock size={15}/>:<Lock size={15}/>} {lockedIds.has(selectedNodeId)?'Unlock':'Lock'}</button></>}</div></ReactFlow></div>
 {contextMenu&&<div className="node-context-menu" style={{left:contextMenu.x,top:contextMenu.y}} onMouseDown={e=>e.stopPropagation()}><button onClick={duplicateSelection}>Duplicate <kbd>Ctrl+D</kbd></button><button onClick={copySelection}>Copy <kbd>Ctrl+C</kbd></button><button onClick={pasteSelection}>Paste <kbd>Ctrl+V</kbd></button><hr/><button onClick={lockSelection}>Lock</button><button onClick={unlockSelection}>Unlock</button><hr/><button onClick={bringForward}>Bring Forward</button><button onClick={sendBackward}>Send Backward</button><hr/><button onClick={groupSelection}>Group</button><button onClick={ungroupSelection}>Ungroup</button><hr/><button className="danger" onClick={deleteSelected}>Delete <kbd>Del</kbd></button></div>}<div className="inspector-shell"><div className="inspector-tabs v5-tabs"><button className={rightPanel==='properties'?'active':''} onClick={()=>setRightPanel('properties')}>Properties</button><button className={rightPanel==='ai'?'active':''} onClick={()=>setRightPanel('ai')}>AI</button><button className={rightPanel==='validation'?'active':''} onClick={()=>setRightPanel('validation')}>Validate <span>{findings.filter(f=>f.severity==='warning'||f.severity==='critical').length}</span></button><button className={rightPanel==='iac'?'active':''} onClick={()=>setRightPanel('iac')}>IaC</button></div>{rightPanel==='ai'?<div className="ai-studio"><div className="panel-title">ArchMind AI Architecture Studio</div><p>Describe the Azure architecture you want. This MVP uses a deterministic architecture generator and is ready for a future LLM API connection.</p><textarea value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} rows={8}/><div className="prompt-chips"><button onClick={()=>setAiPrompt('Create a secure 3-tier Azure application in West Europe with private endpoints and monitoring.')}>3-tier</button><button onClick={()=>setAiPrompt('Create an AKS production platform with ACR, Key Vault and Azure Monitor.')}>AKS</button><button onClick={()=>setAiPrompt('Create a hub-spoke network with Azure Firewall, VPN Gateway and private DNS.')}>Hub-spoke</button></div><button className="generate-button" onClick={buildAiArchitecture}><Sparkles size={16}/> Generate Architecture</button><div className="ai-note"><strong>Current intelligence layer</strong><span>Prompt templates generate a complete editable Azure model with collision-free hierarchical layout. Use Auto Arrange anytime to restore clean spacing and routed connections.</span></div></div>:rightPanel==='iac'?<div className="iac-panel"><div className="panel-title">Infrastructure as Code</div><div className="iac-toggle"><button className={iacMode==='terraform'?'active':''} onClick={()=>setIacMode('terraform')}>Terraform</button><button className={iacMode==='bicep'?'active':''} onClick={()=>setIacMode('bicep')}>Bicep</button></div><pre>{iacCode}</pre><div className="iac-actions"><button onClick={copyIac}>Copy code</button><button onClick={downloadIac}>Download {iacMode==='terraform'?'main.tf':'main.bicep'}</button><button className="primary-button" onClick={downloadIacBundle}>Download IaC Bundle</button></div><div className="repo-panel"><strong>Source Control</strong><label>Provider<select value={repoProvider} onChange={e=>setRepoProvider(e.target.value as 'github'|'azuredevops')}><option value="github">GitHub / GitHub Enterprise</option><option value="azuredevops">Azure DevOps Repos</option></select></label><label>Repository<input value={repoName} onChange={e=>setRepoName(e.target.value)} placeholder="organization/infrastructure-repo"/></label><label>Branch<input value={repoBranch} onChange={e=>setRepoBranch(e.target.value)}/></label><label>Target folder<input value={repoFolder} onChange={e=>setRepoFolder(e.target.value)}/></label><label>Commit message<input value={commitMessage} onChange={e=>setCommitMessage(e.target.value)}/></label><button className="primary-button" onClick={prepareRepoPush}>Prepare Repository Push</button><small>Secure direct push requires a backend GitHub App/OAuth or Azure DevOps OAuth connection. Tokens are never stored in this browser app.</small></div><div className="ai-note"><strong>Generator status</strong><span>v5.3 generates deployable starter Terraform for Resource Groups and VNets and preserves all remaining diagram resources as reviewed TODO mappings. Expand resource mappings before production deployment.</span></div></div>:rightPanel==='import'?<div className="import-iac-panel"><div className="panel-title">IaC → Diagram</div><div className="iac-toggle"><button className={iacImportType==='terraform'?'active':''} onClick={()=>setIacImportType('terraform')}>Terraform</button><button className={iacImportType==='bicep'?'active':''} onClick={()=>setIacImportType('bicep')}>Bicep</button><button className={iacImportType==='json'?'active':''} onClick={()=>setIacImportType('json')}>JSON</button></div><button className="primary-button" onClick={uploadIacFile}>Upload .tf / .bicep / .json file</button><textarea value={iacImportCode} onChange={e=>setIacImportCode(e.target.value)} placeholder={iacImportType==='terraform'?'Paste Terraform azurerm code here...':iacImportType==='bicep'?'Paste Bicep code here...':'Paste ArchMindCanvas JSON here...'}></textarea><button className="primary-button" onClick={importIacToDiagram}>Generate Diagram from Code</button><div className="ai-note"><strong>Reverse engineering</strong><span>v5.7.3 supports unified JSON, Terraform and Bicep import with collision-free hierarchical layout and rebuilds Azure hierarchy from common Terraform azurerm references and Bicep resource declarations, creates editable ArchMindCanvas nodes, infers basic reference relationships, and auto-fits the generated diagram. Complex Terraform modules, dynamic blocks, remote state and deeply nested Bicep modules require a future backend parser for complete fidelity.</span></div></div>:rightPanel==='cost'?<div className="cost-panel"><div className="panel-title">Cost Intelligence</div><div className="cost-controls"><label>Currency<select value={costCurrency} onChange={e=>{setCostCurrency(e.target.value as 'USD'|'EUR'|'INR'|'GBP');setPricingStatus('idle');setLivePrices({});}}><option>USD</option><option>EUR</option><option>INR</option><option>GBP</option></select></label><button className="primary-button" onClick={refreshLivePricing} disabled={pricingStatus==='loading'}>{pricingStatus==='loading'?'Loading live prices...':'Refresh Azure Retail Prices'}</button><small className="pricing-status">{pricingStatus==='live'?'Live Azure retail prices loaded':pricingStatus==='partial'?'Partial live pricing loaded; unsupported resources use baseline estimates':pricingStatus==='error'?'Live pricing unavailable; showing baseline estimates':'Baseline estimates shown until live prices are refreshed'}</small></div><div className="cost-hero"><span>Estimated monthly cost</span><strong>{money(monthlyCost)}</strong><small>Estimated annual cost: {money(monthlyCost*12)}</small></div><div className="cost-section"><strong>Cost by category</strong>{Object.entries(costBreakdown).sort((a,b)=>b[1]-a[1]).map(([k,v])=><div className="cost-row" key={k}><span>{k}</span><b>{money(v)}</b></div>)}</div><div className="cost-section"><strong>Resources</strong>{costItems.length?costItems.map(x=><div className="cost-resource" key={x.id}><div><b>{x.name}</b><small>{x.category}</small></div><span>{x.monthly?money(x.monthly):'Not priced'} {x.live?'· Live':''}</span></div>):<small>Add Azure resources to see an estimate.</small>}</div><div className="ai-note"><strong>Estimate only</strong><span>Use “Refresh Azure Retail Prices” to query Microsoft's public Retail Prices API. Where an exact SKU is not configured or no matching meter is found, ArchMindCanvas falls back to its baseline estimate. Retail pricing is not your negotiated invoice price.</span></div></div>:rightPanel==='validation'?<ValidationPanel findings={findings} score={score} onSelectNode={id=>{setSelectedNodeId(id);setRightPanel('properties');}}/>:isArchitecture?<PropertiesPanel data={(selectedNode as ArchitectureNode).data} parentId={(selectedNode as ArchitectureNode).parentId} hierarchy={hierarchyData} onParentChange={changeParent} onChange={updateArchitecture} onDelete={deleteSelected} onDuplicate={duplicateSelected}/>:isDrawing?<div className="properties-panel"><div className="panel-title">Drawing object</div><div className="form-stack"><label>Text / label<input value={(selectedNode as DrawingNode).data.label} onChange={e=>updateDrawing({label:e.target.value})}/></label><button className="danger-button" onClick={deleteSelected}>Delete object</button></div></div>:selectedEdge?<div className="properties-panel"><div className="panel-title">Connection</div><div className="form-stack"><label>Line style<select value={selectedEdge.data?.connectorStyle||'smoothstep'} onChange={e=>updateEdge({connectorStyle:e.target.value as ConnectorStyle})}><option value="straight">Straight</option><option value="smoothstep">Elbow / routed</option><option value="bezier">Curved</option><option value="dotted">Dotted</option><option value="dashed">Dashed</option></select></label><label>Arrow direction<select value={selectedEdge.data?.arrowStyle||'end'} onChange={e=>updateEdge({arrowStyle:e.target.value as any})}><option value="none">No arrow</option><option value="end">Forward →</option><option value="start">Backward ←</option><option value="both">Both ↔</option></select></label><label>Line thickness<select value={selectedEdge.data?.strokeWidth||2} onChange={e=>updateEdge({strokeWidth:Number(e.target.value)})}><option value="1">1 px</option><option value="2">2 px</option><option value="3">3 px</option><option value="4">4 px</option><option value="6">6 px</option></select></label><button type="button" onClick={()=>updateEdge({routePoints:[],routeX:undefined,routeY:undefined,labelX:undefined,labelY:undefined})}>Reset auto-route</button><small>Tip: Select a connection and double-click the line to add bend points. Drag points to route the line; double-click a point to remove it. Drag the label to reposition it.</small><label>Label<input value={selectedEdge.data?.label||''} onChange={e=>updateEdge({label:e.target.value})}/></label><label>Connection type<select value={selectedEdge.data?.connectionType||''} onChange={e=>updateEdge({connectionType:e.target.value})}><option value="">General</option><option>HTTPS</option><option>Private Link</option><option>VNet Peering</option><option>VPN</option><option>ExpressRoute</option><option>Dependency</option><option>Data Flow</option></select></label><label>Protocol<input value={selectedEdge.data?.protocol||''} onChange={e=>updateEdge({protocol:e.target.value})} placeholder="TCP / UDP / HTTPS"/></label><label>Port<input value={selectedEdge.data?.port||''} onChange={e=>updateEdge({port:e.target.value})} placeholder="443"/></label><button className="danger-button" onClick={deleteSelected}>Delete connection</button></div></div>:<div className="empty-properties"><div className="empty-icon">✦</div><strong>Select an object or connection</strong><span>Edit hierarchy, Azure properties, tags and connection metadata here.</span></div>}</div></main></div>;
}
export default function App(){return <ReactFlowProvider><Designer/></ReactFlowProvider>}
