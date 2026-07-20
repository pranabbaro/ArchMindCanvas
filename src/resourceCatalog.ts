import {
  AppWindow, Boxes, Cloud, Container, Database, Globe2, HardDrive, KeyRound, Layers3, Network, Router, Server, Shield, Split, Waypoints, Zap,
  Building2, FolderTree, Landmark, ShieldCheck, Route, LockKeyhole, Cable, Gauge, Workflow, RadioTower, MonitorCog, Bot, BrainCircuit, Activity, SearchCheck, CircleDot, FileStack
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ResourceCategory, ResourceType } from './types';

type ResourceItem = { type: ResourceType; label: string; description: string; sku: string; category: ResourceCategory; iconUrl: string; fallbackIcon: LucideIcon; container?: boolean };
const azureArchitectureBase = 'https://cdn.jsdelivr.net/gh/Azure/bicep@main/src/vscode-bicep-ui/packages/components/assets/azure-architecture-icons';
const officialIcon = (folder: string, file: string) => `${azureArchitectureBase}/${folder}/${file}`;
const legacyBase = 'https://www.azureicons.com/static/images/icons';
const legacyIcon = (category: string, file: string) => `${legacyBase}/${category}/svg/${file}.svg`;
const empty = '';
export const categories: ResourceCategory[] = ['Governance','Networking','Compute','Web','Containers','Storage','Database','Security','Integration','AI & Data','Monitoring'];
export const resourceCatalog: ResourceItem[] = [
  {type:'tenant',label:'Microsoft Entra Tenant',description:'Identity tenant boundary',sku:'Tenant',category:'Governance',iconUrl:legacyIcon('Identity','Azure-Active-Directory'),fallbackIcon:Building2,container:true},
  {type:'managementGroup',label:'Management Group',description:'Azure governance hierarchy',sku:'Management Group',category:'Governance',iconUrl:legacyIcon('Management + Governance','Management-Groups'),fallbackIcon:FolderTree,container:true},
  {type:'subscription',label:'Azure Subscription',description:'Billing and resource boundary',sku:'Subscription',category:'Governance',iconUrl:legacyIcon('Management + Governance','Subscriptions'),fallbackIcon:Landmark,container:true},
  {type:'resourceGroup',label:'Resource Group',description:'Lifecycle boundary for Azure resources',sku:'Resource Group',category:'Governance',iconUrl:legacyIcon('Management + Governance','Resource-Groups'),fallbackIcon:FolderTree,container:true},
  {type:'virtualNetwork',label:'Virtual Network',description:'Private Azure network boundary',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10061-icon-service-Virtual-Networks.svg'),fallbackIcon:Network,container:true},
  {type:'subnet',label:'Subnet',description:'Network segment inside a VNet',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10061-icon-service-Virtual-Networks.svg'),fallbackIcon:Split,container:true},
  {type:'networkSecurityGroup',label:'Network Security Group',description:'Inbound and outbound traffic rules',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10067-icon-service-Network-Security-Groups.svg'),fallbackIcon:Shield},
  {type:'routeTable',label:'Route Table',description:'Custom network routes',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10082-icon-service-Route-Tables.svg'),fallbackIcon:Route},
  {type:'publicIp',label:'Public IP',description:'Internet-routable IP address',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10069-icon-service-Public-IP-Addresses.svg'),fallbackIcon:Globe2},
  {type:'privateEndpoint',label:'Private Endpoint',description:'Private IP endpoint to Azure PaaS',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','00427-icon-service-Private-Link.svg'),fallbackIcon:LockKeyhole},
  {type:'privateLink',label:'Private Link',description:'Private connectivity service',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','00427-icon-service-Private-Link.svg'),fallbackIcon:Cable},
  {type:'natGateway',label:'NAT Gateway',description:'Managed outbound internet connectivity',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10310-icon-service-NAT.svg'),fallbackIcon:Router},
  {type:'vpnGateway',label:'VPN Gateway',description:'Encrypted cross-premises connectivity',sku:'VpnGw2AZ',category:'Networking',iconUrl:officialIcon('networking','10063-icon-service-Virtual-Network-Gateways.svg'),fallbackIcon:Shield},
  {type:'expressRoute',label:'ExpressRoute',description:'Private dedicated connectivity',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10079-icon-service-ExpressRoute-Circuits.svg'),fallbackIcon:Cable},
  {type:'loadBalancer',label:'Load Balancer',description:'Layer 4 load balancing',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10062-icon-service-Load-Balancers.svg'),fallbackIcon:Waypoints},
  {type:'applicationGateway',label:'Application Gateway',description:'Layer 7 web traffic load balancer',sku:'WAF_v2',category:'Networking',iconUrl:officialIcon('networking','10076-icon-service-Application-Gateways.svg'),fallbackIcon:Router},
  {type:'frontDoor',label:'Azure Front Door',description:'Global application delivery',sku:'Premium',category:'Networking',iconUrl:officialIcon('networking','10073-icon-service-Front-Doors.svg'),fallbackIcon:Globe2},
  {type:'trafficManager',label:'Traffic Manager',description:'DNS-based global traffic routing',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10065-icon-service-Traffic-Manager-Profiles.svg'),fallbackIcon:Route},
  {type:'firewall',label:'Azure Firewall',description:'Managed cloud network firewall',sku:'Premium',category:'Security',iconUrl:officialIcon('networking','10084-icon-service-Firewalls.svg'),fallbackIcon:Shield},
  {type:'bastion',label:'Azure Bastion',description:'Secure browser-based VM access',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','02422-icon-service-Bastions.svg'),fallbackIcon:ShieldCheck},
  {type:'dnsZone',label:'DNS Zone',description:'Public DNS hosting',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10064-icon-service-DNS-Zones.svg'),fallbackIcon:Globe2},
  {type:'privateDnsZone',label:'Private DNS Zone',description:'Private DNS name resolution',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','02882-icon-service-DNS-Private-Resolver.svg'),fallbackIcon:Network},
  {type:'virtualWan',label:'Virtual WAN',description:'Global transit network service',sku:'Standard',category:'Networking',iconUrl:officialIcon('networking','10353-icon-service-Virtual-WANs.svg'),fallbackIcon:Network},
  {type:'virtualMachine',label:'Virtual Machine',description:'Azure compute virtual machine',sku:'Standard_D2s_v5',category:'Compute',iconUrl:officialIcon('compute','10021-icon-service-Virtual-Machine.svg'),fallbackIcon:Server},
  {type:'vmScaleSet',label:'VM Scale Set',description:'Autoscaling group of virtual machines',sku:'Standard_D2s_v5',category:'Compute',iconUrl:officialIcon('compute','10034-icon-service-VM-Scale-Sets.svg'),fallbackIcon:Layers3},
  {type:'availabilitySet',label:'Availability Set',description:'VM fault and update domain grouping',sku:'Standard',category:'Compute',iconUrl:officialIcon('compute','10025-icon-service-Availability-Sets.svg'),fallbackIcon:Layers3},
  {type:'dedicatedHost',label:'Dedicated Host',description:'Dedicated physical server host',sku:'DSv3',category:'Compute',iconUrl:empty,fallbackIcon:Server},
  {type:'avd',label:'Azure Virtual Desktop',description:'Cloud desktop and app virtualization',sku:'Pooled',category:'Compute',iconUrl:empty,fallbackIcon:MonitorCog},
  {type:'appService',label:'App Service',description:'Managed web application hosting',sku:'P1v3',category:'Web',iconUrl:officialIcon('app-services','10035-icon-service-App-Services.svg'),fallbackIcon:AppWindow},
  {type:'functionApp',label:'Function App',description:'Serverless event-driven compute',sku:'Consumption',category:'Web',iconUrl:icon('Compute','Function-Apps'),fallbackIcon:Zap},
  {type:'staticWebApp',label:'Static Web App',description:'Managed static web application hosting',sku:'Standard',category:'Web',iconUrl:officialIcon('app-services','10035-icon-service-App-Services.svg'),fallbackIcon:AppWindow},
  {type:'aks',label:'AKS Cluster',description:'Managed Kubernetes cluster',sku:'Standard',category:'Containers',iconUrl:officialIcon('compute','10023-icon-service-Kubernetes-Services.svg'),fallbackIcon:Boxes},
  {type:'containerRegistry',label:'Container Registry',description:'Private container image registry',sku:'Premium',category:'Containers',iconUrl:officialIcon('containers','10105-icon-service-Container-Registries.svg'),fallbackIcon:Container},
  {type:'containerApps',label:'Container Apps',description:'Serverless container platform',sku:'Consumption',category:'Containers',iconUrl:officialIcon('containers','02884-icon-service-Worker-Container-App.svg'),fallbackIcon:Container},
  {type:'containerInstances',label:'Container Instances',description:'Run containers without managing VMs',sku:'Standard',category:'Containers',iconUrl:officialIcon('containers','10104-icon-service-Container-Instances.svg'),fallbackIcon:Container},
  {type:'storageAccount',label:'Storage Account',description:'Object, file, queue and table storage',sku:'Standard_LRS',category:'Storage',iconUrl:officialIcon('storage','10086-icon-service-Storage-Accounts.svg'),fallbackIcon:HardDrive},
  {type:'blobStorage',label:'Blob Storage',description:'Object storage for unstructured data',sku:'Hot',category:'Storage',iconUrl:officialIcon('storage','10086-icon-service-Storage-Accounts.svg'),fallbackIcon:HardDrive},
  {type:'fileShare',label:'Azure Files',description:'Managed SMB/NFS file shares',sku:'Premium',category:'Storage',iconUrl:officialIcon('storage','10086-icon-service-Storage-Accounts.svg'),fallbackIcon:FileStack},
  {type:'dataLake',label:'Data Lake Storage',description:'Analytics-optimized data lake storage',sku:'Standard_LRS',category:'Storage',iconUrl:officialIcon('storage','10086-icon-service-Storage-Accounts.svg'),fallbackIcon:HardDrive},
  {type:'netAppFiles',label:'Azure NetApp Files',description:'Enterprise file storage service',sku:'Premium',category:'Storage',iconUrl:officialIcon('storage','10096-icon-service-Azure-NetApp-Files.svg'),fallbackIcon:HardDrive},
  {type:'sqlDatabase',label:'SQL Database',description:'Managed relational SQL database',sku:'GeneralPurpose',category:'Database',iconUrl:legacyIcon('Databases','SQL-Database'),fallbackIcon:Database},
  {type:'sqlManagedInstance',label:'SQL Managed Instance',description:'Managed SQL Server instance',sku:'GeneralPurpose',category:'Database',iconUrl:empty,fallbackIcon:Database},
  {type:'cosmosDb',label:'Cosmos DB',description:'Globally distributed NoSQL database',sku:'Serverless',category:'Database',iconUrl:legacyIcon('Databases','Azure-Cosmos-DB'),fallbackIcon:Cloud},
  {type:'postgresql',label:'Azure Database for PostgreSQL',description:'Managed PostgreSQL database',sku:'GeneralPurpose',category:'Database',iconUrl:empty,fallbackIcon:Database},
  {type:'mysql',label:'Azure Database for MySQL',description:'Managed MySQL database',sku:'GeneralPurpose',category:'Database',iconUrl:empty,fallbackIcon:Database},
  {type:'redis',label:'Azure Managed Redis',description:'Managed in-memory cache',sku:'Standard',category:'Database',iconUrl:empty,fallbackIcon:Database},
  {type:'keyVault',label:'Key Vault',description:'Secrets, certificates and key management',sku:'Standard',category:'Security',iconUrl:officialIcon('security','10245-icon-service-Key-Vaults.svg'),fallbackIcon:KeyRound},
  {type:'managedIdentity',label:'Managed Identity',description:'Passwordless Azure service identity',sku:'User Assigned',category:'Security',iconUrl:officialIcon('identity','10227-icon-service-Managed-Identities.svg'),fallbackIcon:KeyRound},
  {type:'defenderForCloud',label:'Defender for Cloud',description:'Cloud security posture and workload protection',sku:'Defender',category:'Security',iconUrl:officialIcon('security','10241-icon-service-Microsoft-Defender-for-Cloud.svg'),fallbackIcon:ShieldCheck},
  {type:'sentinel',label:'Microsoft Sentinel',description:'Cloud-native SIEM and SOAR',sku:'Analytics',category:'Security',iconUrl:officialIcon('security','10248-icon-service-Azure-Sentinel.svg'),fallbackIcon:Shield},
  {type:'apiManagement',label:'API Management',description:'API gateway and management platform',sku:'Premium',category:'Integration',iconUrl:officialIcon('app-services','10042-icon-service-API-Management-Services.svg'),fallbackIcon:Workflow},
  {type:'logicApps',label:'Logic Apps',description:'Workflow integration and automation',sku:'Consumption',category:'Integration',iconUrl:empty,fallbackIcon:Workflow},
  {type:'serviceBus',label:'Service Bus',description:'Enterprise message broker',sku:'Premium',category:'Integration',iconUrl:empty,fallbackIcon:RadioTower},
  {type:'eventGrid',label:'Event Grid',description:'Event routing service',sku:'Standard',category:'Integration',iconUrl:empty,fallbackIcon:Zap},
  {type:'eventHubs',label:'Event Hubs',description:'Streaming ingestion service',sku:'Standard',category:'Integration',iconUrl:empty,fallbackIcon:RadioTower},
  {type:'dataFactory',label:'Data Factory',description:'Cloud data integration service',sku:'Standard',category:'AI & Data',iconUrl:empty,fallbackIcon:Workflow},
  {type:'synapse',label:'Synapse Analytics',description:'Enterprise analytics service',sku:'DW',category:'AI & Data',iconUrl:empty,fallbackIcon:Database},
  {type:'databricks',label:'Azure Databricks',description:'Lakehouse data and AI platform',sku:'Premium',category:'AI & Data',iconUrl:empty,fallbackIcon:BrainCircuit},
  {type:'fabric',label:'Microsoft Fabric',description:'Unified analytics platform',sku:'F64',category:'AI & Data',iconUrl:empty,fallbackIcon:Layers3},
  {type:'azureOpenAI',label:'Azure OpenAI',description:'Enterprise generative AI models',sku:'Standard',category:'AI & Data',iconUrl:empty,fallbackIcon:Bot},
  {type:'machineLearning',label:'Azure Machine Learning',description:'ML development and operations',sku:'Workspace',category:'AI & Data',iconUrl:empty,fallbackIcon:BrainCircuit},
  {type:'monitor',label:'Azure Monitor',description:'Unified monitoring and observability',sku:'Standard',category:'Monitoring',iconUrl:empty,fallbackIcon:Activity},
  {type:'logAnalytics',label:'Log Analytics Workspace',description:'Central log analytics workspace',sku:'PerGB2018',category:'Monitoring',iconUrl:empty,fallbackIcon:SearchCheck},
  {type:'applicationInsights',label:'Application Insights',description:'Application performance monitoring',sku:'Workspace-based',category:'Monitoring',iconUrl:empty,fallbackIcon:Gauge},
  {type:'automation',label:'Automation Account',description:'Cloud automation and configuration',sku:'Standard',category:'Monitoring',iconUrl:empty,fallbackIcon:MonitorCog},
  {type:'policy',label:'Azure Policy',description:'Governance and compliance rules',sku:'Standard',category:'Governance',iconUrl:legacyIcon('Management + Governance','Policy'),fallbackIcon:ShieldCheck},
];
export const resourceMap = Object.fromEntries(resourceCatalog.map(i=>[i.type,i])) as Record<ResourceType,ResourceItem>;
export const isContainerType = (type: ResourceType) => Boolean(resourceMap[type]?.container);
