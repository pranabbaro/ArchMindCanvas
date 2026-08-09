# ArchMindCanvas v8.0.0 — Deployment Readiness Engine

This release hardens existing Terraform functionality instead of adding duplicate UI features.

Key improvements:
- Relationship-aware Terraform addresses for Create / Existing / Import resources
- Existing resources generate `data` blocks
- Import resources generate `resource` + `import` blocks
- Resource bindings generate real Terraform expressions where possible
- Resource-group and VNet/Subnet relationships resolve to Terraform references
- Architecture tags are emitted into Terraform
- Duplicate Terraform addresses are blocked
- Existing lookup and Import ID completeness are checked
- Variables, locals, modules and outputs are included in deployment readiness
- IaC panel displays Ready / Blocked status
- Validation receives deployment-readiness blockers and warnings

Target workflow:
Design → Validate → Generate IaC → Terraform validate/plan → Deploy

```powershell
git add .
git commit -m "ArchMindCanvas v8.0.0 - deployment readiness engine"
git push origin main
```
