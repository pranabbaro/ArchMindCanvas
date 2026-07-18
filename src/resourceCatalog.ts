import {
  AppWindow, Boxes, Cloud, Container, Database, Globe2, HardDrive, KeyRound,
  Layers3, Network, Router, Server, Shield, Split, Waypoints, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ResourceCategory, ResourceType } from './types';

type ResourceItem = {
  type: ResourceType;
  label: string;
  description: string;
  sku: string;
  category: ResourceCategory;
  iconUrl: string;
  fallbackIcon: LucideIcon;
};

const iconBase = 'https://www.azureicons.com/static/images/icons';
const icon = (category: string, file: string) => `${iconBase}/${category}/svg/${file}.svg`;

export const categories: ResourceCategory[] = ['Networking', 'Compute', 'Web', 'Containers', 'Storage', 'Database', 'Security'];

export const resourceCatalog: ResourceItem[] = [
  { type: 'virtualNetwork', label: 'Virtual Network', description: 'Private Azure network boundary', sku: 'Standard', category: 'Networking', iconUrl: icon('Networking', 'Virtual-Networks'), fallbackIcon: Network },
  { type: 'subnet', label: 'Subnet', description: 'Network segment inside a VNet', sku: 'Standard', category: 'Networking', iconUrl: icon('Networking', 'Subnets'), fallbackIcon: Split },
  { type: 'networkSecurityGroup', label: 'Network Security Group', description: 'Inbound and outbound traffic rules', sku: 'Standard', category: 'Networking', iconUrl: icon('Networking', 'Network-Security-Groups'), fallbackIcon: Shield },
  { type: 'publicIp', label: 'Public IP', description: 'Internet-routable IP address', sku: 'Standard', category: 'Networking', iconUrl: icon('Networking', 'Public-IP-Addresses'), fallbackIcon: Globe2 },
  { type: 'loadBalancer', label: 'Load Balancer', description: 'Layer 4 load balancing', sku: 'Standard', category: 'Networking', iconUrl: icon('Networking', 'Load-Balancers'), fallbackIcon: Waypoints },
  { type: 'applicationGateway', label: 'Application Gateway', description: 'Layer 7 web traffic load balancer', sku: 'WAF_v2', category: 'Networking', iconUrl: icon('Networking', 'Application-Gateways'), fallbackIcon: Router },
  { type: 'firewall', label: 'Azure Firewall', description: 'Managed cloud network firewall', sku: 'Standard', category: 'Security', iconUrl: icon('Security', 'Firewalls'), fallbackIcon: Shield },
  { type: 'virtualMachine', label: 'Virtual Machine', description: 'Azure compute virtual machine', sku: 'Standard_D2s_v5', category: 'Compute', iconUrl: icon('Compute', 'Virtual-Machine'), fallbackIcon: Server },
  { type: 'vmScaleSet', label: 'VM Scale Set', description: 'Autoscaling group of virtual machines', sku: 'Standard_D2s_v5', category: 'Compute', iconUrl: icon('Compute', 'VM-Scale-Sets'), fallbackIcon: Layers3 },
  { type: 'appService', label: 'App Service', description: 'Managed web application hosting', sku: 'P1v3', category: 'Web', iconUrl: icon('App Services', 'App-Services'), fallbackIcon: AppWindow },
  { type: 'functionApp', label: 'Function App', description: 'Serverless event-driven compute', sku: 'Consumption', category: 'Web', iconUrl: icon('Compute', 'Function-Apps'), fallbackIcon: Zap },
  { type: 'aks', label: 'AKS Cluster', description: 'Managed Kubernetes cluster', sku: 'Standard', category: 'Containers', iconUrl: icon('Compute', 'Kubernetes-Services'), fallbackIcon: Boxes },
  { type: 'containerRegistry', label: 'Container Registry', description: 'Private container image registry', sku: 'Premium', category: 'Containers', iconUrl: icon('Containers', 'Container-Registries'), fallbackIcon: Container },
  { type: 'storageAccount', label: 'Storage Account', description: 'Object, file, queue and table storage', sku: 'Standard_LRS', category: 'Storage', iconUrl: icon('Storage', 'Storage-Accounts'), fallbackIcon: HardDrive },
  { type: 'sqlDatabase', label: 'SQL Database', description: 'Managed relational SQL database', sku: 'GeneralPurpose', category: 'Database', iconUrl: icon('Databases', 'SQL-Database'), fallbackIcon: Database },
  { type: 'cosmosDb', label: 'Cosmos DB', description: 'Globally distributed NoSQL database', sku: 'Serverless', category: 'Database', iconUrl: icon('Databases', 'Azure-Cosmos-DB'), fallbackIcon: Cloud },
  { type: 'keyVault', label: 'Key Vault', description: 'Secrets, certificates and key management', sku: 'Standard', category: 'Security', iconUrl: icon('Security', 'Key-Vaults'), fallbackIcon: KeyRound },
];

export const resourceMap = Object.fromEntries(resourceCatalog.map((item) => [item.type, item])) as Record<ResourceType, ResourceItem>;
