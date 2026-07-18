import {
  AppWindow,
  Boxes,
  Database,
  HardDrive,
  KeyRound,
  Network,
  Server,
  Shield,
  Split,
  Waypoints,
} from 'lucide-react';
import type { ResourceType } from './types';

export const resourceCatalog: Array<{
  type: ResourceType;
  label: string;
  description: string;
  sku: string;
  icon: typeof Server;
}> = [
  { type: 'virtualNetwork', label: 'Virtual Network', description: 'Azure virtual network', sku: 'Standard', icon: Network },
  { type: 'subnet', label: 'Subnet', description: 'Network subnet', sku: 'Standard', icon: Split },
  { type: 'virtualMachine', label: 'Virtual Machine', description: 'Compute virtual machine', sku: 'Standard_D2s_v5', icon: Server },
  { type: 'storageAccount', label: 'Storage Account', description: 'Object and file storage', sku: 'Standard_LRS', icon: HardDrive },
  { type: 'sqlDatabase', label: 'SQL Database', description: 'Managed SQL database', sku: 'GeneralPurpose', icon: Database },
  { type: 'aks', label: 'AKS Cluster', description: 'Managed Kubernetes cluster', sku: 'Standard', icon: Boxes },
  { type: 'keyVault', label: 'Key Vault', description: 'Secrets and key management', sku: 'Standard', icon: KeyRound },
  { type: 'loadBalancer', label: 'Load Balancer', description: 'Layer 4 load balancing', sku: 'Standard', icon: Waypoints },
  { type: 'appService', label: 'App Service', description: 'Managed web application hosting', sku: 'P1v3', icon: AppWindow },
  { type: 'firewall', label: 'Azure Firewall', description: 'Managed network firewall', sku: 'Standard', icon: Shield },
];

export const resourceMap = Object.fromEntries(resourceCatalog.map((item) => [item.type, item]));
