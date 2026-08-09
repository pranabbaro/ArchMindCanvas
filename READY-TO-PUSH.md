# ArchMindCanvas v8.2.2 — Terraform Bundle Hardening

Adds `terraform.tfvars.example` to downloaded Terraform bundles.

Highlights:
- Architecture/global variables are represented in the example values file.
- Sensitive-looking variables are commented placeholders only.
- `vm_admin_password` is never exported with a real value.
- Bundle README now includes a quick-start workflow and security guidance.
- The proven v8.2.1 provider-aware Terraform generator and dependency resolution are unchanged.

```powershell
git add .
git commit -m "ArchMindCanvas v8.2.2 - harden Terraform bundle variables"
git push origin main
```
