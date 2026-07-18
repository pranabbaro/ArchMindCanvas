import {
  AppWindow, Boxes, Cloud, Container, Database, Globe2, HardDrive, KeyRound,
  Layers3, Network, Router, Server, Shield, Split, Waypoints, Zap,
} from 'lucide-react';
import type { ResourceCategory, ResourceType } from './types';

type ResourceItem = {
  type: ResourceType;
  label: string;
  description: string;
  sku: string;
  category: ResourceCategory;
  icon: typeof Server;
};

export const categories: ResourceCategory[] = ['Networking', 'Compute', 'Web', 'Containers', 'Storage', 'Database', 'Security'];

export const resourceCatalog: ResourceItem[] = [
  { type: 'virtualNetwork', label: 'Virtual Network', description: 'Private Azure network boundary', sku: 'Standard', category: 'Networking', icon: Network },
  { type: 'subnet', label: 'Subnet', description: 'Network segment inside a VNet', sku: 'Standard', category: 'Networking', icon: Split },
  { type: 'networkSecurityGroup', label: 'Network Security Group', description: 'Inbound and outbound traffic rules', sku: 'Standard', category: 'Networking', icon: Shield },
  { type: 'publicIp', label: 'Public IP', description: 'Internet-routable IP address', sku: 'Standard', category: 'Networking', icon: Globe2 },
  { type: 'loadBalancer', label: 'Load Balancer', description: 'Layer 4 load balancing', sku: 'Standard', category: 'Networking', icon: Waypoints },
  { type: 'applicationGateway', label: 'Application Gateway', description: 'Layer 7 web traffic load balancer', sku: 'WAF_v2', category: 'Networking', icon: Router },
  { type: 'firewall', label: 'Azure Firewall', description: 'Managed cloud network firewall', sku: 'Standard', category: 'Security', icon: Shield },
  { type: 'virtualMachine', label: 'Virtual Machine', description: 'Azure compute virtual machine', sku: 'Standard_D2s_v5', category: 'Compute', icon: Server },
  { type: 'vmScaleSet', label: 'VM Scale Set', description: 'Autoscaling group of virtual machines', sku: 'Standard_D2s_v5', category: 'Compute', icon: Layers3 },
  { type: 'appService', label: 'App Service', description: 'Managed web application hosting', sku: 'P1v3', category: 'Web', icon: AppWindow },
  { type: 'functionApp', label: 'Function App', description: 'Serverless event-driven compute', sku: 'Consumption', category: 'Web', icon: Zap },
  { type: 'aks', label: 'AKS Cluster', description: 'Managed Kubernetes cluster', sku: 'Standard', category: 'Containers', icon: Boxes },
  { type: 'containerRegistry', label: 'Container Registry', description: 'Private container image registry', sku: 'Premium', category: 'Containers', icon: Container },
  { type: 'storageAccount', label: 'Storage Account', description: 'Object, file, queue and table storage', sku: 'Standard_LRS', category: 'Storage', icon: HardDrive },
  { type: 'sqlDatabase', label: 'SQL Database', description: 'Managed relational SQL database', sku: 'GeneralPurpose', category: 'Database', icon: Database },
  { type: 'cosmosDb', label: 'Cosmos DB', description: 'Globally distributed NoSQL database', sku: 'Serverless', category: 'Database', icon: Cloud },
  { type: 'keyVault', label: 'Key Vault', description: 'Secrets, certificates and key management', sku: 'Standard', category: 'Security', icon: KeyRound },
];

export const resourceMap = Object.fromEntries(resourceCatalog.map((item) => [item.type, item])) as Record<ResourceType, ResourceItem>;
