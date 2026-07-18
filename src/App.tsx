import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  addEdge, Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow, type Connection, type Edge, type NodeChange,
} from '@xyflow/react';
import { Check, Clipboard, Copy, Download, FileImage, FilePlus2, FolderOpen, Maximize2, Redo2, Save, ShieldCheck, Sparkles, Undo2, UploadCloud } from 'lucide-react';
import ArchitectureNodeComponent from './components/ArchitectureNode';
import ContainerNode from './components/ContainerNode';
import PropertiesPanel from './components/PropertiesPanel';
import Sidebar from './components/Sidebar';
import ValidationPanel from './components/ValidationPanel';
import { resourceMap } from './resourceCatalog';
import type { ArchitectureNode, ResourceType, ValidationFinding } from './types';

const STORAGE_KEY = 'archmindcanvas-v4';
const makeData = (type: ResourceType, label?: string): ArchitectureNode['data'] => ({
  label: label || resourceMap[type].label,
  resourceType: type,
  description: resourceMap[type].description,
  region: 'Central India',
  sku: resourceMap[type].sku,
  environment: 'Production',
  owner: '',
});
const containerStyle = (type: ResourceType) => type === 'virtualNetwork'
  ? { width: 820, height: 500 }
  : { width: 360, height: 300 };

const starterNodes: ArchitectureNode[] = [
  { id: 'vnet', type: 'container', position: { x: 100, y: 80 }, style: containerStyle('virtualNetwork'), data: makeData('virtualNetwork', 'Production VNet') },
  { id: 'subnet-app', type: 'container', parentId: 'vnet', extent: 'parent', position: { x: 35, y: 90 }, style: containerStyle('subnet'), data: makeData('subnet', 'Application Subnet') },
  { id: 'subnet-data', type: 'container', parentId: 'vnet', extent: 'parent', position: { x: 420, y: 90 }, style: containerStyle('subnet'), data: makeData('subnet', 'Data Subnet') },
  { id: 'app', type: 'architecture', parentId: 'subnet-app', extent: 'parent', position: { x: 70, y: 105 }, data: makeData('appService', 'Customer Portal') },
  { id: 'kv', type: 'architecture', parentId: 'subnet-app', extent: 'parent', position: { x: 70, y: 200 }, data: makeData('keyVault', 'App Key Vault') },
  { id: 'db', type: 'architecture', parentId: 'subnet-data', extent: 'parent', position: { x: 70, y: 130 }, data: makeData('sqlDatabase', 'Application DB') },
];
const starterEdges: Edge[] = [
  { id: 'e1', source: 'app', target: 'db', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2', source: 'app', target: 'kv', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
];

type Snapshot = { nodes: ArchitectureNode[]; edges: Edge[] };
const cloneSnapshot = (nodes: ArchitectureNode[], edges: Edge[]): Snapshot => ({
  nodes: structuredClone(nodes), edges: structuredClone(edges),
});

function Designer() {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChangeBase] = useNodesState<ArchitectureNode>(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starterEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [designName, setDesignName] = useState('My Azure Architecture');
  const [saveState, setSaveState] = useState<'saved'|'unsaved'>('saved');
  const [rightPanel, setRightPanel] = useState<'properties'|'validation'>('properties');
  const nodeTypes = useMemo(() => ({ architecture: ArchitectureNodeComponent, container: ContainerNode }), []);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const nextPos = useRef(0);
  const history = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const copiedNodes = useRef<ArchitectureNode[]>([]);

  const markChanged = useCallback(() => setSaveState('unsaved'), []);
  const pushHistory = useCallback(() => {
    history.current.push(cloneSnapshot(nodes, edges));
    if (history.current.length > 60) history.current.shift();
    future.current = [];
  }, [nodes, edges]);

  const undo = useCallback(() => {
    const previous = history.current.pop(); if (!previous) return;
    future.current.push(cloneSnapshot(nodes, edges));
    setNodes(previous.nodes); setEdges(previous.edges); setSelectedNodeId(undefined); markChanged();
  }, [nodes, edges, setNodes, setEdges, markChanged]);
  const redo = useCallback(() => {
    const next = future.current.pop(); if (!next) return;
    history.current.push(cloneSnapshot(nodes, edges));
    setNodes(next.nodes); setEdges(next.edges); setSelectedNodeId(undefined); markChanged();
  }, [nodes, edges, setNodes, setEdges, markChanged]);

  const onConnect = useCallback((connection: Connection) => {
    pushHistory();
    setEdges((existing) => addEdge({ ...connection, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, existing));
    markChanged();
  }, [setEdges, markChanged, pushHistory]);

  const findContainer = useCallback((point: {x:number;y:number}, type: ResourceType) => {
    const candidates = nodes.filter((n) => n.type === 'container');
    const wanted = type === 'subnet' ? candidates.filter((n) => n.data.resourceType === 'virtualNetwork') : candidates;
    return [...wanted].reverse().find((n) => {
      const width = Number(n.style?.width || (n.data.resourceType === 'virtualNetwork' ? 820 : 360));
      const height = Number(n.style?.height || (n.data.resourceType === 'virtualNetwork' ? 500 : 300));
      return point.x >= n.position.x && point.x <= n.position.x + width && point.y >= n.position.y && point.y <= n.position.y + height;
    });
  }, [nodes]);

  const createNode = useCallback((type: ResourceType, position?: {x:number;y:number}) => {
    if (!resourceMap[type]) return;
    pushHistory();
    const offset = nextPos.current++ % 8;
    const id = `${type}-${Date.now()}-${offset}`;
    const requested = position || { x: 300 + offset * 24, y: 180 + offset * 24 };
    const parent = position ? findContainer(requested, type) : undefined;
    const isContainer = type === 'virtualNetwork' || type === 'subnet';
    const node: ArchitectureNode = {
      id, type: isContainer ? 'container' : 'architecture',
      position: parent ? { x: requested.x - parent.position.x, y: requested.y - parent.position.y } : requested,
      data: makeData(type),
      ...(isContainer ? { style: containerStyle(type) } : {}),
      ...(parent ? { parentId: parent.id, extent: 'parent' as const } : {}),
    };
    setNodes((current) => [...current, node]); setSelectedNodeId(id); setRightPanel('properties'); markChanged();
  }, [setNodes, markChanged, pushHistory, findContainer]);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/cloud-resource') as ResourceType;
    if (!type) return;
    createNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }, [createNode, screenToFlowPosition]);

  const updateSelected = (updates: Partial<ArchitectureNode['data']>) => {
    if (!selectedNodeId) return; pushHistory();
    setNodes((current) => current.map((node) => node.id === selectedNodeId ? { ...node, data: { ...node.data, ...updates } } : node)); markChanged();
  };
  const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
  const deleteSelected = useCallback(() => {
    const ids = selectedIds.length ? selectedIds : selectedNodeId ? [selectedNodeId] : [];
    if (!ids.length) return; pushHistory();
    const idSet = new Set(ids);
    setNodes((c) => c.filter((n) => !idSet.has(n.id) && !n.parentId?.split('/').some((id) => idSet.has(id))));
    setEdges((c) => c.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)));
    setSelectedNodeId(undefined); markChanged();
  }, [selectedIds.join('|'), selectedNodeId, setNodes, setEdges, markChanged, pushHistory]);

  const duplicateSelected = () => {
    if (!selectedNode) return; pushHistory();
    const id = `${selectedNode.data.resourceType}-${Date.now()}`;
    setNodes((c) => [...c, { ...selectedNode, id, selected: false, position: { x: selectedNode.position.x + 36, y: selectedNode.position.y + 36 }, data: { ...selectedNode.data, label: `${selectedNode.data.label} Copy` } }]);
    setSelectedNodeId(id); markChanged();
  };

  const copySelection = useCallback(() => {
    const selected = nodes.filter((n) => n.selected || n.id === selectedNodeId);
    copiedNodes.current = structuredClone(selected);
  }, [nodes, selectedNodeId]);
  const pasteSelection = useCallback(() => {
    if (!copiedNodes.current.length) return; pushHistory();
    const idMap = new Map<string,string>();
    copiedNodes.current.forEach((n) => idMap.set(n.id, `${n.data.resourceType}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`));
    const pasted = copiedNodes.current.map((n) => ({
      ...n, id: idMap.get(n.id)!, selected: true,
      parentId: n.parentId && idMap.has(n.parentId) ? idMap.get(n.parentId) : n.parentId,
      position: { x: n.position.x + 42, y: n.position.y + 42 },
      data: { ...n.data, label: `${n.data.label} Copy` },
    }));
    setNodes((current) => current.map((n) => ({...n, selected:false})).concat(pasted));
    markChanged();
  }, [pushHistory, setNodes, markChanged]);

  const onNodesChange = useCallback((changes: NodeChange<ArchitectureNode>[]) => {
    if (changes.some((c) => c.type === 'position' && c.dragging === false)) pushHistory();
    onNodesChangeBase(changes);
    if (changes.some((c) => c.type !== 'select')) markChanged();
  }, [onNodesChangeBase, markChanged, pushHistory]);

  const findings = useMemo<ValidationFinding[]>(() => {
    const result: ValidationFinding[] = [];
    const types = new Set(nodes.map((n) => n.data.resourceType));
    nodes.forEach((n) => {
      if (n.data.resourceType === 'publicIp') result.push({ id:`public-${n.id}`, severity:'warning', title:'Public IP detected', message:'Prefer private access, Bastion, or controlled ingress for production workloads.', nodeId:n.id });
      if (n.data.resourceType === 'sqlDatabase' && !n.parentId) result.push({ id:`sql-${n.id}`, severity:'warning', title:'Database outside network boundary', message:'Place the data tier in a subnet/private connectivity design.', nodeId:n.id });
      if (n.data.resourceType === 'virtualMachine' && !n.parentId) result.push({ id:`vm-${n.id}`, severity:'warning', title:'VM is not grouped in a subnet', message:'Drop the VM inside a subnet to make the network placement explicit.', nodeId:n.id });
      if (n.data.environment === 'Production' && !n.data.owner.trim()) result.push({ id:`owner-${n.id}`, severity:'info', title:'Production owner not defined', message:`Add an owner for ${n.data.label}.`, nodeId:n.id });
    });
    if (types.has('virtualMachine') && !types.has('networkSecurityGroup')) result.push({ id:'nsg', severity:'warning', title:'No Network Security Group found', message:'Consider NSGs to control subnet or NIC traffic.' });
    if ((types.has('appService') || types.has('virtualMachine') || types.has('aks')) && !types.has('keyVault')) result.push({ id:'kv', severity:'info', title:'No Key Vault found', message:'Use Key Vault for application secrets, certificates, and keys.' });
    if (types.has('applicationGateway')) result.push({ id:'waf', severity:'success', title:'Application Gateway included', message:'WAF-capable ingress is available in the architecture.' });
    if (!result.length) result.push({ id:'clean', severity:'success', title:'Design looks healthy', message:'No common design-time issues were detected.' });
    return result;
  }, [nodes]);
  const score = Math.max(35, Math.min(100, 100 - findings.filter((f)=>f.severity==='critical').length*20 - findings.filter((f)=>f.severity==='warning').length*8 - findings.filter((f)=>f.severity==='info').length*2));

  const saveDesign = useCallback(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 4, designName, nodes, edges })); setSaveState('saved'); }, [designName, nodes, edges]);
  const loadDesign = () => { const saved = localStorage.getItem(STORAGE_KEY); if (!saved) return window.alert('No saved design found in this browser.'); try { const p = JSON.parse(saved) as {designName?:string;nodes:ArchitectureNode[];edges:Edge[]}; pushHistory(); setNodes(p.nodes || []); setEdges(p.edges || []); setDesignName(p.designName || 'My Azure Architecture'); setSelectedNodeId(undefined); setSaveState('saved'); setTimeout(() => fitView({ padding: .18 }), 0); } catch { window.alert('The saved design could not be loaded.'); } };
  const downloadBlob = (blob: Blob, name: string) => { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); };
  const exportJson = () => downloadBlob(new Blob([JSON.stringify({ version: 4, designName, exportedAt: new Date().toISOString(), nodes, edges }, null, 2)], { type:'application/json' }), `${designName.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'archmindcanvas'}-design.json`);
  const svgMarkup = () => {
    const flat = nodes.filter((n)=>n.type==='architecture');
    const width=1400,height=900;
    const body = flat.map((n)=>`<g transform="translate(${Math.max(20,n.position.x)},${Math.max(20,n.position.y)})"><rect width="220" height="72" rx="12" fill="white" stroke="#94a3b8"/><text x="16" y="30" font-family="Arial" font-size="16" font-weight="700" fill="#172033">${n.data.label.replace(/[<&>]/g,'')}</text><text x="16" y="52" font-family="Arial" font-size="11" fill="#64748b">${n.data.region} · ${n.data.environment}</text></g>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f8fafc"/><text x="24" y="34" font-family="Arial" font-size="20" font-weight="700" fill="#0f172a">${designName.replace(/[<&>]/g,'')}</text>${body}</svg>`;
  };
  const exportSvg = () => downloadBlob(new Blob([svgMarkup()], {type:'image/svg+xml'}), `${designName.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-diagram.svg`);
  const exportPng = () => { const svg=svgMarkup(); const blob=new Blob([svg],{type:'image/svg+xml'}); const url=URL.createObjectURL(blob); const img=new Image(); img.onload=()=>{ const canvas=document.createElement('canvas'); canvas.width=1400;canvas.height=900; const ctx=canvas.getContext('2d'); if(!ctx)return;ctx.drawImage(img,0,0);URL.revokeObjectURL(url);canvas.toBlob((png)=>png&&downloadBlob(png,`${designName.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}-diagram.png`),'image/png');};img.src=url; };
  const importJson = () => { const input=document.createElement('input'); input.type='file'; input.accept='.json,application/json'; input.onchange=async()=>{ const file=input.files?.[0]; if(!file)return; try{ const p=JSON.parse(await file.text()) as {designName?:string;nodes:ArchitectureNode[];edges:Edge[]}; pushHistory();setNodes(p.nodes||[]);setEdges(p.edges||[]);setDesignName(p.designName||file.name.replace(/\.json$/i,''));setSelectedNodeId(undefined);markChanged();setTimeout(()=>fitView({padding:.18}),0);}catch{window.alert('Invalid ArchMindCanvas JSON file.');}}; input.click(); };
  const newDesign = () => { if ((nodes.length || edges.length) && !window.confirm('Start a new blank design? Unsaved changes will be cleared.')) return; pushHistory(); setNodes([]); setEdges([]); setSelectedNodeId(undefined); setDesignName('Untitled Architecture'); setSaveState('unsaved'); };
  const loadTemplate = () => { if ((nodes.length || edges.length) && !window.confirm('Load the professional starter architecture? Current canvas will be replaced.')) return; pushHistory(); setNodes(structuredClone(starterNodes)); setEdges(structuredClone(starterEdges)); setDesignName('Secure 3-Tier Azure Starter'); setSelectedNodeId(undefined); setSaveState('unsaved'); setTimeout(()=>fitView({padding:.18}),0); };

  useEffect(() => { const key=(e:KeyboardEvent)=>{ const target=e.target as HTMLElement; if(['INPUT','TEXTAREA','SELECT'].includes(target.tagName))return; const mod=e.ctrlKey||e.metaKey; if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();saveDesign();} if(mod&&e.key.toLowerCase()==='z'&&!e.shiftKey){e.preventDefault();undo();} if((mod&&e.key.toLowerCase()==='y')||(mod&&e.shiftKey&&e.key.toLowerCase()==='z')){e.preventDefault();redo();} if(mod&&e.key.toLowerCase()==='c'){e.preventDefault();copySelection();} if(mod&&e.key.toLowerCase()==='v'){e.preventDefault();pasteSelection();} if((e.key==='Delete'||e.key==='Backspace'))deleteSelected(); if(e.key==='Escape')setSelectedNodeId(undefined); }; window.addEventListener('keydown',key); return()=>window.removeEventListener('keydown',key); },[saveDesign,undo,redo,copySelection,pasteSelection,deleteSelected]);

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-block"><div className="brand-mark"><Sparkles size={19}/></div><div><div className="brand">ArchMindCanvas <span>V4</span></div><div className="subtitle">Professional cloud architecture workspace</div></div></div>
      <div className="design-title"><input value={designName} onChange={(e)=>{setDesignName(e.target.value);markChanged();}} aria-label="Design name"/><div className={`save-status ${saveState}`}><Check size={12}/>{saveState==='saved'?'Saved':'Unsaved'}</div></div>
      <div className="toolbar">
        <button title="Undo" onClick={undo}><Undo2 size={16}/></button><button title="Redo" onClick={redo}><Redo2 size={16}/></button>
        <button title="New design" onClick={newDesign}><FilePlus2 size={16}/><span>New</span></button>
        <button title="Load starter template" onClick={loadTemplate}><Sparkles size={16}/><span>Template</span></button>
        <button onClick={saveDesign}><Save size={16}/><span>Save</span></button><button onClick={loadDesign}><FolderOpen size={16}/><span>Load</span></button>
        <button onClick={()=>{setRightPanel('validation');}}><ShieldCheck size={16}/><span>Validate</span></button>
        <div className="export-menu"><button className="primary-button" onClick={exportJson}><Download size={16}/><span>JSON</span></button><button onClick={exportSvg}><FileImage size={16}/><span>SVG</span></button><button onClick={exportPng}><FileImage size={16}/><span>PNG</span></button></div>
      </div>
    </header>
    <div className="statusbar"><span><strong>{nodes.length}</strong> resources</span><span><strong>{edges.length}</strong> connections</span><span><strong>{score}</strong>/100 architecture score</span><span className="shortcut">Ctrl+Z undo · Ctrl+C/V copy/paste · Shift multi-select</span></div>
    <main className="workspace">
      <Sidebar onAddResource={(type)=>createNode(type as ResourceType)}/>
      <div className="canvas-wrapper" onDrop={onDrop} onDragOver={(e)=>{e.preventDefault();e.dataTransfer.dropEffect='move';}}>
        {nodes.length===0&&<div className="empty-canvas"><div className="empty-canvas-icon"><Sparkles size={25}/></div><h2>Start designing your architecture</h2><p>Drag Azure resources onto the canvas. Drop subnets inside VNets and workloads inside subnets.</p><button onClick={loadTemplate}><Sparkles size={16}/> Use starter template</button></div>}
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={(changes)=>{onEdgesChange(changes);if(changes.some(c=>c.type!=='select'))markChanged();}} onConnect={onConnect} onNodeClick={(_,node)=>{setSelectedNodeId(node.id);setRightPanel('properties');}} onPaneClick={()=>setSelectedNodeId(undefined)} fitView snapToGrid snapGrid={[16,16]} selectionOnDrag multiSelectionKeyCode="Shift" defaultEdgeOptions={{type:'smoothstep',markerEnd:{type:MarkerType.ArrowClosed},style:{strokeWidth:1.6}}}>
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2}/><Controls position="bottom-left"/><MiniMap pannable zoomable position="bottom-right" nodeStrokeWidth={3}/>
          <div className="canvas-action"><button onClick={()=>fitView({padding:.18})}><Maximize2 size={15}/> Fit view</button><button onClick={copySelection}><Copy size={15}/> Copy</button><button onClick={pasteSelection}><Clipboard size={15}/> Paste</button><button onClick={importJson}><UploadCloud size={15}/> Import</button></div>
        </ReactFlow>
      </div>
      <div className="inspector-shell"><div className="inspector-tabs"><button className={rightPanel==='properties'?'active':''} onClick={()=>setRightPanel('properties')}>Properties</button><button className={rightPanel==='validation'?'active':''} onClick={()=>setRightPanel('validation')}>Validation <span>{findings.filter(f=>f.severity==='warning'||f.severity==='critical').length}</span></button></div>
        {rightPanel==='properties'?<PropertiesPanel data={selectedNode?.data} onChange={updateSelected} onDelete={deleteSelected} onDuplicate={duplicateSelected}/>:<ValidationPanel findings={findings} score={score} onSelectNode={(id)=>{setSelectedNodeId(id);setRightPanel('properties');}}/>}
      </div>
    </main>
  </div>;
}
export default function App(){return <ReactFlowProvider><Designer/></ReactFlowProvider>}
