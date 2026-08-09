# ArchMindCanvas v8.4.2 — Consistent Template Icon

UI-only icon consistency update on top of v8.4.1.

Changes:
- Keeps the existing top `Template` action and its existing `loadTemplate` behavior unchanged.
- Replaces the ambiguous sparkle/cubes template icons with the same clear `LayoutTemplate` icon everywhere template functionality is shown.
- Standardized locations include:
  - Editor top-bar Template
  - Command Center Templates navigation
  - Template cards / previews
  - Save as Template
  - Architecture Templates entry in Architecture Tools
- No architecture, IaC, Terraform backend, validation, reference starter, save, deploy, or navigation logic was changed.

```powershell
git add .
git commit -m "ArchMindCanvas v8.4.2 - standardize template icons"
git push origin main
```


## v8.4.3 — Connector controls and founder label

Focused usability patch. Existing IaC, backend, validation, templates, Microsoft reference starters and deployment logic are unchanged.

Changes:
- Removed the decorative line-jump/bridge symbol that appeared on connections.
- Connection style dropdown now updates the selected existing connection, not only future connections.
- Added explicit arrow control:
  - No Arrow
  - End Arrow
  - Start Arrow
  - Both Arrows
- New connections use the currently selected connector style and arrow preference.
- Selecting an existing connection synchronizes the toolbar controls to that connection.
- Profile subtitle changed from `Organization Admin` to `Founder · ArchMindCanvas`.


## v8.4.4 — Architecture Guidance presentation-only update

Only the Architecture Tools presentation was changed:
- Visible name: `Architecture Tools` -> `Architecture Guidance`
- Icon: existing sparkle icon -> Lucide `BookOpenText`

No handlers, state variables, component names, Terraform/IaC, remote backend,
templates, reference starters, connectors, validation, deployment or other
application behavior was intentionally changed.


## v8.4.5 — Sidebar Architecture Guidance correction

Only the circled left sidebar control was corrected:
- Sparkles -> BookOpenText
- Architecture / Tools -> Architecture / Guidance

The existing click handler and all application behavior are unchanged.


## v8.4.6 — Multi-cloud Resources provider selector

Focused Resources-drawer update only.

Added a provider dropdown above the resource library:
- Microsoft Azure
- Amazon Web Services
- Google Cloud

Behavior:
- Azure remains the default and keeps the existing resource catalog unchanged.
- Provider selection is remembered locally.
- AWS and Google Cloud currently show a clear "resource catalog coming soon" state.
- Existing left-rail Resources behavior and all Azure drag/drop resources remain unchanged.

No Terraform/IaC, backend, validation, templates, reference starters,
connector controls, Architecture Guidance, deployment or canvas logic changed.


## v8.4.7 — Multi-cloud catalog foundation

Safe internal refactor only, plus the requested drawer-title correction.

Visible change:
- Resource drawer heading: `Azure Resources` -> `Resources`.

Internal structure:
- `src/cloud/azure/azureCatalog.ts` contains the existing Azure catalog unchanged.
- `src/cloud/aws/awsCatalog.ts` is an empty AWS catalog placeholder.
- `src/cloud/gcp/gcpCatalog.ts` is an empty Google Cloud catalog placeholder.
- `src/cloud/providerRegistry.ts` resolves the selected provider to its catalog.
- `src/cloud/types.ts` defines common multi-cloud catalog types.
- `src/resourceCatalog.ts` remains as a backward-compatible Azure re-export, so existing working imports are preserved.

No layout, icons, Azure resource definitions, drag/drop behavior, canvas behavior,
Terraform/IaC, remote backend, validation, templates, reference starters,
connectors, Architecture Guidance, cost, save, deploy or archmind logic was changed.


## v8.4.8 — Resources blank-page runtime fix

Focused bug fix only.

Cause:
- `Sidebar.tsx` initialized category state using `categories` before the
  selected provider catalog was resolved.
- The Sidebar mounts only when Resources is opened, causing a runtime
  blank page at that exact point.

Fix:
- Resolve provider/catalog before category state initialization.
- Initialize the existing Azure category state from
  `getCloudCatalog('azure').categories`.

No layout, icons, provider selector UI, Azure catalog definitions,
Terraform/IaC, backend, validation, templates, reference starters,
connectors, Architecture Guidance, cost, save, deploy or archmind behavior changed.


## v8.5.0 — AWS core resource catalog with official architecture icons

AWS catalog phase 1.

Added:
- 35 core AWS services across:
  - Management & Governance
  - Networking & Content Delivery
  - Compute
  - Containers
  - Storage
  - Database
  - Security, Identity & Compliance
  - Application Integration
- AWS icon source is isolated in `src/cloud/aws/awsIconSource.ts`.
- AWS categories are isolated in `src/cloud/aws/awsCategories.ts`.
- AWS resources are isolated in `src/cloud/aws/awsCatalog.ts`.
- Icons are referenced from the AWS-owned `awslabs/aws-icons-for-plantuml`
  repository, whose assets are generated from official AWS Architecture Icons.
- Search and category expansion work independently for AWS.

Safety:
- Existing Azure catalog, Azure drag/drop, Azure canvas nodes, Terraform/IaC,
  backend, validation, templates, connectors, Architecture Guidance, cost,
  save/deploy and archmind behavior are unchanged.
- AWS resources are intentionally catalog-only in this phase (`canvasReady:false`)
  so they cannot accidentally enter the existing Azure-specific Terraform pipeline.
- Provider-specific AWS canvas/IaC support is the next isolated phase.


## v8.5.1 — AWS all-services canvas diagram mode

All AWS services currently in the AWS core catalog are now draggable onto the canvas.

AWS diagram-mode capabilities:
- Drag/drop
- Move and resize
- Select
- Connect with existing connector styles/arrows
- Duplicate/delete
- Save/load as part of the architecture
- Provider label displayed as Amazon Web Services
- Default AWS region metadata: ap-south-1

Safety:
- Every AWS node carries `cloudProvider: 'aws'`.
- AWS nodes are not automatically parented inside Azure RG/VNet/Subnet containers.
- AWS nodes are explicitly excluded from the existing Azure Terraform generator.
- AWS Properties shows diagram-mode guidance instead of Azure Terraform code controls.
- Azure behavior and Azure IaC generation remain unchanged.

Next phase can add AWS hierarchy/container semantics and AWS Terraform mapping independently.


## v8.5.2 — AWS hierarchy and container support

Adds provider-aware AWS hierarchy without changing the Azure hierarchy.

AWS containers:
- AWS Account
- Amazon VPC
- AWS Subnet

Containment:
- AWS Account -> VPC
- VPC -> Subnet
- AWS service -> Subnet / VPC / Account
- AWS nodes cannot auto-parent into Azure containers.
- Azure nodes cannot auto-parent into AWS containers.

AWS inherited metadata:
- awsAccountId
- awsVpc
- awsSubnet

Azure hierarchy, Azure Terraform, backend, validation, templates, connectors,
Architecture Guidance, cost, save/deploy and archmind behavior are unchanged.
