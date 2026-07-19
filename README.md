# ArchMindCanvas v5 — AI Architecture Studio

Adds Prompt-to-Architecture MVP, validation workflow, Terraform/Bicep starter generation, code preview/copy/download, while preserving the v4.3 Azure hierarchy-aware visual designer.

## AI note
The included prompt generator is deterministic and works entirely in the browser. It requires no API key. It is architected as the first intelligence layer; a future release can connect an approved LLM endpoint for free-form prompt interpretation.

## Deploy
Push all files to the repository root. GitHub Actions builds and publishes to GitHub Pages.


## v5.1
- Collision-free AI generated 3-tier layout
- Smart hierarchical container sizing
- Clear ingress, app and data subnet columns
- Auto Arrange button
- Elbow/routed connections by default
- One-click fit-to-view after generation


## v5.2 Professional Diagram Layout
- Removed all 'Drop compatible resources inside' canvas hints
- Larger hierarchy containers and subnet spacing
- Wider resource cards with full multi-line names
- Cleaner AI-generated ingress/app/data lanes
- Increased separation for Key Vault and Azure Monitor
- Cleaner connection labels and routed connectors

## v5.3 IaC & Source Control foundation
- Branding: Founded by Pranab Baro
- Terraform/Bicep code preview retained
- Download single IaC file
- Download IaC bundle
- Source Control panel for GitHub/GitHub Enterprise and Azure DevOps Repos
- Repository, branch, folder and commit-message configuration
- Safe Prepare Repository Push workflow
- No PAT/API secrets stored in the static browser application
- Direct authenticated push is intentionally reserved for a secure backend integration

## v5.4 Cost Intelligence
- Cost button and dedicated Cost Intelligence panel
- Estimated monthly and annual architecture cost
- Cost breakdown by category
- Per-resource baseline estimates
- USD, EUR, INR and GBP display
- Automatic recalculation as diagram resources change
- Clear estimate disclaimer; live Azure Retail Prices API integration remains a future secure enhancement
- Founded by Pranab Baro branding retained
- IaC and Source Control foundation retained

## v5.5 Live Cost + IaC to Diagram
- Azure Retail Prices API integration with refresh action
- Live retail price indicator and baseline fallback
- Currency-aware retail price requests
- Terraform paste-to-diagram for common azurerm resources
- Bicep paste-to-diagram for common resource declarations
- Basic dependency/reference inference and automatic canvas layout
- Existing Cost Intelligence, IaC generation, Source Control foundation and Founder branding retained
- No version badge in the product header

## v5.6.1 Fix
- Fixed blank canvas during Terraform import when azurerm_network_interface is present
- NIC resources are used for dependency resolution but not rendered as unsupported generic nodes
- VM-to-subnet hierarchy is inferred through the NIC subnet reference
- Added defensive fallback for unknown imported resource types

## v5.7 Advanced IaC Import
- Multiple subnet hierarchy import
- Better Terraform reference parsing
- VM subnet placement through NIC references
- Common Azure resource mappings expanded
- Cleaner auto-layout for RG, VNet and multiple Subnets
- Subnet containers grow based on imported children
- Basic non-container dependency edges
- Network Interface remains dependency-only and is not rendered

## v5.7.1 IaC File Upload Fix
- Added dedicated Upload .tf / .bicep file button inside Import IaC
- Uploading a .tf file automatically selects Terraform mode
- Uploading a .bicep file automatically selects Bicep mode
- Uploaded file content is loaded into the IaC editor for review
- Existing Load button remains dedicated to ArchMindCanvas JSON design files
- Fixes the "Invalid JSON file" confusion when testing Terraform imports

## v5.7.2 Collision-Free Unified Import
- Removed separate JSON-only Load button from the main toolbar
- Unified Import supports JSON, Terraform and Bicep
- Upload .tf, .bicep or .json from the same Import panel
- Recursive collision-free layout for nested Azure hierarchy
- 2-column grid layout for resources inside each container
- Automatic container sizing based on children
- Automatic spacing between nested containers and resources
- Auto fit-to-view after import
