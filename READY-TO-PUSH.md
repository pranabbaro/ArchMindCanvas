# ArchMindCanvas v7.9.1 — IaC Integrity Fix

Keeps v7.9.0 features and strengthens Terraform correctness.

- Parses var.*, local.*, module.*, data.* and azurerm_* references.
- Auto-generates referenced data sources in data.tf.
- Supports data.azurerm_subscription.<name>.
- Flags undeclared variables, locals, modules, data sources and resources.
- Existing resources require a lookup name or resource ID.
- Import mode requires an Azure resource ID.
- Invalid modules are not emitted as apparently valid Terraform.
- Empty module inputs are commented and flagged.
- Output expressions are dependency-validated.
- IaC bundle now includes data.tf.
- Right inspector tabs no longer need horizontal scrolling.
- IaC code wraps long lines for readability.

```powershell
git add .
git commit -m "ArchMindCanvas v7.9.1 - IaC integrity fix"
git push origin main
```
