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
