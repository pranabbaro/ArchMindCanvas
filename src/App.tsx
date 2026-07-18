import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  addEdge, Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow, type Connection, type EdgeChange, type NodeChange,
} from '@xyflow/react';
import {
  Check, Clipboard, Copy, Download, FilePlus2, FolderOpen, Maximize2, Redo2, Save, ShieldCheck,
  Sparkles, Undo2, UploadCloud, MousePointer2, Route, Square, Triangle, Type, Trash2
} from 'lucide-react';
import ArchitectureNodeComponent from './components/ArchitectureNode';
import ContainerNode from './components/ContainerNode';
import DrawingNodeComponent from './components/DrawingNode';
import StyledEdge from './components/StyledEdge';
import PropertiesPanel from './components/PropertiesPanel';
import Sidebar from './components/Sidebar';
import ValidationPanel from './components/ValidationPanel';
import { resourceMap } from './resourceCatalog';
import type { ArchitectureNode, CanvasEdge, CanvasNode, ConnectorStyle, DrawingNode, ResourceType, ValidationFinding } from './types';

const STORAGE_KEY = 'archmindcanvas-v4-1';
const makeData = (type: ResourceType, label?: string): ArchitectureNode['data'] => ({
  label: label || resourceMap[type].label, resourceType: type, description: resourceMap[type].description,
  region: 'Central India', sku: resourceMap[type].sku, environment: 'Production', owner: '',
});
const containerStyle = (type: ResourceType) => type === 'virtualNetwork' ? { width: 820, height: 500 } : { width: 360, height: 300 };

const starterNodes: CanvasNode[] = [
  { id:'vnet', type:'container', position:{x:100,y:80}, style:containerStyle('virtualNetwork'), data:makeData('virtualNetwork','Production VNet') },
  { id:'subnet-app', type:'container', parentId:'vnet', extent:'parent', position:{x:35,y:90}, style:containerStyle('subnet'), data:makeData('subnet','Application Subnet') },
  { id:'subnet-data', type:'container', parentId:'vnet', extent:'parent', position:{x:420,y:90}, style:containerStyle('subnet'), data:makeData('subnet','Data Subnet') },
  { id:'app', type:'architecture', parentId:'subnet-app', extent:'parent', position:{x:70,y:105}, data:makeData('appService','Customer Portal') },
  { id:'kv', type:'architecture', parentId:'subnet-app', extent:'parent', position:{x:70,y:200}, data:makeData('keyVault','App Key Vault') },
  { id:'db', type:'architecture', parentId:'subnet-data', extent:'parent', position:{x:70,y:130}, data:makeData('sqlDatabase','Application DB') },
];
const starterEdges: CanvasEdge[] = [
  { id:'e1', source:'app', target:'db', type:'styled', markerEnd:{type:MarkerType.ArrowClosed}, data:{connectorStyle:'smoothstep',label:'Private Link'} },
  { id:'e2', source:'app', target:'kv', type:'styled', markerEnd:{type:MarkerType.ArrowClosed}, data:{connectorStyle:'dotted',label:'Secrets'} },
];

type Snapshot = { nodes: CanvasNode[]; edges: CanvasEdge[] };
const cloneSnapshot = (nodes: CanvasNode[], edges: CanvasEdge[]): Snapshot => ({ nodes:structuredClone(nodes), edges:structuredClone(edges) });

type Tool = 'select'|'rectangle'|'triangle'|'text';

function Designer(){
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes,setNodes,onNodesChangeBase] = useNodesState<CanvasNode>(starterNodes);
  const [edges,setEdges,onEdgesChangeBase] = useEdgesState<CanvasEdge>(starterEdges);
  const [selectedNodeId,setSelectedNodeId] = useState<string>();
  const [selectedEdgeId,setSelectedEdgeId] = useState<string>();
  const [designName,setDesignName] = useState('My Azure Architecture');
  const [saveState,setSaveState] = useState<'saved'|'unsaved'>('saved');
  const [rightPanel,setRightPanel] = useState<'properties'|'validation'>('properties');
  const [tool,setTool] = useState<Tool>('select');
  const [connectorStyle,setConnectorStyle] = useState<ConnectorStyle>('smoothstep');
  const nodeTypes = useMemo(()=>({architecture:ArchitectureNodeComponent,container:ContainerNode,drawing:DrawingNodeComponent}),[]);
  const edgeTypes = useMemo(()=>({styled:StyledEdge}),[]);
  const history = useRef<Snapshot[]>([]); const future = useRef<Snapshot[]>([]); const copiedNodes=useRef<CanvasNode[]>([]); const nextPos=useRef(0);
  const selectedNode = nodes.find(n=>n.id===selectedNodeId);
  const selectedEdge = edges.find(e=>e.id===selectedEdgeId);
  const isArchitecture = selectedNode && selectedNode.type !== 'drawing';
  const isDrawing = selectedNode?.type === 'drawing';
  const markChanged=useCallback(()=>setSaveState('unsaved'),[]);
  const pushHistory=useCallback(()=>{history.current.push(cloneSnapshot(nodes,edges));if(history.current.length>60)history.current.shift();future.current=[];},[nodes,edges]);
  const undo=useCallback(()=>{const p=history.current.pop();if(!p)return;future.current.push(cloneSnapshot(nodes,edges));setNodes(p.nodes);setEdges(p.edges);setSelectedNodeId(undefined);setSelectedEdgeId(undefined);markChanged();},[nodes,edges,setNodes,setEdges,markChanged]);
  const redo=useCallback(()=>{const n=future.current.pop();if(!n)return;history.current.push(cloneSnapshot(nodes,edges));setNodes(n.nodes);setEdges(n.edges);setSelectedNodeId(undefined);setSelectedEdgeId(undefined);markChanged();},[nodes,edges,setNodes,setEdges,markChanged]);

  const onConnect=useCallback((connection:Connection)=>{pushHistory();setEdges(es=>addEdge({...connection,type:'styled',markerEnd:{type:MarkerType.ArrowClosed},data:{connectorStyle}},es));markChanged();},[connectorStyle,pushHistory,setEdges,markChanged]);

  const findContainer=useCallback((point:{x:number;y:number},type:ResourceType)=>{
    const candidates=nodes.filter((n):n is ArchitectureNode=>n.type==='container');
    const wanted=type==='subnet'?candidates.filter(n=>n.data.resourceType==='virtualNetwork'):candidates;
    return [...wanted].reverse().find(n=>{const width=Number(n.style?.width||(n.data.resourceType==='virtualNetwork'?820:360));const height=Number(n.style?.height||(n.data.resourceType==='virtualNetwork'?500:300));return point.x>=n.position.x&&point.x<=n.position.x+width&&point.y>=n.position.y&&point.y<=n.position.y+height;});
  },[nodes]);

  const createResource=useCallback((type:ResourceType,position?:{x:number;y:number})=>{
    if(!resourceMap[type])return;pushHistory();const offset=nextPos.current++%8;const id=`${type}-${Date.now()}-${offset}`;const requested=position||{x:300+offset*24,y:180+offset*24};const parent=position?findContainer(requested,type):undefined;const isContainer=type==='virtualNetwork'||type==='subnet';
    const node:ArchitectureNode={id,type:isContainer?'container':'architecture',position:parent?{x:requested.x-parent.position.x,y:requested.y-parent.position.y}:requested,data:makeData(type),...(isContainer?{style:containerStyle(type)}:{}),...(parent?{parentId:parent.id,extent:'parent' as const}:{})};
    setNodes(c=>[...c,node]);setSelectedNodeId(id);setSelectedEdgeId(undefined);setRightPanel('properties');markChanged();
  },[pushHistory,findContainer,setNodes,markChanged]);

  const createDrawing=useCallback((shape:DrawingNode['data']['shape'],position:{x:number;y:number})=>{
    pushHistory();const id=`${shape}-${Date.now()}`;const node:DrawingNode={id,type:'drawing',position,data:{label:shape==='text'?'Text label':shape==='rectangle'?'Rectangle':'Triangle',shape,fill:shape==='rectangle'?'#ffffff':'#dbeafe',border:'#2563eb',textColor:'#0f172a',fontSize:18},...(shape==='rectangle'?{style:{width:220,height:120}}:shape==='triangle'?{style:{width:180,height:150}}:{})};setNodes(c=>[...c,node]);setSelectedNodeId(id);setSelectedEdgeId(undefined);setRightPanel('properties');markChanged();
  },[pushHistory,setNodes,markChanged]);

  const onPaneClick=useCallback((event:React.MouseEvent)=>{if(tool==='select'){setSelectedNodeId(undefined);setSelectedEdgeId(undefined);return;}const p=screenToFlowPosition({x:event.clientX,y:event.clientY});createDrawing(tool,p);setTool('select');},[tool,screenToFlowPosition,createDrawing]);
  const onDrop=useCallback((event:DragEvent)=>{event.preventDefault();const type=event.dataTransfer.getData('application/cloud-resource') as ResourceType;if(type)createResource(type,screenToFlowPosition({x:event.clientX,y:event.clientY}));},[createResource,screenToFlowPosition]);

  const updateArchitecture=(updates:Partial<ArchitectureNode['data']>)=>{if(!selectedNodeId)return;pushHistory();setNodes(c=>c.map(n=>n.id===selectedNodeId&&n.type!=='drawing'?{...n,data:{...n.data,...updates}}:n));markChanged();};
  const updateDrawing=(updates:Partial<DrawingNode['data']>)=>{if(!selectedNodeId)return;setNodes(c=>c.map(n=>n.id===selectedNodeId&&n.type==='drawing'?{...n,data:{...n.data,...updates}}:n));markChanged();};
  const updateEdge=(updates:Partial<NonNullable<CanvasEdge['data']>>)=>{if(!selectedEdgeId)return;setEdges(c=>c.map(e=>e.id===selectedEdgeId?{...e,data:{...e.data,...updates}}:e));markChanged();};

  const deleteSelected=useCallback(()=>{const ids=nodes.filter(n=>n.selected).map(n=>n.id);if(selectedNodeId&&!ids.includes(selectedNodeId))ids.push(selectedNodeId);if(!ids.length&&!selectedEdgeId)return;pushHistory();const s=new Set(ids);setNodes(c=>c.filter(n=>!s.has(n.id)));setEdges(c=>c.filter(e=>!s.has(e.source)&&!s.has(e.target)&&e.id!==selectedEdgeId));setSelectedNodeId(undefined);setSelectedEdgeId(undefined);markChanged();},[nodes,selectedNodeId,selectedEdgeId,pushHistory,setNodes,setEdges,markChanged]);
  const duplicateSelected=()=>{if(!selectedNode)return;pushHistory();const id=`copy-${Date.now()}`;setNodes(c=>[...c,{...structuredClone(selectedNode),id,selected:false,position:{x:selectedNode.position.x+36,y:selectedNode.position.y+36}}]);setSelectedNodeId(id);markChanged();};
  const copySelection=useCallback(()=>{copiedNodes.current=structuredClone(nodes.filter(n=>n.selected||n.id===selectedNodeId));},[nodes,selectedNodeId]);
  const pasteSelection=useCallback(()=>{if(!copiedNodes.current.length)return;pushHistory();const pasted=copiedNodes.current.map((n,i)=>({...structuredClone(n),id:`paste-${Date.now()}-${i}`,position:{x:n.position.x+42,y:n.position.y+42},selected:true,parentId:undefined,extent:undefined} as CanvasNode));setNodes(c=>[...c.map(n=>({...n,selected:false} as CanvasNode)),...pasted]);markChanged();},[pushHistory,setNodes,markChanged]);

  const onNodesChange=useCallback((changes:NodeChange<CanvasNode>[])=>{if(changes.some(c=>c.type==='position'&&c.dragging===false))pushHistory();onNodesChangeBase(changes);if(changes.some(c=>c.type!=='select'))markChanged();},[onNodesChangeBase,pushHistory,markChanged]);
  const onEdgesChange=useCallback((changes:EdgeChange<CanvasEdge>[])=>{onEdgesChangeBase(changes);if(changes.some(c=>c.type!=='select'))markChanged();},[onEdgesChangeBase,markChanged]);

  const architectureNodes=nodes.filter((n):n is ArchitectureNode=>n.type!=='drawing');
  const findings=useMemo<ValidationFinding[]>(()=>{const r:ValidationFinding[]=[];const types=new Set(architectureNodes.map(n=>n.data.resourceType));architectureNodes.forEach(n=>{if(n.data.resourceType==='publicIp')r.push({id:`p-${n.id}`,severity:'warning',title:'Public IP detected',message:'Prefer private access or controlled ingress.',nodeId:n.id});if(n.data.resourceType==='virtualMachine'&&!n.parentId)r.push({id:`v-${n.id}`,severity:'warning',title:'VM outside subnet',message:'Place virtual machines inside a subnet.',nodeId:n.id});});if(!types.has('keyVault'))r.push({id:'kv',severity:'info',title:'No Key Vault',message:'Consider Key Vault for secrets and certificates.'});if(!r.length)r.push({id:'ok',severity:'success',title:'Baseline checks passed',message:'No high-priority issues found by the current rule set.'});return r;},[architectureNodes]);
  const score=Math.max(35,100-findings.filter(f=>f.severity==='warning').length*12-findings.filter(f=>f.severity==='critical').length*25);

  const saveDesign=useCallback(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify({designName,nodes,edges}));setSaveState('saved');},[designName,nodes,edges]);
  const loadDesign=()=>{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return window.alert('No saved design found.');const p=JSON.parse(raw);setNodes(p.nodes||[]);setEdges(p.edges||[]);setDesignName(p.designName||'Loaded Architecture');setSaveState('saved');setTimeout(()=>fitView({padding:.18}),0);};
  const downloadBlob=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);};
  const exportJson=()=>downloadBlob(new Blob([JSON.stringify({version:'4.1',designName,nodes,edges},null,2)],{type:'application/json'}),`${designName.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-design.json`);
  const importJson=()=>{const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{const f=input.files?.[0];if(!f)return;try{const p=JSON.parse(await f.text());setNodes(p.nodes||[]);setEdges(p.edges||[]);setDesignName(p.designName||'Imported Architecture');markChanged();setTimeout(()=>fitView({padding:.18}),0);}catch{window.alert('Invalid JSON file.');}};input.click();};
  const newDesign=()=>{if(!window.confirm('Start a new blank design?'))return;pushHistory();setNodes([]);setEdges([]);setDesignName('Untitled Architecture');markChanged();};
  const loadTemplate=()=>{pushHistory();setNodes(structuredClone(starterNodes));setEdges(structuredClone(starterEdges));setDesignName('Secure 3-Tier Azure Starter');markChanged();setTimeout(()=>fitView({padding:.18}),0);};

  useEffect(()=>{const key=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(['INPUT','TEXTAREA','SELECT'].includes(t.tagName))return;const mod=e.ctrlKey||e.metaKey;if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();saveDesign();}if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();undo();}if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}if(mod&&e.key.toLowerCase()==='c'){e.preventDefault();copySelection();}if(mod&&e.key.toLowerCase()==='v'){e.preventDefault();pasteSelection();}if(e.key==='Delete'||e.key==='Backspace')deleteSelected();};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[saveDesign,undo,redo,copySelection,pasteSelection,deleteSelected]);

  return <div className="app-shell">
    <header className="topbar"><div className="brand-block"><div className="brand-mark"><Sparkles size={19}/></div><div><div className="brand">ArchMindCanvas <span>V4.1</span></div><div className="subtitle">Professional cloud architecture workspace</div></div></div><div className="design-title"><input value={designName} onChange={e=>{setDesignName(e.target.value);markChanged();}}/><div className={`save-status ${saveState}`}><Check size={12}/>{saveState==='saved'?'Saved':'Unsaved'}</div></div><div className="toolbar"><button onClick={undo}><Undo2 size={16}/></button><button onClick={redo}><Redo2 size={16}/></button><button onClick={newDesign}><FilePlus2 size={16}/><span>New</span></button><button onClick={loadTemplate}><Sparkles size={16}/><span>Template</span></button><button onClick={saveDesign}><Save size={16}/><span>Save</span></button><button onClick={loadDesign}><FolderOpen size={16}/><span>Load</span></button><button onClick={()=>setRightPanel('validation')}><ShieldCheck size={16}/><span>Validate</span></button><button className="primary-button" onClick={exportJson}><Download size={16}/><span>JSON</span></button></div></header>
    <div className="statusbar"><span><strong>{nodes.length}</strong> objects</span><span><strong>{edges.length}</strong> connections</span><span><strong>{score}</strong>/100 architecture score</span><span className="shortcut">Ctrl+Z undo · Ctrl+C/V copy/paste · Shift multi-select</span></div>
    <main className="workspace"><Sidebar onAddResource={t=>createResource(t as ResourceType)}/><div className="canvas-wrapper" onDrop={onDrop} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect='move';}}>
      <div className="drawing-toolbar"><button className={tool==='select'?'active':''} onClick={()=>setTool('select')} title="Select"><MousePointer2 size={16}/></button><span/><Route size={16}/><select value={connectorStyle} onChange={e=>setConnectorStyle(e.target.value as ConnectorStyle)}><option value="straight">Straight</option><option value="smoothstep">Elbow / routed</option><option value="bezier">Curved</option><option value="dotted">Dotted</option></select><span/><button className={tool==='rectangle'?'active':''} onClick={()=>setTool('rectangle')} title="Rectangle"><Square size={16}/></button><button className={tool==='triangle'?'active':''} onClick={()=>setTool('triangle')} title="Triangle"><Triangle size={16}/></button><button className={tool==='text'?'active':''} onClick={()=>setTool('text')} title="Text"><Type size={16}/></button><span/><button onClick={deleteSelected} title="Delete"><Trash2 size={16}/></button></div>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_,n)=>{setSelectedNodeId(n.id);setSelectedEdgeId(undefined);setRightPanel('properties');}} onEdgeClick={(_,e)=>{setSelectedEdgeId(e.id);setSelectedNodeId(undefined);setRightPanel('properties');}} onPaneClick={onPaneClick} fitView snapToGrid snapGrid={[16,16]} selectionOnDrag multiSelectionKeyCode="Shift" deleteKeyCode={null} defaultEdgeOptions={{type:'styled',markerEnd:{type:MarkerType.ArrowClosed},data:{connectorStyle}}}><Background variant={BackgroundVariant.Dots} gap={20} size={1.2}/><Controls position="bottom-left"/><MiniMap pannable zoomable position="bottom-right"/><div className="canvas-action"><button onClick={()=>fitView({padding:.18})}><Maximize2 size={15}/> Fit view</button><button onClick={copySelection}><Copy size={15}/> Copy</button><button onClick={pasteSelection}><Clipboard size={15}/> Paste</button><button onClick={importJson}><UploadCloud size={15}/> Import</button></div></ReactFlow></div>
      <div className="inspector-shell"><div className="inspector-tabs"><button className={rightPanel==='properties'?'active':''} onClick={()=>setRightPanel('properties')}>Properties</button><button className={rightPanel==='validation'?'active':''} onClick={()=>setRightPanel('validation')}>Validation <span>{findings.filter(f=>f.severity==='warning'||f.severity==='critical').length}</span></button></div>
      {rightPanel==='validation'?<ValidationPanel findings={findings} score={score} onSelectNode={id=>{setSelectedNodeId(id);setSelectedEdgeId(undefined);setRightPanel('properties');}}/>:isArchitecture?<PropertiesPanel data={(selectedNode as ArchitectureNode).data} onChange={updateArchitecture} onDelete={deleteSelected} onDuplicate={duplicateSelected}/>:isDrawing?<div className="properties-panel"><div className="panel-title">Drawing object</div><div className="form-stack"><label>Text / label<input value={(selectedNode as DrawingNode).data.label} onChange={e=>updateDrawing({label:e.target.value})}/></label>{(selectedNode as DrawingNode).data.shape==='text'&&<><label>Text color<input type="color" value={(selectedNode as DrawingNode).data.textColor||'#0f172a'} onChange={e=>updateDrawing({textColor:e.target.value})}/></label><label>Font size<input type="number" min="10" max="72" value={(selectedNode as DrawingNode).data.fontSize||18} onChange={e=>updateDrawing({fontSize:Number(e.target.value)})}/></label></>}{(selectedNode as DrawingNode).data.shape!=='text'&&<><label>Fill color<input type="color" value={(selectedNode as DrawingNode).data.fill||'#ffffff'} onChange={e=>updateDrawing({fill:e.target.value})}/></label><label>Border color<input type="color" value={(selectedNode as DrawingNode).data.border||'#2563eb'} onChange={e=>updateDrawing({border:e.target.value})}/></label></>}<button className="danger-button" onClick={deleteSelected}>Delete object</button></div></div>:selectedEdge?<div className="properties-panel"><div className="panel-title">Connection</div><div className="form-stack"><label>Line style<select value={selectedEdge.data?.connectorStyle||'smoothstep'} onChange={e=>updateEdge({connectorStyle:e.target.value as ConnectorStyle})}><option value="straight">Straight</option><option value="smoothstep">Elbow / routed</option><option value="bezier">Curved</option><option value="dotted">Dotted</option></select></label><label>Connection label<input value={selectedEdge.data?.label||''} onChange={e=>updateEdge({label:e.target.value})} placeholder="HTTPS, Private Link, TCP 443..."/></label><div className="sidebar-help">Move either connected object and the connector automatically follows and reroutes.</div><button className="danger-button" onClick={deleteSelected}>Delete connection</button></div></div>:<div className="empty-properties"><div className="empty-icon">✦</div><strong>Select an object or connection</strong><span>Edit Azure resources, shapes, text boxes, and connector styles here.</span></div>}</div>
    </main></div>;
}
export default function App(){return <ReactFlowProvider><Designer/></ReactFlowProvider>}
