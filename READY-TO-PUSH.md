# ArchMindCanvas v8.4.2 — Consistent Template Icon

UI-only icon consistency update on top of v8.4.1.

Changes:
- Keeps the existing top `Template` action and its existing `loadTemplate` behavior unchanged.
- Replaces the ambiguous sparkle/cubes template icons with the same clear `LayoutTemplate` icon everywhere template functionality is shown.
- Standardized locations include:
  - Editor top-bar Template
  - Command Center Templates navigation
  - Template cards / previews
  - Save as Template
  - Architecture Templates entry in Architecture Tools
- No architecture, IaC, Terraform backend, validation, reference starter, save, deploy, or navigation logic was changed.

```powershell
git add .
git commit -m "ArchMindCanvas v8.4.2 - standardize template icons"
git push origin main
```
