import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  addEdge, Background, BackgroundVariant, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow, type Connection, type Edge,
} from '@xyflow/react';
import { Check, Download, FilePlus2, FolderOpen, Maximize2, Save, Sparkles, UploadCloud } from 'lucide-react';
import ArchitectureNodeComponent from './components/ArchitectureNode';
import PropertiesPanel from './components/PropertiesPanel';
import Sidebar from './components/Sidebar';
import { resourceMap } from './resourceCatalog';
import type { ArchitectureNode, ResourceType } from './types';

const STORAGE_KEY = 'archmindcanvas-v2';
const makeData = (type: ResourceType, label?: string): ArchitectureNode['data'] => ({ label: label || resourceMap[type].label, resourceType: type, description: resourceMap[type].description, region: 'Central India', sku: resourceMap[type].sku, environment: 'Production', owner: '' });
const starterNodes: ArchitectureNode[] = [
  { id: 'vnet', type: 'architecture', position: { x: 220, y: 190 }, data: makeData('virtualNetwork', 'Production VNet') },
  { id: 'app', type: 'architecture', position: { x: 510, y: 110 }, data: makeData('appService', 'Customer Portal') },
  { id: 'db', type: 'architecture', position: { x: 810, y: 110 }, data: makeData('sqlDatabase', 'Application DB') },
  { id: 'kv', type: 'architecture', position: { x: 510, y: 280 }, data: makeData('keyVault', 'App Key Vault') },
];
const starterEdges: Edge[] = [
  { id: 'e1', source: 'vnet', target: 'app' }, { id: 'e2', source: 'app', target: 'db' }, { id: 'e3', source: 'app', target: 'kv' },
];
const blank = { nodes: [] as ArchitectureNode[], edges: [] as Edge[] };

function Designer() {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchitectureNode>(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starterEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [designName, setDesignName] = useState('My Azure Architecture');
  const [saveState, setSaveState] = useState<'saved'|'unsaved'>('saved');
  const nodeTypes = useMemo(() => ({ architecture: ArchitectureNodeComponent }), []);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const nextPos = useRef(0);

  const markChanged = useCallback(() => setSaveState('unsaved'), []);
  const onConnect = useCallback((connection: Connection) => { setEdges((existing) => addEdge({ ...connection, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, existing)); markChanged(); }, [setEdges, markChanged]);

  const createNode = useCallback((type: ResourceType, position?: {x:number;y:number}) => {
    if (!resourceMap[type]) return;
    const offset = nextPos.current++ % 8;
    const id = `${type}-${Date.now()}-${offset}`;
    const node: ArchitectureNode = { id, type: 'architecture', position: position || { x: 300 + offset * 24, y: 180 + offset * 24 }, data: makeData(type) };
    setNodes((current) => [...current, node]); setSelectedNodeId(id); markChanged();
  }, [setNodes, markChanged]);

  const onDrop = useCallback((event: DragEvent) => { event.preventDefault(); const type = event.dataTransfer.getData('application/cloud-resource') as ResourceType; if (!type) return; createNode(type, screenToFlowPosition({ x: event.clientX, y: event.clientY })); }, [createNode, screenToFlowPosition]);
  const updateSelected = (updates: Partial<ArchitectureNode['data']>) => { if (!selectedNodeId) return; setNodes((current) => current.map((node) => node.id === selectedNodeId ? { ...node, data: { ...node.data, ...updates } } : node)); markChanged(); };
  const deleteSelected = useCallback(() => { if (!selectedNodeId) return; setNodes((c) => c.filter((n) => n.id !== selectedNodeId)); setEdges((c) => c.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)); setSelectedNodeId(undefined); markChanged(); }, [selectedNodeId, setNodes, setEdges, markChanged]);
  const duplicateSelected = () => { if (!selectedNode) return; const id = `${selectedNode.data.resourceType}-${Date.now()}`; setNodes((c) => [...c, { ...selectedNode, id, selected: false, position: { x: selectedNode.position.x + 36, y: selectedNode.position.y + 36 }, data: { ...selectedNode.data, label: `${selectedNode.data.label} Copy` } }]); setSelectedNodeId(id); markChanged(); };

  const saveDesign = useCallback(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, designName, nodes, edges })); setSaveState('saved'); }, [designName, nodes, edges]);
  const loadDesign = () => { const saved = localStorage.getItem(STORAGE_KEY); if (!saved) return window.alert('No saved design found in this browser.'); try { const p = JSON.parse(saved) as {designName?:string;nodes:ArchitectureNode[];edges:Edge[]}; setNodes(p.nodes || []); setEdges(p.edges || []); setDesignName(p.designName || 'My Azure Architecture'); setSelectedNodeId(undefined); setSaveState('saved'); setTimeout(() => fitView({ padding: .18 }), 0); } catch { window.alert('The saved design could not be loaded.'); } };
  const exportJson = () => { const blob = new Blob([JSON.stringify({ version: 2, designName, exportedAt: new Date().toISOString(), nodes, edges }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${designName.replace(/[^a-z0-9]+/gi,'-').toLowerCase() || 'archmindcanvas'}-design.json`; a.click(); URL.revokeObjectURL(url); };
  const importJson = () => { const input = document.createElement('input'); input.type='file'; input.accept='.json,application/json'; input.onchange=async()=>{ const file=input.files?.[0]; if(!file)return; try{ const p=JSON.parse(await file.text()) as {designName?:string;nodes:ArchitectureNode[];edges:Edge[]}; setNodes(p.nodes||[]);setEdges(p.edges||[]);setDesignName(p.designName||file.name.replace(/\.json$/i,''));setSelectedNodeId(undefined);markChanged();setTimeout(()=>fitView({padding:.18}),0);}catch{window.alert('Invalid ArchMindCanvas JSON file.');}}; input.click(); };
  const newDesign = () => { if ((nodes.length || edges.length) && !window.confirm('Start a new blank design? Unsaved changes will be cleared.')) return; setNodes(blank.nodes); setEdges(blank.edges); setSelectedNodeId(undefined); setDesignName('Untitled Architecture'); setSaveState('unsaved'); };
  const loadTemplate = () => { if ((nodes.length || edges.length) && !window.confirm('Load the professional starter architecture? Current canvas will be replaced.')) return; setNodes(starterNodes); setEdges(starterEdges); setDesignName('3-Tier Azure Starter'); setSelectedNodeId(undefined); setSaveState('unsaved'); setTimeout(()=>fitView({padding:.18}),0); };

  useEffect(() => { const key = (e: KeyboardEvent) => { const target = e.target as HTMLElement; if (['INPUT','TEXTAREA','SELECT'].includes(target.tagName)) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='s') { e.preventDefault(); saveDesign(); } if ((e.key==='Delete' || e.key==='Backspace') && selectedNodeId) deleteSelected(); if (e.key==='Escape') setSelectedNodeId(undefined); }; window.addEventListener('keydown', key); return ()=>window.removeEventListener('keydown', key); }, [saveDesign, deleteSelected, selectedNodeId]);

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-block"><div className="brand-mark"><Sparkles size={19}/></div><div><div className="brand">ArchMindCanvas <span>PRO</span></div><div className="subtitle">Visual cloud architecture workspace</div></div></div>
      <div className="design-title"><input value={designName} onChange={(e)=>{setDesignName(e.target.value);markChanged();}} aria-label="Design name"/><div className={`save-status ${saveState}`}><Check size={12}/>{saveState==='saved'?'Saved':'Unsaved changes'}</div></div>
      <div className="toolbar">
        <button title="New design" onClick={newDesign}><FilePlus2 size={16}/><span>New</span></button>
        <button title="Load starter template" onClick={loadTemplate}><Sparkles size={16}/><span>Template</span></button>
        <button onClick={saveDesign}><Save size={16}/><span>Save</span></button>
        <button onClick={loadDesign}><FolderOpen size={16}/><span>Load</span></button>
        <button onClick={importJson}><UploadCloud size={16}/><span>Import</span></button>
        <button className="primary-button" onClick={exportJson}><Download size={16}/><span>Export</span></button>
      </div>
    </header>
    <div className="statusbar"><span><strong>{nodes.length}</strong> resources</span><span><strong>{edges.length}</strong> connections</span><span>Azure · Visual design</span><span className="shortcut">Delete: remove · Ctrl/Cmd+S: save · Esc: deselect</span></div>
    <main className="workspace">
      <Sidebar onAddResource={(type) => createNode(type as ResourceType)}/>
      <div className="canvas-wrapper" onDrop={onDrop} onDragOver={(e)=>{e.preventDefault();e.dataTransfer.dropEffect='move';}}>
        {nodes.length===0 && <div className="empty-canvas"><div className="empty-canvas-icon"><Sparkles size={25}/></div><h2>Start designing your architecture</h2><p>Drag Azure resources from the library, double-click a resource, or load the starter template.</p><button onClick={loadTemplate}><Sparkles size={16}/> Use starter template</button></div>}
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={(changes)=>{onNodesChange(changes); if(changes.some(c=>c.type!=='select'))markChanged();}} onEdgesChange={(changes)=>{onEdgesChange(changes);if(changes.some(c=>c.type!=='select'))markChanged();}} onConnect={onConnect} onNodeClick={(_,node)=>setSelectedNodeId(node.id)} onPaneClick={()=>setSelectedNodeId(undefined)} fitView snapToGrid snapGrid={[16,16]} defaultEdgeOptions={{ type:'smoothstep', markerEnd:{type:MarkerType.ArrowClosed}, style:{strokeWidth:1.6} }}>
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2}/><Controls position="bottom-left"/><MiniMap pannable zoomable position="bottom-right" nodeStrokeWidth={3}/>
          <div className="canvas-action"><button onClick={()=>fitView({padding:.18})}><Maximize2 size={15}/> Fit view</button></div>
        </ReactFlow>
      </div>
      <PropertiesPanel data={selectedNode?.data} onChange={updateSelected} onDelete={deleteSelected} onDuplicate={duplicateSelected}/>
    </main>
  </div>;
}
export default function App(){return <ReactFlowProvider><Designer/></ReactFlowProvider>}
