// Backward-compatible Azure catalog export.
// Existing ArchMindCanvas modules can continue importing from `resourceCatalog`
// while multi-cloud provider catalogs live under `src/cloud/`.
export { categories, resourceCatalog, resourceMap, isContainerType } from './cloud/azure/azureCatalog';
