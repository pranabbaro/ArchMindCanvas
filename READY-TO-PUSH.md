# ArchMindCanvas v8.0.1 — Runtime Hotfix

Fixes the blank production page introduced by v8.0.0.

Root cause:
`terraformMainCode` executes during React render and uses:
- terraformNodeAddress
- terraformAttributeRef
- resolveBindingExpression

Those helpers were declared later in the component. The starter RG/VNet/Subnet architecture immediately exercised them, causing a JavaScript temporal-dead-zone ReferenceError.

Fix:
- Moved all Terraform relationship/reference helpers before `terraformMainCode`.
- Deployment Readiness Engine remains enabled.
- Create / Existing / Import hardening remains enabled.
- IaC readiness banner remains enabled.
- v7.9.10 UI functionality is unchanged.

```powershell
git add .
git commit -m "ArchMindCanvas v8.0.1 - fix Terraform helper runtime order"
git push origin main
```
