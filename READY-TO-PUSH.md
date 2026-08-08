# ArchMindCanvas v7.9.0 — Architecture Intelligence & IaC Model

New Architecture Model:
- Metadata: description, owner, application, business unit, cost center, criticality, lifecycle, version and tags
- Terraform Outputs
- Terraform Modules with module inputs
- Dependency intelligence derived from property bindings

IaC model:
- providers / versions
- variables.tf
- locals.tf
- modules.tf
- main.tf
- outputs.tf
- Resource Create / Existing(Data) / Import modes remain supported
- Download IaC Bundle now contains separated Terraform sections

Validation:
- Broken resource references
- Missing variables
- Missing locals
- Missing modules referenced by resources
- Duplicate resource names
- Module name/source checks
- Output name/value checks
- Architecture metadata recommendations

Persistence:
- Metadata, modules and outputs are saved with the architecture
- JSON export/import includes the complete architecture model

Push:

```powershell
git add .
git commit -m "ArchMindCanvas v7.9.0 - architecture intelligence and IaC model"
git push origin main
```
