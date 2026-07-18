import type { Node } from '@xyflow/react';

export type ResourceCategory = 'Networking' | 'Compute' | 'Storage' | 'Database' | 'Containers' | 'Security' | 'Web';

export type ResourceType =
  | 'virtualNetwork' | 'subnet' | 'networkSecurityGroup' | 'publicIp' | 'loadBalancer' | 'firewall'
  | 'virtualMachine' | 'vmScaleSet'
  | 'storageAccount'
  | 'sqlDatabase' | 'cosmosDb'
  | 'aks' | 'containerRegistry'
  | 'keyVault'
  | 'appService' | 'functionApp' | 'applicationGateway';

export type ArchitectureNodeData = {
  label: string;
  resourceType: ResourceType;
  description: string;
  region: string;
  sku: string;
  environment: 'Production' | 'Development' | 'Test' | 'Shared';
  owner: string;
};

export type ArchitectureNode = Node<ArchitectureNodeData, 'architecture'>;
