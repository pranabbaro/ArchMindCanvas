import type { Node } from '@xyflow/react';

export type ResourceType =
  | 'virtualNetwork'
  | 'subnet'
  | 'virtualMachine'
  | 'storageAccount'
  | 'sqlDatabase'
  | 'aks'
  | 'keyVault'
  | 'loadBalancer'
  | 'appService'
  | 'firewall';

export type ArchitectureNodeData = {
  label: string;
  resourceType: ResourceType;
  description: string;
  region: string;
  sku: string;
};

export type ArchitectureNode = Node<ArchitectureNodeData, 'architecture'>;
