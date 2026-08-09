# ArchMindCanvas v8.2.1 — Dependency Resolution Fix

Targeted patch on top of v8.2.0.

Fixes:
- VM-generated NIC now resolves the Subnet from:
  1. explicit VM relationship, then
  2. visual parent Subnet container.
- When resolved, generated Terraform uses:
  `subnet_id = azurerm_subnet.<name>.id`
- Fallback `var.subnet_id` is used only when no modeled Subnet can be resolved.
- Deployment readiness now blocks unresolved fallback references when the required variable is not declared.
- Similar readiness protection was added for unresolved Resource Group and Virtual Network fallbacks.

Everything else from v8.2.0 remains unchanged.

```powershell
git add .
git commit -m "ArchMindCanvas v8.2.1 - fix dependency resolution"
git push origin main
```
