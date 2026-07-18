# ArchMindCanvas v3 v2

Professional visual cloud architecture designer built with React, TypeScript, Vite and React Flow.

## Highlights
- Professional three-panel cloud designer UI
- 17 Azure resource types grouped by category
- Search, drag-and-drop, and double-click-to-add
- Connect resources with directional smooth-step links
- Edit name, environment, Azure region, SKU, owner and description
- Duplicate and delete selected resources
- Keyboard shortcuts: Delete/Backspace, Ctrl/Cmd+S, Esc
- Named designs with saved/unsaved status
- Save/load in browser, JSON import/export
- Starter 3-tier Azure architecture template
- Fit view, zoom, pan, minimap and grid snapping
- GitHub Pages deployment workflow included

## Run
```bash
npm ci
npm run dev
```

## Production test
```bash
npm run build
```

Push the repository to GitHub. The included GitHub Actions workflow builds and deploys to GitHub Pages.


## Azure architecture icons

Version 3 displays Azure service icon artwork in the resource library and on canvas nodes. The application keeps a built-in Lucide fallback so the designer remains usable if an external icon cannot be loaded. Microsoft permits its Azure architecture icons for architecture diagrams, training materials, and documentation subject to Microsoft's icon terms.
