# ArchMindCanvas v7.3.9 — Top-Right Design Variables

Variables & Locals are now accessed from a small design-level toolbar button instead of the Properties inspector tabs.

Behavior:
- `Vars` appears in the main top toolbar near IaC / Deploy.
- Clicking it opens Design Variables & Locals.
- Variables remain scoped to the current design only.
- Resource properties continue to reference those design variables through the link/binding button.
- Browser Save/Open and JSON export/import continue to preserve the design's variables and locals.

Push:

```powershell
git add .
git commit -m "ArchMindCanvas v7.3.9 - top right design variables"
git push origin main
```
