# ArchMindCanvas v8.2.0 — Provider-Aware Terraform Generator

Fixes found during the real end-to-end IaC test:

- Internal model fields such as `resourceGroupRef`, `subscriptionRef`, `vnetRef`, and `subnetRef` are not emitted as Terraform arguments.
- `azurerm_subnet` no longer emits invalid `location`.
- Subnet keeps valid Resource Group and VNet references.
- Windows VM generation now includes:
  - Resource Group reference
  - Location
  - VM size
  - Admin username
  - Sensitive password variable
  - Automatically generated NIC
  - NIC → Subnet dependency
  - OS disk block
  - Windows Server image reference
- `zone = "None"` is not emitted.
- Existing/Create/Import behavior is preserved.
- Architecture Tools and the archmind robot assistant are preserved.

```powershell
git add .
git commit -m "ArchMindCanvas v8.2.0 - provider aware terraform generator"
git push origin main
```
