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


## v8.4.6 — Multi-cloud Resources provider selector

Focused Resources-drawer update only.

Added a provider dropdown above the resource library:
- Microsoft Azure
- Amazon Web Services
- Google Cloud

Behavior:
- Azure remains the default and keeps the existing resource catalog unchanged.
- Provider selection is remembered locally.
- AWS and Google Cloud currently show a clear "resource catalog coming soon" state.
- Existing left-rail Resources behavior and all Azure drag/drop resources remain unchanged.

No Terraform/IaC, backend, validation, templates, reference starters,
connector controls, Architecture Guidance, deployment or canvas logic changed.


## v8.4.7 — Multi-cloud catalog foundation

Safe internal refactor only, plus the requested drawer-title correction.

Visible change:
- Resource drawer heading: `Azure Resources` -> `Resources`.

Internal structure:
- `src/cloud/azure/azureCatalog.ts` contains the existing Azure catalog unchanged.
- `src/cloud/aws/awsCatalog.ts` is an empty AWS catalog placeholder.
- `src/cloud/gcp/gcpCatalog.ts` is an empty Google Cloud catalog placeholder.
- `src/cloud/providerRegistry.ts` resolves the selected provider to its catalog.
- `src/cloud/types.ts` defines common multi-cloud catalog types.
- `src/resourceCatalog.ts` remains as a backward-compatible Azure re-export, so existing working imports are preserved.

No layout, icons, Azure resource definitions, drag/drop behavior, canvas behavior,
Terraform/IaC, remote backend, validation, templates, reference starters,
connectors, Architecture Guidance, cost, save, deploy or archmind logic was changed.
