# ArchMindCanvas v7.3.7 — Project-Level Variables

Variables and locals now belong to the complete design project.

## Push

```powershell
git add .
git commit -m "ArchMindCanvas v7.3.7 - project level variables"
git push origin main
```

Behavior:
- Open Variables from the main top toolbar.
- One variable/local catalog is shared by every component in the design.
- Component Properties only reference project variables.
- Browser Save/Open preserves variables and locals.
- Save As JSON / JSON Import preserves variables and locals.
- New Design starts with a fresh project-level variable catalog.
