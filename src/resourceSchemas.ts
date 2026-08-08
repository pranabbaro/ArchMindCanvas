import type { ResourceType } from './types';

export type PropertyField = {
  key: string;
  label: string;
  type: 'text'|'select'|'number'|'boolean'|'textarea'|'resourceRef';
  group: string;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  defaultValue?: string|number|boolean;
  options?: string[];
  terraformProperty?: string;
  help?: string;
  allowedResourceTypes?: ResourceType[];
  referenceAttribute?: string;
};

const regions=['East US','East US 2','West Europe','North Europe','Germany West Central','Central India','South India','Southeast Asia','Australia East'];

const common=(includeRegion=true):PropertyField[]=>[
  ...(includeRegion?[{key:'region',label:'Location',type:'select' as const,group:'Main parameters',required:true,options:regions,terraformProperty:'location'}]:[]),
  {key:'owner',label:'Owner',type:'text',group:'Metadata',placeholder:'Platform team'},
];


const relationshipFields:Partial<Record<ResourceType,PropertyField[]>>={
  virtualNetwork:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
  ],
  subnet:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'vnetRef',label:'Virtual Network',type:'resourceRef',group:'Relationships',allowedResourceTypes:['virtualNetwork'],referenceAttribute:'name'},
  ],
  virtualMachine:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'vnetRef',label:'Virtual Network',type:'resourceRef',group:'Relationships',allowedResourceTypes:['virtualNetwork'],referenceAttribute:'name'},
    {key:'subnetRef',label:'Subnet',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
    {key:'managedIdentityRef',label:'Managed Identity',type:'resourceRef',group:'Identity',allowedResourceTypes:['managedIdentity'],referenceAttribute:'id'},
    {key:'keyVaultRef',label:'Key Vault',type:'resourceRef',group:'Identity',allowedResourceTypes:['keyVault'],referenceAttribute:'id'},
  ],
  vmScaleSet:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'vnetRef',label:'Virtual Network',type:'resourceRef',group:'Relationships',allowedResourceTypes:['virtualNetwork'],referenceAttribute:'name'},
    {key:'subnetRef',label:'Subnet',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
  ],
  storageAccount:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'subnetRef',label:'Allowed Subnet',type:'resourceRef',group:'Networking',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
    {key:'privateEndpointRef',label:'Private Endpoint',type:'resourceRef',group:'Networking',allowedResourceTypes:['privateEndpoint'],referenceAttribute:'id'},
  ],
  blobStorage:[
    {key:'storageAccountRef',label:'Storage Account',type:'resourceRef',group:'Relationships',allowedResourceTypes:['storageAccount'],referenceAttribute:'name'},
  ],
  fileShare:[
    {key:'storageAccountRef',label:'Storage Account',type:'resourceRef',group:'Relationships',allowedResourceTypes:['storageAccount'],referenceAttribute:'name'},
  ],
  sqlDatabase:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'privateEndpointRef',label:'Private Endpoint',type:'resourceRef',group:'Networking',allowedResourceTypes:['privateEndpoint'],referenceAttribute:'id'},
    {key:'keyVaultRef',label:'Key Vault',type:'resourceRef',group:'Security',allowedResourceTypes:['keyVault'],referenceAttribute:'id'},
  ],
  sqlManagedInstance:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'vnetRef',label:'Virtual Network',type:'resourceRef',group:'Networking',allowedResourceTypes:['virtualNetwork'],referenceAttribute:'name'},
    {key:'subnetRef',label:'Subnet',type:'resourceRef',group:'Networking',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
  ],
  appService:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'subnetRef',label:'VNet Integration Subnet',type:'resourceRef',group:'Networking',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
    {key:'keyVaultRef',label:'Key Vault',type:'resourceRef',group:'Identity',allowedResourceTypes:['keyVault'],referenceAttribute:'id'},
    {key:'managedIdentityRef',label:'Managed Identity',type:'resourceRef',group:'Identity',allowedResourceTypes:['managedIdentity'],referenceAttribute:'id'},
  ],
  functionApp:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'storageAccountRef',label:'Storage Account',type:'resourceRef',group:'Relationships',allowedResourceTypes:['storageAccount'],referenceAttribute:'name'},
    {key:'subnetRef',label:'Integration Subnet',type:'resourceRef',group:'Networking',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
    {key:'keyVaultRef',label:'Key Vault',type:'resourceRef',group:'Identity',allowedResourceTypes:['keyVault'],referenceAttribute:'id'},
  ],
  keyVault:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'privateEndpointRef',label:'Private Endpoint',type:'resourceRef',group:'Networking',allowedResourceTypes:['privateEndpoint'],referenceAttribute:'id'},
    {key:'managedIdentityRef',label:'Managed Identity',type:'resourceRef',group:'Access configuration',allowedResourceTypes:['managedIdentity'],referenceAttribute:'id'},
  ],
  aks:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'vnetRef',label:'Virtual Network',type:'resourceRef',group:'Networking',allowedResourceTypes:['virtualNetwork'],referenceAttribute:'name'},
    {key:'subnetRef',label:'Node Subnet',type:'resourceRef',group:'Networking',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
    {key:'acrRef',label:'Container Registry',type:'resourceRef',group:'Integrations',allowedResourceTypes:['containerRegistry'],referenceAttribute:'id'},
    {key:'keyVaultRef',label:'Key Vault',type:'resourceRef',group:'Integrations',allowedResourceTypes:['keyVault'],referenceAttribute:'id'},
    {key:'logAnalyticsRef',label:'Log Analytics Workspace',type:'resourceRef',group:'Monitoring',allowedResourceTypes:['logAnalytics'],referenceAttribute:'id'},
  ],
  containerApps:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'subnetRef',label:'Infrastructure Subnet',type:'resourceRef',group:'Networking',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
    {key:'acrRef',label:'Container Registry',type:'resourceRef',group:'Integrations',allowedResourceTypes:['containerRegistry'],referenceAttribute:'id'},
    {key:'logAnalyticsRef',label:'Log Analytics Workspace',type:'resourceRef',group:'Monitoring',allowedResourceTypes:['logAnalytics'],referenceAttribute:'id'},
  ],
  privateEndpoint:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'vnetRef',label:'Virtual Network',type:'resourceRef',group:'Networking',allowedResourceTypes:['virtualNetwork'],referenceAttribute:'name'},
    {key:'subnetRef',label:'Subnet',type:'resourceRef',group:'Networking',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
    {key:'targetResourceRef',label:'Target Azure Resource',type:'resourceRef',group:'Main parameters',allowedResourceTypes:['storageAccount','keyVault','sqlDatabase','sqlManagedInstance','appService','functionApp','containerRegistry','azureOpenAI','aiSearch','cosmosDb'],referenceAttribute:'id'},
    {key:'privateDnsZoneRef',label:'Private DNS Zone',type:'resourceRef',group:'DNS',allowedResourceTypes:['privateDnsZone'],referenceAttribute:'id'},
  ],
  applicationGateway:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'subnetRef',label:'Gateway Subnet',type:'resourceRef',group:'Networking',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
    {key:'publicIpRef',label:'Public IP',type:'resourceRef',group:'Frontend',allowedResourceTypes:['publicIp'],referenceAttribute:'id'},
  ],
  firewall:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'subnetRef',label:'AzureFirewallSubnet',type:'resourceRef',group:'Networking',allowedResourceTypes:['subnet'],referenceAttribute:'id'},
    {key:'publicIpRef',label:'Public IP',type:'resourceRef',group:'Networking',allowedResourceTypes:['publicIp'],referenceAttribute:'id'},
  ],
  azureOpenAI:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'privateEndpointRef',label:'Private Endpoint',type:'resourceRef',group:'Networking',allowedResourceTypes:['privateEndpoint'],referenceAttribute:'id'},
    {key:'managedIdentityRef',label:'Managed Identity',type:'resourceRef',group:'Identity',allowedResourceTypes:['managedIdentity'],referenceAttribute:'id'},
  ],
  aiSearch:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'privateEndpointRef',label:'Private Endpoint',type:'resourceRef',group:'Networking',allowedResourceTypes:['privateEndpoint'],referenceAttribute:'id'},
    {key:'managedIdentityRef',label:'Managed Identity',type:'resourceRef',group:'Identity',allowedResourceTypes:['managedIdentity'],referenceAttribute:'id'},
  ],
  logAnalytics:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
  ],
  applicationInsights:[
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
    {key:'logAnalyticsRef',label:'Log Analytics Workspace',type:'resourceRef',group:'Monitoring',allowedResourceTypes:['logAnalytics'],referenceAttribute:'id'},
  ],
};

const governanceTypes:ResourceType[]=['tenant','managementGroup','subscription','resourceGroup'];
const genericRelationshipFields=(type:ResourceType):PropertyField[]=>{
  if(governanceTypes.includes(type))return [];
  if(relationshipFields[type])return relationshipFields[type]!;
  return [
    {key:'subscriptionRef',label:'Subscription',type:'resourceRef',group:'Relationships',allowedResourceTypes:['subscription'],referenceAttribute:'id'},
    {key:'resourceGroupRef',label:'Resource Group',type:'resourceRef',group:'Relationships',allowedResourceTypes:['resourceGroup'],referenceAttribute:'name'},
  ];
};

const schemas:Partial<Record<ResourceType,PropertyField[]>>={
  tenant:[
    {key:'tenantId',label:'Tenant ID',type:'text',group:'Main parameters',placeholder:'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'},
  ],
  managementGroup:[
    {key:'displayName',label:'Display name',type:'text',group:'Main parameters'},
    {key:'managementGroupId',label:'Management group ID',type:'text',group:'Main parameters'},
  ],
  subscription:[
    {key:'subscriptionName',label:'Subscription name',type:'text',group:'Main parameters',required:true},
    {key:'subscriptionId',label:'Subscription ID',type:'text',group:'Main parameters',placeholder:'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'},
    {key:'billingScope',label:'Billing scope',type:'text',group:'Advanced'},
  ],
  resourceGroup:[
    {key:'region',label:'Location',type:'select',group:'Main parameters',required:true,options:regions,terraformProperty:'location'},
    {key:'managedBy',label:'Managed by',type:'text',group:'Advanced',terraformProperty:'managed_by'},
  ],
  virtualNetwork:[
    ...common(),
    {key:'addressSpace',label:'Address space',type:'text',group:'Main parameters',required:true,defaultValue:'10.0.0.0/16',terraformProperty:'address_space',placeholder:'10.0.0.0/16'},
    {key:'dnsServers',label:'DNS servers',type:'text',group:'Networking',placeholder:'10.0.0.4, 10.0.0.5',terraformProperty:'dns_servers'},
    {key:'ddosProtection',label:'DDoS Protection',type:'boolean',group:'Security',defaultValue:false},
    {key:'encryption',label:'VNet encryption',type:'boolean',group:'Security',defaultValue:false},
  ],
  subnet:[
    {key:'addressPrefix',label:'Address prefix',type:'text',group:'Main parameters',required:true,defaultValue:'10.0.1.0/24',terraformProperty:'address_prefixes'},
    {key:'privateEndpointPolicies',label:'Private endpoint network policies',type:'select',group:'Networking',options:['Enabled','Disabled'],defaultValue:'Enabled'},
    {key:'serviceEndpoints',label:'Service endpoints',type:'text',group:'Networking',placeholder:'Microsoft.Storage, Microsoft.KeyVault'},
    {key:'delegation',label:'Subnet delegation',type:'text',group:'Advanced',placeholder:'Microsoft.Web/serverFarms'},
  ],
  virtualMachine:[
    ...common(),
    {key:'vmSize',label:'VM size',type:'text',group:'Compute',required:true,defaultValue:'Standard_D2s_v5',terraformProperty:'size'},
    {key:'computerName',label:'Computer name',type:'text',group:'Compute'},
    {key:'adminUsername',label:'Admin username',type:'text',group:'Compute',defaultValue:'azureadmin'},
    {key:'zone',label:'Availability zone',type:'select',group:'Availability',options:['None','1','2','3'],defaultValue:'None',terraformProperty:'zone'},
    {key:'imagePublisher',label:'Image publisher',type:'text',group:'Image',defaultValue:'MicrosoftWindowsServer'},
    {key:'imageOffer',label:'Image offer',type:'text',group:'Image',defaultValue:'WindowsServer'},
    {key:'imageSku',label:'Image SKU',type:'text',group:'Image',defaultValue:'2022-datacenter-azure-edition'},
    {key:'imageVersion',label:'Image version',type:'text',group:'Image',defaultValue:'latest'},
    {key:'osDiskType',label:'OS disk storage type',type:'select',group:'OS disk',options:['Standard_LRS','StandardSSD_LRS','Premium_LRS','Premium_ZRS'],defaultValue:'Premium_LRS'},
    {key:'osDiskSize',label:'OS disk size (GB)',type:'number',group:'OS disk',defaultValue:128},
    {key:'secureBoot',label:'Secure Boot',type:'boolean',group:'Security',defaultValue:true},
    {key:'vtpm',label:'vTPM',type:'boolean',group:'Security',defaultValue:true},
    {key:'systemIdentity',label:'System-assigned identity',type:'boolean',group:'Identity',defaultValue:false},
  ],
  vmScaleSet:[
    ...common(),
    {key:'vmSize',label:'VM size',type:'text',group:'Compute',defaultValue:'Standard_D2s_v5'},
    {key:'instances',label:'Instance count',type:'number',group:'Compute',defaultValue:2},
    {key:'zones',label:'Availability zones',type:'text',group:'Availability',defaultValue:'1,2,3'},
    {key:'upgradeMode',label:'Upgrade mode',type:'select',group:'Advanced',options:['Manual','Automatic','Rolling'],defaultValue:'Rolling'},
  ],
  storageAccount:[
    ...common(),
    {key:'accountTier',label:'Performance',type:'select',group:'Main parameters',options:['Standard','Premium'],defaultValue:'Standard',terraformProperty:'account_tier'},
    {key:'replicationType',label:'Redundancy',type:'select',group:'Main parameters',options:['LRS','ZRS','GRS','RAGRS','GZRS','RAGZRS'],defaultValue:'LRS',terraformProperty:'account_replication_type'},
    {key:'accountKind',label:'Account kind',type:'select',group:'Main parameters',options:['StorageV2','BlobStorage','BlockBlobStorage','FileStorage'],defaultValue:'StorageV2'},
    {key:'accessTier',label:'Access tier',type:'select',group:'Data protection',options:['Hot','Cool'],defaultValue:'Hot'},
    {key:'publicNetworkAccess',label:'Public network access',type:'boolean',group:'Networking',defaultValue:false},
    {key:'httpsOnly',label:'Secure transfer required',type:'boolean',group:'Security',defaultValue:true},
    {key:'minTls',label:'Minimum TLS version',type:'select',group:'Security',options:['TLS1_2'],defaultValue:'TLS1_2'},
    {key:'allowBlobPublicAccess',label:'Allow blob public access',type:'boolean',group:'Security',defaultValue:false},
  ],
  blobStorage:[
    {key:'containerName',label:'Container name',type:'text',group:'Main parameters',required:true},
    {key:'accessType',label:'Public access level',type:'select',group:'Security',options:['Private','Blob','Container'],defaultValue:'Private'},
  ],
  fileShare:[
    {key:'shareName',label:'File share name',type:'text',group:'Main parameters',required:true},
    {key:'quota',label:'Quota (GB)',type:'number',group:'Main parameters',defaultValue:100},
    {key:'protocol',label:'Protocol',type:'select',group:'Main parameters',options:['SMB','NFS'],defaultValue:'SMB'},
  ],
  sqlDatabase:[
    ...common(),
    {key:'serverName',label:'SQL logical server',type:'text',group:'Main parameters',required:true},
    {key:'skuName',label:'Service tier / SKU',type:'text',group:'Compute',defaultValue:'GP_S_Gen5_2',terraformProperty:'sku_name'},
    {key:'maxSizeGb',label:'Maximum size (GB)',type:'number',group:'Compute',defaultValue:32,terraformProperty:'max_size_gb'},
    {key:'zoneRedundant',label:'Zone redundant',type:'boolean',group:'Availability',defaultValue:false,terraformProperty:'zone_redundant'},
    {key:'backupStorageRedundancy',label:'Backup storage redundancy',type:'select',group:'Backup',options:['Local','Zone','Geo','GeoZone'],defaultValue:'Geo'},
    {key:'collation',label:'Collation',type:'text',group:'Advanced',defaultValue:'SQL_Latin1_General_CP1_CI_AS'},
    {key:'publicNetworkAccess',label:'Public network access',type:'boolean',group:'Networking',defaultValue:false},
  ],
  sqlManagedInstance:[
    ...common(),
    {key:'skuName',label:'SKU',type:'text',group:'Compute',defaultValue:'GP_Gen5'},
    {key:'vcores',label:'vCores',type:'number',group:'Compute',defaultValue:8},
    {key:'storageGb',label:'Storage (GB)',type:'number',group:'Compute',defaultValue:256},
    {key:'licenseType',label:'License type',type:'select',group:'Licensing',options:['LicenseIncluded','BasePrice'],defaultValue:'LicenseIncluded'},
    {key:'zoneRedundant',label:'Zone redundant',type:'boolean',group:'Availability',defaultValue:false},
  ],
  appService:[
    ...common(),
    {key:'runtimeStack',label:'Runtime stack',type:'select',group:'Application',options:['DOTNETCORE','NODE','JAVA','PYTHON','PHP'],defaultValue:'DOTNETCORE'},
    {key:'runtimeVersion',label:'Runtime version',type:'text',group:'Application',defaultValue:'8.0'},
    {key:'servicePlanSku',label:'App Service plan SKU',type:'text',group:'Compute',defaultValue:'P1v3'},
    {key:'alwaysOn',label:'Always On',type:'boolean',group:'Application',defaultValue:true},
    {key:'httpsOnly',label:'HTTPS only',type:'boolean',group:'Security',defaultValue:true},
    {key:'publicNetworkAccess',label:'Public network access',type:'boolean',group:'Networking',defaultValue:false},
    {key:'vnetIntegration',label:'VNet integration',type:'boolean',group:'Networking',defaultValue:true},
    {key:'systemIdentity',label:'System-assigned identity',type:'boolean',group:'Identity',defaultValue:true},
  ],
  functionApp:[
    ...common(),
    {key:'runtimeStack',label:'Runtime',type:'select',group:'Application',options:['dotnet-isolated','node','python','java'],defaultValue:'dotnet-isolated'},
    {key:'runtimeVersion',label:'Runtime version',type:'text',group:'Application',defaultValue:'8.0'},
    {key:'hostingPlan',label:'Hosting plan',type:'select',group:'Compute',options:['Consumption','Flex Consumption','Premium','Dedicated'],defaultValue:'Consumption'},
    {key:'httpsOnly',label:'HTTPS only',type:'boolean',group:'Security',defaultValue:true},
  ],
  keyVault:[
    ...common(),
    {key:'vaultSku',label:'SKU',type:'select',group:'Main parameters',options:['standard','premium'],defaultValue:'standard'},
    {key:'rbacAuthorization',label:'Azure RBAC authorization',type:'boolean',group:'Access configuration',defaultValue:true},
    {key:'softDeleteDays',label:'Soft-delete retention (days)',type:'number',group:'Data protection',defaultValue:90},
    {key:'purgeProtection',label:'Purge protection',type:'boolean',group:'Data protection',defaultValue:true},
    {key:'publicNetworkAccess',label:'Public network access',type:'boolean',group:'Networking',defaultValue:false},
  ],
  aks:[
    ...common(),
    {key:'kubernetesVersion',label:'Kubernetes version',type:'text',group:'Cluster',placeholder:'1.32'},
    {key:'nodeVmSize',label:'Node VM size',type:'text',group:'Node pool',defaultValue:'Standard_D4s_v5'},
    {key:'nodeCount',label:'Node count',type:'number',group:'Node pool',defaultValue:3},
    {key:'privateCluster',label:'Private cluster',type:'boolean',group:'Networking',defaultValue:true},
    {key:'networkPlugin',label:'Network plugin',type:'select',group:'Networking',options:['azure','kubenet'],defaultValue:'azure'},
    {key:'networkPolicy',label:'Network policy',type:'select',group:'Networking',options:['azure','calico','cilium'],defaultValue:'azure'},
    {key:'oidcIssuer',label:'OIDC issuer',type:'boolean',group:'Identity',defaultValue:true},
    {key:'workloadIdentity',label:'Workload identity',type:'boolean',group:'Identity',defaultValue:true},
  ],
  privateEndpoint:[
    {key:'targetResourceId',label:'Target resource ID',type:'text',group:'Main parameters',required:true},
    {key:'subresourceNames',label:'Subresource names',type:'text',group:'Main parameters',placeholder:'blob, vault, sqlServer'},
    {key:'privateDnsIntegration',label:'Private DNS integration',type:'boolean',group:'DNS',defaultValue:true},
  ],
  networkSecurityGroup:[
    ...common(),
    {key:'securityRules',label:'Security rules',type:'textarea',group:'Security rules',placeholder:'AllowHTTPS: Inbound TCP 443\nDenyInternet: Outbound Any *'},
  ],
  applicationGateway:[
    ...common(),
    {key:'skuName',label:'SKU',type:'select',group:'Main parameters',options:['Standard_v2','WAF_v2'],defaultValue:'WAF_v2'},
    {key:'capacity',label:'Instance capacity',type:'number',group:'Autoscaling',defaultValue:2},
    {key:'wafEnabled',label:'WAF enabled',type:'boolean',group:'Security',defaultValue:true},
    {key:'wafMode',label:'WAF mode',type:'select',group:'Security',options:['Detection','Prevention'],defaultValue:'Prevention'},
    {key:'http2',label:'HTTP/2',type:'boolean',group:'Frontend',defaultValue:true},
  ],
  firewall:[
    ...common(),
    {key:'firewallSku',label:'Firewall SKU',type:'select',group:'Main parameters',options:['Standard','Premium','Basic'],defaultValue:'Premium'},
    {key:'threatIntelMode',label:'Threat intelligence',type:'select',group:'Security',options:['Off','Alert','Deny'],defaultValue:'Deny'},
    {key:'dnsProxy',label:'DNS proxy',type:'boolean',group:'DNS',defaultValue:true},
  ],
  azureOpenAI:[
    ...common(),
    {key:'accountKind',label:'Kind',type:'select',group:'Main parameters',options:['OpenAI','AIServices'],defaultValue:'OpenAI'},
    {key:'customSubdomain',label:'Custom subdomain',type:'text',group:'Main parameters'},
    {key:'publicNetworkAccess',label:'Public network access',type:'boolean',group:'Networking',defaultValue:false},
    {key:'localAuthEnabled',label:'Local authentication',type:'boolean',group:'Security',defaultValue:false},
    {key:'modelDeployment',label:'Model deployment',type:'text',group:'Model',placeholder:'gpt-5'},
    {key:'modelVersion',label:'Model version',type:'text',group:'Model'},
    {key:'deploymentCapacity',label:'Deployment capacity',type:'number',group:'Model',defaultValue:10},
  ],
  aiSearch:[
    ...common(),
    {key:'searchSku',label:'SKU',type:'select',group:'Main parameters',options:['free','basic','standard','standard2','standard3'],defaultValue:'standard'},
    {key:'replicaCount',label:'Replicas',type:'number',group:'Scale',defaultValue:1},
    {key:'partitionCount',label:'Partitions',type:'number',group:'Scale',defaultValue:1},
    {key:'publicNetworkAccess',label:'Public network access',type:'boolean',group:'Networking',defaultValue:false},
    {key:'semanticSearch',label:'Semantic ranker',type:'boolean',group:'AI capabilities',defaultValue:true},
  ],
};

const generic:PropertyField[]=[
  ...common(),
  {key:'sku',label:'SKU / Size',type:'text',group:'Main parameters'},
];

export const getResourceSchema=(type:ResourceType):PropertyField[]=>{
  const base=schemas[type]||generic;
  const rel=genericRelationshipFields(type);
  const seen=new Set<string>();
  return [...rel,...base].filter(field=>{
    if(seen.has(field.key))return false;
    seen.add(field.key);
    return true;
  });
};
export const schemaGroups=(type:ResourceType)=>Array.from(new Set(getResourceSchema(type).map(f=>f.group)));
