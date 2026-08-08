import type { Edge, Node } from '@xyflow/react';

export type ResourceCategory = 'Governance' | 'Networking' | 'Compute' | 'Storage' | 'Database' | 'Containers' | 'Security' | 'Web' | 'Integration' | 'AI & Data' | 'Monitoring';
export type ResourceType =
  'tenant'
  | 'managementGroup'
  | 'subscription'
  | 'resourceGroup'
  | 'virtualNetwork'
  | 'subnet'
  | 'networkSecurityGroup'
  | 'routeTable'
  | 'publicIp'
  | 'privateEndpoint'
  | 'privateLink'
  | 'natGateway'
  | 'vpnGateway'
  | 'expressRoute'
  | 'loadBalancer'
  | 'applicationGateway'
  | 'frontDoor'
  | 'trafficManager'
  | 'firewall'
  | 'bastion'
  | 'dnsZone'
  | 'privateDnsZone'
  | 'virtualWan'
  | 'virtualMachine'
  | 'vmScaleSet'
  | 'availabilitySet'
  | 'dedicatedHost'
  | 'avd'
  | 'storageAccount'
  | 'blobStorage'
  | 'fileShare'
  | 'dataLake'
  | 'netAppFiles'
  | 'sqlDatabase'
  | 'sqlManagedInstance'
  | 'cosmosDb'
  | 'postgresql'
  | 'mysql'
  | 'redis'
  | 'aks'
  | 'containerRegistry'
  | 'containerApps'
  | 'containerInstances'
  | 'keyVault'
  | 'managedIdentity'
  | 'defenderForCloud'
  | 'sentinel'
  | 'appService'
  | 'functionApp'
  | 'staticWebApp'
  | 'apiManagement'
  | 'logicApps'
  | 'serviceBus'
  | 'eventGrid'
  | 'eventHubs'
  | 'dataFactory'
  | 'synapse'
  | 'databricks'
  | 'fabric'
  | 'azureOpenAI'
  | 'machineLearning'
  | 'monitor'
  | 'logAnalytics'
  | 'applicationInsights'
  | 'automation'
  | 'policy'
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

export type TerraformValueType = 'string' | 'number' | 'bool' | 'list(string)' | 'map(string)' | 'any';
export type VariableScope = 'organization' | 'project' | 'environment' | 'architecture';
export type WorkspaceScope = {
  id:string;
  name:string;
  variables:VariableDefinition[];
  locals:LocalDefinition[];
};
export type VariableDefinition = {
  name:string;
  type:TerraformValueType;
  defaultValue?:string|number|boolean;
  description?:string;
  sensitive?:boolean;
  nullable?:boolean;
  scope?:VariableScope;
};
export type LocalDefinition = {
  name:string;
  value:string;
  description?:string;
  scope?:VariableScope;
};

export type ResourceMode = 'create' | 'existing' | 'import';
export type PropertyValueSource = 'literal' | 'variable' | 'resource' | 'data' | 'local' | 'moduleOutput';

export type PropertyBinding = {
  source: PropertyValueSource;
  variableName?: string;
  targetNodeId?: string;
  targetAttribute?: string;
  dataSourceType?: string;
  dataSourceName?: string;
  dataAttribute?: string;
  localName?: string;
  moduleName?: string;
  moduleOutput?: string;
};

export type ExistingResourceReference = {
  lookupType: 'name' | 'resourceId';
  name?: string;
  resourceId?: string;
};


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
  properties?: Record<string, string | number | boolean>;
  resourceMode?: ResourceMode;
  existingResource?: ExistingResourceReference;
  bindings?: Record<string, PropertyBinding>;
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
