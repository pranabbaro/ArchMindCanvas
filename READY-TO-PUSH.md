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


## v8.5.3 — AWS resource-specific properties

AWS resources now follow the same schema principle as Azure: each service has
its own relevant architecture properties rather than a generic form.

Examples:
- VPC: CIDR, DNS, tenancy, IPv6.
- Subnet: VPC, CIDR, AZ, public/private behavior.
- EC2: AMI, instance type, subnet, SGs, key pair, disks, IAM profile.
- RDS/Aurora: engine, class, storage, Multi-AZ, backup, encryption, networking.
- S3: versioning, encryption, public access, lifecycle, ownership.
- EKS/ECS/Lambda, CloudFront, Route 53, ALB/NLB, KMS, Secrets Manager,
  CloudWatch, CloudTrail, SQS/SNS/EventBridge/Step Functions and other current
  AWS catalog services each have service-relevant fields.

Safety:
- AWS schemas live only in `src/cloud/aws/awsSchemas.ts`.
- Existing Azure `resourceSchemas.ts` is unchanged.
- AWS Terraform/code mode remains disabled.
- Existing Azure Terraform/IaC, remote backend, validation, templates,
  connectors, Architecture Guidance, cost, save/deploy and archmind remain unchanged.

## v8.5.4 — AWS Terraform foundation

First controlled AWS IaC mapping phase. Existing Azure canvas and Azure Terraform logic remain intact.

Enabled AWS Terraform resources:
- AWS Account: retained as a diagram/account boundary; no synthetic Terraform resource is generated.
- Amazon VPC -> `aws_vpc`
- AWS Subnet -> `aws_subnet`
- Amazon EC2 -> `aws_instance`

The generated provider bundle adds `hashicorp/aws` only when one of the mapped AWS resources is present. `aws_region` is generated automatically. VPC/Subnet hierarchy references are generated from the canvas when available, with input-variable fallbacks for externally managed VPCs/subnets.

All other AWS services remain diagram/property-only and are explicitly commented as not yet Terraform-mapped. This prevents accidental generation of invalid generic AWS resources.


## v8.5.5 — AWS Cost Foundation

Cost Intelligence is now provider-aware.

Added:
- AWS monthly architecture estimates in an isolated `src/cloud/aws/awsPricing.ts`.
- AWS cost categories.
- Azure and AWS monthly subtotals.
- Combined multi-cloud monthly and annual estimate.
- Cost breakdown by provider + category.
- Per-resource pricing-source labels.
- Existing Azure live Retail Prices refresh remains Azure-only and unchanged in principle.

AWS cost coverage currently includes estimates for:
EC2 + root EBS, Auto Scaling, Lambda, ECS/EKS/ECR/Fargate, S3/EBS/Backup,
RDS/Aurora/DynamoDB, Transit Gateway, Direct Connect, Site-to-Site VPN,
CloudFront, Route 53, ALB/NLB, PrivateLink, API Gateway, Network Firewall,
KMS, Secrets Manager, Security Hub, CloudWatch, CloudTrail, SQS/SNS,
EventBridge and Step Functions.

Important:
- AWS figures are architecture estimates based on configured node properties.
- The official AWS Price List GetProducts API requires authenticated calls.
- No AWS credential is stored or embedded in the frontend.
- A future backend can replace AWS estimates with live AWS Price List results.

No canvas, icon, hierarchy, property schema, connector, template, validation,
Azure/AWS Terraform, backend-state, save/deploy or Architecture Guidance behavior changed.


## v8.5.6 — AWS all-services Terraform / IaC completion

All AWS services currently present in the ArchMindCanvas AWS catalog now have
provider-specific Terraform generation.

Architecture:
- AWS Terraform generation moved to `src/cloud/aws/awsTerraform.ts`.
- Azure Terraform logic remains in the existing path and is not replaced.
- AWS Account stays a hierarchy/container boundary and emits a comment rather
  than a fake Terraform resource.

AWS Terraform mappings include:
VPC, Subnet, EC2, EC2 Auto Scaling, Lambda, Elastic Beanstalk, ECS, EKS,
ECR, Fargate task definition, S3, EBS, AWS Backup, RDS, Aurora, DynamoDB,
KMS, Secrets Manager, Security Hub, Network Firewall, Transit Gateway,
Direct Connect, Site-to-Site VPN, CloudFront, Route 53, ALB, NLB,
PrivateLink/VPC Endpoint, API Gateway, CloudFormation, CloudWatch,
CloudTrail, SQS, SNS, EventBridge and Step Functions.

Safety:
- Required-but-environment-specific values use visible `REPLACE_ME` placeholders
  or Terraform variables instead of invented production identifiers.
- AWS DB passwords are sensitive variables.
- Provider fallback variables exist for subnet/security-group references.
- AWS resource properties now expose a Code tab with the generated HCL.
- Existing Azure Terraform, backend state, canvas layout, icons, connectors,
  templates, cost engine, validation and Architecture Guidance are preserved.

Testing note:
- `terraform validate` can be used locally without deploying.
- `terraform plan/apply` still requires valid AWS credentials and real AWS values.
