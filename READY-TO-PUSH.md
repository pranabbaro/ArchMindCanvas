# ArchMindCanvas v8.3.2 — Build Fix + Nested Layering

Fixes the v8.3.1 TypeScript build failure:

- Removes the duplicate `onNodesChange` declaration conflict.
- Keeps the nested resource layering normalization.
- ReactFlow now uses `onNodesChangeLayered`.
- VM/resources remain above Subnet/VNet/RG containers.
- Terraform backend, tfvars, validation, IaC generation, Architecture Tools, and archmind assistant are unchanged.

```powershell
git add .
git commit -m "ArchMindCanvas v8.3.2 - fix duplicate node change handler"
git push origin main
```
