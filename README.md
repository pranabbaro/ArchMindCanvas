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

## v5.7.3 UI Cleanup
- Removed top-level JSON export button from the header
- Unified Import panel remains the single place to import JSON, Terraform, and Bicep
- Collision-free hierarchy-aware import retained
- All existing AI, Cost, Validate, IaC, Auto Arrange, and Source Control features retained

## v5.8 Professional Diagram Export
- Save button now opens professional diagram export options
- Save architecture as PDF
- Save architecture as high-resolution PNG
- Save architecture as SVG
- Exports target the diagram viewport rather than the application sidebars and toolbars
- Removed redundant canvas-level JSON Import button
- Import IaC remains the unified import experience for Terraform, Bicep and JSON

## v6.0 Professional Architecture Editor
- Cursor tool for select, move, resize and edit
- Hand tool for canvas panning without accidental selection
- Spacebar temporarily activates Hand mode
- Selected connections show a draggable routing handle
- Drag routing handle to reshape a connection without moving resources
- Elbow, straight, dotted, dashed and curved connections support manual route shaping
- Double-click the routing handle to reset the connection to automatic routing
- Manual route coordinates are stored in edge JSON and preserved in editable design exports

## v6.1.1 Professional Selection & Grouping
- Right-click node context menu
- Duplicate selected objects
- Lock / Unlock selected objects
- Bring Forward / Send Backward
- Group / Ungroup selected objects
- Ctrl+D duplicate
- Ctrl+A select all
- Delete / Backspace delete selection
- Escape clears selection/context menu
- Existing v6.0 manual connection routing and Cursor/Hand modes retained

## v6.1.3 Professional Connectors
- Multiple draggable connection waypoints
- Double-click selected connection to add waypoint
- Double-click waypoint to remove it
- Drag connection labels independently
- Arrow direction: none, forward, backward, both
- Adjustable line thickness
- Reset to automatic routing
- Waypoints and label coordinates persist in design JSON
- Cursor/Hand visual behavior retained

## v6.1.4 Easy Connector Editing
- Larger 20px draggable waypoint handles for easier routing
- Wider invisible connection hit area for easier line interaction
- Existing double-click add/remove waypoint workflow retained
- Movable labels retained
- Arrow direction and line thickness retained
- Stable incremental update based directly on v6.1.3

## v6.2 Smart Layout & Connection Crossings
- Auto Tidy button for quick diagram cleanup
- Align Left and Align Top controls
- Horizontal and vertical distribution controls
- Layout actions work on multi-selected objects
- Locked objects are preserved during layout operations
- Connection crossing clarity improved using a white bridge/gap underlay
- Crossing lines visually remain separate and do not look connected
- Existing connector routing, arrow directions, line thickness and export features retained
