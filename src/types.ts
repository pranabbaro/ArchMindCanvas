import type { Edge, Node } from '@xyflow/react';

export type ResourceCategory = 'Networking' | 'Compute' | 'Storage' | 'Database' | 'Containers' | 'Security' | 'Web';
export type ResourceType =
  | 'virtualNetwork' | 'subnet' | 'networkSecurityGroup' | 'publicIp' | 'loadBalancer' | 'firewall'
  | 'virtualMachine' | 'vmScaleSet' | 'storageAccount' | 'sqlDatabase' | 'cosmosDb'
  | 'aks' | 'containerRegistry' | 'keyVault' | 'appService' | 'functionApp' | 'applicationGateway';

export type ArchitectureNodeData = {
  label: string; resourceType: ResourceType; description: string; region: string; sku: string;
  environment: 'Production' | 'Development' | 'Test' | 'Shared'; owner: string;
};
export type DrawingNodeData = {
  label: string;
  shape: 'rectangle' | 'triangle' | 'text';
  fill?: string;
  border?: string;
  textColor?: string;
  fontSize?: number;
};
export type ArchitectureNode = Node<ArchitectureNodeData, 'architecture' | 'container'>;
export type DrawingNode = Node<DrawingNodeData, 'drawing'>;
export type CanvasNode = ArchitectureNode | DrawingNode;
export type ConnectorStyle = 'straight' | 'smoothstep' | 'bezier' | 'dotted';
export type CanvasEdgeData = { connectorStyle?: ConnectorStyle; label?: string };
export type CanvasEdge = Edge<CanvasEdgeData>;

export type ValidationSeverity = 'critical' | 'warning' | 'info' | 'success';
export type ValidationFinding = { id: string; severity: ValidationSeverity; title: string; message: string; nodeId?: string };
