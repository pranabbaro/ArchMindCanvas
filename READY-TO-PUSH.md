# ArchMindCanvas v7.3.5 — Variables Manager Build Fix

This fixes the GitHub production build error in `src/App.tsx`.

## Push

```powershell
git add .
git commit -m "ArchMindCanvas v7.3.5 - fix Variables Manager production build"
git push origin main
```

Fix:
- Deploy tab `className` is again a string-only expression.
- Variables Manager remains available as its own inspector tab.
- No Variables Manager features were removed.
