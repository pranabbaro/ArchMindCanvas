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


## v8.4.4 — Architecture Guidance presentation-only update

Only the Architecture Tools presentation was changed:
- Visible name: `Architecture Tools` -> `Architecture Guidance`
- Icon: existing sparkle icon -> Lucide `BookOpenText`

No handlers, state variables, component names, Terraform/IaC, remote backend,
templates, reference starters, connectors, validation, deployment or other
application behavior was intentionally changed.


## v8.4.5 — Sidebar Architecture Guidance correction

Only the circled left sidebar control was corrected:
- Sparkles -> BookOpenText
- Architecture / Tools -> Architecture / Guidance

The existing click handler and all application behavior are unchanged.
