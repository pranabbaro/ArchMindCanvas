import { useCallback, useMemo, useRef, useState } from 'react';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
} from '@xyflow/react';
import { Download, FolderOpen, RotateCcw, Save, UploadCloud } from 'lucide-react';
import ArchitectureNodeComponent from './components/ArchitectureNode';
import PropertiesPanel from './components/PropertiesPanel';
import Sidebar from './components/Sidebar';
import { resourceMap } from './resourceCatalog';
import type { ArchitectureNode, ResourceType } from './types';

const STORAGE_KEY = 'archmindcanvas-v1';

const initialNodes: ArchitectureNode[] = [
  {
    id: 'welcome-vnet',
    type: 'architecture',
    position: { x: 280, y: 160 },
    data: {
      label: 'Production VNet',
      resourceType: 'virtualNetwork',
      description: 'Example resource. Drag more resources from the left panel.',
      region: 'Central India',
      sku: 'Standard',
    },
  },
  {
    id: 'welcome-vm',
    type: 'architecture',
    position: { x: 560, y: 160 },
    data: {
      label: 'Application VM',
      resourceType: 'virtualMachine',
      description: 'Example virtual machine',
      region: 'Central India',
      sku: 'Standard_D2s_v5',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'welcome-edge', source: 'welcome-vnet', target: 'welcome-vm', animated: true },
];

function Designer() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchitectureNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();

  const nodeTypes = useMemo(() => ({ architecture: ArchitectureNodeComponent }), []);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((existing) => addEdge({ ...connection, animated: true }, existing)),
    [setEdges],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/cloud-resource') as ResourceType;
      if (!type || !resourceMap[type]) return;
      const item = resourceMap[type];
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const id = `${type}-${Date.now()}`;
      const newNode: ArchitectureNode = {
        id,
        type: 'architecture',
        position,
        data: {
          label: item.label,
          resourceType: type,
          description: item.description,
          region: 'Central India',
          sku: item.sku,
        },
      };
      setNodes((current) => [...current, newNode]);
      setSelectedNodeId(id);
    },
    [screenToFlowPosition, setNodes],
  );

  const updateSelected = (updates: Partial<ArchitectureNode['data']>) => {
    if (!selectedNodeId) return;
    setNodes((current) =>
      current.map((node) => node.id === selectedNodeId ? { ...node, data: { ...node.data, ...updates } } : node),
    );
  };

  const deleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) => current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId(undefined);
  };

  const saveDesign = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    window.alert('Design saved in this browser.');
  };

  const loadDesign = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return window.alert('No saved design found in this browser.');
    try {
      const parsed = JSON.parse(saved) as { nodes: ArchitectureNode[]; edges: Edge[] };
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
      setSelectedNodeId(undefined);
      setTimeout(() => fitView({ padding: 0.2 }), 0);
    } catch {
      window.alert('The saved design could not be loaded.');
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ version: 1, nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'archmindcanvas-design.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text()) as { nodes: ArchitectureNode[]; edges: Edge[] };
        setNodes(parsed.nodes || []);
        setEdges(parsed.edges || []);
        setSelectedNodeId(undefined);
        setTimeout(() => fitView({ padding: 0.2 }), 0);
      } catch {
        window.alert('Invalid architecture JSON file.');
      }
    };
    input.click();
  };

  const resetDesign = () => {
    if (!window.confirm('Clear the canvas and start again?')) return;
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(undefined);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">ArchMindCanvas</div>
          <div className="subtitle">Visual cloud design workspace</div>
        </div>
        <div className="toolbar">
          <button onClick={saveDesign}><Save size={16} /> Save</button>
          <button onClick={loadDesign}><FolderOpen size={16} /> Load</button>
          <button onClick={importJson}><UploadCloud size={16} /> Import</button>
          <button onClick={exportJson}><Download size={16} /> Export JSON</button>
          <button onClick={resetDesign}><RotateCcw size={16} /> New</button>
        </div>
      </header>

      <main className="workspace">
        <Sidebar />
        <div
          className="canvas-wrapper"
          ref={wrapperRef}
          onDrop={onDrop}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(undefined)}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{ animated: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
        <PropertiesPanel data={selectedNode?.data} onChange={updateSelected} onDelete={deleteSelected} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Designer />
    </ReactFlowProvider>
  );
}
