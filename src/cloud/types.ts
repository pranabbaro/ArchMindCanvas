import type { LucideIcon } from 'lucide-react';
import type { ResourceCategory, ResourceType } from '../types';

export type CloudProvider = 'azure' | 'aws' | 'gcp';

export type CloudResourceItem = {
  type: ResourceType | string;
  label: string;
  description: string;
  sku: string;
  category: ResourceCategory | string;
  iconUrl: string;
  fallbackIcon: LucideIcon;
  container?: boolean;
  canvasReady?: boolean;
  terraformReady?: boolean;
};

export type CloudCatalog = {
  provider: CloudProvider;
  categories: readonly (ResourceCategory | string)[];
  resources: readonly CloudResourceItem[];
};
