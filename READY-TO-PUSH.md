# ArchMindCanvas v8.3.1 — Nested Resource Layering Fix

Fixes nested resources appearing behind Subnet/VNet/RG containers.

- Containers receive deterministic low z-index values based on hierarchy depth.
- Normal resources always render above containers.
- Selected objects are raised to the top.
- Layering is recalculated after node changes.
- Existing Forward / Backward behavior remains available.
- Terraform backend, provider-aware IaC, tfvars, validation and archmind assistant logic are unchanged.

```powershell
git add .
git commit -m "ArchMindCanvas v8.3.1 - fix nested resource layering"
git push origin main
```
