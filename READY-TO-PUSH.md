# ArchMindCanvas v7.4.1 — Design + Global Variables Build Fix

Fixes the production TypeScript error in App.tsx:

`Type 'string | Element' is not assignable to type 'string | undefined'`

Cause:
Design Variables content was accidentally placed inside the Deploy button's `className`.

Fixed structure:
- Properties tab
- Variables tab (Design scope)
- AI
- Validate
- IaC
- Deploy
- Global Vars remains in the main toolbar

Push:

```powershell
git add .
git commit -m "ArchMindCanvas v7.4.1 - fix variables tab production build"
git push origin main
```
