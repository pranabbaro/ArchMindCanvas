import type { ResourceType } from './types';
import { categories, resourceCatalog, resourceMap as azureResourceMap, isContainerType as isAzureContainerType } from './cloud/azure/azureCatalog';
import { awsResources } from './cloud/aws/awsCatalog';

export { categories, resourceCatalog };

const awsResourceMap = Object.fromEntries(awsResources.map(i=>[i.type,i]));
export const resourceMap = {
  ...azureResourceMap,
  ...awsResourceMap,
} as Record<ResourceType, (typeof resourceCatalog)[number] | (typeof awsResources)[number]>;

export const isContainerType = (type:ResourceType) =>
  type.startsWith('aws')
    ? Boolean((resourceMap[type] as any)?.container)
    : isAzureContainerType(type);
