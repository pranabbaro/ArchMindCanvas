# ArchMindCanvas v7.5.0 — Enterprise Hierarchy Foundation

This is the first platform-foundation release.

Hierarchy:
Organization → Project → Environment → Architecture

Variable inheritance:
Organization < Project < Environment < Architecture

The most specific declaration wins.

New:
- Enterprise hierarchy breadcrumb in the top bar
- Enterprise Scope Manager
- Variables and Locals at all four scopes
- Effective variable view with source scope
- Organization variables persisted across the workspace
- Project and Environment scope persisted across the workspace
- Architecture variables remain stored with the design
- Design JSON now carries hierarchy IDs and names
- Resource property bindings consume resolved effective variables

Push:

```powershell
git add .
git commit -m "ArchMindCanvas v7.5.0 - enterprise hierarchy foundation"
git push origin main
```
