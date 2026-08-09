# ArchMindCanvas v8.3.0 — Terraform Backend / Remote State

Adds a Terraform Backend section to the IaC workspace.

- Local State for development/testing
- Azure Storage Remote State for shared/production usage
- Configurable state Resource Group, Storage Account, Blob Container and State Key
- Live backend.tf preview
- backend.tf included in downloaded Terraform bundles
- Settings persist in the browser
- No Azure credentials, storage keys, SAS tokens or secrets are exported

The proven v8.2.2 provider-aware Terraform generation is unchanged.

```powershell
git add .
git commit -m "ArchMindCanvas v8.3.0 - terraform backend remote state"
git push origin main
```
