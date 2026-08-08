# ArchMindCanvas v7.9.3 — Header Breadcrumb Overlap Fix

Fixes the editor header overlap between:
- Organization / Project / Environment / Architecture breadcrumb
- Current architecture title
- Toolbar actions

Changes:
- Breadcrumb names truncate with ellipsis
- Breadcrumb cannot wrap
- Architecture title has a protected width
- Toolbar gets remaining space
- Responsive breakpoints progressively compact the breadcrumb
- Small screens hide the least-important breadcrumb level instead of overlapping

Push:

```powershell
git add .
git commit -m "ArchMindCanvas v7.9.3 - fix header breadcrumb overlap"
git push origin main
```
