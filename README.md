# ArchMindCanvas v4.3

Azure hierarchy-aware visual architecture designer.

## New in v4.3
- Azure governance hierarchy: Tenant, Management Group, Subscription, Resource Group
- Resizable hierarchy containers
- Connected hierarchy: Subscription → Resource Group → VNet → Subnet → Resource
- Parent/placement dropdown in Properties
- Automatic inheritance of Subscription, Resource Group, VNet, Subnet and region
- Tag inheritance from parent containers
- Subscription ID and Tenant ID fields
- Expanded Azure resource library across Governance, Networking, Compute, Web, Containers, Storage, Database, Security, Integration, AI & Data, and Monitoring
- Connection metadata: style, label, connection type, protocol and port
- Straight, elbow/routed, curved, dotted and dashed connections
- Hierarchy-aware validation

## Deploy
Copy all files to the root of your GitHub repository and push to `main`. The included GitHub Pages workflow installs dependencies, builds, and deploys.
