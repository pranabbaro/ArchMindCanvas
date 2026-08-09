import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  addEdge, Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow, type Connection, type EdgeChange, type NodeChange,
} from '@xyflow/react';
import { Check, Clipboard, Copy, Download, FilePlus2, FolderOpen, Maximize2, Redo2, Save, ShieldCheck, Sparkles, Undo2, MousePointer2, Hand, Route, Square, Triangle, Type, Trash2, Bot, Code2, DollarSign, Image, FileText, BringToFront, SendToBack, Lock, Unlock, Rocket, Play, CheckCircle2, GitBranch, ServerCog, Variable, Building2, FolderKanban, Layers3, LayoutDashboard, Boxes, ChevronDown, ChevronLeft, ChevronRight, Network, GripVertical, LayoutTemplate, BookOpenText} from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import ArchitectureNodeComponent from './components/ArchitectureNode';
import ContainerNode from './components/ContainerNode';
import DrawingNodeComponent from './components/DrawingNode';
import StyledEdge from './components/StyledEdge';
import PropertiesPanel from './components/PropertiesPanel';
import VariablesManager from './components/VariablesManager';
import WorkspaceScopeManager from './components/WorkspaceScopeManager';
import CommandCenter from './components/CommandCenter';
import Sidebar from './components/Sidebar';
import ValidationPanel from './components/ValidationPanel';
import ArchitectureModelPanel from './components/ArchitectureModelPanel';
import ArchitectureToolsDrawer from './components/ArchitectureToolsDrawer';
import { isContainerType, resourceMap } from './resourceCatalog';
import type { ArchitectureMetadata, ArchitectureModuleDefinition, ArchitectureOutputDefinition, LocalDefinition, VariableDefinition, ArchitectureNode, CanvasEdge, CanvasNode, ConnectorStyle, ArrowStyle, DrawingNode, ResourceType, ValidationFinding, ArchitectureNodeData, TagMap } from './types';
import { estimateAwsMonthlyCost, awsCostCategory } from './cloud/aws/awsPricing';
import JSZip from 'jszip';

const STORAGE_KEY='archmindcanvas-v5';
const makeData=(type:ResourceType,label?:string):ArchitectureNodeData=>{
 const item=resourceMap[type];
 const aws=String(type).startsWith('aws');
 return {
  label:label||item.label,
  resourceType:type,
  cloudProvider:aws?'aws':'azure',
  terraformReady:!aws,
  description:item.description,
  region:aws?(type==='awsAccount'?'Global':'ap-south-1'):(['tenant','managementGroup'].includes(type)?'Global':'Central India'),
  sku:item.sku,
  environment:'Production',
  owner:'',
  tags:{}
 };
};
const containerSizes:Partial<Record<ResourceType,{width:number;height:number}>>={tenant:{width:1200,height:850},managementGroup:{width:1050,height:740},subscription:{width:920,height:650},resourceGroup:{width:780,height:540},virtualNetwork:{width:620,height:420},subnet:{width:360,height:270},awsAccount:{width:980,height:700},awsVpc:{width:760,height:540},awsSubnet:{width:420,height:300}};
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
 const[nodes,setNodes,onNodesChangeBase]=useNodesState<CanvasNode>(starterNodes);

 const normalizeCanvasLayering=useCallback((input:CanvasNode[])=>{
  const byId=new Map(input.map(n=>[n.id,n]));
  const depthOf=(n:CanvasNode)=>{
   let depth=0, cur:CanvasNode|undefined=n;
   const seen=new Set<string>();
   while(cur?.parentId&&byId.has(cur.parentId)&&!seen.has(cur.parentId)){
    seen.add(cur.parentId); depth++; cur=byId.get(cur.parentId);
   }
   return depth;
  };
  return input.map(n=>{
   const depth=depthOf(n);
   const isArch=n.type!=='drawing';
   const container=isArch&&isContainerType((n as ArchitectureNode).data.resourceType);
   const selected=n.selected===true;
   return {...n,zIndex:selected?1000:(container?1+depth:100+depth)};
  });
 },[]);

 const onNodesChangeLayered=useCallback((changes:NodeChange<CanvasNode>[])=>{
  onNodesChangeBase(changes);
  requestAnimationFrame(()=>setNodes(current=>normalizeCanvasLayering(current)));
 },[onNodesChangeBase,setNodes,normalizeCanvasLayering]);

 useEffect(()=>{
  setNodes(current=>normalizeCanvasLayering(current));
 },[normalizeCanvasLayering,setNodes]);
const[edges,setEdges,onEdgesChangeBase]=useEdgesState<CanvasEdge>(starterEdges);
 const[selectedNodeId,setSelectedNodeId]=useState<string>();const[designId,setDesignId]=useState<string>(()=>crypto.randomUUID());const[selectedEdgeId,setSelectedEdgeId]=useState<string>();const[designName,setDesignName]=useState('My Azure Architecture');const[saveState,setSaveState]=useState<'saved'|'unsaved'>('saved');const[rightPanel,setRightPanel]=useState<'properties'|'variables'|'model'|'validation'|'iac'|'cost'|'import'|'deploy'>('properties');const[declaredVariables,setDeclaredVariables]=useState<VariableDefinition[]>([]);const[declaredLocals,setDeclaredLocals]=useState<LocalDefinition[]>([]);const[designVariables,setDesignVariables]=useState<VariableDefinition[]>([]);const[designLocals,setDesignLocals]=useState<LocalDefinition[]>([]);
 const[architectureOutputs,setArchitectureOutputs]=useState<ArchitectureOutputDefinition[]>([]);
 const[architectureModules,setArchitectureModules]=useState<ArchitectureModuleDefinition[]>([]);
 const[architectureMetadata,setArchitectureMetadata]=useState<ArchitectureMetadata>({description:'',owner:'',application:'',businessUnit:'',costCenter:'',criticality:'Medium',lifecycle:'Development',version:'1.0.0',tags:{}});
const[organizationId,setOrganizationId]=useState<string>('org-default');const[organizationName,setOrganizationName]=useState('My Organization');const[projectId,setProjectId]=useState<string>('project-default');const[projectName,setProjectName]=useState('Cloud Platform');const[environmentId,setEnvironmentId]=useState<string>('env-prod');const[environmentName,setEnvironmentName]=useState('Production');const[projectVariables,setProjectVariables]=useState<VariableDefinition[]>([]);const[projectLocals,setProjectLocals]=useState<LocalDefinition[]>([]);const[environmentVariables,setEnvironmentVariables]=useState<VariableDefinition[]>([]);const[environmentLocals,setEnvironmentLocals]=useState<LocalDefinition[]>([]);const[scopeManagerOpen,setScopeManagerOpen]=useState(false);const[workspaceView,setWorkspaceView]=useState<'dashboard'|'editor'>('dashboard');const[contextSwitcherOpen,setContextSwitcherOpen]=useState(false);const[leftPaneCollapsed,setLeftPaneCollapsed]=useState<boolean>(()=>localStorage.getItem('archmind-left-pane-collapsed')==='true');const[rightPaneCollapsed,setRightPaneCollapsed]=useState<boolean>(()=>localStorage.getItem('archmind-right-pane-collapsed')==='true');
 const[rightPaneWidth,setRightPaneWidth]=useState<number>(()=>{
  const stored=Number(localStorage.getItem('archmind-right-pane-width'));
  return Number.isFinite(stored)&&stored>=320&&stored<=760?stored:420;
 });
 const[rightPaneResizing,setRightPaneResizing]=useState(false);
 const rightPaneResizeRef=useRef<{startX:number;startWidth:number}|null>(null);
 useEffect(()=>{localStorage.setItem('archmind-right-pane-width',String(rightPaneWidth));},[rightPaneWidth]);

 const[canvasToolbarPos,setCanvasToolbarPos]=useState<{x:number;y:number}>(()=>{
  try{
   const raw=localStorage.getItem('archmind-canvas-toolbar-pos');
   return raw?JSON.parse(raw):{x:0,y:0};
  }catch{return{x:0,y:0}}
 });
 const[canvasToolbarDragging,setCanvasToolbarDragging]=useState(false);
 const canvasToolbarDragRef=useRef<{startX:number;startY:number;originX:number;originY:number}|null>(null);
 useEffect(()=>{localStorage.setItem('archmind-canvas-toolbar-pos',JSON.stringify(canvasToolbarPos));},[canvasToolbarPos]);
useEffect(()=>{localStorage.setItem('archmind-left-pane-collapsed',String(leftPaneCollapsed));},[leftPaneCollapsed]);useEffect(()=>{localStorage.setItem('archmind-right-pane-collapsed',String(rightPaneCollapsed));},[rightPaneCollapsed]);const[libraryOpen,setLibraryOpen]=useState(false);const[architectureToolsMenuOpen,setArchitectureToolsMenuOpen]=useState(false);const[architectureToolsOpen,setArchitectureToolsOpen]=useState(false);const[architectureToolsSection,setArchitectureToolsSection]=useState<'library'|'waf'|'references'>('library');const[designVariablesOpen,setDesignVariablesOpen]=useState(false);const[saveMenuOpen,setSaveMenuOpen]=useState(false);const[layoutMenuOpen,setLayoutMenuOpen]=useState(false);const[editMenuOpen,setEditMenuOpen]=useState(false);const[contextMenu,setContextMenu]=useState<{x:number;y:number;nodeId?:string}|null>(null);const[lockedIds,setLockedIds]=useState<Set<string>>(new Set());const[tool,setTool]=useState<Tool>('select');const[connectorStyle,setConnectorStyle]=useState<ConnectorStyle>('smoothstep');const[connectorArrowStyle,setConnectorArrowStyle]=useState<ArrowStyle>('end');
 const history=useRef<Snapshot[]>([]),future=useRef<Snapshot[]>([]),copiedNodes=useRef<CanvasNode[]>([]),nextPos=useRef(0);
 const nodeTypes=useMemo(()=>({architecture:ArchitectureNodeComponent,container:ContainerNode,drawing:DrawingNodeComponent}),[]);const edgeTypes=useMemo(()=>({styled:StyledEdge}),[]);
 useEffect(()=>{
  const raw=localStorage.getItem('archmindcanvas-enterprise-workspace');
  if(raw){
    try{
      const p=JSON.parse(raw);
      setOrganizationId(p.organization?.id||'org-default');
      setOrganizationName(p.organization?.name||'My Organization');
      setDeclaredVariables(p.organization?.variables||[]);
      setDeclaredLocals(p.organization?.locals||[]);
      setProjectId(p.project?.id||'project-default');
      setProjectName(p.project?.name||'Cloud Platform');
      setProjectVariables(p.project?.variables||[]);
      setProjectLocals(p.project?.locals||[]);
      setEnvironmentId(p.environment?.id||'env-prod');
      setEnvironmentName(p.environment?.name||'Production');
      setEnvironmentVariables(p.environment?.variables||[]);
      setEnvironmentLocals(p.environment?.locals||[]);
    }catch{}
  } else {
    const legacy=localStorage.getItem('archmindcanvas-global-variables');
    if(legacy){try{const p=JSON.parse(legacy);setDeclaredVariables(p.variables||[]);setDeclaredLocals(p.locals||[]);}catch{}}
  }
},[]);
useEffect(()=>{
  localStorage.setItem('archmindcanvas-enterprise-workspace',JSON.stringify({
    organization:{id:organizationId,name:organizationName,variables:declaredVariables,locals:declaredLocals},
    project:{id:projectId,name:projectName,organizationId,variables:projectVariables,locals:projectLocals},
    environment:{id:environmentId,name:environmentName,projectId,variables:environmentVariables,locals:environmentLocals}
  }));
},[organizationId,organizationName,declaredVariables,declaredLocals,projectId,projectName,projectVariables,projectLocals,environmentId,environmentName,environmentVariables,environmentLocals]);
const effectiveVariables=useMemo(()=>{
 const map=new Map<string,VariableDefinition>();
 // ArchMindCanvas intentionally supports only two variable scopes:
 // Global/Organization and current Architecture. Architecture wins.
 [...declaredVariables,...designVariables].forEach(v=>map.set(v.name,v));
 return [...map.values()];
},[declaredVariables,designVariables]);
const effectiveLocals=useMemo(()=>{
 const map=new Map<string,LocalDefinition>();
 [...declaredLocals,...designLocals].forEach(v=>map.set(v.name,v));
 return [...map.values()];
},[declaredLocals,designLocals]);
const selectedNode=nodes.find(n=>n.id===selectedNodeId);const selectedEdge=edges.find(e=>e.id===selectedEdgeId);const isArchitecture=selectedNode&&selectedNode.type!=='drawing';const isDrawing=selectedNode?.type==='drawing';
 const markChanged=useCallback(()=>setSaveState('unsaved'),[]);const pushHistory=useCallback(()=>{history.current.push(clone(nodes,edges));if(history.current.length>60)history.current.shift();future.current=[];},[nodes,edges]);
 const undo=useCallback(()=>{const p=history.current.pop();if(!p)return;future.current.push(clone(nodes,edges));setNodes(p.nodes);setEdges(p.edges);markChanged();},[nodes,edges,setNodes,setEdges,markChanged]);const redo=useCallback(()=>{const n=future.current.pop();if(!n)return;history.current.push(clone(nodes,edges));setNodes(n.nodes);setEdges(n.edges);markChanged();},[nodes,edges,setNodes,setEdges,markChanged]);
 const onConnect=useCallback((c:Connection)=>{pushHistory();setEdges(es=>addEdge({...c,type:'styled',data:{connectorStyle,arrowStyle:connectorArrowStyle}},es));markChanged();},[connectorStyle,connectorArrowStyle,pushHistory,setEdges,markChanged]);


 const applyConnectorStyle=useCallback((style:ConnectorStyle)=>{
  setConnectorStyle(style);
  if(selectedEdgeId){
   pushHistory();
   setEdges(es=>es.map(e=>e.id===selectedEdgeId?{...e,data:{...e.data,connectorStyle:style}}:e));
   markChanged();
  }
 },[selectedEdgeId,pushHistory,setEdges,markChanged]);

 const applyConnectorArrow=useCallback((arrowStyle:ArrowStyle)=>{
  setConnectorArrowStyle(arrowStyle);
  if(selectedEdgeId){
   pushHistory();
   setEdges(es=>es.map(e=>e.id===selectedEdgeId?{...e,data:{...e.data,arrowStyle}}:e));
   markChanged();
  }
 },[selectedEdgeId,pushHistory,setEdges,markChanged]);

 useEffect(()=>{
  if(!selectedEdgeId)return;
  const edge=edges.find(e=>e.id===selectedEdgeId);
  if(!edge)return;
  setConnectorStyle((edge.data?.connectorStyle||'smoothstep') as ConnectorStyle);
  setConnectorArrowStyle((edge.data?.arrowStyle||'end') as ArrowStyle);
 },[selectedEdgeId,edges]);

 const hierarchyData=useMemo(()=>({
  tenants:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='tenant').map(n=>({id:n.id,label:n.data.label})),
  managementGroups:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='managementGroup').map(n=>({id:n.id,label:n.data.label})),
  subscriptions:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='subscription').map(n=>({id:n.id,label:n.data.label})),
  resourceGroups:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='resourceGroup').map(n=>({id:n.id,label:n.data.label})),
  vnets:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='virtualNetwork').map(n=>({id:n.id,label:n.data.label})),
  subnets:nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing'&&n.data.resourceType==='subnet').map(n=>({id:n.id,label:n.data.label})),
 }),[nodes]);

 const inheritFor=(node:ArchitectureNode,all:CanvasNode[])=>{let cur:CanvasNode|undefined=node;const chain:ArchitectureNode[]=[];const seen=new Set<string>();while(cur?.parentId&&!seen.has(cur.parentId)){seen.add(cur.parentId);const p=all.find(n=>n.id===cur!.parentId);if(!p||p.type==='drawing')break;chain.unshift(p as ArchitectureNode);cur=p;}const data={...node.data};const inherited:TagMap={};for(const p of chain){Object.assign(inherited,p.data.tags||{});if(p.data.resourceType==='tenant')data.tenantId=p.data.tenantId;if(p.data.resourceType==='managementGroup')data.managementGroup=p.data.label;if(p.data.resourceType==='subscription'){data.subscriptionName=p.data.subscriptionName||p.data.label;data.subscriptionId=p.data.subscriptionId;}if(p.data.resourceType==='resourceGroup')data.resourceGroup=p.data.resourceGroup||p.data.label;if(p.data.resourceType==='virtualNetwork')data.vnet=p.data.label;if(p.data.resourceType==='subnet')data.subnet=p.data.label;if(p.data.resourceType==='awsAccount')data.awsAccountId=p.data.label;if(p.data.resourceType==='awsVpc')data.awsVpc=p.data.label;if(p.data.resourceType==='awsSubnet')data.awsSubnet=p.data.label;if(p.data.region&&p.data.region!=='Global'&&!['tenant','managementGroup'].includes(node.data.resourceType))data.region=p.data.region;}data.inheritedTags=inherited;return data;};
 const recalcHierarchy=useCallback((input:CanvasNode[])=>input.map(n=>n.type==='drawing'?n:{...n,data:inheritFor(n as ArchitectureNode,input)} as CanvasNode),[]);

 const compatibleParent=(type:ResourceType)=>{
  if(String(type).startsWith('aws')){
    if(type==='awsAccount')return [];
    if(type==='awsVpc')return ['awsAccount'] as ResourceType[];
    if(type==='awsSubnet')return ['awsVpc'] as ResourceType[];
    return ['awsSubnet','awsVpc','awsAccount'] as ResourceType[];
  }
  return type==='managementGroup'?['tenant']:
    type==='subscription'?['managementGroup','tenant']:
    type==='resourceGroup'?['subscription']:
    type==='virtualNetwork'?['resourceGroup']:
    type==='subnet'?['virtualNetwork']:
    ['subnet','resourceGroup'];
 };
 const findContainer=useCallback((point:{x:number;y:number},type:ResourceType)=>{
  const wanted=compatibleParent(type);
  const childProvider=String(type).startsWith('aws')?'aws':'azure';
  return [...nodes].reverse().find((n):n is ArchitectureNode=>{
    if(n.type!=='container')return false;
    const parentType=(n as ArchitectureNode).data.resourceType;
    const parentProvider=(n as ArchitectureNode).data.cloudProvider|| (String(parentType).startsWith('aws')?'aws':'azure');
    if(parentProvider!==childProvider)return false;
    if(!wanted.includes(parentType))return false;
    return point.x>=n.position.x&&point.x<=n.position.x+Number(n.style?.width||600)&&point.y>=n.position.y&&point.y<=n.position.y+Number(n.style?.height||400);
  });
 },[nodes]);
 const createResource=useCallback((type:ResourceType,position?:{x:number;y:number})=>{if(!resourceMap[type])return;pushHistory();const o=nextPos.current++%8,id=`${type}-${Date.now()}-${o}`,requested=position||{x:300+o*24,y:180+o*24},isAws=String(type).startsWith('aws'),parent=position?findContainer(requested,type):undefined,isContainer=isContainerType(type);let node:ArchitectureNode={id,type:isContainer?'container':'architecture',position:parent?{x:Math.max(30,requested.x-parent.position.x),y:Math.max(70,requested.y-parent.position.y)}:requested,data:makeData(type),...(isContainer?{style:containerSize(type)}:{}),...(parent?{parentId:parent.id,extent:'parent' as const}:{})};node={...node,data:inheritFor(node,[...nodes,node])};setNodes(c=>recalcHierarchy([...c,node]));setSelectedNodeId(id);setSelectedEdgeId(undefined);setRightPanel('properties');markChanged();},[pushHistory,findContainer,setNodes,markChanged,nodes,recalcHierarchy]);
 const changeParent=(parentId?:string)=>{if(!selectedNodeId)return;pushHistory();setNodes(current=>{const selected=current.find(n=>n.id===selectedNodeId&&n.type!=='drawing') as ArchitectureNode|undefined;const parent=parentId?current.find(n=>n.id===parentId&&n.type!=='drawing') as ArchitectureNode|undefined:undefined;if(selected&&parent){const childProvider=selected.data.cloudProvider||'azure';const parentProvider=parent.data.cloudProvider||'azure';if(childProvider!==parentProvider)return current;}const updated=current.map(n=>n.id===selectedNodeId&&n.type!=='drawing'?{...n,parentId,extent:parentId?'parent' as const:undefined,position:parentId?{x:40,y:90}:n.position}:n);return recalcHierarchy(updated);});markChanged();};
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


 const getSelectedLayoutNodes=()=>nodes.filter(n=>n.selected);
 const sameParentSelection=()=>{
   const chosen=getSelectedLayoutNodes();
   if(chosen.length<2)return chosen;
   const parent=chosen[0].parentId||'__root__';
   return chosen.filter(n=>(n.parentId||'__root__')===parent);
 };
 const alignSelected=(mode:'left'|'center'|'right'|'top'|'middle'|'bottom')=>{
   const chosen=sameParentSelection();
   if(chosen.length<2)return alert('Select at least two objects under the same parent/container.');
   pushHistory();
   const boxes=chosen.map(n=>({
     id:n.id,
     x:n.position.x,
     y:n.position.y,
     w:Number(n.measured?.width||n.style?.width||220),
     h:Number(n.measured?.height||n.style?.height||120)
   }));
   const left=Math.min(...boxes.map(b=>b.x));
   const right=Math.max(...boxes.map(b=>b.x+b.w));
   const top=Math.min(...boxes.map(b=>b.y));
   const bottom=Math.max(...boxes.map(b=>b.y+b.h));
   const cx=(left+right)/2,cy=(top+bottom)/2;
   const ids=new Set(boxes.map(b=>b.id));
   setNodes(current=>current.map(n=>{
     if(!ids.has(n.id)||lockedIds.has(n.id))return n;
     const b=boxes.find(x=>x.id===n.id)!;
     let x=n.position.x,y=n.position.y;
     if(mode==='left')x=left;
     if(mode==='center')x=cx-b.w/2;
     if(mode==='right')x=right-b.w;
     if(mode==='top')y=top;
     if(mode==='middle')y=cy-b.h/2;
     if(mode==='bottom')y=bottom-b.h;
     return {...n,position:{x,y}} as CanvasNode;
   }));
   markChanged();
 };
 const distributeSelected=(axis:'horizontal'|'vertical')=>{
   const chosen=sameParentSelection();
   if(chosen.length<3)return alert('Select at least three objects under the same parent/container.');
   pushHistory();
   const boxes=chosen.map(n=>({
     id:n.id,x:n.position.x,y:n.position.y,
     w:Number(n.measured?.width||n.style?.width||220),
     h:Number(n.measured?.height||n.style?.height||120)
   }));
   if(axis==='horizontal'){
     const sorted=[...boxes].sort((a,b)=>a.x-b.x);
     const first=sorted[0],last=sorted[sorted.length-1];
     const usable=(last.x+last.w)-first.x-sorted.reduce((s,b)=>s+b.w,0);
     const gap=usable/(sorted.length-1);
     let cursor=first.x;
     const positions=new Map<string,number>();
     sorted.forEach((b,i)=>{positions.set(b.id,cursor);cursor+=b.w+(i<sorted.length-1?gap:0);});
     setNodes(c=>c.map(n=>positions.has(n.id)&&!lockedIds.has(n.id)?{...n,position:{...n.position,x:positions.get(n.id)!}} as CanvasNode:n));
   }else{
     const sorted=[...boxes].sort((a,b)=>a.y-b.y);
     const first=sorted[0],last=sorted[sorted.length-1];
     const usable=(last.y+last.h)-first.y-sorted.reduce((s,b)=>s+b.h,0);
     const gap=usable/(sorted.length-1);
     let cursor=first.y;
     const positions=new Map<string,number>();
     sorted.forEach((b,i)=>{positions.set(b.id,cursor);cursor+=b.h+(i<sorted.length-1?gap:0);});
     setNodes(c=>c.map(n=>positions.has(n.id)&&!lockedIds.has(n.id)?{...n,position:{...n.position,y:positions.get(n.id)!}} as CanvasNode:n));
   }
   markChanged();
 };
 const autoTidy=()=>{
   pushHistory();
   setNodes(current=>{
     const byParent=new Map<string,CanvasNode[]>();
     current.forEach(n=>{const key=n.parentId||'__root__';if(!byParent.has(key))byParent.set(key,[]);byParent.get(key)!.push(n);});
     return current.map(n=>{
       if(lockedIds.has(n.id)||n.type==='container')return n;
       const siblings=(byParent.get(n.parentId||'__root__')||[]).filter(x=>x.type!=='container'&&!lockedIds.has(x.id));
       const i=siblings.findIndex(x=>x.id===n.id);
       if(i<0)return n;
       const cols=Math.max(1,Math.ceil(Math.sqrt(siblings.length)));
       return {...n,position:{x:(n.parentId?40:80)+(i%cols)*280,y:(n.parentId?90:80)+Math.floor(i/cols)*160}} as CanvasNode;
     });
   });
   markChanged();
   setTimeout(()=>fitView({padding:.1,duration:450}),80);
 };
 const deleteSelected=useCallback(()=>{const ids=nodes.filter(n=>n.selected).map(n=>n.id);if(selectedNodeId&&!ids.includes(selectedNodeId))ids.push(selectedNodeId);if(!ids.length&&!selectedEdgeId)return;pushHistory();const s=new Set(ids);setNodes(c=>recalcHierarchy(c.filter(n=>!s.has(n.id))));setEdges(c=>c.filter(e=>!s.has(e.source)&&!s.has(e.target)&&e.id!==selectedEdgeId));setSelectedNodeId(undefined);setSelectedEdgeId(undefined);markChanged();},[nodes,selectedNodeId,selectedEdgeId,pushHistory,setNodes,setEdges,markChanged,recalcHierarchy]);
 const duplicateSelected=()=>{if(!selectedNode)return;pushHistory();const id=`copy-${Date.now()}`;setNodes(c=>recalcHierarchy([...c,{...structuredClone(selectedNode),id,selected:false,position:{x:selectedNode.position.x+36,y:selectedNode.position.y+36}} as CanvasNode]));setSelectedNodeId(id);markChanged();};const copySelection=useCallback(()=>{copiedNodes.current=structuredClone(nodes.filter(n=>n.selected||n.id===selectedNodeId));},[nodes,selectedNodeId]);const pasteSelection=useCallback(()=>{if(!copiedNodes.current.length)return;pushHistory();const pasted=copiedNodes.current.map((n,i)=>({...structuredClone(n),id:`paste-${Date.now()}-${i}`,position:{x:n.position.x+42,y:n.position.y+42},selected:true,parentId:undefined,extent:undefined} as CanvasNode));setNodes(c=>recalcHierarchy([...c.map(n=>({...n,selected:false} as CanvasNode)),...pasted]));markChanged();},[pushHistory,setNodes,markChanged,recalcHierarchy]);
 const onNodesChange=useCallback((changes:NodeChange<CanvasNode>[])=>{const allowed=changes.filter((c:any)=>!(('id'in c)&&lockedIds.has(c.id)&&['position','dimensions','remove'].includes(c.type)));onNodesChangeBase(allowed);if(allowed.some(c=>c.type!=='select'))markChanged();},[onNodesChangeBase,markChanged]);const onEdgesChange=useCallback((changes:EdgeChange<CanvasEdge>[])=>{onEdgesChangeBase(changes);if(changes.some(c=>c.type!=='select'))markChanged();},[onEdgesChangeBase,markChanged]);

 const architectureNodes=nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing');
 const [aiPrompt,setAiPrompt]=useState('Create a secure 3-tier Azure application in West Europe with Application Gateway WAF, App Service, Azure SQL, Key Vault, private endpoints and monitoring.');
 const[archMindOpen,setArchMindOpen]=useState(false);
 const[archMindQuestion,setArchMindQuestion]=useState('');
 const[archMindAnswer,setArchMindAnswer]=useState('Hi — I can review this architecture, explain Azure services, identify risks, suggest improvements, or help generate a design.');

 const [iacMode,setIacMode]=useState<'terraform'|'bicep'>('terraform');
 const [costCurrency,setCostCurrency]=useState<'USD'|'EUR'|'INR'|'GBP'>('USD');
 const [iacImportType,setIacImportType]=useState<'terraform'|'bicep'|'json'>('terraform');
 const [iacImportCode,setIacImportCode]=useState('');
 const [pricingStatus,setPricingStatus]=useState<'idle'|'loading'|'live'|'partial'|'error'>('idle');
 const [livePrices,setLivePrices]=useState<Record<string,number>>({});

 const [deployProvider,setDeployProvider]=useState<'azuredevops'|'github'>('azuredevops');
 const [deployIacType,setDeployIacType]=useState<'terraform'|'bicep'>('terraform');
 const [deployEnvironment,setDeployEnvironment]=useState<'dev'|'test'|'prod'>('dev');
 const [adoOrganization,setAdoOrganization]=useState('');
 const [adoProject,setAdoProject]=useState('');
 const [adoRepository,setAdoRepository]=useState('');
 const [adoBranch,setAdoBranch]=useState('main');
 const [adoPipelineId,setAdoPipelineId]=useState('');
 const [deploymentStatus,setDeploymentStatus]=useState<'idle'|'ready'|'queued'|'validating'|'planning'|'approval'|'deploying'|'completed'|'failed'>('idle');
 const [deploymentMessage,setDeploymentMessage]=useState('Configure your deployment target, then validate the generated IaC.');

 const [terraformBackendMode,setTerraformBackendMode]=useState<'local'|'azurerm'>(()=>(localStorage.getItem('archmind-tf-backend-mode') as 'local'|'azurerm')||'local');
 const [tfBackendResourceGroup,setTfBackendResourceGroup]=useState(()=>localStorage.getItem('archmind-tf-backend-rg')||'');
 const [tfBackendStorageAccount,setTfBackendStorageAccount]=useState(()=>localStorage.getItem('archmind-tf-backend-storage')||'');
 const [tfBackendContainer,setTfBackendContainer]=useState(()=>localStorage.getItem('archmind-tf-backend-container')||'tfstate');
 const [tfBackendKey,setTfBackendKey]=useState(()=>localStorage.getItem('archmind-tf-backend-key')||'');
 useEffect(()=>{localStorage.setItem('archmind-tf-backend-mode',terraformBackendMode)},[terraformBackendMode]);
 useEffect(()=>{localStorage.setItem('archmind-tf-backend-rg',tfBackendResourceGroup)},[tfBackendResourceGroup]);
 useEffect(()=>{localStorage.setItem('archmind-tf-backend-storage',tfBackendStorageAccount)},[tfBackendStorageAccount]);
 useEffect(()=>{localStorage.setItem('archmind-tf-backend-container',tfBackendContainer)},[tfBackendContainer]);
 useEffect(()=>{localStorage.setItem('archmind-tf-backend-key',tfBackendKey)},[tfBackendKey]);

 const [repoProvider,setRepoProvider]=useState<'github'|'azuredevops'>('github');
 const [repoName,setRepoName]=useState('');
 const [repoBranch,setRepoBranch]=useState('main');
 const [repoFolder,setRepoFolder]=useState('infrastructure/');
 const [commitMessage,setCommitMessage]=useState('Add architecture generated by ArchMindCanvas');
 const askArchMind=()=>{
  const q=archMindQuestion.trim().toLowerCase();
  if(!q)return;
  const currentResources=architectureNodes.length;
  const currentConnections=edges.length;
  const critical=findings.filter(f=>f.severity==='critical').length;
  const warnings=findings.filter(f=>f.severity==='warning').length;
  let answer='';
  if(q.includes('score')||q.includes('health')||q.includes('validate')){
    answer=`This design currently scores ${score}/100 with ${critical} critical finding${critical===1?'':'s'} and ${warnings} warning${warnings===1?'':'s'}. Address critical findings first, then review network isolation, identity, monitoring and cost controls.`;
  }else if(q.includes('private endpoint')||q.includes('public access')||q.includes('security')){
    answer=`Review every PaaS resource for public exposure. Prefer Private Endpoints where private access is required, restrict NSG and route paths, use managed identities where possible, and keep secrets in Key Vault. This canvas currently contains ${currentResources} modeled resources.`;
  }else if(q.includes('cost')||q.includes('saving')||q.includes('optimi')){
    answer='For cost optimization, review oversized compute SKUs, idle resources, duplicate gateways or public IPs, storage redundancy tiers, reserved capacity opportunities and shutdown schedules for non-production workloads.';
  }else if(q.includes('terraform')||q.includes('iac')||q.includes('code')){
    answer='Use the IaC panel to inspect generated Terraform or Bicep. Resource relationships and variable bindings should be emitted as references rather than duplicated hard-coded values.';
  }else if(q.includes('resource')||q.includes('how many')||q.includes('connection')){
    answer=`The current architecture contains ${currentResources} Azure resources and ${currentConnections} modeled connections. Its architecture score is ${score}/100.`;
  }else if(q.includes('waf')||q.includes('well architected')){
    answer='Review the design across Security, Reliability, Cost Optimization, Operational Excellence and Performance Efficiency. Prioritize identity boundaries, network exposure, zone and region resilience, observability, backup and DR, and cost governance.';
  }else{
    answer=`I’m reviewing "${designName}" in ${environmentName}. It has ${currentResources} resources, ${currentConnections} connections and a score of ${score}/100. Ask me about security, private endpoints, cost, Terraform, validation, networking or Azure Well-Architected recommendations.`;
  }
  setArchMindAnswer(answer);
  setArchMindQuestion('');
 };
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
  setNodes(ns);setEdges(es);setDesignName('AI Generated Secure 3-Tier Architecture');setSaveState('unsaved');setRightPanel('properties');
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
 const azureCostCategory=(t:string)=>['virtualMachine','virtualMachineScaleSet','appService','functions','aks','containerApps','containerInstances'].includes(t)?'Compute':
 ['applicationGateway','loadBalancer','firewall','natGateway','vpnGateway','expressRoute','frontDoor','bastion','privateEndpoint','publicIp','dns','privateDns'].includes(t)?'Networking':
 ['sqlDatabase','sqlManagedInstance','cosmosDb','postgresql','mysql','redis'].includes(t)?'Database':
 ['storageAccount','blobStorage','fileStorage','dataLake','netAppFiles'].includes(t)?'Storage':
 ['keyVault','defender','sentinel'].includes(t)?'Security':
 ['monitor','logAnalytics','applicationInsights'].includes(t)?'Monitoring':'Other';
 const fx:Record<string,number>={USD:1,EUR:.92,INR:83,GBP:.79};
 const costItems=nodes.filter((n):n is ArchitectureNode=>n.type==='architecture').map(n=>{
  const provider=n.data.cloudProvider==='aws'?'aws':'azure';
  const baseline=provider==='aws'?estimateAwsMonthlyCost(n.data):(costRates[n.data.resourceType]||0);
  const monthly=provider==='azure'?(livePrices[n.id]??baseline):baseline;
  return{
   id:n.id,
   name:n.data.label,
   type:n.data.resourceType,
   provider,
   category:provider==='aws'?awsCostCategory(n.data.resourceType):azureCostCategory(n.data.resourceType),
   monthly,
   live:provider==='azure'&&livePrices[n.id]!==undefined,
   source:provider==='aws'?'AWS estimate':(livePrices[n.id]!==undefined?'Azure live':'Azure estimate')
  };
 });
 const monthlyCost=costItems.reduce((s,x)=>s+x.monthly,0);
 const azureMonthlyCost=costItems.filter(x=>x.provider==='azure').reduce((s,x)=>s+x.monthly,0);
 const awsMonthlyCost=costItems.filter(x=>x.provider==='aws').reduce((s,x)=>s+x.monthly,0);
 const azureCostCount=costItems.filter(x=>x.provider==='azure').length;
 const awsCostCount=costItems.filter(x=>x.provider==='aws').length;
 const costBreakdown=costItems.reduce((a,x)=>{
  const key=`${x.provider==='aws'?'AWS':'Azure'} · ${x.category}`;
  a[key]=(a[key]||0)+x.monthly;
  return a;
 },{} as Record<string,number>);
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
  const priced=costItems.filter(x=>x.provider==='azure'&&serviceForType[x.type]).slice(0,30);
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
      setDesignId(parsed.designId||crypto.randomUUID());setOrganizationId(parsed.organizationId||organizationId);setOrganizationName(parsed.organizationName||organizationName);setProjectId(parsed.projectId||projectId);setProjectName(parsed.projectName||projectName);setEnvironmentId(parsed.environmentId||environmentId);setEnvironmentName(parsed.environmentName||environmentName);setDesignName(parsed.designName||'Imported Architecture');setDesignVariables(parsed.variables||[]);setDesignLocals(parsed.locals||[]);
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
 }; const deploymentConfigValid=()=>deployProvider==='azuredevops'
   ?Boolean(adoOrganization.trim()&&adoProject.trim()&&adoRepository.trim()&&adoPipelineId.trim())
   :Boolean(repoName.trim());
 const validateDeployment=()=>{
   if(!deploymentConfigValid()){setDeploymentStatus('failed');setDeploymentMessage('Complete the source-control and pipeline configuration first.');return;}
   if(!architectureNodes.length){setDeploymentStatus('failed');setDeploymentMessage('Add at least one Azure resource to the diagram before deployment.');return;}
   setDeploymentStatus('ready');
   setDeploymentMessage(`Ready to deploy ${architectureNodes.length} modeled Azure resources using ${deployIacType==='terraform'?'Terraform':'Bicep'} to ${deployEnvironment.toUpperCase()}.`);
 };
 const simulatePipelineStep=(status:typeof deploymentStatus,message:string,next?:()=>void,delay=700)=>{
   setDeploymentStatus(status);setDeploymentMessage(message);if(next)setTimeout(next,delay);
 };
 const startPlan=()=>{
   if(!deploymentConfigValid()){validateDeployment();return;}
   simulatePipelineStep('queued','Pipeline request queued.',()=>simulatePipelineStep('validating','Validating generated IaC.',()=>simulatePipelineStep('planning',deployIacType==='terraform'?'Running Terraform plan.':'Running Azure what-if.',()=>simulatePipelineStep('approval','Plan completed. Waiting for approval.'))));
 };
 const approveAndDeploy=()=>{
   if(deploymentStatus!=='approval'&&deploymentStatus!=='ready'){setDeploymentMessage('Run Validate / Plan first.');return;}
   simulatePipelineStep('deploying',`Deploying to Azure ${deployEnvironment.toUpperCase()} environment.`,()=>simulatePipelineStep('completed','Deployment workflow completed successfully in demo mode.'));
 };
 const statusLabel:Record<string,string>={idle:'Not configured',ready:'Ready',queued:'Queued',validating:'Validating',planning:'Planning',approval:'Waiting for approval',deploying:'Deploying',completed:'Completed',failed:'Needs attention'};
 const tfSafe=(value:string)=>value.toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'')||'resource';
 const findAncestorResource=(n:ArchitectureNode,type:ResourceType)=>{let cur=n.parentId?architectureNodes.find(x=>x.id===n.parentId):undefined;while(cur){if(cur.data.resourceType===type)return cur;cur=cur.parentId?architectureNodes.find(x=>x.id===cur!.parentId):undefined;}return undefined;};
 const hasAzureTerraformResources=architectureNodes.some(n=>n.data.cloudProvider!=='aws'&&!['tenant','managementGroup','subscription'].includes(n.data.resourceType));
 const hasAwsTerraformResources=architectureNodes.some(n=>n.data.cloudProvider==='aws'&&['awsVpc','awsSubnet','awsEc2'].includes(n.data.resourceType));
 const terraformResourceType=(type:ResourceType)=>{
  const map:Partial<Record<ResourceType,string>>={
   resourceGroup:'azurerm_resource_group',virtualNetwork:'azurerm_virtual_network',subnet:'azurerm_subnet',
   networkSecurityGroup:'azurerm_network_security_group',routeTable:'azurerm_route_table',publicIp:'azurerm_public_ip',
   privateEndpoint:'azurerm_private_endpoint',natGateway:'azurerm_nat_gateway',vpnGateway:'azurerm_virtual_network_gateway',
   loadBalancer:'azurerm_lb',applicationGateway:'azurerm_application_gateway',firewall:'azurerm_firewall',
   bastion:'azurerm_bastion_host',storageAccount:'azurerm_storage_account',blobStorage:'azurerm_storage_container',
   fileShare:'azurerm_storage_share',sqlDatabase:'azurerm_mssql_database',sqlManagedInstance:'azurerm_mssql_managed_instance',
   cosmosDb:'azurerm_cosmosdb_account',postgresql:'azurerm_postgresql_flexible_server',mysql:'azurerm_mysql_flexible_server',
   redis:'azurerm_redis_cache',virtualMachine:'azurerm_windows_virtual_machine',vmScaleSet:'azurerm_windows_virtual_machine_scale_set',
   appService:'azurerm_linux_web_app',functionApp:'azurerm_linux_function_app',aks:'azurerm_kubernetes_cluster',
   containerRegistry:'azurerm_container_registry',containerApps:'azurerm_container_app',keyVault:'azurerm_key_vault',
   managedIdentity:'azurerm_user_assigned_identity',apiManagement:'azurerm_api_management',serviceBus:'azurerm_servicebus_namespace',
   eventHubs:'azurerm_eventhub_namespace',dataFactory:'azurerm_data_factory',databricks:'azurerm_databricks_workspace',
   azureOpenAI:'azurerm_cognitive_account',aiSearch:'azurerm_search_service',logAnalytics:'azurerm_log_analytics_workspace',
   applicationInsights:'azurerm_application_insights',
   awsVpc:'aws_vpc',awsSubnet:'aws_subnet',awsEc2:'aws_instance'
  };return map[type]||`${String(type).startsWith('aws')?'aws':'azurerm'}_${type}`;
 };
 const quoteTf=(v:string|number|boolean)=>typeof v==='number'||typeof v==='boolean'?String(v):JSON.stringify(String(v));
 const terraformNodeAddress=(n:ArchitectureNode)=>{
  const tfType=terraformResourceType(n.data.resourceType);
  const name=tfSafe(n.data.label);
  return (n.data.resourceMode||'create')==='existing'
   ? `data.${tfType}.${name}`
   : `${tfType}.${name}`;
 };
 const terraformAttributeRef=(n:ArchitectureNode,attribute='id')=>`${terraformNodeAddress(n)}.${attribute}`;

 const resolveBindingExpression=(binding:any,literal:any)=>{
  if(!binding||binding.source==='literal')return quoteTf(literal);
  if(binding.source==='variable')return `var.${binding.variableName||'value'}`;
  if(binding.source==='local')return `local.${binding.localName||'value'}`;
  if(binding.source==='moduleOutput')return `module.${binding.moduleName||'module'}.${binding.moduleOutput||'output'}`;
  if(binding.source==='data')return `data.${binding.dataSourceType||'azurerm_resource_group'}.${binding.dataSourceName||'existing'}.${binding.dataAttribute||'id'}`;
  if(binding.source==='resource'&&binding.targetNodeId){
   const target=architectureNodes.find(x=>x.id===binding.targetNodeId);
   if(target)return terraformAttributeRef(target,binding.targetAttribute||'id');
  }
  return quoteTf(literal);
 };

 const inferParentReferences=(n:ArchitectureNode)=>{
  const refs:string[]=[];
  const parent=n.parentId?architectureNodes.find(x=>x.id===n.parentId):undefined;
  if(parent)refs.push(terraformNodeAddress(parent));
  return refs;
 };


 const terraformMainCode=useMemo(()=>{
  const lines:string[]=[];
  const internalFields=new Set([
    'resourceGroupRef','subscriptionRef','vnetRef','subnetRef','parentRef','environment',
    'owner','costCenter','businessUnit','application','managed_by','managedBy'
  ]);

  const findRg=(name?:string)=>architectureNodes.find(x=>x.data.resourceType==='resourceGroup'&&x.data.label===name);
  const findVnet=(name?:string)=>architectureNodes.find(x=>x.data.resourceType==='virtualNetwork'&&x.data.label===name);
  const findSubnet=(name?:string)=>architectureNodes.find(x=>x.data.resourceType==='subnet'&&x.data.label===name);

  const rgExpr=(n:ArchitectureNode)=>{
    const rg=findRg(n.data.resourceGroup);
    return rg?terraformAttributeRef(rg,'name'):(n.data.resourceGroup?JSON.stringify(n.data.resourceGroup):'var.resource_group_name');
  };
  const locExpr=(n:ArchitectureNode)=>{
    const rg=findRg(n.data.resourceGroup);
    return rg?terraformAttributeRef(rg,'location'):JSON.stringify(n.data.region||'Central India');
  };

  architectureNodes.filter(n=>n.data.cloudProvider!=='aws').forEach((n,i)=>{
    if(['tenant','managementGroup','subscription'].includes(n.data.resourceType))return;
    const tfType=terraformResourceType(n.data.resourceType);
    const name=tfSafe(n.data.label||`resource_${i}`);
    const mode=n.data.resourceMode||'create';

    if(mode==='existing'){
      const lookupName=n.data.existingResource?.name||n.data.label;
      const body=[`data "${tfType}" "${name}" {`,`  name = ${JSON.stringify(lookupName)}`];
      if(n.data.resourceGroup&&n.data.resourceType!=='resourceGroup')body.push(`  resource_group_name = ${rgExpr(n)}`);
      body.push('}');
      lines.push(body.join('\n')+'\n');
      return;
    }

    if(n.data.resourceType==='subnet'){
      const vnet=findVnet(n.data.vnet);
      const prefix=(n.data.properties?.addressPrefix||n.data.properties?.address_prefix||'10.0.1.0/24') as any;
      lines.push([
        `resource "azurerm_subnet" "${name}" {`,
        `  name                 = ${JSON.stringify(n.data.label)}`,
        `  resource_group_name  = ${rgExpr(n)}`,
        `  virtual_network_name = ${vnet?terraformAttributeRef(vnet,'name'):(n.data.vnet?JSON.stringify(n.data.vnet):'var.virtual_network_name')}`,
        `  address_prefixes     = [${quoteTf(prefix)}]`,
        `}`
      ].join('\n')+'\n');
      return;
    }

    if(n.data.resourceType==='virtualMachine'){
      const explicitSubnet=findSubnet(n.data.subnet);
      const parentSubnet=n.parentId?architectureNodes.find(x=>x.id===n.parentId&&x.data.resourceType==='subnet'):undefined;
      const subnet=explicitSubnet||parentSubnet;
      const nicName=`${name}_nic`;
      const image=(n.data.properties?.image||'2022-datacenter-azure-edition') as string;
      const size=(n.data.properties?.size||'Standard_D2s_v5') as string;
      const admin=(n.data.properties?.admin_username||n.data.properties?.adminUsername||'azureadmin') as string;

      lines.push([
        `resource "azurerm_network_interface" "${nicName}" {`,
        `  name                = ${JSON.stringify(`nic-${n.data.label}`)}`,
        `  location            = ${locExpr(n)}`,
        `  resource_group_name = ${rgExpr(n)}`,
        ``,
        `  ip_configuration {`,
        `    name                          = "internal"`,
        `    subnet_id                     = ${subnet?terraformAttributeRef(subnet,'id'):'var.subnet_id'}`,
        `    private_ip_address_allocation = "Dynamic"`,
        `  }`,
        `}`
      ].join('\n')+'\n');

      lines.push([
        `resource "azurerm_windows_virtual_machine" "${name}" {`,
        `  name                = ${JSON.stringify(n.data.label)}`,
        `  resource_group_name = ${rgExpr(n)}`,
        `  location            = ${locExpr(n)}`,
        `  size                = ${JSON.stringify(size)}`,
        `  admin_username      = ${JSON.stringify(admin)}`,
        `  admin_password      = var.vm_admin_password`,
        `  network_interface_ids = [`,
        `    azurerm_network_interface.${nicName}.id`,
        `  ]`,
        ``,
        `  os_disk {`,
        `    caching              = "ReadWrite"`,
        `    storage_account_type = "Premium_LRS"`,
        `  }`,
        ``,
        `  source_image_reference {`,
        `    publisher = "MicrosoftWindowsServer"`,
        `    offer     = "WindowsServer"`,
        `    sku       = ${JSON.stringify(image)}`,
        `    version   = "latest"`,
        `  }`,
        `}`
      ].join('\n')+'\n');
      return;
    }

    const body=[`resource "${tfType}" "${name}" {`,`  name = ${JSON.stringify(n.data.label)}`];

    if(n.data.resourceType==='resourceGroup'){
      body.push(`  location = ${JSON.stringify(n.data.region||'Central India')}`);
    }else{
      body.push(`  location = ${locExpr(n)}`);
      if(n.data.resourceGroup)body.push(`  resource_group_name = ${rgExpr(n)}`);
    }

    if(n.data.resourceType==='virtualNetwork'){
      const address=(n.data.properties?.addressSpace||n.data.properties?.address_space||'10.0.0.0/16') as any;
      body.push(`  address_space = [${quoteTf(address)}]`);
    }
    if(n.data.resourceType==='publicIp')body.push(`  allocation_method = "Static"`);
    if(n.data.resourceType==='storageAccount'){
      body.push(`  account_tier = "Standard"`);
      body.push(`  account_replication_type = "LRS"`);
    }

    Object.entries(n.data.properties||{}).forEach(([field,literal])=>{
      if(internalFields.has(field))return;
      if(['addressSpace','address_space','addressPrefix','address_prefix','image','size','admin_username','adminUsername'].includes(field))return;
      const binding=(n.data.bindings||{})[field];
      if(binding)body.push(`  ${field} = ${resolveBindingExpression(binding,literal as any)}`);
    });

    if(n.data.tags&&Object.keys(n.data.tags).length){
      body.push('  tags = {');
      Object.entries(n.data.tags).forEach(([k,v])=>body.push(`    ${JSON.stringify(k)} = ${JSON.stringify(v)}`));
      body.push('  }');
    }

    body.push('}');
    let block=body.join('\n');
    if(mode==='import'){
      const id=n.data.existingResource?.resourceId||'/subscriptions/.../resourceGroups/.../providers/...';
      block+=`\n\nimport {\n  to = ${tfType}.${name}\n  id = ${JSON.stringify(id)}\n}`;
    }
    lines.push(block+'\n');
  });

  const awsNodes=architectureNodes.filter(n=>n.data.cloudProvider==='aws');
  const awsFind=(type:ResourceType,label?:string)=>awsNodes.find(x=>x.data.resourceType===type&&x.data.label===label);
  const awsParent=findAncestorResource;
  const awsRef=(n:ArchitectureNode,attribute='id')=>`${terraformResourceType(n.data.resourceType)}.${tfSafe(n.data.label)}.${attribute}`;
  awsNodes.forEach((n,i)=>{
   const name=tfSafe(n.data.label||`aws_resource_${i}`); const p=n.data.properties||{};
   if(n.data.resourceType==='awsAccount'){lines.push(`# AWS Account boundary: ${n.data.label} (organizational diagram container; no aws provider resource is created)`);return;}
   if(n.data.resourceType==='awsVpc'){
    lines.push([`resource "aws_vpc" "${name}" {`,`  cidr_block           = ${quoteTf(p.cidrBlock||'10.0.0.0/16')}`,`  enable_dns_support   = ${quoteTf(p.enableDnsSupport??true)}`,`  enable_dns_hostnames = ${quoteTf(p.enableDnsHostnames??true)}`,`  instance_tenancy     = ${quoteTf(p.instanceTenancy||'default')}`,'','  tags = {',`    Name = ${quoteTf(n.data.label)}`,'  }','}'].join('\n')+'\n');return;
   }
   if(n.data.resourceType==='awsSubnet'){
    const vpc=awsFind('awsVpc',n.data.awsVpc)||awsParent(n,'awsVpc');
    lines.push([`resource "aws_subnet" "${name}" {`,`  vpc_id                  = ${vpc?awsRef(vpc):'var.aws_vpc_id'}`,`  cidr_block              = ${quoteTf(p.cidrBlock||'10.0.1.0/24')}`,`  availability_zone       = ${quoteTf(p.availabilityZone||`${n.data.region||'ap-south-1'}a`)}`,`  map_public_ip_on_launch = ${quoteTf(p.mapPublicIpOnLaunch??false)}`,'','  tags = {',`    Name = ${quoteTf(n.data.label)}`,'  }','}'].join('\n')+'\n');return;
   }
   if(n.data.resourceType==='awsEc2'){
    const subnet=awsFind('awsSubnet',n.data.awsSubnet)||awsParent(n,'awsSubnet');
    const sg=String(p.securityGroupIds||'').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);
    const body=[`resource "aws_instance" "${name}" {`,`  ami                         = ${quoteTf(p.amiId||'ami-REPLACE_ME')}`,`  instance_type               = ${quoteTf(p.instanceType||'t3.micro')}`,`  subnet_id                   = ${subnet?awsRef(subnet):'var.aws_subnet_id'}`,`  associate_public_ip_address = ${quoteTf(p.associatePublicIp??false)}`];
    if(p.keyName)body.push(`  key_name                    = ${quoteTf(p.keyName)}`);
    if(sg.length)body.push(`  vpc_security_group_ids      = [${sg.map(x=>quoteTf(x)).join(', ')}]`);
    if(p.iamInstanceProfile)body.push(`  iam_instance_profile        = ${quoteTf(p.iamInstanceProfile)}`);
    body.push('','  root_block_device {',`    volume_size = ${quoteTf(p.rootVolumeSize??30)}`,`    volume_type = ${quoteTf(p.rootVolumeType||'gp3')}`,'  }','','  tags = {',`    Name = ${quoteTf(n.data.label)}`,'  }','}'); lines.push(body.join('\n')+'\n');return;
   }
   lines.push(`# AWS ${n.data.resourceType} "${n.data.label}" remains diagram-only; Terraform mapping is not enabled yet.`);
  });
  return lines.join('\n');
 },[architectureNodes]);

 
 const vmPasswordVariableCode=useMemo(()=>architectureNodes.some(n=>n.data.resourceType==='virtualMachine')?
`variable "vm_admin_password" {
  description = "Administrator password for Windows virtual machines."
  type        = string
  sensitive   = true
}`:'',[architectureNodes]);
const terraformVariablesCode=useMemo(()=>{
 const userVariables=effectiveVariables.map(v=>{
  const lines=[`variable "${v.name}" {`,`  type = ${v.type}`];
  if(v.description)lines.push(`  description = ${JSON.stringify(v.description)}`);
  if(v.defaultValue!==undefined&&v.defaultValue!==''){
   const raw=(v.type==='number'||v.type==='bool'||v.type==='map(string)'||v.type==='list(string)'||v.type==='any')?String(v.defaultValue):JSON.stringify(String(v.defaultValue));
   lines.push(`  default = ${raw}`);
  }
  if(v.sensitive)lines.push('  sensitive = true');
  if(v.nullable===false)lines.push('  nullable = false');
  lines.push('}');
  return lines.join('\n');
 }).join('\n\n');
 const names=new Set(effectiveVariables.map(v=>v.name));
 const generated:string[]=[];
 if(hasAwsTerraformResources&&!names.has('aws_region'))generated.push('variable "aws_region" {\n  description = "AWS region used by the generated AWS provider."\n  type = string\n  default = "ap-south-1"\n}');
 if(architectureNodes.some(n=>n.data.cloudProvider==='aws'&&n.data.resourceType==='awsSubnet'&&!n.data.awsVpc&&!findAncestorResource(n,'awsVpc'))&&!names.has('aws_vpc_id'))generated.push('variable "aws_vpc_id" {\n  description = "Existing AWS VPC ID when the subnet is not nested under a modeled VPC."\n  type = string\n}');
 if(architectureNodes.some(n=>n.data.cloudProvider==='aws'&&n.data.resourceType==='awsEc2'&&!n.data.awsSubnet&&!findAncestorResource(n,'awsSubnet'))&&!names.has('aws_subnet_id'))generated.push('variable "aws_subnet_id" {\n  description = "Existing AWS subnet ID when EC2 is not nested under a modeled subnet."\n  type = string\n}');
 return [userVariables,...generated].filter(Boolean).join('\n\n');
},[effectiveVariables,architectureNodes,hasAwsTerraformResources]);

 const terraformLocalsCode=useMemo(()=>`locals {\n${effectiveLocals.length?effectiveLocals.map(l=>`  ${l.name} = ${l.value}`).join('\n'):'  # No locals declared'}\n}`,[effectiveLocals]);

 const terraformModulesCode=useMemo(()=>architectureModules.map(m=>{
  if(!m.name.trim()||!m.source.trim())return `# INVALID MODULE: ${m.name||'unnamed'}\n# Configure both module name and source in Model → Modules before deployment.`;
  const lines=[`module "${m.name}" {`,`  source = ${JSON.stringify(m.source)}`];
  if(m.version)lines.push(`  version = ${JSON.stringify(m.version)}`);
  Object.entries(m.inputs).forEach(([k,v])=>{
   if(!v.trim())lines.push(`  # ${k} = null  # TODO: provide a value`);
   else lines.push(`  ${k} = ${v}`);
  });
  lines.push('}');
  return lines.join('\n');
 }).join('\n\n'),[architectureModules]);

 const terraformOutputsCode=useMemo(()=>architectureOutputs.map(o=>{
  const lines=[`output "${o.name}" {`,`  value = ${o.value||'null'}`];
  if(o.description)lines.push(`  description = ${JSON.stringify(o.description)}`);
  if(o.sensitive)lines.push('  sensitive = true');
  lines.push('}');
  return lines.join('\n');
 }).join('\n\n'),[architectureOutputs]);


 const extractTfReferences=(expr:string)=>{
  const refs:{kind:'var'|'local'|'data'|'module'|'resource';root:string;full:string}[]=[];
  const seen=new Set<string>();
  const patterns=[
   {kind:'var' as const,re:/\bvar\.([A-Za-z_][A-Za-z0-9_]*)\b/g},
   {kind:'local' as const,re:/\blocal\.([A-Za-z_][A-Za-z0-9_]*)\b/g},
   {kind:'data' as const,re:/\bdata\.([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\b/g},
   {kind:'module' as const,re:/\bmodule\.([A-Za-z_][A-Za-z0-9_]*)\b/g},
   {kind:'resource' as const,re:/\b(azurerm_[A-Za-z0-9_]+)\.([A-Za-z_][A-Za-z0-9_]*)\b/g},
  ];
  for(const p of patterns){
   let m:RegExpExecArray|null;
   while((m=p.re.exec(expr))!==null){
    if(seen.has(m[0]))continue;
    seen.add(m[0]);
    refs.push({kind:p.kind,root:(p.kind==='data'||p.kind==='resource')?`${m[1]}.${m[2]}`:m[1],full:m[0]});
   }
  }
  return refs;
 };
 const referencedDataSources=useMemo(()=>{
  const expressions=[
   ...architectureOutputs.map(o=>o.value),
   ...architectureModules.flatMap(m=>Object.values(m.inputs)),
   ...architectureNodes.flatMap(n=>Object.values(n.data.bindings||{}).map(b=>b.source==='data'?`data.${b.dataSourceType||'azurerm_resource_group'}.${b.dataSourceName||'existing'}.${b.dataAttribute||'id'}`:''))
  ];
  const map=new Map<string,{type:string;name:string}>();
  expressions.forEach(expr=>extractTfReferences(expr||'').filter(r=>r.kind==='data').forEach(r=>{
   const [type,name]=r.root.split('.');
   map.set(`${type}.${name}`,{type,name});
  }));
  return [...map.values()];
 },[architectureOutputs,architectureModules,architectureNodes]);
 const terraformDataSourcesCode=useMemo(()=>referencedDataSources.map(d=>{
  if(d.type==='azurerm_subscription')return `data "azurerm_subscription" "${d.name}" {}`;
  return `data "${d.type}" "${d.name}" {\n  # TODO: configure lookup arguments required by this data source\n}`;
 }).join('\n\n'),[referencedDataSources]);

 const deploymentReadiness=useMemo(()=>{
  const critical:string[]=[];
  const warnings:string[]=[];
  const readyNodes:string[]=[];
  const seenNames=new Map<string,string[]>();

  architectureNodes.forEach(n=>{
   const mode=n.data.resourceMode||'create';
   const tfType=terraformResourceType(n.data.resourceType);
   const tfName=tfSafe(n.data.label);
   const key=`${tfType}.${tfName}`;
   seenNames.set(key,[...(seenNames.get(key)||[]),n.id]);

   if(!n.data.label.trim())critical.push(`Resource ${n.id} has no name.`);
   if(mode==='existing'&&!n.data.existingResource?.name&&!n.data.existingResource?.resourceId)critical.push(`${n.data.label}: Existing resource lookup is incomplete.`);
   if(mode==='import'&&!n.data.existingResource?.resourceId)critical.push(`${n.data.label}: Import resource ID is missing.`);

   Object.entries(n.data.bindings||{}).forEach(([field,b]:any)=>{
    if(b.source==='resource'){
     const target=architectureNodes.find(x=>x.id===b.targetNodeId);
     if(!target)critical.push(`${n.data.label}.${field}: referenced resource is missing.`);
    }
    if(b.source==='variable'&&!effectiveVariables.some(v=>v.name===b.variableName))critical.push(`${n.data.label}.${field}: variable ${b.variableName||'(missing)'} is undeclared.`);
    if(b.source==='local'&&!effectiveLocals.some(v=>v.name===b.localName))critical.push(`${n.data.label}.${field}: local ${b.localName||'(missing)'} is undeclared.`);
    if(b.source==='moduleOutput'&&!architectureModules.some(m=>m.name===b.moduleName&&m.source.trim()))critical.push(`${n.data.label}.${field}: module ${b.moduleName||'(missing)'} is not deployment-ready.`);
   });

   if(['virtualMachine','vmScaleSet','appService','functionApp','aks','containerApps'].includes(n.data.resourceType)&&!n.data.subscriptionName)warnings.push(`${n.data.label}: subscription relationship is not set.`);
   if(!['tenant','managementGroup','subscription','resourceGroup'].includes(n.data.resourceType)&&!n.data.resourceGroup)warnings.push(`${n.data.label}: resource group relationship is not set.`);

   readyNodes.push(n.id);
  });

  seenNames.forEach((ids,address)=>{
   if(ids.length>1)critical.push(`Duplicate Terraform address: ${address}`);
  });


  // Detect generator fallbacks that would require undeclared variables.
  architectureNodes.forEach(n=>{
   if(n.data.resourceType==='virtualMachine'){
    const explicitSubnet=architectureNodes.find(x=>x.data.resourceType==='subnet'&&x.data.label===n.data.subnet);
    const parentSubnet=n.parentId?architectureNodes.find(x=>x.id===n.parentId&&x.data.resourceType==='subnet'):undefined;
    const resolvedSubnet=explicitSubnet||parentSubnet;
    if(!resolvedSubnet&&!effectiveVariables.some(v=>v.name==='subnet_id')){
     critical.push(`${n.data.label}: NIC subnet could not be resolved and variable subnet_id is not declared.`);
    }
    if(!n.data.resourceGroup&&!effectiveVariables.some(v=>v.name==='resource_group_name')){
     critical.push(`${n.data.label}: Resource Group could not be resolved and variable resource_group_name is not declared.`);
    }
   }
   if(n.data.resourceType==='subnet'){
    const vnetResolved=architectureNodes.some(x=>x.data.resourceType==='virtualNetwork'&&x.data.label===n.data.vnet);
    if(!vnetResolved&&!effectiveVariables.some(v=>v.name==='virtual_network_name')){
     critical.push(`${n.data.label}: Virtual Network could not be resolved and variable virtual_network_name is not declared.`);
    }
   }
  });

  architectureModules.forEach(m=>{
   if(!m.name.trim())critical.push('A Terraform module has no name.');
   if(!m.source.trim())critical.push(`module.${m.name||'unnamed'} has no source.`);
   Object.entries(m.inputs).forEach(([k,v])=>{if(!String(v).trim())warnings.push(`module.${m.name||'unnamed'}.${k} has no value.`)});
  });

  architectureOutputs.forEach(o=>{
   if(!o.name.trim())critical.push('An output has no name.');
   if(!o.value.trim())warnings.push(`output.${o.name||'unnamed'} has no expression.`);
  });

  return {
   ready:critical.length===0,
   critical,
   warnings,
   resourceCount:architectureNodes.length,
   readyResourceCount:readyNodes.length
  };
 },[architectureNodes,effectiveVariables,effectiveLocals,architectureModules,architectureOutputs]);
 const terraformProvidersCode=[
  'terraform {',
  '  required_version = ">= 1.6.0"',
  '  required_providers {',
  ...(hasAzureTerraformResources?['    azurerm = {','      source  = "hashicorp/azurerm"','      version = "~> 4.0"','    }']:[]),
  ...(hasAwsTerraformResources?['    aws = {','      source  = "hashicorp/aws"','      version = "~> 6.0"','    }']:[]),
  '  }','}',
  ...(hasAzureTerraformResources?['','provider "azurerm" {','  features {}','}']:[]),
  ...(hasAwsTerraformResources?['','provider "aws" {','  region = var.aws_region','}']:[])
 ].join('\n');
 const terraformMetadataCode=`# Architecture: ${designName}\n# Version: ${architectureMetadata.version}\n# Owner: ${architectureMetadata.owner||'Not specified'}\n# Application: ${architectureMetadata.application||'Not specified'}\n# Criticality: ${architectureMetadata.criticality}\n# Lifecycle: ${architectureMetadata.lifecycle}\n# Description: ${architectureMetadata.description||'Not specified'}`;
 const terraformCode=useMemo(()=>[
  terraformMetadataCode,terraformProvidersCode,terraformVariablesCode,vmPasswordVariableCode,terraformLocalsCode,
  terraformDataSourcesCode,terraformModulesCode,terraformMainCode,terraformOutputsCode
 ].filter(Boolean).join('\n\n'),[
  terraformMetadataCode,terraformVariablesCode,vmPasswordVariableCode,terraformLocalsCode,terraformDataSourcesCode,
  terraformModulesCode,terraformMainCode,terraformOutputsCode
 ]);
 const bicepCode=useMemo(()=>{const lines=["targetScope = 'subscription'",''];architectureNodes.filter(n=>n.data.resourceType==='resourceGroup').forEach((n,i)=>lines.push(`resource rg${i} 'Microsoft.Resources/resourceGroups@2024-03-01' = {\n  name: '${n.data.label}'\n  location: '${n.data.region}'\n}\n`));architectureNodes.filter(n=>!['tenant','managementGroup','subscription','resourceGroup'].includes(n.data.resourceType)).forEach(n=>lines.push(`// TODO ${n.data.resourceType}: ${n.data.label} | RG: ${n.data.resourceGroup||'unassigned'} | ${n.data.region}`));return lines.join('\n');},[architectureNodes]);
 const iacCode=iacMode==='terraform'?terraformCode:bicepCode;
 const copyIac=()=>navigator.clipboard.writeText(iacCode);
 const downloadIac=()=>download(new Blob([iacCode],{type:'text/plain'}),iacMode==='terraform'?'main.tf':'main.bicep');


 const terraformBackendCode=useMemo(()=>{
  if(terraformBackendMode==='local')return [
   'terraform {',
   '  backend "local" {',
   '    path = "terraform.tfstate"',
   '  }',
   '}',
   ''
  ].join('\n');
  const safeKey=tfBackendKey.trim()||`${(designName||'architecture').trim().toLowerCase().replace(/[^a-z0-9-_]+/g,'-')}.tfstate`;
  return [
   'terraform {',
   '  backend "azurerm" {',
   `    resource_group_name  = ${JSON.stringify(tfBackendResourceGroup.trim()||'REPLACE_WITH_STATE_RESOURCE_GROUP')}`,
   `    storage_account_name = ${JSON.stringify(tfBackendStorageAccount.trim()||'REPLACE_WITH_STATE_STORAGE_ACCOUNT')}`,
   `    container_name       = ${JSON.stringify(tfBackendContainer.trim()||'tfstate')}`,
   `    key                  = ${JSON.stringify(safeKey)}`,
   '  }',
   '}',
   ''
  ].join('\n');
 },[terraformBackendMode,tfBackendResourceGroup,tfBackendStorageAccount,tfBackendContainer,tfBackendKey,designName]);

 const terraformBackendReady=terraformBackendMode==='local'||Boolean(
  tfBackendResourceGroup.trim()&&tfBackendStorageAccount.trim()&&tfBackendContainer.trim()
 );

 const terraformTfvarsExampleCode=useMemo(()=>{
  const lines:string[]=[
   '# ArchMindCanvas generated example variable values',
   '# Copy this file to terraform.tfvars and replace placeholders as needed.',
   '# Never commit real secrets.',
   ''
  ];
  const declared=new Set<string>();

  effectiveVariables.forEach(v=>{
   if(!v.name||declared.has(v.name))return;
   declared.add(v.name);
   const raw=(v as any).defaultValue ?? (v as any).value ?? '';
   const sensitive=(v as any).sensitive===true||/password|secret|token|key/i.test(v.name);
   if(sensitive){
    lines.push(`# ${v.name} = "REPLACE_WITH_SECURE_VALUE"`);
   }else if(typeof raw==='number'||typeof raw==='boolean'){
    lines.push(`${v.name} = ${raw}`);
   }else if(String(raw).trim()){
    lines.push(`${v.name} = ${JSON.stringify(String(raw))}`);
   }else{
    lines.push(`# ${v.name} = "REPLACE_ME"`);
   }
  });

  if(architectureNodes.some(n=>n.data.resourceType==='virtualMachine')&&!declared.has('vm_admin_password')){
   lines.push('# vm_admin_password = "REPLACE_WITH_SECURE_VALUE"');
  }

  return lines.join('\n')+'\n';
 },[effectiveVariables,architectureNodes]);

 const downloadIacBundle=async()=>{
  const zip=new JSZip();
  const safeName=(designName||'archmindcanvas-architecture').trim().toLowerCase().replace(/[^a-z0-9-_]+/g,'-').replace(/^-+|-+$/g,'')||'archmindcanvas-architecture';

  if(iacMode==='terraform'){
    zip.file('providers.tf',terraformProvidersCode);
    zip.file('backend.tf',terraformBackendCode);
    zip.file('variables.tf',[terraformVariablesCode,vmPasswordVariableCode].filter(Boolean).join('\n\n')||'# No variables declared\n');
    zip.file('terraform.tfvars.example',terraformTfvarsExampleCode);
    zip.file('locals.tf',terraformLocalsCode);
    zip.file('data.tf',terraformDataSourcesCode||'# No referenced data sources\n');
    zip.file('modules.tf',terraformModulesCode||'# No modules declared\n');
    zip.file('main.tf',`${terraformMetadataCode}\n\n${terraformMainCode||'# No Terraform resources modeled'}\n`);
    zip.file('outputs.tf',terraformOutputsCode||'# No outputs declared\n');

    const readme=[
      `# ${designName}`,
      '',
      'Generated by ArchMindCanvas.',
      '',
      `Architecture version: ${architectureMetadata.version}`,
      `Owner: ${architectureMetadata.owner||'Not specified'}`,
      `Application: ${architectureMetadata.application||'Not specified'}`,
      `Environment: ${environmentName}`,
      '',
      '## Files',
      '- providers.tf',
      '- backend.tf',
      '- variables.tf',
      '- terraform.tfvars.example',
      '- locals.tf',
      '- data.tf',
      '- modules.tf',
      '- main.tf',
      '- outputs.tf',
      '',
      '## Quick start',
      '1. terraform init',
      '2. terraform validate',
      '3. Copy terraform.tfvars.example to terraform.tfvars and replace placeholders',
      '4. terraform plan',
      '',
      '## Security',
      '- Do not commit real passwords, secrets, tokens, or private keys.',
      '- terraform.tfvars.example contains safe placeholders for sensitive values.',
      '',
      'Review validation findings in ArchMindCanvas before terraform plan/apply.'
    ].join('\n');
    zip.file('README.md',readme);
  }else{
    zip.file('main.bicep',bicepCode);
    zip.file('main.bicepparam',`using './main.bicep'\n`);
    zip.file('README.md',`# ${designName}\n\nGenerated by ArchMindCanvas.\n`);
  }

  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
  download(blob,`${safeName}-${iacMode}-bundle.zip`);
};
 const prepareRepoPush=()=>{if(!repoName.trim()){alert('Enter a repository name first.');return;}alert(`Repository package prepared for ${repoProvider==='github'?'GitHub':'Azure DevOps'}: ${repoName} / ${repoBranch} / ${repoFolder}.\n\nFor security, v5.3 does not store PATs or tokens in the browser. Connect a secure backend/GitHub App or Azure DevOps OAuth service to enable direct push.`);};

 const findings=useMemo<ValidationFinding[]>(()=>{
  const r:ValidationFinding[]=[];
  const resourceNames=new Map<string,string[]>();
  const createdResourceRefs=new Set(architectureNodes.filter(n=>(n.data.resourceMode||'create')!=='existing').map(n=>`${terraformResourceType(n.data.resourceType)}.${tfSafe(n.data.label)}`));
  const dataResourceRefs=new Set(architectureNodes.filter(n=>(n.data.resourceMode||'create')==='existing').map(n=>`${terraformResourceType(n.data.resourceType)}.${tfSafe(n.data.label)}`));
  const declaredDataRefs=new Set(referencedDataSources.map(d=>`${d.type}.${d.name}`));

  architectureNodes.forEach(n=>{
    const key=n.data.label.trim().toLowerCase();
    resourceNames.set(key,[...(resourceNames.get(key)||[]),n.id]);

    if(n.data.resourceType==='publicIp')r.push({id:`pub-${n.id}`,severity:'warning',title:'Public IP detected',message:'Prefer controlled ingress, Bastion, Front Door or private access where appropriate.',nodeId:n.id});
    if(!['tenant','managementGroup','subscription'].includes(n.data.resourceType)&&!n.data.subscriptionName)r.push({id:`sub-${n.id}`,severity:'warning',title:'Subscription not linked',message:'Link this resource to a Subscription hierarchy.',nodeId:n.id});
    if(!['tenant','managementGroup','subscription','resourceGroup'].includes(n.data.resourceType)&&!n.data.resourceGroup)r.push({id:`rg-${n.id}`,severity:'warning',title:'Resource Group not linked',message:'Assign a Resource Group parent.',nodeId:n.id});
    if(n.data.resourceType==='virtualMachine'&&!n.data.subnet)r.push({id:`net-${n.id}`,severity:'warning',title:'VM has no subnet',message:'Place the VM under a VNet/Subnet hierarchy.',nodeId:n.id});

    if((n.data.resourceMode||'create')==='existing'&&!n.data.existingResource?.name&&!n.data.existingResource?.resourceId)r.push({id:`existing-${n.id}`,severity:'critical',title:'Existing resource lookup incomplete',message:`${n.data.label} is marked Existing but has no name or resource ID lookup value.`,nodeId:n.id});
    if((n.data.resourceMode||'create')==='import'&&!n.data.existingResource?.resourceId)r.push({id:`import-${n.id}`,severity:'critical',title:'Import ID missing',message:`${n.data.label} is marked Import but has no Azure resource ID.`,nodeId:n.id});

    Object.entries(n.data.bindings||{}).forEach(([field,b])=>{
      if(b.source==='resource'&&(!b.targetNodeId||!architectureNodes.some(x=>x.id===b.targetNodeId)))r.push({id:`ref-${n.id}-${field}`,severity:'critical',title:'Broken resource reference',message:`${n.data.label}.${field} references a missing diagram resource.`,nodeId:n.id});
      if(b.source==='variable'&&(!b.variableName||!effectiveVariables.some(v=>v.name===b.variableName)))r.push({id:`var-${n.id}-${field}`,severity:'critical',title:'Unresolved variable',message:`${n.data.label}.${field} references var.${b.variableName||'unknown'} which is not declared.`,nodeId:n.id});
      if(b.source==='local'&&(!b.localName||!effectiveLocals.some(v=>v.name===b.localName)))r.push({id:`local-${n.id}-${field}`,severity:'critical',title:'Unresolved local',message:`${n.data.label}.${field} references local.${b.localName||'unknown'} which is not declared.`,nodeId:n.id});
      if(b.source==='moduleOutput'&&(!b.moduleName||!architectureModules.some(m=>m.name===b.moduleName&&m.source.trim())))r.push({id:`modref-${n.id}-${field}`,severity:'critical',title:'Unresolved module output',message:`${n.data.label}.${field} references a module that is not fully configured.`,nodeId:n.id});
    });
  });

  resourceNames.forEach((ids,name)=>{if(name&&ids.length>1)r.push({id:`dup-${name}`,severity:'critical',title:'Duplicate resource name',message:`${ids.length} resources use the name "${name}". Terraform resource names must be unique in this architecture.`})});

  architectureModules.forEach(m=>{
    if(!m.name.trim())r.push({id:`module-name-${m.id}`,severity:'critical',title:'Module name missing',message:'A Terraform module has no name.'});
    if(!m.source.trim())r.push({id:`module-source-${m.id}`,severity:'critical',title:'Module source missing',message:`module.${m.name||'unnamed'} requires a Registry or Git source.`});
    Object.entries(m.inputs).forEach(([k,v])=>{if(!v.trim())r.push({id:`module-input-${m.id}-${k}`,severity:'warning',title:'Module input incomplete',message:`module.${m.name||'unnamed'}.${k} has no value.`})});
  });

  const validateExpression=(expr:string,owner:string,idPrefix:string)=>{
    extractTfReferences(expr||'').forEach(ref=>{
      if(ref.kind==='var'&&!effectiveVariables.some(v=>v.name===ref.root))r.push({id:`${idPrefix}-var-${ref.root}`,severity:'critical',title:'Undeclared Terraform variable',message:`${owner} references ${ref.full}, but that variable is not declared.`});
      if(ref.kind==='local'&&!effectiveLocals.some(v=>v.name===ref.root))r.push({id:`${idPrefix}-local-${ref.root}`,severity:'critical',title:'Undeclared Terraform local',message:`${owner} references ${ref.full}, but that local is not declared.`});
      if(ref.kind==='module'&&!architectureModules.some(m=>m.name===ref.root&&m.source.trim()))r.push({id:`${idPrefix}-module-${ref.root}`,severity:'critical',title:'Undeclared Terraform module',message:`${owner} references ${ref.full}, but that module is not fully configured.`});
      if(ref.kind==='data'&&!declaredDataRefs.has(ref.root)&&!dataResourceRefs.has(ref.root))r.push({id:`${idPrefix}-data-${ref.root}`,severity:'critical',title:'Undeclared Terraform data source',message:`${owner} references data.${ref.root}, but no matching data source can be generated.`});
      if(ref.kind==='resource'&&!createdResourceRefs.has(ref.root))r.push({id:`${idPrefix}-resource-${ref.root}`,severity:'critical',title:'Undeclared Terraform resource',message:`${owner} references ${ref.full}, but no matching created/imported resource exists.`});
    });
  };

  architectureOutputs.forEach(o=>{
    if(!o.name.trim())r.push({id:`output-name-${o.id}`,severity:'critical',title:'Output name missing',message:'An architecture output has no name.'});
    if(!o.value.trim())r.push({id:`output-value-${o.id}`,severity:'warning',title:'Output value missing',message:`output.${o.name||'unnamed'} has no Terraform expression.`});
    else validateExpression(o.value,`output.${o.name||'unnamed'}`,`output-${o.id}`);
  });

  architectureModules.forEach(m=>Object.entries(m.inputs).forEach(([k,v])=>{if(v.trim())validateExpression(v,`module.${m.name}.${k}`,`module-${m.id}-${k}`)}));

  if(!architectureMetadata.owner.trim())r.push({id:'meta-owner',severity:'info',title:'Architecture owner not set',message:'Set an owner in Model → Metadata for enterprise traceability.'});
  if(!architectureMetadata.description.trim())r.push({id:'meta-description',severity:'info',title:'Architecture description not set',message:'Document the architecture purpose in Model → Metadata.'});

  deploymentReadiness.critical.forEach((message,i)=>r.push({id:`readiness-critical-${i}`,severity:'critical',title:'Deployment readiness blocker',message}));
  deploymentReadiness.warnings.forEach((message,i)=>r.push({id:`readiness-warning-${i}`,severity:'warning',title:'Deployment readiness warning',message}));

  if(!r.some(x=>x.severity==='critical'||x.severity==='warning'))r.push({id:'ok',severity:'success',title:'IaC integrity checks passed',message:'Hierarchy, references, data sources, modules and outputs are structurally consistent.'});
  return r;
 },[architectureNodes,effectiveVariables,effectiveLocals,architectureModules,architectureOutputs,architectureMetadata,referencedDataSources,deploymentReadiness]);
 const score=Math.max(35,100-findings.filter(f=>f.severity==='warning').length*6-findings.filter(f=>f.severity==='critical').length*20);

 const useReferenceStarter=useCallback((starterKey:string,referenceTitle:string,referenceHref:string)=>{
  const id=()=>crypto.randomUUID();
  const mk=(resourceType:ResourceType,label:string,x:number,y:number,width?:number,height?:number,parentId?:string,extra:Partial<ArchitectureNodeData>={}):CanvasNode=>{
   const container=isContainerType(resourceType);
   return {
    id:id(),
    type:container?'container':'architecture',
    position:{x,y},
    ...(parentId?{parentId,extent:'parent' as const}:{}),
    ...(container?{style:{...(containerSize(resourceType)),...(width?{width}:{}),...(height?{height}: {})}}:{}),
    data:{...makeData(resourceType,label),resourceMode:'create',environment:environmentName,...extra}
   } as CanvasNode;
  };
  const edge=(source:string,target:string,label?:string):CanvasEdge=>({
   id:id(),source,target,type:'styled',
   data:{connectorStyle:'smoothstep',arrowStyle:'end',...(label?{label}: {})}
  } as CanvasEdge);

  const subscription=mk('subscription','Azure Subscription',60,50,1200,820,undefined,{resourceMode:'existing'} as any);
  const rg=mk('resourceGroup',`${referenceTitle.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,36)}-RG`,45,95,1060,660,subscription.id,{resourceGroup:'Reference-Starter-RG'} as any);
  const ns:CanvasNode[]=[subscription,rg];
  const es:CanvasEdge[]=[];

  if(starterKey==='hub-spoke'){
   const hub=mk('virtualNetwork','Hub-VNet',35,80,430,500,rg.id,{resourceGroup:rg.data.label,properties:{addressSpace:'10.0.0.0/16'}} as any);
   const hubSubnet=mk('subnet','AzureFirewallSubnet',25,90,340,150,hub.id,{resourceGroup:rg.data.label,vnet:hub.data.label,properties:{addressPrefix:'10.0.1.0/24'}} as any);
   const fw=mk('firewall','Azure-Firewall',70,55,undefined,undefined,hubSubnet.id,{resourceGroup:rg.data.label,vnet:hub.data.label,subnet:hubSubnet.data.label} as any);
   const bastionSubnet=mk('subnet','AzureBastionSubnet',25,270,340,150,hub.id,{resourceGroup:rg.data.label,vnet:hub.data.label,properties:{addressPrefix:'10.0.2.0/24'}} as any);
   const bastion=mk('bastion','Azure-Bastion',70,55,undefined,undefined,bastionSubnet.id,{resourceGroup:rg.data.label,vnet:hub.data.label,subnet:bastionSubnet.data.label} as any);
   const spoke1=mk('virtualNetwork','Spoke-App-VNet',500,80,250,500,rg.id,{resourceGroup:rg.data.label,properties:{addressSpace:'10.10.0.0/16'}} as any);
   const s1=mk('subnet','App-Subnet',25,100,180,220,spoke1.id,{resourceGroup:rg.data.label,vnet:spoke1.data.label,properties:{addressPrefix:'10.10.1.0/24'}} as any);
   const vm=mk('virtualMachine','Application-VM',30,70,undefined,undefined,s1.id,{resourceGroup:rg.data.label,vnet:spoke1.data.label,subnet:s1.data.label} as any);
   const spoke2=mk('virtualNetwork','Spoke-Data-VNet',780,80,250,500,rg.id,{resourceGroup:rg.data.label,properties:{addressSpace:'10.20.0.0/16'}} as any);
   const s2=mk('subnet','Data-Subnet',25,100,180,220,spoke2.id,{resourceGroup:rg.data.label,vnet:spoke2.data.label,properties:{addressPrefix:'10.20.1.0/24'}} as any);
   const sql=mk('sqlDatabase','Application-SQL',30,70,undefined,undefined,s2.id,{resourceGroup:rg.data.label,vnet:spoke2.data.label,subnet:s2.data.label} as any);
   ns.push(hub,hubSubnet,fw,bastionSubnet,bastion,spoke1,s1,vm,spoke2,s2,sql);
   es.push(edge(hub.id,spoke1.id,'Peering'),edge(hub.id,spoke2.id,'Peering'));
  }else if(starterKey==='aks-baseline'){
   const vnet=mk('virtualNetwork','AKS-VNet',45,80,650,500,rg.id,{resourceGroup:rg.data.label,properties:{addressSpace:'10.30.0.0/16'}} as any);
   const snet=mk('subnet','AKS-Subnet',30,100,380,260,vnet.id,{resourceGroup:rg.data.label,vnet:vnet.data.label,properties:{addressPrefix:'10.30.1.0/24'}} as any);
   const aks=mk('aks','AKS-Cluster',55,65,undefined,undefined,snet.id,{resourceGroup:rg.data.label,vnet:vnet.data.label,subnet:snet.data.label} as any);
   const nat=mk('natGateway','AKS-NAT-Gateway',220,65,undefined,undefined,snet.id,{resourceGroup:rg.data.label,vnet:vnet.data.label,subnet:snet.data.label} as any);
   const acr=mk('containerRegistry','Container-Registry',730,100,undefined,undefined,rg.id,{resourceGroup:rg.data.label} as any);
   const kv=mk('keyVault','AKS-Key-Vault',730,230,undefined,undefined,rg.id,{resourceGroup:rg.data.label} as any);
   const logs=mk('logAnalytics','AKS-Log-Analytics',730,360,undefined,undefined,rg.id,{resourceGroup:rg.data.label} as any);
   ns.push(vnet,snet,aks,nat,acr,kv,logs);
   es.push(edge(acr.id,aks.id),edge(kv.id,aks.id),edge(aks.id,logs.id));
  }else if(starterKey==='multi-region-web'){
   const fd=mk('frontDoor','Azure-Front-Door',440,80,undefined,undefined,rg.id,{resourceGroup:rg.data.label} as any);
   const v1=mk('virtualNetwork','Region-1-VNet',50,220,430,360,rg.id,{resourceGroup:rg.data.label,region:'West Europe',properties:{addressSpace:'10.40.0.0/16'}} as any);
   const s1=mk('subnet','Region-1-App-Subnet',25,80,330,180,v1.id,{resourceGroup:rg.data.label,vnet:v1.data.label,region:'West Europe',properties:{addressPrefix:'10.40.1.0/24'}} as any);
   const app1=mk('appService','Web-App-Region-1',55,55,undefined,undefined,s1.id,{resourceGroup:rg.data.label,vnet:v1.data.label,subnet:s1.data.label,region:'West Europe'} as any);
   const v2=mk('virtualNetwork','Region-2-VNet',560,220,430,360,rg.id,{resourceGroup:rg.data.label,region:'North Europe',properties:{addressSpace:'10.50.0.0/16'}} as any);
   const s2=mk('subnet','Region-2-App-Subnet',25,80,330,180,v2.id,{resourceGroup:rg.data.label,vnet:v2.data.label,region:'North Europe',properties:{addressPrefix:'10.50.1.0/24'}} as any);
   const app2=mk('appService','Web-App-Region-2',55,55,undefined,undefined,s2.id,{resourceGroup:rg.data.label,vnet:v2.data.label,subnet:s2.data.label,region:'North Europe'} as any);
   const db=mk('sqlDatabase','Geo-Replicated-SQL',440,500,undefined,undefined,rg.id,{resourceGroup:rg.data.label} as any);
   ns.push(fd,v1,s1,app1,v2,s2,app2,db);
   es.push(edge(fd.id,app1.id),edge(fd.id,app2.id),edge(app1.id,db.id),edge(app2.id,db.id));
  }else if(starterKey==='avd-enterprise'){
   const vnet=mk('virtualNetwork','AVD-VNet',45,90,640,500,rg.id,{resourceGroup:rg.data.label,properties:{addressSpace:'10.60.0.0/16'}} as any);
   const snet=mk('subnet','AVD-SessionHosts-Subnet',30,100,390,270,vnet.id,{resourceGroup:rg.data.label,vnet:vnet.data.label,properties:{addressPrefix:'10.60.1.0/24'}} as any);
   const avd=mk('avd','AVD-Workspace-HostPool',70,55,undefined,undefined,snet.id,{resourceGroup:rg.data.label,vnet:vnet.data.label,subnet:snet.data.label} as any);
   const vm=mk('virtualMachine','AVD-Session-Host',220,55,undefined,undefined,snet.id,{resourceGroup:rg.data.label,vnet:vnet.data.label,subnet:snet.data.label} as any);
   const storage=mk('storageAccount','FSLogix-Storage',740,110,undefined,undefined,rg.id,{resourceGroup:rg.data.label} as any);
   const pe=mk('privateEndpoint','FSLogix-Private-Endpoint',740,235,undefined,undefined,rg.id,{resourceGroup:rg.data.label,vnet:vnet.data.label,subnet:snet.data.label} as any);
   const kv=mk('keyVault','AVD-Key-Vault',740,360,undefined,undefined,rg.id,{resourceGroup:rg.data.label} as any);
   const logs=mk('logAnalytics','AVD-Log-Analytics',740,485,undefined,undefined,rg.id,{resourceGroup:rg.data.label} as any);
   ns.push(vnet,snet,avd,vm,storage,pe,kv,logs);
   es.push(edge(storage.id,pe.id),edge(pe.id,avd.id),edge(avd.id,vm.id),edge(avd.id,logs.id));
  }else{
   alert('This reference starter is not mapped yet.');
   return;
  }

  const newDesignId=crypto.randomUUID();
  const starterName=`${referenceTitle} - Starter`;
  setDesignId(newDesignId);
  setDesignName(starterName);
  setNodes(normalizeCanvasLayering(ns));
  setEdges(es);
  setSelectedNodeId(undefined);
  setSelectedEdgeId(undefined);
  setDesignVariables([]);
  setDesignLocals([]);
  setArchitectureOutputs([]);
  setArchitectureModules([]);
  setArchitectureMetadata({
   description:`Editable ArchMindCanvas starter adapted from Microsoft reference guidance: ${referenceTitle}. Review and customize all resources, security controls, sizing and IaC before deployment.`,
   owner:'',
   application:'',
   businessUnit:'',
   costCenter:'',
   criticality:'Medium',
   lifecycle:'Development',
   version:'1.0.0',
   tags:{
    ReferenceSource:'Microsoft Azure Architecture Center',
    ReferenceTitle:referenceTitle,
    ReferenceUrl:referenceHref,
    StarterType:'ArchMindCanvas Adapted Reference'
   }
  });
  setSaveState('unsaved');
  setArchitectureToolsOpen(false);
  setArchitectureToolsMenuOpen(false);
  setRightPanel('model');
  setWorkspaceView('editor');
  setTimeout(()=>fitView({padding:.12}),50);
 },[environmentName,setNodes,setEdges,normalizeCanvasLayering,fitView]);

 const saveDesign=useCallback(()=>{
  const document={version:'7.9.0',designId,designName,organizationId,organizationName,projectId,projectName,environmentId,environmentName,nodes,edges,variables:designVariables,locals:designLocals,outputs:architectureOutputs,modules:architectureModules,metadata:architectureMetadata,updatedAt:new Date().toISOString()};
  localStorage.setItem(`${STORAGE_KEY}:${designId}`,JSON.stringify(document));
  const rawIndex=localStorage.getItem(`${STORAGE_KEY}:index`);
  const index=rawIndex?JSON.parse(rawIndex):[];
  const next=[...index.filter((x:any)=>x.designId!==designId),{designId,designName,updatedAt:document.updatedAt}];
  localStorage.setItem(`${STORAGE_KEY}:index`,JSON.stringify(next));
  localStorage.setItem(STORAGE_KEY,JSON.stringify(document));
  setSaveState('saved');
},[designId,designName,organizationId,organizationName,projectId,projectName,environmentId,environmentName,nodes,edges,designVariables,designLocals,architectureOutputs,architectureModules,architectureMetadata]);const loadDesign=()=>{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return alert('No saved design found.');const p=JSON.parse(raw);setDesignId(p.designId||crypto.randomUUID());setOrganizationId(p.organizationId||organizationId);setOrganizationName(p.organizationName||organizationName);setProjectId(p.projectId||projectId);setProjectName(p.projectName||projectName);setEnvironmentId(p.environmentId||environmentId);setEnvironmentName(p.environmentName||environmentName);setNodes(recalcHierarchy(p.nodes||[]));setEdges(p.edges||[]);setDesignName(p.designName||'Loaded Architecture');setDesignVariables(p.variables||[]);setDesignLocals(p.locals||[]);setArchitectureOutputs(p.outputs||[]);setArchitectureModules(p.modules||[]);setArchitectureMetadata(p.metadata||{description:'',owner:'',application:'',businessUnit:'',costCenter:'',criticality:'Medium',lifecycle:'Development',version:'1.0.0',tags:{}});setSaveState('saved');setTimeout(()=>fitView({padding:.18}),0);};const download=(blob:Blob,name:string)=>{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);};const safeFileName=()=>designName.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'archmindcanvas-diagram';
 const getDiagramElement=()=>document.querySelector('.react-flow__viewport') as HTMLElement|null;
 const exportDiagramPng=async()=>{const el=getDiagramElement();if(!el)return alert('Diagram canvas not found.');try{const url=await toPng(el,{backgroundColor:'#ffffff',pixelRatio:2,cacheBust:true});const a=document.createElement('a');a.href=url;a.download=`${safeFileName()}.png`;a.click();setSaveMenuOpen(false);}catch{alert('Unable to export PNG.');}};
 const exportDiagramSvg=async()=>{const el=getDiagramElement();if(!el)return alert('Diagram canvas not found.');try{const url=await toSvg(el,{backgroundColor:'#ffffff',cacheBust:true});const a=document.createElement('a');a.href=url;a.download=`${safeFileName()}.svg`;a.click();setSaveMenuOpen(false);}catch{alert('Unable to export SVG.');}};
 const exportDiagramPdf=async()=>{const el=getDiagramElement();if(!el)return alert('Diagram canvas not found.');try{const url=await toPng(el,{backgroundColor:'#ffffff',pixelRatio:2,cacheBust:true});const img=new window.Image();img.onload=()=>{const landscape=img.width>=img.height;const pdf=new jsPDF({orientation:landscape?'landscape':'portrait',unit:'mm',format:'a4'});const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),margin=10;const scale=Math.min((pageW-margin*2)/img.width,(pageH-margin*2)/img.height);const w=img.width*scale,h=img.height*scale;pdf.addImage(url,'PNG',(pageW-w)/2,(pageH-h)/2,w,h);pdf.save(`${safeFileName()}.pdf`);setSaveMenuOpen(false);};img.src=url;}catch{alert('Unable to export PDF.');}};const exportJson=()=>download(new Blob([JSON.stringify({version:'7.9.0',designId,designName,organizationId,organizationName,projectId,projectName,environmentId,environmentName,nodes,edges,variables:designVariables,locals:designLocals,outputs:architectureOutputs,modules:architectureModules,metadata:architectureMetadata},null,2)],{type:'application/json'}),`${designName.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-design.json`);const importJson=()=>{const i=document.createElement('input');i.type='file';i.accept='.json';i.onchange=async()=>{const f=i.files?.[0];if(!f)return;try{const p=JSON.parse(await f.text());setNodes(recalcHierarchy(p.nodes||[]));setEdges(p.edges||[]);setDesignName(p.designName||'Imported Architecture');setDesignVariables(p.variables||[]);setDesignLocals(p.locals||[]);setArchitectureOutputs(p.outputs||[]);setArchitectureModules(p.modules||[]);setArchitectureMetadata(p.metadata||{description:'',owner:'',application:'',businessUnit:'',costCenter:'',criticality:'Medium',lifecycle:'Development',version:'1.0.0',tags:{}});markChanged();}catch{alert('Invalid JSON file.');}};i.click();};const newDesign=()=>{if(confirm('Start a new blank design?')){setNodes([]);setEdges([]);setDesignId(crypto.randomUUID());setDesignVariables([]);setDesignLocals([]);setArchitectureOutputs([]);setArchitectureModules([]);setArchitectureMetadata({description:'',owner:'',application:'',businessUnit:'',costCenter:'',criticality:'Medium',lifecycle:'Development',version:'1.0.0',tags:{}});setDesignName('Untitled Architecture');markChanged();}};const loadTemplate=()=>{setNodes(structuredClone(starterNodes));setEdges([]);setDesignName('Azure Hierarchy Starter');markChanged();setTimeout(()=>fitView({padding:.12}),0);};
 useEffect(()=>{let previousTool:Tool='select';const down=(e:KeyboardEvent)=>{const target=e.target as HTMLElement;if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT'].includes(target.tagName)&&!e.repeat){e.preventDefault();setTool(current=>{previousTool=current;return 'hand';});}};const up=(e:KeyboardEvent)=>{if(e.code==='Space'){e.preventDefault();setTool(previousTool==='hand'?'select':previousTool);}};window.addEventListener('keydown',down);window.addEventListener('keyup',up);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(['INPUT','TEXTAREA','SELECT'].includes(t.tagName))return;const mod=e.ctrlKey||e.metaKey;if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();saveDesign();}if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();undo();}if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}if(mod&&e.key.toLowerCase()==='c'){e.preventDefault();copySelection();}if(mod&&e.key.toLowerCase()==='v'){e.preventDefault();pasteSelection();}if(e.key==='Delete'||e.key==='Backspace')deleteSelected();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[saveDesign,undo,redo,copySelection,pasteSelection,deleteSelected]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{const tag=(e.target as HTMLElement)?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateSelection();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){e.preventDefault();setNodes(c=>c.map(n=>({...n,selected:true} as CanvasNode)));}if(e.key==='Escape'){setSelectedNodeId(undefined);setSelectedEdgeId(undefined);setContextMenu(null);}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelected();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});

 const resetCanvasToolbarPosition=()=>setCanvasToolbarPos({x:0,y:0});
 const startCanvasToolbarDrag=(e:any)=>{
  e.preventDefault();e.stopPropagation();
  canvasToolbarDragRef.current={startX:e.clientX,startY:e.clientY,originX:canvasToolbarPos.x,originY:canvasToolbarPos.y};
  setCanvasToolbarDragging(true);
  e.currentTarget.setPointerCapture?.(e.pointerId);
 };
 const moveCanvasToolbarDrag=(e:any)=>{
  const drag=canvasToolbarDragRef.current;if(!drag)return;
  const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
  setCanvasToolbarPos({
   x:Math.max(-420,Math.min(420,drag.originX+dx)),
   y:Math.max(-10,Math.min(560,drag.originY+dy))
  });
 };
 const endCanvasToolbarDrag=(e:any)=>{
  canvasToolbarDragRef.current=null;
  setCanvasToolbarDragging(false);
  try{e.currentTarget.releasePointerCapture?.(e.pointerId)}catch{}
 };

 const startRightPaneResize=(e:any)=>{
  if(rightPaneCollapsed)return;
  e.preventDefault();e.stopPropagation();
  rightPaneResizeRef.current={startX:e.clientX,startWidth:rightPaneWidth};
  setRightPaneResizing(true);
  e.currentTarget.setPointerCapture?.(e.pointerId);
 };
 const moveRightPaneResize=(e:any)=>{
  const drag=rightPaneResizeRef.current;if(!drag)return;
  const next=drag.startWidth+(drag.startX-e.clientX);
  setRightPaneWidth(Math.max(320,Math.min(760,next)));
 };
 const endRightPaneResize=(e:any)=>{
  rightPaneResizeRef.current=null;
  setRightPaneResizing(false);
  try{e.currentTarget.releasePointerCapture?.(e.pointerId)}catch{}
 };
 if(workspaceView==='dashboard')return <CommandCenter
  organizationName={organizationName}
  projectName={projectName}
  environmentName={environmentName}
  currentDesignName={designName}
  resourceCount={nodes.filter(n=>n.type!=='drawing').length}
  connectionCount={edges.length}
  score={score}
  onOpenEditor={()=>setWorkspaceView('editor')}
  onCreateArchitecture={()=>{newDesign();setWorkspaceView('editor');}}
  onOpenScopeManager={()=>setScopeManagerOpen(true)}
  onOpenArchitecture={ctx=>{
    setProjectId(ctx.projectId);
    setProjectName(ctx.projectName);
    setEnvironmentId(ctx.environmentId);
    setEnvironmentName(ctx.environmentName);
    setDesignId(ctx.architectureId);
    setDesignName(ctx.architectureName);
    setNodes([]);
    setEdges([]);
    setDesignVariables([]);
    setDesignLocals([]);
    setArchitectureOutputs([]);
    setArchitectureModules([]);
    setArchitectureMetadata({description:'',owner:'',application:'',businessUnit:'',costCenter:'',criticality:'Medium',lifecycle:'Development',version:'1.0.0',tags:{}});
    setSelectedNodeId(undefined);
    setSelectedEdgeId(undefined);
    setSaveState('unsaved');
    setWorkspaceView('editor');
  }}
 />;
  return <div className="app-shell"><header className="topbar"><button className="editor-home-button" onClick={()=>setWorkspaceView('dashboard')} title="Back to Command Center"><LayoutDashboard size={15}/></button><nav className="segmented-context-nav" aria-label="Architecture workspace">
 <button className="segmented-context-item project" onClick={()=>{sessionStorage.setItem('archmind-dashboard-target',`project:${projectId}`);setWorkspaceView('dashboard')}} title={projectName}><FolderKanban size={13}/><span>{projectName}</span></button>
 <b>›</b>
 <button className="segmented-context-item environment" onClick={()=>{sessionStorage.setItem('archmind-dashboard-target',`project:${projectId}`);setWorkspaceView('dashboard')}} title={environmentName}><Layers3 size={13}/><span>{environmentName}</span></button>
 <b>›</b>
 <button className="segmented-context-item architecture current" onClick={()=>setScopeManagerOpen(true)} title={designName}><Network size={13}/><span>{designName}</span></button>
</nav><div className="design-title"><input value={designName} onChange={e=>{setDesignName(e.target.value);markChanged();}}/><div className={`save-status ${saveState}`}><Check size={12}/>{saveState==='saved'?'Saved':'Unsaved'}</div></div><div className="toolbar"><button onClick={undo}><Undo2 size={16}/></button><button onClick={redo}><Redo2 size={16}/></button><button onClick={newDesign}><FilePlus2 size={16}/><span>New</span></button><button onClick={loadTemplate}><LayoutTemplate size={16}/><span>Template</span></button><div className="save-menu-wrap">
<button className="save-main-button" onClick={()=>setSaveMenuOpen(v=>!v)}><Save size={16}/><span>Save</span></button>
{saveMenuOpen&&<div className="save-export-menu save-export-menu-fixed">
<button onClick={()=>{saveDesign();setSaveMenuOpen(false)}}><Save size={15}/><span><b>Save in Browser</b><small>Store editable design locally</small></span></button>
<button onClick={()=>{loadDesign();setSaveMenuOpen(false)}}><FolderOpen size={15}/><span><b>Open Browser Save</b><small>Restore your last browser-saved design</small></span></button>
<button onClick={()=>{exportJson();setSaveMenuOpen(false)}}><Download size={15}/><span><b>Save As JSON</b><small>Download editable architecture file</small></span></button>
<div className="save-menu-divider"/>
<button onClick={()=>{exportDiagramPdf();setSaveMenuOpen(false)}}><FileText size={15}/><span><b>Save as PDF</b><small>Professional document</small></span></button>
<button onClick={()=>{exportDiagramPng();setSaveMenuOpen(false)}}><Image size={15}/><span><b>Save as PNG</b><small>High-resolution image</small></span></button>
<button onClick={()=>{exportDiagramSvg();setSaveMenuOpen(false)}}><Image size={15}/><span><b>Save as SVG</b><small>Scalable vector diagram</small></span></button>
</div>}
</div><button onClick={autoArrange}><Route size={16}/><span>Auto Arrange</span></button><button onClick={()=>setRightPanel('validation')}><ShieldCheck size={16}/><span>Validate</span></button><button onClick={()=>setRightPanel('iac')}><Code2 size={16}/><span>IaC</span></button><button onClick={()=>setRightPanel('cost')}><DollarSign size={16}/><span>Cost</span></button><button onClick={()=>setRightPanel('import')}><Code2 size={16}/><span>Import IaC</span></button><button className="design-variable-button" onClick={()=>setDesignVariablesOpen(true)} title="Organization Variables & Locals"><Variable size={16}/><span>Org Vars</span></button><button onClick={()=>setRightPanel('deploy')}><Rocket size={16}/><span>Deploy</span></button></div></header>
 {designVariablesOpen&&<div className="design-vars-overlay" onMouseDown={()=>setDesignVariablesOpen(false)}>
  <div className="design-vars-dialog" onMouseDown={e=>e.stopPropagation()}>
    <div className="design-vars-dialog-head">
      <div>
        <strong>Organization Variables & Locals</strong>
        <small>Inherited by all projects, environments and architectures in this organization</small>
      </div>
      <button onClick={()=>setDesignVariablesOpen(false)} aria-label="Close">×</button>
    </div>
    <div className="design-vars-scope">
      <Variable size={14}/>
      <span>Organization variables are inherited by every lower scope unless overridden.</span>
    </div>
    <VariablesManager variables={declaredVariables} locals={declaredLocals} onVariablesChange={v=>{setDeclaredVariables(v);markChanged();}} onLocalsChange={v=>{setDeclaredLocals(v);markChanged();}}/>
  </div>
</div>}{scopeManagerOpen&&<WorkspaceScopeManager
 organization={{id:organizationId,name:organizationName}}
 project={{id:projectId,name:projectName}}
 environment={{id:environmentId,name:environmentName}}
 architecture={{id:designId,name:designName}}
 onGoOrganization={()=>{setScopeManagerOpen(false);sessionStorage.setItem('archmind-dashboard-target','home');setWorkspaceView('dashboard')}}
 onGoProject={()=>{setScopeManagerOpen(false);sessionStorage.setItem('archmind-dashboard-target',`project:${projectId}`);setWorkspaceView('dashboard')}}
 onGoEnvironment={()=>{setScopeManagerOpen(false);sessionStorage.setItem('archmind-dashboard-target',`project:${projectId}`);setWorkspaceView('dashboard')}}
 onGoArchitecture={()=>setScopeManagerOpen(false)}
 onOpenGlobalVariables={()=>{setScopeManagerOpen(false);setDesignVariablesOpen(true)}}
 onOpenArchitectureVariables={()=>{setScopeManagerOpen(false);setRightPanel('variables')}}
 onClose={()=>setScopeManagerOpen(false)}
/>}<main className={`workspace workspace-simple ${leftPaneCollapsed?'left-pane-collapsed':''} ${rightPaneCollapsed?'right-pane-collapsed':''} ${rightPaneResizing?'right-pane-resizing':''}`} style={{'--inspector-width':`${rightPaneWidth}px`} as React.CSSProperties}>
<aside className="editor-left-rail">
  <button className="pane-collapse-control left" onClick={()=>setLeftPaneCollapsed(v=>!v)} title={leftPaneCollapsed?'Expand left pane':'Collapse left pane'}>
    {leftPaneCollapsed?<ChevronRight size={17}/>:<ChevronLeft size={17}/>}
    <span>{leftPaneCollapsed?'Open':'Hide'}</span>
  </button>
  <button className={libraryOpen?'active':''} onClick={()=>{setLibraryOpen(v=>!v);setArchitectureToolsMenuOpen(false);setArchitectureToolsOpen(false)}} title="Resources">
    <Boxes size={18}/>
    <span>Resources</span>
  </button>

  <div className="left-rail-tool-wrap">
    <button
      className={architectureToolsOpen||architectureToolsMenuOpen?'active':''}
      onClick={()=>{setArchitectureToolsMenuOpen(v=>!v);setLibraryOpen(false)}}
      title="Architecture Guidance"
    >
      <BookOpenText size={18}/>
      <span>Architecture</span>
      <small>Guidance</small>
    </button>

    {architectureToolsMenuOpen&&!leftPaneCollapsed&&<div className="architecture-tools-flyout" onMouseDown={e=>e.stopPropagation()}>
      <div className="architecture-tools-flyout-head">
        <strong>Architecture Guidance</strong>
        <small>Guidance, references and reviews</small>
      </div>
      <div className="architecture-tools-group-label">MICROSOFT</div>
      <button onClick={()=>{setArchitectureToolsSection('library');setArchitectureToolsOpen(true);setArchitectureToolsMenuOpen(false)}}>
        <Boxes size={15}/><span><strong>Microsoft Architecture Library</strong><small>Azure patterns, guides and solution ideas</small></span><ChevronRight size={14}/>
      </button>
      <button onClick={()=>{setArchitectureToolsSection('waf');setArchitectureToolsOpen(true);setArchitectureToolsMenuOpen(false)}}>
        <ShieldCheck size={15}/><span><strong>Well-Architected Framework</strong><small>Reliability, Security, Cost, Operations, Performance</small></span><ChevronRight size={14}/>
      </button>
      <button onClick={()=>{setArchitectureToolsSection('references');setArchitectureToolsOpen(true);setArchitectureToolsMenuOpen(false)}}>
        <LayoutDashboard size={15}/><span><strong>Reference Architectures</strong><small>Microsoft reference designs by workload</small></span><ChevronRight size={14}/>
      </button>

      <div className="architecture-tools-group-label">ARCHMINDCANVAS</div>
      <button onClick={()=>{setArchitectureToolsMenuOpen(false);sessionStorage.setItem('archmind-dashboard-target','home');setWorkspaceView('dashboard')}}>
        <LayoutTemplate size={15}/><span><strong>Architecture Templates</strong><small>Reusable ArchMindCanvas starters</small></span><ChevronRight size={14}/>
      </button>
      <button onClick={()=>{setArchitectureToolsMenuOpen(false);setRightPanel('validation')}}>
        <CheckCircle2 size={15}/><span><strong>Architecture Review</strong><small>Review the current design</small></span><ChevronRight size={14}/>
      </button>
      <button onClick={()=>{setArchitectureToolsMenuOpen(false);setRightPanel('validation')}}>
        <ShieldCheck size={15}/><span><strong>Best Practice Validation</strong><small>Check design risks and recommendations</small></span><ChevronRight size={14}/>
      </button>
    </div>}
  </div>
</aside>
{libraryOpen&&!leftPaneCollapsed&&<div className="resource-library-drawer"><div className="resource-library-drawer-head"><strong>Resources</strong><button onClick={()=>setLibraryOpen(false)}>×</button></div><Sidebar onAddResource={t=>createResource(t as ResourceType)}/></div>}
{architectureToolsOpen&&!leftPaneCollapsed&&<ArchitectureToolsDrawer
  section={architectureToolsSection}
  onSectionChange={setArchitectureToolsSection}
  onClose={()=>setArchitectureToolsOpen(false)}
  onOpenValidation={()=>{setArchitectureToolsOpen(false);setRightPanel('validation')}}
  onUseStarter={useReferenceStarter}
/>}
<div className="canvas-wrapper" onDrop={onDrop} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='move';}}><div className="drawing-toolbar draggable-canvas-toolbar" style={{transform:`translate(${canvasToolbarPos.x}px, ${canvasToolbarPos.y}px)`}}>
 <button
  className={`canvas-toolbar-drag-handle ${canvasToolbarDragging?'dragging':''}`}
  title="Drag toolbar · Double-click to reset"
  onPointerDown={startCanvasToolbarDrag}
  onPointerMove={moveCanvasToolbarDrag}
  onPointerUp={endCanvasToolbarDrag}
  onPointerCancel={endCanvasToolbarDrag}
  onDoubleClick={resetCanvasToolbarPosition}
 >
  <GripVertical size={16}/>
 </button><button className={tool==='select'?'active':''} onClick={()=>setTool('select')} title="Cursor / Select"><MousePointer2 size={16}/></button><button className={tool==='hand'?'active':''} onClick={()=>{setTool('hand');setSelectedNodeId(undefined);setSelectedEdgeId(undefined);}} title="Hand / Pan canvas"><Hand size={16}/></button><span/><select className="connector-style-select" value={connectorStyle} onChange={e=>applyConnectorStyle(e.target.value as ConnectorStyle)} title={selectedEdgeId?'Change selected connection style':'Style for new connections'}><option value="straight">Straight</option><option value="smoothstep">Elbow / routed</option><option value="bezier">Curved</option><option value="dotted">Dotted</option><option value="dashed">Dashed</option></select><select className="connector-arrow-select" value={connectorArrowStyle} onChange={e=>applyConnectorArrow(e.target.value as ArrowStyle)} title={selectedEdgeId?'Change arrow on selected connection':'Arrow for new connections'}><option value="none">No Arrow</option><option value="end">End Arrow →</option><option value="start">← Start Arrow</option><option value="both">↔ Both Arrows</option></select><span/><button className={tool==='rectangle'?'active':''} onClick={()=>setTool('rectangle')}><Square size={16}/></button><button className={tool==='triangle'?'active':''} onClick={()=>setTool('triangle')}><Triangle size={16}/></button><button className={tool==='text'?'active':''} onClick={()=>setTool('text')}><Type size={16}/></button></div>
 <ReactFlow nodes={nodes.map(n=>({...n,draggable:!lockedIds.has(n.id)}))} edges={edges.map(e=>({...e,markerEnd:(e.data?.arrowStyle==='none'||e.data?.arrowStyle==='start')?undefined:{type:MarkerType.ArrowClosed},markerStart:(e.data?.arrowStyle==='start'||e.data?.arrowStyle==='both')?{type:MarkerType.ArrowClosed}:undefined}))} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChangeLayered} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_,n)=>{if(tool==='hand')return;setSelectedNodeId(n.id);setSelectedEdgeId(undefined);setRightPanel('properties');}} onEdgeClick={(_,e)=>{if(tool==='hand')return;setSelectedEdgeId(e.id);setSelectedNodeId(undefined);setRightPanel('properties');}} onNodeContextMenu={(e,n)=>{e.preventDefault();e.stopPropagation();setNodes(c=>c.map(x=>({...x,selected:x.id===n.id} as CanvasNode)));setSelectedNodeId(n.id);setSelectedEdgeId(undefined);setRightPanel('properties');setContextMenu({x:Math.min(e.clientX,window.innerWidth-220),y:Math.min(e.clientY,window.innerHeight-360),nodeId:n.id});}} onPaneClick={(e)=>{setContextMenu(null);setLayoutMenuOpen(false);setEditMenuOpen(false);onPaneClick(e)}} fitView snapToGrid snapGrid={[16,16]} selectionOnDrag={tool==='select'} elementsSelectable={tool!=='hand'} nodesDraggable={tool!=='hand'} nodesConnectable={tool!=='hand'} panOnDrag={tool==='hand'} className={tool==='hand'?'hand-mode':'cursor-mode'} multiSelectionKeyCode="Shift" deleteKeyCode={null} defaultEdgeOptions={{type:'styled',data:{connectorStyle,arrowStyle:connectorArrowStyle}}}><Background variant={BackgroundVariant.Dots} gap={20} size={1.2}/><Controls position="bottom-left"/><MiniMap pannable zoomable position="bottom-right"/><div className="canvas-action"><button onClick={()=>fitView({padding:.12})}><Maximize2 size={15}/> Fit</button><div className="edit-menu-wrap"><button onClick={()=>{setEditMenuOpen(v=>!v);setLayoutMenuOpen(false)}} title="Edit options">Edit ▾</button>{editMenuOpen&&<div className="edit-dropdown" onMouseDown={e=>e.stopPropagation()}><button onClick={()=>{copySelection();setEditMenuOpen(false)}}><Copy size={14}/> Copy</button><button onClick={()=>{pasteSelection();setEditMenuOpen(false)}}><Clipboard size={14}/> Paste</button><button onClick={()=>{duplicateSelection();setEditMenuOpen(false)}}>Duplicate</button><hr/><button className="danger" onClick={()=>{deleteSelected();setEditMenuOpen(false)}}><Trash2 size={14}/> Delete</button></div>}</div><div className="layout-menu-wrap"><button onClick={()=>{setLayoutMenuOpen(v=>!v);setEditMenuOpen(false)}} title="Layout options">Layout ▾</button>{layoutMenuOpen&&<div className="layout-dropdown" onMouseDown={e=>e.stopPropagation()}><div className="layout-dropdown-title">Align</div><button onClick={()=>{alignSelected('left');setLayoutMenuOpen(false)}}>Align Left</button><button onClick={()=>{alignSelected('center');setLayoutMenuOpen(false)}}>Align Center</button><button onClick={()=>{alignSelected('right');setLayoutMenuOpen(false)}}>Align Right</button><button onClick={()=>{alignSelected('top');setLayoutMenuOpen(false)}}>Align Top</button><button onClick={()=>{alignSelected('middle');setLayoutMenuOpen(false)}}>Align Middle</button><button onClick={()=>{alignSelected('bottom');setLayoutMenuOpen(false)}}>Align Bottom</button><hr/><div className="layout-dropdown-title">Distribute</div><button onClick={()=>{distributeSelected('horizontal');setLayoutMenuOpen(false)}}>Distribute Horizontally</button><button onClick={()=>{distributeSelected('vertical');setLayoutMenuOpen(false)}}>Distribute Vertically</button><hr/><button className="layout-tidy" onClick={()=>{autoTidy();setLayoutMenuOpen(false)}}>Auto Tidy</button></div>}</div>{selectedNodeId&&<><button onClick={bringForward} title="Bring Forward"><BringToFront size={15}/> Forward</button><button onClick={sendBackward} title="Send Backward"><SendToBack size={15}/> Backward</button><button onClick={()=>lockedIds.has(selectedNodeId)?unlockSelection():lockSelection()} title={lockedIds.has(selectedNodeId)?'Unlock':'Lock'}>{lockedIds.has(selectedNodeId)?<Unlock size={15}/>:<Lock size={15}/>} {lockedIds.has(selectedNodeId)?'Unlock':'Lock'}</button></>}</div></ReactFlow></div>
 <div className="archmind-ai-float">
  {archMindOpen&&<div className="archmind-ai-popup">
    <div className="archmind-ai-popup-head">
      <div className="archmind-ai-avatar"><div className="archmind-robot-head" aria-hidden="true">
      <span className="archmind-robot-antenna"><i/></span>
      <span className="archmind-robot-ear left"/>
      <span className="archmind-robot-ear right"/>
      <span className="archmind-robot-face">
        <i className="archmind-robot-eye left"/>
        <i className="archmind-robot-eye right"/>
        <i className="archmind-robot-mouth"/>
      </span>
    </div></div>
      <div><strong>archmind</strong><small>Architecture assistant · {designName}</small></div>
      <button onClick={()=>setArchMindOpen(false)} aria-label="Close">×</button>
    </div>
    <div className="archmind-ai-answer"><Sparkles size={14}/><p>{archMindAnswer}</p></div>
    <div className="archmind-ai-quick">
      <button onClick={()=>setArchMindQuestion('Review the security of this architecture')}>Security review</button>
      <button onClick={()=>setArchMindQuestion('How can I optimize cost?')}>Cost</button>
      <button onClick={()=>setArchMindQuestion('Review against Azure Well Architected Framework')}>Azure WAF</button>
    </div>
    <div className="archmind-ai-input">
      <textarea rows={2} value={archMindQuestion} onChange={e=>setArchMindQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();askArchMind();}}} placeholder="Ask about this architecture..."/>
      <button onClick={askArchMind}>Ask</button>
    </div>
    <div className="archmind-ai-popup-foot">
      <button onClick={()=>{buildAiArchitecture();setArchMindOpen(false)}}><Sparkles size={13}/> Generate sample architecture</button>
      <span>Design-aware MVP assistant</span>
    </div>
  </div>}
  <button className={`archmind-ai-orb ${archMindOpen?'active':''}`} onClick={()=>setArchMindOpen(v=>!v)} title="Ask archmind">
    <div className="archmind-robot-head" aria-hidden="true">
      <span className="archmind-robot-antenna"><i/></span>
      <span className="archmind-robot-ear left"/>
      <span className="archmind-robot-ear right"/>
      <span className="archmind-robot-face">
        <i className="archmind-robot-eye left"/>
        <i className="archmind-robot-eye right"/>
        <i className="archmind-robot-mouth"/>
      </span>
    </div>
    <span className="archmind-ai-name">archmind</span>
    <span className="ai-orb-pulse"/>
  </button>
 </div>
 {contextMenu&&<div className="node-context-menu" style={{left:contextMenu.x,top:contextMenu.y}} onMouseDown={e=>e.stopPropagation()}><button onClick={duplicateSelection}>Duplicate <kbd>Ctrl+D</kbd></button><button onClick={copySelection}>Copy <kbd>Ctrl+C</kbd></button><button onClick={pasteSelection}>Paste <kbd>Ctrl+V</kbd></button><hr/><button onClick={lockSelection}>Lock</button><button onClick={unlockSelection}>Unlock</button><hr/><button onClick={bringForward}>Bring Forward</button><button onClick={sendBackward}>Send Backward</button><hr/><button onClick={groupSelection}>Group</button><button onClick={ungroupSelection}>Ungroup</button><hr/><button className="danger" onClick={deleteSelected}>Delete <kbd>Del</kbd></button></div>}<div className="inspector-shell">
 <div
  className="inspector-resize-handle"
  title="Drag to resize panel"
  onPointerDown={startRightPaneResize}
  onPointerMove={moveRightPaneResize}
  onPointerUp={endRightPaneResize}
  onPointerCancel={endRightPaneResize}
 />
<button className="pane-collapse-control right" onClick={()=>setRightPaneCollapsed(v=>!v)} title={rightPaneCollapsed?'Expand right pane':'Collapse right pane'}>{rightPaneCollapsed?<ChevronLeft size={17}/>:<ChevronRight size={17}/>}</button><div className="inspector-tabs v5-tabs"><button className={rightPanel==='properties'?'active':''} onClick={()=>setRightPanel('properties')}>Properties</button><button className={rightPanel==='model'?'active':''} onClick={()=>setRightPanel('model')}>Model</button><button className={rightPanel==='variables'?'active':''} onClick={()=>setRightPanel('variables')}>Variables</button><button className={rightPanel==='validation'?'active':''} onClick={()=>setRightPanel('validation')}>Validate <span>{findings.filter(f=>f.severity==='warning'||f.severity==='critical').length}</span></button><button className={rightPanel==='iac'?'active':''} onClick={()=>setRightPanel('iac')}>IaC</button><button className={rightPanel==='deploy'?'active':''} onClick={()=>setRightPanel('deploy')}>Deploy</button></div>{rightPanel==='model'?<ArchitectureModelPanel metadata={architectureMetadata} outputs={architectureOutputs} modules={architectureModules} variables={effectiveVariables} locals={effectiveLocals} resources={architectureNodes} onMetadataChange={m=>{setArchitectureMetadata(m);markChanged();}} onOutputsChange={v=>{setArchitectureOutputs(v);markChanged();}} onModulesChange={v=>{setArchitectureModules(v);markChanged();}}/>:rightPanel==='variables'?<div className="design-scope-variable-panel"><div className="design-scope-banner"><strong>Current Design</strong><span>{designName}</span><small>Variables declared here are available only inside this design.</small></div><VariablesManager variables={designVariables} locals={designLocals} onVariablesChange={v=>{setDesignVariables(v);markChanged();}} onLocalsChange={v=>{setDesignLocals(v);markChanged();}}/></div>:rightPanel==='deploy'?<div className="deploy-studio"><div className="panel-title">Deploy to Azure</div><p>Generate IaC, validate it, then hand off deployment to a CI/CD pipeline. Credentials stay outside the browser.</p><div className="deploy-status-card"><div><strong>{statusLabel[deploymentStatus]}</strong><span>{deploymentMessage}</span></div><span className={`deploy-status-dot ${deploymentStatus}`}/></div><div className="form-stack"><label>Source control<select value={deployProvider} onChange={e=>setDeployProvider(e.target.value as 'azuredevops'|'github')}><option value="azuredevops">Azure DevOps</option><option value="github">GitHub</option></select></label><label>IaC engine<select value={deployIacType} onChange={e=>setDeployIacType(e.target.value as 'terraform'|'bicep')}><option value="terraform">Terraform</option><option value="bicep">Bicep</option></select></label><label>Environment<select value={deployEnvironment} onChange={e=>setDeployEnvironment(e.target.value as 'dev'|'test'|'prod')}><option value="dev">Development</option><option value="test">Test</option><option value="prod">Production</option></select></label>{deployProvider==='azuredevops'?<><label>Azure DevOps organization<input value={adoOrganization} onChange={e=>setAdoOrganization(e.target.value)} placeholder="contoso"/></label><label>Project<input value={adoProject} onChange={e=>setAdoProject(e.target.value)} placeholder="CloudPlatform"/></label><label>Repository<input value={adoRepository} onChange={e=>setAdoRepository(e.target.value)} placeholder="archmind-infrastructure"/></label><label>Branch<input value={adoBranch} onChange={e=>setAdoBranch(e.target.value)} placeholder="main"/></label><label>Pipeline ID<input value={adoPipelineId} onChange={e=>setAdoPipelineId(e.target.value)} placeholder="12"/></label></>:<><label>GitHub repository<input value={repoName} onChange={e=>setRepoName(e.target.value)} placeholder="org/repository"/></label><label>Branch<input value={repoBranch} onChange={e=>setRepoBranch(e.target.value)} placeholder="main"/></label></>}</div><div className="deploy-actions"><button onClick={validateDeployment}><CheckCircle2 size={15}/> Validate</button><button onClick={startPlan}><Play size={15}/> {deployIacType==='terraform'?'Plan':'What-if'}</button><button className="primary-button" onClick={approveAndDeploy}><Rocket size={15}/> Approve & Deploy</button></div><div className="deploy-note"><ServerCog size={16}/><span>This UI is wired as a safe deployment workflow scaffold. For real deployment, point it to the included Azure Function API and CI/CD pipeline templates.</span></div></div>:rightPanel==='iac'?<div className="iac-panel"><div className="panel-title">Infrastructure as Code</div><div className={`deployment-readiness-banner ${deploymentReadiness.ready?'ready':'blocked'}`}>
      <div>
        <strong>{deploymentReadiness.ready?'Ready for Terraform validation':'Deployment blockers detected'}</strong>
        <span>{deploymentReadiness.ready?`${deploymentReadiness.resourceCount} modeled resources passed structural readiness checks.`:`${deploymentReadiness.critical.length} critical blocker(s) and ${deploymentReadiness.warnings.length} warning(s).`}</span>
      </div>
      <button onClick={()=>setRightPanel('validation')}>Review</button>
    </div><div className="iac-toggle"><button className={iacMode==='terraform'?'active':''} onClick={()=>setIacMode('terraform')}>Terraform</button><button className={iacMode==='bicep'?'active':''} onClick={()=>setIacMode('bicep')}>Bicep</button></div><pre>{iacCode}</pre><div className="iac-actions"><button onClick={copyIac}>Copy code</button><button onClick={downloadIac}>Download {iacMode==='terraform'?'main.tf':'main.bicep'}</button><button className="primary-button" onClick={downloadIacBundle}>Download IaC Bundle</button></div><div className="terraform-backend-panel">
  <div className="terraform-backend-title">
    <div><strong>Terraform Backend</strong><small>Choose where Terraform state is stored.</small></div>
    <span className={`backend-status ${terraformBackendReady?'ready':'warning'}`}>{terraformBackendReady?'Ready':'Incomplete'}</span>
  </div>
  <div className="terraform-backend-mode">
    <button className={terraformBackendMode==='local'?'active':''} onClick={()=>setTerraformBackendMode('local')}>
      <strong>Local State</strong><small>Development and testing</small>
    </button>
    <button className={terraformBackendMode==='azurerm'?'active':''} onClick={()=>setTerraformBackendMode('azurerm')}>
      <strong>Azure Storage</strong><small>Shared / production state</small>
    </button>
  </div>
  {terraformBackendMode==='local'?<div className="terraform-backend-note">
    State will be stored locally as <code>terraform.tfstate</code>.
  </div>:<div className="terraform-backend-fields">
    <label>State Resource Group<input value={tfBackendResourceGroup} onChange={e=>setTfBackendResourceGroup(e.target.value)} placeholder="rg-terraform-state"/></label>
    <label>Storage Account<input value={tfBackendStorageAccount} onChange={e=>setTfBackendStorageAccount(e.target.value)} placeholder="archmindtfstate"/></label>
    <label>Blob Container<input value={tfBackendContainer} onChange={e=>setTfBackendContainer(e.target.value)} placeholder="tfstate"/></label>
    <label>State Key<input value={tfBackendKey} onChange={e=>setTfBackendKey(e.target.value)} placeholder="architecture.tfstate"/></label>
    <div className="terraform-backend-note">The Azure Storage account and blob container must already exist before <code>terraform init</code>. No credentials or storage keys are stored in the bundle.</div>
  </div>}
  <div className="terraform-backend-preview">
    <div><strong>backend.tf</strong><button onClick={()=>navigator.clipboard?.writeText(terraformBackendCode)}>Copy</button></div>
    <pre>{terraformBackendCode}</pre>
  </div>
</div><div className="repo-panel"><strong>Source Control</strong><label>Provider<select value={repoProvider} onChange={e=>setRepoProvider(e.target.value as 'github'|'azuredevops')}><option value="github">GitHub / GitHub Enterprise</option><option value="azuredevops">Azure DevOps Repos</option></select></label><label>Repository<input value={repoName} onChange={e=>setRepoName(e.target.value)} placeholder="organization/infrastructure-repo"/></label><label>Branch<input value={repoBranch} onChange={e=>setRepoBranch(e.target.value)}/></label><label>Target folder<input value={repoFolder} onChange={e=>setRepoFolder(e.target.value)}/></label><label>Commit message<input value={commitMessage} onChange={e=>setCommitMessage(e.target.value)}/></label><button className="primary-button" onClick={prepareRepoPush}>Prepare Repository Push</button><small>Secure direct push requires a backend GitHub App/OAuth or Azure DevOps OAuth connection. Tokens are never stored in this browser app.</small></div><div className="ai-note"><strong>Generator status</strong><span>v5.3 generates deployable starter Terraform for Resource Groups and VNets and preserves all remaining diagram resources as reviewed TODO mappings. Expand resource mappings before production deployment.</span></div></div>:rightPanel==='import'?<div className="import-iac-panel"><div className="panel-title">IaC → Diagram</div><div className="iac-toggle"><button className={iacImportType==='terraform'?'active':''} onClick={()=>setIacImportType('terraform')}>Terraform</button><button className={iacImportType==='bicep'?'active':''} onClick={()=>setIacImportType('bicep')}>Bicep</button><button className={iacImportType==='json'?'active':''} onClick={()=>setIacImportType('json')}>JSON</button></div><button className="primary-button" onClick={uploadIacFile}>Upload .tf / .bicep / .json file</button><textarea value={iacImportCode} onChange={e=>setIacImportCode(e.target.value)} placeholder={iacImportType==='terraform'?'Paste Terraform azurerm code here...':iacImportType==='bicep'?'Paste Bicep code here...':'Paste ArchMindCanvas JSON here...'}></textarea><button className="primary-button" onClick={importIacToDiagram}>Generate Diagram from Code</button><div className="ai-note"><strong>Reverse engineering</strong><span>v5.7.3 supports unified JSON, Terraform and Bicep import with collision-free hierarchical layout and rebuilds Azure hierarchy from common Terraform azurerm references and Bicep resource declarations, creates editable ArchMindCanvas nodes, infers basic reference relationships, and auto-fits the generated diagram. Complex Terraform modules, dynamic blocks, remote state and deeply nested Bicep modules require a future backend parser for complete fidelity.</span></div></div>:rightPanel==='cost'?<div className="cost-panel">
  <div className="panel-title">Cost Intelligence</div>
  <div className="cost-controls">
    <label>Currency<select value={costCurrency} onChange={e=>{setCostCurrency(e.target.value as 'USD'|'EUR'|'INR'|'GBP');setPricingStatus('idle');setLivePrices({});}}><option>USD</option><option>EUR</option><option>INR</option><option>GBP</option></select></label>
    {azureCostCount>0&&<button className="primary-button" onClick={refreshLivePricing} disabled={pricingStatus==='loading'}>{pricingStatus==='loading'?'Loading Azure prices...':'Refresh Azure Live Prices'}</button>}
    <small className="pricing-status">
      {azureCostCount>0?(pricingStatus==='live'?'Live Azure retail prices loaded':pricingStatus==='partial'?'Partial Azure live pricing loaded; other Azure resources use baseline estimates':pricingStatus==='error'?'Azure live pricing unavailable; showing baseline estimates':'Azure baseline estimates shown until live prices are refreshed'):'No Azure resources in this design.'}
      {awsCostCount>0?' AWS resources use provider-specific architecture estimates in this static frontend.':''}
    </small>
  </div>

  <div className="cost-hero"><span>Estimated monthly cost</span><strong>{money(monthlyCost)}</strong><small>Estimated annual cost: {money(monthlyCost*12)}</small></div>

  <div className="cost-provider-summary">
    {azureCostCount>0&&<div className="cost-provider-card"><span>Microsoft Azure</span><strong>{money(azureMonthlyCost)}</strong><small>{azureCostCount} priced resource{azureCostCount===1?'':'s'}</small></div>}
    {awsCostCount>0&&<div className="cost-provider-card aws"><span>Amazon Web Services</span><strong>{money(awsMonthlyCost)}</strong><small>{awsCostCount} estimated resource{awsCostCount===1?'':'s'}</small></div>}
  </div>

  <div className="cost-section"><strong>Cost by provider & category</strong>{Object.entries(costBreakdown).sort((a,b)=>b[1]-a[1]).map(([k,v])=><div className="cost-row" key={k}><span>{k}</span><b>{money(v)}</b></div>)}</div>

  <div className="cost-section"><strong>Resources</strong>{costItems.length?costItems.map(x=><div className="cost-resource" key={x.id}><div><b>{x.name}</b><small>{x.provider==='aws'?'AWS':'Azure'} · {x.category}</small></div><span>{x.monthly?money(x.monthly):'No separate charge'} <small>· {x.source}</small></span></div>):<small>Add Azure or AWS resources to see an estimate.</small>}</div>

  <div className="ai-note"><strong>Estimate only</strong><span>Azure can continue using Microsoft’s public Retail Prices API when refreshed. AWS estimates are calculated from the architecture properties configured on each AWS resource. The official AWS Price List GetProducts API uses authenticated requests, so a future backend integration can replace these AWS estimates with live SKU-level pricing without exposing credentials in the browser.</span></div>
 </div>:rightPanel==='validation'?<ValidationPanel findings={findings} score={score} onSelectNode={id=>{setSelectedNodeId(id);setRightPanel('properties');}}/>:isArchitecture?<PropertiesPanel nodeId={(selectedNode as ArchitectureNode).id} data={(selectedNode as ArchitectureNode).data} allResources={architectureNodes} declaredVariables={effectiveVariables} declaredLocals={effectiveLocals} parentId={(selectedNode as ArchitectureNode).parentId} hierarchy={hierarchyData} onParentChange={changeParent} onChange={updateArchitecture} onDelete={deleteSelected} onDuplicate={duplicateSelected}/>:isDrawing?<div className="properties-panel"><div className="panel-title">Drawing object</div><div className="form-stack"><label>Text / label<input value={(selectedNode as DrawingNode).data.label} onChange={e=>updateDrawing({label:e.target.value})}/></label><button className="danger-button" onClick={deleteSelected}>Delete object</button></div></div>:selectedEdge?<div className="properties-panel"><div className="panel-title">Connection</div><div className="form-stack"><label>Line style<select value={selectedEdge.data?.connectorStyle||'smoothstep'} onChange={e=>updateEdge({connectorStyle:e.target.value as ConnectorStyle})}><option value="straight">Straight</option><option value="smoothstep">Elbow / routed</option><option value="bezier">Curved</option><option value="dotted">Dotted</option><option value="dashed">Dashed</option></select></label><label>Arrow direction<select value={selectedEdge.data?.arrowStyle||'end'} onChange={e=>updateEdge({arrowStyle:e.target.value as any})}><option value="none">No arrow</option><option value="end">Forward →</option><option value="start">Backward ←</option><option value="both">Both ↔</option></select></label><label>Line thickness<select value={selectedEdge.data?.strokeWidth||2} onChange={e=>updateEdge({strokeWidth:Number(e.target.value)})}><option value="1">1 px</option><option value="2">2 px</option><option value="3">3 px</option><option value="4">4 px</option><option value="6">6 px</option></select></label><button type="button" onClick={()=>updateEdge({routePoints:[],routeX:undefined,routeY:undefined,labelX:undefined,labelY:undefined})}>Reset auto-route</button><small>Tip: Select a connection and double-click the line to add bend points. Drag points to route the line; double-click a point to remove it. Drag the label to reposition it.</small><label>Label<input value={selectedEdge.data?.label||''} onChange={e=>updateEdge({label:e.target.value})}/></label><label>Connection type<select value={selectedEdge.data?.connectionType||''} onChange={e=>updateEdge({connectionType:e.target.value})}><option value="">General</option><option>HTTPS</option><option>Private Link</option><option>VNet Peering</option><option>VPN</option><option>ExpressRoute</option><option>Dependency</option><option>Data Flow</option></select></label><label>Protocol<input value={selectedEdge.data?.protocol||''} onChange={e=>updateEdge({protocol:e.target.value})} placeholder="TCP / UDP / HTTPS"/></label><label>Port<input value={selectedEdge.data?.port||''} onChange={e=>updateEdge({port:e.target.value})} placeholder="443"/></label><button className="danger-button" onClick={deleteSelected}>Delete connection</button></div></div>:<div className="empty-properties"><div className="empty-icon">✦</div><strong>Select an object or connection</strong><span>Edit hierarchy, Azure properties, tags and connection metadata here.</span></div>}</div></main></div>;
}
export default function App(){return <ReactFlowProvider><Designer/></ReactFlowProvider>}