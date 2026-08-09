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


## v8.4.3 — Connector controls and founder label

Focused usability patch. Existing IaC, backend, validation, templates, Microsoft reference starters and deployment logic are unchanged.

Changes:
- Removed the decorative line-jump/bridge symbol that appeared on connections.
- Connection style dropdown now updates the selected existing connection, not only future connections.
- Added explicit arrow control:
  - No Arrow
  - End Arrow
  - Start Arrow
  - Both Arrows
- New connections use the currently selected connector style and arrow preference.
- Selecting an existing connection synchronizes the toolbar controls to that connection.
- Profile subtitle changed from `Organization Admin` to `Founder · ArchMindCanvas`.
