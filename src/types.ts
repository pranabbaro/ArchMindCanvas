import type { Edge, Node } from '@xyflow/react';

export type ResourceCategory = 'Governance' | 'Networking' | 'Compute' | 'Storage' | 'Database' | 'Containers' | 'Security' | 'Web' | 'Integration' | 'AI & Data' | 'Monitoring';
export type ResourceType =
  | 'tenant' | 'managementGroup' | 'subscription' | 'resourceGroup'
  | 'virtualNetwork' | 'subnet' | 'networkSecurityGroup' | 'routeTable' | 'publicIp' | 'privateEndpoint' | 'privateLink' | 'natGateway' | 'vpnGateway' | 'expressRoute' | 'loadBalancer' | 'applicationGateway' | 'frontDoor' | 'trafficManager' | 'firewall' | 'bastion' | 'dnsZone' | 'privateDnsZone' | 'virtualWan'
  | 'virtualMachine' | 'vmScaleSet' | 'availabilitySet' | 'dedicatedHost' | 'avd'
  | 'storageAccount' | 'blobStorage' | 'fileShare' | 'dataLake' | 'netAppFiles'
  | 'sqlDatabase' | 'sqlManagedInstance' | 'cosmosDb' | 'postgresql' | 'mysql' | 'redis'
  | 'aks' | 'containerRegistry' | 'containerApps' | 'containerInstances'
  | 'keyVault' | 'managedIdentity' | 'defenderForCloud' | 'sentinel'
  | 'appService' | 'functionApp' | 'staticWebApp'
  | 'apiManagement' | 'logicApps' | 'serviceBus' | 'eventGrid' | 'eventHubs'
  | 'dataFactory' | 'synapse' | 'databricks' | 'fabric' | 'azureOpenAI' | 'machineLearning'
  | 'monitor' | 'logAnalytics' | 'applicationInsights' | 'automation' | 'policy'
  | 'aiSearch'
  | 'microsoftFoundry'
  | 'foundryProject'
  | 'foundryModels'
  | 'foundryAgentService'
  | 'documentIntelligence'
  | 'contentSafety'
  | 'cognitiveServices'
  | 'botService';

export type TagMap = Record<string, string>;

export type ArchitectureNodeData = {
  label: string;
  resourceType: ResourceType;
  description: string;
  region: string;
  sku: string;
  environment: 'Production' | 'Development' | 'Test' | 'Shared';
  owner: string;
  tenantId?: string;
  managementGroup?: string;
  subscriptionName?: string;
  subscriptionId?: string;
  resourceGroup?: string;
  vnet?: string;
  subnet?: string;
  tags?: TagMap;
  inheritedTags?: TagMap;
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
export type ConnectorStyle = 'straight' | 'smoothstep' | 'bezier' | 'dotted' | 'dashed';
export type ArrowStyle = 'end' | 'start' | 'both' | 'none';
export type CanvasEdgeData = { connectorStyle?: ConnectorStyle; label?: string; protocol?: string; port?: string; connectionType?: string; arrowStyle?: ArrowStyle; routeX?: number; routeY?: number; routePoints?: {x:number;y:number}[]; labelX?: number; labelY?: number; strokeWidth?: number };
export type CanvasEdge = Edge<CanvasEdgeData>;

export type ValidationSeverity = 'critical' | 'warning' | 'info' | 'success';
export type ValidationFinding = { id: string; severity: ValidationSeverity; title: string; message: string; nodeId?: string };
