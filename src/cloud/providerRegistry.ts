import { categories as azureCategories, resourceCatalog as azureResources } from './azure/azureCatalog';
import { awsCatalog } from './aws/awsCatalog';
import { gcpCatalog } from './gcp/gcpCatalog';
import type { CloudCatalog, CloudProvider } from './types';

export const providerInfo:Record<CloudProvider,{label:string;resourceLabel:string;logo:string}> = {
  azure:{
    label:'Microsoft Azure',
    resourceLabel:'Azure Resources',
    logo:'https://learn.microsoft.com/en-us/media/logos/logo_azure.svg'
  },
  aws:{
    label:'Amazon Web Services',
    resourceLabel:'AWS Resources',
    logo:'https://signin.aws.amazon.com/v2/assets/_next/static/media/aws-logo@2x.7c50e6f9.png'
  },
  gcp:{
    label:'Google Cloud',
    resourceLabel:'Google Cloud Resources',
    logo:'https://www.gstatic.com/cgc/renaissance/image/MultiPath_Bottom_2X_Centered_static.png'
  }
};

const azureCatalog:CloudCatalog={
  provider:'azure',
  categories:azureCategories,
  resources:azureResources,
};

export const cloudCatalogs:Record<CloudProvider,CloudCatalog>={
  azure:azureCatalog,
  aws:awsCatalog,
  gcp:gcpCatalog,
};

export const getCloudCatalog=(provider:CloudProvider)=>cloudCatalogs[provider];
