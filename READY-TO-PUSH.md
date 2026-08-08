# ArchMindCanvas v7.9.2 — Real IaC ZIP Bundle

Fixes the IaC Bundle download.

Terraform now downloads as a real ZIP containing:
- providers.tf
- variables.tf
- locals.tf
- data.tf
- modules.tf
- main.tf
- outputs.tf
- README.md

Bicep downloads as a ZIP containing:
- main.bicep
- main.bicepparam
- README.md

The ZIP filename is derived from the architecture name.

Implementation:
- Added JSZip 3.10.1
- Existing IaC generation and validation logic from v7.9.1 is preserved

Push:

```powershell
git add .
git commit -m "ArchMindCanvas v7.9.2 - real IaC zip bundle"
git push origin main
```
